<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Struk Digital {{ $sale->invoice_number }} - {{ $settings['store_name'] ?? 'WARKAS MART' }}</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-100 min-h-screen py-8 px-4 flex flex-col items-center">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        <!-- Header Toko -->
        <div class="bg-emerald-600 text-white p-6 text-center">
            <h1 class="text-xl font-bold tracking-wide">{{ $settings['store_name'] ?? 'WARKAS MART & GROSIR' }}</h1>
            <p class="text-xs text-emerald-100 mt-1">{{ $settings['store_address'] ?? '' }}</p>
            <p class="text-xs text-emerald-100">WA/Telp: {{ $settings['store_phone'] ?? '' }}</p>
        </div>

        <!-- Info Nota -->
        <div class="p-6 space-y-4 text-sm text-slate-700">
            <div class="flex justify-between border-b border-dashed border-slate-300 pb-3">
                <div>
                    <p class="text-xs text-slate-400">No. Transaksi</p>
                    <p class="font-mono font-bold text-slate-900">{{ $sale->invoice_number }}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-slate-400">Tanggal</p>
                    <p class="font-medium">{{ $sale->created_at->format('d/m/Y H:i') }}</p>
                </div>
            </div>

            <div class="flex justify-between text-xs">
                <span>Kasir: <strong>{{ $sale->cashier_name }}</strong></span>
                @if($sale->customer_name)
                    <span>Pelanggan: <strong>{{ $sale->customer_name }}</strong></span>
                @endif
            </div>

            <!-- Daftar Item Belanja -->
            <div class="border-t border-b border-dashed border-slate-300 py-3 space-y-2.5">
                @foreach($sale->items as $item)
                    <div class="flex justify-between items-start">
                        <div class="pr-2">
                            <p class="font-semibold text-slate-800">{{ $item->product_name }}</p>
                            <p class="text-xs text-slate-500">
                                {{ rtrim(rtrim(number_format($item->qty, 2, ',', '.'), '0'), ',') }} {{ $item->unit_name }}
                                x Rp {{ number_format($item->unit_price, 0, ',', '.') }}
                            </p>
                        </div>
                        <p class="font-semibold text-slate-900 whitespace-nowrap">
                            Rp {{ number_format($item->subtotal, 0, ',', '.') }}
                        </p>
                    </div>
                @endforeach
            </div>

            <!-- Ringkasan Harga -->
            <div class="space-y-1.5 text-sm">
                <div class="flex justify-between">
                    <span class="text-slate-500">Subtotal</span>
                    <span>Rp {{ number_format($sale->subtotal, 0, ',', '.') }}</span>
                </div>
                @if($sale->discount_amount > 0)
                    <div class="flex justify-between text-rose-600">
                        <span>Potongan Diskon</span>
                        <span>-Rp {{ number_format($sale->discount_amount, 0, ',', '.') }}</span>
                    </div>
                @endif
                <div class="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>TOTAL TAGIHAN</span>
                    <span>Rp {{ number_format($sale->grand_total, 0, ',', '.') }}</span>
                </div>
                <div class="flex justify-between text-xs text-slate-600">
                    <span>Dibayar ({{ strtoupper($sale->payment_method) }})</span>
                    <span>Rp {{ number_format($sale->paid_amount, 0, ',', '.') }}</span>
                </div>

                @if($sale->remaining_debt > 0)
                    <div class="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                        <div class="flex justify-between font-bold">
                            <span>SISA PIUTANG (KASBON)</span>
                            <span>Rp {{ number_format($sale->remaining_debt, 0, ',', '.') }}</span>
                        </div>
                        @if($sale->due_date)
                            <p class="text-xs mt-1">Jatuh Tempo: {{ date('d/m/Y', strtotime($sale->due_date)) }}</p>
                        @endif
                    </div>
                @else
                    <div class="flex justify-between text-xs font-semibold text-emerald-700">
                        <span>Kembalian</span>
                        <span>Rp {{ number_format($sale->change_amount, 0, ',', '.') }}</span>
                    </div>
                    <div class="mt-3 py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-center font-bold text-xs">
                        ✅ STATUS: LUNAS
                    </div>
                @endif
            </div>

            <p class="text-center text-xs text-slate-400 pt-4 border-t border-dashed border-slate-200">
                {{ $settings['receipt_footer'] ?? 'Terima kasih telah berbelanja!' }}
            </p>
        </div>

        <div class="bg-slate-50 p-4 border-t border-slate-200 flex gap-2 print:hidden">
            <button onclick="window.print()" class="w-full py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800">
                🖨️ Cetak Struk / Simpan PDF
            </button>
        </div>
    </div>
</body>
</html>
