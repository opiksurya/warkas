<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOpname extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'total_items_checked' => 'integer',
        'total_matched' => 'integer',
        'total_surplus_qty' => 'float',
        'total_deficit_qty' => 'float',
        'total_surplus_value' => 'float',
        'total_deficit_value' => 'float',
        'net_value_difference' => 'float',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class);
    }
}
