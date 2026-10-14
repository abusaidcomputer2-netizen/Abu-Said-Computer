import React from 'react';
import { X, Printer, BookMarked, Building2 } from 'lucide-react';
import { CustomerDueSummary, DueRecord } from '../../types';
import { formatCurrency, formatDateDisplay, formatInvoicePrintTimestamp } from '../../utils/helpers';

interface LedgerPrintModalProps {
  records: DueRecord[];
  customerSummaries: CustomerDueSummary[];
  filterCustomer: string;
  startDate: string;
  endDate: string;
  month: string;
  currentUser: string;
  onClose: () => void;
}

export const LedgerPrintModal: React.FC<LedgerPrintModalProps> = ({
  records,
  customerSummaries,
  filterCustomer,
  startDate,
  endDate,
  month,
  currentUser,
  onClose
}) => {
  const nowFormatted = formatInvoicePrintTimestamp(new Date());

  const handlePrint = () => {
    window.print();
  };

  // Determine single customer vs all
  const isSingle = filterCustomer && filterCustomer !== 'ALL';
  const targetCust = isSingle
    ? customerSummaries.find(c => c.name.toLowerCase() === filterCustomer.toLowerCase())
    : null;

  const filteredRecords = records.filter(r => {
    if (isSingle && r.customer.toLowerCase() !== filterCustomer.toLowerCase()) return false;
    if (month && r.date && !r.date.startsWith(month)) return false;
    if (startDate && r.date && r.date < startDate) return false;
    if (endDate && r.date && r.date > endDate) return false;
    return true;
  });

  let totalBilled = 0;
  let totalPaid = 0;
  filteredRecords.forEach(r => {
    totalBilled += r.due || 0;
    totalPaid += r.paid || 0;
  });
  const netDue = totalBilled - totalPaid;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white text-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200">
        {/* Top Control Bar */}
        <div className="no-print bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
            <BookMarked className="w-4 h-4 text-amber-600" />
            <span>Customer Due Ledger Statement Preview</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Area */}
        <div className="text-slate-900 bg-white overflow-y-auto flex-grow p-6 sm:p-8 space-y-4">
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
                  Customer Due Ledger Statement
                </p>
                <p className="text-[10px] text-slate-500">
                  Office: Bhai Bhai Super Market, 2nd Floor, Paduar Bazar, Cumilla • Mobile: 01904142370
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <h3 className="text-xl font-black text-amber-900 uppercase">LEDGER STATEMENT</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Period : <span className="font-bold text-slate-900">{month || (startDate && endDate ? `${startDate} to ${endDate}` : 'All Records')}</span>
              </p>
            </div>
          </div>

          {/* Customer / Consolidated Summary Card */}
          <div className="grid grid-cols-12 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs items-center">
            <div className="col-span-7 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {isSingle ? 'CUSTOMER INFORMATION' : 'CONSOLIDATED DUE SUMMARY'}
              </span>
              <div className="text-base font-black text-slate-900">
                {isSingle ? filterCustomer : 'All Active Due Customers'}
              </div>
              {isSingle && targetCust && (
                <>
                  <div className="text-slate-700">Address: <span className="font-bold">{targetCust.address}</span></div>
                  <div className="text-slate-700">Mobile: <span className="font-bold">{targetCust.phone}</span></div>
                </>
              )}
              {!isSingle && (
                <div className="text-slate-600 font-medium">
                  Total Due Accounts: <span className="font-bold text-blue-900">{customerSummaries.length} Customers</span>
                </div>
              )}
            </div>

            <div className="col-span-5 text-right space-y-1">
              <div className="text-xs font-semibold text-slate-600">
                Total Billed : <span className="font-black text-slate-900 font-tabular">৳ {formatCurrency(totalBilled)}</span>
              </div>
              <div className="text-xs font-semibold text-slate-600">
                Total Paid : <span className="font-black text-emerald-700 font-tabular">৳ {formatCurrency(totalPaid)}</span>
              </div>
              <div className="text-base font-black text-rose-700 pt-1.5 border-t-2 border-slate-300 flex justify-between items-center">
                <span>Net Due :</span>
                <span className="text-xl font-black text-rose-800 underline font-tabular">
                  ৳ {formatCurrency(netDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border border-slate-200 border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2 px-2 text-center w-10 border-r border-slate-200">SL</th>
                <th className="py-2 px-3 border-r border-slate-200 w-28">Date</th>
                {!isSingle && <th className="py-2 px-3 border-r border-slate-200">Customer Info</th>}
                <th className="py-2 px-3 border-r border-slate-200 text-center">Particulars</th>
                <th className="py-2 px-3 border-r border-slate-200">Description</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-24">Due (Dr)</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-24">Paid (Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold text-slate-500">
                    {i + 1}
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-800 whitespace-nowrap">
                    {formatDateDisplay(r.date)}
                  </td>
                  {!isSingle && (
                    <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                      <div>{r.customer}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{r.phone}</div>
                    </td>
                  )}
                  <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-amber-800 text-center whitespace-nowrap">
                    {r.id.startsWith('INV-') ? `#${r.id.replace('INV-', '')}` : r.type}
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700 text-xs">
                    {r.desc || '--'}
                  </td>
                  <td className="py-1.5 px-3 text-right border-r border-slate-200 text-rose-700 font-bold font-tabular">
                    {r.due > 0 ? `৳ ${formatCurrency(r.due)}` : '-'}
                  </td>
                  <td className="py-1.5 px-3 text-right text-emerald-700 font-bold font-tabular">
                    {r.paid > 0 ? `৳ ${formatCurrency(r.paid)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900 text-xs">
              <tr>
                <td colSpan={isSingle ? 4 : 5} className="py-2.5 px-3 text-right font-black">
                  Total:
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700 border-r border-slate-200 font-tabular">
                  ৳ {formatCurrency(totalBilled)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700 font-tabular">
                  ৳ {formatCurrency(totalPaid)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-10 pb-2 text-center text-xs text-slate-700">
            <div>
              <div className="border-t border-slate-400 w-40 pt-1 font-bold text-slate-800 text-[10px] uppercase">
                Customer Signature
              </div>
            </div>
            <div>
              <div className="border-t border-slate-800 w-48 pt-1 font-black text-slate-900 text-[10px] uppercase">
                For : AS Computer
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="print-doc-footer flex justify-between items-center pt-2 text-[10px] text-slate-600 border-t border-slate-300 font-medium">
            <div>
              Customer Due Ledger - Printed : {nowFormatted} • {currentUser}
            </div>
            <div className="font-bold text-slate-700">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};
