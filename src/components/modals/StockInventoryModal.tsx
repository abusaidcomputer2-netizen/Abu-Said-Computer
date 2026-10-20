import React, { useState } from 'react';
import { X, Boxes, Printer, ShoppingCart, Copy, Search } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, normalizeCategory } from '../../utils/helpers';

interface StockInventoryModalProps {
  products: Product[];
  onClose: () => void;
  onOpenStockPrint: () => void;
  onOpenPurchase: () => void;
  onOpenPaperUsage: () => void;
}

export const StockInventoryModal: React.FC<StockInventoryModalProps> = ({
  products,
  onClose,
  onOpenStockPrint,
  onOpenPurchase,
  onOpenPaperUsage
}) => {
  const [search, setSearch] = useState('');

  const stationeryProducts = products.filter(
    p => normalizeCategory(p.category) === 'Stationery Products'
  );

  const filtered = stationeryProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  let totalStockUnits = 0;
  let totalStockValue = 0;
  let lowStockCount = 0;

  stationeryProducts.forEach(p => {
    const qty = p.stockQty || 0;
    const cost = p.costPrice || 0;
    totalStockUnits += qty;
    totalStockValue += qty * cost;
    if (qty <= (p.lowStockLimit || 5)) lowStockCount++;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/40 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <span>Stationery Stock Inventory & Valuation</span>
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenStockPrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Stock Print</span>
            </button>
            <button
              type="button"
              onClick={onOpenPurchase}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ New Purchase</span>
            </button>
            <button
              type="button"
              onClick={onOpenPaperUsage}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Paper Usage</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Tracked Items</span>
            <div className="text-lg sm:text-xl font-black text-white">{stationeryProducts.length} Items</div>
          </div>
          <div className="bg-slate-950 border border-blue-500/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-400 uppercase block">In-Stock Quantity</span>
            <div className="text-lg sm:text-xl font-black text-blue-400 font-tabular">{totalStockUnits} Units</div>
          </div>
          <div className="bg-slate-950 border border-emerald-500/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Stock Cost Valuation</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-tabular">
              Tk {formatCurrency(totalStockValue)}
            </div>
          </div>
          <div className="bg-slate-950 border border-rose-500/30 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-rose-400 uppercase block">Low Stock Warnings</span>
            <div className="text-lg sm:text-xl font-black text-rose-400">{lowStockCount} Items</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center gap-2">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product name..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold">
            Stationery Products Only
          </span>
        </div>

        {/* Table */}
        <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
              <tr>
                <th className="p-3 text-center w-12">SL</th>
                <th className="p-3">Product Name</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">In Stock</th>
                <th className="p-3 text-right">Valuation</th>
                <th className="p-3 text-center">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const qty = p.stockQty || 0;
                  const cost = p.costPrice || 0;
                  const limit = p.lowStockLimit || 5;
                  const val = qty * cost;

                  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                  let badgeText = `${qty} In Stock`;

                  if (qty <= 0) {
                    badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold';
                    badgeText = 'Out of Stock (0)';
                  } else if (qty <= limit) {
                    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold';
                    badgeText = `Low Stock (${qty})`;
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 text-center font-bold text-amber-400">{p.sl}</td>
                      <td className="p-3 font-bold text-white">{p.name}</td>
                      <td className="p-3 text-right text-slate-400 font-tabular">Tk {formatCurrency(cost)}</td>
                      <td className="p-3 text-right font-black text-emerald-400 font-tabular">
                        Tk {formatCurrency(p.price)}
                      </td>
                      <td className="p-3 text-center font-bold text-blue-300 font-tabular">{qty}</td>
                      <td className="p-3 text-right font-black text-white font-tabular">
                        Tk {formatCurrency(val)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
