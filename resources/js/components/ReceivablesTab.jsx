import React, { useState } from 'react';
import { FileText, Send, ExternalLink, Clock } from 'lucide-react';
import { formatRp, apiFetch } from '../utils/format';

export default function ReceivablesTab({ receivableSales, recentSales, onRefresh, notify }) {
    const [payingSale, setPayingSale] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState('cash');
    const [payNotes, setPayNotes] = useState('');

    const totalPiutang = receivableSales.reduce((acc, s) => acc + Number(s.remaining_debt || 0), 0);

    const handlePayReceivable = async (e) => {
        e.preventDefault();
        if (!payingSale) return;
        try {
            const res = await apiFetch(`/api/pos/sales/${payingSale.id}/pay-receivable`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: Number(payAmount),
                    payment_method: payMethod,
                    notes: payNotes,
                }),
            });
            notify(res.message);
            setPayingSale(null);
            setPayAmount('');
            onRefresh();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleSendWhatsApp = async (sale) => {
        try {
            const res = await apiFetch(`/api/pos/sales/${sale.id}/send-wa`, {
                method: 'POST',
                body: JSON.stringify({ whatsapp: sale.customer_whatsapp }),
            });
            notify(res.message);
            if (res.whatsapp?.wa_me_url) {
                window.open(res.whatsapp.wa_me_url, '_blank');
            }
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    return (
        <div className="space-y-5">
            {/* Buku Piutang / Kasbon Pelanggan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                            Piutang / Kasbon Belum Lunas
                        </h2>
                        <p className="text-xs text-slate-400">
                            Catat cicilan/pelunasan piutang & kirim pengingat tagihan bon via WhatsApp
                        </p>
                    </div>
                    <div className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex sm:block items-center justify-between">
                        <span className="text-xs text-amber-300 block">Total Piutang Berjalan</span>
                        <span className="text-lg sm:text-xl font-extrabold text-amber-400">
                            {formatRp(totalPiutang)}
                        </span>
                    </div>
                </div>

                {receivableSales.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        🎉 Tidak ada tagihan piutang yang tertunggak saat ini.
                    </div>
                ) : (
                    <>
                        {/* KARTU PIUTANG KHUSUS MOBILE */}
                        <div className="md:hidden space-y-3">
                            {receivableSales.map((s) => (
                                <div
                                    key={s.id}
                                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="font-mono text-xs text-slate-400">
                                                {s.invoice_number}
                                            </span>
                                            <h4 className="font-bold text-sm text-white">
                                                {s.customer_name || 'Pelanggan'}
                                            </h4>
                                            <p className="text-xs text-emerald-400 font-mono">
                                                {s.customer_whatsapp || '-'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-amber-300 block">Sisa Kasbon</span>
                                            <span className="text-base font-extrabold text-amber-400">
                                                {formatRp(s.remaining_debt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800 pt-2">
                                        <span>Total Nota: {formatRp(s.grand_total)}</span>
                                        <span>Tempo: {s.due_date || '-'}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPayingSale(s);
                                                setPayAmount(s.remaining_debt);
                                            }}
                                            className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                                        >
                                            Bayar / Cicil
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSendWhatsApp(s)}
                                            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Send className="w-3.5 h-3.5" /> Tagih WA
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* TABEL PIUTANG DESKTOP */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <th className="p-3">No. Nota & Tanggal</th>
                                        <th className="p-3">Pelanggan & No. WA</th>
                                        <th className="p-3">Total Nota</th>
                                        <th className="p-3">Sudah Dibayar</th>
                                        <th className="p-3">Sisa Piutang</th>
                                        <th className="p-3">Jatuh Tempo</th>
                                        <th className="p-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {receivableSales.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-950/50">
                                            <td className="p-3">
                                                <div className="font-mono font-bold text-white">{s.invoice_number}</div>
                                                <div className="text-slate-400">
                                                    {new Date(s.created_at).toLocaleDateString('id-ID')}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-semibold text-white">
                                                    {s.customer_name || 'Pelanggan'}
                                                </div>
                                                <div className="text-emerald-400 font-mono">
                                                    {s.customer_whatsapp || '-'}
                                                </div>
                                            </td>
                                            <td className="p-3 font-semibold text-slate-200">
                                                {formatRp(s.grand_total)}
                                            </td>
                                            <td className="p-3 text-emerald-400">{formatRp(s.paid_amount)}</td>
                                            <td className="p-3 font-bold text-amber-400 text-sm">
                                                {formatRp(s.remaining_debt)}
                                            </td>
                                            <td className="p-3 text-slate-300">{s.due_date || '-'}</td>
                                            <td className="p-3 text-right space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPayingSale(s);
                                                        setPayAmount(s.remaining_debt);
                                                    }}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer"
                                                >
                                                    Bayar / Cicil
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSendWhatsApp(s)}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Send className="w-3.5 h-3.5" /> Tagih WA
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Riwayat Seluruh Transaksi & Kirim Ulang Bon WA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    Riwayat Bon Transaksi & Kirim WhatsApp
                </h3>

                {/* KARTU RIWAYAT BON MOBILE */}
                <div className="md:hidden space-y-2.5">
                    {recentSales.map((s) => (
                        <div
                            key={s.id}
                            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-white">{s.invoice_number}</span>
                                <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        s.remaining_debt > 0
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : 'bg-emerald-500/20 text-emerald-300'
                                    }`}
                                >
                                    {s.payment_method} • {s.remaining_debt > 0 ? 'KASBON' : 'LUNAS'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2">
                                {s.items?.map((i) => `${i.product_name} (${i.qty})`).join(', ')}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                <span className="font-extrabold text-sm text-emerald-400">
                                    {formatRp(s.grand_total)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSendWhatsApp(s)}
                                        className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5" /> WA
                                    </button>
                                    <a
                                        href={`/struk/${s.receipt_token}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                                    >
                                        Struk <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TABEL RIWAYAT BON DESKTOP */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <th className="p-3">No. Bon</th>
                                <th className="p-3">Pelanggan</th>
                                <th className="p-3">Item</th>
                                <th className="p-3">Total Belanja</th>
                                <th className="p-3">Metode & Status</th>
                                <th className="p-3 text-right">Struk & WhatsApp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {recentSales.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-950/50">
                                    <td className="p-3 font-mono font-bold text-white">{s.invoice_number}</td>
                                    <td className="p-3">
                                        <div className="text-white font-medium">{s.customer_name || 'Umum'}</div>
                                        <div className="text-slate-400 font-mono">{s.customer_whatsapp || ''}</div>
                                    </td>
                                    <td className="p-3 text-slate-300">
                                        {s.items?.map((i) => `${i.product_name} (${i.qty})`).join(', ')}
                                    </td>
                                    <td className="p-3 font-bold text-emerald-400">{formatRp(s.grand_total)}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded font-semibold uppercase ${
                                                s.remaining_debt > 0
                                                    ? 'bg-amber-500/20 text-amber-300'
                                                    : 'bg-emerald-500/20 text-emerald-300'
                                            }`}
                                        >
                                            {s.payment_method} - {s.remaining_debt > 0 ? 'BELUM LUNAS' : 'LUNAS'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSendWhatsApp(s)}
                                            className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <Send className="w-3.5 h-3.5" /> Kirim WA
                                        </button>
                                        <a
                                            href={`/struk/${s.receipt_token}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold inline-flex items-center gap-1"
                                        >
                                            Bon <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Cicil / Pelunasan Piutang (Slide-up di HP) */}
            {payingSale && (
                <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <form
                        onSubmit={handlePayReceivable}
                        className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4"
                    >
                        <h3 className="text-base sm:text-lg font-bold text-white">
                            Pelunasan / Cicilan {payingSale.invoice_number}
                        </h3>
                        <p className="text-xs text-slate-300">
                            Pelanggan: <strong>{payingSale.customer_name}</strong> | Sisa Piutang:{' '}
                            <strong className="text-amber-400">{formatRp(payingSale.remaining_debt)}</strong>
                        </p>

                        <div>
                            <label className="text-xs text-slate-400">Nominal Pembayaran (Rp)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max={payingSale.remaining_debt}
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-base font-bold text-white"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">Metode Bayar</label>
                            <select
                                value={payMethod}
                                onChange={(e) => setPayMethod(e.target.value)}
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                            >
                                <option value="cash">Tunai</option>
                                <option value="transfer">Transfer Bank</option>
                                <option value="qris">QRIS</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setPayingSale(null)}
                                className="py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Simpan Pembayaran
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
