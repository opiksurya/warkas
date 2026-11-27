import React, { useState, useRef } from 'react';
import { Barcode, Database, Calculator, Save, Sparkles, CheckCircle2, Info, Search } from 'lucide-react';
import { formatRp, calculateSellingPrice, apiFetch } from '../utils/format';

export default function ScanStockTab({ categories, suppliers, catalogSamples, catalogCount, onProductSaved, notify }) {
    const [barcode, setBarcode] = useState('');
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [baseUnit, setBaseUnit] = useState('PCS');

    // Harga Beli & Kalkulator Markup (% atau Nominal Rp)
    const [costPrice, setCostPrice] = useState('');
    const [markupType, setMarkupType] = useState('percentage'); // 'percentage' | 'nominal'
    const [markupValue, setMarkupValue] = useState(15);
    const [autoRound, setAutoRound] = useState(true);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [wholesaleMinQty, setWholesaleMinQty] = useState('');
    const [wholesalePrice, setWholesalePrice] = useState('');

    // Stok & Expired
    const [stockInput, setStockInput] = useState(24);
    const [stockMode, setStockMode] = useState('add'); // 'add' | 'set'
    const [minStockAlert, setMinStockAlert] = useState(5);
    const [nearestExpiryDate, setNearestExpiryDate] = useState('');

    // Info hasil lookup API Produk Indonesia
    const [lookupResult, setLookupResult] = useState(null);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogResults, setCatalogResults] = useState(catalogSamples || []);

    const barcodeRef = useRef(null);

    const recomputeSelling = (cPrice, mType, mVal, roundFlag) => {
        const computed = calculateSellingPrice(cPrice, mType, mVal, roundFlag);
        setSellingPrice(computed);
    };

    const handleBarcodeLookup = async (codeToLookup) => {
        const targetCode = (codeToLookup ?? barcode).trim();
        if (!targetCode) return;

        setBarcode(targetCode);
        setIsLookingUp(true);
        try {
            const res = await apiFetch(`/api/pos/barcode-lookup?barcode=${encodeURIComponent(targetCode)}`);
            setLookupResult(res);

            if (res.exists_in_store && res.product) {
                const p = res.product;
                setName(p.name);
                setCategoryId(p.category_id || '');
                setSupplierId(p.supplier_id || '');
                setBaseUnit(p.base_unit || 'PCS');
                setCostPrice(p.cost_price);
                setMarkupType(p.markup_type || 'percentage');
                setMarkupValue(p.markup_value || 0);
                setAutoRound(Boolean(p.auto_round));
                setSellingPrice(p.selling_price);
                setWholesaleMinQty(p.wholesale_min_qty || '');
                setWholesalePrice(p.wholesale_price || '');
                setStockMode('add');
                notify(`Produk ditemukan di stok toko: ${p.name}`);
            } else if (res.catalog) {
                const c = res.catalog;
                setName(c.name || '');
                setBaseUnit(c.unit || 'PCS');
                const matchedCat = categories.find(
                    (cat) => cat.name.toLowerCase() === String(c.category || '').toLowerCase()
                );
                if (matchedCat) {
                    setCategoryId(matchedCat.id);
                    setNewCategoryName('');
                } else if (c.category) {
                    setNewCategoryName(c.category);
                }
                const refCost = Number(c.reference_price || 0);
                setCostPrice(refCost);
                recomputeSelling(refCost, markupType, markupValue, autoRound);
                notify(res.message);
            }
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleSearchCatalog = async (q) => {
        setCatalogSearch(q);
        try {
            const res = await apiFetch(`/api/pos/indonesia-catalog?q=${encodeURIComponent(q)}`);
            setCatalogResults(res.items || []);
        } catch {
            // ignore
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (!barcode.trim() || !name.trim()) {
            notify('Barcode dan Nama Produk wajib diisi!', 'error');
            return;
        }

        try {
            const res = await apiFetch('/api/pos/products/scan-save', {
                method: 'POST',
                body: JSON.stringify({
                    barcode: barcode.trim(),
                    name: name.trim(),
                    category_id: categoryId || null,
                    new_category_name: newCategoryName.trim() || null,
                    supplier_id: supplierId || null,
                    base_unit: baseUnit,
                    cost_price: Number(costPrice || 0),
                    markup_type: markupType,
                    markup_value: Number(markupValue || 0),
                    auto_round: autoRound,
                    selling_price: Number(sellingPrice || 0),
                    wholesale_min_qty: wholesaleMinQty ? Number(wholesaleMinQty) : null,
                    wholesale_price: wholesalePrice ? Number(wholesalePrice) : null,
                    stock_input: Number(stockInput || 0),
                    stock_mode: stockMode,
                    min_stock_alert: Number(minStockAlert || 5),
                    nearest_expiry_date: nearestExpiryDate || null,
                }),
            });

            notify(res.message);
            onProductSaved();
            setBarcode('');
            setName('');
            setCostPrice('');
            setSellingPrice(0);
            setLookupResult(null);
            barcodeRef.current?.focus();
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const profitPerUnit = Math.max(0, Number(sellingPrice || 0) - Number(costPrice || 0));
    const effectivePercent =
        Number(costPrice) > 0 ? ((profitPerUnit / Number(costPrice)) * 100).toFixed(1) : '0.0';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* KIRI: Form Scan Input Stok & Kalkulator Markup */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Barcode className="w-5 h-5 text-emerald-400" />
                            Scan Input Stok & Kalkulator Markup Harga
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Terintegrasi dengan database <code className="text-emerald-300">ariph007/api-product-indonesia</code>
                        </p>
                    </div>
                </div>

                {/* Bar Scan Barcode */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                    <label className="text-xs font-semibold text-emerald-300 block">
                        1. Scan Barcode Barang (Tekan Enter atau Klik Cari Barcode)
                    </label>
                    <div className="flex gap-2">
                        <input
                            ref={barcodeRef}
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleBarcodeLookup(barcode);
                                }
                            }}
                            placeholder="Scan atau ketik barcode (contoh: 8998866200318)..."
                            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-emerald-400"
                        />
                        <button
                            type="button"
                            onClick={() => handleBarcodeLookup(barcode)}
                            disabled={isLookingUp}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm cursor-pointer"
                        >
                            {isLookingUp ? 'Mencari...' : 'Cek Barcode'}
                        </button>
                    </div>

                    {lookupResult && (
                        <div
                            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                                lookupResult.exists_in_store
                                    ? 'bg-blue-500/15 border border-blue-500/40 text-blue-200'
                                    : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200'
                            }`}
                        >
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">{lookupResult.message}</p>
                                <p className="text-[11px] opacity-80 mt-0.5">
                                    Sumber Data: <span className="font-mono">{lookupResult.found_in}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-5">
                    {/* Identitas Barang */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-xs text-slate-400">Nama Produk (Otomatis dari Barcode)</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nama lengkap produk..."
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Satuan (PCS/BTL/RCG/DUS)</label>
                            <input
                                type="text"
                                value={baseUnit}
                                onChange={(e) => setBaseUnit(e.target.value.toUpperCase())}
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400">Kategori</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Supplier / Distributor</label>
                            <select
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                            >
                                <option value="">-- Pilih Supplier --</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* KALKULATOR HARGA BELI & MARKUP (PERSENTASE ATAU NOMINAL) */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                2. Kalkulator Harga Beli & Markup Harga Jual
                            </h3>
                            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoRound}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setAutoRound(checked);
                                        recomputeSelling(costPrice, markupType, markupValue, checked);
                                    }}
                                    className="rounded text-emerald-500"
                                />
                                Bulatkan ke ratusan terdekat
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-400">Harga Beli / HPP (Rp)</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={costPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCostPrice(val);
                                        recomputeSelling(val, markupType, markupValue, autoRound);
                                    }}
                                    placeholder="0"
                                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Pilih Mode Markup</label>
                                <div className="grid grid-cols-2 gap-1.5 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMarkupType('percentage');
                                            setMarkupValue(15);
                                            recomputeSelling(costPrice, 'percentage', 15, autoRound);
                                        }}
                                        className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                            markupType === 'percentage'
                                                ? 'bg-emerald-600 text-white border-emerald-500'
                                                : 'bg-slate-900 text-slate-400 border-slate-800'
                                        }`}
                                    >
                                        Persentase (%)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMarkupType('nominal');
                                            setMarkupValue(1500);
                                            recomputeSelling(costPrice, 'nominal', 1500, autoRound);
                                        }}
                                        className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                            markupType === 'nominal'
                                                ? 'bg-emerald-600 text-white border-emerald-500'
                                                : 'bg-slate-900 text-slate-400 border-slate-800'
                                        }`}
                                    >
                                        Nominal (Rp)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">
                                    Nilai Markup ({markupType === 'percentage' ? '% Keuntungan' : 'Nominal Rp'})
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={markupValue}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setMarkupValue(val);
                                        recomputeSelling(costPrice, markupType, val, autoRound);
                                    }}
                                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-900 border border-emerald-500/50 rounded-xl text-sm font-bold text-emerald-300"
                                />
                            </div>
                        </div>

                        {/* Hasil Harga Jual & Margin */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                            <div>
                                <label className="text-xs font-bold text-emerald-400">Harga Jual Eceran (Rp)</label>
                                <input
                                    type="number"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(e.target.value)}
                                    className="w-full mt-1 px-3.5 py-2.5 bg-emerald-950/50 border border-emerald-500 rounded-xl text-base font-extrabold text-emerald-300"
                                />
                                <p className="text-[11px] text-emerald-400 mt-1">
                                    Laba: <strong>{formatRp(profitPerUnit)}</strong> ({effectivePercent}%) / {baseUnit}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Min. Qty Grosir (Opsional)</label>
                                <input
                                    type="number"
                                    value={wholesaleMinQty}
                                    onChange={(e) => setWholesaleMinQty(e.target.value)}
                                    placeholder="Contoh: 12"
                                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Harga Grosir / Unit (Rp)</label>
                                <input
                                    type="number"
                                    value={wholesalePrice}
                                    onChange={(e) => setWholesalePrice(e.target.value)}
                                    placeholder="Contoh: 3200"
                                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Input Stok Masuk */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-slate-400">Mode Input Stok</label>
                            <select
                                value={stockMode}
                                onChange={(e) => setStockMode(e.target.value)}
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                            >
                                <option value="add">Tambah Stok Masuk (+)</option>
                                <option value="set">Set Stok Opname Tetap (=)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Jumlah Stok ({baseUnit})</label>
                            <input
                                type="number"
                                required
                                value={stockInput}
                                onChange={(e) => setStockInput(e.target.value)}
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Tgl Kadaluarsa (Opsional)</label>
                            <input
                                type="date"
                                value={nearestExpiryDate}
                                onChange={(e) => setNearestExpiryDate(e.target.value)}
                                className="w-full mt-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        Simpan Produk, Harga Markup & Stok
                    </button>
                </form>
            </div>

            {/* KANAN: Katalog Referensi API Produk Indonesia (Klik untuk Simulasi Scan) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                            <Database className="w-4 h-4 text-amber-400" />
                            Database API Produk Indonesia ({catalogCount} Item)
                        </h3>
                        <p className="text-xs text-slate-400">
                            Klik salah satu produk di bawah untuk simulasi scan barcode otomatis
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => handleSearchCatalog(e.target.value)}
                        placeholder="Cari di katalog produk Indonesia (Indomie, Aqua, Unilever, Rokok)..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {catalogResults.map((item) => (
                        <div
                            key={item.barcode}
                            onClick={() => handleBarcodeLookup(item.barcode)}
                            className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between gap-3 cursor-pointer"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-emerald-400 font-semibold">
                                        {item.barcode}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                        {item.category}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-white mt-1">{item.name}</p>
                                <p className="text-xs text-slate-400">
                                    Estimasi HPP: {formatRp(item.reference_price)} / {item.unit}
                                </p>
                            </div>
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 text-xs font-semibold shrink-0">
                                Scan →
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
