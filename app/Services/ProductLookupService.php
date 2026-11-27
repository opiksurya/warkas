<?php

namespace App\Services;

use App\Models\IndonesiaProductCatalog;
use App\Models\Product;
use Illuminate\Support\Facades\Http;

class ProductLookupService
{
    /**
     * Cari produk berdasarkan barcode:
     * 1. Cek di tabel `products` toko
     * 2. Cek di tabel `indonesia_product_catalogs` (Local Mirror ariph007/api-product-indonesia)
     * 3. Fallback query ke repository GitHub ariph007/api-product-indonesia atau OpenFoodFacts Indonesia
     */
    public function lookupByBarcode(string $barcode): array
    {
        $barcode = trim($barcode);

        // 1. Cek di inventaris toko sendiri
        $existingProduct = Product::with(['category', 'supplier'])
            ->where('barcode', $barcode)
            ->first();

        if ($existingProduct) {
            return [
                'found_in' => 'store_inventory',
                'exists_in_store' => true,
                'message' => "Produk sudah terdaftar di toko (Stok saat ini: {$existingProduct->stock} {$existingProduct->base_unit}). Anda dapat menambah stok atau memperbarui harga beli & markup.",
                'product' => $existingProduct,
                'catalog' => null,
            ];
        }

        // 2. Cek di katalog database produk Indonesia lokal (github.com/ariph007/api-product-indonesia)
        $catalog = IndonesiaProductCatalog::where('barcode', $barcode)->first();

        if ($catalog) {
            return [
                'found_in' => 'api_product_indonesia_local',
                'exists_in_store' => false,
                'message' => 'Data ditemukan di Database API Produk Indonesia! Nama barang, satuan, & estimasi HPP otomatis terisi.',
                'product' => null,
                'catalog' => $catalog,
            ];
        }

        // 3. Fallback live HTTP check ke endpoint resmi ariph007/api-product-indonesia & OpenFoodFacts
        try {
            // Endpoint resmi sesuai README github.com/ariph007/api-product-indonesia
            $alphaRes = Http::timeout(2)->get('https://api-products.alpha-projects.cloud/api/v1/products-barcode', [
                'barcode' => $barcode,
                'generateBarcode' => 'false',
            ]);
            if ($alphaRes->successful() && $alphaRes->json('name')) {
                $item = $alphaRes->json();
                $newCatalog = IndonesiaProductCatalog::updateOrCreate(
                    ['barcode' => $barcode],
                    [
                        'name' => $item['name'],
                        'category' => 'Produk Ritel Indonesia',
                        'unit' => $item['uom'] ?? 'PCS',
                        'reference_price' => (float) ($item['price'] ?? 0),
                    ]
                );

                return [
                    'found_in' => 'api_product_indonesia_cloud',
                    'exists_in_store' => false,
                    'message' => 'Data barcode ditemukan dari Cloud API Produk Indonesia & disimpan ke katalog lokal!',
                    'product' => null,
                    'catalog' => $newCatalog,
                ];
            }

            $response = Http::timeout(3)->get("https://world.openfoodfacts.org/api/v2/product/{$barcode}.json");
            if ($response->successful() && $response->json('status') === 1) {
                $p = $response->json('product');
                $name = trim(($p['brands'] ?? '') . ' ' . ($p['product_name'] ?? '') . ' ' . ($p['quantity'] ?? ''));
                if (!empty($name)) {
                    $newCatalog = IndonesiaProductCatalog::updateOrCreate(
                        ['barcode' => $barcode],
                        [
                            'name' => $name,
                            'category' => 'Minuman & Makanan',
                            'brand' => $p['brands'] ?? null,
                            'unit' => 'PCS',
                            'reference_price' => 0,
                        ]
                    );

                    return [
                        'found_in' => 'api_product_indonesia_remote',
                        'exists_in_store' => false,
                        'message' => 'Data barcode ditemukan dari API Cloud & disimpan ke katalog lokal!',
                        'product' => null,
                        'catalog' => $newCatalog,
                    ];
                }
            }
        } catch (\Throwable $e) {
            // Abaikan jika offline, langsung fallback ke input manual
        }

        return [
            'found_in' => 'manual_new',
            'exists_in_store' => false,
            'message' => 'Barcode baru belum ada di katalog. Silakan ketik nama produk, otomatis akan tersimpan ke katalog produk Indonesia.',
            'product' => null,
            'catalog' => [
                'barcode' => $barcode,
                'name' => '',
                'category' => '',
                'brand' => '',
                'unit' => 'PCS',
                'reference_price' => 0,
            ],
        ];
    }

    /**
     * Hitung Harga Jual dari Harga Beli + Markup (Persentase % atau Nominal Rp)
     */
    public static function calculateSellingPrice(
        float $costPrice,
        string $markupType,
        float $markupValue,
        bool $autoRound = true
    ): float {
        if ($costPrice <= 0) {
            return 0;
        }

        $rawPrice = $markupType === 'percentage'
            ? $costPrice + ($costPrice * ($markupValue / 100))
            : $costPrice + $markupValue;

        if ($autoRound && $rawPrice > 0) {
            return ceil($rawPrice / 100) * 100;
        }

        return round($rawPrice, 2);
    }
}
