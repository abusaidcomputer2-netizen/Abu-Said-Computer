import React, { useState } from 'react';
import { X, Tags, Plus, Edit3, Trash2, Check } from 'lucide-react';
import { Product, Category } from '../../types';
import { formatCurrency, normalizeCategory } from '../../utils/helpers';

interface ProductModalProps {
  products: Product[];
  onClose: () => void;
  onSubmitProduct: (data: any) => Promise<void>;
  onDeleteProduct: (id: number | string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  products,
  onClose,
  onSubmitProduct,
  onDeleteProduct,
  showToast
}) => {
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [sl, setSl] = useState<number>(1);
  const [category, setCategory] = useState<Category>('Photocopy');
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSellingPrice('');
    setCostPrice('');
    setStockQty('');
    setLowStockLimit('5');
    suggestSl(category);
  };

  const suggestSl = (cat: Category) => {
    const catProds = products.filter(p => normalizeCategory(p.category) === cat);
    const max = catProds.reduce((m, p) => Math.max(m, p.sl || 0), 0);
    setSl(max + 1);
  };

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    suggestSl(cat);
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setSl(p.sl);
    setCategory(p.category);
    setName(p.name);
    setSellingPrice(String(p.price));
    setCostPrice(String(p.costPrice));
    setStockQty(p.stockQty !== null && p.stockQty !== undefined ? String(p.stockQty) : '');
    setLowStockLimit(String(p.lowStockLimit || 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Product name is required!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitProduct({
        id: editingId,
        sl,
        category,
        name: name.trim(),
        price: parseFloat(sellingPrice) || 0,
        costPrice: parseFloat(costPrice) || 0,
        stockQty: stockQty !== '' ? parseFloat(stockQty) : null,
        lowStockLimit: parseFloat(lowStockLimit) || 5
      });
      setFilterCat(category);
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (!editingId) {
      suggestSl(category);
    }
  }, [category, products, editingId]);

  const filteredProducts = products.filter(p => {
    if (filterCat !== 'ALL' && normalizeCategory(p.category) !== filterCat) return false;
    return true;
  });

  const countPhotocopy = products.filter(p => normalizeCategory(p.category) === 'Photocopy').length;
  const countOnline = products.filter(p => normalizeCategory(p.category) === 'Online Application').length;
  const countStationery = products.filter(p => normalizeCategory(p.category) === 'Stationery Products').length;

  return (
    <div className="no-print print:hidden fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/30 text-slate-100 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tags className="w-4 h-4" />
            </div>
            <span>Product & Service Database</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inventory List with Filter */}
        <div className="space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Product Master Catalog ({filteredProducts.length} Items)
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Category:</span>
              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none"
              >
                <option value="ALL">All Categories ({products.length})</option>
                <option value="Photocopy">Photocopy ({countPhotocopy})</option>
                <option value="Online Application">Online Application ({countOnline})</option>
                <option value="Stationery Products">Stationery Products ({countStationery})</option>
              </select>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3 text-center w-12">SL</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-right">Cost Price</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 font-medium">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 text-center font-bold text-amber-400">{p.sl}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white text-xs sm:text-sm">{p.name}</td>
                      <td className="p-3 text-right text-slate-400 font-tabular">Tk {formatCurrency(p.costPrice)}</td>
                      <td className="p-3 text-right font-black text-emerald-400 font-tabular">
                        Tk {formatCurrency(p.price)}
                      </td>
                      <td className="p-3 text-center font-bold text-blue-300 font-tabular">
                        {p.stockQty !== null && p.stockQty !== undefined ? p.stockQty : '∞'}
                      </td>
                      <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEdit(p)}
                          className="p-1 text-amber-400 hover:text-amber-300"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Edit Product / Service' : 'Add New Product / Service'}</span>
            </h4>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-600"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-amber-400 mb-1">SL No *</label>
              <input
                type="number"
                min="1"
                required
                value={sl}
                onChange={e => setSl(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-sm text-amber-300 text-center font-black focus:outline-none font-tabular"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Category *</label>
              <select
                required
                value={category}
                onChange={e => handleCategoryChange(e.target.value as Category)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="Photocopy">Photocopy</option>
                <option value="Online Application">Online Application</option>
                <option value="Stationery Products">Stationery Products</option>
              </select>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Product / Service Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. A4 Color Print / Paper Ream"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Cost Price (Tk )</label>
              <input
                type="number"
                step="any"
                min="0"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white text-right font-black focus:outline-none font-tabular"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-emerald-400 mb-1">Selling Price (Tk ) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl px-3.5 py-2 text-sm text-emerald-400 text-right font-black focus:outline-none font-tabular"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-blue-400 mb-1">Initial Stock Qty</label>
              <input
                type="number"
                step="any"
                min="0"
                value={stockQty}
                onChange={e => setStockQty(e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white text-center font-bold focus:outline-none font-tabular"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-rose-400 mb-1">Low Stock Limit</label>
              <input
                type="number"
                step="any"
                min="1"
                value={lowStockLimit}
                onChange={e => setLowStockLimit(e.target.value)}
                placeholder="5"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white text-center font-bold focus:outline-none font-tabular"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{editingId ? 'Update Product' : '+ Save Product'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
