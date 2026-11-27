<?php

namespace App\Services;

use App\Models\OperationalExpense;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProfitLossReportService
{
    public function generate(string $startDate, string $endDate): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        // 1. Ringkasan Penjualan & HPP (COGS)
        $salesSummary = Sale::query()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('
                COUNT(id) as total_transactions,
                COALESCE(SUM(subtotal), 0) as gross_sales,
                COALESCE(SUM(discount_amount), 0) as total_discounts,
                COALESCE(SUM(grand_total), 0) as net_sales,
                COALESCE(SUM(total_cost), 0) as total_cogs,
                COALESCE(SUM(paid_amount - change_amount), 0) as cash_collected,
                COALESCE(SUM(remaining_debt), 0) as total_receivables
            ')
            ->first();

        $grossSales = (float) ($salesSummary->gross_sales ?? 0);
        $totalDiscounts = (float) ($salesSummary->total_discounts ?? 0);
        $netSales = (float) ($salesSummary->net_sales ?? 0);
        $totalCogs = (float) ($salesSummary->total_cogs ?? 0);

        // 2. Laba Kotor (Gross Profit)
        $grossProfit = $netSales - $totalCogs;
        $grossMargin = $netSales > 0 ? round(($grossProfit / $netSales) * 100, 2) : 0;

        // 3. Biaya Operasional Toko
        $expenses = OperationalExpense::query()
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('expense_date')
            ->get();

        $expensesByCategory = $expenses
            ->groupBy('category')
            ->map(fn ($rows) => (float) $rows->sum('amount'))
            ->toArray();

        $totalExpenses = (float) $expenses->sum('amount');

        // 4. Laba Bersih (Net Profit)
        $netProfit = $grossProfit - $totalExpenses;
        $netMargin = $netSales > 0 ? round(($netProfit / $netSales) * 100, 2) : 0;

        // 5. Breakdown Laba per Produk Terlaris
        $topProducts = SaleItem::query()
            ->whereHas('sale', fn ($q) => $q->whereBetween('created_at', [$start, $end]))
            ->selectRaw('
                product_id,
                product_name,
                unit_name,
                SUM(qty) as total_qty,
                SUM(subtotal) as total_revenue,
                SUM(qty * cost_price) as total_hpp,
                SUM(subtotal - (qty * cost_price)) as total_profit
            ')
            ->groupBy('product_id', 'product_name', 'unit_name')
            ->orderByDesc('total_profit')
            ->limit(15)
            ->get();

        // 6. Breakdown per Metode Pembayaran
        $byPaymentMethod = Sale::query()
            ->whereBetween('created_at', [$start, $end])
            ->select('payment_method', DB::raw('COUNT(id) as count'), DB::raw('SUM(grand_total) as total'))
            ->groupBy('payment_method')
            ->get();

        return [
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'summary' => [
                'total_transactions' => (int) ($salesSummary->total_transactions ?? 0),
                'gross_sales' => $grossSales,
                'total_discounts' => $totalDiscounts,
                'net_sales' => $netSales,
                'total_cogs' => $totalCogs,
                'gross_profit' => $grossProfit,
                'gross_margin_percent' => $grossMargin,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'net_margin_percent' => $netMargin,
                'total_receivables' => (float) ($salesSummary->total_receivables ?? 0),
            ],
            'expenses_by_category' => $expensesByCategory,
            'expenses_list' => $expenses,
            'top_products' => $topProducts,
            'by_payment_method' => $byPaymentMethod,
        ];
    }
}
