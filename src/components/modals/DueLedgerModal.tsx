import React, { useState } from 'react';
import { X, BookMarked, Printer, HandCoins, Check, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { CustomerDueSummary, DueRecord } from '../../types';
import { formatCurrency, formatDateDisplay, resolveCustomerAddress } from '../../utils/helpers';

interface DueLedgerModalProps {
  dueRecords: DueRecord[];
  customerSummaries: CustomerDueSummary[];
  dueTotals: { shopTotalDue: number; shopTotalPaid: number; netDue: number };
  currentUser: string;
  onClose: () => void;
  onOpenLedgerPrint: (filterCustomer?: string, startDate?: string, endDate?: string, month?: string) => void;
  onSubmitPayment: (paymentData: any) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const DueLedgerModal: React.FC<DueLedgerModalProps> = ({
  dueRecords,
  customerSummaries,
  dueTotals,
  currentUser,
  onClose,
  onOpenLedgerPrint,
  onSubmitPayment,
  showToast
}) => {
  const [selectedFilterCust, setSelectedFilterCust] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Payment form state
  const [paymentCustomer, setPaymentCustomer] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDesc, setPaymentDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter records
  const filteredRecords = dueRecords.filter(r => {
    if (selectedFilterCust !== 'ALL' && r.customer.toLowerCase() !== selectedFilterCust.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = r.customer.toLowerCase().includes(q);
      const matchPhone = (r.phone || '').toLowerCase().includes(q);
      const matchDesc = (r.desc || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchDesc) return false;
    }
    if (filterMonth && r.date && !r.date.startsWith(filterMonth)) return false;
    if (filterStartDate && r.date && r.date < filterStartDate) return false;
    if (filterEndDate && r.date && r.date > filterEndDate) return false;
    return true;
  });

  // Calculate filtered totals
  let activeBilled = 0;
  let activePaid = 0;
  filteredRecords.forEach(r => {
    activeBilled += r.due || 0;
    activePaid += r.paid || 0;
  });
  const activeNet = activeBilled - activePaid;

  const handleCustomerSelectChange = (name: string) => {
    setPaymentCustomer(name);
    const m = customerSummaries.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (m) {
      setPaymentPhone(m.phone || '');
      setPaymentAddress(m.address || 'Paduar Bazar, Cumilla');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount) || 0;
    if (!paymentCustomer) {
      showToast('Please select a due customer!', 'warning');
      return;
    }
    if (amt <= 0) {
      showToast('Please enter a valid payment amount!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitPayment({
        customer: paymentCustomer,
        phone: paymentPhone,
        address: paymentAddress || 'Paduar Bazar, Cumilla',
        amount: amt,
        date: paymentDate,
        desc: paymentDesc || 'Cash / bKash Payment',
        user: currentUser
      });
      setPaymentCustomer('');
      setPaymentPhone('');
      setPaymentAmount('');
      setPaymentDesc('');
      showToast('Customer payment recorded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Payment error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="no-print print:hidden fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-amber-500/40 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
            <span>Customer Due Ledger & Payment Collection</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenLedgerPrint(selectedFilterCust, filterStartDate, filterEndDate, filterMonth)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Ledger Print / PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950 border border-rose-500/30 p-3.5 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Total Due Billed (Dr)</span>
              <div className="text-lg font-black text-white font-tabular">
                Tk {formatCurrency(selectedFilterCust === 'ALL' ? dueTotals.shopTotalDue : activeBilled)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-950 border border-emerald-500/30 p-3.5 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Total Paid (Cr)</span>
              <div className="text-lg font-black text-white font-tabular">
                Tk {formatCurrency(selectedFilterCust === 'ALL' ? dueTotals.shopTotalPaid : activePaid)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-3.5 rounded-2xl text-white flex justify-between items-center shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-black text-amber-100 block">
                Current Outstanding (Net Due)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-tabular">
                Tk {formatCurrency(selectedFilterCust === 'ALL' ? dueTotals.netDue : activeNet)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/20 text-amber-300 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Search & Filter Customer Ledger
            </h4>
            <span className="text-xs text-amber-400 font-bold">
              Total {filteredRecords.length} Entries
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search customer, mobile or memo..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedFilterCust}
                onChange={e => setSelectedFilterCust(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
              >
                <option value="ALL">All Due Customers ({customerSummaries.length})</option>
                {customerSummaries.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} (Due: Tk {formatCurrency(c.netBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">From:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => {
                  setFilterStartDate(e.target.value);
                  setFilterMonth('');
                }}
                className="bg-transparent text-white font-bold text-[11px] focus:outline-none w-full"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">To:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => {
                  setFilterEndDate(e.target.value);
                  setFilterMonth('');
                }}
                className="bg-transparent text-white font-bold text-[11px] focus:outline-none w-full"
              />
            </div>

            <div className="sm:col-span-1 flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-1.5 py-1 text-xs">
              <input
                type="month"
                value={filterMonth}
                onChange={e => {
                  setFilterMonth(e.target.value);
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="bg-transparent text-white font-bold text-[10px] focus:outline-none w-full"
                title="Filter by Month"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Customer & Contact</th>
                <th className="p-3">Particulars / Memo</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Due (Dr)</th>
                <th className="p-3 text-right">Paid (Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/60 transition">
                    <td className="p-3 whitespace-nowrap text-slate-400 font-semibold">
                      {formatDateDisplay(r.date)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm">{r.customer}</div>
                          <div className="text-[10px] text-amber-300 font-medium mt-0.5">
                            {r.phone || '--'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenLedgerPrint(r.customer, filterStartDate, filterEndDate, filterMonth)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded transition cursor-pointer"
                          title={`Print ${r.customer}'s Due Ledger`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-amber-300 font-bold whitespace-nowrap">
                      {r.id.startsWith('INV-') ? `#${r.id.replace('INV-', '')}` : r.type}
                    </td>
                    <td className="p-3 text-slate-300 text-xs">{r.desc || '--'}</td>
                    <td className="p-3 text-right font-black text-rose-400 font-tabular">
                      {r.due > 0 ? `Tk ${formatCurrency(r.due)}` : '-'}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-400 font-tabular">
                      {r.paid > 0 ? `Tk ${formatCurrency(r.paid)}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Customer Payment Collection Form */}
        <form
          onSubmit={handlePaymentSubmit}
          className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-3"
        >
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <HandCoins className="w-4 h-4 text-emerald-400" />
              <span>Receive Customer Payment</span>
            </h4>
            <span className="text-[10px] text-slate-400">
              * Only customers with outstanding due are listed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Select Due Customer *
              </label>
              <select
                required
                value={paymentCustomer}
                onChange={e => handleCustomerSelectChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select customer...</option>
                {customerSummaries.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} (Due: Tk {formatCurrency(c.netBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Mobile</label>
              <input
                type="text"
                readOnly
                value={paymentPhone}
                placeholder="017xxxxxxxx"
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-400 font-semibold focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                Amount (Tk ) *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-emerald-400 font-black text-right focus:outline-none font-tabular"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white font-semibold focus:outline-none"
              />
            </div>

            <div className="sm:col-span-12 flex gap-2 items-center">
              <input
                type="text"
                value={paymentDesc}
                onChange={e => setPaymentDesc(e.target.value)}
                placeholder="Payment method / Note (e.g. Cash payment at counter / bKash 017...)"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-shrink-0 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition whitespace-nowrap cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Payment</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
