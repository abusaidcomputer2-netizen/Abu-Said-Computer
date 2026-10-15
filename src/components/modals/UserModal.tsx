import React, { useState } from 'react';
import { X, UserCog, UserPlus, Edit3, Trash2, Check, Shield } from 'lucide-react';
import { User } from '../../types';

interface UserModalProps {
  users: User[];
  currentUser: string;
  onClose: () => void;
  onSubmitUser: (data: any) => Promise<void>;
  onDeleteUser: (id: number) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ALL_PERMISSIONS = [
  { key: 'memo', label: 'Sales Memo Entry' },
  { key: 'due', label: 'Due Ledger' },
  { key: 'customer', label: 'Customer Directory' },
  { key: 'cust_sales', label: 'Customer Sales' },
  { key: 'stock', label: 'Stock Inventory' },
  { key: 'purchase', label: 'Product Purchases' },
  { key: 'paper', label: 'Photocopy Paper' },
  { key: 'cash_closing', label: 'Cash Closing' },
  { key: 'expense', label: 'Daily Expenses' },
  { key: 'financial', label: 'Financial Statement' },
  { key: 'summary_print', label: 'Summary Print' },
  { key: 'product', label: 'Product Database' }
];

export const UserModal: React.FC<UserModalProps> = ({
  users,
  currentUser,
  onClose,
  onSubmitUser,
  onDeleteUser,
  showToast
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([
    'memo', 'due', 'customer', 'cust_sales', 'stock', 'purchase', 'paper', 'cash_closing', 'summary_print'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setPhone('');
    setRole('staff');
    setSelectedPerms([
      'memo', 'due', 'customer', 'cust_sales', 'stock', 'purchase', 'paper', 'cash_closing', 'summary_print'
    ]);
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setUsername(u.username);
    setPassword('');
    setPhone(u.phone || '');
    setRole(u.role);
    const pStr = u.permissions || '';
    if (pStr === 'all' || u.role === 'admin') {
      setSelectedPerms(ALL_PERMISSIONS.map(p => p.key));
    } else {
      setSelectedPerms(pStr.split(',').map(s => s.trim()));
    }
  };

  const togglePerm = (key: string) => {
    setSelectedPerms(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Username is required!', 'warning');
      return;
    }
    if (!password.trim()) {
      showToast('পাসওয়ার্ড প্রদান বাধ্যতামূলক (Password is mandatory)!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitUser({
        id: editingId,
        username: username.trim(),
        password: password.trim(),
        phone: phone.trim(),
        role,
        permissions: role === 'admin' ? 'all' : selectedPerms.join(',')
      });
      showToast(editingId ? 'User updated!' : 'User created!', 'success');
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Error saving user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-purple-500/30 text-slate-100 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <span>Staff Accounts & Granular Permissions</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Users List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Accounts ({users.length})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {users.map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl flex-wrap gap-2"
              >
                <div>
                  <div className="font-bold text-white text-sm">
                    {u.username}
                  </div>
                  <div className="text-xs text-slate-400">{u.phone || 'No phone'}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(u)}
                    className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {u.username !== currentUser && (
                    <button
                      type="button"
                      onClick={() => onDeleteUser(u.id)}
                      className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3.5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>{editingId ? 'Edit Account Credentials' : 'Create New User Account'}</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Full name or login ID"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Password * (বাধ্যতামূলক)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Mobile</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Role *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'staff')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Granular Permissions Checkboxes */}
            {role !== 'admin' && (
              <div className="sm:col-span-4 bg-slate-900 p-3.5 rounded-2xl border border-purple-500/40 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-400" /> Granular Button & Task Permissions:
                  </label>
                  <span className="text-[10px] text-slate-400">
                    * Users will only see and access the checked tools
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs pt-1">
                  {ALL_PERMISSIONS.map(p => (
                    <label
                      key={p.key}
                      className="flex items-center gap-2 cursor-pointer text-slate-200 font-semibold p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(p.key)}
                        onChange={() => togglePerm(p.key)}
                        className="rounded bg-slate-800 border-slate-600 text-purple-600"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{editingId ? 'Update User Account' : '+ Create User Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
