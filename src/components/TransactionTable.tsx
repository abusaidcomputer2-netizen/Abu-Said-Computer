import React from 'react';
import { 
  Clock, 
  Search, 
  Printer, 
  Calendar, 
  CalendarDays, 
  RotateCw, 
  Edit3, 
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { SaleRecord } from '../types';
import { formatCurrency, formatDateDisplay } from '../utils/helpers';

interface TransactionTableProps {
  sales: SaleRecord[];
  filterStartDate: string;
  filterEndDate: string;
  filterMonth: string;
  searchMemo: string;
  filterStaff: string;
  staffList: string[];
  activeFilterBadge: string;
  isAdmin: boolean;
  onFilterStartDateChange: (val: string) => void;
  onFilterEndDateChange: (val: string) => void;
  onFilterMonthChange: (val: string) => void;
  onSearchMemoChange: (val: string) => void;
  onFilterStaffChange: (val: string) => void;
  onFilterToday: () => void;
  onFilterRunningMonth: () => void;
  onReload: () => void;
  onPrintInvoice: (sale: SaleRecord) => void;
  onOpenSummaryReport: () => void;
  onOpenDataSheet?: () => void;
  onEditSale: (sale: SaleRecord) => void;
  onDeleteSale: (sale: SaleRecord) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  sales,
  filterStartDate,
  filterEndDate,
  filterMonth,
  searchMemo,
  filterStaff,
  staffList,
  activeFilterBadge,
  isAdmin,
  onFilterStartDateChange,
  onFilterEndDateChange,
  onFilterMonthChange,
  onSearchMemoChange,
  onFilterStaffChange,
  onFilterToday,
  onFilterRunningMonth,
  onReload,
  onPrintInvoice,
  onOpenSummaryReport,
  onOpenDataSheet,
  onEditSale,
  onDeleteSale,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Transactions Record</span>
            </h2>
            <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
              {activeFilterBadge}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenSummaryReport}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Summary Print</span>
            </button>

            <button
              type="button"
              onClick={onFilterToday}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-300" /> Today
            </button>

            <button
              type="button"
              onClick={onFilterRunningMonth}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-400" /> Running Month
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
          <div className="sm:col-span-4 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchMemo}
              onChange={e => onSearchMemoChange(e.target.value)}
              placeholder="Memo No (e.g. 4001)..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-xl px-2 py-1.5 text-xs">
            <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">From:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={e => onFilterStartDateChange(e.target.value)}
              className="bg-transparent text-white font-bold text-[11px] focus:outline-none w-full"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-xl px-2 py-1.5 text-xs">
            <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">To:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => onFilterEndDateChange(e.target.value)}
              className="bg-transparent text-white font-bold text-[11px] focus:outline-none w-full"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-xl px-2 py-1.5 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Month:</span>
            <input
              type="month"
              value={filterMonth}
              onChange={e => onFilterMonthChange(e.target.value)}
              className="bg-transparent text-white font-bold text-[11px] focus:outline-none w-full"
            />
          </div>

          {isAdmin && staffList.length > 0 && (
            <div className="sm:col-span-12 pt-1">
              <select
                value={filterStaff}
                onChange={e => onFilterStaffChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Staff Members</option>
                {staffList.map(s => (
                  <option key={s} value={s}>
                    Staff: {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="p-3 text-center w-12">SL</th>
              <th className="p-3">Memo No</th>
              <th className="p-3">Customer & Mobile</th>
              <th className="p-3">Category / Service</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3">{isAdmin || searchMemo ? 'Staff & Time' : 'Time'}</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                  {searchMemo ? `No memo found matching "${searchMemo}".` : 'No transaction records found matching active filter.'}
                </td>
              </tr>
            ) : (
              sales.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 text-center text-slate-500 font-mono text-[11px] font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-3 font-black text-amber-400 whitespace-nowrap">
                    #{s.invoiceNo}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-white">{s.customer || 'New Customer'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.phone || '01904142370'}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold text-[10px]">
                        {s.category}
                      </span>
                    </div>
                    {s.desc && (
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{s.desc}</div>
                    )}
                  </td>
                  <td className="p-3 text-right font-black text-emerald-400 text-sm font-tabular whitespace-nowrap">
                    Tk {formatCurrency(s.grandTotal)}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {s.due > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                        Due: Tk {formatCurrency(s.due)}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        Paid
                      </span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {isAdmin || searchMemo ? (
                      <>
                        <div className="font-bold text-slate-300">{s.user}</div>
                        <div className="text-[10px] text-slate-500">{s.timestamp}</div>
                      </>
                    ) : (
                      <div className="font-bold text-slate-300 text-xs">{s.timestamp}</div>
                    )}
                  </td>
                  <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => onPrintInvoice(s)}
                      className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition cursor-pointer"
                      title="Print Invoice / PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditSale(s)}
                      className="p-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg transition cursor-pointer"
                      title="Edit Memo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onDeleteSale(s)}
                        className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition cursor-pointer"
                        title="Delete Memo (Admin Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
