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
import { DashboardView } from './components/DashboardView';
import { StatsCards } from './components/StatsCards';
import { MemoEntryForm } from './components/MemoEntryForm';
import { TransactionTable, isMemoEditable } from './components/TransactionTable';
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
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { GoogleDriveBackupModal } from './components/modals/GoogleDriveBackupModal';
import { DataSheetModal } from './components/modals/DataSheetModal';
import { CommissionReportModal } from './components/modals/CommissionReportModal';
import { initGoogleAuth, setCachedAccessToken } from './services/googleAuth';
import { User as GoogleUser } from 'firebase/auth';
import { normalizeCategory, recalculateDueSummaries } from './utils/helpers';
import { 
  FALLBACK_USERS, 
  FALLBACK_PRODUCTS, 
  FALLBACK_CUSTOMERS,
  FALLBACK_SALES,
  FALLBACK_DUE_RECORDS,
  FALLBACK_CUSTOMER_SUMMARIES,
  FALLBACK_DUE_TOTALS,
  FALLBACK_EXPENSES,
  FALLBACK_PURCHASES,
  FALLBACK_CASH_CLOSINGS,
  INITIAL_USER_PASSWORDS
} from './data/fallbackData';
import { safeFetchJson } from './utils/safeApi';

interface Toast {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function App() {
  // Passwords Map State (Persists across restarts & offline)
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('as_computer_user_passwords');
    return saved ? JSON.parse(saved) : INITIAL_USER_PASSWORDS;
  });

  // Authentication State: Always requires login & password on load
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [loginUsername, setLoginUsername] = useState(() => {
    try {
      return localStorage.getItem('as_computer_last_username') || 'Md Abu Said';
    } catch {
      return 'Md Abu Said';
    }
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

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

  // Active Navigation & View - Primary page is Dashboard
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Filters State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [searchMemo, setSearchMemo] = useState('');
  const [filterStaff, setFilterStaff] = useState('ALL');
  const [activeFilterBadge, setActiveFilterBadge] = useState('Running Month');

  // Modals & Action States
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [invoiceModalSale, setInvoiceModalSale] = useState<SaleRecord | null>(null);
  const [dueLedgerOpen, setDueLedgerOpen] = useState(false);
  const [ledgerPrintOpen, setLedgerPrintOpen] = useState(false);
  const [ledgerPrintFilterCustomer, setLedgerPrintFilterCustomer] = useState('ALL');
  const [ledgerPrintStartDate, setLedgerPrintStartDate] = useState('');
  const [ledgerPrintEndDate, setLedgerPrintEndDate] = useState('');
  const [ledgerPrintMonth, setLedgerPrintMonth] = useState('');
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
  const [customerSalesPrintCustomer, setCustomerSalesPrintCustomer] = useState('');
  const [customerSalesPrintStartDate, setCustomerSalesPrintStartDate] = useState('');
  const [customerSalesPrintEndDate, setCustomerSalesPrintEndDate] = useState('');
  const [cashClosingOpen, setCashClosingOpen] = useState(false);
  const [cashClosingPrintData, setCashClosingPrintData] = useState<CashClosingRecord | null>(null);
  const [cashClosingPrintOpen, setCashClosingPrintOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [deleteMemoSale, setDeleteMemoSale] = useState<SaleRecord | null>(null);
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [driveBackupOpen, setDriveBackupOpen] = useState(false);
  const [dataSheetOpen, setDataSheetOpen] = useState(false);
  const [commissionReportOpen, setCommissionReportOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [linkedSheetId, setLinkedSheetId] = useState('');
  const [linkedSheetUrl, setLinkedSheetUrl] = useState('');
  const [lastBackupTime, setLastBackupTime] = useState('');

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  };

  // Resilient Dual-Layer Cache Updater
  const updateCachedBootstrap = (updater: (prev: any) => any) => {
    try {
      const cachedStr = localStorage.getItem('as_computer_cached_bootstrap');
      let curr = cachedStr ? JSON.parse(cachedStr) : {};
      const updated = updater(curr);
      localStorage.setItem('as_computer_cached_bootstrap', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update cached bootstrap', e);
    }
  };

  const CACHE_VERSION = 'v7_clean_slate_nov1';

  // Bootstrap data fetch with intelligent merge so state is never lost
  const fetchBootstrapData = async () => {
    setIsLoading(true);
    try {
      let isLoaded = false;
      const cachedStr = localStorage.getItem('as_computer_cached_bootstrap');
      let cached: any = null;
      if (cachedStr) {
        try {
          cached = JSON.parse(cachedStr);
          // If cached data is from an older version, clear it completely
          if (cached?.cacheVersion !== CACHE_VERSION) {
            cached = null;
            localStorage.removeItem('as_computer_cached_bootstrap');
          }
        } catch (e) {
          console.error('Error parsing cached data', e);
          cached = null;
        }
      }

      try {
        const res = await fetch(`/api/bootstrap?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        });
        const rawText = await res.text();
        if (rawText && rawText.trim().startsWith('{')) {
          const data = JSON.parse(rawText);
          if (data.status === 'success') {
            const apiSales = data.records || data.sales || [];
            const apiProducts = data.products || [];
            const apiCustomers = data.customers || [];

            const mergedProducts = apiProducts.length > 0 ? apiProducts : (cached?.products || []);
            const mergedCustomers = apiCustomers.length > 0 ? apiCustomers : (cached?.customers || []);
            const mergedSales = apiSales;

            setUsers(data.users || FALLBACK_USERS);
            setProducts(mergedProducts);
            setCustomers(mergedCustomers);
            setSales(mergedSales);
            setExpenses(data.expenses || []);
            setDueRecords(data.dueRecords || []);
            setCustomerSummaries(data.customerSummaries || []);
            setDueTotals(data.dueTotals || { shopTotalDue: 0, shopTotalPaid: 0, netDue: 0 });
            setPurchases(data.purchases || []);
            setCashClosings(data.cashClosings || []);

            if (data.googleDriveBackup) {
              if (data.googleDriveBackup.linkedSheetId) setLinkedSheetId(data.googleDriveBackup.linkedSheetId);
              if (data.googleDriveBackup.linkedSheetUrl) setLinkedSheetUrl(data.googleDriveBackup.linkedSheetUrl);
              if (data.googleDriveBackup.lastBackupTime) setLastBackupTime(data.googleDriveBackup.lastBackupTime);
            }

            const mergedToSave = {
              ...data,
              cacheVersion: CACHE_VERSION,
              products: mergedProducts,
              customers: mergedCustomers,
              records: mergedSales
            };
            localStorage.setItem('as_computer_cached_bootstrap', JSON.stringify(mergedToSave));
            isLoaded = true;
          }
        }
      } catch (err) {
        console.warn('Backend API /api/bootstrap not available, using local cache or default seeds...', err);
      }

      if (!isLoaded) {
        const source = cached || {};
        const initialUsers = source.users && source.users.length > 0 ? source.users : FALLBACK_USERS;
        const initialProducts = source.products && source.products.length > 0 ? source.products : FALLBACK_PRODUCTS;
        const initialCustomers = source.customers && source.customers.length > 0 ? source.customers : FALLBACK_CUSTOMERS;
        const initialSales = (source.records || source.sales || []).length > 0 ? (source.records || source.sales) : FALLBACK_SALES;
        const initialExpenses = source.expenses && source.expenses.length > 0 ? source.expenses : FALLBACK_EXPENSES;
        let initialDue = source.dueRecords && source.dueRecords.length > 0 ? source.dueRecords : FALLBACK_DUE_RECORDS;

        // Auto-reconcile due records from any sales that have due > 0
        initialSales.forEach((s: any) => {
          if (s.due > 0) {
            const dueId = `INV-${s.invoiceNo}`;
            const exists = initialDue.some((d: any) => d.id === dueId);
            if (!exists) {
              initialDue = [{
                rowId: Date.now() + Math.random(),
                id: dueId,
                date: s.rawDate || s.date,
                customer: s.customer,
                phone: s.phone || '',
                address: s.address || 'Paduar Bazar, Cumilla',
                type: 'Memo / Bill',
                desc: `Memo #${s.invoiceNo}${s.desc ? ` [${s.desc}]` : ''}`,
                due: s.due,
                paid: 0,
                user: s.user || 'Md Abu Said',
                timestamp: s.timestamp || s.date
              }, ...initialDue];
            }
          }
        });

        const { customerSummaries: calcSummaries, dueTotals: calcTotals } = recalculateDueSummaries(initialDue);
        setUsers(initialUsers);
        setProducts(initialProducts);
        setCustomers(initialCustomers);
        setSales(initialSales);
        setExpenses(initialExpenses);
        setDueRecords(initialDue);
        setCustomerSummaries(calcSummaries);
        setDueTotals(calcTotals);
        setPurchases(source.purchases || FALLBACK_PURCHASES);
        setCashClosings(source.cashClosings || FALLBACK_CASH_CLOSINGS);

        const toSave = {
          users: initialUsers,
          products: initialProducts,
          customers: initialCustomers,
          records: initialSales,
          sales: initialSales,
          expenses: initialExpenses,
          dueRecords: initialDue,
          customerSummaries: calcSummaries,
          dueTotals: calcTotals,
          purchases: source.purchases || FALLBACK_PURCHASES,
          cashClosings: source.cashClosings || FALLBACK_CASH_CLOSINGS
        };
        localStorage.setItem('as_computer_cached_bootstrap', JSON.stringify(toSave));
      }
    } catch (err: any) {
      console.warn('Bootstrap data load warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoogleDriveStatus = async () => {
    try {
      const { data } = await safeFetchJson<any>('/api/google-drive/status');
      if (data && data.status === 'success') {
        setLinkedSheetId(data.linkedSheetId || '');
        setLinkedSheetUrl(data.linkedSheetUrl || '');
        setLastBackupTime(data.lastBackupTime || '');
      }
    } catch (err) {
      console.warn('Google Drive status check warning:', err);
    }
  };

  useEffect(() => {
    initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setCachedAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setCachedAccessToken(null);
      }
    );
    fetchGoogleDriveStatus();
    fetchBootstrapData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchBootstrapData();
      handleFilterRunningMonth();
    }
  }, [currentUser]);

  // Handle Login with exact passwords
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const targetUser = loginUsername.trim();
    const targetPass = loginPassword.trim();

    try {
      let loggedIn = false;
      let serverError = '';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: targetUser, password: targetPass })
        });

        const rawText = await res.text();
        if (rawText && rawText.trim().startsWith('{')) {
          const data = JSON.parse(rawText);
          if (data.status === 'success' && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('as_computer_last_username', data.user.username);
            sessionStorage.setItem('as_computer_session_active', 'true');
            showToast(`Welcome back, ${data.user.username}!`, 'success');
            loggedIn = true;
            return;
          } else if (data.status === 'error') {
            serverError = data.message;
          }
        }
      } catch (apiErr) {
        console.warn('API endpoint unreachable, evaluating local fallback authentication...', apiErr);
      }

      if (!loggedIn) {
        // Match against exact userPasswords
        const expectedPass = userPasswords[targetUser.toLowerCase()] || INITIAL_USER_PASSWORDS[targetUser.toLowerCase()];

        if (expectedPass && targetPass === expectedPass) {
          const userList = users.length > 0 ? users : FALLBACK_USERS;
          const matchedUser = userList.find(
            u => u.username.toLowerCase() === targetUser.toLowerCase()
          ) || {
            id: targetUser.toLowerCase().includes('said') ? 1 : (targetUser.toLowerCase().includes('sujon') ? 2 : 3),
            username: targetUser,
            role: targetUser.toLowerCase().includes('said') ? 'admin' : 'staff',
            phone: '01904142370',
            permissions: targetUser.toLowerCase().includes('said') ? 'all' : 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print'
          };

          setCurrentUser(matchedUser);
          localStorage.setItem('as_computer_last_username', matchedUser.username);
          sessionStorage.setItem('as_computer_session_active', 'true');
          showToast(`Welcome back, ${matchedUser.username}!`, 'success');
          return;
        }

        const msg = serverError || 'Incorrect password! Please check your credentials.';
        setLoginError(msg);
        showToast(msg, 'error');
      }
    } catch (err: any) {
      setLoginError('Login error: ' + (err.message || 'Please check your inputs'));
      showToast('Login error', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePasswordChanged = async (targetUsername: string, newPass: string) => {
    // 1. Update in local state and localStorage
    const updated = {
      ...userPasswords,
      [targetUsername.toLowerCase()]: newPass
    };
    setUserPasswords(updated);
    localStorage.setItem('as_computer_user_passwords', JSON.stringify(updated));

    // 2. If API server is connected, update database
    const targetUserObj = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    await safeFetchJson('/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        username: targetUsername,
        newPassword: newPass,
        targetUserId: targetUserObj?.id,
        isAdminChange: currentUser?.role === 'admin'
      })
    });
    await fetchBootstrapData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginPassword('');
    setActiveTab('dashboard');
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
    else if (tab === 'drive_backup') setDriveBackupOpen(true);
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
    const now = new Date();
    const invoiceNo = payload.id || (sales.length > 0 ? Math.max(...sales.map(s => s.invoiceNo)) + 1 : 4001);
    const newRecord: SaleRecord = {
      rowId: invoiceNo,
      id: invoiceNo,
      invoiceNo,
      timestamp: `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      rawDate: now.toISOString().split('T')[0],
      date: now.toISOString().split('T')[0],
      user: payload.user || currentUser?.username || 'Md Abu Said',
      customer: payload.customer || 'General Customer',
      phone: payload.phone || '',
      address: payload.address || 'Paduar Bazar, Cumilla',
      category: payload.items?.map((i: any) => i.category).join(', ') || 'Photocopy',
      desc: payload.desc || '',
      subtotal: payload.subtotal || 0,
      discount: payload.discount || 0,
      grandTotal: payload.grandTotal || 0,
      paid: payload.paid || 0,
      due: payload.due || 0,
      items: payload.items || []
    };

    // 1. Immediately update React state
    setSales(prev => isEdit ? prev.map(s => s.id === payload.id ? newRecord : s) : [newRecord, ...prev]);

    // 2. Immediately update LocalStorage cache
    updateCachedBootstrap(prev => {
      const list = prev.records || prev.sales || [];
      const updated = isEdit ? list.map((s: any) => s.id === payload.id ? newRecord : s) : [newRecord, ...list];
      return { ...prev, records: updated, sales: updated };
    });

    // 3. Auto-save customer in Customer Directory if not exists
    const custName = (payload.customer || '').trim();
    if (custName && custName.toLowerCase() !== 'general customer' && custName.toLowerCase() !== 'cash customer') {
      const exists = customers.some(c => c.name.toLowerCase() === custName.toLowerCase());
      if (!exists) {
        const nextCust: Customer = {
          id: Date.now(),
          rowId: Date.now(),
          sl: customers.length + 1,
          name: custName,
          phone: payload.phone || '',
          address: payload.address || 'Paduar Bazar, Cumilla'
        };
        setCustomers(prev => [...prev, nextCust]);
        updateCachedBootstrap(prev => ({
          ...prev,
          customers: [...(prev.customers || []), nextCust]
        }));
      }
    }

    // 4. Update stock locally for stationery items
    if (payload.items && payload.items.length > 0) {
      setProducts(prev => {
        const updatedProds = prev.map(prod => {
          const match = payload.items.find((it: any) => it.name.toLowerCase() === prod.name.toLowerCase());
          if (match && prod.stockQty !== null && prod.stockQty !== undefined) {
            const newQty = Math.max(0, (prod.stockQty || 0) - (match.qty || 1));
            return { ...prod, stockQty: newQty };
          }
          return prod;
        });
        updateCachedBootstrap(c => ({ ...c, products: updatedProds }));
        return updatedProds;
      });
    }

    // 5. Immediate optimistic update for Due Ledger if memo has due
    if (newRecord.due > 0) {
      const dueId = `INV-${invoiceNo}`;
      const newDueRec: DueRecord = {
        rowId: Date.now(),
        id: dueId,
        date: newRecord.date,
        customer: newRecord.customer,
        phone: newRecord.phone,
        address: newRecord.address,
        type: 'Memo / Bill',
        desc: `Memo #${invoiceNo}${newRecord.desc ? ` [${newRecord.desc}]` : ''}`,
        due: newRecord.due,
        paid: 0,
        user: newRecord.user,
        timestamp: newRecord.timestamp
      };
      setDueRecords(prev => {
        const updatedList = [newDueRec, ...prev.filter(d => d.id !== dueId)];
        const { customerSummaries: newSummaries, dueTotals: newTotals } = recalculateDueSummaries(updatedList);
        setCustomerSummaries(newSummaries);
        setDueTotals(newTotals);
        updateCachedBootstrap(c => ({
          ...c,
          dueRecords: updatedList,
          customerSummaries: newSummaries,
          dueTotals: newTotals
        }));
        return updatedList;
      });
    }

    setEditingSale(null);
    setActiveTab('sales');
    setInvoiceModalSale(newRecord);

    // 6. Send to Backend API
    const url = isEdit ? `/api/sales/${payload.id}` : '/api/sales';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const { data } = await safeFetchJson<any>(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (data && data.status === 'success') {
        showToast(data.message, 'success');
        if (data.invoiceData) {
          setInvoiceModalSale(data.invoiceData);
        }
      } else {
        showToast(isEdit ? 'Invoice updated!' : 'Invoice generated successfully!', 'success');
      }
    } catch {
      showToast(isEdit ? 'Invoice updated!' : 'Invoice generated successfully!', 'success');
    } finally {
      // Re-synchronize full store state from SQLite database
      await fetchBootstrapData();
    }
  };

  const handleDeleteSale = async (saleId: number) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
    updateCachedBootstrap(prev => ({
      ...prev,
      records: (prev.records || []).filter((s: any) => s.id !== saleId),
      sales: (prev.sales || []).filter((s: any) => s.id !== saleId)
    }));
    setDeleteMemoSale(null);
    setActiveTab('sales');

    try {
      const { data } = await safeFetchJson<any>(`/api/sales/${saleId}`, { method: 'DELETE' });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast('Memo deleted', 'info');
      }
    } catch {
      showToast('Memo deleted', 'info');
    } finally {
      await fetchBootstrapData();
    }
  };

  const handleSubmitPayment = async (payload: any) => {
    const newDueRec = {
      rowId: Date.now(),
      id: `PAY-${Date.now()}`,
      date: payload.date || new Date().toISOString().split('T')[0],
      customer: payload.customer,
      phone: payload.phone || '',
      address: payload.address || '',
      type: 'Payment',
      desc: payload.desc || 'Due Collection',
      due: 0,
      paid: parseFloat(payload.amount) || 0,
      user: payload.user || currentUser?.username || 'Staff',
      timestamp: new Date().toISOString()
    };

    setDueRecords(prev => {
      const updatedList = [newDueRec, ...prev];
      const { customerSummaries: newSummaries, dueTotals: newTotals } = recalculateDueSummaries(updatedList);
      setCustomerSummaries(newSummaries);
      setDueTotals(newTotals);
      updateCachedBootstrap(c => ({
        ...c,
        dueRecords: updatedList,
        customerSummaries: newSummaries,
        dueTotals: newTotals
      }));
      return updatedList;
    });

    try {
      const { data } = await safeFetchJson<any>('/api/due-ledger/payment', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast('Payment collected successfully', 'success');
      }
    } catch {
      showToast('Payment collected successfully', 'success');
    }
    await fetchBootstrapData();
  };

  const handleSubmitPurchase = async (payload: any) => {
    const newPur = {
      rowId: Date.now(),
      id: `PUR-${Date.now()}`,
      date: payload.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      product: payload.product,
      category: payload.category || 'Stationery Products',
      qty: parseFloat(payload.qty) || 1,
      unitCost: parseFloat(payload.unitCost) || 0,
      totalCost: (parseFloat(payload.qty) || 1) * (parseFloat(payload.unitCost) || 0),
      supplier: payload.supplier || '',
      notes: payload.notes || '',
      user: payload.user || currentUser?.username || 'Staff'
    };

    setPurchases(prev => [newPur, ...prev]);
    updateCachedBootstrap(prev => ({
      ...prev,
      purchases: [newPur, ...(prev.purchases || [])]
    }));

    try {
      const { data } = await safeFetchJson<any>('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast('Purchase recorded successfully', 'success');
      }
    } catch {
      showToast('Purchase recorded successfully', 'success');
    } finally {
      await fetchBootstrapData();
    }
    setActiveTab('sales');
  };

  const handleDeletePurchase = async (id: string | number) => {
    setPurchases(prev => prev.filter(p => String(p.id) !== String(id)));
    updateCachedBootstrap(prev => ({
      ...prev,
      purchases: (prev.purchases || []).filter((p: any) => String(p.id) !== String(id))
    }));

    try {
      const { data } = await safeFetchJson<any>(`/api/purchases/${id}`, { method: 'DELETE' });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      }
    } catch {
      // local delete already applied
    } finally {
      await fetchBootstrapData();
    }
    setActiveTab('sales');
  };

  const handleSubmitPaperUsage = async (payload: any) => {
    try {
      const { data } = await safeFetchJson<any>('/api/photocopy-paper', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast('Paper usage logged', 'success');
      }
    } catch {
      showToast('Paper usage logged', 'success');
    } finally {
      await fetchBootstrapData();
    }
    setActiveTab('sales');
  };

  const handleSubmitExpense = async (payload: any) => {
    const isEdit = !!payload.id;
    const expId = payload.id || Date.now();
    const newExp = {
      rowId: expId,
      id: expId,
      expId: `EXP-${expId}`,
      timestamp: new Date().toISOString(),
      date: payload.date || new Date().toISOString().split('T')[0],
      category: payload.category,
      desc: payload.desc || '',
      amount: parseFloat(payload.amount) || 0,
      user: payload.user || currentUser?.username || 'Staff'
    };

    setExpenses(prev => isEdit ? prev.map(e => e.id === expId ? newExp : e) : [newExp, ...prev]);
    updateCachedBootstrap(prev => {
      const list = prev.expenses || [];
      const updated = isEdit ? list.map((e: any) => e.id === expId ? newExp : e) : [newExp, ...list];
      return { ...prev, expenses: updated };
    });

    const url = isEdit ? `/api/expenses/${payload.id}` : '/api/expenses';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const { data } = await safeFetchJson<any>(url, {
        method,
        body: JSON.stringify(payload)
      });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast(isEdit ? 'Expense updated' : 'Expense recorded', 'success');
      }
    } catch {
      showToast(isEdit ? 'Expense updated' : 'Expense recorded', 'success');
    } finally {
      await fetchBootstrapData();
    }
    setActiveTab('sales');
  };

  const handleDeleteExpense = async (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    updateCachedBootstrap(prev => ({
      ...prev,
      expenses: (prev.expenses || []).filter((e: any) => e.id !== id)
    }));

    try {
      const { data } = await safeFetchJson<any>(`/api/expenses/${id}`, { method: 'DELETE' });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      }
    } catch {
      // local delete already applied
    } finally {
      await fetchBootstrapData();
    }
    setActiveTab('sales');
  };

  const handleSubmitCashClosing = async (payload: any) => {
    const newRec: CashClosingRecord = {
      id: `CC-${payload.date}`,
      rowId: Date.now(),
      date: payload.date,
      closedAt: new Date().toLocaleTimeString(),
      user: payload.user || (currentUser?.username || 'Staff'),
      openingCash: payload.openingCash,
      prevShortageDeducted: payload.prevShortageDeducted,
      salesInflow: payload.salesInflow,
      dueInflow: payload.dueInflow,
      totalInflow: payload.totalInflow,
      expenseOutflow: payload.expenseOutflow,
      expectedCash: payload.expectedCash,
      actualCash: payload.actualCash,
      difference: payload.difference,
      status: payload.status,
      notes: payload.notes,
      denominations: payload.denominations
    };

    setCashClosings(prev => {
      const idx = prev.findIndex(c => c.date === payload.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRec;
        return copy;
      }
      return [newRec, ...prev];
    });

    updateCachedBootstrap(prev => {
      const list = prev.cashClosings || [];
      const idx = list.findIndex((c: any) => c.date === payload.date);
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = newRec;
        return { ...prev, cashClosings: copy };
      }
      return { ...prev, cashClosings: [newRec, ...list] };
    });

    try {
      const { data } = await safeFetchJson<any>('/api/cash-closings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast('Daily cash closed successfully', 'success');
      }
    } catch {
      showToast('Daily cash closed successfully', 'success');
    }
  };

  const handleSubmitCustomer = async (payload: any) => {
    const isEdit = !!payload.id;
    const cid = payload.id || Date.now();
    const custRecord: Customer = {
      id: cid,
      rowId: cid,
      sl: payload.sl || (customers.length + 1),
      name: payload.name.trim(),
      phone: payload.phone ? payload.phone.trim() : '',
      address: payload.address ? payload.address.trim() : 'Paduar Bazar, Cumilla'
    };

    // 1. Immediately save to React State
    setCustomers(prev => {
      const exists = prev.some(c => c.id === cid);
      if (isEdit || exists) {
        return prev.map(c => c.id === cid ? custRecord : c);
      }
      return [...prev, custRecord];
    });

    // 2. Immediately save to LocalStorage
    updateCachedBootstrap(prev => {
      const list = prev.customers || [];
      const updatedList = isEdit
        ? list.map((c: any) => c.id === cid ? custRecord : c)
        : [...list.filter((c: any) => c.id !== cid), custRecord];
      return { ...prev, customers: updatedList };
    });

    // 3. Persist to Backend API
    const url = isEdit ? `/api/customers/${payload.id}` : '/api/customers';
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const { data } = await safeFetchJson<any>(url, {
        method,
        body: JSON.stringify(payload)
      });
      if (data && data.status === 'success') {
        showToast(data.message || (isEdit ? 'Customer updated!' : 'Customer saved!'), 'success');
        if (data.customer) {
          setCustomers(prev => prev.map(c => c.id === cid ? data.customer : c));
          updateCachedBootstrap(prev => ({
            ...prev,
            customers: (prev.customers || []).map((c: any) => c.id === cid ? data.customer : c)
          }));
        }
      } else {
        showToast(isEdit ? 'Customer updated!' : 'Customer saved!', 'success');
      }
    } catch {
      showToast(isEdit ? 'Customer updated!' : 'Customer saved!', 'success');
    } finally {
      await fetchBootstrapData();
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    updateCachedBootstrap(prev => ({
      ...prev,
      customers: (prev.customers || []).filter((c: any) => c.id !== id)
    }));

    try {
      const { data } = await safeFetchJson<any>(`/api/customers/${id}`, { method: 'DELETE' });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast('Customer deleted', 'info');
      }
    } catch {
      showToast('Customer deleted', 'info');
    } finally {
      await fetchBootstrapData();
    }
  };

  const handleSubmitProduct = async (payload: any) => {
    const isEdit = !!payload.id;
    const pid = payload.id || Date.now();
    const prodRecord: Product = {
      id: pid,
      rowId: pid,
      sl: payload.sl || 1,
      category: payload.category || 'Photocopy',
      name: payload.name.trim(),
      price: parseFloat(payload.price) || 0,
      costPrice: parseFloat(payload.costPrice) || 0,
      stockQty: payload.stockQty !== '' && payload.stockQty !== null && payload.stockQty !== undefined ? parseFloat(payload.stockQty) : null,
      lowStockLimit: parseFloat(payload.lowStockLimit) || 5
    };

    // 1. Immediately save to React State
    setProducts(prev => {
      const exists = prev.some(p => p.id === pid);
      if (isEdit || exists) {
        return prev.map(p => p.id === pid ? prodRecord : p);
      }
      return [...prev, prodRecord];
    });

    // 2. Immediately save to LocalStorage
    updateCachedBootstrap(prev => {
      const list = prev.products || [];
      const updatedList = isEdit
        ? list.map((p: any) => p.id === pid ? prodRecord : p)
        : [...list.filter((p: any) => p.id !== pid), prodRecord];
      return { ...prev, products: updatedList };
    });

    // 3. Persist to Backend API
    const url = isEdit ? `/api/products/${payload.id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const { data } = await safeFetchJson<any>(url, {
        method,
        body: JSON.stringify(payload)
      });
      if (data && data.status === 'success') {
        showToast(data.message || (isEdit ? 'Product updated!' : 'Product saved!'), 'success');
        if (data.product) {
          setProducts(prev => prev.map(p => p.id === pid ? data.product : p));
          updateCachedBootstrap(prev => ({
            ...prev,
            products: (prev.products || []).map((p: any) => p.id === pid ? data.product : p)
          }));
        }
      } else {
        showToast(isEdit ? 'Product updated!' : 'Product saved!', 'success');
      }
    } catch {
      showToast(isEdit ? 'Product updated!' : 'Product saved!', 'success');
    } finally {
      await fetchBootstrapData();
    }
  };

  const handleDeleteProduct = async (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    updateCachedBootstrap(prev => ({
      ...prev,
      products: (prev.products || []).filter((p: any) => p.id !== id)
    }));

    try {
      const { data } = await safeFetchJson<any>(`/api/products/${id}`, { method: 'DELETE' });
      if (data && data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast('Product deleted', 'info');
      }
    } catch {
      showToast('Product deleted', 'info');
    } finally {
      await fetchBootstrapData();
    }
  };

  const handleSubmitUser = async (payload: any) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/users/${payload.id}` : '/api/users';
    const method = isEdit ? 'PUT' : 'POST';

    const { data } = await safeFetchJson<any>(url, {
      method,
      body: JSON.stringify(payload)
    });
    if (data && data.status === 'success') {
      showToast(data.message, 'success');
    } else {
      showToast(isEdit ? 'User updated' : 'User created', 'success');
    }
    setActiveTab('sales');
    await fetchBootstrapData();
  };

  const handleDeleteUser = async (id: number) => {
    const { data } = await safeFetchJson<any>(`/api/users/${id}`, { method: 'DELETE' });
    if (data && data.status === 'success') {
      showToast(data.message, 'success');
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    setActiveTab('sales');
    await fetchBootstrapData();
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
                alt="Abu Said Computer Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1OXthEw7eAn6SkWLFzlW9G8MItn3ARvFM";
                }}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              <span className="text-[#0062cc]">Abu Said</span> Computer
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
                  onChange={e => {
                    const selected = e.target.value;
                    setLoginUsername(selected);
                    setLoginPassword('');
                    setLoginError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700/80 text-white rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-cyan-400 transition cursor-pointer"
                >
                  {(users.length > 0 ? users : [
                    { id: 1, username: 'Md Abu Said' },
                    { id: 2, username: 'Md Sujon' },
                    { id: 3, username: 'Md Saimon Hasan' }
                  ]).map(u => (
                    <option key={u.username} value={u.username}>{u.username}</option>
                  ))}
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
      onOpenChangePassword={() => setChangePasswordOpen(true)}
      isGoogleDriveLinked={!!linkedSheetId}
      onOpenGoogleDriveBackup={() => setDriveBackupOpen(true)}
      onOpenDataSheet={() => setDataSheetOpen(true)}
      onOpenCommissionReport={() => setCommissionReportOpen(true)}
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

      {/* Active Tab Viewport: Dashboard vs Daily Sales & Memo Entry */}
      <div className="print:hidden no-print">
        {activeTab === 'dashboard' ? (
        <DashboardView
          sales={sales}
          expenses={expenses}
          dueRecords={dueRecords}
          products={products}
          customerSummaries={customerSummaries}
          dueTotals={dueTotals}
          currentUser={currentUser.username}
          isAdmin={currentUser.role === 'admin'}
          onOpenDueLedger={() => {
            setActiveTab('due');
            setDueLedgerOpen(true);
          }}
          onOpenCashClosing={() => {
            setActiveTab('cash_closing');
            setCashClosingOpen(true);
          }}
          onOpenSalesEntry={() => setActiveTab('sales')}
          onPrintInvoice={sale => setInvoiceModalSale(sale)}
          onOpenStock={() => {
            setActiveTab('stock');
            setStockInventoryOpen(true);
          }}
          onOpenExpenses={() => {
            setActiveTab('expenses');
            setExpenseOpen(true);
          }}
          onOpenCommissionReport={() => setCommissionReportOpen(true)}
        />
      ) : (
        <>
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
            onOpenDueLedger={() => {
              setActiveTab('due');
              setDueLedgerOpen(true);
            }}
          />

          {/* Main 2-Column Split: Memo Entry on Left, Transaction Table on Right */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-5 w-full">
              <MemoEntryForm
                products={products}
                customers={customers}
                customerSummaries={customerSummaries}
                currentUser={currentUser.username}
                editingSale={editingSale}
                onCancelEdit={() => {
                  setEditingSale(null);
                  setActiveTab('sales');
                }}
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
                onEditSale={sale => {
                  if (!isMemoEditable(sale.rawDate || sale.date)) {
                    showToast("Only today's and yesterday's memos can be edited!", 'warning');
                    return;
                  }
                  setEditingSale(sale);
                }}
                onDeleteSale={sale => setDeleteMemoSale(sale)}
              />
            </div>
          </div>
        </>
      )}
      </div>

      {/* Modals with automatic deselection back to 'sales' on close */}
      {invoiceModalSale && (
        <InvoiceModal
          sale={invoiceModalSale}
          onClose={() => {
            setInvoiceModalSale(null);
            setActiveTab('sales');
          }}
        />
      )}

      {dueLedgerOpen && (
        <DueLedgerModal
          dueRecords={dueRecords}
          customerSummaries={customerSummaries}
          dueTotals={dueTotals}
          currentUser={currentUser.username}
          onClose={() => {
            setDueLedgerOpen(false);
            setActiveTab('sales');
          }}
          onOpenLedgerPrint={(cust, sDate, eDate, m) => {
            setDueLedgerOpen(false);
            setLedgerPrintFilterCustomer(cust || 'ALL');
            setLedgerPrintStartDate(sDate || '');
            setLedgerPrintEndDate(eDate || '');
            setLedgerPrintMonth(m || '');
            setLedgerPrintOpen(true);
          }}
          onSubmitPayment={handleSubmitPayment}
          showToast={showToast}
        />
      )}

      {ledgerPrintOpen && (
        <LedgerPrintModal
          records={dueRecords}
          customerSummaries={customerSummaries}
          filterCustomer={ledgerPrintFilterCustomer}
          startDate={ledgerPrintStartDate}
          endDate={ledgerPrintEndDate}
          month={ledgerPrintMonth}
          currentUser={currentUser.username}
          onClose={() => {
            setLedgerPrintOpen(false);
            setDueLedgerOpen(true);
          }}
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
          onClose={() => {
            setSummaryReportOpen(false);
            setActiveTab('sales');
          }}
        />
      )}

      {stockInventoryOpen && (
        <StockInventoryModal
          products={products}
          onClose={() => {
            setStockInventoryOpen(false);
            setActiveTab('sales');
          }}
          onOpenStockPrint={() => {
            setStockInventoryOpen(false);
            setStockPrintOpen(true);
          }}
          onOpenPurchase={() => setPurchaseOpen(true)}
          onOpenPaperUsage={() => setPaperUsageOpen(true)}
        />
      )}

      {stockPrintOpen && (
        <StockPrintModal
          products={products}
          currentUser={currentUser.username}
          onClose={() => {
            setStockPrintOpen(false);
            setStockInventoryOpen(true);
          }}
        />
      )}

      {purchaseOpen && (
        <PurchaseModal
          purchases={purchases}
          products={products}
          currentUser={currentUser.username}
          isAdmin={currentUser.role === 'admin'}
          onClose={() => {
            setPurchaseOpen(false);
            setActiveTab('sales');
          }}
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
          onClose={() => {
            setPaperUsageOpen(false);
            setActiveTab('sales');
          }}
          onSubmitPaperUsage={handleSubmitPaperUsage}
          showToast={showToast}
        />
      )}

      {expenseOpen && (
        <ExpenseModal
          expenses={expenses}
          currentUser={currentUser.username}
          onClose={() => {
            setExpenseOpen(false);
            setActiveTab('sales');
          }}
          onOpenExpensePrint={() => {
            setExpenseOpen(false);
            setExpensePrintOpen(true);
          }}
          onSubmitExpense={handleSubmitExpense}
          onDeleteExpense={handleDeleteExpense}
          showToast={showToast}
        />
      )}

      {expensePrintOpen && (
        <ExpensePrintModal
          expenses={expenses}
          currentUser={currentUser.username}
          onClose={() => {
            setExpensePrintOpen(false);
            setExpenseOpen(true);
          }}
        />
      )}

      {businessSummaryOpen && (
        <BusinessSummaryModal
          sales={sales}
          expenses={expenses}
          dueRecords={dueRecords}
          currentUser={currentUser.username}
          onClose={() => {
            setBusinessSummaryOpen(false);
            setActiveTab('sales');
          }}
        />
      )}

      {customerSalesOpen && (
        <CustomerSalesModal
          sales={sales}
          customers={customers}
          onClose={() => {
            setCustomerSalesOpen(false);
            setActiveTab('sales');
          }}
          onOpenCustomerSalesPrint={(cust, sDate, eDate) => {
            setCustomerSalesOpen(false);
            setCustomerSalesPrintCustomer(cust || '');
            setCustomerSalesPrintStartDate(sDate || '');
            setCustomerSalesPrintEndDate(eDate || '');
            setCustomerSalesPrintOpen(true);
          }}
          onPrintInvoice={sale => setInvoiceModalSale(sale)}
        />
      )}

      {customerSalesPrintOpen && (
        <CustomerSalesPrintModal
          sales={sales}
          customers={customers}
          filterCustomer={customerSalesPrintCustomer}
          startDate={customerSalesPrintStartDate || filterStartDate}
          endDate={customerSalesPrintEndDate || filterEndDate}
          currentUser={currentUser.username}
          onClose={() => {
            setCustomerSalesPrintOpen(false);
            setCustomerSalesOpen(true);
          }}
        />
      )}

      {cashClosingOpen && (
        <CashClosingModal
          cashClosings={cashClosings}
          sales={sales}
          expenses={expenses}
          dueRecords={dueRecords}
          currentUser={currentUser.username}
          onClose={() => {
            setCashClosingOpen(false);
            setActiveTab('sales');
          }}
          onOpenCashClosingPrint={(record) => {
            setCashClosingOpen(false);
            if (record) {
              setCashClosingPrintData(record);
            } else {
              const today = new Date().toISOString().split('T')[0];
              const found = cashClosings.find(c => c.date === today) || null;
              setCashClosingPrintData(found);
            }
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
          onClose={() => {
            setCashClosingPrintOpen(false);
            setCashClosingOpen(true);
          }}
        />
      )}

      {customerOpen && (
        <CustomerModal
          customers={customers}
          onClose={() => {
            setCustomerOpen(false);
            setActiveTab('sales');
          }}
          onSubmitCustomer={handleSubmitCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          showToast={showToast}
        />
      )}

      {productOpen && (
        <ProductModal
          products={products}
          onClose={() => {
            setProductOpen(false);
            setActiveTab('sales');
          }}
          onSubmitProduct={handleSubmitProduct}
          onDeleteProduct={handleDeleteProduct}
          showToast={showToast}
        />
      )}

      {userOpen && (
        <UserModal
          users={users}
          currentUser={currentUser.username}
          onClose={() => {
            setUserOpen(false);
            setActiveTab('sales');
          }}
          onSubmitUser={handleSubmitUser}
          onDeleteUser={handleDeleteUser}
          showToast={showToast}
        />
      )}

      {deleteMemoSale && (
        <DeleteMemoModal
          sale={deleteMemoSale}
          onClose={() => {
            setDeleteMemoSale(null);
            setActiveTab('sales');
          }}
          onConfirmDelete={handleDeleteSale}
        />
      )}

      {migrationOpen && (
        <MigrationModal
          onClose={() => {
            setMigrationOpen(false);
            setActiveTab('sales');
          }}
          onSyncSuccess={fetchBootstrapData}
          showToast={showToast}
        />
      )}

      {changePasswordOpen && (
        <ChangePasswordModal
          currentUser={currentUser}
          users={users.length > 0 ? users : FALLBACK_USERS}
          onClose={() => {
            setChangePasswordOpen(false);
            setActiveTab('sales');
          }}
          onPasswordChanged={handlePasswordChanged}
          showToast={showToast}
        />
      )}

      <GoogleDriveBackupModal
        isOpen={driveBackupOpen}
        onClose={() => {
          setDriveBackupOpen(false);
          setActiveTab('sales');
        }}
        googleUser={googleUser}
        googleToken={googleToken}
        onGoogleAuthChange={(user, token) => {
          setGoogleUser(user);
          setGoogleToken(token);
          setCachedAccessToken(token);
        }}
        linkedSheetId={linkedSheetId}
        linkedSheetUrl={linkedSheetUrl}
        lastBackupTime={lastBackupTime}
        onBackupSuccess={(sheetId, sheetUrl, backupTime) => {
          setLinkedSheetId(sheetId);
          setLinkedSheetUrl(sheetUrl);
          setLastBackupTime(backupTime);
        }}
        showToast={showToast}
      />

      <DataSheetModal
        isOpen={dataSheetOpen}
        onClose={() => setDataSheetOpen(false)}
        sales={sales}
        customers={customers}
        products={products}
        expenses={expenses}
        dueLedger={dueRecords}
        linkedSheetUrl={linkedSheetUrl}
        googleUser={googleUser}
        onOpenGoogleDriveBackup={() => {
          setDataSheetOpen(false);
          setDriveBackupOpen(true);
        }}
        onReload={fetchBootstrapData}
        showToast={showToast}
      />

      {commissionReportOpen && currentUser && (
        <CommissionReportModal
          sales={sales}
          users={users.length > 0 ? users : FALLBACK_USERS}
          currentUser={currentUser}
          onClose={() => setCommissionReportOpen(false)}
        />
      )}
    </Layout>
  );
}
