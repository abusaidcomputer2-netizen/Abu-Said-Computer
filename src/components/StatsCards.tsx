import React from 'react';
import { Copy, Globe, PenTool, CircleDollarSign, BookOpenCheck, TrendingDown, Scale } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface StatsCardsProps {
  totals: {
    photocopy: number;
    online: number;
    stationery: number;
    cashCollection: number;
    outstandingDue: number;
    totalExpense?: number;
    cashBalance?: number;
  };
  isAdmin: boolean;
  onOpenDueLedger: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ totals, isAdmin, onOpenDueLedger }) => {
  return (
    <section className="flex flex-wrap gap-3 w-full">
      {/* 1. Photocopy */}
      <div className="flex-1 min-w-[145px] sm:min-w-[160px] bg-slate-900 border border-blue-500/30 p-3.5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:-translate-y-0.5 hover:border-blue-500/50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-0.5">
            Photocopy
          </span>
          <div className="text-lg sm:text-xl font-black text-white font-tabular">
            ৳ {formatCurrency(totals.photocopy)}
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Copy className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Online Application */}
      <div className="flex-1 min-w-[145px] sm:min-w-[160px] bg-slate-900 border border-emerald-500/30 p-3.5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:-translate-y-0.5 hover:border-emerald-500/50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
            Online Service
          </span>
          <div className="text-lg sm:text-xl font-black text-white font-tabular">
            ৳ {formatCurrency(totals.online)}
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Globe className="w-4 h-4" />
        </div>
      </div>

      {/* 3. Stationery Products */}
      <div className="flex-1 min-w-[145px] sm:min-w-[160px] bg-slate-900 border border-amber-500/30 p-3.5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:-translate-y-0.5 hover:border-amber-500/50">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
            Stationery
          </span>
          <div className="text-lg sm:text-xl font-black text-white font-tabular">
            ৳ {formatCurrency(totals.stationery)}
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <PenTool className="w-4 h-4" />
        </div>
      </div>

      {/* 4. Total Cash Collection */}
      <div className="flex-1 min-w-[145px] sm:min-w-[160px] bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 p-3.5 rounded-2xl shadow-md text-white flex items-center justify-between transition-all hover:-translate-y-0.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 block mb-0.5">
            Total Collection
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-tabular">
            ৳ {formatCurrency(totals.cashCollection)}
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-amber-300">
          <CircleDollarSign className="w-5 h-5" />
        </div>
      </div>

      {/* 5. Total Outstanding Due (Visible to all, clickable) */}
      <div
        onClick={onOpenDueLedger}
        className="flex-1 min-w-[145px] sm:min-w-[160px] bg-slate-900 border border-amber-500/40 p-3.5 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer transition-all hover:-translate-y-0.5 hover:border-amber-400"
        title="Click to view Customer Due Ledger"
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
            Outstanding Due
          </span>
          <div className="text-lg sm:text-xl font-black text-rose-400 font-tabular">
            ৳ {formatCurrency(totals.outstandingDue)}
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <BookOpenCheck className="w-4 h-4" />
        </div>
      </div>

      {/* 6. Admin Total Expense */}
      {isAdmin && totals.totalExpense !== undefined && (
        <div className="flex-1 min-w-[145px] sm:min-w-[160px] bg-slate-900 border border-rose-500/30 p-3.5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:-translate-y-0.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-0.5">
              Total Expense
            </span>
            <div className="text-lg sm:text-xl font-black text-rose-400 font-tabular">
              ৳ {formatCurrency(totals.totalExpense)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* 7. Admin Cash Balance */}
      {isAdmin && totals.cashBalance !== undefined && (
        <div className="flex-1 min-w-[145px] sm:min-w-[160px] bg-gradient-to-br from-emerald-800 to-teal-900 border border-emerald-400/40 p-3.5 rounded-2xl shadow-md text-white flex items-center justify-between transition-all hover:-translate-y-0.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block mb-0.5">
              Cash Balance
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-tabular">
              ৳ {formatCurrency(totals.cashBalance)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-emerald-200">
            <Scale className="w-5 h-5" />
          </div>
        </div>
      )}
    </section>
  );
};
