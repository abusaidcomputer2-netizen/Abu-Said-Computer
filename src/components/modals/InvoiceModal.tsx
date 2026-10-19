import React from 'react';
import { X, Printer, Building2 } from 'lucide-react';
import { SaleRecord } from '../../types';
import { formatCurrency, formatDateDisplay, formatInvoicePrintTimestamp, generateBarcodeSvg } from '../../utils/helpers';

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
      <div className="print-modal-dialog bg-white text-slate-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-2 sm:my-4 border border-slate-200 print:w-full print:max-w-none print:shadow-none print:border-none print:m-0 print:rounded-none print:static">
        {/* Modal Top Bar (Hidden during printing) */}
        <div className="no-print bg-slate-50 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Sales Invoice Preview</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
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

        {/* Printable Invoice Container */}
        <div className="print-page-container invoice-print-container p-4 sm:p-6 text-slate-900 bg-white print:p-0 print:shadow-none print:border-none">
          <div className="print-content-body space-y-2.5">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-2">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 bg-transparent">
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
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                    <span className="text-amber-500">Abu Said</span> Computer
                  </h2>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-700 tracking-wide mt-0.5">
                    Online Service & IT Point
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Paduar Bazar, Cumilla • Mobile: 01904142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h3 className="text-lg sm:text-xl font-black text-teal-800 leading-tight tracking-normal">
                  INVOICE
                </h3>
                <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                  Date : <span className="font-black text-slate-900">{formatDateDisplay(sale.rawDate || sale.date)}</span>
                </p>
              </div>
            </div>

            {/* Customer & Invoice Metadata Box */}
            <div className="grid grid-cols-12 gap-2 bg-slate-50 border border-slate-200 p-2 sm:p-2.5 rounded-xl text-xs items-center">
              <div className="col-span-7 space-y-0.5">
                <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">
                  Customer Info:
                </span>
                <div className="text-xs sm:text-sm font-black text-slate-900">{sale.customer || 'General Customer'}</div>
                <div className="text-slate-700 font-semibold text-[10.5px]">
                  Mobile: <span className="font-bold">{sale.phone || '01904142370'}</span>
                </div>
                <div className="text-slate-600 font-medium text-[10.5px]">
                  Address: <span>{sale.address || 'Paduar Bazar, Cumilla'}</span>
                </div>
              </div>

              <div className="col-span-5 flex flex-col items-end text-right space-y-0.5">
                <p className="text-xs font-bold leading-tight">
                  Invoice No : <span className="text-red-600 font-black">AS-{sale.invoiceNo}</span>
                </p>
                <p className="text-xs font-bold leading-tight">
                  Seller : <span className="text-blue-600 font-black">{sale.user}</span>
                </p>
                <div
                  className="pt-0.5 flex items-center justify-end"
                  dangerouslySetInnerHTML={{ __html: barcodeHtml }}
                />
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200 text-[11px]">
                  <th className="py-1 px-2 text-center w-8 border-r border-slate-200">SL</th>
                  <th className="py-1 px-2.5 border-r border-slate-200">Item Description / Service</th>
                  <th className="py-1 px-2.5 text-right w-20 border-r border-slate-200">Rate</th>
                  <th className="py-1 px-2 text-center w-14 border-r border-slate-200">Qty</th>
                  <th className="py-1 px-2.5 text-right w-24">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium text-[11px]">
                {sale.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1 px-2 text-center border-r border-slate-200 font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-2.5 border-r border-slate-200 font-bold">{it.name}</td>
                    <td className="py-1 px-2.5 text-right border-r border-slate-200 font-tabular">
                      {formatCurrency(it.price)}
                    </td>
                    <td className="py-1 px-2 text-center border-r border-slate-200 font-bold font-tabular">
                      {it.qty}
                    </td>
                    <td className="py-1 px-2.5 text-right font-black font-tabular">
                      ৳ {formatCurrency(it.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-xs border-t-2 border-slate-300 text-[11px]">
                <tr className="border-b border-slate-200">
                  <td colSpan={4} className="py-1 px-2.5 text-right font-bold text-slate-700">
                    Subtotal:
                  </td>
                  <td className="py-1 px-2.5 text-right font-black text-slate-900 font-tabular">
                    ৳ {formatCurrency(sale.subtotal)}
                  </td>
                </tr>
                {sale.discount > 0 && (
                  <tr className="border-b border-slate-200 text-red-600">
                    <td colSpan={4} className="py-0.5 px-2.5 text-right font-bold">
                      Discount:
                    </td>
                    <td className="py-0.5 px-2.5 text-right font-black font-tabular">
                      -৳ {formatCurrency(sale.discount)}
                    </td>
                  </tr>
                )}
                <tr className="bg-teal-50 text-teal-900 border-b border-slate-300">
                  <td colSpan={4} className="py-1 px-2.5 text-right font-black text-xs">
                    Grand Total:
                  </td>
                  <td className="py-1 px-2.5 text-right font-black text-sm text-teal-900 font-tabular">
                    ৳ {formatCurrency(sale.grandTotal)}
                  </td>
                </tr>
                {sale.due > 0 && (
                  <>
                    <tr className="border-b border-slate-200 text-emerald-800">
                      <td colSpan={4} className="py-0.5 px-2.5 text-right font-bold">
                        Paid Amount:
                      </td>
                      <td className="py-0.5 px-2.5 text-right font-black text-emerald-700 font-tabular">
                        ৳ {formatCurrency(sale.paid)}
                      </td>
                    </tr>
                    <tr className="bg-rose-50 border-b border-slate-300 text-rose-800">
                      <td colSpan={4} className="py-1 px-2.5 text-right font-black">
                        Due Amount:
                      </td>
                      <td className="py-1 px-2.5 text-right font-black text-xs text-rose-700 font-tabular">
                        ৳ {formatCurrency(sale.due)}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>

            {/* Company Official Details */}
            <div className="pt-1 text-[10px] text-slate-600 leading-tight border-t border-slate-200">
              <p className="font-black text-slate-900 uppercase text-[10.5px]">ABU SAID COMPUTER</p>
              <p>Office: Bhai Bhai Super Market (2nd Floor), Paduar Bazar, Cumilla-3500</p>
              <p>
                Mobile: <span className="font-bold text-slate-900">+88 01904 142370</span> | Email: abusaidcomputer2@gmail.com
              </p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end pt-4 pb-0.5 text-center text-xs text-slate-700">
              <div>
                <div className="border-t border-dotted border-slate-400 w-36 sm:w-44 pt-1 font-bold text-slate-800 text-[9.5px] uppercase tracking-wider">
                  CUSTOMER SIGNATURE
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 w-40 sm:w-48 pt-1 font-bold text-slate-900 text-[9.5px] uppercase tracking-wider">
                  AUTHORIZED SIGNATURE
                </div>
              </div>
            </div>
          </div>

          {/* Print Document Footer */}
          <div className="print-doc-footer flex justify-between items-center pt-1.5 mt-2 text-[10px] text-slate-600 border-t border-slate-300 font-medium">
            <div>
              Sales Invoice • Printed: {printTimestamp} • Operator: <span className="font-bold text-slate-800">{sale.user}</span>
            </div>
            <div className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-[9.5px]">
              Page 1 of 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
