import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import { 
  User, 
  Product, 
  Customer, 
  SaleRecord, 
  DueRecord, 
  CustomerDueSummary, 
  PurchaseRecord, 
  ExpenseRecord, 
  CashClosingRecord 
} from './types';
import { Layout, ActiveTab } from './components/Layout';
import { StatsCards } from './components/StatsCards';
import { MemoEntryForm } from './components/MemoEntryForm';
import { TransactionTable } from './components/TransactionTable';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { DueLedgerModal } from './components/modals/DueLedgerModal';
import { LedgerPrintModal } from './components/modals/LedgerPrintModal';
import { SummaryReportModal } from './components/modals/SummaryReportModal';
import { StockInventoryModal } from './components/modals/StockInventoryModal';
import { StockPrintModal } from './components/modals/StockPrintModal';
import { PurchaseModal } from './components/modals/PurchaseModal';
import { PhotocopyPaperModal } from './components/modals/PhotocopyPaperModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { ExpensePrintModal } from './components/modals/ExpensePrintModal';
import { BusinessSummaryModal } from './components/modals/BusinessSummaryModal';
import { CustomerSalesModal } from './components/modals/CustomerSalesModal';
import { CustomerSalesPrintModal } from './components/modals/CustomerSalesPrintModal';
import { CashClosingModal } from './components/modals/CashClosingModal';
import { CashClosingPrintModal } from './components/modals/CashClosingPrintModal';
import { CustomerModal } from './components/modals/CustomerModal';
import { ProductModal } from './components/modals/ProductModal';
import { UserModal } from './components/modals/UserModal';
import { DeleteMemoModal } from './components/modals/DeleteMemoModal';
import { MigrationModal } from './components/modals/MigrationModal';
import { normalizeCategory } from './utils/helpers';

interface Toast {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('as_computer_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginUsername, setLoginUsername] = useState('Md Abu Said');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Application Data State
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [dueRecords, setDueRecords] = useState<DueRecord[]>([]);
  const [customerSummaries, setCustomerSummaries] = useState<CustomerDueSummary[]>([]);
  const [dueTotals, setDueTotals] = useState({ shopTotalDue: 0, shopTotalPaid: 0, netDue: 0 });
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [cashClosings, setCashClosings] = useState<CashClosingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Active Navigation & View
  const [activeTab, setActiveTab] = useState<ActiveTab>('sales');

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [searchMemo, setSearchMemo] = useState('');
  const [filterStaff, setFilterStaff] = useState('ALL');
  const [activeFilterBadge, setActiveFilterBadge] = useState('Today');

  // Modals & Action States
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [invoiceModalSale, setInvoiceModalSale] = useState<SaleRecord | null>(null);
  const [dueLedgerOpen, setDueLedgerOpen] = useState(false);
  const [ledgerPrintOpen, setLedgerPrintOpen] = useState(false);
  const [summaryReportOpen, setSummaryReportOpen] = useState(false);
  const [stockInventoryOpen, setStockInventoryOpen] = useState(false);
  const [stockPrintOpen, setStockPrintOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [paperUsageOpen, setPaperUsageOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expensePrintOpen, setExpensePrintOpen] = useState(false);
  const [businessSummaryOpen, setBusinessSummaryOpen] = useState(false);
  const [customerSalesOpen, setCustomerSalesOpen] = useState(false);
  const [customerSalesPrintOpen, setCustomerSalesPrintOpen] = useState(false);
  const [cashClosingOpen, setCashClosingOpen] = useState(false);
  const [cashClosingPrintData, setCashClosingPrintData] = useState<CashClosingRecord | null>(null);
  const [cashClosingPrintOpen, setCashClosingPrintOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [deleteMemoSale, setDeleteMemoSale] = useState<SaleRecord | null>(null);
  const [migrationOpen, setMigrationOpen] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  // Bootstrap data fetch
  const fetchBootstrapData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bootstrap');
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.users || []);
        setProducts(data.products || []);
        setCustomers(data.customers || []);
        setSales(data.records || []);
        setExpenses(data.expenses || []);
        setDueRecords(data.dueRecords || []);
        setCustomerSummaries(data.customerSummaries || []);
        setDueTotals(data.dueTotals || { shopTotalDue: 0, shopTotalPaid: 0, netDue: 0 });
        setPurchases(data.purchases || []);
        setCashClosings(data.cashClosings || []);
      } else {
        showToast(data.message || 'Error loading bootstrap data', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error fetching data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBootstrapData();
      handleFilterToday();
    }
  }, [currentUser]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();

      if (data.status === 'success' && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('as_computer_auth_user', JSON.stringify(data.user));
        showToast(`Welcome back, ${data.user.username}!`, 'success');
      } else {
        setLoginError(data.message || 'Incorrect username or password');
        showToast(data.message || 'Login failed', 'error');
      }
    } catch (err: any) {
      setLoginError('Server error: ' + err.message);
      showToast('Login server error', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('as_computer_auth_user');
    showToast('Logged out successfully', 'info');
  };

  // Filter actions
  const handleFilterToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilterStartDate(today);
    setFilterEndDate(today);
    setFilterMonth('');
    setSearchMemo('');
    setActiveFilterBadge(`Today (${today})`);
  };

