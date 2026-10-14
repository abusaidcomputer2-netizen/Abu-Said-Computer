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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white text-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200">
        {/* Modal Top Bar (Hidden during printing) */}
        <div className="no-print bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
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
        <div className="p-6 sm:p-8 space-y-4 text-slate-900 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 p-2 flex items-center justify-center text-amber-400 border border-slate-700">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  <span className="text-amber-500">AS</span> Computer
                </h2>
                <p className="text-xs font-bold text-slate-700 tracking-wide mt-1">
                  Online Service & IT Point
                </p>
                <p className="text-[10px] text-slate-500">
                  Paduar Bazar, Cumilla • Mobile: 01904142370
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <h3 className="text-2xl font-black text-teal-800 leading-tight tracking-normal">
                INVOICE
              </h3>
              <p className="text-[11px] text-slate-600 font-bold mt-1">
                Date : <span className="font-black text-slate-900">{formatDateDisplay(sale.rawDate || sale.date)}</span>
              </p>
            </div>
          </div>

          {/* Customer & Invoice Metadata Box */}
          <div className="grid grid-cols-12 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs items-center">
            <div className="col-span-7 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Customer Info:
              </span>
              <div className="text-sm font-black text-slate-900">{sale.customer || 'New Customer'}</div>
              <div className="text-slate-700 font-semibold">
                Mobile: <span className="font-bold">{sale.phone || '01904142370'}</span>
              </div>
              <div className="text-slate-600 font-medium">
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
                className="pt-1 flex items-center justify-end"
                dangerouslySetInnerHTML={{ __html: barcodeHtml }}
              />
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                <th className="py-2 px-2 text-center w-10 border-r border-slate-200">SL</th>
                <th className="py-2 px-2.5 border-r border-slate-200">Item Description / Service</th>
                <th className="py-2 px-3 text-right w-24 border-r border-slate-200">Rate</th>
                <th className="py-2 px-2 text-center w-16 border-r border-slate-200">Qty</th>
                <th className="py-2 px-3 text-right w-28">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {sale.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">{it.name}</td>
                  <td className="py-1.5 px-3 text-right border-r border-slate-200 font-tabular">
                    {formatCurrency(it.price)}
                  </td>
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold font-tabular">
                    {it.qty}
                  </td>
                  <td className="py-1.5 px-3 text-right font-black font-tabular">
                    ৳ {formatCurrency(it.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="text-xs border-t-2 border-slate-300">
              <tr className="border-b border-slate-200">
                <td colSpan={4} className="py-2 px-3 text-right font-bold text-slate-700">
                  Subtotal:
                </td>
                <td className="py-2 px-3 text-right font-black text-slate-900 font-tabular">
                  ৳ {formatCurrency(sale.subtotal)}
                </td>
              </tr>
              {sale.discount > 0 && (
                <tr className="border-b border-slate-200 text-red-600">
                  <td colSpan={4} className="py-1.5 px-3 text-right font-bold">
                    Discount:
                  </td>
                  <td className="py-1.5 px-3 text-right font-black font-tabular">
                    -৳ {formatCurrency(sale.discount)}
                  </td>
                </tr>
              )}
              <tr className="bg-teal-50 text-teal-900 border-b border-slate-300">
                <td colSpan={4} className="py-2.5 px-3 text-right font-black text-sm">
                  Grand Total:
                </td>
                <td className="py-2.5 px-3 text-right font-black text-base text-teal-900 font-tabular">
                  ৳ {formatCurrency(sale.grandTotal)}
                </td>
              </tr>
              {sale.due > 0 && (
                <>
                  <tr className="border-b border-slate-200 text-emerald-800">
                    <td colSpan={4} className="py-1.5 px-3 text-right font-bold">
                      Paid Amount:
                    </td>
                    <td className="py-1.5 px-3 text-right font-black text-emerald-700 font-tabular">
                      ৳ {formatCurrency(sale.paid)}
                    </td>
                  </tr>
                  <tr className="bg-rose-50 border-b border-slate-300 text-rose-800">
                    <td colSpan={4} className="py-2 px-3 text-right font-black">
                      Due Amount:
                    </td>
                    <td className="py-2 px-3 text-right font-black text-sm text-rose-700 font-tabular">
                      ৳ {formatCurrency(sale.due)}
                    </td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>

          {/* Company Official Details */}
          <div className="pt-2 text-[11px] text-slate-600 leading-normal border-t border-slate-200">
            <p className="font-black text-slate-900 uppercase text-xs">ABU SAID COMPUTER</p>
            <p>Office: Bhai Bhai Super Market (2nd Floor), Paduar Bazar, Cumilla-3500</p>
            <p>
              Mobile: <span className="font-bold text-slate-900">+88 01904 142370</span> | Email: abusaidcomputer2@gmail.com
            </p>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-8 pb-3 text-center text-xs text-slate-700">
            <div>
              <div className="border-t border-dotted border-slate-400 w-44 pt-1 font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                CUSTOMER SIGNATURE
              </div>
            </div>
            <div>
              <div className="border-t border-slate-800 w-48 pt-1 font-bold text-slate-900 text-[10px] uppercase tracking-wider">
                AUTHORIZED SIGNATURE
              </div>
            </div>
          </div>

          {/* Print Document Footer */}
          <div className="print-doc-footer flex justify-between items-center pt-2 text-[10.5px] text-slate-600 border-t border-slate-300 font-medium">
            <div>
              Sales Invoice - Printed : {printTimestamp} • {sale.user}
            </div>
            <div className="font-bold text-slate-700">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};
