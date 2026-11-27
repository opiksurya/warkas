<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number', 40)->unique()->index();
            $table->date('opname_date')->index();
            $table->string('auditor_name')->default('Admin Gudang');
            $table->integer('total_items_checked')->default(0);
            $table->integer('total_matched')->default(0);
            $table->decimal('total_surplus_qty', 12, 2)->default(0);
            $table->decimal('total_deficit_qty', 12, 2)->default(0);
            $table->decimal('total_surplus_value', 15, 2)->default(0);
            $table->decimal('total_deficit_value', 15, 2)->default(0);
            $table->decimal('net_value_difference', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_opname_id')->constrained('stock_opnames')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('barcode', 64);
            $table->string('product_name');
            $table->string('unit_name', 20)->default('PCS');
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('system_stock', 12, 2)->default(0); // Data Stok Lama
            $table->decimal('physical_stock', 12, 2)->default(0); // Data Stok Baru (Fisik)
            $table->decimal('difference_qty', 12, 2)->default(0); // Selisih (Baru - Lama)
            $table->decimal('difference_value', 15, 2)->default(0); // Selisih Rupiah (Selisih * HPP)
            $table->string('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opnames');
    }
};
