<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\IndonesiaProductCatalog;
use App\Models\OperationalExpense;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockOpname;
use App\Models\StoreSetting;
use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Default Store Settings
        $settings = [
            'store_name' => 'WARKAS MART & GROSIR',
            'store_address' => 'Jl. Merdeka Raya No. 88, Jakarta Selatan',
            'store_phone' => '0812-3456-7890',
            'wa_gateway_url' => 'https://api.fonnte.com/send',
            'wa_gateway_token' => '',
            'receipt_footer' => 'Terima kasih telah berbelanja di Warkas Mart! Barang yang sudah dibeli tidak dapat ditukar.',
        ];
        foreach ($settings as $k => $v) {
            StoreSetting::setVal($k, $v);
        }

        // 2. Kategori Produk
        $categoriesData = [
            'Sembako & Bahan Pokok',
            'Mie Instan & Makanan',
            'Minuman & Susu',
            'Kopi, Teh & Sachet',
            'Snack & Biskuit',
            'Bumbu & Dapur',
            'Sabun, Deterjen & Toiletries',
            'Obat & Kesehatan',
            'Rokok & Tembakau',
        ];
        $categoryMap = [];
        foreach ($categoriesData as $catName) {
            $cat = Category::firstOrCreate(
                ['slug' => Str::slug($catName)],
                ['name' => $catName]
            );
            $categoryMap[$catName] = $cat->id;
        }

        // 3. Database Supplier
        $suppliersData = [
            [
                'code' => 'SUP-001',
                'name' => 'PT Indomarco Adi Prima (Indofood)',
                'sales_name' => 'Budi Santoso',
                'phone' => '081288990011',
                'address' => 'Kawasan Industri Pulogadung, Jakarta',
                'top_days' => 14,
                'total_payable' => 1250000,
            ],
            [
                'code' => 'SUP-002',
                'name' => 'PT Tirta Investama (Danone Aqua & Minuman)',
                'sales_name' => 'Andi Pratama',
                'phone' => '081377665544',
                'address' => 'Jl. Raya Bekasi Km 21, Jakarta Timur',
                'top_days' => 7,
                'total_payable' => 0,
            ],
            [
                'code' => 'SUP-003',
                'name' => 'PT Unilever Indonesia Distribusi',
                'sales_name' => 'Siti Rahma',
                'phone' => '081599887766',
                'address' => 'BSD Green Office Park, Tangerang',
                'top_days' => 30,
                'total_payable' => 2400000,
            ],
            [
                'code' => 'SUP-004',
                'name' => 'CV Sumber Sembako Nusantara',
                'sales_name' => 'H. Hendra Wijaya',
                'phone' => '081122334455',
                'address' => 'Pasar Induk Kramat Jati Blok C-12',
                'top_days' => 14,
                'total_payable' => 850000,
            ],
        ];
        $suppliers = [];
        foreach ($suppliersData as $s) {
            $suppliers[] = Supplier::updateOrCreate(['code' => $s['code']], $s);
        }

        // 4. Katalog Produk Indonesia (Dataset Referensi ariph007/api-product-indonesia)
        $catalogItems = [
            ['barcode' => '089686010947', 'name' => 'Indomie Mi Goreng Spesial 85g', 'category' => 'Mie Instan & Makanan', 'brand' => 'Indomie', 'unit' => 'PCS', 'reference_price' => 2800],
            ['barcode' => '089686060263', 'name' => 'Indomie Rasa Ayam Bawang 69g', 'category' => 'Mie Instan & Makanan', 'brand' => 'Indomie', 'unit' => 'PCS', 'reference_price' => 2700],
            ['barcode' => '089686040234', 'name' => 'Indomie Rasa Soto Mie 70g', 'category' => 'Mie Instan & Makanan', 'brand' => 'Indomie', 'unit' => 'PCS', 'reference_price' => 2700],
            ['barcode' => '8998866200318', 'name' => 'Mie Sedaap Goreng 90g', 'category' => 'Mie Instan & Makanan', 'brand' => 'Mie Sedaap', 'unit' => 'PCS', 'reference_price' => 2700],
            ['barcode' => '8886008101053', 'name' => 'Aqua Air Mineral 600ml', 'category' => 'Minuman & Susu', 'brand' => 'Aqua', 'unit' => 'BTL', 'reference_price' => 2400],
            ['barcode' => '8886008101091', 'name' => 'Aqua Air Mineral 1500ml', 'category' => 'Minuman & Susu', 'brand' => 'Aqua', 'unit' => 'BTL', 'reference_price' => 4800],
            ['barcode' => '8996001600146', 'name' => 'Le Minerale Air Mineral 600ml', 'category' => 'Minuman & Susu', 'brand' => 'Le Minerale', 'unit' => 'BTL', 'reference_price' => 2300],
            ['barcode' => '8996006854904', 'name' => 'Teh Botol Sosro Kotak 250ml', 'category' => 'Minuman & Susu', 'brand' => 'Sosro', 'unit' => 'PCS', 'reference_price' => 3100],
            ['barcode' => '8997035600249', 'name' => 'Teh Pucuk Harum Melati 350ml', 'category' => 'Minuman & Susu', 'brand' => 'Mayora', 'unit' => 'BTL', 'reference_price' => 2900],
            ['barcode' => '8998009010217', 'name' => 'Ultra Milk UHT Coklat 250ml', 'category' => 'Minuman & Susu', 'brand' => 'Ultrajaya', 'unit' => 'PCS', 'reference_price' => 5400],
            ['barcode' => '8992696404441', 'name' => 'Bear Brand Susu Steril 189ml', 'category' => 'Minuman & Susu', 'brand' => 'Nestle', 'unit' => 'KLG', 'reference_price' => 9200],
            ['barcode' => '4987035131410', 'name' => 'Pocari Sweat Isotonik 500ml', 'category' => 'Minuman & Susu', 'brand' => 'Otsuka', 'unit' => 'BTL', 'reference_price' => 6100],
            ['barcode' => '8991002105423', 'name' => 'Kopi Kapal Api Special Mix 25g (Renceng 10s)', 'category' => 'Kopi, Teh & Sachet', 'brand' => 'Kapal Api', 'unit' => 'RCG', 'reference_price' => 13200],
            ['barcode' => '8992696411227', 'name' => 'Nescafe Classic Sachet 2g (Renceng 10s)', 'category' => 'Kopi, Teh & Sachet', 'brand' => 'Nestle', 'unit' => 'RCG', 'reference_price' => 8500],
            ['barcode' => '8999999025410', 'name' => 'SariWangi Teh Celup Asli 25 Kantong', 'category' => 'Kopi, Teh & Sachet', 'brand' => 'Unilever', 'unit' => 'BOX', 'reference_price' => 5800],
            ['barcode' => '8992759233025', 'name' => 'Bimoli Minyak Goreng Klasik Pouch 2 Liter', 'category' => 'Sembako & Bahan Pokok', 'brand' => 'Bimoli', 'unit' => 'PCH', 'reference_price' => 34500],
            ['barcode' => '8992775001127', 'name' => 'Tropical Minyak Goreng Botol 1 Liter', 'category' => 'Sembako & Bahan Pokok', 'brand' => 'Tropical', 'unit' => 'BTL', 'reference_price' => 17800],
            ['barcode' => '8995177101014', 'name' => 'Gulaku Gula Pasir Premium 1 Kg', 'category' => 'Sembako & Bahan Pokok', 'brand' => 'Gulaku', 'unit' => 'BKS', 'reference_price' => 16500],
            ['barcode' => '8992745110118', 'name' => 'Segitiga Biru Tepung Terigu 1 Kg', 'category' => 'Sembako & Bahan Pokok', 'brand' => 'Bogasari', 'unit' => 'BKS', 'reference_price' => 11800],
            ['barcode' => '8993175536523', 'name' => 'Beras Ramos Pandan Wangi Premium 5 Kg', 'category' => 'Sembako & Bahan Pokok', 'brand' => 'Food Station', 'unit' => 'SAK', 'reference_price' => 69500],
            ['barcode' => '8999999028923', 'name' => 'Kecap Bango Manis Pouch 520ml', 'category' => 'Bumbu & Dapur', 'brand' => 'Unilever', 'unit' => 'PCH', 'reference_price' => 21000],
            ['barcode' => '0711844110052', 'name' => 'ABC Sambal Asli Botol 335ml', 'category' => 'Bumbu & Dapur', 'brand' => 'Heinz ABC', 'unit' => 'BTL', 'reference_price' => 13800],
            ['barcode' => '8999999502300', 'name' => 'Royco Kaldu Ayam 230g', 'category' => 'Bumbu & Dapur', 'brand' => 'Unilever', 'unit' => 'BKS', 'reference_price' => 8200],
            ['barcode' => '8999999044121', 'name' => 'Sunlight Pencuci Piring Jeruk Nipis 650ml', 'category' => 'Sabun, Deterjen & Toiletries', 'brand' => 'Unilever', 'unit' => 'PCH', 'reference_price' => 11500],
            ['barcode' => '8999999036614', 'name' => 'Rinso Anti Noda Deterjen Bubuk 770g', 'category' => 'Sabun, Deterjen & Toiletries', 'brand' => 'Unilever', 'unit' => 'BKS', 'reference_price' => 19500],
            ['barcode' => '8999999053154', 'name' => 'Pepsodent Pasta Gigi Pencegah Gigi Berlubang 190g', 'category' => 'Sabun, Deterjen & Toiletries', 'brand' => 'Unilever', 'unit' => 'PCS', 'reference_price' => 11200],
            ['barcode' => '8999999003708', 'name' => 'Lifebuoy Sabun Cair Total 10 Pouch 400ml', 'category' => 'Sabun, Deterjen & Toiletries', 'brand' => 'Unilever', 'unit' => 'PCH', 'reference_price' => 18500],
            ['barcode' => '8991001500021', 'name' => 'SilverQueen Milk Chocolate Cashew 58g', 'category' => 'Snack & Biskuit', 'brand' => 'Ceres', 'unit' => 'PCS', 'reference_price' => 12200],
            ['barcode' => '089686598018', 'name' => 'Chitato Sapi Panggang 68g', 'category' => 'Snack & Biskuit', 'brand' => 'Indofood', 'unit' => 'BKS', 'reference_price' => 9400],
            ['barcode' => '8996001300114', 'name' => 'Roma Kelapa Biskuit 300g', 'category' => 'Snack & Biskuit', 'brand' => 'Mayora', 'unit' => 'BKS', 'reference_price' => 8800],
            ['barcode' => '8998898111125', 'name' => 'Tolak Angin Cair Sido Muncul Box 12 Sachet', 'category' => 'Obat & Kesehatan', 'brand' => 'Sido Muncul', 'unit' => 'BOX', 'reference_price' => 41000],
            ['barcode' => '8998989100120', 'name' => 'Gudang Garam Surya 16 Batang', 'category' => 'Rokok & Tembakau', 'brand' => 'Gudang Garam', 'unit' => 'BKS', 'reference_price' => 31500],
            ['barcode' => '8999909003018', 'name' => 'Sampoerna Mild A-Mild 16 Batang', 'category' => 'Rokok & Tembakau', 'brand' => 'Sampoerna', 'unit' => 'BKS', 'reference_price' => 32000],
        ];

        foreach ($catalogItems as $item) {
            IndonesiaProductCatalog::updateOrCreate(
                ['barcode' => $item['barcode']],
                $item
            );
        }

        // Seed total 50.600 data katalog produk Indonesia ke PostgreSQL
        $this->call(IndonesiaCatalogSeeder::class);

        // 5. Seed sebagian produk ke inventaris aktif toko (Sisanya bisa ditest lewat fitur Scan Barcode Baru!)
        $initialInventory = [
            ['barcode' => '089686010947', 'markup_type' => 'nominal', 'markup_value' => 700, 'stock' => 140, 'wholesale_min_qty' => 40, 'wholesale_price' => 3200, 'sup_idx' => 0],
            ['barcode' => '8886008101053', 'markup_type' => 'nominal', 'markup_value' => 1100, 'stock' => 96, 'wholesale_min_qty' => 24, 'wholesale_price' => 2900, 'sup_idx' => 1],
            ['barcode' => '8996006854904', 'markup_type' => 'percentage', 'markup_value' => 25, 'stock' => 72, 'wholesale_min_qty' => 24, 'wholesale_price' => 3500, 'sup_idx' => 1],
            ['barcode' => '8998009010217', 'markup_type' => 'percentage', 'markup_value' => 20, 'stock' => 48, 'wholesale_min_qty' => 12, 'wholesale_price' => 6000, 'sup_idx' => 1],
            ['barcode' => '8992696404441', 'markup_type' => 'nominal', 'markup_value' => 1800, 'stock' => 60, 'wholesale_min_qty' => 12, 'wholesale_price' => 10300, 'sup_idx' => 1],
            ['barcode' => '8991002105423', 'markup_type' => 'nominal', 'markup_value' => 2300, 'stock' => 35, 'wholesale_min_qty' => 10, 'wholesale_price' => 14500, 'sup_idx' => 0],
            ['barcode' => '8992759233025', 'markup_type' => 'percentage', 'markup_value' => 10, 'stock' => 28, 'wholesale_min_qty' => 6, 'wholesale_price' => 36500, 'sup_idx' => 3],
            ['barcode' => '8995177101014', 'markup_type' => 'nominal', 'markup_value' => 1500, 'stock' => 50, 'wholesale_min_qty' => 10, 'wholesale_price' => 17300, 'sup_idx' => 3],
            ['barcode' => '8993175536523', 'markup_type' => 'nominal', 'markup_value' => 5500, 'stock' => 20, 'wholesale_min_qty' => 5, 'wholesale_price' => 73000, 'sup_idx' => 3],
            ['barcode' => '8999999028923', 'markup_type' => 'percentage', 'markup_value' => 15, 'stock' => 32, 'wholesale_min_qty' => 6, 'wholesale_price' => 22800, 'sup_idx' => 2],
            ['barcode' => '8999999044121', 'markup_type' => 'percentage', 'markup_value' => 20, 'stock' => 45, 'wholesale_min_qty' => 12, 'wholesale_price' => 12800, 'sup_idx' => 2],
            ['barcode' => '8999999036614', 'markup_type' => 'percentage', 'markup_value' => 18, 'stock' => 4, 'wholesale_min_qty' => 6, 'wholesale_price' => 21500, 'sup_idx' => 2], // Low stock alert
            ['barcode' => '8998989100120', 'markup_type' => 'nominal', 'markup_value' => 2500, 'stock' => 40, 'wholesale_min_qty' => 10, 'wholesale_price' => 33000, 'sup_idx' => 0],
        ];

        $seededProducts = [];
        foreach ($initialInventory as $inv) {
            $catRef = collect($catalogItems)->firstWhere('barcode', $inv['barcode']);
            if (!$catRef) continue;

            $cost = $catRef['reference_price'];
            $rawSelling = $inv['markup_type'] === 'percentage'
                ? $cost + ($cost * ($inv['markup_value'] / 100))
                : $cost + $inv['markup_value'];
            $selling = ceil($rawSelling / 100) * 100;

            $seededProducts[] = Product::updateOrCreate(
                ['barcode' => $inv['barcode']],
                [
                    'sku' => 'SKU-' . substr($inv['barcode'], -6),
                    'name' => $catRef['name'],
                    'category_id' => $categoryMap[$catRef['category']] ?? null,
                    'supplier_id' => $suppliers[$inv['sup_idx']]->id,
                    'base_unit' => $catRef['unit'],
                    'cost_price' => $cost,
                    'markup_type' => $inv['markup_type'],
                    'markup_value' => $inv['markup_value'],
                    'auto_round' => true,
                    'selling_price' => $selling,
                    'wholesale_min_qty' => $inv['wholesale_min_qty'],
                    'wholesale_price' => $inv['wholesale_price'],
                    'stock' => $inv['stock'],
                    'min_stock_alert' => 10,
                    'nearest_expiry_date' => now()->addMonths(rand(4, 14))->toDateString(),
                ]
            );
        }

        // 6. Data Pelanggan & Piutang
        $customers = [
            Customer::updateOrCreate(['whatsapp' => '081234567801'], [
                'name' => 'Warung Bu Hj. Siti',
                'address' => 'Jl. Melati No. 12 RT 04/02',
                'credit_limit' => 2500000,
                'current_receivable' => 185000,
            ]),
            Customer::updateOrCreate(['whatsapp' => '081398765432'], [
                'name' => 'Warkop Bang Jago',
                'address' => 'Pertokoan Pasar Minggu Blok A3',
                'credit_limit' => 5000000,
                'current_receivable' => 340000,
            ]),
            Customer::updateOrCreate(['whatsapp' => '085711223344'], [
                'name' => 'Kantin Sekolah Harapan',
                'address' => 'Jl. Pendidikan No. 45',
                'credit_limit' => 1500000,
                'current_receivable' => 0,
            ]),
        ];

        // 7. Contoh Transaksi Penjualan (Tunai & Piutang/Kasbon) untuk Laporan Laba Rugi
        if (Sale::count() === 0 && count($seededProducts) >= 4) {
            // Transaksi 1: Tunai Lunas
            $sale1 = Sale::create([
                'invoice_number' => 'INV-' . now()->format('Ymd') . '-0001',
                'receipt_token' => Str::random(32),
                'cashier_name' => 'Kasir Utama',
                'customer_id' => $customers[2]->id,
                'customer_name' => $customers[2]->name,
                'customer_whatsapp' => $customers[2]->whatsapp,
                'subtotal' => 145000,
                'discount_amount' => 5000,
                'tax_amount' => 0,
                'grand_total' => 140000,
                'total_cost' => 112500,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'paid_amount' => 150000,
                'change_amount' => 10000,
                'remaining_debt' => 0,
                'wa_sent' => true,
            ]);
            $sale1->items()->createMany([
                [
                    'product_id' => $seededProducts[8]->id,
                    'barcode' => $seededProducts[8]->barcode,
                    'product_name' => $seededProducts[8]->name,
                    'unit_name' => $seededProducts[8]->base_unit,
                    'qty' => 1,
                    'cost_price' => $seededProducts[8]->cost_price,
                    'unit_price' => $seededProducts[8]->selling_price,
                    'subtotal' => $seededProducts[8]->selling_price,
                ],
                [
                    'product_id' => $seededProducts[0]->id,
                    'barcode' => $seededProducts[0]->barcode,
                    'product_name' => $seededProducts[0]->name,
                    'unit_name' => $seededProducts[0]->base_unit,
                    'qty' => 20,
                    'cost_price' => $seededProducts[0]->cost_price,
                    'unit_price' => $seededProducts[0]->selling_price,
                    'subtotal' => 20 * $seededProducts[0]->selling_price,
                ],
            ]);

            // Transaksi 2: Piutang / Kasbon Warung Bu Hj. Siti
            $sale2 = Sale::create([
                'invoice_number' => 'INV-' . now()->format('Ymd') . '-0002',
                'receipt_token' => Str::random(32),
                'cashier_name' => 'Kasir Utama',
                'customer_id' => $customers[0]->id,
                'customer_name' => $customers[0]->name,
                'customer_whatsapp' => $customers[0]->whatsapp,
                'subtotal' => 285000,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'grand_total' => 285000,
                'total_cost' => 246000,
                'payment_method' => 'debt',
                'payment_status' => 'partial',
                'paid_amount' => 100000,
                'change_amount' => 0,
                'remaining_debt' => 185000,
                'due_date' => now()->addDays(7)->toDateString(),
                'wa_sent' => true,
            ]);
            $sale2->items()->create([
                'product_id' => $seededProducts[6]->id,
                'barcode' => $seededProducts[6]->barcode,
                'product_name' => $seededProducts[6]->name,
                'unit_name' => $seededProducts[6]->base_unit,
                'qty' => 5,
                'cost_price' => $seededProducts[6]->cost_price,
                'unit_price' => $seededProducts[6]->selling_price,
                'subtotal' => 5 * $seededProducts[6]->selling_price,
            ]);

            // Transaksi 3: Piutang Warkop Bang Jago
            $sale3 = Sale::create([
                'invoice_number' => 'INV-' . now()->format('Ymd') . '-0003',
                'receipt_token' => Str::random(32),
                'cashier_name' => 'Kasir Utama',
                'customer_id' => $customers[1]->id,
                'customer_name' => $customers[1]->name,
                'customer_whatsapp' => $customers[1]->whatsapp,
                'subtotal' => 340000,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'grand_total' => 340000,
                'total_cost' => 295000,
                'payment_method' => 'debt',
                'payment_status' => 'unpaid',
                'paid_amount' => 0,
                'change_amount' => 0,
                'remaining_debt' => 340000,
                'due_date' => now()->addDays(5)->toDateString(),
                'wa_sent' => false,
            ]);
            $sale3->items()->create([
                'product_id' => $seededProducts[12]->id,
                'barcode' => $seededProducts[12]->barcode,
                'product_name' => $seededProducts[12]->name,
                'unit_name' => $seededProducts[12]->base_unit,
                'qty' => 10,
                'cost_price' => $seededProducts[12]->cost_price,
                'unit_price' => $seededProducts[12]->selling_price,
                'subtotal' => 10 * $seededProducts[12]->selling_price,
            ]);
        }

        // 8. Biaya Operasional Toko (Untuk Laporan Laba Rugi)
        if (OperationalExpense::count() === 0) {
            OperationalExpense::insert([
                [
                    'category' => 'Listrik & Air',
                    'title' => 'Token Listrik Toko & Showcase Pendingin',
                    'amount' => 25000,
                    'expense_date' => now()->toDateString(),
                    'notes' => 'Pembelian token harian',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'category' => 'Kemasan & Plastik',
                    'title' => 'Plastik Kresek & Kertas Thermal Struk 58mm',
                    'amount' => 15000,
                    'expense_date' => now()->toDateString(),
                    'notes' => '2 Pak plastik + 2 roll kertas kasir',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 9. Contoh Riwayat Stok Opname Awal (Untuk Report History Selisih Stok)
        if (StockOpname::count() === 0 && count($seededProducts) >= 4) {
            $opname = StockOpname::create([
                'reference_number' => 'SO-' . now()->subDay()->format('Ymd') . '-0001',
                'opname_date' => now()->subDay()->toDateString(),
                'auditor_name' => 'Kepala Gudang (Budi)',
                'total_items_checked' => 4,
                'total_matched' => 2,
                'total_surplus_qty' => 2,
                'total_deficit_qty' => 3,
                'total_surplus_value' => 2 * $seededProducts[1]->cost_price,
                'total_deficit_value' => 3 * $seededProducts[0]->cost_price,
                'net_value_difference' => (2 * $seededProducts[1]->cost_price) - (3 * $seededProducts[0]->cost_price),
                'notes' => 'Stok Opname Rutin Rak Depan & Gudang Utama',
            ]);

            $opname->items()->createMany([
                [
                    'product_id' => $seededProducts[0]->id,
                    'barcode' => $seededProducts[0]->barcode,
                    'product_name' => $seededProducts[0]->name,
                    'unit_name' => $seededProducts[0]->base_unit,
                    'cost_price' => $seededProducts[0]->cost_price,
                    'system_stock' => 143,
                    'physical_stock' => 140,
                    'difference_qty' => -3,
                    'difference_value' => -3 * $seededProducts[0]->cost_price,
                    'reason' => 'Barang Rusak / Kemasan Sobek',
                ],
                [
                    'product_id' => $seededProducts[1]->id,
                    'barcode' => $seededProducts[1]->barcode,
                    'product_name' => $seededProducts[1]->name,
                    'unit_name' => $seededProducts[1]->base_unit,
                    'cost_price' => $seededProducts[1]->cost_price,
                    'system_stock' => 94,
                    'physical_stock' => 96,
                    'difference_qty' => 2,
                    'difference_value' => 2 * $seededProducts[1]->cost_price,
                    'reason' => 'Bonus / Lebih Kirim Supplier',
                ],
                [
                    'product_id' => $seededProducts[2]->id,
                    'barcode' => $seededProducts[2]->barcode,
                    'product_name' => $seededProducts[2]->name,
                    'unit_name' => $seededProducts[2]->base_unit,
                    'cost_price' => $seededProducts[2]->cost_price,
                    'system_stock' => 72,
                    'physical_stock' => 72,
                    'difference_qty' => 0,
                    'difference_value' => 0,
                    'reason' => 'Sesuai / Cocok',
                ],
                [
                    'product_id' => $seededProducts[3]->id,
                    'barcode' => $seededProducts[3]->barcode,
                    'product_name' => $seededProducts[3]->name,
                    'unit_name' => $seededProducts[3]->base_unit,
                    'cost_price' => $seededProducts[3]->cost_price,
                    'system_stock' => 48,
                    'physical_stock' => 48,
                    'difference_qty' => 0,
                    'difference_value' => 0,
                    'reason' => 'Sesuai / Cocok',
                ],
            ]);
        }
    }
}
