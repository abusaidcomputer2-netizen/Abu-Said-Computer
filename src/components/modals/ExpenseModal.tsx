import React, { useState } from 'react';
import { X, Receipt, Printer, Plus, Edit3, Trash2, Check } from 'lucide-react';
import { ExpenseRecord } from '../../types';
import { formatCurrency, formatDateDisplay } from '../../utils/helpers';

interface ExpenseModalProps {
  expenses: ExpenseRecord[];
  currentUser: string;
  onClose: () => void;
  onOpenExpensePrint: () => void;
  onSubmitExpense: (data: any) => Promise<void>;
  onDeleteExpense: (id: number) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const EXPENSE_CATEGORIES_BN = [
  'দোকান ভাড়া',
  'বিদ্যুৎ বিল',
  'ইন্টারনেট বিল',
  'কর্মী বেতন ও ভাতা (Md Abu Said)',
  'কর্মী বেতন ও ভাতা (অল স্টাফ)',
  'কর্মী বেতন ও খাবার বিল',
  'কালি ও টোনার',
  'মেশিন মেরামত ও সার্ভিসিং',
  'চা ও আপ্যায়ন',
  'ফটোকপির ব্যবহার্য সামগ্রী',
  'যাতায়াত ও পরিবহন',
  'অন্যান্য খরচ'
];

export const formatExpenseCategoryBn = (cat: string) => {
  if (!cat) return 'অন্যান্য খরচ';
  const c = cat.toLowerCase();
  if (c.includes('rent') || c.includes('ভাড়া') || c.includes('ভাড়া')) return 'দোকান ভাড়া';
  if (c.includes('electric') || c.includes('বিদ্যুৎ')) return 'বিদ্যুৎ বিল';
  if (c.includes('internet') || c.includes('ইন্টারনেট')) return 'ইন্টারনেট বিল';
  if (c.includes('said') || c.includes('আবু সাঈদ')) return 'কর্মী বেতন ও ভাতা (Md Abu Said)';
  if (c.includes('salary') || c.includes('staff') || c.includes('অল স্টাফ') || c.includes('কর্মী')) return 'কর্মী বেতন ও ভাতা (অল স্টাফ)';
  if (c.includes('খাবার') || c.includes('food') || c.includes('meal')) return 'কর্মী বেতন ও খাবার বিল';
  if (c.includes('ink') || c.includes('toner') || c.includes('কালি') || c.includes('টোনার')) return 'কালি ও টোনার';
  if (c.includes('repair') || c.includes('servicing') || c.includes('মেরামত')) return 'মেশিন মেরামত ও সার্ভিসিং';
  if (c.includes('tea') || c.includes('entertainment') || c.includes('আপ্যায়ন') || c.includes('চা')) return 'চা ও আপ্যায়ন';
  if (c.includes('paper') || c.includes('photocopy') || c.includes('ফটোকপি')) return 'ফটোকপির ব্যবহার্য সামগ্রী';
  if (c.includes('transport') || c.includes('conveyance') || c.includes('যাতায়াত')) return 'যাতায়াত ও পরিবহন';
  if (c.includes('other') || c.includes('অন্যান্য')) return 'অন্যান্য খরচ';
  return cat;
};

// Aliases for compatibility
export const EXPENSE_CATEGORIES_EN = EXPENSE_CATEGORIES_BN;
export const formatExpenseCategoryEn = formatExpenseCategoryBn;
const DEFAULT_CATEGORIES = EXPENSE_CATEGORIES_BN;

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  expenses,
  currentUser,
  onClose,
  onOpenExpensePrint,
  onSubmitExpense,
  onDeleteExpense,
  showToast
}) => {
  const [filterMonth, setFilterMonth] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredExpenses = expenses.filter(e => {
    if (filterMonth && e.date && !e.date.startsWith(filterMonth)) return false;
    return true;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const resetForm = () => {
    setEditingId(null);
    setCategory(DEFAULT_CATEGORIES[0]);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  const handleEdit = (exp: ExpenseRecord) => {
    setEditingId(exp.id);
    setCategory(formatExpenseCategoryEn(exp.category));
    setAmount(String(exp.amount));
    setDate(exp.date);
    setDescription(exp.desc || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      showToast('Please enter a valid amount!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitExpense({
        id: editingId,
        category,
        description: description.trim(),
        amount: amt,
        date,
        user: currentUser
      });
      showToast(editingId ? 'Expense updated!' : 'Expense saved successfully!', 'success');
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Error saving expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="no-print print:hidden fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-rose-500/30 text-slate-100 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <span>Operating Expense Management</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenExpensePrint}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Expense Print</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expenses List Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recent Expense Entries
              </h4>
              <span className="text-xs text-rose-400 font-black font-tabular">
                Total: Tk {formatCurrency(totalExpense)} ({filteredExpenses.length} Entries)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Month:</span>
              <input
                type="month"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-white font-bold focus:outline-none"
              />
              {filterMonth && (
                <button
                  type="button"
                  onClick={() => setFilterMonth('')}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
                >
                  All
                </button>
              )}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-medium">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 whitespace-nowrap text-slate-400 font-semibold">
                        {formatDateDisplay(e.date)}
                      </td>
                      <td className="p-3 font-bold text-rose-300">{formatExpenseCategoryEn(e.category)}</td>
                      <td className="p-3 text-slate-300 text-xs">{e.desc || '--'}</td>
                      <td className="p-3 text-right font-black text-rose-400 font-tabular">
                        {e.amount > 0 ? `Tk ${formatCurrency(e.amount)}` : <span className="text-slate-500 font-bold">--</span>}
                      </td>
                      <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEdit(e)}
                          className="p-1 text-amber-400 hover:text-amber-300"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(e.id)}
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

        {/* Expense Entry / Edit Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Edit Expense Record' : 'New Expense Entry'}</span>
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
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Expense Category *</label>
              <select
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-rose-500"
              >
                <option value="" disabled>Select Expense Category...</option>
                {DEFAULT_CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount (Tk) *</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-black text-right focus:outline-none focus:border-rose-500 font-tabular"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Description / Notes</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. 5 Reams A4 paper & photocopy machine toner"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{editingId ? 'Update Expense' : '+ Save Expense Entry'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
