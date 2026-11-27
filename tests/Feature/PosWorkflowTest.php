<?php

namespace Tests\Feature;

use App\Models\Product;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_pos_full_workflow_barcode_markup_bulk_edit_checkout_and_profit_loss(): void
    {
        // 1. Halaman utama React POS
        $this->get('/')->assertStatus(200);

        // 2. Bootstrap API
        $boot = $this->getJson('/api/pos/bootstrap')->assertStatus(200);
        $this->assertGreaterThan(10, count($boot->json('products')));
        $this->assertGreaterThan(25, $boot->json('catalog_count'));

        // 3. Lookup Barcode dari Database API Produk Indonesia (Mie Sedaap Goreng 8998866200318)
        $lookup = $this->getJson('/api/pos/barcode-lookup?barcode=8998866200318')
            ->assertStatus(200)
            ->assertJsonPath('found_in', 'api_product_indonesia_local');
        $this->assertEquals('Mie Sedaap Goreng 90g', $lookup->json('catalog.name'));

        // 4. Input Stok & Markup Persentase (HPP 2700 + Markup 20% + Auto Round -> 3300)
        $saveRes = $this->postJson('/api/pos/products/scan-save', [
            'barcode' => '8998866200318',
            'name' => 'Mie Sedaap Goreng 90g',
            'base_unit' => 'PCS',
            'cost_price' => 2700,
            'markup_type' => 'percentage',
            'markup_value' => 20,
            'auto_round' => true,
            'selling_price' => 3300,
            'stock_input' => 40,
            'stock_mode' => 'add',
        ])->assertStatus(200);
        $newProdId = $saveRes->json('product.id');

        // 5. Edit Masal (Bulk Update Markup Nominal +Rp 1000)
        $this->postJson('/api/pos/products/bulk-update', [
            'mode' => 'markup_formula',
            'product_ids' => [$newProdId],
            'markup_type' => 'nominal',
            'markup_value' => 1000,
            'auto_round' => true,
        ])->assertStatus(200);

        $this->assertEquals(3700, Product::find($newProdId)->selling_price);

        // 6. Checkout Kasir POS (Piutang / Kasbon + Kirim Bon ke WhatsApp)
        $checkoutRes = $this->postJson('/api/pos/checkout', [
            'items' => [
                ['product_id' => $newProdId, 'qty' => 10, 'unit_price' => 3700],
            ],
            'discount_amount' => 2000,
            'payment_method' => 'debt',
            'paid_amount' => 15000,
            'new_customer_name' => 'Warung Test Ibu Ani',
            'customer_whatsapp' => '081299887766',
            'send_wa' => true,
        ])->assertStatus(200);

        $this->assertEquals(20000, $checkoutRes->json('sale.remaining_debt'));
        $this->assertStringContainsString('wa.me/6281299887766', $checkoutRes->json('whatsapp.wa_me_url'));

        // 7. Cek halaman struk digital publik
        $token = $checkoutRes->json('sale.receipt_token');
        $this->get("/struk/{$token}")->assertStatus(200);

        // 8. Cek Laporan Laba Rugi
        $this->getJson('/api/pos/reports/profit-loss')
            ->assertStatus(200)
            ->assertJsonStructure([
                'summary' => [
                    'gross_sales',
                    'net_sales',
                    'total_cogs',
                    'gross_profit',
                    'total_expenses',
                    'net_profit',
                ],
            ]);

        // 9. Cek Stok Opname (Sandingkan Data Lama 30 vs Data Baru 28 -> Selisih -2, Stok produk terganti jadi 28, dan tersimpan di History)
        $opnameRes = $this->postJson('/api/pos/stock-opnames', [
            'auditor_name' => 'Kepala Gudang Budi',
            'notes' => 'Stok Opname Mingguan',
            'items' => [
                [
                    'product_id' => $newProdId,
                    'physical_stock' => 28,
                    'reason' => 'Barang Rusak / Expired',
                ],
            ],
        ])->assertStatus(200);

        $this->assertEquals(28, Product::find($newProdId)->stock);
        $this->assertEquals(30, $opnameRes->json('stock_opname.items.0.system_stock'));
        $this->assertEquals(28, $opnameRes->json('stock_opname.items.0.physical_stock'));
        $this->assertEquals(-2, $opnameRes->json('stock_opname.items.0.difference_qty'));
    }
}