  const handleFilterRunningMonth = () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setFilterMonth(ym);
    setFilterStartDate('');
    setFilterEndDate('');
    setSearchMemo('');
    setActiveFilterBadge(`Month (${ym})`);
  };

  // Tab switching handler that opens modals or switches active sections
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'due') setDueLedgerOpen(true);
    else if (tab === 'customers') setCustomerOpen(true);
    else if (tab === 'cust_sales') setCustomerSalesOpen(true);
    else if (tab === 'cash_closing') setCashClosingOpen(true);
    else if (tab === 'stock') setStockInventoryOpen(true);
    else if (tab === 'purchases') setPurchaseOpen(true);
    else if (tab === 'financial') setBusinessSummaryOpen(true);
    else if (tab === 'expenses') setExpenseOpen(true);
    else if (tab === 'products') setProductOpen(true);
    else if (tab === 'users') setUserOpen(true);
    else if (tab === 'migration') setMigrationOpen(true);
  };

  // Filtered sales records for table & stats
  // Business Rule:
  // - Normally, staff accounts only see their own sales/memos (auto-filtered).
  // - Admin can always see everyone's sales/memos.
  // - If any user (staff or admin) searches by Memo No., they can search and see all memos across the system.
  const isMemoSearch = Boolean(searchMemo && searchMemo.trim() !== '');

  const filteredSales = sales.filter(s => {
    if (isMemoSearch) {
      const q = searchMemo.toLowerCase().replace(/^as-?/i, '').replace('#', '').trim();
      const inv = String(s.invoiceNo).toLowerCase();
      const formatted = `as-${s.invoiceNo}`.toLowerCase();
      return inv.includes(q) || formatted.includes(q);
    }

    if (currentUser?.role === 'staff') {
      if (s.user.toLowerCase() !== currentUser.username.toLowerCase()) return false;
    } else if (filterStaff !== 'ALL') {
      if (s.user.toLowerCase() !== filterStaff.toLowerCase()) return false;
    }

    const d = s.rawDate || s.date;
    if (filterMonth && !d.startsWith(filterMonth)) return false;
    if (filterStartDate && d < filterStartDate) return false;
    if (filterEndDate && d > filterEndDate) return false;

    return true;
  });

  // Calculate stats based on active filtered sales
  let statPhotocopy = 0;
  let statOnline = 0;
  let statStationery = 0;
  let statCashCollection = 0;
  let statNewDue = 0;

  filteredSales.forEach(s => {
    statNewDue += s.due || 0;
    const ratio = s.subtotal > 0 ? s.grandTotal / s.subtotal : 1.0;

    if (s.items && s.items.length > 0) {
      s.items.forEach(it => {
        const cat = (it.category || s.category).toLowerCase();
        const lineVal = (it.total || 0) * ratio;
        if (cat.includes('photocopy')) statPhotocopy += lineVal;
        else if (cat.includes('stationery')) statStationery += lineVal;
        else statOnline += lineVal;
      });
    } else {
      const cat = s.category.toLowerCase();
      if (cat.includes('photocopy')) statPhotocopy += s.grandTotal;
      else if (cat.includes('stationery')) statStationery += s.grandTotal;
      else statOnline += s.grandTotal;
    }
  });

  // Dues paid in this filtered period
  let duePaidInPeriod = 0;
  dueRecords.forEach(d => {
    if (filterMonth && !d.date.startsWith(filterMonth)) return;
    if (filterStartDate && d.date < filterStartDate) return;
    if (filterEndDate && d.date > filterEndDate) return;
    duePaidInPeriod += d.paid || 0;
  });

  const totalSalesBilled = statPhotocopy + statOnline + statStationery;
  const cashFromSales = Math.max(0, totalSalesBilled - statNewDue);
  statCashCollection = cashFromSales + duePaidInPeriod;

  // Expenses in filtered period
  let filteredExpenseTotal = 0;
  expenses.forEach(e => {
    if (filterMonth && !e.date.startsWith(filterMonth)) return;
    if (filterStartDate && e.date < filterStartDate) return;
    if (filterEndDate && e.date > filterEndDate) return;
    filteredExpenseTotal += e.amount || 0;
  });

  const statBalance = statCashCollection - filteredExpenseTotal;

  // Low stock items count for badge
  const lowStockCount = products.filter(p => {
    const isStationery = normalizeCategory(p.category) === 'Stationery Products';
    const hasStock = p.stockQty !== null && p.stockQty !== undefined;
    return isStationery && hasStock && (p.stockQty || 0) <= (p.lowStockLimit || 5);
  }).length;

  const staffList = Array.from(new Set(sales.map(s => s.user).filter(Boolean)));

  // API Handlers
  const handleSubmitSale = async (payload: any) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/sales/${payload.id}` : '/api/sales';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      setEditingSale(null);
      await fetchBootstrapData();
      if (data.invoiceData) {
        setInvoiceModalSale(data.invoiceData);
      }
    } else {
      throw new Error(data.message || 'Failed to save invoice');
    }
  };

  const handleDeleteSale = async (saleId: number) => {
    const res = await fetch(`/api/sales/${saleId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      setDeleteMemoSale(null);
      await fetchBootstrapData();
    } else {
      showToast(data.message || 'Delete failed', 'error');
    }
  };

  const handleSubmitPayment = async (payload: any) => {
    const res = await fetch('/api/due-ledger/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    } else {
      throw new Error(data.message || 'Failed to record payment');
    }
  };

  const handleSubmitPurchase = async (payload: any) => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    } else {
      throw new Error(data.message || 'Purchase error');
    }
  };

  const handleDeletePurchase = async (id: number) => {
    const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    }
  };

  const handleSubmitPaperUsage = async (payload: any) => {
    const res = await fetch('/api/photocopy-paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    } else {
      throw new Error(data.message || 'Paper usage error');
    }
  };

  const handleSubmitExpense = async (payload: any) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/expenses/${payload.id}` : '/api/expenses';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    } else {
      throw new Error(data.message || 'Expense error');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    }
  };

  const handleSubmitCashClosing = async (payload: any) => {
    const res = await fetch('/api/cash-closings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    } else {
      throw new Error(data.message || 'Cash closing error');
    }
  };

  const handleSubmitCustomer = async (payload: any) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/customers/${payload.id}` : '/api/customers';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    } else {
      throw new Error(data.message || 'Customer error');
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    }
  };

  const handleSubmitProduct = async (payload: any) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/products/${payload.id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    } else {
      throw new Error(data.message || 'Product error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    }
  };

  const handleSubmitUser = async (payload: any) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/users/${payload.id}` : '/api/users';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    } else {
      throw new Error(data.message || 'User error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchBootstrapData();
    }
  };

  // If not logged in, render Login Screen
  if (!currentUser) {
    return (
      <div className="fixed inset-0 w-full h-full min-h-screen flex items-center justify-center p-4 bg-slate-950 bg-radial from-slate-900 to-slate-950 overflow-y-auto selection:bg-blue-600 selection:text-white">
        {/* Glow */}
        <div className="absolute w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md p-7 sm:p-9 rounded-3xl shadow-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-700/80 flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/logo.png" 
                alt="AS Computer Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1OXthEw7eAn6SkWLFzlW9G8MItn3ARvFM";
                }}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              <span className="text-amber-500">AS</span> Computer
            </h1>
            <p className="text-xs text-blue-400 font-bold tracking-wider uppercase mt-1">
              Online Service & IT Point • Cumilla
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-2xl text-xs bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Staff Account
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <UserIcon className="w-4 h-4" />
                </span>
                <select
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 text-white rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-cyan-400 transition cursor-pointer"
                >
                  <option value="Md Abu Said">Md Abu Said (Admin)</option>
                  <option value="Md Sujon">Md Sujon (Staff)</option>
                  <option value="Md Saimon Hasan">Md Saimon Hasan (Staff)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password..."
                  className="w-full bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 rounded-2xl pl-10 pr-11 py-3 text-sm font-bold focus:outline-none focus:border-cyan-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white"
                  title="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loginLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-3 border-t border-slate-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Encrypted local session • Fast SQL database</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Full Application Layout
  return (
    <Layout
      currentUser={currentUser}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      lowStockCount={lowStockCount}
      totalOutstandingDue={dueTotals.netDue}
      onLogout={handleLogout}
    >
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[999999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          let bg = 'bg-emerald-600 border-emerald-500';
          let Icon = CheckCircle2;
          if (t.type === 'error') {
            bg = 'bg-rose-600 border-rose-500';
            Icon = AlertCircle;
          } else if (t.type === 'warning') {
            bg = 'bg-amber-600 border-amber-500';
            Icon = AlertTriangle;
          } else if (t.type === 'info') {
            bg = 'bg-blue-600 border-blue-500';
            Icon = Info;
          }

          return (
            <div
              key={t.id}
              className={`${bg} text-white px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 pointer-events-auto transition-all animate-bounce-short`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t.msg}</span>
            </div>
          );
        })}
      </div>

      {/* Top 7 Stat Cards */}
      <StatsCards
        totals={{
          photocopy: statPhotocopy,
          online: statOnline,
          stationery: statStationery,
          cashCollection: statCashCollection,
          outstandingDue: statNewDue,
          totalExpense: filteredExpenseTotal,
          cashBalance: statBalance
        }}
        isAdmin={currentUser.role === 'admin'}
        onOpenDueLedger={() => setDueLedgerOpen(true)}
      />

      {/* Main 2-Column Split: Memo Entry on Left, Transaction Table on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-5 w-full">
          <MemoEntryForm
            products={products}
            customers={customers}
            currentUser={currentUser.username}
            editingSale={editingSale}
            onCancelEdit={() => setEditingSale(null)}
            onSubmitSale={handleSubmitSale}
            showToast={showToast}
          />
        </div>

        <div className="xl:col-span-7 w-full">
          <TransactionTable
            sales={filteredSales}
            filterStartDate={filterStartDate}
            filterEndDate={filterEndDate}
            filterMonth={filterMonth}
            searchMemo={searchMemo}
            filterStaff={filterStaff}
            staffList={staffList}
            activeFilterBadge={activeFilterBadge}
            isAdmin={currentUser.role === 'admin'}
            onFilterStartDateChange={val => {
              setFilterStartDate(val);
              setFilterMonth('');
              setActiveFilterBadge('Custom Range');
            }}
            onFilterEndDateChange={val => {
              setFilterEndDate(val);
              setFilterMonth('');
              setActiveFilterBadge('Custom Range');
            }}
            onFilterMonthChange={val => {
              setFilterMonth(val);
              setFilterStartDate('');
              setFilterEndDate('');
              setActiveFilterBadge(`Month (${val})`);
            }}
            onSearchMemoChange={setSearchMemo}
            onFilterStaffChange={setFilterStaff}
            onFilterToday={handleFilterToday}
            onFilterRunningMonth={handleFilterRunningMonth}
            onReload={fetchBootstrapData}
            onPrintInvoice={sale => setInvoiceModalSale(sale)}
            onOpenSummaryReport={() => setSummaryReportOpen(true)}
            onEditSale={sale => setEditingSale(sale)}
            onDeleteSale={sale => setDeleteMemoSale(sale)}
          />
        </div>
      </div>

      {/* Modals */}
      {invoiceModalSale && (
        <InvoiceModal
          sale={invoiceModalSale}
          onClose={() => setInvoiceModalSale(null)}
        />
      )}

      {dueLedgerOpen && (
        <DueLedgerModal
          dueRecords={dueRecords}
          customerSummaries={customerSummaries}
          dueTotals={dueTotals}
          currentUser={currentUser.username}
          onClose={() => setDueLedgerOpen(false)}
          onOpenLedgerPrint={() => setLedgerPrintOpen(true)}
          onSubmitPayment={handleSubmitPayment}
          showToast={showToast}
        />
      )}

      {ledgerPrintOpen && (
        <LedgerPrintModal
          records={dueRecords}
          customerSummaries={customerSummaries}
          filterCustomer="ALL"
          startDate={filterStartDate}
          endDate={filterEndDate}
          month={filterMonth}
          currentUser={currentUser.username}
          onClose={() => setLedgerPrintOpen(false)}
        />
      )}

      {summaryReportOpen && (
        <SummaryReportModal
          sales={filteredSales}
          startDate={filterStartDate}
          endDate={filterEndDate}
          month={filterMonth}
          staff={filterStaff}
          currentUser={currentUser.username}
          onClose={() => setSummaryReportOpen(false)}
        />
      )}

      {stockInventoryOpen && (
        <StockInventoryModal
          products={products}
          onClose={() => setStockInventoryOpen(false)}
          onOpenStockPrint={() => setStockPrintOpen(true)}
          onOpenPurchase={() => setPurchaseOpen(true)}
          onOpenPaperUsage={() => setPaperUsageOpen(true)}
        />
      )}

      {stockPrintOpen && (
        <StockPrintModal
          products={products}
          currentUser={currentUser.username}
          onClose={() => setStockPrintOpen(false)}
        />
      )}

      {purchaseOpen && (
        <PurchaseModal
          purchases={purchases}
          products={products}
          currentUser={currentUser.username}
          isAdmin={currentUser.role === 'admin'}
          onClose={() => setPurchaseOpen(false)}
          onOpenPaperUsage={() => setPaperUsageOpen(true)}
          onSubmitPurchase={handleSubmitPurchase}
          onDeletePurchase={handleDeletePurchase}
          showToast={showToast}
        />
      )}

      {paperUsageOpen && (
        <PhotocopyPaperModal
          products={products}
          currentUser={currentUser.username}
          onClose={() => setPaperUsageOpen(false)}
          onSubmitPaperUsage={handleSubmitPaperUsage}
          showToast={showToast}
        />
      )}

      {expenseOpen && (
        <ExpenseModal
          expenses={expenses}
          currentUser={currentUser.username}
          onClose={() => setExpenseOpen(false)}
          onOpenExpensePrint={() => setExpensePrintOpen(true)}
          onSubmitExpense={handleSubmitExpense}
          onDeleteExpense={handleDeleteExpense}
          showToast={showToast}
        />
      )}

      {expensePrintOpen && (
        <ExpensePrintModal
          expenses={expenses}
          currentUser={currentUser.username}
          onClose={() => setExpensePrintOpen(false)}
        />
      )}

      {businessSummaryOpen && (
        <BusinessSummaryModal
          sales={sales}
          expenses={expenses}
          dueRecords={dueRecords}
          currentUser={currentUser.username}
          onClose={() => setBusinessSummaryOpen(false)}
        />
      )}

      {customerSalesOpen && (
        <CustomerSalesModal
          sales={sales}
          customers={customers}
          onClose={() => setCustomerSalesOpen(false)}
          onOpenCustomerSalesPrint={() => setCustomerSalesPrintOpen(true)}
          onPrintInvoice={sale => setInvoiceModalSale(sale)}
        />
      )}

      {customerSalesPrintOpen && (
        <CustomerSalesPrintModal
          sales={sales}
          customers={customers}
          startDate={filterStartDate}
          endDate={filterEndDate}
          currentUser={currentUser.username}
          onClose={() => setCustomerSalesPrintOpen(false)}
        />
      )}

      {cashClosingOpen && (
        <CashClosingModal
          cashClosings={cashClosings}
          sales={sales}
          expenses={expenses}
          dueRecords={dueRecords}
          currentUser={currentUser.username}
          onClose={() => setCashClosingOpen(false)}
          onOpenCashClosingPrint={() => {
            const today = new Date().toISOString().split('T')[0];
            const found = cashClosings.find(c => c.date === today) || null;
            setCashClosingPrintData(found);
            setCashClosingPrintOpen(true);
          }}
          onSubmitCashClosing={handleSubmitCashClosing}
          showToast={showToast}
        />
      )}

      {cashClosingPrintOpen && (
        <CashClosingPrintModal
          cashClosing={cashClosingPrintData}
          currentUser={currentUser.username}
          onClose={() => setCashClosingPrintOpen(false)}
        />
      )}

      {customerOpen && (
        <CustomerModal
          customers={customers}
          onClose={() => setCustomerOpen(false)}
          onSubmitCustomer={handleSubmitCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          showToast={showToast}
        />
      )}

      {productOpen && (
        <ProductModal
          products={products}
          onClose={() => setProductOpen(false)}
          onSubmitProduct={handleSubmitProduct}
          onDeleteProduct={handleDeleteProduct}
          showToast={showToast}
        />
      )}

      {userOpen && (
        <UserModal
          users={users}
          currentUser={currentUser.username}
          onClose={() => setUserOpen(false)}
          onSubmitUser={handleSubmitUser}
          onDeleteUser={handleDeleteUser}
          showToast={showToast}
        />
      )}

      {deleteMemoSale && (
        <DeleteMemoModal
          sale={deleteMemoSale}
          onClose={() => setDeleteMemoSale(null)}
          onConfirmDelete={handleDeleteSale}
        />
      )}

      {migrationOpen && (
        <MigrationModal
          onClose={() => setMigrationOpen(false)}
          showToast={showToast}
        />
      )}
    </Layout>
  );
}
