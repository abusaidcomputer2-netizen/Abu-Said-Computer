import React, { useState } from 'react';
import { X, Printer, Receipt, Building2, Layers, List } from 'lucide-react';
import { ExpenseRecord } from '../../types';
import { formatCurrency, formatDateDisplay, formatInvoicePrintTimestamp } from '../../utils/helpers';
import { ReportFooter } from '../ReportFooter';

interface ExpensePrintModalProps {
  expenses: ExpenseRecord[];
  currentUser: string;
  onClose: () => void;
}

export const ExpensePrintModal: React.FC<ExpensePrintModalProps> = ({ expenses, currentUser, onClose }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const nowFormatted = formatInvoicePrintTimestamp(new Date());

  // Aggregate by category
  const catMap: Record<string, { category: string; count: number; amount: number }> = {};
  let totalAmount = 0;

  expenses.forEach(e => {
    const c = e.category || 'Others';
    if (!catMap[c]) catMap[c] = { category: c, count: 0, amount: 0 };
    catMap[c].count++;
    catMap[c].amount += e.amount || 0;
    totalAmount += e.amount || 0;
  });

  const categoriesSorted = Object.values(catMap).sort((a, b) => b.amount - a.amount);

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block">
      <div className="print-modal-dialog bg-white text-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 print:w-full print:max-w-none print:max-h-none print:shadow-none print:border-none print:m-0 print:rounded-none print:static">
        {/* Control Bar */}
        <div className="no-print bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2 flex-shrink-0">
          <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Official Expense Sheet Preview</span>
          </span>

          <div className="flex items-center gap-2">
            <div className="bg-slate-200 p-0.5 rounded-xl flex items-center text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'summary' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Category Summary
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'detailed' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Detailed List
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
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
        <div className="print-page-container text-slate-900 bg-white overflow-y-auto flex-grow p-6 sm:p-8 flex flex-col justify-between min-h-[270mm] print:min-h-[270mm] print:p-0 print:shadow-none print:border-none">
          <div className="print-content-body space-y-4 flex-grow">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
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
                    Official Operating Expense Statement
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Office: Bhai Bhai Super Market, 2nd Floor, Paduar Bazar, Cumilla • Mobile: 01904142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h3 className="text-xl font-black text-rose-900 uppercase">EXPENSE STATEMENT</h3>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Format : <span className="font-bold text-slate-900">{viewMode === 'summary' ? 'Category Summary' : 'Detailed List'}</span>
                </p>
              </div>
            </div>

          {viewMode === 'summary' ? (
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-2 text-center w-12 border-r border-slate-200">SL</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Expense Category</th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-200 w-32">Total Entries</th>
                  <th className="py-2.5 px-3 text-right w-36">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {categoriesSorted.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-center border-r border-slate-200 font-bold text-slate-500 font-tabular">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 print:py-2 print:px-3 border-r border-slate-200 font-bold text-slate-900">
                      {c.category}
                    </td>
                    <td className="py-2.5 px-3 print:py-2 print:px-2 text-center border-r border-slate-200 text-blue-700 font-bold">
                      {c.count} Entries
                    </td>
                    <td className="py-2.5 px-3.5 print:py-2 print:px-3 text-right font-black text-rose-700 font-tabular text-sm">
                      Tk {formatCurrency(c.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-rose-50 font-black text-rose-900 text-xs">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-right font-black text-slate-800">
                    Grand Total:
                  </td>
                  <td className="py-2 px-2 text-center text-blue-900 border-r border-slate-200">
                    {expenses.length} Entries
                  </td>
                  <td className="py-2.5 px-3 text-right text-base text-rose-900 font-black font-tabular">
                    Tk {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-200">SL</th>
                  <th className="py-2 px-3 border-r border-slate-200 w-28">Date</th>
                  <th className="py-2 px-3 border-r border-slate-200">Category</th>
                  <th className="py-2 px-3 border-r border-slate-200">Description</th>
                  <th className="py-2 px-3 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 print:py-2 print:px-2.5 text-center border-r border-slate-200 font-bold text-slate-500 font-tabular">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 print:py-2 print:px-3 border-r border-slate-200 font-semibold text-slate-800 whitespace-nowrap">
                      {formatDateDisplay(e.date)}
                    </td>
                    <td className="py-2.5 px-3.5 print:py-2 print:px-3 border-r border-slate-200 font-bold text-rose-800">
                      {e.category}
                    </td>
                    <td className="py-2.5 px-3.5 print:py-2 print:px-3 border-r border-slate-200 text-slate-700 text-xs">
                      {e.desc || '--'}
                    </td>
                    <td className="py-2.5 px-3.5 print:py-2 print:px-3 text-right font-black text-rose-700 font-tabular">
                      {e.amount > 0 ? `Tk ${formatCurrency(e.amount)}` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-rose-50 font-black text-rose-900 text-sm">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right font-black text-slate-800">
                    Total Operating Expenses:
                  </td>
                  <td className="py-2.5 px-3 text-right text-base text-rose-900 font-black font-tabular">
                    Tk {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Unified Report Footer matching exact user sample as direct child of print container */}
        <ReportFooter
          reportTitle="Operating Expenses Statement"
          printTimestamp={nowFormatted}
          currentUser={currentUser}
          leftSignatureLabel="APPROVED BY"
          rightSignatureLabel="AUTHORIZED SIGNATURE"
        />
        </div>
      </div>
    </div>
  );
};
