import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, X, Check, ShoppingBag } from 'lucide-react';
import { Customer, Product, SaleItem, SaleRecord, Category } from '../types';
import { formatCurrency, normalizeCategory } from '../utils/helpers';

interface MemoEntryFormProps {
  products: Product[];
  customers: Customer[];
  currentUser: string;
  editingSale: SaleRecord | null;
  onCancelEdit: () => void;
  onSubmitSale: (saleData: any) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MemoEntryForm: React.FC<MemoEntryFormProps> = ({
  products,
  customers,
  currentUser,
  editingSale,
  onCancelEdit,
  onSubmitSale,
  showToast
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('Paduar Bazar, Cumilla');
  const [workDesc, setWorkDesc] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [paid, setPaid] = useState<string>('');
  const [isPaidAuto, setIsPaidAuto] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [items, setItems] = useState<Array<{
    category: Category;
    name: string;
    customName: string;
    price: number;
    costPrice: number;
    qty: number;
    total: number;
    stockAvailable: number;
  }>>([
    {
      category: 'Photocopy',
      name: '',
      customName: '',
      price: 0,
      costPrice: 0,
      qty: 1,
      total: 0,
      stockAvailable: 999999
    }
  ]);

  // When editing sale changes
  useEffect(() => {
    if (editingSale) {
      setCustomerName(editingSale.customer);
      setCustomerPhone(editingSale.phone);
      setCustomerAddress(editingSale.address || 'Paduar Bazar, Cumilla');
      setWorkDesc(editingSale.desc || '');
      setDiscount(editingSale.discount || 0);
      setPaid(String(editingSale.paid));
      setIsPaidAuto(false);

      if (editingSale.items && editingSale.items.length > 0) {
        setItems(
          editingSale.items.map(it => {
            const cat = normalizeCategory(it.category);
            const matched = products.find(p => p.name.toLowerCase() === it.name.toLowerCase());
            return {
              category: cat,
              name: it.name,
              customName: '',
              price: it.price,
              costPrice: it.costPrice || matched?.costPrice || 0,
              qty: it.qty,
              total: it.total,
              stockAvailable: matched?.stockQty !== null && matched?.stockQty !== undefined ? matched.stockQty : 999999
            };
          })
        );
      }
    } else {
      resetForm();
    }
  }, [editingSale]);

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('Paduar Bazar, Cumilla');
    setWorkDesc('');
    setDiscount(0);
    setPaid('');
    setIsPaidAuto(true);
    setItems([
      {
        category: 'Photocopy',
        name: '',
        customName: '',
        price: 0,
        costPrice: 0,
        qty: 1,
        total: 0,
        stockAvailable: 999999
      }
    ]);
  };

  const handleCustomerSelect = (name: string) => {
    setCustomerName(name);
    const found = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (found) {
      if (found.phone) setCustomerPhone(found.phone);
      if (found.address) setCustomerAddress(found.address);
    }
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        category: 'Photocopy',
        name: '',
        customName: '',
        price: 0,
        costPrice: 0,
        qty: 1,
        total: 0,
        stockAvailable: 999999
      }
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) {
      showToast('At least one item is required!', 'warning');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemCategory = (idx: number, category: Category) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx].category = category;
      copy[idx].name = '';
      copy[idx].customName = '';
      copy[idx].price = 0;
      copy[idx].costPrice = 0;
      copy[idx].total = 0;
      copy[idx].stockAvailable = 999999;
      return copy;
    });
  };

  const updateItemProduct = (idx: number, prodName: string) => {
    setItems(prev => {
      const copy = [...prev];
      const item = copy[idx];

      if (prodName === '__custom__') {
        item.name = '__custom__';
        item.price = 0;
        item.costPrice = 0;
        item.total = 0;
        item.stockAvailable = 999999;
      } else {
        const prod = products.find(p => p.name === prodName);
        if (prod) {
          // Check stock for stationery
          const stock = prod.stockQty !== null && prod.stockQty !== undefined ? prod.stockQty : 999999;
          if (item.category === 'Stationery Products' && stock <= 0) {
            showToast(`"${prod.name}" is out of stock!`, 'error');
            return prev;
          }
          item.name = prod.name;
          item.price = prod.price;
          item.costPrice = prod.costPrice || 0;
          item.stockAvailable = stock;
          item.total = Math.round(prod.price * item.qty);
        } else {
          item.name = prodName;
        }
      }
      return copy;
    });
  };

  const updateItemPrice = (idx: number, price: number) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx].price = price;
      copy[idx].total = Math.round(price * copy[idx].qty);
      return copy;
    });
  };

  const updateItemQty = (idx: number, qty: number) => {
    setItems(prev => {
      const copy = [...prev];
      const it = copy[idx];
      let validQty = Math.max(1, qty);

      // Check stock limit for stationery
      if (it.category === 'Stationery Products' && it.stockAvailable < 999999 && validQty > it.stockAvailable) {
        showToast(`Only ${it.stockAvailable} units available in stock!`, 'warning');
        validQty = it.stockAvailable;
      }

      it.qty = validQty;
      it.total = Math.round(it.price * validQty);
      return copy;
    });
  };

  const updateItemCustomName = (idx: number, customName: string) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx].customName = customName;
      return copy;
    });
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
  const grandTotal = Math.max(0, Math.round(subtotal - discount));
  const paidVal = isPaidAuto ? grandTotal : (paid === '' ? 0 : parseFloat(paid) || 0);
  const dueVal = Math.max(0, Math.round(grandTotal - paidVal));

  const handlePaidChange = (val: string) => {
    setIsPaidAuto(false);
    setPaid(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedItems: SaleItem[] = [];
    for (const it of items) {
      let finalName = it.name;
      if (it.name === '__custom__') {
        finalName = it.customName.trim() || 'Custom Service';
      }
      if (!finalName) {
        showToast('Please select or specify item names for all rows!', 'warning');
        return;
      }
      if (it.category === 'Stationery Products' && it.stockAvailable <= 0) {
        showToast(`"${finalName}" is out of stock!`, 'error');
        return;
      }

      formattedItems.push({
        category: it.category,
        name: finalName,
        price: it.price,
        costPrice: it.costPrice,
        qty: it.qty,
        total: it.total
      });
    }

    setIsSubmitting(true);
    try {
      await onSubmitSale({
        id: editingSale?.id,
        user: currentUser,
        customer: customerName.trim() || 'New Customer',
        phone: customerPhone.trim() || '01904142370',
        address: customerAddress.trim() || 'Paduar Bazar, Cumilla',
        desc: workDesc.trim(),
        subtotal,
        discount,
        grandTotal,
        paid: paidVal,
        due: dueVal,
        items: formattedItems
      });
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Submission error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>{editingSale ? `Edit Invoice (#${editingSale.invoiceNo})` : 'Daily Sales & Memo Entry'}</span>
        </h2>
        {editingSale && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition border border-slate-600 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Customer Name
            </label>
            <input
              type="text"
              list="customerDatalist"
              value={customerName}
              onChange={e => handleCustomerSelect(e.target.value)}
              placeholder="New Customer"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
            />
            <datalist id="customerDatalist">
              {customers.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
              Customer Mobile
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="01904142370"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Product & Service Rows */}
        <div className="border border-slate-800 bg-slate-950/70 p-3 sm:p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-blue-400 font-bold text-xs sm:text-sm">
              <ShoppingBag className="w-4 h-4" /> Product & Service List
            </span>
            <button
              type="button"
              onClick={addItemRow}
              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 font-bold"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {items.map((it, idx) => {
              const categoryProducts = products.filter(p => normalizeCategory(p.category) === it.category);

              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl items-center"
                >
                  {/* Category */}
                  <select
                    value={it.category}
                    onChange={e => updateItemCategory(idx, e.target.value as Category)}
                    className="sm:col-span-4 bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2 py-1.5 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Photocopy">Photocopy</option>
                    <option value="Online Application">Online Application</option>
                    <option value="Stationery Products">Stationery Products</option>
                  </select>

                  {/* Product Dropdown & Custom Name input */}
                  <div className="sm:col-span-4 space-y-1">
                    <select
                      value={it.name}
                      onChange={e => updateItemProduct(idx, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2 py-1.5 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Item / Service...</option>
                      {categoryProducts.map(p => {
                        const hasStock = p.stockQty !== null && p.stockQty !== undefined;
                        const isStationery = it.category === 'Stationery Products';
                        const isOut = isStationery && hasStock && (p.stockQty || 0) <= 0;

                        return (
                          <option
                            key={p.id}
                            value={p.name}
                            disabled={isOut}
                            className={isOut ? 'text-rose-400 bg-slate-900 font-bold' : ''}
                          >
                            {isOut
                              ? `❌ ${p.name} [Out of Stock]`
                              : `${p.name}${hasStock ? ` [Stock: ${p.stockQty}]` : ''}`}
                          </option>
                        );
                      })}
                      {it.category !== 'Stationery Products' && (
                        <option value="__custom__">✍️ Custom Item Name...</option>
                      )}
                    </select>

                    {it.name === '__custom__' && it.category !== 'Stationery Products' && (
                      <input
                        type="text"
                        value={it.customName}
                        onChange={e => updateItemCustomName(idx, e.target.value)}
                        placeholder="Type custom service..."
                        className="w-full bg-slate-950 border border-blue-500/60 text-xs text-white rounded-lg px-2 py-1 font-semibold focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Rate, Qty, Total & Remove */}
                  <div className="sm:col-span-4 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Rate"
                      value={it.price || ''}
                      onChange={e => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right text-white font-bold font-tabular"
                    />
                    <span className="text-slate-500 font-bold">×</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Qty"
                      value={it.qty || 1}
                      onChange={e => updateItemQty(idx, parseFloat(e.target.value) || 1)}
                      className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center text-white font-bold font-tabular"
                    />
                    <span className="flex-grow text-right text-xs font-black text-emerald-400 font-tabular">
                      Tk {formatCurrency(it.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Remove Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work Note / Remarks */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
            Work Note / Remarks
          </label>
          <input
            type="text"
            value={workDesc}
            onChange={e => setWorkDesc(e.target.value)}
            placeholder="e.g. Urgent assignment print / Document scanning"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Financial Calculation Box */}
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-300 font-bold">
            <span>Subtotal:</span>
            <span className="font-black text-white text-sm sm:text-base font-tabular">
              Tk {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300 font-bold">
            <span>Discount:</span>
            <input
              type="number"
              min="0"
              step="any"
              value={discount || ''}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-right text-amber-400 font-black text-sm sm:text-base focus:outline-none focus:border-blue-500 font-tabular"
              placeholder="0"
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800 bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20">
            <span className="font-black text-xs sm:text-sm text-blue-300">Grand Total:</span>
            <span className="font-black text-white text-lg sm:text-xl font-tabular">
              Tk {formatCurrency(grandTotal)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-900 border border-emerald-500/30 p-2.5 rounded-xl">
              <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-0.5">
                Paid Amount
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={isPaidAuto ? grandTotal : paid}
                onChange={e => handlePaidChange(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-right text-emerald-400 font-black text-sm sm:text-base focus:outline-none font-tabular"
              />
              <span className="text-[9px] text-slate-400 block mt-0.5">
                {isPaidAuto ? '* Auto 100% paid' : '* Partial payment specified'}
              </span>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 p-2.5 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase block">Due Amount</span>
              <span
                className={`font-black text-base sm:text-xl text-right font-tabular ${
                  dueVal > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                Tk {formatCurrency(dueVal)}
              </span>
              <span className={`text-[9px] text-right font-medium ${dueVal > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {dueVal > 0 ? 'Auto logged to Due Ledger' : 'Fully Paid (No Due)'}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2.5 text-base cursor-pointer disabled:opacity-50"
        >
          <Check className="w-5 h-5 text-amber-300" />
          <span>{editingSale ? 'Update Invoice & Adjust Stock' : 'Save Transaction & Print Memo'}</span>
        </button>
      </form>
    </div>
  );
};
