import React, { useState } from 'react';
import { X, Users, Plus, Edit3, Trash2, Check } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerModalProps {
  customers: Customer[];
  onClose: () => void;
  onSubmitCustomer: (data: any) => Promise<void>;
  onDeleteCustomer: (id: number) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  customers,
  onClose,
  onSubmitCustomer,
  onDeleteCustomer,
  showToast
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sl, setSl] = useState(() => {
    const max = customers.reduce((m, c) => Math.max(m, c.sl || 0), 0);
    return max + 1;
  });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('Paduar Bazar, Cumilla');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setAddress('Paduar Bazar, Cumilla');
    const max = customers.reduce((m, c) => Math.max(m, c.sl || 0), 0);
    setSl(max + 1);
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setSl(c.sl);
    setName(c.name);
    setPhone(c.phone || '');
    setAddress(c.address || 'Paduar Bazar, Cumilla');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Customer name is required!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitCustomer({
        id: editingId,
        sl,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim()
      });
      showToast(editingId ? 'Customer updated!' : 'Customer saved!', 'success');
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Error saving customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-blue-500/30 text-slate-100 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span>Customer Directory</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Customer Accounts ({customers.length} Accounts)
            </h4>
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3 text-center w-16">SL</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Mobile Number</th>
                  <th className="p-3">Address</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-medium">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 text-center font-bold text-amber-400">{c.sl}</td>
                      <td className="p-3 font-bold text-white text-xs sm:text-sm">{c.name}</td>
                      <td className="p-3 text-slate-300 font-semibold">{c.phone || '--'}</td>
                      <td className="p-3 text-slate-400">{c.address || '--'}</td>
                      <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEdit(c)}
                          className="p-1 text-amber-400 hover:text-amber-300"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCustomer(c.id)}
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

        {/* Customer Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Edit Customer Details' : 'Add New Customer'}</span>
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
                className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-black focus:outline-none focus:border-amber-400 font-tabular text-center"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Mobile Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Paduar Bazar, Cumilla"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{editingId ? 'Update Customer' : '+ Save Customer'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
