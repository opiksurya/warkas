import React, { useState } from 'react';
import { Truck, Users, Settings, Save, Phone } from 'lucide-react';
import { formatRp, apiFetch } from '../utils/format';

export default function SuppliersSettingsTab({ suppliers, customers, settings, onRefresh, notify }) {
    // Form Supplier
    const [supName, setSupName] = useState('');
    const [supSales, setSupSales] = useState('');
    const [supPhone, setSupPhone] = useState('');
    const [supAddress, setSupAddress] = useState('');
    const [supTop, setSupTop] = useState(14);

    // Form Pelanggan
    const [custName, setCustName] = useState('');
    const [custWa, setCustWa] = useState('');
    const [custAddress, setCustAddress] = useState('');
    const [custLimit, setCustLimit] = useState(2000000);

    // Form Pengaturan Toko & WhatsApp Gateway
    const [formSettings, setFormSettings] = useState({
        store_name: settings?.store_name || 'WARKAS MART & GROSIR',
        store_address: settings?.store_address || '',
        store_phone: settings?.store_phone || '',
        wa_gateway_url: settings?.wa_gateway_url || 'https://api.fonnte.com/send',
        wa_gateway_token: settings?.wa_gateway_token || '',
        receipt_footer: settings?.receipt_footer || '',
    });

    const handleSaveSupplier = async (e) => {
        e.preventDefault();
        try {
            const res = await apiFetch('/api/pos/suppliers', {
                method: 'POST',
                body: JSON.stringify({
                    name: supName,
                    sales_name: supSales,
                    phone: supPhone,
                    address: supAddress,
                    top_days: Number(supTop),
                }),
            });
            notify(res.message);
            setSupName('');
            setSupSales('');
            setSupPhone('');
            setSupAddress('');
            onRefresh();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        try {
            const res = await apiFetch('/api/pos/customers', {
                method: 'POST',
                body: JSON.stringify({
                    name: custName,
                    whatsapp: custWa,
                    address: custAddress,
                    credit_limit: Number(custLimit),
                }),
            });
            notify(res.message);
            setCustName('');
            setCustWa('');
            setCustAddress('');
            onRefresh();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            const res = await apiFetch('/api/pos/settings', {
                method: 'POST',
                body: JSON.stringify({ settings: formSettings }),
            });
            notify(res.message);
            onRefresh();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* DATABASE SUPPLIER */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Truck className="w-5 h-5 text-emerald-400" />
                        Database Supplier & Distributor
                    </h2>

                    <form onSubmit={handleSaveSupplier} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                            <label className="text-xs text-slate-400">Nama PT / Distributor</label>
                            <input
                                type="text"
                                required
                                value={supName}
                                onChange={(e) => setSupName(e.target.value)}
                                placeholder="PT Contoh Distribusi"
                                className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Nama Salesman</label>
                            <input
                                type="text"
                                value={supSales}
                                onChange={(e) => setSupSales(e.target.value)}
                                placeholder="Nama Sales"
                                className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">No. WhatsApp Sales</label>
                            <input
                                type="text"
                                value={supPhone}
                                onChange={(e) => setSupPhone(e.target.value)}
                                placeholder="0812xxxxxxxx"
                                className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Term of Payment (Hari)</label>
                            <input
                                type="number"
                                value={supTop}
                                onChange={(e) => setSupTop(e.target.value)}
                                className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                            >
                                + Tambah Supplier Baru
                            </button>
                        </div>
                    </form>

                    <div className="space-y-2.5">
                        {suppliers.map((s) => (
                            <div
                                key={s.id}
                                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-emerald-400">{s.code}</span>
                                        <h4 className="font-bold text-sm text-white">{s.name}</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Sales: {s.sales_name || '-'} • WA: {s.phone || '-'} • TOP: {s.top_days} Hari
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 block">
                                        {s.products_count || 0} Produk Terhubung
                                    </span>
                                    {s.phone && (
                                        <a
                                            href={`https://wa.me/${s.phone.replace(/^0/, '62')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1"
                                        >
                                            <Phone className="w-3 h-3" /> Chat Sales WA
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DATABASE PELANGGAN & KONFIGURASI WHATSAPP GATEWAY */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Database Pelanggan */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                            <Users className="w-5 h-5 text-emerald-400" />
                            Database Pelanggan & Limit Piutang
                        </h3>
                        <form onSubmit={handleSaveCustomer} className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    required
                                    value={custName}
                                    onChange={(e) => setCustName(e.target.value)}
                                    placeholder="Nama Pelanggan / Warung"
                                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                />
                                <input
                                    type="text"
                                    value={custWa}
                                    onChange={(e) => setCustWa(e.target.value)}
                                    placeholder="No. WA (0812xxx)"
                                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={custLimit}
                                    onChange={(e) => setCustLimit(e.target.value)}
                                    placeholder="Limit Piutang (Rp)"
                                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                                >
                                    + Simpan
                                </button>
                            </div>
                        </form>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {customers.map((c) => (
                                <div
                                    key={c.id}
                                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs"
                                >
                                    <div>
                                        <p className="font-semibold text-white">{c.name}</p>
                                        <p className="text-slate-400 font-mono">{c.whatsapp}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-amber-400 font-bold block">
                                            Piutang: {formatRp(c.current_receivable)}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            Limit: {formatRp(c.credit_limit)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pengaturan Toko & WhatsApp Gateway */}
                    <form
                        onSubmit={handleSaveSettings}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3"
                    >
                        <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                            <Settings className="w-5 h-5 text-emerald-400" />
                            Pengaturan Struk & WhatsApp Gateway
                        </h3>
                        <div>
                            <label className="text-xs text-slate-400">Nama Toko</label>
                            <input
                                type="text"
                                value={formSettings.store_name}
                                onChange={(e) => setFormSettings({ ...formSettings, store_name: e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Alamat & Kontak Struk</label>
                            <input
                                type="text"
                                value={formSettings.store_address}
                                onChange={(e) => setFormSettings({ ...formSettings, store_address: e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">
                                Token API WhatsApp Gateway (Fonnte / Wablas - Opsional)
                            </label>
                            <input
                                type="text"
                                value={formSettings.wa_gateway_token}
                                onChange={(e) => setFormSettings({ ...formSettings, wa_gateway_token: e.target.value })}
                                placeholder="Isi Token Fonnte untuk kirim WA otomatis tanpa klik..."
                                className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> Simpan Pengaturan
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
