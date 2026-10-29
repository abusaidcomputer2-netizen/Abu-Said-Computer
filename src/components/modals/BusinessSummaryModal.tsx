import React, { useState } from 'react';
import { X, Printer, PieChart, Building2, TrendingUp, Receipt, BookMarked, Wallet } from 'lucide-react';
import { SaleRecord, ExpenseRecord, DueRecord } from '../../types';
import { formatCurrency, formatInvoicePrintTimestamp, formatPeriodHeader } from '../../utils/helpers';
import { ReportFooter } from '../ReportFooter';

interface BusinessSummaryModalProps {
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  dueRecords: DueRecord[];
  currentUser: string;
  onClose: () => void;
}

export const BusinessSummaryModal: React.FC<BusinessSummaryModalProps> = ({
  sales,
  expenses,
  dueRecords,
  currentUser,
  onClose
}) => {
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const nowFormatted = formatInvoicePrintTimestamp(new Date());

  const setPeriod = (mode: 'thisMonth' | 'lastMonth' | 'today' | 'all') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    if (mode === 'thisMonth') {
      setFilterMonth(`${y}-${m}`);
      setStartDate('');
      setEndDate('');
    } else if (mode === 'lastMonth') {
      const prevM = new Date(y, now.getMonth() - 1, 1);
      const py = prevM.getFullYear();
      const pm = String(prevM.getMonth() + 1).padStart(2, '0');
      setFilterMonth(`${py}-${pm}`);
      setStartDate('');
      setEndDate('');
    } else if (mode === 'today') {
      setFilterMonth('');
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else {
      setFilterMonth('');
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter records
  const filteredSales = sales.filter(s => {
    const d = s.rawDate || s.date;
    if (filterMonth && !d.startsWith(filterMonth)) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (filterMonth && !e.date.startsWith(filterMonth)) return false;
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  const filteredDues = dueRecords.filter(d => {
    if (filterMonth && !d.date.startsWith(filterMonth)) return false;
    if (startDate && d.date < startDate) return false;
    if (endDate && d.date > endDate) return false;
    return true;
  });

  // Calculate Revenue Metrics
  let pSales = 0;
  let oSales = 0;
  let sSales = 0;
  let subtotal = 0;
  let discounts = 0;
  let netSalesBilled = 0;
  let newDueBilled = 0;

  filteredSales.forEach(s => {
    subtotal += s.subtotal || s.grandTotal;
    discounts += s.discount || 0;
    netSalesBilled += s.grandTotal;
    newDueBilled += s.due || 0;

    const ratio = s.subtotal > 0 ? s.grandTotal / s.subtotal : 1.0;
    if (s.items && s.items.length > 0) {
      s.items.forEach(it => {
        const cat = (it.category || s.category).toLowerCase();
        const lineVal = (it.total || 0) * ratio;
        if (cat.includes('photocopy')) pSales += lineVal;
        else if (cat.includes('stationery')) sSales += lineVal;
        else oSales += lineVal;
      });
    } else {
      const cat = s.category.toLowerCase();
      if (cat.includes('photocopy')) pSales += s.grandTotal;
      else if (cat.includes('stationery')) sSales += s.grandTotal;
      else oSales += s.grandTotal;
    }
  });

  // Due collected in period
  const dueCollected = filteredDues.reduce((sum, d) => sum + (d.paid || 0), 0);
  const cashFromSales = Math.max(0, netSalesBilled - newDueBilled);
  const totalCashInflow = cashFromSales + dueCollected;

  // Expenses breakdown
  const expCatMap: Record<string, number> = {};
  let totalOutflow = 0;
  filteredExpenses.forEach(e => {
    const c = e.category || 'General';
    expCatMap[c] = (expCatMap[c] || 0) + (e.amount || 0);
    totalOutflow += e.amount || 0;
  });

  const netDrawerCash = totalCashInflow - totalOutflow;

  // Overall shop net due
  let allTimeBilled = 0;
  let allTimePaid = 0;
  dueRecords.forEach(d => {
    allTimeBilled += d.due || 0;
    allTimePaid += d.paid || 0;
  });
  const totalNetDue = Math.max(0, allTimeBilled - allTimePaid);
  const prevDue = Math.max(0, totalNetDue - newDueBilled + dueCollected);

  const periodLabel = formatPeriodHeader(startDate, endDate, filterMonth);

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block">
      <div className="print-modal-dialog bg-slate-900 border border-amber-500/40 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4 print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:space-y-0">
        {/* Top Control Bar */}
        <div className="no-print flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <span>Business Financial Statement</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls (No Print) */}
        <div className="no-print bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Select Period & Date Filter
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPeriod('thisMonth')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setPeriod('lastMonth')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => setPeriod('today')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
              >
                All Time
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={e => {
                  setFilterMonth(e.target.value);
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setFilterMonth('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setFilterMonth('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Printable Business Statement Content */}
        <div className="print-page-container bg-white text-slate-900 p-5 sm:p-7 print:p-0 rounded-2xl shadow-sm flex flex-col justify-between min-h-[270mm]">
          <div className="print-content-body space-y-3 sm:space-y-4 print:space-y-2 flex-grow">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-2.5 print:pb-1.5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 bg-transparent">
                  <img 
                    src="/logo.png" 
                    alt="Abu Said Computer" 
                    className="w-full h-full object-contain filter-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1OXthEw7eAn6SkWLFzlW9G8MItn3ARvFM";
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                    <span className="text-[#0062cc]">Abu Said</span> Computer
                  </h2>
                  <p className="text-xs font-bold text-slate-700 tracking-wide mt-1">
                    Online Service & IT Point • Business Financial Statement
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Office: Bhai Bhai Super Market, 2nd Floor, Paduar Bazar, Cumilla • Mobile: +88 01904 142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h3 className="text-xl font-black text-slate-900 uppercase">FINANCIAL STATEMENT</h3>
                <p className="text-xs text-slate-700 font-bold mt-1 text-right">
                  <span className="text-blue-900 font-black">{periodLabel}</span> : Period
                </p>
              </div>
            </div>

          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 print:gap-2 text-center">
            <div className="bg-blue-50 border border-blue-200 p-2.5 sm:p-3 print:p-1.5 rounded-xl sm:rounded-2xl">
              <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 uppercase block mb-0.5">
                1. Total Sales (Billed)
              </span>
              <div className="text-xl sm:text-2xl print:text-lg font-black text-blue-900 font-tabular">
                Tk {formatCurrency(netSalesBilled)}
              </div>
              <span className="text-[9px] sm:text-[10px] text-blue-600 font-semibold">
                {filteredSales.length} Memos
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 p-2.5 sm:p-3 print:p-1.5 rounded-xl sm:rounded-2xl">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase block mb-0.5">
                2. Cash Collection
              </span>
              <div className="text-xl sm:text-2xl print:text-lg font-black text-emerald-800 font-tabular">
                Tk {formatCurrency(totalCashInflow)}
              </div>
              <span className="text-[9px] sm:text-[10px] text-emerald-700 font-semibold">
                (Current + Past Due)
              </span>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-2.5 sm:p-3 print:p-1.5 rounded-xl sm:rounded-2xl">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-800 uppercase block mb-0.5">
                3. Total Outflow
              </span>
              <div className="text-xl sm:text-2xl print:text-lg font-black text-rose-700 font-tabular">
                Tk {formatCurrency(totalOutflow)}
              </div>
              <span className="text-[9px] sm:text-[10px] text-rose-600 font-semibold">
                {filteredExpenses.length} Entries
              </span>
            </div>

            <div className="bg-teal-50 border border-teal-200 p-2.5 sm:p-3 print:p-1.5 rounded-xl sm:rounded-2xl">
              <span className="text-[10px] sm:text-[11px] font-bold text-teal-800 uppercase block mb-0.5">
                4. Net Drawer Cash
              </span>
              <div className="text-xl sm:text-2xl print:text-lg font-black text-teal-800 font-tabular">
                Tk {formatCurrency(netDrawerCash)}
              </div>
              <span className="text-[9px] sm:text-[10px] text-teal-700 font-semibold">
                (Inflow - Outflow)
              </span>
            </div>
          </div>

          {/* Two-Column Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3">
            {/* Left: Revenue & Inflow */}
            <div className="border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 print:p-2.5 space-y-2.5 print:space-y-1.5 bg-slate-50/60">
              <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 print:pb-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> REVENUE & CASH INFLOW
                </h4>
                <span className="text-[10px] sm:text-[11px] font-bold text-blue-700">100% Inflow</span>
              </div>

              <table className="w-full text-left text-xs print:text-[11px] border border-slate-200 bg-white border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 print:py-1 print:px-2 border-r border-slate-200">Category / Source</th>
                    <th className="py-2 px-3 print:py-1 print:px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  <tr>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 border-r border-slate-200">Photocopy Services</td>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 text-right font-black text-blue-900 font-tabular">
                      Tk {formatCurrency(pSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 border-r border-slate-200">Online Applications</td>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 text-right font-black text-blue-900 font-tabular">
                      Tk {formatCurrency(oSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 border-r border-slate-200">Stationery Products</td>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 text-right font-black text-blue-900 font-tabular">
                      Tk {formatCurrency(sSales)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-1 px-3 print:py-0.5 print:px-2 text-right font-bold text-slate-700 border-r border-slate-200">
                      Gross Subtotal:
                    </td>
                    <td className="py-1 px-3 print:py-0.5 print:px-2 text-right font-black text-slate-900 font-tabular">
                      Tk {formatCurrency(subtotal)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-1 px-3 print:py-0.5 print:px-2 text-right font-bold text-rose-600 border-r border-slate-200">
                      Less Discounts:
                    </td>
                    <td className="py-1 px-3 print:py-0.5 print:px-2 text-right font-black text-rose-600 font-tabular">
                      -Tk {formatCurrency(discounts)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 border-r border-slate-200 font-black text-blue-900">
                      Net Sales Billed:
                    </td>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 text-right font-black text-blue-900 font-tabular text-sm print:text-xs">
                      Tk {formatCurrency(netSalesBilled)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 border-r border-slate-200 font-bold text-slate-800">
                      Cash Received from Sales:
                    </td>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 text-right font-black text-slate-900 font-tabular">
                      Tk {formatCurrency(cashFromSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 border-r border-slate-200 font-bold text-emerald-700">
                      Previous Due Collected:
                    </td>
                    <td className="py-1.5 px-3 print:py-0.5 print:px-2 text-right font-black text-emerald-700 font-tabular">
                      Tk {formatCurrency(dueCollected)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-emerald-50 font-black text-xs">
                  <tr>
                    <td className="py-2 px-3 print:py-1 print:px-2 border-r border-slate-200 text-xs sm:text-sm print:text-xs text-emerald-950">
                      Total Cash Inflow (Drawer):
                    </td>
                    <td className="py-2 px-3 print:py-1 print:px-2 text-right font-black text-sm sm:text-base print:text-sm text-emerald-900 font-tabular">
                      Tk {formatCurrency(totalCashInflow)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Right: Outflow */}
            <div className="border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 print:p-2.5 space-y-2.5 print:space-y-1.5 bg-slate-50/60">
              <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 print:pb-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-rose-600" /> OPERATING EXPENSES & PURCHASES
                </h4>
                <span className="text-[10px] sm:text-[11px] font-bold text-rose-700">
                  {Object.keys(expCatMap).length} Categories
                </span>
              </div>

              <table className="w-full text-left text-xs print:text-[11px] border border-slate-200 bg-white border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 print:py-1 print:px-2 border-r border-slate-200">Expense Category</th>
                    <th className="py-2 px-3 print:py-1 print:px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {Object.keys(expCatMap).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-3 px-3 print:py-1.5 text-center text-slate-400">
                        No expense records in this period
                      </td>
                    </tr>
                  ) : (
                    Object.keys(expCatMap).map(c => (
                      <tr key={c}>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-2 border-r border-slate-200 font-bold text-slate-700">{c}</td>
                        <td className="py-1.5 px-3 print:py-0.5 print:px-2 text-right font-black text-rose-700 font-tabular">
                          Tk {formatCurrency(expCatMap[c])}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-rose-50 font-black text-xs">
                  <tr>
                    <td className="py-2 px-3 print:py-1 print:px-2 border-r border-slate-200 text-xs sm:text-sm print:text-xs text-rose-950">
                      Total Outflow (Expenses + Purchases):
                    </td>
                    <td className="py-2 px-3 print:py-1 print:px-2 text-right font-black text-sm sm:text-base print:text-sm text-rose-800 font-tabular">
                      Tk {formatCurrency(totalOutflow)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bottom Section: Customer Receivables & Due Reconciliation */}
          <div className="border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 print:p-2 space-y-2.5 print:space-y-1 bg-amber-50/40">
            <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 print:pb-1">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-amber-600" /> CUSTOMER RECEIVABLES & DUE RECONCILIATION
              </h4>
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-800">Customer Due Status</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 print:gap-2 text-center text-xs">
              <div className="bg-white border border-slate-200 p-2.5 sm:p-3 print:p-1 rounded-lg sm:rounded-xl shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase block mb-0.5">
                  1. Previous Due
                </span>
                <span className="text-lg sm:text-2xl print:text-base font-black text-slate-900 font-tabular">
                  Tk {formatCurrency(prevDue)}
                </span>
              </div>

              <div className="bg-white border border-amber-300 p-2.5 sm:p-3 print:p-1 rounded-lg sm:rounded-xl shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase block mb-0.5">
                  2. New Billed Due
                </span>
                <span className="text-lg sm:text-2xl print:text-base font-black text-amber-700 font-tabular">
                  Tk {formatCurrency(newDueBilled)}
                </span>
              </div>

              <div className="bg-white border border-emerald-300 p-2.5 sm:p-3 print:p-1 rounded-lg sm:rounded-xl shadow-xs">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase block mb-0.5">
                  3. Due Collected
                </span>
                <span className="text-lg sm:text-2xl print:text-base font-black text-emerald-700 font-tabular">
                  Tk {formatCurrency(dueCollected)}
                </span>
              </div>

              <div className="bg-white border-2 border-rose-400 p-2.5 sm:p-3 print:p-1 rounded-lg sm:rounded-xl shadow-xs bg-rose-50/40">
                <span className="text-[10px] sm:text-[11px] font-black text-rose-800 uppercase block mb-0.5">
                  4. Total Net Due
                </span>
                <span className="text-lg sm:text-2xl print:text-base font-black text-rose-800 font-tabular">
                  Tk {formatCurrency(totalNetDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Report Footer matching exact user sample as direct child of print container */}
        <ReportFooter
          reportTitle="Financial Statement (P&L)"
          printTimestamp={nowFormatted}
          currentUser={currentUser}
          leftSignatureLabel="CHECKED & VERIFIED BY"
          rightSignatureLabel="AUTHORIZED SIGNATURE"
        />
        </div>
      </div>
    </div>
  );
};
