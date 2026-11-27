import React, { useState, useRef, useEffect } from 'react';
import {
    Barcode, Search, Plus, Minus, Trash2, Send, Printer,
    CheckCircle2, CreditCard, Wallet, QrCode, FileText, UserPlus, Sparkles, ExternalLink, ShoppingBag, X, ChevronUp
} from 'lucide-react';
import { formatRp, apiFetch } from '../utils/format';

export default function PosCashierTab({ products, categories, customers, settings, onCheckoutSuccess, notify }) {
    const [barcodeInput, setBarcodeInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [cart, setCart] = useState([]);
    const [showMobileCartSheet, setShowMobileCartSheet] = useState(false);

    // Pembayaran & Piutang
    const [discountAmount, setDiscountAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, qris, transfer, debt
    const [paidAmount, setPaidAmount] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [newCustomerName, setNewCustomerName] = useState('');
    const [customerWhatsapp, setCustomerWhatsapp] = useState('');
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    });
    const [sendWa, setSendWa] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal Struk & Kirim WhatsApp setelah Checkout
    const [completedCheckout, setCompletedCheckout] = useState(null);

    const barcodeInputRef = useRef(null);

    useEffect(() => {
        if (window.innerWidth >= 1024) {
            barcodeInputRef.current?.focus();
        }
    }, []);

    // Resolusi harga ecer vs grosir otomatis
    const resolveUnitPrice = (product, qty) => {
        if (
            product.wholesale_min_qty &&
            product.wholesale_price &&
            qty >= Number(product.wholesale_min_qty)
        ) {
            return Number(product.wholesale_price);
        }
        return Number(product.selling_price);
    };

    const addToCart = (product, addQty = 1) => {
        setCart((prev) => {
            const existingIdx = prev.findIndex((item) => item.product_id === product.id);
            if (existingIdx > -1) {
                const updated = [...prev];
                const newQty = updated[existingIdx].qty + addQty;
                const newPrice = resolveUnitPrice(product, newQty);
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    qty: newQty,
                    unit_price: newPrice,
                    is_wholesale: product.wholesale_min_qty && newQty >= product.wholesale_min_qty,
                };
                return updated;
            }
            const initPrice = resolveUnitPrice(product, addQty);
            return [
                ...prev,
                {
                    product_id: product.id,
                    barcode: product.barcode,
                    name: product.name,
                    base_unit: product.base_unit,
                    cost_price: Number(product.cost_price),
                    unit_price: initPrice,
                    qty: addQty,
                    stock: Number(product.stock),
                    wholesale_min_qty: product.wholesale_min_qty,
                    wholesale_price: product.wholesale_price,
                    is_wholesale: product.wholesale_min_qty && addQty >= product.wholesale_min_qty,
                },
            ];
        });
    };

    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        const code = barcodeInput.trim();
        if (!code) return;

        const found = products.find(
            (p) => p.barcode.toLowerCase() === code.toLowerCase() || (p.sku && p.sku.toLowerCase() === code.toLowerCase())
        );

        if (found) {
            addToCart(found, 1);
            setBarcodeInput('');
            notify(`+1 ${found.name} masuk keranjang`);
        } else {
            notify(`Barcode "${code}" belum ada di stok toko. Silakan scan di menu "Scan+"`, 'error');
        }
    };

    const updateCartQty = (productId, newQty) => {
        if (newQty <= 0) {
            setCart((prev) => prev.filter((item) => item.product_id !== productId));
            return;
        }
        const product = products.find((p) => p.id === productId);
        setCart((prev) =>
            prev.map((item) => {
                if (item.product_id !== productId) return item;
                const price = product ? resolveUnitPrice(product, newQty) : item.unit_price;
                return {
                    ...item,
                    qty: newQty,
                    unit_price: price,
                    is_wholesale: product?.wholesale_min_qty && newQty >= product.wholesale_min_qty,
                };
            })
        );
    };

    const totalCartItems = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const subtotal = cart.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
    const grandTotal = Math.max(0, subtotal - Number(discountAmount || 0));
    const numericPaid = paidAmount === '' ? (paymentMethod === 'debt' ? 0 : grandTotal) : Number(paidAmount);
    const changeAmount = Math.max(0, numericPaid - grandTotal);
    const remainingDebt = Math.max(0, grandTotal - numericPaid);

    const handleSelectCustomer = (id) => {
        setCustomerId(id);
        const found = customers.find((c) => String(c.id) === String(id));
        if (found && found.whatsapp) {
            setCustomerWhatsapp(found.whatsapp);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            notify('Keranjang belanja masih kosong!', 'error');
            return;
        }
        if (remainingDebt > 0 && !customerId && !newCustomerName.trim()) {
            notify('Untuk transaksi Kasbon / Piutang, wajib pilih Pelanggan atau isi Nama Pelanggan!', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiFetch('/api/pos/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    items: cart.map((i) => ({
                        product_id: i.product_id,
                        qty: i.qty,
                        unit_price: i.unit_price,
                    })),
                    discount_amount: Number(discountAmount || 0),
                    payment_method: paymentMethod,
                    paid_amount: numericPaid,
                    customer_id: customerId || null,
                    new_customer_name: newCustomerName.trim() || null,
                    customer_whatsapp: customerWhatsapp.trim() || null,
                    due_date: dueDate,
                    send_wa: sendWa,
                }),
            });

            setCompletedCheckout(res);
            setShowMobileCartSheet(false);
            setCart([]);
            setDiscountAmount(0);
            setPaidAmount('');
            setNewCustomerName('');
            onCheckoutSuccess();
            notify(res.message);
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchCat = selectedCategory === 'ALL' || String(p.category_id) === String(selectedCategory);
        const q = searchQuery.toLowerCase();
        const matchSearch =
            !q ||
            p.name.toLowerCase().includes(q) ||
            p.barcode.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q));
        return matchCat && matchSearch;
    });

    const getCartQtyForProduct = (productId) => {
        const found = cart.find((c) => c.product_id === productId);
        return found ? found.qty : 0;
    };

    // Isi komponen Keranjang & Pembayaran (Dipakai di Sidebar Desktop & Bottom Sheet HP)
    const renderCartAndPaymentPanel = () => (
        <div className="space-y-4">
            {/* Daftar Item di Keranjang */}
            <div className="space-y-2.5 max-h-60 sm:max-h-64 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
                        Belum ada barang di keranjang. Tap produk atau scan barcode untuk menambahkan.
                    </div>
                ) : (
                    cart.map((item) => (
                        <div
                            key={item.product_id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-xs sm:text-sm text-white truncate">{item.name}</p>
                                    {item.is_wholesale && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded font-semibold">
                                            GROSIR
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400">
                                    {formatRp(item.unit_price)} / {item.base_unit}
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => updateCartQty(item.product_id, item.qty - 1)}
                                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.qty}
                                    onChange={(e) => updateCartQty(item.product_id, Number(e.target.value))}
                                    className="w-12 text-center py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm font-bold text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => updateCartQty(item.product_id, item.qty + 1)}
                                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="text-right min-w-[82px]">
                                <p className="font-bold text-xs sm:text-sm text-emerald-400">
                                    {formatRp(item.qty * item.unit_price)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Kalkulasi & Form Checkout */}
            <form onSubmit={handleCheckout} className="space-y-3 pt-3 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <label className="text-xs text-slate-400">Subtotal</label>
                        <div className="font-semibold text-white mt-1">{formatRp(subtotal)}</div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400">Potongan Diskon (Rp)</label>
                        <input
                            type="number"
                            min="0"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                        />
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold text-emerald-200">TOTAL BAYAR</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">{formatRp(grandTotal)}</span>
                </div>

                {/* Pilihan Metode Pembayaran */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Metode Pembayaran</label>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {[
                            { id: 'cash', label: 'Tunai', icon: Wallet },
                            { id: 'qris', label: 'QRIS', icon: QrCode },
                            { id: 'transfer', label: 'Transfer', icon: CreditCard },
                            { id: 'debt', label: 'Kasbon', icon: FileText },
                        ].map((m) => {
                            const Icon = m.icon;
                            const active = paymentMethod === m.id;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                        setPaymentMethod(m.id);
                                        if (m.id === 'debt') setPaidAmount(0);
                                        else setPaidAmount(grandTotal);
                                    }}
                                    className={`py-2.5 px-1.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                                        active
                                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {m.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Nominal Uang Diterima & Kembalian / Sisa Piutang */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-400">Uang Diterima (Rp)</label>
                        <input
                            type="number"
                            min="0"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            placeholder={String(grandTotal)}
                            className="w-full mt-1 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white"
                        />
                    </div>
                    <div>
                        {remainingDebt > 0 ? (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                <span className="text-[11px] text-amber-300 block">Sisa Piutang (Kasbon)</span>
                                <span className="text-sm sm:text-base font-bold text-amber-400">
                                    {formatRp(remainingDebt)}
                                </span>
                            </div>
                        ) : (
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                <span className="text-[11px] text-slate-400 block">Uang Kembalian</span>
                                <span className="text-sm sm:text-base font-bold text-emerald-400">
                                    {formatRp(changeAmount)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pelanggan & Nomor WhatsApp untuk Kirim Bon */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <label className="text-[11px] text-slate-400">Pilih Pelanggan</label>
                            <select
                                value={customerId}
                                onChange={(e) => handleSelectCustomer(e.target.value)}
                                className="w-full mt-0.5 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                            >
                                <option value="">-- Pelanggan Umum --</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.current_receivable > 0 ? `(Bon: ${formatRp(c.current_receivable)})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-slate-400">No. WhatsApp (Kirim Bon)</label>
                            <input
                                type="tel"
                                value={customerWhatsapp}
                                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                                placeholder="0812xxxxxxxx"
                                className="w-full mt-0.5 px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                            />
                        </div>
                    </div>

                    {!customerId && remainingDebt > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div>
                                <label className="text-[11px] text-amber-300 flex items-center gap-1">
                                    <UserPlus className="w-3 h-3" /> Nama Pelanggan Kasbon Baru
                                </label>
                                <input
                                    type="text"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    placeholder="Contoh: Warung Pak RT"
                                    className="w-full mt-0.5 px-2.5 py-2 bg-slate-900 border border-amber-500/40 rounded-lg text-xs text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-amber-300">Jatuh Tempo Piutang</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full mt-0.5 px-2.5 py-2 bg-slate-900 border border-amber-500/40 rounded-lg text-xs text-white"
                                />
                            </div>
                        </div>
                    )}

                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                        <input
                            type="checkbox"
                            checked={sendWa}
                            onChange={(e) => setSendWa(e.target.checked)}
                            className="rounded text-emerald-500 w-4 h-4"
                        />
                        Kirim Bon Digital ke WhatsApp Pelanggan
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    {isSubmitting ? 'Memproses...' : 'Bayar & Buat Bon Struk'}
                </button>
            </form>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* KIRI: Scanner Barcode, Pill Kategori Horizontal & Katalog Produk Mobile-Friendly */}
            <div className="lg:col-span-7 space-y-3.5">
                {/* Bar Scan Barcode Cepat */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg">
                    <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <Barcode className="w-5 h-5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                placeholder="Scan Barcode / Ketik Kode..."
                                className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-slate-950 border border-emerald-500/40 rounded-xl text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shrink-0 cursor-pointer"
                        >
                            + Scan
                        </button>
                    </form>

                    {/* Tombol Simulasi Scan Barcode Cepat (Horizontal Scrollable di HP) */}
                    <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
                        <span className="text-slate-400 flex items-center gap-1 shrink-0 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tes Scan:
                        </span>
                        {products.slice(0, 5).map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                    addToCart(p, 1);
                                    notify(`+1 ${p.name}`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] whitespace-nowrap shrink-0 transition cursor-pointer"
                            >
                                {p.name.split(' ').slice(0, 2).join(' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pencarian & Pill Kategori Horizontal Mobile */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama barang, SKU, atau barcode..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Horizontal Pill Kategori (Sangat Nyaman Di-swipe di HP) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('ALL')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                selectedCategory === 'ALL'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}
                        >
                            Semua ({products.length})
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                    String(selectedCategory) === String(cat.id)
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Grid Kartu Produk (2 Kolom di HP, 3 Kolom di Tablet/Desktop) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        {filteredProducts.map((p) => {
                            const isLowStock = p.stock <= p.min_stock_alert;
                            const inCartQty = getCartQtyForProduct(p.id);

                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => addToCart(p, 1)}
                                    className={`relative text-left p-3 rounded-2xl bg-slate-950/90 hover:bg-slate-800/80 border transition flex flex-col justify-between group cursor-pointer active:scale-[0.98] ${
                                        inCartQty > 0
                                            ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                                            : 'border-slate-800 hover:border-emerald-500/50'
                                    }`}
                                >
                                    {inCartQty > 0 && (
                                        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] shadow-md">
                                            {inCartQty}x
                                        </span>
                                    )}

                                    <div>
                                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
                                            <span className="truncate">{p.barcode}</span>
                                            <span
                                                className={`px-1.5 py-0.5 rounded font-sans font-semibold shrink-0 ${
                                                    isLowStock
                                                        ? 'bg-rose-500/20 text-rose-300'
                                                        : 'bg-slate-800 text-slate-300'
                                                }`}
                                            >
                                                {p.stock} {p.base_unit}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-xs sm:text-sm text-slate-100 mt-1.5 group-hover:text-emerald-300 line-clamp-2 leading-snug">
                                            {p.name}
                                        </h4>
                                    </div>
                                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5">
                                        <span className="text-emerald-400 font-extrabold text-xs sm:text-sm">
                                            {formatRp(p.selling_price)}
                                        </span>
                                        {p.wholesale_min_qty && p.wholesale_price && (
                                            <span className="text-[10px] text-amber-300 font-medium">
                                                Grosir ≥{p.wholesale_min_qty}: {formatRp(p.wholesale_price)}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* KANAN (DESKTOP): Keranjang Kasir Sticky */}
            <div className="hidden lg:block lg:col-span-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl sticky top-20 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                            <h3 className="font-bold text-base text-white">Keranjang Kasir (POS)</h3>
                            <p className="text-xs text-slate-400">Otomatis hitung harga ecer & grosir</p>
                        </div>
                        {cart.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setCart([])}
                                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Kosongkan
                            </button>
                        )}
                    </div>
                    {renderCartAndPaymentPanel()}
                </div>
            </div>

            {/* FLOATING MOBILE CART BAR (Tampil di HP tepat di atas Bottom Navbar saat ada item di keranjang) */}
            {cart.length > 0 && (
                <div className="lg:hidden fixed bottom-[68px] inset-x-3 z-30">
                    <button
                        type="button"
                        onClick={() => setShowMobileCartSheet(true)}
                        className="w-full p-3.5 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-950 flex items-center justify-between cursor-pointer active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-xs">
                                {totalCartItems}
                            </div>
                            <div className="text-left">
                                <span className="text-[11px] text-emerald-100 block leading-none">
                                    Total Keranjang ({cart.length} Jenis)
                                </span>
                                <span className="text-base font-extrabold">{formatRp(grandTotal)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-xs bg-white text-emerald-900 px-3.5 py-2 rounded-xl">
                            <span>Bayar / Bon</span>
                            <ChevronUp className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            )}

            {/* MOBILE SLIDE-UP BOTTOM SHEET DRAWER UNTUK KERANJANG & PEMBAYARAN */}
            {showMobileCartSheet && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end">
                    <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-4 max-h-[88vh] overflow-y-auto space-y-3 animate-in slide-in-from-bottom">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <h3 className="font-bold text-sm text-white">
                                        Keranjang & Pembayaran ({totalCartItems} Item)
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Atur jumlah, metode bayar & kirim bon WA
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {cart.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCart([]);
                                            setShowMobileCartSheet(false);
                                        }}
                                        className="p-2 text-rose-400 hover:bg-slate-800 rounded-xl"
                                        title="Kosongkan"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowMobileCartSheet(false)}
                                    className="p-2 bg-slate-800 text-slate-300 rounded-xl"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {renderCartAndPaymentPanel()}
                    </div>
                </div>
            )}

            {/* MODAL STRUK DIGITAL & KIRIM WHATSAPP SETELAH CHECKOUT */}
            {completedCheckout && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle2 className="w-6 h-6" />
                                <h3 className="font-bold text-lg text-white">Transaksi Berhasil!</h3>
                            </div>
                            <span className="font-mono text-xs bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                                {completedCheckout.sale.invoice_number}
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto text-slate-200">
                            {completedCheckout.whatsapp.receipt_text}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <a
                                href={completedCheckout.whatsapp.wa_me_url}
                                target="_blank"
                                rel="noreferrer"
                                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" /> Kirim Bon ke WhatsApp
                            </a>
                            <a
                                href={completedCheckout.whatsapp.public_receipt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs flex items-center justify-center gap-2"
                            >
                                <Printer className="w-4 h-4" /> Cetak / Lihat Bon Digital
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setCompletedCheckout(null);
                            }}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                        >
                            Tutup & Transaksi Baru
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
