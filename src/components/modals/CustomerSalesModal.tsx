import React, { useState } from 'react';
import { X, TrendingUp, Printer, Search, Users, FileText, Phone } from 'lucide-react';
import { SaleRecord, Customer } from '../../types';
import { formatCurrency, formatDateDisplay, resolveCustomerAddress } from '../../utils/helpers';

interface CustomerSalesModalProps {
  sales: SaleRecord[];
  customers: Customer[];
  onClose: () => void;
  onOpenCustomerSalesPrint: (filterCustomer?: string, startDate?: string, endDate?: string) => void;
  onPrintInvoice: (sale: SaleRecord) => void;
}

export const CustomerSalesModal: React.FC<CustomerSalesModalProps> = ({
  sales,
  customers,
  onClose,
  onOpenCustomerSalesPrint,
  onPrintInvoice
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const setPeriod = (mode: 'all' | 'thisMonth' | 'lastMonth' | 'today') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    if (mode === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === 'thisMonth') {
      setStartDate(`${y}-${m}-01`);
      setEndDate(todayStr);
    } else if (mode === 'lastMonth') {
      const prevM = new Date(y, now.getMonth() - 1, 1);
      const py = prevM.getFullYear();
      const pm = String(prevM.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, now.getMonth(), 0).getDate();
      setStartDate(`${py}-${pm}-01`);
      setEndDate(`${py}-${pm}-${String(lastDay).padStart(2, '0')}`);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter sales
  const filteredSales = sales.filter(s => {
    const d = s.rawDate || s.date;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    if (selectedCustomer && s.customer.toLowerCase() !== selectedCustomer.toLowerCase()) return false;

    if (search) {
      const q = search.toLowerCase();
      const matchName = s.customer.toLowerCase().includes(q);
      const matchPhone = (s.phone || '').toLowerCase().includes(q);
      const matchMemo = String(s.invoiceNo).includes(q.replace('#', ''));
      if (!matchName && !matchPhone && !matchMemo) return false;
    }
    return true;
  });

  // Aggregate by customer
  const custMap: Record<string, {
    name: string;
    phone: string;
    address: string;
    memoCount: number;
    totalPurchased: number;
    totalPaid: number;
    totalDue: number;
    lastPurchaseDate: string;
  }> = {};

  filteredSales.forEach(s => {
    const name = s.customer || 'New Customer';
    if (!custMap[name]) {
      const matched = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
      custMap[name] = {
        name,
        phone: s.phone || matched?.phone || '--',
        address: resolveCustomerAddress(name, matched?.address),
        memoCount: 0,
        totalPurchased: 0,
        totalPaid: 0,
        totalDue: 0,
        lastPurchaseDate: s.rawDate || s.date
      };
    }

    custMap[name].memoCount++;
    custMap[name].totalPurchased += s.grandTotal || 0;
    custMap[name].totalPaid += s.paid || 0;
    custMap[name].totalDue += s.due || 0;
    if ((s.rawDate || s.date) >= custMap[name].lastPurchaseDate) {
      custMap[name].lastPurchaseDate = s.rawDate || s.date;
    }
  });

  const summaries = Object.values(custMap).sort((a, b) => b.totalPurchased - a.totalPurchased);

  const totalSales = filteredSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  const totalPaid = filteredSales.reduce((sum, s) => sum + (s.paid || 0), 0);
  const totalDue = filteredSales.reduce((sum, s) => sum + (s.due || 0), 0);

  return (
    <div className="no-print print:hidden fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-cyan-500/40 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>Customer Sales Records & Purchase History</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenCustomerSalesPrint(selectedCustomer, startDate, endDate)}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Search & Date Filters
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPeriod('all')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
              >
                All Time
              </button>
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            <div className="sm:col-span-5 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by customer name, mobile, or memo #..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none"
              >
                <option value="">All Customers</option>
                {customers.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-white font-bold text-[11px] focus:outline-none w-full"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-white font-bold text-[11px] focus:outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Customers</span>
            <div className="text-lg sm:text-xl font-black text-white">{summaries.length}</div>
          </div>
          <div className="bg-slate-950 border border-blue-500/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-400 uppercase block">Total Memos</span>
            <div className="text-lg sm:text-xl font-black text-blue-400 font-tabular">{filteredSales.length}</div>
          </div>
          <div className="bg-slate-950 border border-emerald-500/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Total Purchased</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-tabular">
              Tk {formatCurrency(totalSales)}
            </div>
          </div>
          <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-amber-400 uppercase block">Paid / Due</span>
            <div className="text-xs sm:text-sm font-black text-white mt-1 font-tabular">
              <span className="text-emerald-400">Tk {formatCurrency(totalPaid)}</span> /{' '}
              <span className="text-rose-400">Tk {formatCurrency(totalDue)}</span>
            </div>
          </div>
        </div>

        {/* View Mode Toggle & Table */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-800 flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'summary' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Customer Summary
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'detailed' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Detailed Memos
              </button>
            </div>
            <span className="text-xs text-slate-400 font-semibold font-tabular">
              {viewMode === 'summary' ? `${summaries.length} Customers` : `${filteredSales.length} Memos`}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
            {viewMode === 'summary' ? (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3 text-center w-12">SL</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Mobile & Address</th>
                    <th className="p-3 text-center">Total Memos</th>
                    <th className="p-3 text-right">Total Purchased</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Due</th>
                    <th className="p-3 text-center">Last Purchase</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {summaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                        No customer purchase records found.
                      </td>
                    </tr>
                  ) : (
                    summaries.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 transition">
                        <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-white text-xs sm:text-sm">{c.name}</td>
                        <td className="p-3 text-slate-400">
                          <div className="text-amber-300 font-bold">{c.phone}</div>
                          <div className="text-[10px] text-slate-500">{c.address}</div>
                        </td>
                        <td className="p-3 text-center font-bold text-blue-300 font-tabular">{c.memoCount} Memos</td>
                        <td className="p-3 text-right font-black text-emerald-400 font-tabular">
                          Tk {formatCurrency(c.totalPurchased)}
                        </td>
                        <td className="p-3 text-right text-emerald-300 font-tabular">Tk {formatCurrency(c.totalPaid)}</td>
                        <td className={`p-3 text-right font-tabular ${c.totalDue > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          Tk {formatCurrency(c.totalDue)}
                        </td>
                        <td className="p-3 text-center text-slate-400 whitespace-nowrap">
                          {formatDateDisplay(c.lastPurchaseDate)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c.name);
                              setViewMode('detailed');
                            }}
                            className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg text-xs font-bold transition"
                          >
                            View Memos
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3 text-center w-12">SL</th>
                    <th className="p-3">Memo No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Category / Service</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Due</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                        No memos found.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-900/60 transition">
                        <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-black text-amber-400 whitespace-nowrap">#{s.invoiceNo}</td>
                        <td className="p-3 whitespace-nowrap text-slate-400 font-semibold">{formatDateDisplay(s.rawDate || s.date)}</td>
                        <td className="p-3">
                          <div className="font-bold text-white">{s.customer}</div>
                          <div className="text-[10px] text-slate-500">{s.phone}</div>
                        </td>
                        <td className="p-3 text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-bold">
                            {s.category}
                          </span>
                          {s.desc && <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-400 font-tabular">
                          Tk {formatCurrency(s.grandTotal)}
                        </td>
                        <td className="p-3 text-right text-emerald-300 font-tabular">Tk {formatCurrency(s.paid)}</td>
                        <td className={`p-3 text-right font-tabular ${s.due > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          Tk {formatCurrency(s.due)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => onPrintInvoice(s)}
                            className="p-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
