import React, { useState, useEffect, useRef } from 'react';
import {
    ClipboardCheck, History, Barcode, Search, CheckCircle2,
    AlertTriangle, ArrowRight, Save, Printer, Plus, Minus, RefreshCw, Eye, Filter
} from 'lucide-react';
import { formatRp, apiFetch } from '../utils/format';

export default function StockOpnameTab({ products, categories, stockOpnames = [], onRefresh, notify }) {
    const [subMode, setSubMode] = useState('worksheet'); // 'worksheet' | 'history'
    const [opnameRows, setOpnameRows] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterDiffOnly, setFilterDiffOnly] = useState('ALL'); // 'ALL' | 'DIFF' | 'DEFICIT' | 'SURPLUS'
    const [scanBarcodeInput, setScanBarcodeInput] = useState('');
    const [auditorName, setAuditorName] = useState('Admin Gudang');
    const [opnameNotes, setOpnameNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State untuk Laporan History Stok Opname
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [historyShowDiffOnly, setHistoryShowDiffOnly] = useState(false);

    const scanInputRef = useRef(null);

    // Inisialisasi baris lembar kerja stok opname dari data produk saat ini
    useEffect(() => {
        setOpnameRows(
            products.map((p) => ({
                product_id: p.id,
                barcode: p.barcode,
                sku: p.sku,
                name: p.name,
                category_id: p.category_id,
                category_name: p.category?.name || 'Umum',
                base_unit: p.base_unit,
                cost_price: Number(p.cost_price || 0),
                system_stock: Number(p.stock || 0), // Data Stok Lama
                physical_stock: Number(p.stock || 0), // Data Stok Baru (default sama dengan stok lama)
                reason: '',
            }))
        );
    }, [products]);

    useEffect(() => {
        if (stockOpnames.length > 0 && !selectedHistory) {
            setSelectedHistory(stockOpnames[0]);
        }
    }, [stockOpnames, selectedHistory]);

    const handlePhysicalStockChange = (productId, newPhysicalValue) => {
        const val = newPhysicalValue === '' ? '' : Math.max(0, Number(newPhysicalValue));
        setOpnameRows((prev) =>
            prev.map((row) => {
                if (row.product_id !== productId) return row;
                const numVal = val === '' ? 0 : val;
                const diff = numVal - row.system_stock;
                let autoReason = row.reason;
                if (diff === 0) autoReason = 'Sesuai / Cocok';
                else if (diff < 0 && (!autoReason || autoReason === 'Sesuai / Cocok')) {
                    autoReason = 'Selisih Kurang / Susut';
                } else if (diff > 0 && (!autoReason || autoReason === 'Sesuai / Cocok')) {
                    autoReason = 'Selisih Lebih';
                }
                return {
                    ...row,
                    physical_stock: val,
                    reason: autoReason,
                };
            })
        );
    };

    const handleReasonChange = (productId, reason) => {
        setOpnameRows((prev) =>
            prev.map((row) => (row.product_id === productId ? { ...row, reason } : row))
        );
    };

    const handleBarcodeScanOpname = (e) => {
        e.preventDefault();
        const code = scanBarcodeInput.trim();
        if (!code) return;

        const found = opnameRows.find(
            (r) =>
                r.barcode.toLowerCase() === code.toLowerCase() ||
                (r.sku && r.sku.toLowerCase() === code.toLowerCase())
        );

        if (found) {
            setSearch(found.barcode);
            setScanBarcodeInput('');
            notify(`Produk ditemukan: ${found.name} (Stok Lama: ${found.system_stock} ${found.base_unit})`);
        } else {
            notify(`Barcode "${code}" tidak ditemukan di daftar produk toko`, 'error');
        }
    };

    // Kalkulasi Real-Time Perbandingan Data Lama vs Data Baru
    const summary = opnameRows.reduce(
        (acc, r) => {
            const phys = Number(r.physical_stock || 0);
            const sys = Number(r.system_stock || 0);
            const diffQty = phys - sys;
            const diffVal = diffQty * r.cost_price;

            acc.totalItems++;
            if (Math.abs(diffQty) < 0.001) {
                acc.matchedCount++;
            } else if (diffQty > 0) {
                acc.surplusCount++;
                acc.surplusQty += diffQty;
                acc.surplusVal += diffVal;
            } else {
                acc.deficitCount++;
                acc.deficitQty += Math.abs(diffQty);
                acc.deficitVal += Math.abs(diffVal);
            }
            acc.netVal += diffVal;
            return acc;
        },
        {
            totalItems: 0,
            matchedCount: 0,
            surplusCount: 0,
            surplusQty: 0,
            surplusVal: 0,
            deficitCount: 0,
            deficitQty: 0,
            deficitVal: 0,
            netVal: 0,
        }
    );

    const filteredWorksheetRows = opnameRows.filter((r) => {
        const matchCat = filterCategory === 'ALL' || String(r.category_id) === String(filterCategory);
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            r.name.toLowerCase().includes(q) ||
            r.barcode.toLowerCase().includes(q) ||
            (r.sku && r.sku.toLowerCase().includes(q));

        const diff = Number(r.physical_stock || 0) - Number(r.system_stock || 0);
        let matchDiff = true;
        if (filterDiffOnly === 'DIFF') matchDiff = Math.abs(diff) >= 0.001;
        else if (filterDiffOnly === 'DEFICIT') matchDiff = diff < 0;
        else if (filterDiffOnly === 'SURPLUS') matchDiff = diff > 0;

        return matchCat && matchSearch && matchDiff;
    });

    const handleSubmitOpname = async (e) => {
        e.preventDefault();
        if (opnameRows.length === 0) return;

        setIsSubmitting(true);
        try {
            const res = await apiFetch('/api/pos/stock-opnames', {
                method: 'POST',
                body: JSON.stringify({
                    auditor_name: auditorName,
                    notes: opnameNotes || 'Pemeriksaan & penyesuaian stok opname toko',
                    items: opnameRows.map((r) => ({
                        product_id: r.product_id,
                        physical_stock: Number(r.physical_stock || 0),
                        reason: r.reason || null,
                    })),
                }),
            });

            notify(res.message);
            setSelectedHistory(res.stock_opname);
            setSubMode('history');
            setOpnameNotes('');
            onRefresh();
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header & Switcher Mode: Lembar Kerja vs Laporan History */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        Stok Opname & Laporan Riwayat Selisih Stok
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Sandingkan stok lama (sistem) dengan stok baru (fisik), perbarui stok otomatis, dan pantau histori selisih
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <button
                        type="button"
                        onClick={() => setSubMode('worksheet')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            subMode === 'worksheet'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Input Stok Opname</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSubMode('history')}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            subMode === 'history'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        <span>History & Laporan ({stockOpnames.length})</span>
                    </button>
                </div>
            </div>

            {subMode === 'worksheet' ? (
                <>
                    {/* 4 Kartu Ringkasan Sandingan Data Lama vs Data Baru */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
                            <span className="text-[11px] sm:text-xs text-slate-400">Stok Cocok (Sesuai)</span>
                            <div className="text-lg sm:text-2xl font-extrabold text-white mt-0.5">
                                {summary.matchedCount} / {summary.totalItems} SKU
                            </div>
                            <span className="text-[11px] text-emerald-400 font-semibold">
                                Data Lama = Data Baru
                            </span>
                        </div>

                        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
                            <span className="text-[11px] sm:text-xs text-slate-400">Selisih Lebih (+Surplus)</span>
                            <div className="text-lg sm:text-2xl font-extrabold text-emerald-400 mt-0.5">
                                +{summary.surplusQty} Unit
                            </div>
                            <span className="text-[11px] text-emerald-300">
                                {summary.surplusCount} SKU (+{formatRp(summary.surplusVal)})
                            </span>
                        </div>

                        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-rose-500/30">
                            <span className="text-[11px] sm:text-xs text-rose-300">Selisih Kurang (-Susut/Hilang)</span>
                            <div className="text-lg sm:text-2xl font-extrabold text-rose-400 mt-0.5">
                                -{summary.deficitQty} Unit
                            </div>
                            <span className="text-[11px] text-rose-300">
                                {summary.deficitCount} SKU (-{formatRp(summary.deficitVal)})
                            </span>
                        </div>

                        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-amber-500/30">
                            <span className="text-[11px] sm:text-xs text-amber-300">Dampak Nilai Aset (HPP)</span>
                            <div
                                className={`text-lg sm:text-2xl font-extrabold mt-0.5 ${
                                    summary.netVal < 0
                                        ? 'text-rose-400'
                                        : summary.netVal > 0
                                        ? 'text-emerald-400'
                                        : 'text-white'
                                }`}
                            >
                                {summary.netVal >= 0 ? `+${formatRp(summary.netVal)}` : `-${formatRp(Math.abs(summary.netVal))}`}
                            </div>
                            <span className="text-[11px] text-slate-400">Selisih Qty × Harga Beli</span>
                        </div>
                    </div>

                    {/* Panel Form Finalisasi & Filter Lembar Kerja */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                        {/* Form Petugas, Catatan & Tombol Ganti Data Lama dengan Data Baru */}
                        <form
                            onSubmit={handleSubmitOpname}
                            className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                        >
                            <div className="md:col-span-3">
                                <label className="text-[11px] text-slate-400">Nama Pemeriksa / Auditor</label>
                                <input
                                    type="text"
                                    required
                                    value={auditorName}
                                    onChange={(e) => setAuditorName(e.target.value)}
                                    placeholder="Nama Pemeriksa"
                                    className="w-full mt-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white"
                                />
                            </div>
                            <div className="md:col-span-5">
                                <label className="text-[11px] text-slate-400">Catatan Sesi Stok Opname</label>
                                <input
                                    type="text"
                                    value={opnameNotes}
                                    onChange={(e) => setOpnameNotes(e.target.value)}
                                    placeholder="Contoh: Stok Opname Rutin Akhir Pekan / Cek Rak Depan"
                                    className="w-full mt-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                />
                            </div>
                            <div className="md:col-span-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSubmitting
                                        ? 'Memproses Opname...'
                                        : 'Simpan & Ganti Stok Lama → Baru'}
                                </button>
                            </div>
                        </form>

                        {/* Bar Scan Barcode, Pencarian, dan Filter Selisih */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <form onSubmit={handleBarcodeScanOpname} className="sm:col-span-4 flex gap-1.5">
                                <div className="relative flex-1">
                                    <Barcode className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        ref={scanInputRef}
                                        type="text"
                                        value={scanBarcodeInput}
                                        onChange={(e) => setScanBarcodeInput(e.target.value)}
                                        placeholder="Scan barcode barang..."
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs font-mono text-white"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl text-xs cursor-pointer"
                                >
                                    Cari
                                </button>
                            </form>

                            <div className="relative sm:col-span-3">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Filter nama / barcode..."
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                >
                                    <option value="ALL">Semua Kategori</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-3">
                                <select
                                    value={filterDiffOnly}
                                    onChange={(e) => setFilterDiffOnly(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                >
                                    <option value="ALL">Tampilkan Semua ({opnameRows.length})</option>
                                    <option value="DIFF">
                                        ⚠️ Hanya yang Selisih ({summary.surplusCount + summary.deficitCount})
                                    </option>
                                    <option value="DEFICIT">❌ Selisih Kurang ({summary.deficitCount})</option>
                                    <option value="SURPLUS">➕ Selisih Lebih ({summary.surplusCount})</option>
                                </select>
                            </div>
                        </div>

                        {/* TAMPILAN KARTU SANDINGAN DATA LAMA VS DATA BARU (KHUSUS HP / MOBILE) */}
                        <div className="md:hidden space-y-3">
                            {filteredWorksheetRows.map((row) => {
                                const phys = Number(row.physical_stock || 0);
                                const sys = Number(row.system_stock || 0);
                                const diffQty = phys - sys;
                                const diffVal = diffQty * row.cost_price;

                                return (
                                    <div
                                        key={row.product_id}
                                        className={`p-3.5 rounded-2xl bg-slate-950 border space-y-3 ${
                                            diffQty < 0
                                                ? 'border-rose-500/50'
                                                : diffQty > 0
                                                ? 'border-emerald-500/50'
                                                : 'border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="font-mono text-[11px] text-emerald-400">
                                                    {row.barcode}
                                                </span>
                                                <h4 className="font-bold text-sm text-white">{row.name}</h4>
                                                <span className="text-[11px] text-slate-400">
                                                    HPP: {formatRp(row.cost_price)} / {row.base_unit}
                                                </span>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${
                                                    diffQty === 0
                                                        ? 'bg-slate-800 text-slate-300'
                                                        : diffQty > 0
                                                        ? 'bg-emerald-500/20 text-emerald-300'
                                                        : 'bg-rose-500/20 text-rose-300'
                                                }`}
                                            >
                                                {diffQty === 0
                                                    ? 'Cocok (0)'
                                                    : diffQty > 0
                                                    ? `+${diffQty} ${row.base_unit}`
                                                    : `${diffQty} ${row.base_unit}`}
                                            </span>
                                        </div>

                                        {/* Sandingan Data Lama vs Input Data Baru */}
                                        <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 items-center">
                                            <div>
                                                <span className="text-[10px] text-slate-400 block">
                                                    Data Stok Lama (Sistem)
                                                </span>
                                                <span className="text-base font-extrabold text-slate-200">
                                                    {row.system_stock} {row.base_unit}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-emerald-400 font-bold block mb-1">
                                                    Data Stok Baru (Fisik)
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePhysicalStockChange(
                                                                row.product_id,
                                                                Math.max(0, phys - 1)
                                                            )
                                                        }
                                                        className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={row.physical_stock}
                                                        onChange={(e) =>
                                                            handlePhysicalStockChange(
                                                                row.product_id,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-16 text-center py-1.5 bg-slate-950 border border-emerald-500 rounded-lg text-xs font-extrabold text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePhysicalStockChange(row.product_id, phys + 1)
                                                        }
                                                        className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {diffQty !== 0 && (
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <span
                                                    className={`text-xs font-bold ${
                                                        diffVal < 0 ? 'text-rose-400' : 'text-emerald-400'
                                                    }`}
                                                >
                                                    Nilai Selisih:{' '}
                                                    {diffVal >= 0
                                                        ? `+${formatRp(diffVal)}`
                                                        : `-${formatRp(Math.abs(diffVal))}`}
                                                </span>
                                                <select
                                                    value={row.reason}
                                                    onChange={(e) =>
                                                        handleReasonChange(row.product_id, e.target.value)
                                                    }
                                                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                                >
                                                    <option value="Selisih Kurang / Susut">
                                                        Selisih Kurang / Susut
                                                    </option>
                                                    <option value="Barang Rusak / Expired">
                                                        Barang Rusak / Expired
                                                    </option>
                                                    <option value="Selisih Lebih">Selisih Lebih</option>
                                                    <option value="Bonus / Lebih Kirim Supplier">
                                                        Bonus / Lebih Kirim
                                                    </option>
                                                    <option value="Koreksi Salah Input">
                                                        Koreksi Salah Input
                                                    </option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* TABEL SANDINGAN DATA LAMA VS DATA BARU (DESKTOP) */}
                        <div className="hidden md:block overflow-x-auto border border-slate-800 rounded-xl">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <th className="p-3.5">Barcode & Nama Produk</th>
                                        <th className="p-3.5">Harga Beli (HPP)</th>
                                        <th className="p-3.5 text-center">Data Stok Lama (Sistem)</th>
                                        <th className="p-3.5 text-center">Data Stok Baru (Fisik)</th>
                                        <th className="p-3.5 text-center">Selisih Qty (Baru - Lama)</th>
                                        <th className="p-3.5">Nilai Selisih (Rp)</th>
                                        <th className="p-3.5">Alasan / Keterangan Selisih</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/70">
                                    {filteredWorksheetRows.map((row) => {
                                        const phys = Number(row.physical_stock || 0);
                                        const sys = Number(row.system_stock || 0);
                                        const diffQty = phys - sys;
                                        const diffVal = diffQty * row.cost_price;

                                        return (
                                            <tr
                                                key={row.product_id}
                                                className={`hover:bg-slate-950/60 ${
                                                    diffQty < 0
                                                        ? 'bg-rose-950/20'
                                                        : diffQty > 0
                                                        ? 'bg-emerald-950/20'
                                                        : ''
                                                }`}
                                            >
                                                <td className="p-3.5">
                                                    <div className="font-mono text-[11px] text-emerald-400">
                                                        {row.barcode}
                                                    </div>
                                                    <div className="font-bold text-sm text-white">{row.name}</div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {row.category_name}
                                                    </div>
                                                </td>

                                                <td className="p-3.5 font-semibold text-slate-300">
                                                    {formatRp(row.cost_price)} / {row.base_unit}
                                                </td>

                                                {/* Data Stok Lama */}
                                                <td className="p-3.5 text-center">
                                                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-bold text-sm">
                                                        {row.system_stock} {row.base_unit}
                                                    </span>
                                                </td>

                                                {/* Input Data Stok Baru (Fisik) */}
                                                <td className="p-3.5">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handlePhysicalStockChange(
                                                                    row.product_id,
                                                                    Math.max(0, phys - 1)
                                                                )
                                                            }
                                                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={row.physical_stock}
                                                            onChange={(e) =>
                                                                handlePhysicalStockChange(
                                                                    row.product_id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-20 text-center py-1.5 bg-slate-950 border border-emerald-500/60 rounded-lg text-sm font-extrabold text-white"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handlePhysicalStockChange(
                                                                    row.product_id,
                                                                    phys + 1
                                                                )
                                                            }
                                                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Selisih Qty */}
                                                <td className="p-3.5 text-center">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full font-extrabold text-xs ${
                                                            diffQty === 0
                                                                ? 'bg-slate-800 text-slate-400'
                                                                : diffQty > 0
                                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                        }`}
                                                    >
                                                        {diffQty === 0
                                                            ? '0 (Sesuai)'
                                                            : diffQty > 0
                                                            ? `+${diffQty} ${row.base_unit}`
                                                            : `${diffQty} ${row.base_unit}`}
                                                    </span>
                                                </td>

                                                {/* Nilai Selisih Rupiah */}
                                                <td className="p-3.5 font-bold">
                                                    {diffQty === 0 ? (
                                                        <span className="text-slate-500">Rp 0</span>
                                                    ) : diffVal > 0 ? (
                                                        <span className="text-emerald-400">
                                                            +{formatRp(diffVal)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-400">
                                                            -{formatRp(Math.abs(diffVal))}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Alasan Selisih */}
                                                <td className="p-3.5">
                                                    <select
                                                        value={
                                                            row.reason ||
                                                            (diffQty === 0
                                                                ? 'Sesuai / Cocok'
                                                                : diffQty < 0
                                                                ? 'Selisih Kurang / Susut'
                                                                : 'Selisih Lebih')
                                                        }
                                                        onChange={(e) =>
                                                            handleReasonChange(row.product_id, e.target.value)
                                                        }
                                                        className="w-44 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                                                    >
                                                        <option value="Sesuai / Cocok">✅ Sesuai / Cocok</option>
                                                        <option value="Selisih Kurang / Susut">
                                                            ⚠️ Selisih Kurang / Susut
                                                        </option>
                                                        <option value="Barang Rusak / Expired">
                                                            🗑️ Barang Rusak / Expired
                                                        </option>
                                                        <option value="Selisih Lebih">➕ Selisih Lebih</option>
                                                        <option value="Bonus / Lebih Kirim Supplier">
                                                            🎁 Bonus / Lebih Kirim
                                                        </option>
                                                        <option value="Koreksi Salah Input">
                                                            ✏️ Koreksi Salah Input
                                                        </option>
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                /* MODE 2: LAPORAN HISTORY STOK OPNAME & CEK DATA SELISIH */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* KIRI: Daftar Sesi History Stok Opname */}
                    <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                            <History className="w-4 h-4 text-emerald-400" />
                            Riwayat Sesi Stok Opname ({stockOpnames.length})
                        </h3>

                        {stockOpnames.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs">
                                Belum ada riwayat stok opname. Silakan lakukan stok opname di tab "Input Stok Opname".
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                                {stockOpnames.map((so) => {
                                    const isSelected = selectedHistory?.id === so.id;
                                    const diffCount =
                                        (so.total_items_checked || 0) - (so.total_matched || 0);
                                    return (
                                        <button
                                            key={so.id}
                                            type="button"
                                            onClick={() => setSelectedHistory(so)}
                                            className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer ${
                                                isSelected
                                                    ? 'bg-emerald-950/40 border-emerald-500'
                                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-xs text-emerald-400">
                                                    {so.reference_number}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {so.opname_date}
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-white mt-1">
                                                Pemeriksa: {so.auditor_name}
                                            </p>
                                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                {so.notes}
                                            </p>
                                            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                                                <span className="text-slate-300">
                                                    {so.total_items_checked} SKU ({diffCount} Selisih)
                                                </span>
                                                <span
                                                    className={`font-bold ${
                                                        so.net_value_difference < 0
                                                            ? 'text-rose-400'
                                                            : so.net_value_difference > 0
                                                            ? 'text-emerald-400'
                                                            : 'text-slate-300'
                                                    }`}
                                                >
                                                    {so.net_value_difference >= 0
                                                        ? `+${formatRp(so.net_value_difference)}`
                                                        : `-${formatRp(Math.abs(so.net_value_difference))}`}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* KANAN: Detail Laporan Selisih (Data Lama vs Data Baru) */}
                    <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
                        {!selectedHistory ? (
                            <div className="text-center py-16 text-slate-400 text-sm">
                                Pilih salah satu riwayat stok opname di sebelah kiri untuk melihat rincian perbandingan data lama vs data baru.
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-sm text-emerald-400">
                                                {selectedHistory.reference_number}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                • {selectedHistory.opname_date} • Oleh:{' '}
                                                <strong className="text-white">
                                                    {selectedHistory.auditor_name}
                                                </strong>
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-300 mt-1">
                                            Catatan: {selectedHistory.notes || '-'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-1.5 text-xs text-amber-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={historyShowDiffOnly}
                                                onChange={(e) => setHistoryShowDiffOnly(e.target.checked)}
                                                className="rounded text-emerald-500"
                                            />
                                            Hanya Tampilkan yang Selisih
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Cetak
                                        </button>
                                    </div>
                                </div>

                                {/* Ringkasan Angka Sesi Opname Ini */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-slate-400 block">Item Cocok</span>
                                        <span className="text-sm font-extrabold text-white">
                                            {selectedHistory.total_matched} /{' '}
                                            {selectedHistory.total_items_checked} SKU
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-slate-400 block">Total Selisih Lebih</span>
                                        <span className="text-sm font-extrabold text-emerald-400">
                                            +{selectedHistory.total_surplus_qty} (+
                                            {formatRp(selectedHistory.total_surplus_value)})
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-slate-400 block">Total Selisih Kurang</span>
                                        <span className="text-sm font-extrabold text-rose-400">
                                            -{selectedHistory.total_deficit_qty} (-
                                            {formatRp(selectedHistory.total_deficit_value)})
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-slate-400 block">Selisih Bersih (HPP)</span>
                                        <span
                                            className={`text-sm font-extrabold ${
                                                selectedHistory.net_value_difference < 0
                                                    ? 'text-rose-400'
                                                    : 'text-emerald-400'
                                            }`}
                                        >
                                            {selectedHistory.net_value_difference >= 0
                                                ? `+${formatRp(selectedHistory.net_value_difference)}`
                                                : `-${formatRp(Math.abs(selectedHistory.net_value_difference))}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Tabel Rincian Perbandingan Data Lama vs Data Baru */}
                                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                                <th className="p-3">Produk & Barcode</th>
                                                <th className="p-3 text-center">Stok Lama</th>
                                                <th className="p-3 text-center">Stok Baru</th>
                                                <th className="p-3 text-center">Selisih Qty</th>
                                                <th className="p-3">Selisih Rupiah</th>
                                                <th className="p-3">Keterangan / Alasan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {(selectedHistory.items || [])
                                                .filter((item) =>
                                                    historyShowDiffOnly
                                                        ? Math.abs(Number(item.difference_qty)) >= 0.001
                                                        : true
                                                )
                                                .map((item) => {
                                                    const diff = Number(item.difference_qty || 0);
                                                    const diffVal = Number(item.difference_value || 0);
                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className={
                                                                diff < 0
                                                                    ? 'bg-rose-950/20'
                                                                    : diff > 0
                                                                    ? 'bg-emerald-950/20'
                                                                    : ''
                                                            }
                                                        >
                                                            <td className="p-3">
                                                                <div className="font-mono text-[10px] text-emerald-400">
                                                                    {item.barcode}
                                                                </div>
                                                                <div className="font-bold text-white">
                                                                    {item.product_name}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400">
                                                                    HPP: {formatRp(item.cost_price)}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center font-semibold text-slate-300">
                                                                {item.system_stock} {item.unit_name}
                                                            </td>
                                                            <td className="p-3 text-center font-extrabold text-white">
                                                                {item.physical_stock} {item.unit_name}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <span
                                                                    className={`px-2.5 py-0.5 rounded-full font-extrabold ${
                                                                        diff === 0
                                                                            ? 'bg-slate-800 text-slate-400'
                                                                            : diff > 0
                                                                            ? 'bg-emerald-500/20 text-emerald-300'
                                                                            : 'bg-rose-500/20 text-rose-300'
                                                                    }`}
                                                                >
                                                                    {diff === 0
                                                                        ? '0'
                                                                        : diff > 0
                                                                        ? `+${diff}`
                                                                        : diff}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 font-bold">
                                                                {diffVal === 0 ? (
                                                                    <span className="text-slate-500">Rp 0</span>
                                                                ) : diffVal > 0 ? (
                                                                    <span className="text-emerald-400">
                                                                        +{formatRp(diffVal)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-rose-400">
                                                                        -{formatRp(Math.abs(diffVal))}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-slate-300">
                                                                {item.reason || '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
