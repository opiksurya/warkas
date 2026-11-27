import React, { useState, useEffect } from 'react';
import { Layers, Save, Search } from 'lucide-react';
import { formatRp, calculateSellingPrice, apiFetch } from '../utils/format';

export default function BulkEditTab({ products, categories, suppliers, onUpdated, notify }) {
    const [rows, setRows] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [isSaving, setIsSaving] = useState(false);

    // Panel Aksi Masal (Mass Markup / Mass Price Adjustment)
    const [bulkMarkupType, setBulkMarkupType] = useState('percentage');
    const [bulkMarkupValue, setBulkMarkupValue] = useState(15);
    const [bulkAutoRound, setBulkAutoRound] = useState(true);
    const [bulkSupplierId, setBulkSupplierId] = useState('');

    useEffect(() => {
        setRows(products.map((p) => ({ ...p })));
    }, [products]);

    const filteredRows = rows.filter((r) => {
        const matchCat = filterCategory === 'ALL' || String(r.category_id) === String(filterCategory);
        const q = search.toLowerCase();
        const matchSearch = !q || r.name.toLowerCase().includes(q) || r.barcode.toLowerCase().includes(q);
        return matchCat && matchSearch;
    });

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredRows.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredRows.map((r) => r.id));
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleRowChange = (id, field, value) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const updated = { ...row, [field]: value };

                if (['cost_price', 'markup_type', 'markup_value', 'auto_round'].includes(field)) {
                    updated.selling_price = calculateSellingPrice(
                        updated.cost_price,
                        updated.markup_type,
                        updated.markup_value,
                        updated.auto_round
                    );
                }
                return updated;
            })
        );
    };

    const handleSaveAllInline = async () => {
        setIsSaving(true);
        try {
            const res = await apiFetch('/api/pos/products/bulk-update', {
                method: 'POST',
                body: JSON.stringify({
                    mode: 'inline',
                    items: rows,
                }),
            });
            notify(res.message);
            onUpdated();
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleApplyBulkFormula = async () => {
        if (selectedIds.length === 0) {
            notify('Centang minimal 1 produk terlebih dahulu!', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await apiFetch('/api/pos/products/bulk-update', {
                method: 'POST',
                body: JSON.stringify({
                    mode: 'markup_formula',
                    product_ids: selectedIds,
                    markup_type: bulkMarkupType,
                    markup_value: Number(bulkMarkupValue),
                    auto_round: bulkAutoRound,
                    supplier_id: bulkSupplierId || null,
                }),
            });
            notify(`Berhasil menerapkan markup masal ke ${selectedIds.length} produk!`);
            setSelectedIds([]);
            onUpdated();
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-emerald-400 shrink-0" />
                            Edit Masal Harga, Markup (% / Rp) & Stok
                        </h2>
                        <p className="text-xs text-slate-400">
                            Ubah langsung pada kartu/tabel atau terapkan rumus markup masal
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveAllInline}
                        disabled={isSaving}
                        className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                    </button>
                </div>

                {/* Generator Markup Masal */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-emerald-500/30 grid grid-cols-2 md:grid-cols-6 gap-2.5 sm:gap-3 items-end">
                    <div className="col-span-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-300">
                                Rumus Markup Masal ({selectedIds.length} dipilih)
                            </span>
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="md:hidden text-[11px] text-amber-400 underline"
                            >
                                {selectedIds.length === filteredRows.length ? 'Batal Pilih' : 'Pilih Semua'}
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Otomatis hitung Harga Jual dari Harga Beli
                        </p>
                    </div>
                    <div>
                        <label className="text-[11px] text-slate-400">Tipe Markup</label>
                        <select
                            value={bulkMarkupType}
                            onChange={(e) => setBulkMarkupType(e.target.value)}
                            className="w-full mt-1 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        >
                            <option value="percentage">% Persen</option>
                            <option value="nominal">Rp Nominal</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] text-slate-400">
                            Nilai ({bulkMarkupType === 'percentage' ? '%' : 'Rp'})
                        </label>
                        <input
                            type="number"
                            value={bulkMarkupValue}
                            onChange={(e) => setBulkMarkupValue(e.target.value)}
                            className="w-full mt-1 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-[11px] text-slate-400">Set Supplier</label>
                        <select
                            value={bulkSupplierId}
                            onChange={(e) => setBulkSupplierId(e.target.value)}
                            className="w-full mt-1 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        >
                            <option value="">-- Tetap --</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <button
                            type="button"
                            onClick={handleApplyBulkFormula}
                            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                            Terapkan ({selectedIds.length})
                        </button>
                    </div>
                </div>

                {/* Bar Pencarian & Filter */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter nama barang atau barcode..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
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
                </div>

                {/* KARTU INLINE EDIT KHUSUS LAYAR HP */}
                <div className="md:hidden space-y-3">
                    {filteredRows.map((row) => {
                        const profit = Number(row.selling_price || 0) - Number(row.cost_price || 0);
                        return (
                            <div
                                key={row.id}
                                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                            >
                                <div className="flex items-center gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(row.id)}
                                        onChange={() => toggleSelectRow(row.id)}
                                        className="rounded text-emerald-500 w-4 h-4 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <span className="font-mono text-[11px] text-emerald-400 block">
                                            {row.barcode}
                                        </span>
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                                            className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div>
                                        <label className="text-[10px] text-slate-400">Harga Beli (HPP)</label>
                                        <input
                                            type="number"
                                            value={row.cost_price}
                                            onChange={(e) => handleRowChange(row.id, 'cost_price', e.target.value)}
                                            className="w-full mt-0.5 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400">Stok ({row.base_unit})</label>
                                        <input
                                            type="number"
                                            value={row.stock}
                                            onChange={(e) => handleRowChange(row.id, 'stock', e.target.value)}
                                            className="w-full mt-0.5 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400">Markup (% / Rp)</label>
                                        <div className="flex gap-1 mt-0.5">
                                            <select
                                                value={row.markup_type}
                                                onChange={(e) => handleRowChange(row.id, 'markup_type', e.target.value)}
                                                className="px-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                                            >
                                                <option value="percentage">%</option>
                                                <option value="nominal">Rp</option>
                                            </select>
                                            <input
                                                type="number"
                                                value={row.markup_value}
                                                onChange={(e) => handleRowChange(row.id, 'markup_value', e.target.value)}
                                                className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold text-amber-300"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-emerald-400 font-bold">
                                            Harga Jual (Laba +{formatRp(profit)})
                                        </label>
                                        <input
                                            type="number"
                                            value={row.selling_price}
                                            onChange={(e) => handleRowChange(row.id, 'selling_price', e.target.value)}
                                            className="w-full mt-0.5 px-2.5 py-2 bg-emerald-950/40 border border-emerald-500 rounded-xl font-extrabold text-emerald-300"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* TABEL SPREADSHEET EDIT MASAL (DESKTOP) */}
                <div className="hidden md:block overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                <th className="p-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                                        onChange={toggleSelectAll}
                                        className="rounded text-emerald-500"
                                    />
                                </th>
                                <th className="p-3">Barcode & Nama Produk</th>
                                <th className="p-3 w-32">Harga Beli (HPP)</th>
                                <th className="p-3 w-28">Tipe Markup</th>
                                <th className="p-3 w-28">Nilai Markup</th>
                                <th className="p-3 w-32">Harga Jual</th>
                                <th className="p-3 w-28">Margin Laba</th>
                                <th className="p-3 w-24">Stok</th>
                                <th className="p-3 w-40">Supplier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                            {filteredRows.map((row) => {
                                const profit = Number(row.selling_price || 0) - Number(row.cost_price || 0);
                                return (
                                    <tr key={row.id} className="hover:bg-slate-950/60">
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(row.id)}
                                                onChange={() => toggleSelectRow(row.id)}
                                                className="rounded text-emerald-500"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="font-mono text-[11px] text-emerald-400">{row.barcode}</div>
                                            <input
                                                type="text"
                                                value={row.name}
                                                onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                                                className="w-full mt-0.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white font-semibold"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={row.cost_price}
                                                onChange={(e) => handleRowChange(row.id, 'cost_price', e.target.value)}
                                                className="w-28 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-semibold"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={row.markup_type}
                                                onChange={(e) => handleRowChange(row.id, 'markup_type', e.target.value)}
                                                className="w-28 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-white"
                                            >
                                                <option value="percentage">% Persen</option>
                                                <option value="nominal">Rp Nominal</option>
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={row.markup_value}
                                                onChange={(e) => handleRowChange(row.id, 'markup_value', e.target.value)}
                                                className="w-24 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-amber-300 font-bold"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={row.selling_price}
                                                onChange={(e) => handleRowChange(row.id, 'selling_price', e.target.value)}
                                                className="w-28 px-2 py-1.5 bg-emerald-950/40 border border-emerald-500/50 rounded text-emerald-300 font-bold"
                                            />
                                        </td>
                                        <td className="p-3 font-semibold text-emerald-400">+{formatRp(profit)}</td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={row.stock}
                                                onChange={(e) => handleRowChange(row.id, 'stock', e.target.value)}
                                                className="w-20 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-white font-bold"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={row.supplier_id || ''}
                                                onChange={(e) =>
                                                    handleRowChange(row.id, 'supplier_id', e.target.value || null)
                                                }
                                                className="w-36 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-300"
                                            >
                                                <option value="">-</option>
                                                {suppliers.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
