import React, { useState } from 'react';
import { TrendingUp, DollarSign, PieChart, PlusCircle, Calendar } from 'lucide-react';
import { formatRp, apiFetch } from '../utils/format';

export default function ProfitLossTab({ initialReport, notify }) {
    const [report, setReport] = useState(initialReport);
    const [startDate, setStartDate] = useState(initialReport?.period?.start_date || '');
    const [endDate, setEndDate] = useState(initialReport?.period?.end_date || '');

    // Form Biaya Operasional
    const [expCategory, setExpCategory] = useState('Listrik & Air');
    const [expTitle, setExpTitle] = useState('');
    const [expAmount, setExpAmount] = useState('');
    const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

    const handleFilter = async (e) => {
        e.preventDefault();
        try {
            const res = await apiFetch(
                `/api/pos/reports/profit-loss?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
            );
            setReport(res);
            notify('Laporan Laba Rugi berhasil diperbarui');
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expTitle || !expAmount) return;
        try {
            const res = await apiFetch('/api/pos/expenses', {
                method: 'POST',
                body: JSON.stringify({
                    category: expCategory,
                    title: expTitle,
                    amount: Number(expAmount),
                    expense_date: expDate,
                }),
            });
            setReport(res.profit_loss);
            setExpTitle('');
            setExpAmount('');
            notify(res.message);
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const s = report?.summary || {};

    return (
        <div className="space-y-6">
            {/* Filter Tanggal Laporan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Laporan Laba Rugi (Profit & Loss Statement)
                    </h2>
                    <p className="text-xs text-slate-400">
                        Perhitungan real-time dari Omzet Penjualan dikurangi HPP (Modal Barang) dan Biaya Operasional
                    </p>
                </div>
                <form onSubmit={handleFilter} className="flex items-center gap-2 flex-wrap">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <span className="text-slate-400 text-xs">s/d</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs cursor-pointer"
                    >
                        Tampilkan
                    </button>
                </form>
            </div>

            {/* 4 Kartu KPI Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Omzet Penjualan Bersih (Net Sales)</span>
                    <div className="text-2xl font-extrabold text-white mt-1">{formatRp(s.net_sales)}</div>
                    <span className="text-[11px] text-slate-400">
                        {s.total_transactions} Transaksi (Diskon: {formatRp(s.total_discounts)})
                    </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Total HPP / Modal Barang Terjual</span>
                    <div className="text-2xl font-extrabold text-amber-400 mt-1">{formatRp(s.total_cogs)}</div>
                    <span className="text-[11px] text-slate-400">Snapshot HPP saat barang terjual</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30">
                    <span className="text-xs text-emerald-300">Laba Kotor (Gross Profit)</span>
                    <div className="text-2xl font-extrabold text-emerald-400 mt-1">{formatRp(s.gross_profit)}</div>
                    <span className="text-[11px] text-emerald-300">Margin Kotor: {s.gross_margin_percent}%</span>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500">
                    <span className="text-xs font-bold text-emerald-300">LABA BERSIH (NET PROFIT)</span>
                    <div className="text-2xl font-extrabold text-white mt-1">{formatRp(s.net_profit)}</div>
                    <span className="text-[11px] text-emerald-300">
                        Margin Bersih: {s.net_margin_percent}% (Beban Ops: {formatRp(s.total_expenses)})
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* KIRI: Laporan Laba Rugi Standar Akuntansi */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3">
                        Rincian Perhitungan Laba Rugi
                    </h3>

                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-300">Pendapatan Penjualan Kotor (Gross Sales)</span>
                            <span className="font-semibold text-white">{formatRp(s.gross_sales)}</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                            <span>(-) Potongan Diskon Penjualan</span>
                            <span>-{formatRp(s.total_discounts)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-white pt-2 border-t border-slate-800">
                            <span>PENJUALAN BERSIH (NET SALES)</span>
                            <span>{formatRp(s.net_sales)}</span>
                        </div>

                        <div className="flex justify-between text-amber-400 pt-2">
                            <span>(-) Harga Pokok Penjualan (HPP / Modal Barang)</span>
                            <span>-{formatRp(s.total_cogs)}</span>
                        </div>

                        <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-slate-800 text-base">
                            <span>LABA KOTOR (GROSS PROFIT)</span>
                            <span>{formatRp(s.gross_profit)}</span>
                        </div>

                        <div className="pt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Biaya Operasional Toko
                            </p>
                            {Object.entries(report?.expenses_by_category || {}).map(([cat, amt]) => (
                                <div key={cat} className="flex justify-between text-xs py-1 text-slate-300">
                                    <span>• {cat}</span>
                                    <span className="text-rose-400">-{formatRp(amt)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-rose-400 font-semibold pt-2 border-t border-slate-800/80">
                                <span>Total Biaya Operasional</span>
                                <span>-{formatRp(s.total_expenses)}</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex justify-between items-center mt-4">
                            <div>
                                <span className="font-extrabold text-white text-base block">
                                    LABA BERSIH USAHA (NET PROFIT)
                                </span>
                                <span className="text-xs text-emerald-300">
                                    Termasuk Piutang Berjalan: {formatRp(s.total_receivables)}
                                </span>
                            </div>
                            <span className="text-2xl font-extrabold text-emerald-400">{formatRp(s.net_profit)}</span>
                        </div>
                    </div>

                    {/* Tabel Kontribusi Laba per Produk */}
                    <div className="pt-4 border-t border-slate-800">
                        <h4 className="font-bold text-sm text-white mb-3">Kontribusi Laba per Produk Terlaris</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <th className="p-2.5">Produk</th>
                                        <th className="p-2.5">Qty Terjual</th>
                                        <th className="p-2.5">Omzet</th>
                                        <th className="p-2.5">HPP</th>
                                        <th className="p-2.5 text-right">Laba Kotor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {(report?.top_products || []).map((tp) => (
                                        <tr key={tp.product_id}>
                                            <td className="p-2.5 font-semibold text-white">{tp.product_name}</td>
                                            <td className="p-2.5 text-slate-300">
                                                {tp.total_qty} {tp.unit_name}
                                            </td>
                                            <td className="p-2.5 text-slate-200">{formatRp(tp.total_revenue)}</td>
                                            <td className="p-2.5 text-amber-400">{formatRp(tp.total_hpp)}</td>
                                            <td className="p-2.5 text-right font-bold text-emerald-400">
                                                +{formatRp(tp.total_profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* KANAN: Input Biaya Operasional Toko */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                        <PlusCircle className="w-5 h-5 text-emerald-400" />
                        Catat Biaya Operasional Toko
                    </h3>
                    <form onSubmit={handleAddExpense} className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-400">Kategori Pengeluaran</label>
                            <select
                                value={expCategory}
                                onChange={(e) => setExpCategory(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                            >
                                <option>Listrik & Air</option>
                                <option>Gaji Karyawan</option>
                                <option>Kemasan & Plastik</option>
                                <option>Sewa Tempat</option>
                                <option>Transportasi & Bensin</option>
                                <option>Lain-lain</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Keterangan Biaya</label>
                            <input
                                type="text"
                                required
                                value={expTitle}
                                onChange={(e) => setExpTitle(e.target.value)}
                                placeholder="Contoh: Beli token listrik & plastik kresek"
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    value={expAmount}
                                    onChange={(e) => setExpAmount(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Tanggal</label>
                                <input
                                    type="date"
                                    value={expDate}
                                    onChange={(e) => setExpDate(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                            + Simpan Biaya Operasional
                        </button>
                    </form>

                    <div className="pt-4 border-t border-slate-800 space-y-2 max-h-72 overflow-y-auto">
                        <p className="text-xs font-semibold text-slate-400">Riwayat Pengeluaran Periode Ini</p>
                        {(report?.expenses_list || []).map((exp) => (
                            <div
                                key={exp.id}
                                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs"
                            >
                                <div>
                                    <p className="font-semibold text-white">{exp.title}</p>
                                    <p className="text-slate-400">
                                        {exp.category} • {exp.expense_date}
                                    </p>
                                </div>
                                <span className="font-bold text-rose-400">-{formatRp(exp.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
