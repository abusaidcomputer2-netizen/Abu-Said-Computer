import React from 'react';
import { X, Printer, Building2, CheckCircle2 } from 'lucide-react';
import { SaleRecord } from '../../types';
import { formatCurrency, formatDateDisplay, formatInvoicePrintTimestamp, generateBarcodeSvg, numberToWordsTaka } from '../../utils/helpers';

interface InvoiceModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const barcodeHtml = generateBarcodeSvg(`AS-${sale.invoiceNo}`);
  const printTimestamp = formatInvoicePrintTimestamp(new Date());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block">
      <div className="print-modal-dialog bg-white text-slate-800 w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-2 sm:my-4 border border-slate-200 print:w-full print:max-w-none print:shadow-none print:border-none print:m-0 print:rounded-none print:static">
        {/* Modal Top Bar (Hidden during printing) */}
        <div className="no-print bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs sm:text-sm font-black text-slate-800 uppercase flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Sales Invoice Preview</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Cash Memo Sheet */}
        <div className="print-page-container invoice-print-container p-6 sm:p-8 text-slate-900 bg-white print:p-0 print:shadow-none print:border-none">
          <div className="space-y-4">
            {/* Header Lockup - Colors matched to logo blue & navy */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0 bg-transparent">
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
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                    <span className="text-[#0062cc]">Abu Said</span> <span className="text-[#0f172a]">Computer</span>
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide mt-1">
                    Online Service & IT Point • Computer Training & Stationery
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                    Bhai Bhai Super Market (2nd Floor), Paduar Bazar, Cumilla-3500 • Mobile: 01904-142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h3 className="text-2xl sm:text-3xl font-black text-[#0062cc] leading-tight tracking-wide">
                  Invoice
                </h3>
                <p className="text-xs sm:text-sm font-bold mt-1 text-right text-slate-700">
                  <span className="text-slate-500 font-semibold">Date: </span>
                  <span className="font-black text-slate-900">{formatDateDisplay(sale.rawDate || sale.date)}</span>
                </p>
              </div>
            </div>

            {/* Customer & Invoice Meta Box */}
            <div className="grid grid-cols-12 gap-3 bg-slate-50 border border-slate-300 p-4 rounded-xl text-xs sm:text-sm items-center">
              <div className="col-span-7 space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  CUSTOMER INFORMATION:
                </span>
                <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {sale.customer || 'General Customer'}
                </div>
                <div className="text-slate-700 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="font-bold text-slate-600">Mobile:</span>
                  <span className="font-black text-slate-900 font-tabular text-sm">{sale.phone || '01904142370'}</span>
                </div>
                <div className="text-slate-700 font-medium text-xs sm:text-sm">
                  <span className="font-bold text-slate-600">Address:</span> {sale.address || 'Paduar Bazar, Cumilla'}
                </div>
              </div>

              <div className="col-span-5 flex flex-col items-end text-right space-y-1">
                <p className="text-sm font-bold leading-tight text-right">
                  <span className="text-slate-500 font-semibold">Invoice No: </span>
                  <span className="text-[#0062cc] font-black text-base sm:text-lg font-tabular ml-1">AS-{sale.invoiceNo}</span>
                </p>
                <p className="text-xs sm:text-sm font-medium leading-tight text-right">
                  <span className="text-slate-500 font-semibold">Sales by: </span>
                  <span className="text-slate-900 font-bold ml-1">{sale.user}</span>
                </p>
                <div
                  className="pt-1.5 flex items-center justify-end"
                  dangerouslySetInnerHTML={{ __html: barcodeHtml }}
                />
              </div>
            </div>

            {/* Memo Items Table - ONLY actual items, NO blank/empty rows */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300 text-xs sm:text-sm uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-14 border-r border-slate-300">SL</th>
                    <th className="py-3 px-4 border-r border-slate-300">Item Description / Service</th>
                    <th className="py-3 px-3 text-right w-24 sm:w-28 border-r border-slate-300">Rate</th>
                    <th className="py-3 px-3 text-center w-16 sm:w-20 border-r border-slate-300">Qty</th>
                    <th className="py-3 px-4 text-right w-28 sm:w-32">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-900 font-semibold">
                  {sale.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center border-r border-slate-200 font-bold text-slate-600 text-xs sm:text-sm">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 border-r border-slate-200 font-bold text-slate-900 text-sm">
                        {it.name}
                      </td>
                      <td className="py-3 px-3 text-right border-r border-slate-200 font-bold font-tabular text-slate-800 text-sm">
                        {formatCurrency(it.price)}
                      </td>
                      <td className="py-3 px-3 text-center border-r border-slate-200 font-black font-tabular text-slate-900 text-sm">
                        {it.qty}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-tabular text-slate-950 text-sm">
                        {formatCurrency(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 font-bold text-xs sm:text-sm">
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <td colSpan={4} className="py-2.5 px-4 text-right text-slate-700 font-bold sm:text-sm">
                      Subtotal:
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-950 font-tabular text-sm sm:text-base">
                      {formatCurrency(sale.subtotal)}
                    </td>
                  </tr>
                  {sale.discount > 0 && (
                    <tr className="border-b border-slate-200 text-red-600 bg-red-50/40">
                      <td colSpan={4} className="py-2 px-4 text-right font-bold sm:text-sm">
                        Discount:
                      </td>
                      <td className="py-2 px-4 text-right font-black font-tabular text-sm sm:text-base">
                        -{formatCurrency(sale.discount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-blue-50 text-slate-950 border-y-2 border-blue-600">
                    <td colSpan={4} className="py-3 px-4 text-right font-black text-sm sm:text-base uppercase tracking-wide">
                      Grand Total:
                    </td>
                    <td className="py-3 px-4 text-right font-black text-base sm:text-lg text-blue-900 font-tabular">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                  </tr>
                  {sale.due > 0 ? (
                    <>
                      <tr className="border-b border-slate-200 text-emerald-900 bg-emerald-50/40">
                        <td colSpan={4} className="py-2.5 px-4 text-right font-bold sm:text-sm">
                          Paid Amount:
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-emerald-900 font-tabular text-sm sm:text-base">
                          {formatCurrency(sale.paid)}
                        </td>
                      </tr>
                      <tr className="bg-rose-50 text-rose-950 border-b border-rose-300">
                        <td colSpan={4} className="py-2.5 px-4 text-right font-black text-sm sm:text-base">
                          Due Amount:
                        </td>
                        <td className="py-2.5 px-4 text-right font-black text-base sm:text-lg text-rose-700 font-tabular">
                          {formatCurrency(sale.due)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr className="bg-emerald-50/60 text-emerald-900 border-b border-slate-300">
                      <td colSpan={4} className="py-2 px-4 text-right font-bold text-xs sm:text-sm">
                        Payment Status:
                      </td>
                      <td className="py-2 px-4 text-right font-black text-xs sm:text-sm text-emerald-700 flex items-center justify-end gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Full Paid</span>
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* In Words Banner in English */}
            <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm">
              <span className="font-bold text-slate-600 uppercase text-[11px] tracking-wider">In Words: </span>
              <span className="font-bold text-slate-900">{numberToWordsTaka(sale.grandTotal)}</span>
            </div>

            {/* Signatures Area */}
            <div className="pt-10 pb-2 flex justify-between items-end text-center px-4">
              <div className="w-48 text-center">
                <div className="border-t-2 border-slate-700 pt-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Customer Signature
                </div>
              </div>

              <div className="w-48 text-center">
                <div className="border-t-2 border-slate-800 pt-1.5 font-black text-slate-900 text-xs uppercase tracking-wider">
                  Authorized Signature
                </div>
              </div>
            </div>

            {/* Correct & Complete Professional Shop Footer */}
            <div className="border-t-2 border-slate-300 pt-3 space-y-1 text-slate-700">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>ধন্যবাদ, আবার আসবেন! • Thank you for your business!</span>
                <span className="text-[11px] font-semibold text-slate-500">Abu Said Computer POS</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Bhai Bhai Super Market (2nd Floor), Paduar Bazar Bishwa Road, Cumilla-3500 • Mobile: 01904-142370, 01841-855200
              </div>
              <div className="flex justify-between items-center pt-1 text-[10px] text-slate-500 border-t border-slate-200 font-medium">
                <div>
                  Printed: {printTimestamp} • Served by: <strong className="text-slate-700">{sale.user}</strong>
                </div>
                <div className="font-bold text-slate-600 whitespace-nowrap">
                  Page 1 of 1
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
