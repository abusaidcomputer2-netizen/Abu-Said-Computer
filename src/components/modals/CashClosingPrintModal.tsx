import React from 'react';
import { X, Printer, Coins, Building2 } from 'lucide-react';
import { CashClosingRecord } from '../../types';
import { formatCurrency, formatDateDisplay, formatInvoicePrintTimestamp } from '../../utils/helpers';

interface CashClosingPrintModalProps {
  cashClosing: CashClosingRecord | null;
  currentUser: string;
  onClose: () => void;
}

export const CashClosingPrintModal: React.FC<CashClosingPrintModalProps> = ({
  cashClosing,
  currentUser,
  onClose
}) => {
  if (!cashClosing) return null;

  const nowFormatted = formatInvoicePrintTimestamp(new Date());
  const den = cashClosing.denominations || {};

  const denomList = [
    { label: '1000 Taka Notes', count: den.n1000 || 0, val: 1000 },
    { label: '500 Taka Notes', count: den.n500 || 0, val: 500 },
    { label: '200 Taka Notes', count: den.n200 || 0, val: 200 },
    { label: '100 Taka Notes', count: den.n100 || 0, val: 100 },
    { label: '50 Taka Notes', count: den.n50 || 0, val: 50 },
    { label: '20 Taka Notes', count: den.n20 || 0, val: 20 },
    { label: '10 Taka Notes', count: den.n10 || 0, val: 10 },
    { label: '5 Taka Notes / Coins', count: den.n5 || 0, val: 5 }
  ];

  const statusText =
    cashClosing.difference === 0
      ? 'CASH BALANCED (MATCHED)'
      : cashClosing.difference < 0
      ? `CASH SHORT: ৳ ${formatCurrency(Math.abs(cashClosing.difference))}`
      : `CASH EXCESS: ৳ ${formatCurrency(cashClosing.difference)}`;

  const statusColor =
    cashClosing.difference === 0
      ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
      : cashClosing.difference < 0
      ? 'text-rose-800 bg-rose-50 border-rose-300'
      : 'text-amber-800 bg-amber-50 border-amber-300';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block">
      <div className="bg-white text-slate-800 w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 print:w-full print:max-w-none print:max-h-none print:shadow-none print:border-none print:m-0 print:rounded-none print:static">
        {/* Top Control Bar */}
        <div className="no-print bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>Cash Closing Slip Preview</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Print / PDF</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="print-page-container text-slate-900 bg-white overflow-y-auto flex-grow p-6 sm:p-8 flex flex-col justify-between print:min-h-0 print:p-0 print:shadow-none print:border-none">
          <div className="print-content-body space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 bg-transparent">
                  <img 
                    src="/logo.png" 
                    alt="AS Computer" 
                    className="w-full h-full object-contain filter-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1OXthEw7eAn6SkWLFzlW9G8MItn3ARvFM";
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                    <span className="text-amber-500">AS</span> Computer
                  </h2>
                  <p className="text-xs font-bold text-slate-700 tracking-wide mt-1">
                    Daily Cash Closing & Drawer Reconciliation Slip
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Office: Bhai Bhai Super Market, 2nd Floor, Paduar Bazar, Cumilla • Mobile: 01904142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h3 className="text-xl font-black text-emerald-900 uppercase">CASH CLOSING</h3>
                <p className="text-xs text-slate-800 font-bold mt-1">
                  Date : <span className="font-black text-slate-900">{formatDateDisplay(cashClosing.date)}</span>
                </p>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  Cashier : <span className="font-bold text-slate-900">{cashClosing.user || currentUser}</span>
                </p>
              </div>
            </div>

          {/* Status Banner */}
          <div className={`p-3 rounded-2xl border text-center ${statusColor}`}>
            <span className="text-base font-black tracking-wide">{statusText}</span>
          </div>

          {/* 2 Column Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left: System Inflow & Outflow */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1.5">
                1. System Cash Drawer Statement
              </h4>
              <table className="w-full text-left text-xs border border-slate-200 bg-white">
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">Opening Balance (Yesterday):</td>
                    <td className="py-2 px-3 text-right font-black text-slate-900 font-tabular">
                      ৳ {formatCurrency(cashClosing.openingCash)}
                    </td>
                  </tr>
                  {cashClosing.prevShortageDeducted > 0 && (
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-200 text-rose-700 font-bold">
                        (-) Prev Day Shortage Deducted:
                      </td>
                      <td className="py-2 px-3 text-right font-black text-rose-700 font-tabular">
                        -৳ {formatCurrency(cashClosing.prevShortageDeducted)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">(+) Sales Cash Received:</td>
                    <td className="py-2 px-3 text-right font-black text-emerald-700 font-tabular">
                      ৳ {formatCurrency(cashClosing.salesInflow)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">(+) Due Collected Today:</td>
                    <td className="py-2 px-3 text-right font-black text-emerald-700 font-tabular">
                      ৳ {formatCurrency(cashClosing.dueInflow)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50">
                    <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-emerald-950">
                      Total Cash Inflow:
                    </td>
                    <td className="py-1.5 px-3 text-right font-black text-emerald-900 font-tabular">
                      ৳ {formatCurrency(cashClosing.totalInflow)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                      (-) Cash Outflows (Expenses & Purchases):
                    </td>
                    <td className="py-2 px-3 text-right font-black text-rose-700 font-tabular">
                      -৳ {formatCurrency(cashClosing.expenseOutflow)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-blue-50 font-black text-xs">
                  <tr>
                    <td className="py-2.5 px-3 text-blue-950 text-sm">Expected Drawer Cash:</td>
                    <td className="py-2.5 px-3 text-right text-base text-blue-950 font-black font-tabular">
                      ৳ {formatCurrency(cashClosing.expectedCash)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Right: Denominations */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-300 pb-1.5">
                2. Physical Cash Denominations
              </h4>
              <table className="w-full text-left text-xs border border-slate-200 bg-white">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-3 border-r border-slate-200">Notes / Coins</th>
                    <th className="py-1.5 px-2 text-center border-r border-slate-200 w-16">Count</th>
                    <th className="py-1.5 px-3 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {denomList.map((d, i) => (
                    <tr key={i}>
                      <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-800">{d.label}</td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold text-blue-900 font-tabular">
                        {d.count > 0 ? d.count : '-'}
                      </td>
                      <td className="py-1.5 px-3 text-right font-black text-slate-900 font-tabular">
                        ৳ {formatCurrency(d.count * d.val)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-800">
                      2 / 1 Taka Coins & Change
                    </td>
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold text-slate-500">
                      Coins
                    </td>
                    <td className="py-1.5 px-3 text-right font-black text-slate-900 font-tabular">
                      ৳ {formatCurrency(den.coins || 0)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-emerald-50 font-black text-xs">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-emerald-950 text-sm">
                      Actual Physical Cash:
                    </td>
                    <td className="py-2.5 px-3 text-right text-base text-emerald-900 font-black font-tabular">
                      ৳ {formatCurrency(cashClosing.actualCash)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Final Reconciliation Summary Bar */}
          <div className="bg-slate-100 border border-slate-300 p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold">
            <div>
              Expected Cash : <span className="text-slate-900 font-black text-sm font-tabular">৳ {formatCurrency(cashClosing.expectedCash)}</span>
            </div>
            <div>
              Actual Cash : <span className="text-emerald-800 font-black text-sm font-tabular">৳ {formatCurrency(cashClosing.actualCash)}</span>
            </div>
            <div>
              Difference :{' '}
              <span
                className={`font-black text-base font-tabular ${
                  cashClosing.difference === 0
                    ? 'text-emerald-700'
                    : cashClosing.difference < 0
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}
              >
                {cashClosing.difference === 0 ? '৳ 0' : cashClosing.difference < 0 ? `-৳ ${formatCurrency(Math.abs(cashClosing.difference))}` : `+৳ ${formatCurrency(cashClosing.difference)}`}
              </span>
            </div>
          </div>

          {cashClosing.notes && (
            <div className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium">
              <span className="font-bold text-slate-700">Remarks / Notes:</span> {cashClosing.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between items-end pt-10 pb-2 text-center text-xs text-slate-700">
            <div>
              <div className="border-t border-slate-400 w-44 pt-1 font-bold text-slate-800 text-[10px] uppercase">
                Cashier / Staff Signature
              </div>
            </div>
            <div>
              <div className="border-t border-slate-400 w-48 pt-1 font-black text-slate-900 text-[10px] uppercase">
                Proprietor / Authorized Signature
              </div>
            </div>
          </div>
        </div>

          {/* Footer */}
          <div className="print-doc-footer flex justify-between items-center pt-2 text-[10px] text-slate-600 border-t border-slate-300 font-medium mt-auto">
            <div>
              Daily Cash Closing Slip - Printed : {nowFormatted} • {currentUser}
            </div>
            <div className="font-bold text-slate-700">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};
