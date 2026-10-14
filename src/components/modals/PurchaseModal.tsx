import React, { useState } from 'react';
import { X, ShoppingCart, Plus, Trash2, Check, Copy } from 'lucide-react';
import { Product, PurchaseRecord } from '../../types';
import { formatCurrency, formatDateDisplay, normalizeCategory } from '../../utils/helpers';

interface PurchaseModalProps {
  purchases: PurchaseRecord[];
  products: Product[];
  currentUser: string;
  isAdmin: boolean;
  onClose: () => void;
  onOpenPaperUsage: () => void;
  onSubmitPurchase: (data: any) => Promise<void>;
  onDeletePurchase: (id: number) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  purchases,
  products,
  currentUser,
  isAdmin,
  onClose,
  onOpenPaperUsage,
  onSubmitPurchase,
  onDeletePurchase,
  showToast
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<Array<{
    product: string;
    customProduct: string;
    qty: number;
    unitCost: number;
    totalCost: number;
  }>>([
    {
      product: '',
      customProduct: '',
      qty: 1,
      unitCost: 0,
      totalCost: 0
    }
  ]);

  const stationeryProducts = products.filter(
    p => normalizeCategory(p.category) === 'Stationery Products'
  );

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { product: '', customProduct: '', qty: 1, unitCost: 0, totalCost: 0 }
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) {
      showToast('At least one item is required!', 'warning');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemProduct = (idx: number, pName: string) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx].product = pName;
      if (pName !== '__custom__') {
        const prod = stationeryProducts.find(p => p.name === pName);
        if (prod && prod.costPrice > 0) {
          copy[idx].unitCost = prod.costPrice;
          copy[idx].totalCost = Math.round(prod.costPrice * copy[idx].qty);
        }
      }
      return copy;
    });
  };

  const updateItemQty = (idx: number, qty: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx].qty = Math.max(1, qty);
      copy[idx].totalCost = Math.round(copy[idx].unitCost * Math.max(1, qty));
      return copy;
    });
  };

  const updateItemCost = (idx: number, cost: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx].unitCost = cost;
      copy[idx].totalCost = Math.round(cost * copy[idx].qty);
      return copy;
    });
  };

  const grandTotalCost = items.reduce((sum, it) => sum + (it.totalCost || 0), 0);
  const totalUnits = items.reduce((sum, it) => sum + (it.qty || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedItems = [];
    for (const it of items) {
      const finalName = it.product === '__custom__' ? it.customProduct.trim() : it.product.trim();
      if (!finalName) {
        showToast('Please select or specify all product names!', 'warning');
        return;
      }
      formattedItems.push({
        product: finalName,
        category: 'Stationery Products',
        qty: it.qty,
        unitCost: it.unitCost,
        totalCost: it.totalCost
      });
    }

    setIsSubmitting(true);
    try {
      await onSubmitPurchase({
        items: formattedItems,
        supplier: supplier.trim(),
        notes: notes.trim(),
        date,
        user: currentUser
      });
      showToast('Purchases saved and stock updated!', 'success');
      setSupplier('');
      setNotes('');
      setItems([{ product: '', customProduct: '', qty: 1, unitCost: 0, totalCost: 0 }]);
    } catch (err: any) {
      showToast(err.message || 'Purchase error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/40 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span>Product Purchase Register & Khata</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPaperUsage}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-200" />
              <span>Photocopy Paper Usage</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Purchase History Log Table */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recent Purchases Log ({purchases.length} Entries)
            </h4>
          </div>
          <div className="max-h-52 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3 text-center w-12">SL</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Cost</th>
                  <th className="p-3 text-right">Total Cost</th>
                  <th className="p-3">Supplier & Remarks</th>
                  {isAdmin && <th className="p-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="py-6 text-center text-slate-500 font-medium">
                      No purchase records found.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{formatDateDisplay(p.date)}</td>
                      <td className="p-3 font-bold text-white">{p.product}</td>
                      <td className="p-3 text-center font-black text-blue-300 font-tabular">{p.qty}</td>
                      <td className="p-3 text-right text-slate-400 font-tabular">৳ {formatCurrency(p.unitCost)}</td>
                      <td className="p-3 text-right font-black text-emerald-400 font-tabular">৳ {formatCurrency(p.totalCost)}</td>
                      <td className="p-3 text-xs text-slate-400">
                        {p.supplier && <span className="text-amber-300 font-bold mr-1">{p.supplier}</span>}
                        {p.notes}
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => onDeletePurchase(p.rowId)}
                            className="p-1 text-rose-400 hover:text-rose-300 transition"
                            title="Delete Purchase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Multi-Item Purchase Entry Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> New Product Purchase Voucher
            </h4>
            <span className="text-[10px] text-slate-400">
              * Automatically updates stock and logs consolidated expense
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Purchase Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-semibold focus:outline-none"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Supplier / Shop / Memo No</label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="e.g. Dhaka Paper House / Memo #123"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Remarks / Note</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Monthly stock replenishment"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Dynamic Rows */}
          <div className="border border-slate-800 bg-slate-900/60 p-3 sm:p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4" /> Purchased Products List
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 font-bold"
              >
                <Plus className="w-4 h-4" /> Add More Product
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-950 border border-slate-700/60 rounded-xl items-center"
                >
                  <div className="sm:col-span-5 space-y-1">
                    <select
                      value={it.product}
                      onChange={e => updateItemProduct(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Stationery Product...</option>
                      {stationeryProducts.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} [Stock: {p.stockQty || 0}, Cost: ৳{p.costPrice}]
                        </option>
                      ))}
                      <option value="__custom__">✍️ Custom Stationery Product...</option>
                    </select>

                    {it.product === '__custom__' && (
                      <input
                        type="text"
                        value={it.customProduct}
                        onChange={e => {
                          const copy = [...items];
                          copy[idx].customProduct = e.target.value;
                          setItems(copy);
                        }}
                        placeholder="Type product name..."
                        className="w-full bg-slate-900 border border-emerald-500/60 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={it.qty || ''}
                      onChange={e => updateItemQty(idx, parseFloat(e.target.value) || 1)}
                      placeholder="Qty"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center text-white font-black font-tabular"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={it.unitCost || ''}
                      onChange={e => updateItemCost(idx, parseFloat(e.target.value) || 0)}
                      placeholder="Unit Cost"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right text-white font-black font-tabular"
                    />
                  </div>

                  <div className="sm:col-span-2 text-right">
                    <span className="font-black text-emerald-400 text-xs sm:text-sm font-tabular">
                      ৳ {formatCurrency(it.totalCost)}
                    </span>
                  </div>

                  <div className="sm:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Total Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-emerald-500/40 p-3.5 rounded-2xl gap-3">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
              <span>Items: <span className="text-white font-black">{items.length}</span></span>
              <span>Units: <span className="text-blue-400 font-black">{totalUnits}</span></span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Grand Total Cost:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-tabular">
                  ৳ {formatCurrency(grandTotalCost)}
                </span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm transition shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Save Purchases & Increase Stock
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
