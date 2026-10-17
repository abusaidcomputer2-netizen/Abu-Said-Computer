import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Coins, 
  Printer, 
  Calculator, 
  CheckCheck, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Calendar, 
  History, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Receipt, 
  Wallet,
  Eye
} from 'lucide-react';
import { CashClosingRecord, SaleRecord, ExpenseRecord, DueRecord, DenominationCounts } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface CashClosingModalProps {
  cashClosings: CashClosingRecord[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  dueRecords: DueRecord[];
  currentUser: string;
  onClose: () => void;
  onOpenCashClosingPrint: (record?: CashClosingRecord) => void;
  onSubmitCashClosing: (data: any) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const CashClosingModal: React.FC<CashClosingModalProps> = ({
  cashClosings,
  sales,
  expenses,
  dueRecords,
  currentUser,
  onClose,
  onOpenCashClosingPrint,
  onSubmitCashClosing,
  showToast
}) => {
  const [closingDate, setClosingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [showTransactions, setShowTransactions] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }, []);

  // Strict Business Rule: Only today and yesterday can be edited. Any earlier dates are locked/read-only.
  const isEditable = closingDate === todayStr || closingDate === yesterdayStr;

  const [denoms, setDenoms] = useState<DenominationCounts>({
    n1000: 0,
    n500: 0,
    n200: 0,
    n100: 0,
    n50: 0,
    n20: 0,
    n10: 0,
    n5: 0,
    coins: 0
  });

  // Check if a saved record exists for currently selected date
  const existingSaved = useMemo(() => {
    return cashClosings.find(c => c.date === closingDate);
  }, [cashClosings, closingDate]);

  // System Inflow & Outflows calculated from live sales/dues/expenses for this date
  const dateSales = useMemo(() => {
    return sales.filter(s => (s.rawDate || s.date) === closingDate);
  }, [sales, closingDate]);

  const liveSalesInflow = useMemo(() => {
    return dateSales.reduce((sum, s) => sum + (s.paid !== undefined ? s.paid : s.grandTotal), 0);
  }, [dateSales]);

  const dateDues = useMemo(() => {
    return dueRecords.filter(d => d.date === closingDate && d.paid > 0);
  }, [dueRecords, closingDate]);

  const liveDueInflow = useMemo(() => {
    return dateDues.reduce((sum, d) => sum + (d.paid || 0), 0);
  }, [dateDues]);

  const liveTotalInflow = liveSalesInflow + liveDueInflow;

  const dateExpenses = useMemo(() => {
    return expenses.filter(e => e.date === closingDate);
  }, [expenses, closingDate]);

  const liveExpenseOutflow = useMemo(() => {
    return dateExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [dateExpenses]);

  // Opening Cash & Previous Shortage logic
  // Resets to 0 on 1st of month!
  const dateParts = closingDate.split('-');
  const isDayOne = dateParts.length >= 3 && parseInt(dateParts[2], 10) === 1;

  let calculatedOpeningCash = 0;
  let calculatedPrevShortage = 0;

  if (existingSaved) {
    calculatedOpeningCash = existingSaved.openingCash ?? 0;
    calculatedPrevShortage = existingSaved.prevShortageDeducted ?? 0;
  } else if (!isDayOne && dateParts.length >= 3) {
    const yDate = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10) - 1);
    const yr = yDate.getFullYear();
    const mo = String(yDate.getMonth() + 1).padStart(2, '0');
    const da = String(yDate.getDate()).padStart(2, '0');
    const yDateStr = `${yr}-${mo}-${da}`;
    const yClosing = cashClosings.find(c => c.date === yDateStr);

    if (yClosing) {
      calculatedOpeningCash = yClosing.actualCash > 0 ? yClosing.actualCash : 0;
      calculatedPrevShortage = yClosing.difference < 0 ? Math.abs(yClosing.difference) : 0;
    }
  }

  // Populate state when date or existing record changes
  useEffect(() => {
    if (existingSaved) {
      setNotes(existingSaved.notes || '');
      setDenoms({
        n1000: existingSaved.denominations?.n1000 || 0,
        n500: existingSaved.denominations?.n500 || 0,
        n200: existingSaved.denominations?.n200 || 0,
        n100: existingSaved.denominations?.n100 || 0,
        n50: existingSaved.denominations?.n50 || 0,
        n20: existingSaved.denominations?.n20 || 0,
        n10: existingSaved.denominations?.n10 || 0,
        n5: existingSaved.denominations?.n5 || 0,
        coins: existingSaved.denominations?.coins || 0
      });
    } else {
      setNotes('');
      setDenoms({
        n1000: 0,
        n500: 0,
        n200: 0,
        n100: 0,
        n50: 0,
        n20: 0,
        n10: 0,
        n5: 0,
        coins: 0
      });
    }
  }, [closingDate, existingSaved]);

  // For locked (past) records, display frozen saved numbers; for editable days, use live/editable numbers
  const openingCash = existingSaved ? existingSaved.openingCash : calculatedOpeningCash;
  const prevShortage = existingSaved ? existingSaved.prevShortageDeducted : calculatedPrevShortage;
  const salesInflow = (!isEditable && existingSaved) ? existingSaved.salesInflow : liveSalesInflow;
  const dueInflow = (!isEditable && existingSaved) ? existingSaved.dueInflow : liveDueInflow;
  const totalInflow = (!isEditable && existingSaved) ? existingSaved.totalInflow : liveTotalInflow;
  const expenseOutflow = (!isEditable && existingSaved) ? existingSaved.expenseOutflow : liveExpenseOutflow;
  const expectedCash = (!isEditable && existingSaved) 
    ? existingSaved.expectedCash 
    : (openingCash + totalInflow - prevShortage - expenseOutflow);

  // Physical actual cash calculation
  const actualCash = useMemo(() => {
    return (
      (denoms.n1000 || 0) * 1000 +
      (denoms.n500 || 0) * 500 +
      (denoms.n200 || 0) * 200 +
      (denoms.n100 || 0) * 100 +
      (denoms.n50 || 0) * 50 +
      (denoms.n20 || 0) * 20 +
      (denoms.n10 || 0) * 10 +
      (denoms.n5 || 0) * 5 +
      (denoms.coins || 0)
    );
  }, [denoms]);

  const diff = actualCash - expectedCash;
  const status: 'Matched' | 'Short' | 'Excess' =
    diff === 0 ? 'Matched' : diff < 0 ? 'Short' : 'Excess';

  const updateDenom = (field: keyof DenominationCounts, val: number) => {
    if (!isEditable) return;
    setDenoms(prev => ({
      ...prev,
      [field]: Math.max(0, val)
    }));
  };

  const handlePrintCurrent = () => {
    const recordToPrint: CashClosingRecord = existingSaved || {
      id: `temp-${closingDate}`,
      rowId: 0,
      date: closingDate,
      closedAt: new Date().toISOString(),
      user: currentUser,
      openingCash,
      prevShortageDeducted: prevShortage,
      salesInflow,
      dueInflow,
      totalInflow,
      expenseOutflow,
      expectedCash,
      actualCash,
      difference: diff,
      status,
      notes,
      denominations: denoms
    };
    onOpenCashClosingPrint(recordToPrint);
  };

  const handleSave = async () => {
    if (!isEditable) {
      showToast('আগের কোন দিনের তথ্য এডিট করা যাবে না! শুধু আজকের ও গতকালের তথ্য এডিট করা সম্ভব।', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitCashClosing({
        date: closingDate,
        user: currentUser,
        openingCash,
        prevShortageDeducted: prevShortage,
        salesInflow,
        dueInflow,
        totalInflow,
        expenseOutflow,
        expectedCash,
        actualCash,
        difference: diff,
        status,
        notes,
        denominations: denoms
      });
      showToast(`Daily cash closing saved for ${closingDate}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error saving cash closing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/40 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Daily Cash Closing & Drawer Reconciliation</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                দৈনিক ক্যাশ ক্লোজিং, ড্রয়ার মিল এবং বিস্তারিত হিসাব রেকর্ড
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Form vs Detailed Records History */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Closing Form</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Records History ({cashClosings.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrintCurrent}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Print Closing Slip for Selected Date"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Closing Form & Drawer Reconciliation */}
        {activeTab === 'form' ? (
          <>
            {/* Top Date Selection and Lock Status Bar */}
            <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800 flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Date:</span>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={e => setClosingDate(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setClosingDate(todayStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    closingDate === todayStr ? 'bg-emerald-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setClosingDate(yesterdayStr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    closingDate === yesterdayStr ? 'bg-emerald-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Yesterday
                </button>

                {/* Past Closings Dropdown */}
                {cashClosings.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={closingDate}
                      onChange={e => setClosingDate(e.target.value)}
                      className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold cursor-pointer max-w-[220px]"
                    >
                      <option value={todayStr}>📅 Today ({todayStr})</option>
                      <option value={yesterdayStr}>📅 Yesterday ({yesterdayStr})</option>
                      {cashClosings
                        .filter(c => c.date !== todayStr && c.date !== yesterdayStr)
                        .map(c => (
                          <option key={c.id || c.date} value={c.date}>
                            {c.date} • {c.status} (৳{formatCurrency(c.actualCash)})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                    existingSaved
                      ? existingSaved.status === 'Matched'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : existingSaved.status === 'Short'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {existingSaved ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Saved ({existingSaved.status})</span>
                    </>
                  ) : (
                    <>
                      <Info className="w-3.5 h-3.5" />
                      <span>Open / Draft</span>
                    </>
                  )}
                </span>
              </div>

              {/* Editability Indicator */}
              <div className="flex items-center gap-2 text-xs">
                {isEditable ? (
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Editable (আজ / গতকাল)</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Locked (Read-Only)</span>
                  </span>
                )}
                <div className="text-slate-400 font-semibold pl-2 border-l border-slate-800 hidden sm:block">
                  Cashier: <span className="font-bold text-white">{currentUser}</span>
                </div>
              </div>
            </div>

            {/* Lock Notice if date is older than yesterday */}
            {!isEditable && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  নিয়ম অনুযায়ী শুধুমাত্র আজকের এবং গতকালের ক্যাশ ক্লোজিং এডিট করা যাবে। {closingDate} তারিখের পূর্ববর্তী রেকর্ড লক করা (Read-Only)।
                </span>
              </div>
            )}

            {/* 2-Column Split: System Drawer on Left, Physical Denominations on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: System Cash Drawer Statement */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-950 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-cyan-400" /> 1. System Cash Drawer Statement
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {closingDate}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Opening Cash */}
                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl border border-slate-700">
                      <div>
                        <span className="font-bold text-slate-300 block">Opening Balance (Yesterday's Closing Cash)</span>
                        <span className="text-[10px] text-slate-400">
                          {isDayOne
                            ? 'Month start (Day 01) - Reset to ৳0'
                            : 'Auto-carried over from previous day closing'}
                        </span>
                      </div>
                      <span className="font-black text-cyan-300 text-sm font-tabular">
                        ৳ {formatCurrency(openingCash)}
                      </span>
                    </div>

                    {/* Previous Shortage */}
                    {prevShortage > 0 && (
                      <div className="flex justify-between items-center p-2.5 bg-rose-950/30 rounded-xl border border-rose-500/40">
                        <div>
                          <span className="font-bold text-rose-300 block">(-) Prev Day Shortage Deducted</span>
                          <span className="text-[10px] text-rose-400/80">
                            Shortage deducted from today's drawer cash
                          </span>
                        </div>
                        <span className="font-black text-rose-400 text-sm font-tabular">
                          -৳ {formatCurrency(prevShortage)}
                        </span>
                      </div>
                    )}

                    {/* Sales Inflow */}
                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-bold text-slate-300 block">(+) Sales Cash Received</span>
                        <span className="text-[10px] text-slate-500">{dateSales.length} Memos</span>
                      </div>
                      <span className="font-black text-emerald-400 text-sm font-tabular">
                        ৳ {formatCurrency(salesInflow)}
                      </span>
                    </div>

                    {/* Due Inflow */}
                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-bold text-slate-300 block">(+) Due Collected Today</span>
                        <span className="text-[10px] text-slate-500">{dateDues.length} Payments</span>
                      </div>
                      <span className="font-black text-emerald-400 text-sm font-tabular">
                        ৳ {formatCurrency(dueInflow)}
                      </span>
                    </div>

                    {/* Total Inflow Strip */}
                    <div className="flex justify-between items-center px-3 py-1.5 bg-emerald-500/10 rounded-lg text-emerald-300 font-bold border border-emerald-500/20">
                      <span>Total Cash Inflow:</span>
                      <span className="font-black font-tabular">৳ {formatCurrency(totalInflow)}</span>
                    </div>

                    {/* Outflows */}
                    <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-bold text-slate-300 block">(-) Cash Outflows (Expenses & Purchases)</span>
                        <span className="text-[10px] text-slate-500">{dateExpenses.length} Entries</span>
                      </div>
                      <span className="font-black text-rose-400 text-sm font-tabular">
                        -৳ {formatCurrency(expenseOutflow)}
                      </span>
                    </div>

                    {/* Expected Drawer Cash */}
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-cyan-500/40 rounded-xl mt-3">
                      <div>
                        <span className="text-xs font-black text-cyan-200 block uppercase">
                          Expected Drawer Cash:
                        </span>
                        <span className="text-[10px] text-cyan-300">
                          (Opening Cash + Inflows - Outflows)
                        </span>
                      </div>
                      <span className="text-xl sm:text-2xl font-black text-white font-tabular">
                        ৳ {formatCurrency(expectedCash)}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Breakdown of Day's transactions */}
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowTransactions(!showTransactions)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>
                        {showTransactions ? 'Hide Details' : `View ${dateSales.length} Memos & ${dateExpenses.length} Expenses for ${closingDate}`}
                      </span>
                    </button>

                    {showTransactions && (
                      <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3 max-h-48 overflow-y-auto text-[11px]">
                        <div>
                          <span className="font-bold text-emerald-400 block mb-1">Sales Memos ({dateSales.length}):</span>
                          {dateSales.length === 0 ? (
                            <span className="text-slate-500">No memos recorded for this day.</span>
                          ) : (
                            <div className="space-y-1">
                              {dateSales.map(s => (
                                <div key={s.id} className="flex justify-between text-slate-300">
                                  <span>#{s.invoiceNo} • {s.customer} ({s.category})</span>
                                  <span className="font-bold text-white">Paid: ৳{formatCurrency(s.paid || s.grandTotal)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-800 pt-2">
                          <span className="font-bold text-rose-400 block mb-1">Expenses & Outflows ({dateExpenses.length}):</span>
                          {dateExpenses.length === 0 ? (
                            <span className="text-slate-500">No expenses recorded for this day.</span>
                          ) : (
                            <div className="space-y-1">
                              {dateExpenses.map(e => (
                                <div key={e.id} className="flex justify-between text-slate-300">
                                  <span>{e.desc} ({e.category})</span>
                                  <span className="font-bold text-rose-300">-৳{formatCurrency(e.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Reconciliation Card */}
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    diff === 0
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : diff < 0
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {diff === 0 ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    ) : diff < 0 ? (
                      <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                    ) : (
                      <Info className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-black uppercase tracking-wider">
                        {diff === 0 ? 'CASH BALANCED (MATCHED)' : diff < 0 ? `CASH SHORT: ৳ ${formatCurrency(Math.abs(diff))}` : `CASH EXCESS: ৳ ${formatCurrency(diff)}`}
                      </div>
                      <span className="text-[11px] opacity-85">
                        {diff === 0
                          ? 'System expected cash and counted cash match exactly.'
                          : diff < 0
                          ? 'Physical drawer is short compared to expected system cash.'
                          : 'Physical drawer contains excess cash.'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-black text-base font-tabular">
                    {diff === 0 ? '৳ 0' : diff < 0 ? `-৳ ${formatCurrency(Math.abs(diff))}` : `+৳ ${formatCurrency(diff)}`}
                  </div>
                </div>
              </div>

              {/* Right Column: Physical Cash Denomination Counter */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-950 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="w-4 h-4" /> 2. Physical Cash Denomination Counter
                    </h4>
                    {!isEditable && (
                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>

                  {/* Denominations List */}
                  <div className="space-y-1.5 text-xs max-h-72 overflow-y-auto pr-1">
                    {[
                      { key: 'n1000', label: '1000 Taka Note', val: 1000, color: 'text-amber-300' },
                      { key: 'n500', label: '500 Taka Note', val: 500, color: 'text-blue-300' },
                      { key: 'n200', label: '200 Taka Note', val: 200, color: 'text-teal-300' },
                      { key: 'n100', label: '100 Taka Note', val: 100, color: 'text-cyan-300' },
                      { key: 'n50', label: '50 Taka Note', val: 50, color: 'text-emerald-300' },
                      { key: 'n20', label: '20 Taka Note', val: 20, color: 'text-lime-300' },
                      { key: 'n10', label: '10 Taka Note', val: 10, color: 'text-orange-300' },
                      { key: 'n5', label: '5 Taka Note / Coin', val: 5, color: 'text-rose-300' }
                    ].map(d => {
                      const count = (denoms as any)[d.key] || 0;
                      const lineTotal = count * d.val;
                      return (
                        <div
                          key={d.key}
                          className="grid grid-cols-12 gap-2 items-center p-1.5 bg-slate-900 rounded-xl border border-slate-800"
                        >
                          <div className={`col-span-4 font-black ${d.color}`}>{d.label}:</div>
                          <div className="col-span-4 flex items-center gap-1 justify-center">
                            <span className="text-slate-500">×</span>
                            <input
                              type="number"
                              min="0"
                              disabled={!isEditable}
                              value={count || ''}
                              onChange={e => updateDenom(d.key as any, parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-black text-xs focus:outline-none focus:border-emerald-400 font-tabular disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                          <div className="col-span-4 text-right font-black text-white font-tabular">
                            ৳ {formatCurrency(lineTotal)}
                          </div>
                        </div>
                      );
                    })}

                    {/* Loose Coins */}
                    <div className="grid grid-cols-12 gap-2 items-center p-1.5 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="col-span-6 font-black text-slate-300">2 / 1 Taka Coins & Change:</div>
                      <div className="col-span-6 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          disabled={!isEditable}
                          value={denoms.coins || ''}
                          onChange={e => updateDenom('coins', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-emerald-400 font-black text-xs focus:outline-none focus:border-emerald-400 font-tabular disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Physical Cash */}
                  <div className="flex justify-between items-center p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl mt-3">
                    <div>
                      <span className="text-xs font-black text-emerald-200 block uppercase">
                        Total Physical Cash (Actual Drawer):
                      </span>
                      <span className="text-[10px] text-emerald-300">Total counted cash in drawer</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-tabular">
                      ৳ {formatCurrency(actualCash)}
                    </span>
                  </div>
                </div>

                {/* Remarks & Save Button */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Closing Remarks / Notes (Optional):
                    </label>
                    <input
                      type="text"
                      disabled={!isEditable}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder={isEditable ? "e.g. Drawer balanced, shortage noted..." : "লক করা (Read-Only)"}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || !isEditable}
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>
                      {isEditable 
                        ? 'Save & Complete Daily Cash Closing' 
                        : 'আগের দিনের তথ্য এডিট করা যাবে না (লক করা)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Tab 2: Detailed Records History Table */
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 flex-wrap gap-2">
              <div className="text-xs text-slate-400">
                <span className="font-bold text-white">{cashClosings.length}</span> total daily closing records found in system.
              </div>
              <span className="text-[11px] text-amber-400 font-semibold">
                * শুধুমাত্র আজ এবং গতকালের রেকর্ড এডিটযোগ্য, পূর্ববর্তী সকল রেকর্ড লক করা (Read-Only)।
              </span>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-3">Closed By</th>
                      <th className="py-3 px-3 text-right">Opening</th>
                      <th className="py-3 px-3 text-right">Total Inflow</th>
                      <th className="py-3 px-3 text-right">Outflow</th>
                      <th className="py-3 px-3 text-right">Expected</th>
                      <th className="py-3 px-3 text-right">Actual Drawer</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {cashClosings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500 font-bold">
                          No cash closing records saved yet. Close today's cash above to start your ledger!
                        </td>
                      </tr>
                    ) : (
                      cashClosings.map(c => {
                        const isThisEditable = c.date === todayStr || c.date === yesterdayStr;
                        return (
                          <tr 
                            key={c.id || c.date}
                            className={`hover:bg-slate-900/60 transition ${
                              c.date === closingDate ? 'bg-emerald-500/10' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{c.date}</span>
                                {c.date === todayStr && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-black">
                                    Today
                                  </span>
                                )}
                                {c.date === yesterdayStr && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 font-black">
                                    Yesterday
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-300 font-semibold">{c.user}</td>
                            <td className="py-3 px-3 text-right text-slate-300 font-tabular">৳{formatCurrency(c.openingCash)}</td>
                            <td className="py-3 px-3 text-right text-emerald-400 font-bold font-tabular">৳{formatCurrency(c.totalInflow)}</td>
                            <td className="py-3 px-3 text-right text-rose-400 font-bold font-tabular">-৳{formatCurrency(c.expenseOutflow)}</td>
                            <td className="py-3 px-3 text-right text-cyan-300 font-bold font-tabular">৳{formatCurrency(c.expectedCash)}</td>
                            <td className="py-3 px-3 text-right text-white font-black font-tabular">৳{formatCurrency(c.actualCash)}</td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  c.status === 'Matched'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : c.status === 'Short'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {c.status} {c.difference !== 0 ? `(৳${formatCurrency(Math.abs(c.difference))})` : ''}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClosingDate(c.date);
                                    setActiveTab('form');
                                  }}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="View detailed calculations for this day"
                                >
                                  <Eye className="w-3 h-3 text-blue-400" />
                                  <span>{isThisEditable ? 'Edit' : 'View'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenCashClosingPrint(c)}
                                  className="p-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg transition cursor-pointer"
                                  title="Print Closing Slip"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
