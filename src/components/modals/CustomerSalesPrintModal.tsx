import React, { useState } from 'react';
import { X, Printer, TrendingUp, Building2, Users, FileText } from 'lucide-react';
import { SaleRecord, Customer } from '../../types';
import { formatCurrency, formatDateDisplay, formatInvoicePrintTimestamp, resolveCustomerAddress } from '../../utils/helpers';

interface CustomerSalesPrintModalProps {
  sales: SaleRecord[];
  customers: Customer[];
  startDate: string;
  endDate: string;
  currentUser: string;
  onClose: () => void;
}

export const CustomerSalesPrintModal: React.FC<CustomerSalesPrintModalProps> = ({
  sales,
  customers,
  startDate,
  endDate,
  currentUser,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const nowFormatted = formatInvoicePrintTimestamp(new Date());

  // Aggregate by customer
  const custMap: Record<string, {
    name: string;
    phone: string;
    address: string;
    memoCount: number;
    totalPurchased: number;
    totalPaid: number;
    totalDue: number;
  }> = {};

  let totalSales = 0;
  let totalPaid = 0;
  let totalDue = 0;

  sales.forEach(s => {
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
        totalDue: 0
      };
    }
    custMap[name].memoCount++;
    custMap[name].totalPurchased += s.grandTotal || 0;
    custMap[name].totalPaid += s.paid || 0;
    custMap[name].totalDue += s.due || 0;

    totalSales += s.grandTotal || 0;
    totalPaid += s.paid || 0;
    totalDue += s.due || 0;
  });

  const summaries = Object.values(custMap).sort((a, b) => b.totalPurchased - a.totalPurchased);
  const periodLabel = startDate && endDate ? `${startDate} to ${endDate}` : 'All Time Records';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white text-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200">
        {/* Top Control Bar */}
        <div className="no-print bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2 flex-shrink-0">
          <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <span>Customer Sales Statement Preview</span>
          </span>

          <div className="flex items-center gap-2">
            <div className="bg-slate-200 p-0.5 rounded-xl flex items-center text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'summary' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Customer Summary
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'detailed' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Detailed Memos
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Print / PDF</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Area */}
        <div className="print-page-container text-slate-900 bg-white overflow-y-auto flex-grow p-6 sm:p-8 flex flex-col justify-between min-h-[620px]">
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
                    Customer Sales Record & Purchase History
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Office: Bhai Bhai Super Market, 2nd Floor, Paduar Bazar, Cumilla • Mobile: 01904142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <h3 className="text-xl font-black text-cyan-900 uppercase">SALES STATEMENT</h3>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Period : <span className="font-bold text-slate-900">{periodLabel}</span>
                </p>
              </div>
            </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Customers</span>
              <span className="text-sm font-black text-slate-900">{summaries.length}</span>
            </div>
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">Total Memos</span>
              <span className="text-sm font-black text-blue-700 font-tabular">{sales.length} Memos</span>
            </div>
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Sales</span>
              <span className="text-sm font-black text-emerald-700 font-tabular">৳ {formatCurrency(totalSales)}</span>
            </div>
            <div className="bg-amber-50 py-1 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-900 uppercase block">Paid / Due</span>
              <span className="text-xs font-black text-slate-900 font-tabular">
                ৳ {formatCurrency(totalPaid)} / <span className="text-rose-700">৳ {formatCurrency(totalDue)}</span>
              </span>
            </div>
          </div>

          {viewMode === 'summary' ? (
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-2 text-center w-10 border-r border-slate-200">SL</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Customer Name & Contact</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Address</th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-200 w-24">Memos</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-200 w-28">Purchased</th>
                  <th className="py-2.5 px-2.5 text-right border-r border-slate-200 w-24">Paid</th>
                  <th className="py-2.5 px-2.5 text-right w-24 text-rose-700">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {summaries.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-500">Mobile: {c.phone}</div>
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-slate-600">{c.address}</td>
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-black text-blue-900 font-tabular">
                      {c.memoCount}
                    </td>
                    <td className="py-1.5 px-3 text-right border-r border-slate-200 font-black text-emerald-900 font-tabular">
                      ৳ {formatCurrency(c.totalPurchased)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-medium text-slate-800 font-tabular">
                      ৳ {formatCurrency(c.totalPaid)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-black text-rose-700 font-tabular">
                      {c.totalDue > 0 ? `৳ ${formatCurrency(c.totalDue)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900 text-xs">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right font-black">Grand Total:</td>
                  <td className="py-2.5 px-2 text-center text-blue-900 border-r border-slate-200 font-tabular">
                    {sales.length} Memos
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-900 font-black font-tabular">
                    ৳ {formatCurrency(totalSales)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-slate-800 font-bold border-r border-slate-200 font-tabular">
                    ৳ {formatCurrency(totalPaid)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-rose-800 font-black font-tabular">
                    ৳ {formatCurrency(totalDue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-2 text-center w-10 border-r border-slate-200">SL</th>
                  <th className="py-2 px-2.5 border-r border-slate-200 text-center w-24">Memo No</th>
                  <th className="py-2 px-3 border-r border-slate-200 w-24">Date</th>
                  <th className="py-2 px-3 border-r border-slate-200">Customer Info</th>
                  <th className="py-2 px-3 border-r border-slate-200">Service / Items</th>
                  <th className="py-2 px-3 text-right border-r border-slate-200 w-24">Grand Total</th>
                  <th className="py-2 px-2.5 text-right border-r border-slate-200 w-20">Paid</th>
                  <th className="py-2 px-2.5 text-right w-20 text-rose-700">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sales.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-center font-black text-slate-900">
                      #{s.invoiceNo}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-800 whitespace-nowrap">
                      {formatDateDisplay(s.rawDate || s.date)}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{s.customer}</div>
                      <div className="text-[10px] text-slate-500">{s.phone}</div>
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700">{s.desc || s.category}</td>
                    <td className="py-1.5 px-3 text-right border-r border-slate-200 font-black text-emerald-900 font-tabular">
                      ৳ {formatCurrency(s.grandTotal)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-medium text-slate-800 font-tabular">
                      ৳ {formatCurrency(s.paid)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-black text-rose-700 font-tabular">
                      {s.due > 0 ? `৳ ${formatCurrency(s.due)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900 text-xs">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right font-black">Grand Total:</td>
                  <td className="py-2.5 px-3 text-right text-emerald-900 font-black text-sm font-tabular">
                    ৳ {formatCurrency(totalSales)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-slate-800 font-bold border-r border-slate-200 font-tabular">
                    ৳ {formatCurrency(totalPaid)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-rose-800 font-black font-tabular">
                    ৳ {formatCurrency(totalDue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Signatures */}
          <div className="flex justify-between items-end pt-10 pb-2 text-center text-xs text-slate-700">
            <div>
              <div className="border-t border-slate-400 w-40 pt-1 font-bold text-slate-800 text-[10px] uppercase">
                Prepared By
              </div>
            </div>
            <div>
              <div className="border-t border-slate-800 w-48 pt-1 font-black text-slate-900 text-[10px] uppercase">
                For : AS Computer
              </div>
            </div>
          </div>
        </div>

          {/* Footer */}
          <div className="print-doc-footer flex justify-between items-center pt-2 text-[10px] text-slate-600 border-t border-slate-300 font-medium mt-auto">
            <div>
              Customer Sales Statement - Printed : {nowFormatted} • {currentUser}
            </div>
            <div className="font-bold text-slate-700">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};
