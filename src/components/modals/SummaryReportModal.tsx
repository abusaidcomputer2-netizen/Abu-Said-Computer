import React from 'react';
import { X, Printer, Building2 } from 'lucide-react';
import { SaleRecord } from '../../types';
import { formatCurrency, formatDateDisplay, formatInvoicePrintTimestamp } from '../../utils/helpers';
import { ReportFooter } from '../ReportFooter';

interface SummaryReportModalProps {
  sales: SaleRecord[];
  startDate: string;
  endDate: string;
  month: string;
  staff: string;
  currentUser: string;
  onClose: () => void;
}

export const SummaryReportModal: React.FC<SummaryReportModalProps> = ({
  sales,
  startDate,
  endDate,
  month,
  staff,
  currentUser,
  onClose
}) => {
  const nowFormatted = formatInvoicePrintTimestamp(new Date());

  const handlePrint = () => {
    window.print();
  };

  // Group by date
  const dateGroups: Record<string, {
    date: string;
    memoCount: number;
    photocopy: number;
    online: number;
    stationery: number;
    discount: number;
    due: number;
    grandTotal: number;
  }> = {};

  let sumPhotocopy = 0;
  let sumOnline = 0;
  let sumStationery = 0;
  let sumDiscount = 0;
  let sumDue = 0;
  let sumGrand = 0;

  sales.forEach(s => {
    const d = s.rawDate || s.date;
    if (!dateGroups[d]) {
      dateGroups[d] = {
        date: d,
        memoCount: 0,
        photocopy: 0,
        online: 0,
        stationery: 0,
        discount: 0,
        due: 0,
        grandTotal: 0
      };
    }

    dateGroups[d].memoCount++;
    dateGroups[d].discount += s.discount || 0;
    dateGroups[d].due += s.due || 0;
    dateGroups[d].grandTotal += s.grandTotal;

    sumDiscount += s.discount || 0;
    sumDue += s.due || 0;
    sumGrand += s.grandTotal;

    const ratio = s.subtotal > 0 ? s.grandTotal / s.subtotal : 1.0;
    if (s.items && s.items.length > 0) {
      s.items.forEach(it => {
        const cat = (it.category || s.category).toLowerCase();
        const lineTotal = (it.total || 0) * ratio;
        if (cat.includes('photocopy')) {
          dateGroups[d].photocopy += lineTotal;
          sumPhotocopy += lineTotal;
        } else if (cat.includes('stationery')) {
          dateGroups[d].stationery += lineTotal;
          sumStationery += lineTotal;
        } else {
          dateGroups[d].online += lineTotal;
          sumOnline += lineTotal;
        }
      });
    } else {
      const cat = s.category.toLowerCase();
      if (cat.includes('photocopy')) {
        dateGroups[d].photocopy += s.grandTotal;
        sumPhotocopy += s.grandTotal;
      } else if (cat.includes('stationery')) {
        dateGroups[d].stationery += s.grandTotal;
        sumStationery += s.grandTotal;
      } else {
        dateGroups[d].online += s.grandTotal;
        sumOnline += s.grandTotal;
      }
    }
  });

  const datesSorted = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
  const periodLabel = month || (startDate && endDate ? `${startDate} to ${endDate}` : 'All Records');

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block">
      <div className="print-modal-dialog bg-white text-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 print:w-full print:max-w-none print:max-h-none print:shadow-none print:border-none print:m-0 print:rounded-none print:static">
        {/* Top Control Bar */}
        <div className="no-print bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Sales & Due Summary Report Preview</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
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

        {/* Printable Area */}
        <div className="print-page-container text-slate-900 bg-white overflow-y-auto flex-grow p-6 sm:p-8 flex flex-col justify-between print:min-h-0 print:p-0 print:shadow-none print:border-none">
          <div className="print-content-body space-y-4">
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
                    Sales & Due Summary Report
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Office: Bhai Bhai Super Market, 2nd Floor, Paduar Bazar, Cumilla • Mobile: 01904142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h3 className="text-xl font-black text-blue-900 uppercase">SALES REPORT</h3>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Period : <span className="font-bold text-slate-900">{periodLabel}</span>
                </p>
                {staff && staff !== 'ALL' && (
                  <p className="text-xs text-blue-800 font-bold">Staff : {staff}</p>
                )}
              </div>
            </div>

          {/* KPI Cards Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Photocopy</span>
              <span className="text-sm font-black text-blue-700 font-tabular">
                Tk {formatCurrency(sumPhotocopy)}
              </span>
            </div>
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Online Application</span>
              <span className="text-sm font-black text-emerald-700 font-tabular">
                Tk {formatCurrency(sumOnline)}
              </span>
            </div>
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Stationery</span>
              <span className="text-sm font-black text-amber-700 font-tabular">
                Tk {formatCurrency(sumStationery)}
              </span>
            </div>
            <div className="bg-blue-50 py-1 rounded-xl border border-blue-200">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">Total Net Sales</span>
              <span className="text-sm sm:text-base font-black text-blue-950 font-tabular">
                Tk {formatCurrency(sumGrand)}
              </span>
            </div>
          </div>

          {/* Date-Wise Breakdown Table */}
          <table className="w-full text-left text-xs border border-slate-200 border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2 px-2 text-center w-10 border-r border-slate-200">SL</th>
                <th className="py-2 px-3 border-r border-slate-200">Date</th>
                <th className="py-2 px-2 border-r border-slate-200 text-center">Memos</th>
                <th className="py-2 px-2 border-r border-slate-200 text-right">Photocopy</th>
                <th className="py-2 px-2 border-r border-slate-200 text-right">Online</th>
                <th className="py-2 px-2 border-r border-slate-200 text-right">Stationery</th>
                <th className="py-2 px-2 text-right border-r border-slate-200">Disc</th>
                <th className="py-2 px-2 text-right border-r border-slate-200 text-rose-700">Due</th>
                <th className="py-2 px-3 text-right">Net Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {datesSorted.map((dStr, idx) => {
                const g = dateGroups[dStr];
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-800 whitespace-nowrap">
                      {formatDateDisplay(g.date)}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-200 text-center font-bold text-blue-700">
                      {g.memoCount} Memos
                    </td>
                    <td className="py-1.5 px-2 text-right border-r border-slate-200 font-tabular">
                      {g.photocopy > 0 ? formatCurrency(g.photocopy) : '-'}
                    </td>
                    <td className="py-1.5 px-2 text-right border-r border-slate-200 font-tabular">
                      {g.online > 0 ? formatCurrency(g.online) : '-'}
                    </td>
                    <td className="py-1.5 px-2 text-right border-r border-slate-200 font-tabular">
                      {g.stationery > 0 ? formatCurrency(g.stationery) : '-'}
                    </td>
                    <td className="py-1.5 px-2 text-right border-r border-slate-200 text-red-600 font-tabular">
                      {g.discount > 0 ? `-${formatCurrency(g.discount)}` : '-'}
                    </td>
                    <td className="py-1.5 px-2 text-right border-r border-slate-200 text-rose-700 font-bold font-tabular">
                      {g.due > 0 ? formatCurrency(g.due) : '-'}
                    </td>
                    <td className="py-1.5 px-3 text-right font-black text-blue-900 font-tabular">
                      Tk {formatCurrency(g.grandTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900 text-xs">
              <tr>
                <td colSpan={3} className="py-2.5 px-3 text-right font-black">
                  Grand Total:
                </td>
                <td className="py-2.5 px-2 text-right text-blue-700 border-r border-slate-200 font-tabular">
                  {formatCurrency(sumPhotocopy)}
                </td>
                <td className="py-2.5 px-2 text-right text-emerald-700 border-r border-slate-200 font-tabular">
                  {formatCurrency(sumOnline)}
                </td>
                <td className="py-2.5 px-2 text-right text-amber-700 border-r border-slate-200 font-tabular">
                  {formatCurrency(sumStationery)}
                </td>
                <td className="py-2.5 px-2 text-right text-red-600 border-r border-slate-200 font-tabular">
                  -{formatCurrency(sumDiscount)}
                </td>
                <td className="py-2.5 px-2 text-right text-rose-700 border-r border-slate-200 font-tabular">
                  {formatCurrency(sumDue)}
                </td>
                <td className="py-2.5 px-3 text-right text-blue-900 font-black text-sm font-tabular">
                  Tk {formatCurrency(sumGrand)}
                </td>
              </tr>
            </tfoot>
          </table>

            {/* Unified Report Footer matching exact user sample */}
            <ReportFooter
              reportTitle="Sales & Due Summary Report"
              printTimestamp={nowFormatted}
              currentUser={currentUser}
              leftSignatureLabel="PREPARED BY"
              rightSignatureLabel="AUTHORIZED SIGNATURE"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
