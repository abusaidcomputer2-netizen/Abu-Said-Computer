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
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';
import { GoogleDriveBackupModal } from './components/modals/GoogleDriveBackupModal';
import { DataSheetModal } from './components/modals/DataSheetModal';
import { CommissionReportModal } from './components/modals/CommissionReportModal';
import { initGoogleAuth, setCachedAccessToken } from './services/googleAuth';
import { User as GoogleUser } from 'firebase/auth';
import { normalizeCategory, recalculateDueSummaries, getLocalDateStr, isDateTodayOrYesterday } from './utils/helpers';
import { 
  FALLBACK_USERS, 
  FALLBACK_PRODUCTS, 
  FALLBACK_CUSTOMERS,
  FALLBACK_SALES,
  FALLBACK_DUE_RECORDS,
  FALLBACK_EXPENSES,
  FALLBACK_PURCHASES,
  FALLBACK_CASH_CLOSINGS,
  INITIAL_USER_PASSWORDS
} from './data/fallbackData';
import { safeFetchJson } from './utils/safeApi';
import { loadLocalBootstrapSnapshot, saveLocalBootstrapSnapshot } from './utils/localPersistence';

interface Toast {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const formatMmmYyyy = (ym: string): string => {
  if (!ym) return '';
  const parts = ym.split('-');
  if (parts.length !== 2) return ym;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return ym;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mmm = monthNames[month - 1] || '';
  return `${mmm}-${year}`;
};

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
  const initialCurrentYm = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMonth, setFilterMonth] = useState(initialCurrentYm);
  const [searchMemo, setSearchMemo] = useState('');
  const [filterStaff, setFilterStaff] = useState('ALL');
  const [activeFilterBadge, setActiveFilterBadge] = useState(() => formatMmmYyyy(initialCurrentYm));

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

  const CACHE_VERSION = 'v13_clean_due';

  // Resilient Dual-Layer Cache Updater (localStorage + IndexedDB, always stamps cacheVersion)
  const updateCachedBootstrap = (updater: (prev: any) => any) => {
    try {
      const cachedStr = localStorage.getItem('as_computer_cached_bootstrap');
      let curr = cachedStr ? JSON.parse(cachedStr) : {};
      const updated = updater({ cacheVersion: CACHE_VERSION, ...curr });
      saveLocalBootstrapSnapshot(updated, CACHE_VERSION);
    } catch (e) {
      console.error('Failed to update cached bootstrap', e);
    }
  };

  // Bootstrap data fetch with intelligent merge so state is never lost
  const fetchBootstrapData = async () => {
    setIsLoading(true);
    try {
      let isLoaded = false;
      const cached = await loadLocalBootstrapSnapshot(CACHE_VERSION);

      // Clean up any stale delete arrays from older sessions
      try {
        localStorage.removeItem('as_computer_deleted_products');
        localStorage.removeItem('as_computer_deleted_customers');
      } catch {}

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

            const mergedProducts = apiProducts.length > 0 ? apiProducts : (cached?.products?.length ? cached.products : FALLBACK_PRODUCTS);
            const mergedCustomers = apiCustomers;
            const mergedSales = apiSales.length > 0 ? apiSales : (cached?.records?.length ? cached.records : []);

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
              records: mergedSales,
              sales: mergedSales
            };
            saveLocalBootstrapSnapshot(mergedToSave, CACHE_VERSION);
            isLoaded = true;
          }
        }
      } catch (err) {
        console.warn('Backend API /api/bootstrap not available, using local cache or seeded snapshot...', err);
      }

      if (!isLoaded) {
        const source = cached || {};
        const initialUsers = source.users && source.users.length > 0 ? source.users : FALLBACK_USERS;
        const initialProducts = source.products && source.products.length > 0 ? source.products : FALLBACK_PRODUCTS;
        const initialCustomers = Array.isArray(source.customers) ? source.customers : FALLBACK_CUSTOMERS;
        const initialSales = (source.records || source.sales || []).length > 0 ? (source.records || source.sales) : FALLBACK_SALES;
        const initialExpenses = Array.isArray(source.expenses) ? source.expenses : FALLBACK_EXPENSES;
        const initialDue = Array.isArray(source.dueRecords) ? source.dueRecords : FALLBACK_DUE_RECORDS;

        const { customerSummaries: calcSummaries, dueTotals: calcTotals } = recalculateDueSummaries(initialDue);
        setUsers(initialUsers);
        setProducts(initialProducts);
        setCustomers(initialCustomers);
        setSales(initialSales);
        setExpenses(initialExpenses);
        setDueRecords(initialDue);
        setCustomerSummaries(calcSummaries);
        setDueTotals(calcTotals);
        setPurchases(Array.isArray(source.purchases) ? source.purchases : FALLBACK_PURCHASES);
        setCashClosings(Array.isArray(source.cashClosings) ? source.cashClosings : FALLBACK_CASH_CLOSINGS);

        const toSave = {
          cacheVersion: CACHE_VERSION,
          users: initialUsers,
          products: initialProducts,
          customers: initialCustomers,
          records: initialSales,
          sales: initialSales,
          expenses: initialExpenses,
          dueRecords: initialDue,
          customerSummaries: calcSummaries,
          dueTotals: calcTotals,
          purchases: Array.isArray(source.purchases) ? source.purchases : FALLBACK_PURCHASES,
          cashClosings: Array.isArray(source.cashClosings) ? source.cashClosings : FALLBACK_CASH_CLOSINGS
        };
        saveLocalBootstrapSnapshot(toSave, CACHE_VERSION);
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

  const handlePasswordChanged = async (targetUsername: string, newPass: string, currentPass?: string) => {
    const targetUserObj = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    const isAdminChange = currentUser?.role === 'admin';
    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>('/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify({
        username: targetUsername,
        newPassword: newPass,
        currentPassword: currentPass || '',
        targetUserId: targetUserObj?.id,
        isAdminChange
      })
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      throw new Error(data?.message || error || 'Failed to update password');
    }

    if (backendUnavailable && !isAdminChange) {
      const expected = userPasswords[targetUsername.trim().toLowerCase()] || INITIAL_USER_PASSWORDS[targetUsername.trim().toLowerCase()];
      if (!currentPass || expected !== currentPass.trim()) {
        throw new Error('Current password is incorrect');
      }
    }

    const updated = {
      ...userPasswords,
      [targetUsername.trim().toLowerCase()]: newPass.trim()
    };
    setUserPasswords(updated);
    localStorage.setItem('as_computer_user_passwords', JSON.stringify(updated));
    showToast(data?.message || `Password successfully updated for ${targetUsername}!`, 'success');
    if (!backendUnavailable) {
      await fetchBootstrapData();
    }
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
    const today = getLocalDateStr();
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
    setActiveFilterBadge(formatMmmYyyy(ym));
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
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('At least one item is required to create an invoice!');
    }

    const isEdit = !!payload.id;
    const origSale = isEdit ? sales.find(s => s.id === payload.id) : null;
    const now = new Date();
    const todayLocal = getLocalDateStr(now);
    const newId = payload.id || Date.now();
    const invoiceNo = origSale?.invoiceNo || (isEdit ? payload.id : Math.max(4000, ...sales.map(s => s.invoiceNo || 4000)) + 1);
    const cleanPhone = (payload.phone || '').trim();
    const normPhone = cleanPhone.replace(/[\s\-\(\)]/g, '');
    const matchedCust = (normPhone ? customers.find(c => (c.phone || '').replace(/[\s\-\(\)]/g, '') === normPhone) : null)
      || customers.find(c => c.name.toLowerCase() === (payload.customer || '').trim().toLowerCase());
    const isCashCust = (payload.customer || '').trim().toLowerCase() === 'cash customer';
    const finalCustAddress = isCashCust ? '' : ((payload.address || '').trim() || matchedCust?.address || '');
    const categorySummary = Array.from(new Set((payload.items || []).map((i: any) => i.category).filter(Boolean))).join(', ') || 'Photocopy';

    const fallbackRecord: SaleRecord = {
      rowId: newId,
      id: newId,
      invoiceNo,
      timestamp: origSale?.timestamp || now.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      rawDate: origSale?.rawDate || todayLocal,
      date: origSale?.date || todayLocal,
      user: origSale?.user || payload.user || currentUser?.username || 'Md Abu Said',
      customer: payload.customer || 'Cash Customer',
      phone: cleanPhone,
      address: finalCustAddress,
      category: categorySummary,
      desc: payload.desc || '',
      subtotal: payload.subtotal || 0,
      discount: payload.discount || 0,
      grandTotal: payload.grandTotal || 0,
      paid: payload.paid || 0,
      due: payload.due || 0,
      items: payload.items || []
    };

    const url = isEdit ? `/api/sales/${payload.id}` : '/api/sales';
    const method = isEdit ? 'PUT' : 'POST';

    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      if (!backendUnavailable) await fetchBootstrapData();
      throw new Error(data?.message || error || 'Failed to save memo');
    }

    const finalRecord: SaleRecord = data?.invoiceData || fallbackRecord;

    if (backendUnavailable) {
      // Static-host / offline full local business-logic persistence
      if (isEdit && origSale && !isDateTodayOrYesterday(origSale.rawDate || origSale.date)) {
        const origGrand = Math.round((origSale.grandTotal || 0) * 100) / 100;
        const newGrand = Math.round((finalRecord.grandTotal || 0) * 100) / 100;
        if (Math.abs(newGrand - origGrand) > 0.01) {
          throw new Error(`পুরাতন মেমোতে মোট টাকার পরিমাণ পরিবর্তন করা যাবে না! মূল বিল ছিল Tk ${origGrand}।`);
        }
      }

      // Compute stationery quantity delta against current products stock
      const oldQtyByName: Record<string, number> = {};
      if (isEdit && origSale?.items) {
        origSale.items.forEach((it: any) => {
          if (it.category && it.category.toLowerCase().includes('stationery') && it.name) {
            const k = it.name.trim().toLowerCase();
            oldQtyByName[k] = (oldQtyByName[k] || 0) + (parseFloat(it.qty) || 0);
          }
        });
      }
      const newQtyByName: Record<string, number> = {};
      (finalRecord.items || []).forEach((it: any) => {
        if (it.category && it.category.toLowerCase().includes('stationery') && it.name) {
          const k = it.name.trim().toLowerCase();
          newQtyByName[k] = (newQtyByName[k] || 0) + (parseFloat(it.qty) || 1);
        }
      });

      const updatedProducts = products.map(p => {
        const k = p.name.trim().toLowerCase();
        const delta = (newQtyByName[k] || 0) - (oldQtyByName[k] || 0);
        if (delta !== 0 && p.stockQty !== null && p.stockQty !== undefined) {
          if (delta > p.stockQty) {
            throw new Error(`Insufficient stock for "${p.name}" (Stock: ${p.stockQty})!`);
          }
          return { ...p, stockQty: Math.max(0, p.stockQty - delta) };
        }
        return p;
      });

      const updatedSales = isEdit
        ? sales.map(s => s.id === payload.id ? finalRecord : s)
        : [finalRecord, ...sales];

      // Sync Due Ledger locally
      let updatedDue = [...dueRecords];
      const dueId = `INV-${finalRecord.invoiceNo}`;
      const existingIdx = updatedDue.findIndex(d => d.id === dueId || (d.desc || '').includes(`Memo #${finalRecord.invoiceNo}`));
      const dueDesc = finalRecord.desc
        ? `Memo #${finalRecord.invoiceNo} - ${finalRecord.category} [${finalRecord.desc}]`
        : `Memo #${finalRecord.invoiceNo} - ${finalRecord.category}`;

      if ((finalRecord.due || 0) > 0) {
        const dueEntry: DueRecord = {
          rowId: existingIdx >= 0 ? updatedDue[existingIdx].rowId : Date.now(),
          id: dueId,
          date: finalRecord.rawDate || finalRecord.date,
          customer: finalRecord.customer,
          phone: finalRecord.phone || '',
          address: finalRecord.address || '',
          type: 'Memo / Bill',
          desc: dueDesc,
          due: finalRecord.due,
          paid: 0,
          user: finalRecord.user,
          timestamp: finalRecord.timestamp
        };
        if (existingIdx >= 0) updatedDue[existingIdx] = dueEntry;
        else updatedDue = [dueEntry, ...updatedDue];
      } else if (existingIdx >= 0) {
        const prevDesc = updatedDue[existingIdx].desc || '';
        updatedDue[existingIdx] = {
          ...updatedDue[existingIdx],
          due: 0,
          desc: prevDesc.includes('[Paid in Full]') ? prevDesc : `${prevDesc} [Paid in Full]`.trim()
        };
      }

      const { customerSummaries: newSummaries, dueTotals: newTotals } = recalculateDueSummaries(updatedDue);

      setProducts(updatedProducts);
      setSales(updatedSales);
      setDueRecords(updatedDue);
      setCustomerSummaries(newSummaries);
      setDueTotals(newTotals);

      updateCachedBootstrap(prev => ({
        ...prev,
        products: updatedProducts,
        records: updatedSales,
        sales: updatedSales,
        dueRecords: updatedDue,
        customerSummaries: newSummaries,
        dueTotals: newTotals
      }));
    } else {
      await fetchBootstrapData();
    }

    setEditingSale(null);
    setActiveTab('sales');
    setInvoiceModalSale(finalRecord);
    showToast(data?.message || (isEdit ? 'Invoice updated!' : 'Invoice generated successfully!'), 'success');
  };

  const handleDeleteSale = async (saleId: number) => {
    setDeleteMemoSale(null);
    setActiveTab('sales');

    try {
      const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(`/api/sales/${saleId}`, { method: 'DELETE' });
      if (data?.status === 'error' || (!ok && !backendUnavailable)) {
        showToast(data?.message || error || 'Old memos cannot be deleted!', 'error');
        if (!backendUnavailable) await fetchBootstrapData();
        return;
      }

      if (backendUnavailable) {
        const target = sales.find(s => s.id === saleId);
        if (!target) {
          showToast('Invoice not found', 'error');
          return;
        }
        if (!isDateTodayOrYesterday(target.rawDate || target.date)) {
          showToast('পুরাতন মেমো বা পূর্বের দিনের হিসাব ডিলিট করা সম্পূর্ণ নিষিদ্ধ! শুধুমাত্র আজ অথবা গতকালের মেমো ডিলিট করা যাবে।', 'error');
          return;
        }

        // Restore stationery stock
        const restoreMap: Record<string, number> = {};
        (target.items || []).forEach((it: any) => {
          if (it.category && it.category.toLowerCase().includes('stationery') && it.name) {
            const k = it.name.trim().toLowerCase();
            restoreMap[k] = (restoreMap[k] || 0) + (parseFloat(it.qty) || 0);
          }
        });
        const updatedProducts = products.map(p => {
          const k = p.name.trim().toLowerCase();
          const add = restoreMap[k] || 0;
          if (add > 0 && p.stockQty !== null && p.stockQty !== undefined) {
            return { ...p, stockQty: p.stockQty + add };
          }
          return p;
        });

        const updatedSales = sales.filter(s => s.id !== saleId);
        const updatedDue = dueRecords.map(d => {
          if (d.id === `INV-${target.invoiceNo}` || (d.desc || '').includes(`Memo #${target.invoiceNo}`)) {
            const prevDesc = d.desc || '';
            return {
              ...d,
              due: 0,
              desc: prevDesc.includes('[Memo Deleted / Cancelled]') ? prevDesc : `${prevDesc} [Memo Deleted / Cancelled]`.trim()
            };
          }
          return d;
        });
        const { customerSummaries: newSummaries, dueTotals: newTotals } = recalculateDueSummaries(updatedDue);

        setProducts(updatedProducts);
        setSales(updatedSales);
        setDueRecords(updatedDue);
        setCustomerSummaries(newSummaries);
        setDueTotals(newTotals);
        updateCachedBootstrap(prev => ({
          ...prev,
          products: updatedProducts,
          records: updatedSales,
          sales: updatedSales,
          dueRecords: updatedDue,
          customerSummaries: newSummaries,
          dueTotals: newTotals
        }));
        showToast(`Invoice #${target.invoiceNo} deleted and stock restored!`, 'success');
      } else {
        setSales(prev => prev.filter(s => s.id !== saleId));
        showToast(data?.message || 'Memo deleted', 'success');
        await fetchBootstrapData();
      }
    } catch {
      showToast('Failed to delete memo', 'error');
    }
  };

  const handleSubmitPayment = async (payload: any) => {
    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>('/api/due-ledger/payment', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      if (!backendUnavailable) await fetchBootstrapData();
      throw new Error(data?.message || error || 'Failed to record payment');
    }

    if (backendUnavailable) {
      const now = new Date();
      const dateStr = payload.date || getLocalDateStr(now);
      const newDueRec: DueRecord = {
        rowId: Date.now(),
        id: `PAY-${Date.now()}`,
        date: dateStr,
        customer: (payload.customer || '').trim(),
        phone: (payload.phone || '').trim(),
        address: (payload.address || '').trim(),
        type: 'Payment Received',
        desc: (payload.desc || 'Cash / bKash Payment').trim(),
        due: 0,
        paid: parseFloat(payload.amount) || 0,
        user: payload.user || currentUser?.username || 'Staff',
        timestamp: `${dateStr} ${now.toTimeString().split(' ')[0]}`
      };
      const updatedList = [newDueRec, ...dueRecords];
      const { customerSummaries: newSummaries, dueTotals: newTotals } = recalculateDueSummaries(updatedList);
      setDueRecords(updatedList);
      setCustomerSummaries(newSummaries);
      setDueTotals(newTotals);
      updateCachedBootstrap(c => ({
        ...c,
        dueRecords: updatedList,
        customerSummaries: newSummaries,
        dueTotals: newTotals
      }));
    } else {
      await fetchBootstrapData();
    }
    showToast(data?.message || 'Payment collected successfully!', 'success');
  };

  const handleSubmitPurchase = async (payload: any) => {
    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      if (!backendUnavailable) await fetchBootstrapData();
      throw new Error(data?.message || error || 'Failed to save purchase');
    }

    if (backendUnavailable && Array.isArray(payload.items)) {
      const now = new Date();
      const dateStr = payload.date || getLocalDateStr(now);
      const tsStr = `${dateStr} ${now.toTimeString().split(' ')[0]}`;
      let grandTotal = 0;
      const summaries: string[] = [];
      let nextProducts = [...products];

      const offlineRows: PurchaseRecord[] = payload.items.map((it: any, idx: number) => {
        const pName = (it.product || '').trim();
        const qVal = parseFloat(it.qty) || 1;
        const uCost = parseFloat(it.unitCost) || 0;
        const tCost = parseFloat(it.totalCost) || (qVal * uCost);
        const cat = it.category || 'Stationery Products';
        grandTotal += tCost;
        summaries.push(`${pName} (${qVal} units)`);

        const pIdx = nextProducts.findIndex(p => p.name.trim().toLowerCase() === pName.toLowerCase());
        if (pIdx >= 0) {
          const cur = nextProducts[pIdx];
          nextProducts[pIdx] = {
            ...cur,
            stockQty: (cur.stockQty || 0) + qVal,
            costPrice: uCost > 0 ? uCost : cur.costPrice
          };
        } else {
          const maxSl = nextProducts.filter(p => p.category === cat).reduce((m, p) => Math.max(m, p.sl || 0), 0);
          nextProducts.push({
            id: Date.now() + idx + 1000,
            rowId: Date.now() + idx + 1000,
            sl: maxSl + 1,
            category: cat,
            name: pName,
            price: Math.round(uCost * 1.25),
            costPrice: uCost,
            stockQty: qVal,
            lowStockLimit: 5
          });
        }

        return {
          rowId: Date.now() + idx,
          id: `PUR-${Date.now() + idx}`,
          date: dateStr,
          timestamp: tsStr,
          product: pName,
          category: cat,
          qty: qVal,
          unitCost: uCost,
          totalCost: tCost,
          supplier: payload.supplier || '',
          notes: payload.notes || '',
          user: payload.user || currentUser?.username || 'Staff'
        };
      });

      const expIdNum = Date.now() + 500;
      const newExpense: ExpenseRecord = {
        rowId: expIdNum,
        id: expIdNum,
        expId: `EXP-${expIdNum}`,
        timestamp: tsStr,
        date: dateStr,
        category: 'Stationery Supplies',
        desc: `Product Purchase: ${summaries.join(', ')}${payload.supplier ? ` [Supplier: ${payload.supplier}]` : ''}`,
        amount: grandTotal,
        user: payload.user || currentUser?.username || 'Staff'
      };

      const updatedPurchases = [...offlineRows, ...purchases];
      const updatedExpenses = [newExpense, ...expenses];

      setProducts(nextProducts);
      setPurchases(updatedPurchases);
      setExpenses(updatedExpenses);
      updateCachedBootstrap(prev => ({
        ...prev,
        products: nextProducts,
        purchases: updatedPurchases,
        expenses: updatedExpenses
      }));
    } else {
      await fetchBootstrapData();
    }

    showToast(data?.message || 'Purchases saved and stock updated!', 'success');
    setActiveTab('sales');
  };

  const handleDeletePurchase = async (id: string | number) => {
    try {
      const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(`/api/purchases/${id}`, { method: 'DELETE' });
      if (data?.status === 'error' || (!ok && !backendUnavailable)) {
        showToast(data?.message || error || 'Cannot delete purchase', 'error');
        if (!backendUnavailable) await fetchBootstrapData();
        return;
      }

      if (backendUnavailable) {
        const target = purchases.find(p => String(p.rowId) === String(id) || String(p.id) === String(id));
        if (!target) {
          showToast('Purchase record not found', 'error');
          return;
        }
        if (!isDateTodayOrYesterday(target.date)) {
          showToast('পুরাতন ক্রয়ের তথ্য ডিলিট করা সম্পূর্ণ নিষিদ্ধ! শুধুমাত্র আজ অথবা গতকালের তথ্য ডিলিট করা যাবে।', 'error');
          return;
        }
        const updatedProducts = products.map(p => {
          if (p.name.trim().toLowerCase() === (target.product || '').trim().toLowerCase() && p.stockQty !== null && p.stockQty !== undefined) {
            return { ...p, stockQty: Math.max(0, p.stockQty - (parseFloat(String(target.qty)) || 0)) };
          }
          return p;
        });
        const updatedPurchases = purchases.filter(p => String(p.rowId) !== String(id) && String(p.id) !== String(id));
        setProducts(updatedProducts);
        setPurchases(updatedPurchases);
        updateCachedBootstrap(prev => ({
          ...prev,
          products: updatedProducts,
          purchases: updatedPurchases
        }));
        showToast('Purchase deleted and stock reversed!', 'success');
      } else {
        setPurchases(prev => prev.filter(p => String(p.rowId) !== String(id) && String(p.id) !== String(id)));
        showToast(data?.message || 'Purchase deleted and stock reversed!', 'success');
        await fetchBootstrapData();
      }
    } catch {
      showToast('Failed to delete purchase', 'error');
    }
    setActiveTab('sales');
  };

  const handleSubmitPaperUsage = async (payload: any) => {
    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>('/api/photocopy-paper', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      if (!backendUnavailable) await fetchBootstrapData();
      throw new Error(data?.message || error || 'Failed to record paper usage');
    }

    if (backendUnavailable) {
      const pName = (payload.productName || '').trim();
      const qVal = parseFloat(payload.qty) || 0;
      if (!pName || qVal <= 0) {
        throw new Error('Valid product name and quantity greater than 0 required');
      }
      const now = new Date();
      const dateStr = payload.date || getLocalDateStr(now);
      const tsStr = `${dateStr} ${now.toTimeString().split(' ')[0]}`;
      const updatedProducts = products.map(p => {
        if (p.name.trim().toLowerCase() === pName.toLowerCase() && p.stockQty !== null && p.stockQty !== undefined) {
          return { ...p, stockQty: Math.max(0, p.stockQty - qVal) };
        }
        return p;
      });
      const expNum = Date.now();
      const newExp: ExpenseRecord = {
        rowId: expNum,
        id: expNum,
        expId: `EXP-${expNum}`,
        timestamp: tsStr,
        date: dateStr,
        category: 'Photocopy Consumables',
        desc: `Paper Usage: ${qVal} unit(s) ${pName}${payload.notes ? ` [${payload.notes.trim()}]` : ''}`,
        amount: 0,
        user: payload.user || currentUser?.username || 'Staff'
      };
      const updatedExpenses = [newExp, ...expenses];
      setProducts(updatedProducts);
      setExpenses(updatedExpenses);
      updateCachedBootstrap(prev => ({
        ...prev,
        products: updatedProducts,
        expenses: updatedExpenses
      }));
    } else {
      await fetchBootstrapData();
    }

    showToast(data?.message || 'Paper usage recorded and deducted from stock!', 'success');
    setActiveTab('sales');
  };

  const handleSubmitExpense = async (payload: any) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/expenses/${payload.id}` : '/api/expenses';
    const method = isEdit ? 'PUT' : 'POST';

    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      if (!backendUnavailable) await fetchBootstrapData();
      throw new Error(data?.message || error || 'Error saving expense');
    }

    if (backendUnavailable) {
      const amt = parseFloat(payload.amount);
      const existingExp = isEdit ? expenses.find(e => e.id === payload.id) : null;
      if (isNaN(amt) || (isEdit && existingExp && existingExp.amount > 0 && amt <= 0) || (!isEdit && amt <= 0) || amt < 0) {
        throw new Error('Valid amount required');
      }
      if (isEdit && existingExp && !isDateTodayOrYesterday(existingExp.date)) {
        const origAmt = Math.round((existingExp.amount || 0) * 100) / 100;
        const newAmt = Math.round(amt * 100) / 100;
        if (Math.abs(newAmt - origAmt) > 0.01) {
          throw new Error(`পুরাতন খরচে টাকার পরিমাণ পরিবর্তন করা সম্পূর্ণ বন্ধ! মূল পরিমাণ ছিল Tk ${origAmt}।`);
        }
      }

      const now = new Date();
      const expId = payload.id || Date.now();
      const dateStr = payload.date || existingExp?.date || getLocalDateStr(now);
      const newExp: ExpenseRecord = {
        rowId: existingExp?.rowId || expId,
        id: expId,
        expId: existingExp?.expId || `EXP-${expId}`,
        timestamp: existingExp?.timestamp || `${dateStr} ${now.toTimeString().split(' ')[0]}`,
        date: dateStr,
        category: payload.category,
        desc: (payload.description || payload.desc || '').trim(),
        amount: amt,
        user: existingExp?.user || payload.user || currentUser?.username || 'Staff'
      };
      const updatedExpenses = isEdit ? expenses.map(e => e.id === expId ? newExp : e) : [newExp, ...expenses];
      setExpenses(updatedExpenses);
      updateCachedBootstrap(prev => ({ ...prev, expenses: updatedExpenses }));
    } else {
      await fetchBootstrapData();
    }

    showToast(data?.message || (isEdit ? 'Expense updated!' : 'Expense recorded!'), 'success');
    setActiveTab('sales');
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(`/api/expenses/${id}`, { method: 'DELETE' });
      if (data?.status === 'error' || (!ok && !backendUnavailable)) {
        showToast(data?.message || error || 'Old expenses cannot be deleted!', 'error');
        if (!backendUnavailable) await fetchBootstrapData();
        return;
      }

      if (backendUnavailable) {
        const target = expenses.find(e => e.id === id);
        if (!target) {
          showToast('Expense not found', 'error');
          return;
        }
        if (!isDateTodayOrYesterday(target.date)) {
          showToast('পুরাতন খরচের তথ্য ডিলিট করা সম্পূর্ণ নিষিদ্ধ! শুধুমাত্র আজ অথবা গতকালের খরচ ডিলিট করা যাবে।', 'error');
          return;
        }
        const updatedExpenses = expenses.filter(e => e.id !== id);
        setExpenses(updatedExpenses);
        updateCachedBootstrap(prev => ({ ...prev, expenses: updatedExpenses }));
        showToast('Expense deleted', 'success');
      } else {
        setExpenses(prev => prev.filter(e => e.id !== id));
        showToast(data?.message || 'Expense deleted', 'success');
        await fetchBootstrapData();
      }
    } catch {
      showToast('Failed to delete expense', 'error');
    }
    setActiveTab('sales');
  };

  const handleSubmitCashClosing = async (payload: any) => {
    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>('/api/cash-closings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      if (!backendUnavailable) await fetchBootstrapData();
      throw new Error(data?.message || error || 'Error saving cash closing');
    }

    if (backendUnavailable) {
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
      const idx = cashClosings.findIndex(c => c.date === payload.date);
      const updatedClosings = idx >= 0
        ? cashClosings.map((c, i) => (i === idx ? newRec : c))
        : [newRec, ...cashClosings];
      setCashClosings(updatedClosings);
      updateCachedBootstrap(prev => ({ ...prev, cashClosings: updatedClosings }));
    } else {
      await fetchBootstrapData();
    }

    showToast(data?.message || `Daily cash closing saved for ${payload.date}!`, 'success');
  };

  const handleSubmitCustomer = async (payload: any) => {
    const isEdit = !!payload.id;
    const cid = payload.id || Date.now();
    let finalSl = parseInt(payload.sl, 10);
    if (!isEdit) {
      const maxSl = customers.reduce((m, c) => Math.max(m, Number(c.sl) || 0), 0);
      if (!finalSl || finalSl <= 0 || customers.some(c => Number(c.sl) === finalSl)) {
        finalSl = maxSl + 1;
      }
    } else {
      if (!finalSl || finalSl <= 0) finalSl = 1;
    }
    const cleanPhone = payload.phone ? payload.phone.trim() : '';
    const normalizedPhone = cleanPhone.replace(/[\s\-\(\)]/g, '');
    if (normalizedPhone) {
      const duplicate = customers.find(c => {
        if (isEdit && String(c.id) === String(cid)) return false;
        const cPhoneNorm = (c.phone || '').replace(/[\s\-\(\)]/g, '');
        return cPhoneNorm && cPhoneNorm === normalizedPhone;
      });
      if (duplicate) {
        throw new Error(`এই মোবাইল নম্বরটি (${cleanPhone}) ইতিমধ্যে "${duplicate.name}" এর নামে নিবন্ধিত আছে! একটি নম্বরে শুধুমাত্র একজন কাস্টমার সেভ করা যাবে।`);
      }
    } else {
      const dupNameNoPhone = customers.find(c => {
        if (isEdit && String(c.id) === String(cid)) return false;
        return c.name.trim().toLowerCase() === payload.name.trim().toLowerCase() && !(c.phone || '').trim();
      });
      if (dupNameNoPhone) {
        throw new Error(`"${payload.name.trim()}" নামে কোনো নম্বর ছাড়া কাস্টমার ইতিমধ্যে সেভ করা আছে! আলাদা মোবাইল নম্বর দিন।`);
      }
    }

    const url = isEdit ? `/api/customers/${payload.id}` : '/api/customers';
    const method = isEdit ? 'PUT' : 'POST';
    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      if (!backendUnavailable) await fetchBootstrapData();
      throw new Error(data?.message || error || 'Error saving customer');
    }

    const finalAddress = payload.address && payload.address.trim() ? payload.address.trim() : '';
    const custRecord: Customer = data?.customer || {
      id: cid,
      rowId: cid,
      sl: finalSl,
      name: payload.name.trim(),
      phone: cleanPhone,
      address: finalAddress
    };

    if (backendUnavailable) {
      const exists = customers.some(c => String(c.id) === String(cid));
      const updatedCustomers = (isEdit || exists)
        ? customers.map(c => String(c.id) === String(cid) ? custRecord : c)
        : [...customers, custRecord];
      setCustomers(updatedCustomers);
      updateCachedBootstrap(prev => ({ ...prev, customers: updatedCustomers }));
    } else {
      await fetchBootstrapData();
    }

    showToast(data?.message || (isEdit ? 'Customer updated!' : 'Customer saved!'), 'success');
  };

  const handleDeleteCustomer = async (id: number | string) => {
    try {
      const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(`/api/customers/${id}`, { method: 'DELETE' });
      if (data?.status === 'error' || (!ok && !backendUnavailable)) {
        showToast(data?.message || error || 'Failed to delete customer', 'error');
        if (!backendUnavailable) await fetchBootstrapData();
        return;
      }
      const updatedCustomers = customers.filter(c => String(c.id) !== String(id));
      setCustomers(updatedCustomers);
      updateCachedBootstrap(prev => ({ ...prev, customers: updatedCustomers }));
      showToast(data?.message || 'Customer deleted permanently', 'success');
    } catch {
      showToast('Failed to delete customer', 'error');
    }
  };

  const handleClearAllCustomers = async () => {
    try {
      const { ok, data, error, backendUnavailable } = await safeFetchJson<any>('/api/customers', { method: 'DELETE' });
      if (data?.status === 'error' || (!ok && !backendUnavailable)) {
        showToast(data?.message || error || 'Failed to delete all customers', 'error');
      } else {
        setCustomers([]);
        updateCachedBootstrap(prev => ({ ...prev, customers: [] }));
        showToast(data?.message || 'All customers permanently deleted', 'success');
      }
      if (!backendUnavailable) await fetchBootstrapData();
    } catch {
      showToast('Failed to delete all customers', 'error');
    }
  };

  const handleSubmitProduct = async (payload: any) => {
    const isEdit = !!payload.id;
    const pid = payload.id || Date.now();
    const existingProd = isEdit ? products.find(p => String(p.id) === String(pid)) : null;
    const isStationery = normalizeCategory(payload.category || 'Photocopy') === 'Stationery Products';
    const safeStock = isEdit ? (existingProd ? existingProd.stockQty : null) : (isStationery ? 0 : null);

    const url = isEdit ? `/api/products/${payload.id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';
    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      if (!backendUnavailable) await fetchBootstrapData();
      throw new Error(data?.message || error || 'Error saving product');
    }

    if (backendUnavailable) {
      let finalSl = parseInt(payload.sl, 10);
      const cat = payload.category || 'Photocopy';
      const maxSl = products.filter(p => p.category === cat).reduce((m, p) => Math.max(m, Number(p.sl) || 0), 0);
      if (!isEdit && (!finalSl || finalSl <= 0 || products.some(p => p.category === cat && Number(p.sl) === finalSl))) {
        finalSl = maxSl + 1;
      } else if (!finalSl || finalSl <= 0) {
        finalSl = 1;
      }
      const prodRecord: Product = {
        id: pid,
        rowId: pid,
        sl: finalSl,
        category: cat,
        name: payload.name.trim(),
        price: parseFloat(payload.price) || 0,
        costPrice: parseFloat(payload.costPrice) || 0,
        stockQty: safeStock,
        lowStockLimit: parseFloat(payload.lowStockLimit) || 5
      };
      const exists = products.some(p => String(p.id) === String(pid));
      const updatedProducts = (isEdit || exists)
        ? products.map(p => String(p.id) === String(pid) ? prodRecord : p)
        : [...products, prodRecord];
      setProducts(updatedProducts);
      updateCachedBootstrap(prev => ({ ...prev, products: updatedProducts }));
    } else {
      await fetchBootstrapData();
    }

    showToast(data?.message || (isEdit ? 'Product updated!' : 'Product saved!'), 'success');
  };

  const handleDeleteProduct = async (id: number | string) => {
    try {
      const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(`/api/products/${id}`, { method: 'DELETE' });
      if (data?.status === 'error' || (!ok && !backendUnavailable)) {
        showToast(data?.message || error || 'Failed to delete product', 'error');
        if (!backendUnavailable) await fetchBootstrapData();
        return;
      }
      const updatedProducts = products.filter(p => String(p.id) !== String(id));
      setProducts(updatedProducts);
      updateCachedBootstrap(prev => ({ ...prev, products: updatedProducts }));
      showToast(data?.message || 'Product deleted successfully', 'success');
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleSubmitUser = async (payload: any) => {
    const isEdit = !!payload.id;
    const url = isEdit ? `/api/users/${payload.id}` : '/api/users';
    const method = isEdit ? 'PUT' : 'POST';

    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      throw new Error(data?.message || error || 'Failed to save user');
    }

    if (backendUnavailable) {
      const uname = (payload.username || '').trim();
      if (!uname) throw new Error('Username is required');
      if (!isEdit && (!payload.password || !payload.password.trim())) {
        throw new Error('Password is required for new users');
      }
      const duplicate = users.find(u => u.username.trim().toLowerCase() === uname.toLowerCase() && (!isEdit || u.id !== payload.id));
      if (duplicate) {
        throw new Error(`Username "${uname}" already exists!`);
      }
      const userObj: User = {
        id: payload.id || Date.now(),
        username: uname,
        role: payload.role || 'staff',
        phone: (payload.phone || '').trim(),
        permissions: payload.permissions || (payload.role === 'admin' ? 'all' : 'memo,due,customer,cust_sales,stock,purchase,paper,cash_closing,summary_print')
      };
      const updatedUsers = isEdit ? users.map(u => u.id === payload.id ? userObj : u) : [...users, userObj];
      setUsers(updatedUsers);
      updateCachedBootstrap(prev => ({ ...prev, users: updatedUsers }));
    }

    if (payload.username && payload.password && payload.password.trim()) {
      const updated = {
        ...userPasswords,
        [payload.username.trim().toLowerCase()]: payload.password.trim()
      };
      setUserPasswords(updated);
      localStorage.setItem('as_computer_user_passwords', JSON.stringify(updated));
    }

    showToast(data?.message || (isEdit ? 'User updated!' : 'User created!'), 'success');
    setActiveTab('sales');
    if (!backendUnavailable) {
      await fetchBootstrapData();
    }
  };

  const handleDeleteUser = async (id: number) => {
    const { ok, data, error, backendUnavailable } = await safeFetchJson<any>(`/api/users/${id}`, { method: 'DELETE' });
    if (data?.status === 'error' || (!ok && !backendUnavailable)) {
      showToast(data?.message || error || 'Failed to delete user', 'error');
      return;
    }
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    updateCachedBootstrap(prev => ({ ...prev, users: updatedUsers }));
    showToast(data?.message || 'User deleted', 'success');
    setActiveTab('sales');
    if (!backendUnavailable) {
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
                  setActiveFilterBadge(val ? formatMmmYyyy(val) : 'All Records');
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
        </>
      )}
      </div>

      {/* Modals with automatic deselection back to 'sales' on close */}
      {invoiceModalSale && (
        <InvoiceModal
          sale={invoiceModalSale}
          currentUser={currentUser.username}
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
              const today = getLocalDateStr();
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
          onClearAllCustomers={handleClearAllCustomers}
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
