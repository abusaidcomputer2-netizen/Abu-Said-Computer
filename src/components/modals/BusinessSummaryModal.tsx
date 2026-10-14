import React, { useState } from 'react';
import { X, Printer, PieChart, Building2, TrendingUp, Receipt, BookMarked, Wallet } from 'lucide-react';
import { SaleRecord, ExpenseRecord, DueRecord } from '../../types';
import { formatCurrency, formatInvoicePrintTimestamp, formatPeriodHeader } from '../../utils/helpers';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-amber-500/40 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
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
        <div className="bg-white text-slate-900 p-6 sm:p-8 space-y-4 rounded-2xl shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 p-2 flex items-center justify-center text-amber-400">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  <span className="text-amber-500">AS</span> Computer
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
              <p className="text-xs text-slate-700 font-bold mt-1">
                Period : <span className="text-blue-900 font-black">{periodLabel}</span>
              </p>
            </div>
          </div>

          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-800 uppercase block mb-0.5">
                1. Total Sales (Billed)
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-900 font-tabular">
                ৳ {formatCurrency(netSalesBilled)}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold">
                {filteredSales.length} Memos
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-0.5">
                2. Cash Collection
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 font-tabular">
                ৳ {formatCurrency(totalCashInflow)}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">
                (Current + Past Due)
              </span>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl">
              <span className="text-[11px] font-bold text-rose-800 uppercase block mb-0.5">
                3. Total Outflow
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-700 font-tabular">
                ৳ {formatCurrency(totalOutflow)}
              </div>
              <span className="text-[10px] text-rose-600 font-semibold">
                {filteredExpenses.length} Entries
              </span>
            </div>

            <div className="bg-teal-50 border border-teal-200 p-3 rounded-2xl">
              <span className="text-[11px] font-bold text-teal-800 uppercase block mb-0.5">
                4. Net Drawer Cash
              </span>
              <div className="text-xl sm:text-2xl font-black text-teal-800 font-tabular">
                ৳ {formatCurrency(netDrawerCash)}
              </div>
              <span className="text-[10px] text-teal-700 font-semibold">
                (Inflow - Outflow)
              </span>
            </div>
          </div>

          {/* Two-Column Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Revenue & Inflow */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/60">
              <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> REVENUE & CASH INFLOW
                </h4>
                <span className="text-[11px] font-bold text-blue-700">100% Inflow</span>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 bg-white border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-200">Category / Source</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200">Photocopy Services</td>
                    <td className="py-2 px-3 text-right font-black text-blue-900 font-tabular">
                      ৳ {formatCurrency(pSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200">Online Applications</td>
                    <td className="py-2 px-3 text-right font-black text-blue-900 font-tabular">
                      ৳ {formatCurrency(oSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200">Stationery Products</td>
                    <td className="py-2 px-3 text-right font-black text-blue-900 font-tabular">
                      ৳ {formatCurrency(sSales)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-1.5 px-3 text-right font-bold text-slate-700 border-r border-slate-200">
                      Gross Subtotal:
                    </td>
                    <td className="py-1.5 px-3 text-right font-black text-slate-900 font-tabular">
                      ৳ {formatCurrency(subtotal)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-1.5 px-3 text-right font-bold text-rose-600 border-r border-slate-200">
                      Less Discounts:
                    </td>
                    <td className="py-1.5 px-3 text-right font-black text-rose-600 font-tabular">
                      -৳ {formatCurrency(discounts)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="py-2 px-3 border-r border-slate-200 font-black text-blue-900">
                      Net Sales Billed:
                    </td>
                    <td className="py-2 px-3 text-right font-black text-blue-900 font-tabular text-sm">
                      ৳ {formatCurrency(netSalesBilled)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-800">
                      Cash Received from Sales:
                    </td>
                    <td className="py-2 px-3 text-right font-black text-slate-900 font-tabular">
                      ৳ {formatCurrency(cashFromSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-emerald-700">
                      Previous Due Collected:
                    </td>
                    <td className="py-2 px-3 text-right font-black text-emerald-700 font-tabular">
                      ৳ {formatCurrency(dueCollected)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-emerald-50 font-black text-xs">
                  <tr>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-sm text-emerald-950">
                      Total Cash Inflow (Drawer):
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-base text-emerald-900 font-tabular">
                      ৳ {formatCurrency(totalCashInflow)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Right: Outflow */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/60">
              <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-rose-600" /> OPERATING EXPENSES & PURCHASES
                </h4>
                <span className="text-[11px] font-bold text-rose-700">
                  {Object.keys(expCatMap).length} Categories
                </span>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 bg-white border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-200">Expense Category</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {Object.keys(expCatMap).length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-3 px-3 text-center text-slate-400">
                        No expense records in this period
                      </td>
                    </tr>
                  ) : (
                    Object.keys(expCatMap).map(c => (
                      <tr key={c}>
                        <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-700">{c}</td>
                        <td className="py-2 px-3 text-right font-black text-rose-700 font-tabular">
                          ৳ {formatCurrency(expCatMap[c])}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-rose-50 font-black text-xs">
                  <tr>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-sm text-rose-950">
                      Total Outflow (Expenses + Purchases):
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-base text-rose-800 font-tabular">
                      ৳ {formatCurrency(totalOutflow)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bottom Section: Customer Receivables & Due Reconciliation */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-amber-50/40">
            <div className="flex justify-between items-center border-b border-slate-300 pb-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-amber-600" /> CUSTOMER RECEIVABLES & DUE RECONCILIATION
              </h4>
              <span className="text-[11px] font-bold text-amber-800">Customer Due Status</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  1. Previous Due
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-tabular">
                  ৳ {formatCurrency(prevDue)}
                </span>
              </div>

              <div className="bg-white border border-amber-300 p-3 rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">
                  2. New Billed Due
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-700 font-tabular">
                  ৳ {formatCurrency(newDueBilled)}
                </span>
              </div>

              <div className="bg-white border border-emerald-300 p-3 rounded-xl shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">
                  3. Due Collected
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-tabular">
                  ৳ {formatCurrency(dueCollected)}
                </span>
              </div>

              <div className="bg-white border-2 border-rose-400 p-3 rounded-xl shadow-xs bg-rose-50/40">
                <span className="text-[11px] font-black text-rose-800 uppercase block mb-1">
                  4. Total Net Due
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-800 font-tabular">
                  ৳ {formatCurrency(totalNetDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-10 pb-2 text-center text-xs text-slate-700">
            <div>
              <div className="border-t border-slate-500 w-48 pt-1.5 font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                CHECKED & VERIFIED BY
              </div>
            </div>
            <div>
              <div className="border-t-2 border-slate-900 w-52 pt-1.5 font-black text-slate-900 text-[11px] uppercase tracking-wider">
                AUTHORIZED SIGNATURE
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="print-doc-footer flex justify-between items-center pt-2 text-[10.5px] text-slate-600 border-t border-slate-300 font-medium">
            <div>
              Business Financial Statement - Printed : {nowFormatted} • {currentUser}
            </div>
            <div className="font-bold text-slate-700">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};
