<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\StoreSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppReceiptService
{
    /**
     * Format pesan struk belanja WhatsApp & hasilkan URL wa.me sekaligus kirim via API Gateway jika token diisi
     */
    public function formatReceiptText(Sale $sale): string
    {
        $sale->loadMissing(['items', 'customer']);

        $storeName = StoreSetting::getVal('store_name', 'WARKAS MART & GROSIR');
        $storeAddr = StoreSetting::getVal('store_address', 'Jl. Merdeka Raya No. 88');
        $storePhone = StoreSetting::getVal('store_phone', '0812-3456-7890');
        $footer = StoreSetting::getVal('receipt_footer', 'Terima kasih telah berbelanja!');

        $date = $sale->created_at ? $sale->created_at->format('d/m/Y H:i') : now()->format('d/m/Y H:i');
        $receiptUrl = url("/struk/{$sale->receipt_token}");

        $lines = [
            "🧾 *{$storeName}*",
            "{$storeAddr}",
            "Telp/WA: {$storePhone}",
            "--------------------------------",
            "No. Bon : *{$sale->invoice_number}*",
            "Tanggal : {$date}",
            "Kasir   : {$sale->cashier_name}",
        ];

        if ($sale->customer_name) {
            $lines[] = "Pelanggan: *{$sale->customer_name}*";
        }

        $lines[] = "--------------------------------";

        foreach ($sale->items as $item) {
            $qty = rtrim(rtrim(number_format($item->qty, 2, ',', '.'), '0'), ',');
            $unitPrice = number_format($item->unit_price, 0, ',', '.');
            $subtotal = number_format($item->subtotal, 0, ',', '.');
            $lines[] = "• *{$item->product_name}*";
            $lines[] = "  {$qty} {$item->unit_name} x Rp {$unitPrice} = *Rp {$subtotal}*";
        }

        $lines[] = "--------------------------------";
        $lines[] = "Subtotal : Rp " . number_format($sale->subtotal, 0, ',', '.');

        if ($sale->discount_amount > 0) {
            $lines[] = "Diskon   : -Rp " . number_format($sale->discount_amount, 0, ',', '.');
        }

        $lines[] = "*TOTAL   : Rp " . number_format($sale->grand_total, 0, ',', '.') . "*";
        $methodLabel = strtoupper($sale->payment_method === 'debt' ? 'KASBON / PIUTANG' : $sale->payment_method);
        $lines[] = "Metode   : {$methodLabel}";
        $lines[] = "Dibayar  : Rp " . number_format($sale->paid_amount, 0, ',', '.');

        if ($sale->remaining_debt > 0) {
            $lines[] = "⚠️ *SISA PIUTANG: Rp " . number_format($sale->remaining_debt, 0, ',', '.') . "*";
            if ($sale->due_date) {
                $lines[] = "Jatuh Tempo: " . date('d/m/Y', strtotime($sale->due_date));
            }
        } else {
            $lines[] = "Kembali  : Rp " . number_format($sale->change_amount, 0, ',', '.');
            $lines[] = "Status   : ✅ *LUNAS*";
        }

        $lines[] = "--------------------------------";
        $lines[] = "🔗 Lihat Bon Digital: {$receiptUrl}";
        $lines[] = $footer;

        return implode("\n", $lines);
    }

    public function normalizePhone(?string $phone): string
    {
        if (!$phone) {
            return '';
        }
        $digits = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($digits, '08')) {
            return '628' . substr($digits, 2);
        }
        if (str_starts_with($digits, '8')) {
            return '62' . $digits;
        }
        return $digits;
    }

    /**
     * Kirim via WhatsApp Gateway API (Fonnte/Wablas) atau kembalikan link wa.me langsung
     */
    public function sendReceipt(Sale $sale, ?string $overridePhone = null): array
    {
        $rawPhone = $overridePhone ?: $sale->customer_whatsapp;
        $phone = $this->normalizePhone($rawPhone);
        $text = $this->formatReceiptText($sale);
        $waMeUrl = $phone
            ? "https://wa.me/{$phone}?text=" . rawurlencode($text)
            : "https://wa.me/?text=" . rawurlencode($text);

        $token = StoreSetting::getVal('wa_gateway_token', '');
        $gatewayUrl = StoreSetting::getVal('wa_gateway_url', 'https://api.fonnte.com/send');

        $apiSent = false;
        $apiResponseMsg = 'Siap dikirim via WhatsApp Web / Aplikasi WA (atau isi Token API Fonnte di Pengaturan untuk kirim otomatis di background).';

        if (!empty($token) && !empty($phone)) {
            try {
                $response = Http::timeout(6)->withHeaders([
                    'Authorization' => $token,
                ])->post($gatewayUrl, [
                    'target' => $phone,
                    'message' => $text,
                ]);

                if ($response->successful()) {
                    $apiSent = true;
                    $apiResponseMsg = 'Struk berhasil dikirim otomatis via WhatsApp Gateway API!';
                }
            } catch (\Throwable $e) {
                Log::warning('WA Gateway Error: ' . $e->getMessage());
            }
        }

        $sale->update([
            'customer_whatsapp' => $rawPhone ?: $sale->customer_whatsapp,
            'wa_sent' => true,
        ]);

        return [
            'api_sent' => $apiSent,
            'message' => $apiResponseMsg,
            'wa_me_url' => $waMeUrl,
            'receipt_text' => $text,
            'public_receipt_url' => url("/struk/{$sale->receipt_token}"),
        ];
    }
}
