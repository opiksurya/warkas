<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'cost_price' => 'float',
        'system_stock' => 'float',
        'physical_stock' => 'float',
        'difference_qty' => 'float',
        'difference_value' => 'float',
    ];

    public function opname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class, 'stock_opname_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
