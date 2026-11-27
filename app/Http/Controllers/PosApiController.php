<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\IndonesiaProductCatalog;
use App\Models\OperationalExpense;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\ReceivablePayment;
use App\Models\Sale;
use App\Models\StoreSetting;
use App\Models\Supplier;
use App\Services\ProductLookupService;
use App\Services\ProfitLossReportService;
use App\Services\WhatsAppReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PosApiController extends Controller
{
    /**
     * Ambil semua data awal untuk aplikasi React POS (Initial Bootstrap Data)
     */
    public function bootstrap(ProfitLossReportService $reportService): JsonResponse
    {
        $startOfMonth = now()->startOfMonth()->toDateString();
        $today = now()->toDateString();

        return response()->json([
            'products' => Product::with(['category', 'supplier'])->orderBy('name')->get(),
            'categories' => Category::orderBy('name')->get(),
            'suppliers' => Supplier::withCount('products')->orderBy('name')->get(),
            'customers' => Customer::orderBy('name')->get(),
            'catalog_count' => IndonesiaProductCatalog::count(),
            'catalog_samples' => IndonesiaProductCatalog::orderBy('name')->limit(100)->get(),
            'recent_sales' => Sale::with(['items', 'customer', 'payments'])->latest()->limit(50)->get(),
            'receivable_sales' => Sale::with(['items', 'customer', 'payments'])
                ->where('remaining_debt', '>', 0)
                ->orderBy('due_date')
                ->get(),
            'purchases' => Purchase::with(['supplier', 'items.product'])->latest()->limit(30)->get(),
            'profit_loss' => $reportService->generate($startOfMonth, $today),
            'settings' => StoreSetting::pluck('value', 'key'),
        ]);
    }

    /**
     * Scan Barcode Lookup: Cek stok toko -> Cek Katalog API Produk Indonesia -> Fallback Cloud
     */
    public function lookupBarcode(Request $request, ProductLookupService $lookupService): JsonResponse
    {
        $barcode = trim((string) $request->query('barcode', ''));
        if ($barcode === '') {
            return response()->json(['error' => 'Barcode wajib diisi'], 422);
        }

        return response()->json($lookupService->lookupByBarcode($barcode));
    }

    /**
     * Cari Katalog Produk Indonesia (ariph007/api-product-indonesia) berdasarkan kata kunci atau barcode
     */
    public function searchIndonesiaCatalog(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $items = IndonesiaProductCatalog::query()
            ->when($q, fn ($query) => $query->where('name', 'like', "%{$q}%")
                ->orWhere('barcode', 'like', "%{$q}%")
                ->orWhere('brand', 'like', "%{$q}%"))
            ->limit(40)
            ->get();

        return response()->json(['items' => $items]);
    }

    /**
     * Simpan Produk Baru / Tambah Stok via Scan Barcode + Kalkulasi Markup (% atau Nominal)
     */
    public function storeOrRestockProduct(Request $request): JsonResponse
    {
        $data = $request->validate([
            'barcode' => 'required|string|max:64',
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer',
            'new_category_name' => 'nullable|string|max:100',
            'supplier_id' => 'nullable|integer',
            'base_unit' => 'required|string|max:20',
            'cost_price' => 'required|numeric|min:0',
            'markup_type' => 'required|in:percentage,nominal',
            'markup_value' => 'required|numeric|min:0',
            'auto_round' => 'boolean',
            'selling_price' => 'required|numeric|min:0',
            'wholesale_min_qty' => 'nullable|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'stock_input' => 'required|numeric',
            'stock_mode' => 'nullable|in:add,set', // 'add' = tambah stok masuk, 'set' = set stok opname
            'min_stock_alert' => 'nullable|numeric|min:0',
            'nearest_expiry_date' => 'nullable|date',
        ]);

        $product = DB::transaction(function () use ($data) {
            $categoryId = $data['category_id'] ?? null;
            if (!empty($data['new_category_name'])) {
                $cat = Category::firstOrCreate(
                    ['slug' => Str::slug($data['new_category_name'])],
                    ['name' => $data['new_category_name']]
                );
                $categoryId = $cat->id;
            }

            $existing = Product::where('barcode', $data['barcode'])->lockForUpdate()->first();
            $mode = $data['stock_mode'] ?? 'add';

            if ($existing) {
                $newStock = $mode === 'add'
                    ? $existing->stock + (float) $data['stock_input']
                    : (float) $data['stock_input'];

                // Moving average HPP jika ada penambahan stok baru
                $newCost = (float) $data['cost_price'];
                if ($mode === 'add' && $data['stock_input'] > 0 && $existing->stock > 0) {
                    $newCost = (($existing->stock * $existing->cost_price) + ($data['stock_input'] * $data['cost_price'])) / max(1, $newStock);
                }

                $existing->update([
                    'name' => $data['name'],
                    'category_id' => $categoryId ?: $existing->category_id,
                    'supplier_id' => $data['supplier_id'] ?: $existing->supplier_id,
                    'base_unit' => strtoupper($data['base_unit']),
                    'cost_price' => round($newCost, 2),
                    'markup_type' => $data['markup_type'],
                    'markup_value' => $data['markup_value'],
                    'auto_round' => $data['auto_round'] ?? true,
                    'selling_price' => $data['selling_price'],
                    'wholesale_min_qty' => $data['wholesale_min_qty'] ?? $existing->wholesale_min_qty,
                    'wholesale_price' => $data['wholesale_price'] ?? $existing->wholesale_price,
                    'stock' => $newStock,
                    'min_stock_alert' => $data['min_stock_alert'] ?? $existing->min_stock_alert,
                    'nearest_expiry_date' => $data['nearest_expiry_date'] ?: $existing->nearest_expiry_date,
                ]);
                $product = $existing;
            } else {
                $product = Product::create([
                    'barcode' => $data['barcode'],
                    'sku' => 'SKU-' . substr(preg_replace('/[^0-9A-Za-z]/', '', $data['barcode']), -6),
                    'name' => $data['name'],
                    'category_id' => $categoryId,
                    'supplier_id' => $data['supplier_id'] ?? null,
                    'base_unit' => strtoupper($data['base_unit']),
                    'cost_price' => $data['cost_price'],
                    'markup_type' => $data['markup_type'],
                    'markup_value' => $data['markup_value'],
                    'auto_round' => $data['auto_round'] ?? true,
                    'selling_price' => $data['selling_price'],
                    'wholesale_min_qty' => $data['wholesale_min_qty'] ?? null,
                    'wholesale_price' => $data['wholesale_price'] ?? null,
                    'stock' => $data['stock_input'],
                    'min_stock_alert' => $data['min_stock_alert'] ?? 5,
                    'nearest_expiry_date' => $data['nearest_expiry_date'] ?? null,
                ]);
            }

            // Sinkronkan juga ke tabel referensi IndonesiaProductCatalog
            IndonesiaProductCatalog::updateOrCreate(
                ['barcode' => $product->barcode],
                [
                    'name' => $product->name,
                    'unit' => $product->base_unit,
                    'reference_price' => $product->cost_price,
                ]
            );

            return $product->load(['category', 'supplier']);
        });

        return response()->json([
            'message' => "Produk '{$product->name}' berhasil disimpan (Stok: {$product->stock} {$product->base_unit})!",
            'product' => $product,
        ]);
    }

    /**
     * Hapus Produk dari Inventaris
     */
    public function deleteProduct(Product $product): JsonResponse
    {
        $name = $product->name;
        $product->delete();

        return response()->json([
            'message' => "Produk '{$name}' berhasil dihapus dari inventaris.",
        ]);
    }

    /**
     * Edit Masal (Bulk Update):
     * 1. Update masal berdasarkan formula Markup (% atau Nominal) untuk ID terpilih
     * 2. Atau simpan perubahan inline spreadsheet (Harga Beli, Markup, Harga Jual, Stok, Supplier) sekaligus
     */
    public function bulkUpdateProducts(Request $request): JsonResponse
    {
        $mode = $request->input('mode', 'inline'); // 'markup_formula' | 'inline' | 'adjust_price'

        DB::transaction(function () use ($request, $mode) {
            if ($mode === 'markup_formula') {
                $ids = $request->input('product_ids', []);
                $markupType = $request->input('markup_type', 'percentage');
                $markupValue = (float) $request->input('markup_value', 15);
                $autoRound = (bool) $request->input('auto_round', true);
                $supplierId = $request->input('supplier_id');
                $categoryId = $request->input('category_id');

                $products = Product::whereIn('id', $ids)->lockForUpdate()->get();
                foreach ($products as $p) {
                    $newSelling = ProductLookupService::calculateSellingPrice(
                        (float) $p->cost_price,
                        $markupType,
                        $markupValue,
                        $autoRound
                    );

                    $updateData = [
                        'markup_type' => $markupType,
                        'markup_value' => $markupValue,
                        'auto_round' => $autoRound,
                        'selling_price' => $newSelling,
                    ];
                    if ($supplierId) $updateData['supplier_id'] = $supplierId;
                    if ($categoryId) $updateData['category_id'] = $categoryId;

                    $p->update($updateData);
                }
            } elseif ($mode === 'adjust_cost_or_selling') {
                // Naikkan / turunkan Harga Beli atau Harga Jual masal (% atau Rp)
                $ids = $request->input('product_ids', []);
                $targetField = $request->input('target_field', 'selling_price'); // 'cost_price' | 'selling_price'
                $adjustType = $request->input('adjust_type', 'percentage'); // 'percentage' | 'nominal'
                $adjustValue = (float) $request->input('adjust_value', 0); // bisa positif (naik) atau negatif (turun)
                $recalculateMarkup = (bool) $request->input('recalculate_selling', true);

                $products = Product::whereIn('id', $ids)->lockForUpdate()->get();
                foreach ($products as $p) {
                    $baseVal = (float) $p->{$targetField};
                    $delta = $adjustType === 'percentage' ? ($baseVal * ($adjustValue / 100)) : $adjustValue;
                    $newVal = max(0, round($baseVal + $delta, 2));

                    if ($targetField === 'cost_price') {
                        $selling = $recalculateMarkup
                            ? ProductLookupService::calculateSellingPrice($newVal, $p->markup_type, (float) $p->markup_value, $p->auto_round)
                            : $p->selling_price;
                        $p->update([
                            'cost_price' => $newVal,
                            'selling_price' => $selling,
                        ]);
                    } else {
                        $newSelling = $p->auto_round ? ceil($newVal / 100) * 100 : $newVal;
                        $p->update([
                            'selling_price' => $newSelling,
                            'markup_type' => 'nominal',
                            'markup_value' => max(0, $newSelling - $p->cost_price),
                        ]);
                    }
                }
            } else {
                // Mode Inline Table Spreadsheet Edit Masal
                $items = $request->input('items', []);
                foreach ($items as $row) {
                    $p = Product::find($row['id'] ?? null);
                    if (!$p) continue;

                    $costPrice = isset($row['cost_price']) ? (float) $row['cost_price'] : (float) $p->cost_price;
                    $markupType = $row['markup_type'] ?? $p->markup_type;
                    $markupValue = isset($row['markup_value']) ? (float) $row['markup_value'] : (float) $p->markup_value;
                    $autoRound = isset($row['auto_round']) ? (bool) $row['auto_round'] : (bool) $p->auto_round;

                    $sellingPrice = isset($row['selling_price'])
                        ? (float) $row['selling_price']
                        : ProductLookupService::calculateSellingPrice($costPrice, $markupType, $markupValue, $autoRound);

                    $p->update([
                        'name' => $row['name'] ?? $p->name,
                        'barcode' => $row['barcode'] ?? $p->barcode,
                        'base_unit' => $row['base_unit'] ?? $p->base_unit,
                        'category_id' => $row['category_id'] ?? $p->category_id,
                        'supplier_id' => $row['supplier_id'] ?? $p->supplier_id,
                        'cost_price' => $costPrice,
                        'markup_type' => $markupType,
                        'markup_value' => $markupValue,
                        'auto_round' => $autoRound,
                        'selling_price' => $sellingPrice,
                        'wholesale_min_qty' => $row['wholesale_min_qty'] ?? $p->wholesale_min_qty,
                        'wholesale_price' => $row['wholesale_price'] ?? $p->wholesale_price,
                        'stock' => isset($row['stock']) ? (float) $row['stock'] : $p->stock,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Perubahan data produk masal berhasil disimpan!',
            'products' => Product::with(['category', 'supplier'])->orderBy('name')->get(),
        ]);
    }

    /**
     * Checkout Kasir POS (Tunai, QRIS, Transfer, & Piutang/Kasbon + Kirim Bon ke WhatsApp)
     */
    public function checkout(Request $request, WhatsAppReceiptService $waService): JsonResponse
    {
        $data = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,qris,transfer,debt',
            'paid_amount' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'new_customer_name' => 'nullable|string|max:120',
            'customer_whatsapp' => 'nullable|string|max:30',
            'due_date' => 'nullable|date',
            'send_wa' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $result = DB::transaction(function () use ($data, $waService) {
            $customer = null;
            if (!empty($data['customer_id'])) {
                $customer = Customer::lockForUpdate()->find($data['customer_id']);
            } elseif (!empty($data['new_customer_name'])) {
                $customer = Customer::create([
                    'name' => $data['new_customer_name'],
                    'whatsapp' => $data['customer_whatsapp'] ?? null,
                    'credit_limit' => 2000000,
                    'current_receivable' => 0,
                ]);
            }

            $subtotal = 0;
            $totalCost = 0;
            $preparedItems = [];

            foreach ($data['items'] as $row) {
                $product = Product::lockForUpdate()->findOrFail($row['product_id']);
                $qty = (float) $row['qty'];
                $unitPrice = (float) $row['unit_price'];
                $itemSubtotal = $qty * $unitPrice;
                $itemCost = $qty * (float) $product->cost_price;

                $subtotal += $itemSubtotal;
                $totalCost += $itemCost;

                $preparedItems[] = [
                    'product_id' => $product->id,
                    'barcode' => $product->barcode,
                    'product_name' => $product->name,
                    'unit_name' => $product->base_unit,
                    'qty' => $qty,
                    'cost_price' => $product->cost_price,
                    'unit_price' => $unitPrice,
                    'subtotal' => $itemSubtotal,
                ];

                // Kurangi stok
                $product->decrement('stock', $qty);
            }

            $discount = (float) ($data['discount_amount'] ?? 0);
            $grandTotal = max(0, $subtotal - $discount);
            $paidAmount = (float) $data['paid_amount'];

            // Jika kasbon/piutang atau bayar kurang dari grandTotal
            $remainingDebt = max(0, $grandTotal - $paidAmount);
            $changeAmount = max(0, $paidAmount - $grandTotal);

            if ($remainingDebt > 0 && !$customer) {
                abort(422, 'Transaksi Piutang / Kasbon wajib memilih Pelanggan atau mengisi Nama Pelanggan Baru!');
            }

            $paymentStatus = match (true) {
                $remainingDebt <= 0 => 'paid',
                $paidAmount > 0 => 'partial',
                default => 'unpaid',
            };

            $waNumber = $data['customer_whatsapp'] ?: ($customer?->whatsapp ?? '');
            if ($customer && $waNumber && empty($customer->whatsapp)) {
                $customer->update(['whatsapp' => $waNumber]);
            }

            $countToday = Sale::whereDate('created_at', today())->count() + 1;
            $invoiceNo = 'INV-' . now()->format('Ymd') . '-' . str_pad((string) $countToday, 4, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'invoice_number' => $invoiceNo,
                'receipt_token' => Str::random(32),
                'cashier_name' => 'Kasir Utama',
                'customer_id' => $customer?->id,
                'customer_name' => $customer?->name,
                'customer_whatsapp' => $waNumber,
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'tax_amount' => 0,
                'grand_total' => $grandTotal,
                'total_cost' => $totalCost,
                'payment_method' => $remainingDebt > 0 ? 'debt' : $data['payment_method'],
                'payment_status' => $paymentStatus,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'remaining_debt' => $remainingDebt,
                'due_date' => $remainingDebt > 0 ? ($data['due_date'] ?? now()->addDays(7)->toDateString()) : null,
                'notes' => $data['notes'] ?? null,
            ]);

            $sale->items()->createMany($preparedItems);

            if ($remainingDebt > 0 && $customer) {
                $customer->increment('current_receivable', $remainingDebt);
            }

            $sale->load(['items', 'customer']);
            $waPayload = $waService->sendReceipt($sale, $waNumber);

            return [
                'sale' => $sale,
                'whatsapp' => $waPayload,
            ];
        });

        return response()->json([
            'message' => "Transaksi {$result['sale']->invoice_number} berhasil disimpan!",
            'sale' => $result['sale'],
            'whatsapp' => $result['whatsapp'],
        ]);
    }

    /**
     * Kirim Ulang Bon / Tagihan Piutang ke WhatsApp Pelanggan
     */
    public function sendWhatsAppReceipt(Request $request, Sale $sale, WhatsAppReceiptService $waService): JsonResponse
    {
        $phone = $request->input('whatsapp', $sale->customer_whatsapp);
        $payload = $waService->sendReceipt($sale, $phone);

        return response()->json([
            'message' => $payload['message'],
            'whatsapp' => $payload,
        ]);
    }

    /**
     * Pembayaran Cicilan / Pelunasan Piutang Pelanggan
     */
    public function payReceivable(Request $request, Sale $sale, WhatsAppReceiptService $waService): JsonResponse
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $updatedSale = DB::transaction(function () use ($sale, $data) {
            $sale = Sale::lockForUpdate()->findOrFail($sale->id);
            $payAmount = min((float) $data['amount'], (float) $sale->remaining_debt);

            ReceivablePayment::create([
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'amount' => $payAmount,
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? 'Cicilan / Pelunasan Piutang',
            ]);

            $newRemaining = max(0, $sale->remaining_debt - $payAmount);
            $newPaid = $sale->paid_amount + $payAmount;

            $sale->update([
                'paid_amount' => $newPaid,
                'remaining_debt' => $newRemaining,
                'payment_status' => $newRemaining <= 0 ? 'paid' : 'partial',
            ]);

            if ($sale->customer_id) {
                $customer = Customer::lockForUpdate()->find($sale->customer_id);
                if ($customer) {
                    $customer->update([
                        'current_receivable' => max(0, $customer->current_receivable - $payAmount),
                    ]);
                }
            }

            return $sale->load(['items', 'customer', 'payments']);
        });

        $waPayload = $waService->sendReceipt($updatedSale);

        return response()->json([
            'message' => 'Pembayaran piutang berhasil dicatat!',
            'sale' => $updatedSale,
            'whatsapp' => $waPayload,
        ]);
    }

    /**
     * CRUD Supplier & Pembelian / Restock Supplier
     */
    public function storeSupplier(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'nullable|integer',
            'name' => 'required|string|max:255',
            'sales_name' => 'nullable|string|max:120',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'top_days' => 'nullable|integer|min:0',
        ]);

        if (!empty($data['id'])) {
            $supplier = Supplier::findOrFail($data['id']);
            $supplier->update($data);
        } else {
            $data['code'] = 'SUP-' . str_pad((string) (Supplier::count() + 1), 3, '0', STR_PAD_LEFT);
            $supplier = Supplier::create($data);
        }

        return response()->json([
            'message' => 'Data supplier berhasil disimpan!',
            'supplier' => $supplier->loadCount('products'),
        ]);
    }

    /**
     * CRUD Pelanggan
     */
    public function storeCustomer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'nullable|integer',
            'name' => 'required|string|max:255',
            'whatsapp' => 'nullable|string|max:30',
            'address' => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        if (!empty($data['id'])) {
            $customer = Customer::findOrFail($data['id']);
            $customer->update($data);
        } else {
            $customer = Customer::create($data);
        }

        return response()->json([
            'message' => 'Data pelanggan berhasil disimpan!',
            'customer' => $customer,
        ]);
    }

    /**
     * Laporan Laba Rugi (Filter Tanggal) & Input Biaya Operasional
     */
    public function profitLossReport(Request $request, ProfitLossReportService $reportService): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        return response()->json($reportService->generate($startDate, $endDate));
    }

    public function storeExpense(Request $request, ProfitLossReportService $reportService): JsonResponse
    {
        $data = $request->validate([
            'category' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'expense_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        OperationalExpense::create($data);

        return response()->json([
            'message' => 'Biaya operasional berhasil dicatat!',
            'profit_loss' => $reportService->generate(
                now()->startOfMonth()->toDateString(),
                now()->toDateString()
            ),
        ]);
    }

    public function saveSettings(Request $request): JsonResponse
    {
        $settings = $request->input('settings', []);
        foreach ($settings as $key => $val) {
            StoreSetting::setVal($key, $val);
        }

        return response()->json([
            'message' => 'Pengaturan toko & WhatsApp Gateway berhasil disimpan!',
            'settings' => StoreSetting::pluck('value', 'key'),
        ]);
    }

    /**
     * Halaman Struk Digital Publik (Yang dikirimkan link-nya ke WhatsApp Pelanggan)
     */
    public function publicReceipt(string $token)
    {
        $sale = Sale::with(['items', 'customer', 'payments'])
            ->where('receipt_token', $token)
            ->firstOrFail();

        $settings = StoreSetting::pluck('value', 'key');

        return view('receipt', compact('sale', 'settings'));
    }
}
