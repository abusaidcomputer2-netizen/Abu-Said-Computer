import React from 'react';
import { X, Printer, Boxes, Building2 } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, formatInvoicePrintTimestamp, normalizeCategory } from '../../utils/helpers';

interface StockPrintModalProps {
  products: Product[];
  currentUser: string;
  onClose: () => void;
}

export const StockPrintModal: React.FC<StockPrintModalProps> = ({ products, currentUser, onClose }) => {
  const nowFormatted = formatInvoicePrintTimestamp(new Date());

  const stationeryProducts = products.filter(
    p => normalizeCategory(p.category) === 'Stationery Products'
  );

  let totalUnits = 0;
  let totalValuation = 0;
  let lowStockCount = 0;

  stationeryProducts.forEach(p => {
    const q = p.stockQty || 0;
    const c = p.costPrice || 0;
    totalUnits += q;
    totalValuation += q * c;
    if (q <= (p.lowStockLimit || 5)) lowStockCount++;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white text-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200">
        <div className="no-print bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-emerald-600" />
            <span>Stationery Stock Inventory Report Preview</span>
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
                  Stationery Stock Inventory & Valuation Report
                </p>
                <p className="text-[10px] text-slate-500">
                  Office: Bhai Bhai Super Market, 2nd Floor, Paduar Bazar, Cumilla • Mobile: 01904142370
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <h3 className="text-xl font-black text-emerald-900 uppercase">STOCK REPORT</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">Stationery Products Only</p>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Items</span>
              <span className="text-sm font-black text-slate-900">{stationeryProducts.length} Items</span>
            </div>
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">In-Stock Units</span>
              <span className="text-sm font-black text-blue-700 font-tabular">{totalUnits} Units</span>
            </div>
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Cost Valuation</span>
              <span className="text-sm font-black text-emerald-700 font-tabular">৳ {formatCurrency(totalValuation)}</span>
            </div>
            <div className="bg-rose-50 py-1 rounded-xl border border-rose-200">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Low Stock</span>
              <span className="text-sm font-black text-rose-800">{lowStockCount} Items</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border border-slate-200 border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2 px-2 text-center w-10 border-r border-slate-200">SL</th>
                <th className="py-2 px-3 border-r border-slate-200">Product Name</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-24">Cost</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-24">Sale</th>
                <th className="py-2 px-2 text-center border-r border-slate-200 w-24">In Stock</th>
                <th className="py-2 px-3 text-right border-r border-slate-200 w-28">Valuation</th>
                <th className="py-2 px-2 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stationeryProducts.map((p, idx) => {
                const q = p.stockQty || 0;
                const c = p.costPrice || 0;
                const val = q * c;
                const isOut = q <= 0;
                const isLow = q <= (p.lowStockLimit || 5);

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-200 font-bold text-slate-900">{p.name}</td>
                    <td className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-700 font-tabular">
                      ৳ {formatCurrency(c)}
                    </td>
                    <td className="py-1.5 px-3 text-right border-r border-slate-200 text-slate-900 font-semibold font-tabular">
                      ৳ {formatCurrency(p.price)}
                    </td>
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-black text-blue-900 font-tabular">
                      {q}
                    </td>
                    <td className="py-1.5 px-3 text-right border-r border-slate-200 font-black text-emerald-900 font-tabular">
                      ৳ {formatCurrency(val)}
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold">
                      {isOut ? (
                        <span className="text-rose-700">Out of Stock</span>
                      ) : isLow ? (
                        <span className="text-amber-700">Low Stock</span>
                      ) : (
                        <span className="text-emerald-700">In Stock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900 text-xs">
              <tr>
                <td colSpan={4} className="py-2.5 px-3 text-right font-black">Grand Total:</td>
                <td className="py-2.5 px-2 text-center text-blue-900 border-r border-slate-200 font-tabular">
                  {totalUnits} Units
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-900 font-black font-tabular">
                  ৳ {formatCurrency(totalValuation)}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-500 font-bold">Active Inventory</td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-10 pb-2 text-center text-xs text-slate-700">
            <div>
              <div className="border-t border-slate-400 w-40 pt-1 font-bold text-slate-800 text-[10px] uppercase">
                Checked By
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
              Stationery Stock Report - Printed : {nowFormatted} • {currentUser}
            </div>
            <div className="font-bold text-slate-700">Page 1 of 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};
