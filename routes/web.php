<?php

use App\Http\Controllers\PosApiController;
use Illuminate\Support\Facades\Route;

// Halaman Utama Aplikasi React POS (Warkas)
Route::view('/', 'app')->name('pos.app');

// Halaman Struk Digital Publik (Link dari WhatsApp Bon)
Route::get('/struk/{token}', [PosApiController::class, 'publicReceipt'])->name('public.receipt');

// Endpoint JSON API untuk React Frontend
Route::prefix('api/pos')->group(function () {
    Route::get('/bootstrap', [PosApiController::class, 'bootstrap']);
    Route::get('/barcode-lookup', [PosApiController::class, 'lookupBarcode']);
    Route::get('/indonesia-catalog', [PosApiController::class, 'searchIndonesiaCatalog']);

    Route::post('/products/scan-save', [PosApiController::class, 'storeOrRestockProduct']);
    Route::post('/products/bulk-update', [PosApiController::class, 'bulkUpdateProducts']);
    Route::delete('/products/{product}', [PosApiController::class, 'deleteProduct']);
    Route::post('/stock-opnames', [PosApiController::class, 'storeStockOpname']);

    Route::post('/checkout', [PosApiController::class, 'checkout']);
    Route::post('/sales/{sale}/send-wa', [PosApiController::class, 'sendWhatsAppReceipt']);
    Route::post('/sales/{sale}/pay-receivable', [PosApiController::class, 'payReceivable']);

    Route::post('/suppliers', [PosApiController::class, 'storeSupplier']);
    Route::post('/customers', [PosApiController::class, 'storeCustomer']);

    Route::get('/reports/profit-loss', [PosApiController::class, 'profitLossReport']);
    Route::post('/expenses', [PosApiController::class, 'storeExpense']);
    Route::post('/settings', [PosApiController::class, 'saveSettings']);
});
