import React, { useState } from 'react';
import { X, KeyRound, Shield, Check, Eye, EyeOff } from 'lucide-react';
import { User } from '../../types';

interface ChangePasswordModalProps {
  currentUser: User;
  users: User[];
  onClose: () => void;
  onPasswordChanged: (username: string, newPass: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  currentUser,
  users,
  onClose,
  onPasswordChanged,
  showToast
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [selectedUsername, setSelectedUsername] = useState<string>(currentUser.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChangingSelf = selectedUsername.toLowerCase() === currentUser.username.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.trim().length < 3) {
      showToast('New password must be at least 3 characters!', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onPasswordChanged(selectedUsername, newPassword.trim());
      showToast(`Password successfully updated for ${selectedUsername}!`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 text-slate-100 w-full max-w-md rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Change Account Password</h3>
              <p className="text-[11px] text-slate-400">Update login security credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target User selection (Admin can pick anyone, Staff only themselves) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Account
            </label>
            {isAdmin ? (
              <select
                value={selectedUsername}
                onChange={e => {
                  setSelectedUsername(e.target.value);
                  setCurrentPassword('');
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-400"
              >
                {users.map(u => (
                  <option key={u.id || u.username} value={u.username}>
                    {u.username} {u.username === currentUser.username ? '(You)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white">
                {currentUser.username}
              </div>
            )}
          </div>

          {/* Current password (required only for non-admin changing self) */}
          {isChangingSelf && !isAdmin && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                New Password
              </label>
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPass ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 3 chars)..."
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password..."
              className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              {isAdmin && !isChangingSelf
                ? `Admin reset for ${selectedUsername}. User will use this new password immediately.`
                : 'New password will take effect immediately on this account.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
