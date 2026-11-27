import React, { useState } from 'react';
import {
    Package, Search, AlertTriangle, PlusCircle, Trash2,
    Barcode, Layers, ClipboardCheck
} from 'lucide-react';
import { formatRp, calculateSellingPrice, apiFetch } from '../utils/format';

export default function InventoryStockTab({
    products,
    categories,
    suppliers,
    onRefresh,
    onGoToScanTab,
    onGoToBulkEdit,
    onGoToStockOpname,
    notify,
}) {
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterStockStatus, setFilterStockStatus] = useState('ALL'); // ALL, LOW, OUT, SAFE

    // Modal Quick Restock / Edit Barang
    const [editingProduct, setEditingProduct] = useState(null);
    const [addStockQty, setAddStockQty] = useState(0);
    const [stockMode, setStockMode] = useState('add'); // 'add' | 'set'
    const [costPrice, setCostPrice] = useState(0);
    const [markupType, setMarkupType] = useState('percentage');
    const [markupValue, setMarkupValue] = useState(15);
    const [sellingPrice, setSellingPrice] = useState(0);

    // Kalkulasi Ringkasan Aset Inventaris
    const totalSku = products.length;
    const totalUnits = products.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const totalAssetCost = products.reduce(
        (acc, p) => acc + Math.max(0, Number(p.stock || 0)) * Number(p.cost_price || 0),
        0
    );
    const totalAssetRevenue = products.reduce(
        (acc, p) => acc + Math.max(0, Number(p.stock || 0)) * Number(p.selling_price || 0),
        0
    );
    const potentialProfit = Math.max(0, totalAssetRevenue - totalAssetCost);
    const lowStockProducts = products.filter((p) => Number(p.stock) <= Number(p.min_stock_alert || 5));

    const filteredProducts = products.filter((p) => {
        const matchCat = filterCategory === 'ALL' || String(p.category_id) === String(filterCategory);
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            p.name.toLowerCase().includes(q) ||
            p.barcode.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q));

        let matchStatus = true;
        if (filterStockStatus === 'LOW') {
            matchStatus = Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock_alert || 5);
        } else if (filterStockStatus === 'OUT') {
            matchStatus = Number(p.stock) <= 0;
        } else if (filterStockStatus === 'SAFE') {
            matchStatus = Number(p.stock) > Number(p.min_stock_alert || 5);
        }

        return matchCat && matchSearch && matchStatus;
    });

    const openQuickRestock = (product) => {
        setEditingProduct(product);
        setAddStockQty(12);
        setStockMode('add');
        setCostPrice(product.cost_price);
        setMarkupType(product.markup_type || 'percentage');
        setMarkupValue(product.markup_value || 0);
        setSellingPrice(product.selling_price);
    };

    const handleSaveQuickRestock = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            const res = await apiFetch('/api/pos/products/scan-save', {
                method: 'POST',
                body: JSON.stringify({
                    barcode: editingProduct.barcode,
                    name: editingProduct.name,
                    category_id: editingProduct.category_id,
                    supplier_id: editingProduct.supplier_id,
                    base_unit: editingProduct.base_unit,
                    cost_price: Number(costPrice),
                    markup_type: markupType,
                    markup_value: Number(markupValue),
                    auto_round: editingProduct.auto_round,
                    selling_price: Number(sellingPrice),
                    wholesale_min_qty: editingProduct.wholesale_min_qty,
                    wholesale_price: editingProduct.wholesale_price,
                    stock_input: Number(addStockQty),
                    stock_mode: stockMode,
                }),
            });
            notify(res.message);
            setEditingProduct(null);
            onRefresh();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleDeleteProduct = async (product) => {
        if (!window.confirm(`Hapus produk "${product.name}" dari inventaris?`)) return;
        try {
            const res = await apiFetch(`/api/pos/products/${product.id}`, {
                method: 'DELETE',
            });
            notify(res.message);
            onRefresh();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header & Tombol Pintas */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-400 shrink-0" />
                        Stok & Inventaris Barang
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Pantau sisa stok real-time, nilai aset modal (HPP), dan restock cepat
                    </p>
                </div>
                <div className="grid grid-cols-3 sm:flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onGoToScanTab}
                        className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                    >
                        <Barcode className="w-4 h-4" /> + Scan Barang
                    </button>
                    <button
                        type="button"
                        onClick={onGoToStockOpname}
                        className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                    >
                        <ClipboardCheck className="w-4 h-4" /> Stok Opname
                    </button>
                    <button
                        type="button"
                        onClick={onGoToBulkEdit}
                        className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                        <Layers className="w-4 h-4 text-amber-400" /> Edit Masal
                    </button>
                </div>
            </div>

            {/* 4 Kartu Ringkasan Aset & Stok (2x2 Grid di HP) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] sm:text-xs text-slate-400">Total Produk & Fisik</span>
                    <div className="text-lg sm:text-2xl font-extrabold text-white mt-0.5">{totalSku} SKU</div>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                        {totalUnits.toLocaleString('id-ID')} Unit
                    </span>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] sm:text-xs text-slate-400">Modal Stok (HPP)</span>
                    <div className="text-lg sm:text-2xl font-extrabold text-amber-400 mt-0.5 truncate">
                        {formatRp(totalAssetCost)}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-400">Stok × Harga Beli</span>
                </div>

                <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-emerald-500/30">
                    <span className="text-[11px] sm:text-xs text-emerald-300">Nilai Jual Stok</span>
                    <div className="text-lg sm:text-2xl font-extrabold text-emerald-400 mt-0.5 truncate">
                        {formatRp(totalAssetRevenue)}
                    </div>
                    <span className="text-[10px] sm:text-xs text-emerald-300 font-semibold">
                        Laba: +{formatRp(potentialProfit)}
                    </span>
                </div>

                <div
                    onClick={() => setFilterStockStatus(filterStockStatus === 'LOW' ? 'ALL' : 'LOW')}
                    className={`p-3.5 sm:p-5 rounded-2xl border transition cursor-pointer ${
                        lowStockProducts.length > 0
                            ? 'bg-rose-950/30 border-rose-500/40'
                            : 'bg-slate-900 border-slate-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs text-rose-300 font-semibold">Stok Menipis</span>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-lg sm:text-2xl font-extrabold text-rose-400 mt-0.5">
                        {lowStockProducts.length} Item
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-rose-300 underline">
                        Tap untuk filter
                    </span>
                </div>
            </div>

            {/* Filter & Daftar Inventaris */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <div className="relative sm:col-span-2">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama barang, barcode, atau kode SKU..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    >
                        <option value="ALL">Semua Kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterStockStatus}
                        onChange={(e) => setFilterStockStatus(e.target.value)}
                        className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    >
                        <option value="ALL">Semua Status Stok ({products.length})</option>
                        <option value="SAFE">✅ Stok Aman</option>
                        <option value="LOW">⚠️ Stok Menipis</option>
                        <option value="OUT">❌ Stok Habis (0)</option>
                    </select>
                </div>

                {/* TAMPILAN KARTU KHUSUS MOBILE (HP) */}
                <div className="md:hidden space-y-3">
                    {filteredProducts.map((p) => {
                        const isLow = Number(p.stock) <= Number(p.min_stock_alert || 5);
                        const isOut = Number(p.stock) <= 0;
                        const unitProfit = Number(p.selling_price) - Number(p.cost_price);

                        return (
                            <div
                                key={p.id}
                                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-mono text-xs text-emerald-400 font-semibold">
                                                {p.barcode}
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                                                {p.category?.name || 'Umum'}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm text-white mt-1">{p.name}</h4>
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full font-extrabold text-xs shrink-0 ${
                                            isOut
                                                ? 'bg-rose-600 text-white'
                                                : isLow
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                    >
                                        {p.stock} {p.base_unit}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Harga Beli</span>
                                        <span className="font-semibold text-slate-200">{formatRp(p.cost_price)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Markup</span>
                                        <span className="font-bold text-amber-400">
                                            {p.markup_type === 'percentage'
                                                ? `+${p.markup_value}%`
                                                : `+${formatRp(p.markup_value)}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Harga Jual</span>
                                        <span className="font-extrabold text-emerald-400">
                                            {formatRp(p.selling_price)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[11px] text-slate-400">
                                        Laba/unit: <strong className="text-emerald-400">+{formatRp(unitProfit)}</strong>
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openQuickRestock(p)}
                                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" /> Restock / Harga
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteProduct(p)}
                                            className="p-2 bg-slate-800 text-rose-400 rounded-xl cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* TAMPILAN TABEL LENGKAP UNTUK DESKTOP */}
                <div className="hidden md:block overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <th className="p-3.5">Barcode & Nama Barang</th>
                                <th className="p-3.5">Kategori & Supplier</th>
                                <th className="p-3.5 text-center">Sisa Stok Gudang</th>
                                <th className="p-3.5">Harga Beli (HPP)</th>
                                <th className="p-3.5">Markup</th>
                                <th className="p-3.5">Harga Jual & Grosir</th>
                                <th className="p-3.5">Nilai Aset (Stok×HPP)</th>
                                <th className="p-3.5 text-right">Aksi Cepat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                            {filteredProducts.map((p) => {
                                const isLow = Number(p.stock) <= Number(p.min_stock_alert || 5);
                                const isOut = Number(p.stock) <= 0;
                                const unitProfit = Number(p.selling_price) - Number(p.cost_price);
                                const assetValue = Math.max(0, Number(p.stock)) * Number(p.cost_price);

                                return (
                                    <tr key={p.id} className="hover:bg-slate-950/60">
                                        <td className="p-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-emerald-400 font-semibold">
                                                    {p.barcode}
                                                </span>
                                                {p.sku && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                                        {p.sku}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-bold text-sm text-white mt-0.5">{p.name}</div>
                                        </td>

                                        <td className="p-3.5">
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium">
                                                {p.category?.name || 'Umum'}
                                            </span>
                                            <div className="text-[11px] text-slate-400 mt-1">
                                                {p.supplier?.name || '-'}
                                            </div>
                                        </td>

                                        <td className="p-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-xs ${
                                                    isOut
                                                        ? 'bg-rose-600 text-white'
                                                        : isLow
                                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                }`}
                                            >
                                                {p.stock} {p.base_unit}
                                            </span>
                                        </td>

                                        <td className="p-3.5 font-semibold text-slate-200">
                                            {formatRp(p.cost_price)}
                                        </td>

                                        <td className="p-3.5">
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
                                                {p.markup_type === 'percentage'
                                                    ? `+${p.markup_value}%`
                                                    : `+${formatRp(p.markup_value)}`}
                                            </span>
                                            <div className="text-[11px] text-emerald-400 mt-1">
                                                Laba: +{formatRp(unitProfit)}/{p.base_unit}
                                            </div>
                                        </td>

                                        <td className="p-3.5">
                                            <div className="font-bold text-sm text-emerald-400">
                                                {formatRp(p.selling_price)}
                                            </div>
                                            {p.wholesale_min_qty && p.wholesale_price && (
                                                <div className="text-[11px] text-amber-300 mt-0.5">
                                                    Grosir ≥{p.wholesale_min_qty}: {formatRp(p.wholesale_price)}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3.5 font-bold text-white">{formatRp(assetValue)}</td>

                                        <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openQuickRestock(p)}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <PlusCircle className="w-3.5 h-3.5" /> Restock / Harga
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteProduct(p)}
                                                className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg inline-flex items-center cursor-pointer"
                                                title="Hapus Barang"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL QUICK RESTOCK & UPDATE HARGA/MARKUP (Slide-up di HP) */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <form
                        onSubmit={handleSaveQuickRestock}
                        className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                                <span className="font-mono text-xs text-emerald-400">{editingProduct.barcode}</span>
                                <h3 className="text-base font-bold text-white">{editingProduct.name}</h3>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-300">
                                Stok: <strong>{editingProduct.stock} {editingProduct.base_unit}</strong>
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400">Mode Stok</label>
                                <select
                                    value={stockMode}
                                    onChange={(e) => setStockMode(e.target.value)}
                                    className="w-full mt-1 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                                >
                                    <option value="add">Tambah Stok (+)</option>
                                    <option value="set">Set Stok Opname (=)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">
                                    Jumlah ({editingProduct.base_unit})
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={addStockQty}
                                    onChange={(e) => setAddStockQty(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-slate-950 border border-emerald-500 rounded-xl text-sm font-bold text-white"
                                />
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                            <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                    <label className="text-[11px] text-slate-400">Harga Beli</label>
                                    <input
                                        type="number"
                                        value={costPrice}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCostPrice(val);
                                            setSellingPrice(
                                                calculateSellingPrice(val, markupType, markupValue, true)
                                            );
                                        }}
                                        className="w-full mt-1 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400">Markup</label>
                                    <select
                                        value={markupType}
                                        onChange={(e) => {
                                            const t = e.target.value;
                                            setMarkupType(t);
                                            setSellingPrice(
                                                calculateSellingPrice(costPrice, t, markupValue, true)
                                            );
                                        }}
                                        className="w-full mt-1 px-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                    >
                                        <option value="percentage">% Persen</option>
                                        <option value="nominal">Rp Nominal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] text-slate-400">Nilai</label>
                                    <input
                                        type="number"
                                        value={markupValue}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setMarkupValue(v);
                                            setSellingPrice(
                                                calculateSellingPrice(costPrice, markupType, v, true)
                                            );
                                        }}
                                        className="w-full mt-1 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-amber-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-emerald-400">Harga Jual Baru (Rp)</label>
                                <input
                                    type="number"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-emerald-950/40 border border-emerald-500 rounded-xl text-base font-extrabold text-emerald-300"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
