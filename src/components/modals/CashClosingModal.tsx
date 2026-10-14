import React, { useState, useEffect } from 'react';
import { X, Coins, Printer, Calculator, CheckCheck, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { CashClosingRecord, SaleRecord, ExpenseRecord, DueRecord, DenominationCounts } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface CashClosingModalProps {
  cashClosings: CashClosingRecord[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  dueRecords: DueRecord[];
  currentUser: string;
  onClose: () => void;
  onOpenCashClosingPrint: () => void;
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

  // Calculate System Inflow & Outflows for this date
  const dateSales = sales.filter(s => (s.rawDate || s.date) === closingDate);
  const salesInflow = dateSales.reduce((sum, s) => sum + (s.paid !== undefined ? s.paid : s.grandTotal), 0);

  const dateDues = dueRecords.filter(d => d.date === closingDate && d.paid > 0);
  const dueInflow = dateDues.reduce((sum, d) => sum + (d.paid || 0), 0);

  const totalInflow = salesInflow + dueInflow;

  const dateExpenses = expenses.filter(e => e.date === closingDate);
  const expenseOutflow = dateExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Opening Cash & Previous Shortage logic
  // Resets to 0 on 1st of month!
  const dateParts = closingDate.split('-');
  const isDayOne = dateParts.length >= 3 && parseInt(dateParts[2], 10) === 1;

  let openingCash = 0;
  let prevShortage = 0;

  // Look for existing saved record for this date
  const existingSaved = cashClosings.find(c => c.date === closingDate);

  if (existingSaved) {
    openingCash = existingSaved.openingCash;
    prevShortage = existingSaved.prevShortageDeducted;
  } else if (!isDayOne && dateParts.length >= 3) {
    // Check yesterday's closing record
    const yDate = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10) - 1);
    const yDateStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;
    const yClosing = cashClosings.find(c => c.date === yDateStr);

    if (yClosing) {
      openingCash = yClosing.actualCash > 0 ? yClosing.actualCash : 0;
      prevShortage = yClosing.difference < 0 ? Math.abs(yClosing.difference) : 0;
    }
  }

  // Populate existing data when date changes
  useEffect(() => {
    if (existingSaved) {
      setNotes(existingSaved.notes || '');
      setDenoms(existingSaved.denominations || {});
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

  const expectedCash = openingCash + totalInflow - prevShortage - expenseOutflow;

  // Physical actual cash calculation
  const actualCash =
    (denoms.n1000 || 0) * 1000 +
    (denoms.n500 || 0) * 500 +
    (denoms.n200 || 0) * 200 +
    (denoms.n100 || 0) * 100 +
    (denoms.n50 || 0) * 50 +
    (denoms.n20 || 0) * 20 +
    (denoms.n10 || 0) * 10 +
    (denoms.n5 || 0) * 5 +
    (denoms.coins || 0);

  const diff = actualCash - expectedCash;
  const status: 'Matched' | 'Short' | 'Excess' =
    diff === 0 ? 'Matched' : diff < 0 ? 'Short' : 'Excess';

  const updateDenom = (field: keyof DenominationCounts, val: number) => {
    setDenoms(prev => ({
      ...prev,
      [field]: Math.max(0, val)
    }));
  };

  const handleSave = async () => {
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
      showToast(`Cash closing saved for ${closingDate}!`, 'success');
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
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <span>Daily Cash Closing & Drawer Reconciliation</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCashClosingPrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Print Closing Slip</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">Closing Date:</span>
              <input
                type="date"
                value={closingDate}
                onChange={e => setClosingDate(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setClosingDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Today
            </button>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                existingSaved
                  ? existingSaved.status === 'Matched'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : existingSaved.status === 'Short'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {existingSaved ? `Closed (${existingSaved.status})` : 'Open / In Progress'}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            Cashier: <span className="font-bold text-white">{currentUser}</span>
          </div>
        </div>

        {/* 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: System Drawer Calculation */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Calculator className="w-4 h-4 text-cyan-400" /> 1. System Cash Drawer Statement
              </h4>

              <div className="space-y-2 text-xs">
                {/* Opening Cash */}
                <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl border border-slate-700">
                  <div>
                    <span className="font-bold text-slate-300 block">Opening Balance (Yesterday's Closing Cash)</span>
                    <span className="text-[10px] text-slate-400">
                      {isDayOne
                        ? 'Month start (Day 01) - Reset to ৳0'
                        : 'Auto-carried over from yesterday'}
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
            </div>

            {/* Reconciliation Status Banner */}
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
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : diff < 0 ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                ) : (
                  <Info className="w-6 h-6 text-amber-400" />
                )}
                <div>
                  <div className="text-sm font-black uppercase tracking-wider">
                    {diff === 0 ? 'CASH BALANCED (MATCHED)' : diff < 0 ? `CASH SHORT: ৳ ${formatCurrency(Math.abs(diff))}` : `CASH EXCESS: ৳ ${formatCurrency(diff)}`}
                  </div>
                  <span className="text-[11px] opacity-80">
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

          {/* Right: Physical Denomination Counter */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> 2. Physical Cash Denomination Counter
                </h4>
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
                          value={count || ''}
                          onChange={e => updateDenom(d.key as any, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-black text-xs focus:outline-none focus:border-emerald-400 font-tabular"
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
                      value={denoms.coins || ''}
                      onChange={e => updateDenom('coins', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-emerald-400 font-black text-xs focus:outline-none focus:border-emerald-400 font-tabular"
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
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Drawer balanced, shortage noted..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Save & Complete Daily Cash Closing</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
