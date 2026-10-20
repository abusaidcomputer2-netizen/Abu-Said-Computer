import React, { useState } from 'react';
import { AlertTriangle, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { SaleRecord } from '../../types';
import { formatCurrency, formatDateDisplay } from '../../utils/helpers';

interface DeleteMemoModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
  onConfirmDelete: (saleId: number) => Promise<void>;
}

export const DeleteMemoModal: React.FC<DeleteMemoModalProps> = ({
  sale,
  onClose,
  onConfirmDelete
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!sale) return null;

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleExecute = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await onConfirmDelete(sale.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/50 text-slate-100 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
        {step === 1 ? (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                Step 1 / 2 (Admin Permission)
              </span>
              <h3 className="text-base font-black text-white mt-1">Delete Invoice Request</h3>
              <p className="text-xs text-slate-300 mt-1">Are you sure you want to delete this invoice?</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Memo No:</span>
                <span className="font-black text-amber-400 text-sm">#{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Customer:</span>
                <span className="font-bold text-white">{sale.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Amount:</span>
                <span className="font-black text-emerald-400 font-tabular">Tk {formatCurrency(sale.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Date & Time:</span>
                <span className="text-slate-300">{sale.timestamp || formatDateDisplay(sale.rawDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Seller:</span>
                <span className="font-bold text-blue-300">{sale.user}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl text-xs border border-slate-600 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-1/2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-2xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Next Step</span> <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-rose-600/30 animate-pulse">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-black text-white tracking-wider bg-rose-600 px-2 py-0.5 rounded-full">
                Step 2 / 2 (Final Warning)
              </span>
              <h3 className="text-base font-black text-rose-400 mt-1">Confirm Permanent Deletion</h3>
              <p className="text-xs text-rose-200 mt-1 font-medium">
                Warning: Deleting this invoice will permanently remove it from the database and restore its item quantities to inventory!
              </p>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-left">
              <label className="block text-[11px] font-bold text-rose-300 mb-1">
                Type <span className="font-black text-white bg-rose-600 px-1 rounded">DELETE</span> below to confirm:
              </label>
              <input
                type="text"
                autoFocus
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type DELETE here..."
                className="w-full bg-slate-950 border border-rose-500/60 rounded-xl px-3 py-2 text-sm text-center text-white font-black tracking-widest uppercase focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleBack}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl text-xs border border-slate-600 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> <span>Back</span>
              </button>
              <button
                type="button"
                disabled={confirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                onClick={handleExecute}
                className="w-2/3 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-2xl text-xs transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" /> <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
