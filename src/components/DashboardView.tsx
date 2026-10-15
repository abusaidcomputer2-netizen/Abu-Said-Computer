import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  AlertCircle, 
  Users, 
  ShoppingBag, 
  Boxes, 
  ArrowUpRight, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Percent,
  Wallet,
  ArrowDownRight,
  Printer,
  ChevronRight,
  Activity,
  PackageCheck,
  RotateCcw
} from 'lucide-react';
import { SaleRecord, DueRecord, ExpenseRecord, Product, CustomerDueSummary } from '../types';
import { formatCurrency, normalizeCategory } from '../utils/helpers';

interface DashboardViewProps {
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  dueRecords: DueRecord[];
  products: Product[];
  customerSummaries: CustomerDueSummary[];
  dueTotals: { shopTotalDue: number; shopTotalPaid: number; netDue: number };
  currentUser: string;
  isAdmin: boolean;
  onOpenDueLedger: () => void;
  onOpenCashClosing: () => void;
  onOpenSalesEntry: () => void;
  onPrintInvoice: (sale: SaleRecord) => void;
  onOpenStock?: () => void;
  onOpenExpenses?: () => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'last_month';

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  expenses,
  dueRecords,
  products,
  customerSummaries,
  dueTotals,
  currentUser,
  isAdmin,
  onOpenDueLedger,
  onOpenCashClosing,
  onOpenSalesEntry,
  onPrintInvoice,
  onOpenStock,
  onOpenExpenses
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'memos'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);
  const lastMonthStr = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filter sales according to selected period
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = s.rawDate || s.date;
      if (period === 'today') return d === todayStr;
      if (period === 'month') return d.startsWith(currentMonthStr);
      if (period === 'last_month') return d.startsWith(lastMonthStr);
      if (period === 'week') {
        const saleTime = new Date(d).getTime();
        const nowTime = new Date().getTime();
        const diffDays = (nowTime - saleTime) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      return true;
    });
  }, [sales, period, todayStr, currentMonthStr, lastMonthStr]);

  // Filter expenses according to selected period
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = e.date;
      if (period === 'today') return d === todayStr;
      if (period === 'month') return d.startsWith(currentMonthStr);
      if (period === 'last_month') return d.startsWith(lastMonthStr);
      if (period === 'week') {
        const expTime = new Date(d).getTime();
        const nowTime = new Date().getTime();
        const diffDays = (nowTime - expTime) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      return true;
    });
  }, [expenses, period, todayStr, currentMonthStr, lastMonthStr]);

  // Aggregate high-level KPIs
  const totalBilled = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0), [filteredSales]);
  const totalCashPaid = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.paid || 0), 0), [filteredSales]);
  const totalDueGenerated = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.due || 0), 0), [filteredSales]);
  const totalExpenseVal = useMemo(() => filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0), [filteredExpenses]);
  const invoiceCount = filteredSales.length;
  const avgTicket = invoiceCount > 0 ? Math.round(totalBilled / invoiceCount) : 0;

  // Dues collected during selected period
  const dueCollectedInPeriod = useMemo(() => {
    return dueRecords.filter(d => {
      if (period === 'today') return d.date === todayStr;
      if (period === 'month') return d.date.startsWith(currentMonthStr);
      if (period === 'last_month') return d.date.startsWith(lastMonthStr);
      if (period === 'week') {
        const dueTime = new Date(d.date).getTime();
        const nowTime = new Date().getTime();
        const diffDays = (nowTime - dueTime) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      return true;
    }).reduce((acc, d) => acc + (d.paid || 0), 0);
  }, [dueRecords, period, todayStr, currentMonthStr, lastMonthStr]);

  // Total cash drawer inflow
  const totalCashInflow = totalCashPaid + dueCollectedInPeriod;
  const netCashInHand = Math.max(0, totalCashInflow - totalExpenseVal);

  // Category breakdown calculation
  const categoryStats = useMemo(() => {
    let photocopy = 0;
    let online = 0;
    let stationery = 0;

    filteredSales.forEach(s => {
      if (s.items && s.items.length > 0) {
        s.items.forEach(it => {
          const cat = normalizeCategory(it.category);
          const val = it.total || (it.price * it.qty);
          if (cat === 'Photocopy') photocopy += val;
          else if (cat === 'Online Application') online += val;
          else stationery += val;
        });
      } else {
        const cat = normalizeCategory(s.category);
        if (cat === 'Photocopy') photocopy += s.grandTotal;
        else if (cat === 'Online Application') online += s.grandTotal;
        else stationery += s.grandTotal;
      }
    });

    const sum = photocopy + online + stationery || 1;
    return {
      photocopy,
      online,
      stationery,
      photocopyPct: Math.round((photocopy / sum) * 100),
      onlinePct: Math.round((online / sum) * 100),
      stationeryPct: Math.round((stationery / sum) * 100)
    };
  }, [filteredSales]);

  // Cost of goods sold & estimated gross profit
  const { totalCostOfGoods, estimatedGrossProfit, grossMarginPct } = useMemo(() => {
    let cogs = 0;
    filteredSales.forEach(s => {
      if (s.items && s.items.length > 0) {
        s.items.forEach(it => {
          cogs += (it.costPrice || 0) * (it.qty || 1);
        });
      }
    });
    const gp = Math.max(0, totalBilled - cogs);
    const margin = totalBilled > 0 ? Math.round((gp / totalBilled) * 100) : 0;
    return { totalCostOfGoods: cogs, estimatedGrossProfit: gp, grossMarginPct: margin };
  }, [filteredSales, totalBilled]);

  const netEstimatedProfit = Math.max(0, estimatedGrossProfit - totalExpenseVal);

  // Top products calculation
  const topProducts = useMemo(() => {
    const itemMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      (s.items || []).forEach(it => {
        const key = it.name.trim();
        if (!itemMap[key]) {
          itemMap[key] = { name: key, category: it.category, qty: 0, revenue: 0 };
        }
        itemMap[key].qty += (it.qty || 1);
        itemMap[key].revenue += (it.total || it.price * it.qty);
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredSales]);

  // Staff breakdown
  const staffBreakdown = useMemo(() => {
    const staffMap: Record<string, { user: string; count: number; billed: number; paid: number }> = {};
    filteredSales.forEach(s => {
      const u = s.user || 'Unknown';
      if (!staffMap[u]) {
        staffMap[u] = { user: u, count: 0, billed: 0, paid: 0 };
      }
      staffMap[u].count += 1;
      staffMap[u].billed += s.grandTotal;
      staffMap[u].paid += s.paid;
    });
    return Object.values(staffMap).sort((a, b) => b.billed - a.billed);
  }, [filteredSales]);

  // Daily Trend Data (Last 14 Days for high-resolution chart)
  const trendData = useMemo(() => {
    const dayMap: Record<string, { date: string; label: string; fullDate: string; revenue: number; count: number; paid: number }> = {};
    
    // Build last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const fullDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      dayMap[dateKey] = { date: dateKey, label: dayLabel, fullDate, revenue: 0, count: 0, paid: 0 };
    }

    sales.forEach(s => {
      const d = s.rawDate || s.date;
      if (dayMap[d]) {
        dayMap[d].revenue += s.grandTotal;
        dayMap[d].count += 1;
        dayMap[d].paid += s.paid;
      }
    });

    return Object.values(dayMap);
  }, [sales]);

  const maxRevenue = Math.max(...trendData.map(t => t.revenue), 100);
  const maxCount = Math.max(...trendData.map(t => t.count), 5);

  // Stock inventory valuation
  const { totalStockCount, totalStockValue, lowStockCount } = useMemo(() => {
    let count = 0;
    let val = 0;
    let low = 0;
    products.forEach(p => {
      if (p.stockQty !== null && p.stockQty !== undefined) {
        count += p.stockQty;
        val += p.stockQty * (p.costPrice || p.price);
        if (p.stockQty <= (p.lowStockLimit || 5)) low += 1;
      }
    });
    return { totalStockCount: count, totalStockValue: val, lowStockCount: low };
  }, [products]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Premium Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-30 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Executive Analytics Dashboard
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Live Business Performance
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>AS Computer • Executive Performance Hub</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Comprehensive real-time reporting for turnover, cash drawer realization, debt receivables, category contributions, and stock valuation.
            </p>
          </div>

          {/* Filter Controls & Primary Shortcut Button */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            {/* Period selector */}
            <div className="bg-slate-950/90 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 shadow-inner">
              {[
                { key: 'today' as PeriodFilter, label: 'Today (আজ)' },
                { key: 'week' as PeriodFilter, label: '7 Days' },
                { key: 'month' as PeriodFilter, label: 'This Month' },
                { key: 'last_month' as PeriodFilter, label: 'Last Month (গত মাস)' }
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    period === p.key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Quick jump to Daily Sales & Memo Entry */}
            <button
              type="button"
              onClick={onOpenSalesEntry}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Receipt className="w-4 h-4 text-slate-950" />
              <span>Daily Sales & Memo Entry</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (6 High-Contrast Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Gross Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-4 rounded-3xl shadow-lg transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ৳{formatCurrency(totalBilled)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-400 font-semibold mt-1.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>{invoiceCount} Memos</span>
          </div>
        </div>

        {/* 2. Cash Collected */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-3xl shadow-lg transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Collected</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
            ৳{formatCurrency(totalCashPaid)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5">
            {totalBilled > 0 ? `${Math.round((totalCashPaid / totalBilled) * 100)}% realization` : '0% realization'}
          </div>
        </div>

        {/* 3. Outstanding Debt */}
        <div 
          onClick={onOpenDueLedger}
          className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 p-4 rounded-3xl shadow-lg transition-all group cursor-pointer relative overflow-hidden"
          title="Click to view Customer Due Ledger"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Net Debt Due</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
            ৳{formatCurrency(dueTotals.netDue)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-300/90 font-semibold mt-1.5">
            <span>{customerSummaries.length} Debtors</span>
            <span className="text-[10px] underline">Ledger &rarr;</span>
          </div>
        </div>

        {/* 4. Operating Expenses */}
        <div 
          onClick={onOpenExpenses}
          className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 p-4 rounded-3xl shadow-lg transition-all group cursor-pointer relative overflow-hidden"
          title="Click to view Operating Expenses"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
            ৳{formatCurrency(totalExpenseVal)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5">
            {filteredExpenses.length} Slips Recorded
          </div>
        </div>

        {/* 5. Net Estimated Profit */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 p-4 rounded-3xl shadow-lg transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Net Profit</span>
            <div className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-300 tracking-tight">
            ৳{formatCurrency(netEstimatedProfit)}
          </div>
          <div className="text-[11px] text-teal-400/90 font-semibold mt-1.5">
            {grossMarginPct}% Margin
          </div>
        </div>

        {/* 6. Stationery Stock Value */}
        <div 
          onClick={onOpenStock}
          className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-3xl shadow-lg transition-all group cursor-pointer relative overflow-hidden"
          title="Click to view Stock Inventory"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Valuation</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ৳{formatCurrency(totalStockValue)}
          </div>
          <div className="text-[11px] text-indigo-300 font-semibold mt-1.5 flex items-center justify-between">
            <span>{totalStockCount} units</span>
            {lowStockCount > 0 && (
              <span className="text-rose-400 font-black text-[10px] bg-rose-500/10 px-1.5 py-0.2 rounded-full border border-rose-500/30">
                {lowStockCount} low
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 14-Day Sales & Revenue Trend Chart (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Sales Revenue Trend (Last 14 Days)</span>
              </h3>
              <p className="text-xs text-slate-400">Daily business volume and cash flow fluctuations</p>
            </div>

            {/* Metric switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveMetric('revenue')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeMetric === 'revenue' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue (৳)
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('memos')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeMetric === 'memos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Memos Count
              </button>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="h-60 w-full pt-6 relative flex flex-col justify-end">
            <div className="grid grid-cols-14 h-48 gap-1.5 sm:gap-2 items-end px-1 sm:px-2">
              {trendData.map((d, idx) => {
                const val = activeMetric === 'revenue' ? d.revenue : d.count;
                const max = activeMetric === 'revenue' ? maxRevenue : maxCount;
                const pct = Math.max(8, Math.min(100, Math.round((val / max) * 100)));
                const isHovered = hoveredIndex === idx;

                return (
                  <div 
                    key={idx} 
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-14 bg-slate-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-700 shadow-2xl pointer-events-none whitespace-nowrap z-30">
                        <div className="text-slate-300 text-[10px]">{d.fullDate}</div>
                        <div className="text-cyan-400 font-black">
                          {activeMetric === 'revenue' ? `৳${formatCurrency(d.revenue)}` : `${d.count} memos`}
                        </div>
                        <div className="text-emerald-400 text-[9px]">
                          Cash: ৳{formatCurrency(d.paid)}
                        </div>
                      </div>
                    )}

                    {/* Chart Bar */}
                    <div 
                      style={{ height: `${pct}%` }}
                      className={`w-full max-w-[24px] sm:max-w-[28px] rounded-t-xl transition-all duration-300 relative group-hover:brightness-125 ${
                        activeMetric === 'revenue'
                          ? 'bg-gradient-to-t from-cyan-600 via-blue-600 to-indigo-500 shadow-lg shadow-cyan-500/20'
                          : 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-lg shadow-indigo-500/20'
                      } ${isHovered ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}`}
                    />

                    {/* Date label below */}
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-2 truncate w-full text-center">
                      {d.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Key Summary Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-center">
            <div className="p-2.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">Average Invoice</span>
              <span className="text-xs sm:text-sm font-black text-white">৳{formatCurrency(avgTicket)}</span>
            </div>
            <div className="p-2.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">Today Sales</span>
              <span className="text-xs sm:text-sm font-black text-cyan-400">
                ৳{formatCurrency(trendData[trendData.length - 1]?.revenue || 0)}
              </span>
            </div>
            <div className="p-2.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">14-Day Sum</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400">
                ৳{formatCurrency(trendData.reduce((acc, t) => acc + t.revenue, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Category Breakdown & Share (1 col) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-400" />
                <span>Category Distribution</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Ratio
              </span>
            </div>

            {/* Visual Multi-segment Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex shadow-inner p-0.5 border border-slate-800">
                <div 
                  style={{ width: `${categoryStats.photocopyPct}%` }}
                  className="h-full bg-blue-500 rounded-l-full transition-all duration-500" 
                  title={`Photocopy: ${categoryStats.photocopyPct}%`}
                />
                <div 
                  style={{ width: `${categoryStats.onlinePct}%` }}
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  title={`Online Application: ${categoryStats.onlinePct}%`}
                />
                <div 
                  style={{ width: `${categoryStats.stationeryPct}%` }}
                  className="h-full bg-amber-500 rounded-r-full transition-all duration-500" 
                  title={`Stationery: ${categoryStats.stationeryPct}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Photocopy</span>
                <span>Online Applications</span>
                <span>Stationery</span>
              </div>
            </div>

            {/* Individual Breakdown Cards */}
            <div className="space-y-3 mt-4">
              {/* Photocopy */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  <div>
                    <span className="text-xs font-bold text-white block">Photocopy & Print</span>
                    <span className="text-[10px] text-slate-400 font-medium">A4, Legal, Color, Scanning</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-blue-300 block">৳{formatCurrency(categoryStats.photocopy)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{categoryStats.photocopyPct}%</span>
                </div>
              </div>

              {/* Online Application */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <div>
                    <span className="text-xs font-bold text-white block">Online Applications</span>
                    <span className="text-[10px] text-slate-400 font-medium">Jobs, NID, Birth Reg, Passport</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-300 block">৳{formatCurrency(categoryStats.online)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{categoryStats.onlinePct}%</span>
                </div>
              </div>

              {/* Stationery Products */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <div>
                    <span className="text-xs font-bold text-white block">Stationery & Paper</span>
                    <span className="text-[10px] text-slate-400 font-medium">Paper reams, pens, files, registers</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-300 block">৳{formatCurrency(categoryStats.stationery)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{categoryStats.stationeryPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Cash Flow Gauge */}
          <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-1.5 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Net Cash In Hand</span>
              </span>
              <span className="text-emerald-400 font-black">৳{formatCurrency(netCashInHand)}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Inflow: ৳{formatCurrency(totalCashInflow)} • Outflow: ৳{formatCurrency(totalExpenseVal)}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Analytics Row: Top Items + Staff Leaderboard + Recent Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Top Selling Products & Services */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Top Revenue Items</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Performance</span>
          </div>

          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">No sales logged in this period</div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/70 space-y-1.5 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]">{p.name}</span>
                    <span className="text-xs font-black text-emerald-400">৳{formatCurrency(p.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="capitalize">{p.category}</span>
                    <span className="font-semibold text-slate-300">{p.qty} units billed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Staff Sales & Collection Performance */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Staff Performance</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Accounts</span>
          </div>

          <div className="space-y-3">
            {staffBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">No staff records in this period</div>
            ) : (
              staffBreakdown.map((st, idx) => {
                const pct = totalBilled > 0 ? Math.round((st.billed / totalBilled) * 100) : 0;
                return (
                  <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black flex items-center justify-center">
                          {st.user.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-white">{st.user}</span>
                      </div>
                      <span className="text-xs font-black text-white">৳{formatCurrency(st.billed)}</span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div 
                        style={{ width: `${pct}%` }} 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{st.count} invoices issued</span>
                      <span className="text-emerald-400 font-bold">৳{formatCurrency(st.paid)} collected</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Recent Transactions Feed */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-400" />
              <span>Recent Invoices</span>
            </h3>
            <button 
              type="button"
              onClick={onOpenSalesEntry}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {filteredSales.slice(0, 5).map((s, idx) => (
              <div 
                key={idx}
                onClick={() => onPrintInvoice(s)}
                className="p-2.5 bg-slate-950 hover:bg-slate-800/80 transition rounded-2xl border border-slate-800/70 flex items-center justify-between cursor-pointer group"
                title="Click to preview/print invoice"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-cyan-400 font-mono">#{s.invoiceNo}</span>
                    <span className="truncate max-w-[120px]">{s.customer}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{s.timestamp.split(' ')[0]}</span>
                    <span>•</span>
                    <span>{s.user}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-white group-hover:text-cyan-300">
                    ৳{formatCurrency(s.grandTotal)}
                  </div>
                  <div className="text-[10px]">
                    {s.due > 0 ? (
                      <span className="text-amber-400 font-bold">Due ৳{formatCurrency(s.due)}</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Paid</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
