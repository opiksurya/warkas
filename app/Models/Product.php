<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'cost_price' => 'float',
        'markup_value' => 'float',
        'auto_round' => 'boolean',
        'selling_price' => 'float',
        'wholesale_min_qty' => 'float',
        'wholesale_price' => 'float',
        'stock' => 'float',
        'min_stock_alert' => 'float',
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
