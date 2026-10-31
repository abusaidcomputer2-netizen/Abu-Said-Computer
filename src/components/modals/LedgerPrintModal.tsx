import React, { useState } from 'react';
import { X, Printer, BookMarked } from 'lucide-react';
import { CustomerDueSummary, DueRecord } from '../../types';
import { formatCurrency, formatDateDisplay, formatInvoicePrintTimestamp } from '../../utils/helpers';
import { ReportFooter } from '../ReportFooter';

interface LedgerPrintModalProps {
  records: DueRecord[];
  customerSummaries: CustomerDueSummary[];
  filterCustomer?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  currentUser: string;
  onClose: () => void;
}

export const LedgerPrintModal: React.FC<LedgerPrintModalProps> = ({
  records,
  customerSummaries,
  filterCustomer = 'ALL',
  startDate = '',
  endDate = '',
  month = '',
  currentUser,
  onClose
}) => {
  const selectedCust = filterCustomer || 'ALL';
  const nowFormatted = formatInvoicePrintTimestamp(new Date());

  const handlePrint = () => {
    window.print();
  };

  // Determine single customer vs all
  const isSingle = Boolean(selectedCust && selectedCust !== 'ALL');
  
  // Find customer details from summaries or records
  const targetCust = isSingle
    ? (() => {
        const fromSummary = customerSummaries.find(
          c => c.name.trim().toLowerCase() === selectedCust.trim().toLowerCase()
        );
        const fromRecord = records.find(
          r => r.customer.trim().toLowerCase() === selectedCust.trim().toLowerCase()
        );
        return {
          name: fromSummary?.name || fromRecord?.customer || selectedCust,
          phone: fromSummary?.phone || fromRecord?.phone || '--',
          address: fromSummary?.address || fromRecord?.address || 'Paduar Bazar, Cumilla',
        };
      })()
    : null;

  const filteredRecords = records.filter(r => {
    if (isSingle && r.customer.trim().toLowerCase() !== selectedCust.trim().toLowerCase()) return false;
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

  const periodLabel = month || (startDate && endDate ? `${startDate} to ${endDate}` : 'All Records');

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block">
      <div className="print-modal-dialog bg-white text-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 print:w-full print:max-w-none print:max-h-none print:shadow-none print:border-none print:m-0 print:rounded-none print:static">
        {/* Top Control Bar (Clean preview header without customer select dropdown) */}
        <div className="no-print bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-amber-600" />
              <span>Customer Due Statement Preview</span>
            </span>
            {isSingle && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {selectedCust}
              </span>
            )}
          </div>

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
        <div className="print-page-container text-slate-900 bg-white overflow-y-auto flex-grow p-6 sm:p-8 flex flex-col justify-between min-h-[270mm] print:min-h-[270mm] print:p-0 print:shadow-none print:border-none">
          <div className="print-content-body space-y-4 flex-grow">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-2">
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
                    {isSingle ? 'Customer Due Ledger Statement' : 'Consolidated Customer Due Statement'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Office: Bhai Bhai Super Market, 2nd Floor, Paduar Bazar, Cumilla • Mobile: 01904142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h3 className="text-xl font-black text-amber-900 uppercase">
                  {isSingle ? 'CUSTOMER DUE STATEMENT' : 'LEDGER STATEMENT'}
                </h3>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Period : <span className="font-bold text-slate-900">{periodLabel}</span>
                </p>
              </div>
            </div>

            {/* Customer / Consolidated Summary Card */}
            {isSingle && targetCust ? (
              <div className="grid grid-cols-12 gap-4 bg-slate-50 border-2 border-slate-300 p-4 rounded-2xl text-xs items-center shadow-sm">
                <div className="col-span-7 space-y-1">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                    CUSTOMER INFORMATION
                  </span>
                  <div className="text-xl font-black text-slate-900 tracking-tight">
                    {targetCust.name}
                  </div>
                  <div className="text-xs text-slate-700 flex flex-col gap-0.5 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-500">Mobile:</span>
                      <span className="font-bold text-slate-900 font-tabular">{targetCust.phone}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-slate-500">Address:</span>
                      <span className="font-semibold text-slate-800">{targetCust.address}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-5 bg-white p-3 rounded-xl border border-slate-200 text-right space-y-1 shadow-sm">
                  <div className="text-xs font-semibold text-slate-600 flex justify-between">
                    <span>Total Due Billed (Dr):</span>
                    <span className="font-black text-slate-900 font-tabular">Tk {formatCurrency(totalBilled)}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 flex justify-between">
                    <span>Total Paid (Cr):</span>
                    <span className="font-black text-emerald-700 font-tabular">Tk {formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="text-sm font-black text-rose-700 pt-1.5 border-t border-slate-200 flex justify-between items-center">
                    <span>Net Outstanding:</span>
                    <span className="text-lg font-black text-rose-800 font-tabular underline">
                      Tk {formatCurrency(netDue)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs items-center">
                <div className="col-span-7 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    CONSOLIDATED DUE SUMMARY
                  </span>
                  <div className="text-base font-black text-slate-900">
                    All Active Due Customers
                  </div>
                  <div className="text-slate-600 font-medium">
                    Total Due Accounts: <span className="font-bold text-blue-900">{customerSummaries.length} Customers</span>
                  </div>
                </div>

                <div className="col-span-5 text-right space-y-1">
                  <div className="text-xs font-semibold text-slate-600 flex justify-between">
                    <span>Total Billed:</span>
                    <span className="font-black text-slate-900 font-tabular">Tk {formatCurrency(totalBilled)}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-black text-emerald-700 font-tabular">Tk {formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="text-base font-black text-rose-700 pt-1.5 border-t-2 border-slate-300 flex justify-between items-center">
                    <span>Net Due:</span>
                    <span className="text-xl font-black text-rose-800 underline font-tabular">
                      Tk {formatCurrency(netDue)}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={isSingle ? 6 : 7} className="py-8 text-center text-slate-500 font-medium">
                      No transactions found for this customer and period.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-center border-r border-slate-200 font-bold text-slate-500 font-tabular">
                        {i + 1}
                      </td>
                      <td className="py-2.5 px-3.5 print:py-2 print:px-3 border-r border-slate-200 font-semibold text-slate-800 whitespace-nowrap">
                        {formatDateDisplay(r.date)}
                      </td>
                      {!isSingle && (
                        <td className="py-2.5 px-3.5 print:py-2 print:px-3 border-r border-slate-200 font-bold text-slate-900">
                          <div>{r.customer}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{r.phone}</div>
                        </td>
                      )}
                      <td className="py-2.5 px-3.5 print:py-2 print:px-3 border-r border-slate-200 font-bold text-amber-800 text-center whitespace-nowrap">
                        {r.id.startsWith('INV-') ? `#${r.id.replace('INV-', '')}` : r.type}
                      </td>
                      <td className="py-2.5 px-3.5 print:py-2 print:px-3 border-r border-slate-200 text-slate-700 text-xs">
                        {r.desc || '--'}
                      </td>
                      <td className="py-2.5 px-3.5 print:py-2 print:px-3 text-right border-r border-slate-200 text-rose-700 font-bold font-tabular">
                        {r.due > 0 ? `Tk ${formatCurrency(r.due)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3.5 print:py-2 print:px-3 text-right text-emerald-700 font-bold font-tabular">
                        {r.paid > 0 ? `Tk ${formatCurrency(r.paid)}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900 text-xs">
                <tr>
                  <td colSpan={isSingle ? 4 : 5} className="py-2.5 px-3 text-right font-black">
                    Total:
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-700 border-r border-slate-200 font-tabular">
                    Tk {formatCurrency(totalBilled)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 font-tabular">
                    Tk {formatCurrency(totalPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Unified Report Footer matching exact user sample as direct child of print container */}
          <ReportFooter
            reportTitle="Customer Due Ledger Statement"
            printTimestamp={nowFormatted}
            currentUser={currentUser}
            leftSignatureLabel="CUSTOMER SIGNATURE"
            rightSignatureLabel="AUTHORIZED SIGNATURE"
          />
        </div>
      </div>
    </div>
  );
};
