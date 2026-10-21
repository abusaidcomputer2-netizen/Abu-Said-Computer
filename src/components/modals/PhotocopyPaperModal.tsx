import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, normalizeCategory } from '../../utils/helpers';

interface PhotocopyPaperModalProps {
  products: Product[];
  currentUser: string;
  onClose: () => void;
  onSubmitPaperUsage: (data: any) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const PhotocopyPaperModal: React.FC<PhotocopyPaperModalProps> = ({
  products,
  currentUser,
  onClose,
  onSubmitPaperUsage,
  showToast
}) => {
  const [productName, setProductName] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Paper usage for shop photocopy machine');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter paper stationery items
  const paperProducts = products.filter(
    p => normalizeCategory(p.category) === 'Stationery Products'
  );

  const selectedProd = paperProducts.find(p => p.name === productName);
  const currentStock = selectedProd?.stockQty !== null && selectedProd?.stockQty !== undefined ? selectedProd.stockQty : 0;

  const handleProductChange = (name: string) => {
    setProductName(name);
    const p = paperProducts.find(x => x.name === name);
    if (p && p.costPrice > 0) {
      setUnitCost(p.costPrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName) {
      showToast('Please select paper product!', 'warning');
      return;
    }
    if (qty <= 0) {
      showToast('Quantity must be at least 1!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitPaperUsage({
        productName,
        qty,
        unitCost: 0,
        totalCost: 0,
        date,
        notes,
        user: currentUser
      });
      showToast(`Recorded ${qty} reams/units paper usage and deducted from stock inventory!`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error recording paper usage', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-blue-500/40 text-slate-100 w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <span>Photocopy Paper Usage</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl text-xs text-blue-200">
          Deducts paper stock from Stationery Inventory and logs it in the Operating Expense history as internal consumption without charging any monetary cash expense.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              Select Paper Product *
            </label>
            <select
              required
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Paper Product...</option>
              {paperProducts.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name} (Available Stock: {p.stockQty || 0} Reams/Pcs)
                </option>
              ))}
            </select>
            {productName && (
              <div className="text-[11px] text-amber-400 font-bold mt-1">
                Current Available Stock: {currentStock} Reams/Pcs
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              Quantity Used (Reams/Pcs) *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={qty || ''}
              onChange={e => setQty(parseFloat(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white text-center font-black focus:outline-none font-tabular"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Remarks / Note</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Record Paper Usage & Deduct Stock</span>
          </button>
        </form>
      </div>
    </div>
  );
};
