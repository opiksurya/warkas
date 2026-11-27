<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Katalog Referensi API Produk Indonesia (Mirror dari github.com/ariph007/api-product-indonesia)
        Schema::create('indonesia_product_catalogs', function (Blueprint $table) {
            $table->id();
            $table->string('barcode', 64)->unique()->index();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('brand')->nullable();
            $table->string('unit')->default('PCS');
            $table->decimal('reference_price', 15, 2)->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        // 2. Kategori Produk
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        // 3. Database Supplier
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->string('sales_name')->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->integer('top_days')->default(0); // Term of Payment (Hari)
            $table->decimal('total_payable', 15, 2)->default(0); // Hutang ke supplier
            $table->timestamps();
        });

        // 4. Produk & Inventaris Toko
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('barcode', 64)->unique()->index();
            $table->string('sku', 50)->nullable()->index();
            $table->string('name')->index();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('base_unit', 20)->default('PCS');

            // Harga Beli & Kalkulasi Markup (% atau Nominal)
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->string('markup_type', 20)->default('percentage'); // 'percentage' | 'nominal'
            $table->decimal('markup_value', 15, 2)->default(0);
            $table->boolean('auto_round')->default(true);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->decimal('wholesale_min_qty', 10, 2)->nullable();
            $table->decimal('wholesale_price', 15, 2)->nullable();

            // Stok & Peringatan
            $table->decimal('stock', 12, 2)->default(0);
            $table->decimal('min_stock_alert', 12, 2)->default(5);
            $table->date('nearest_expiry_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 5. Pelanggan & Limit Piutang (Kasbon)
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('whatsapp', 30)->nullable()->index();
            $table->text('address')->nullable();
            $table->decimal('credit_limit', 15, 2)->default(1000000);
            $table->decimal('current_receivable', 15, 2)->default(0);
            $table->timestamps();
        });

        // 6. Pembelian / Restock dari Supplier
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->date('purchase_date');
            $table->date('due_date')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining_payable', 15, 2)->default(0);
            $table->string('payment_status', 20)->default('paid'); // paid, partial, unpaid
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('qty', 12, 2);
            $table->decimal('cost_price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });

        // 7. Transaksi Penjualan Kasir (POS) & Piutang
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 40)->unique()->index();
            $table->string('receipt_token', 64)->unique();
            $table->string('cashier_name')->default('Admin Kasir');
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->string('customer_whatsapp', 30)->nullable();

            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2);
            $table->decimal('total_cost', 15, 2); // Total HPP untuk Laporan Laba Rugi

            $table->string('payment_method', 20)->default('cash'); // cash, qris, transfer, debt
            $table->string('payment_status', 20)->default('paid'); // paid, partial, unpaid
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('change_amount', 15, 2)->default(0);
            $table->decimal('remaining_debt', 15, 2)->default(0);
            $table->date('due_date')->nullable();

            $table->boolean('wa_sent')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('barcode', 64)->nullable();
            $table->string('product_name');
            $table->string('unit_name', 20)->default('PCS');
            $table->decimal('qty', 12, 2);
            $table->decimal('cost_price', 15, 2); // Snapshot HPP saat terjual
            $table->decimal('unit_price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });

        // 8. Pembayaran Cicilan / Pelunasan Piutang Pelanggan
        Schema::create('receivable_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('payment_method', 30)->default('cash');
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        // 9. Biaya Operasional Toko (Untuk Laporan Laba Rugi)
        Schema::create('operational_expenses', function (Blueprint $table) {
            $table->id();
            $table->string('category'); // Listrik & Air, Gaji Karyawan, Sewa, Kemasan/Plastik, Lain-lain
            $table->string('title');
            $table->decimal('amount', 15, 2);
            $table->date('expense_date')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 10. Pengaturan Toko & WhatsApp Gateway
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_settings');
        Schema::dropIfExists('operational_expenses');
        Schema::dropIfExists('receivable_payments');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('products');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('indonesia_product_catalogs');
    }
};
