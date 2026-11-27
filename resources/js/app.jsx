import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
    ShoppingCart, Package, Barcode, Layers, Clock, TrendingUp,
    Truck, Store, CheckCircle2, AlertCircle, Sun, Moon, ClipboardCheck
} from 'lucide-react';
import { apiFetch } from './utils/format';
import PosCashierTab from './components/PosCashierTab';
import InventoryStockTab from './components/InventoryStockTab';
import StockOpnameTab from './components/StockOpnameTab';
import ScanStockTab from './components/ScanStockTab';
import BulkEditTab from './components/BulkEditTab';
import ReceivablesTab from './components/ReceivablesTab';
import ProfitLossTab from './components/ProfitLossTab';
import SuppliersSettingsTab from './components/SuppliersSettingsTab';

function WarkasPosApp() {
    const [activeTab, setActiveTab] = useState('pos');
    const [theme, setTheme] = useState(() => localStorage.getItem('warkas_theme') || 'dark');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        products: [],
        categories: [],
        suppliers: [],
        customers: [],
        catalog_count: 0,
        catalog_samples: [],
        recent_sales: [],
        receivable_sales: [],
        stock_opnames: [],
        profit_loss: null,
        settings: {},
    });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        localStorage.setItem('warkas_theme', theme);
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const notify = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    }, []);

    const loadBootstrapData = useCallback(async () => {
        try {
            const res = await apiFetch('/api/pos/bootstrap');
            setData(res);
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadBootstrapData();
    }, [loadBootstrapData]);

    const lowStockCount = (data.products || []).filter(
        (p) => Number(p.stock) <= Number(p.min_stock_alert || 5)
    ).length;

    const navItems = [
        { id: 'pos', label: 'Kasir (POS)', shortLabel: 'Kasir', icon: ShoppingCart },
        {
            id: 'inventory',
            label: 'Stok & Inventaris',
            shortLabel: 'Stok',
            icon: Package,
            badge: lowStockCount,
        },
        {
            id: 'stock_opname',
            label: 'Stok Opname',
            shortLabel: 'Opname',
            icon: ClipboardCheck,
        },
        {
            id: 'scan_stock',
            label: 'Scan Input Stok & Markup',
            shortLabel: 'Scan+',
            icon: Barcode,
            isHighlight: true,
        },
        { id: 'bulk_edit', label: 'Edit Masal Produk', shortLabel: 'Massal', icon: Layers },
        {
            id: 'receivables',
            label: 'Piutang & Bon WA',
            shortLabel: 'Piutang',
            icon: Clock,
            badge: data.receivable_sales?.length || 0,
        },
        { id: 'profit_loss', label: 'Laporan Laba Rugi', shortLabel: 'Laba/Rugi', icon: TrendingUp },
        { id: 'suppliers', label: 'Supplier & Pengaturan', shortLabel: 'Supplier', icon: Truck },
    ];

    const activeNavObj = navItems.find((n) => n.id === activeTab) || navItems[0];

    return (
        <div
            className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-colors duration-200 ${
                theme === 'light' ? 'theme-light' : 'theme-dark'
            }`}
        >
            {/* TOP APP BAR (Compact App Header di HP & Full Navbar di Desktop) */}
            <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-2.5 md:py-3 flex items-center justify-between gap-3">
                    {/* Brand & Active Screen Title on Mobile */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/30 shrink-0">
                            <Store className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="font-extrabold text-sm md:text-base tracking-tight text-white truncate">
                                    {data.settings?.store_name || 'WARKAS POS'}
                                </h1>
                                <span className="md:hidden px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    {activeNavObj.shortLabel}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                                <span className="hidden sm:inline">Laravel + React POS • </span>
                                50.600 Produk Indonesia • Piutang & WA Bon
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation Links (Disembunyikan di HP karena HP pakai Bottom Navbar) */}
                    <div className="hidden md:flex items-center gap-2 overflow-x-auto">
                        <nav className="flex items-center gap-1.5">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveTab(item.id)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                                            active
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                                                : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                        {item.badge > 0 && (
                                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-slate-950 font-bold">
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tombol Toggle Dark / Light Mode (Tampil di HP & Desktop) */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-4 h-4 text-amber-400" />
                                <span className="hidden sm:inline text-slate-200">Light</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4 text-slate-700" />
                                <span className="hidden sm:inline text-slate-800">Dark</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Toast Notification (Di atas Bottom Navbar pada layar HP) */}
            {toast && (
                <div className="fixed top-16 md:top-auto md:bottom-6 right-3 left-3 md:left-auto z-50 md:max-w-sm">
                    <div
                        className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold ${
                            toast.type === 'error'
                                ? 'bg-rose-950 border-rose-500 text-rose-200'
                                : 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        }`}
                    >
                        {toast.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="flex-1">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Main Content Area (Dengan padding bawah ekstra di HP untuk Bottom Navbar) */}
            <main className="max-w-7xl w-full mx-auto px-3 sm:px-4 pt-3 sm:pt-5 pb-32 md:pb-8 flex-1">
                {loading ? (
                    <div className="py-20 text-center text-slate-400 text-sm">
                        Memuat aplikasi kasir, 50.600 katalog produk Indonesia & laporan keuangan...
                    </div>
                ) : (
                    <>
                        {activeTab === 'pos' && (
                            <PosCashierTab
                                products={data.products}
                                categories={data.categories}
                                customers={data.customers}
                                settings={data.settings}
                                onCheckoutSuccess={loadBootstrapData}
                                notify={notify}
                            />
                        )}
                        {activeTab === 'inventory' && (
                            <InventoryStockTab
                                products={data.products}
                                categories={data.categories}
                                suppliers={data.suppliers}
                                onRefresh={loadBootstrapData}
                                onGoToScanTab={() => setActiveTab('scan_stock')}
                                onGoToBulkEdit={() => setActiveTab('bulk_edit')}
                                onGoToStockOpname={() => setActiveTab('stock_opname')}
                                notify={notify}
                            />
                        )}
                        {activeTab === 'stock_opname' && (
                            <StockOpnameTab
                                products={data.products}
                                categories={data.categories}
                                stockOpnames={data.stock_opnames}
                                onRefresh={loadBootstrapData}
                                notify={notify}
                            />
                        )}
                        {activeTab === 'scan_stock' && (
                            <ScanStockTab
                                categories={data.categories}
                                suppliers={data.suppliers}
                                catalogSamples={data.catalog_samples}
                                catalogCount={data.catalog_count}
                                onProductSaved={loadBootstrapData}
                                notify={notify}
                            />
                        )}
                        {activeTab === 'bulk_edit' && (
                            <BulkEditTab
                                products={data.products}
                                categories={data.categories}
                                suppliers={data.suppliers}
                                onUpdated={loadBootstrapData}
                                notify={notify}
                            />
                        )}
                        {activeTab === 'receivables' && (
                            <ReceivablesTab
                                receivableSales={data.receivable_sales}
                                recentSales={data.recent_sales}
                                onRefresh={loadBootstrapData}
                                notify={notify}
                            />
                        )}
                        {activeTab === 'profit_loss' && (
                            <ProfitLossTab initialReport={data.profit_loss} notify={notify} />
                        )}
                        {activeTab === 'suppliers' && (
                            <SuppliersSettingsTab
                                suppliers={data.suppliers}
                                customers={data.customers}
                                settings={data.settings}
                                onRefresh={loadBootstrapData}
                                notify={notify}
                            />
                        )}
                    </>
                )}
            </main>

            {/* NATIVE-STYLE MOBILE BOTTOM NAVIGATION BAR (Hanya tampil di HP / Layar < 768px) */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.35)]">
                <div className="flex items-center justify-between overflow-x-auto no-scrollbar px-1.5 py-1.5 gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setActiveTab(item.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[52px] rounded-xl transition cursor-pointer shrink-0 ${
                                    active
                                        ? 'text-emerald-400 font-bold'
                                        : 'text-slate-400 hover:text-slate-200 font-medium'
                                }`}
                            >
                                <div
                                    className={`relative p-1.5 rounded-xl transition ${
                                        active
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50 -translate-y-0.5'
                                            : item.isHighlight
                                            ? 'bg-slate-800 text-emerald-400'
                                            : ''
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] leading-tight mt-0.5 truncate max-w-full">
                                    {item.shortLabel}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

const container = document.getElementById('warkas-pos-root');
if (container) {
    createRoot(container).render(<WarkasPosApp />);
}
