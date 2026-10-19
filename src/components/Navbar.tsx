import React from 'react';
import { 
  BookMarked, 
  Users, 
  TrendingUp, 
  Coins, 
  Boxes, 
  ShoppingCart, 
  PieChart, 
  Receipt, 
  Tags, 
  UserCog, 
  LogOut,
  Database,
  Building2,
  KeyRound
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User;
  lowStockCount: number;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  onOpenDueLedger: () => void;
  onOpenCustomer: () => void;
  onOpenCustomerSales: () => void;
  onOpenCashClosing: () => void;
  onOpenStockInventory: () => void;
  onOpenPurchase: () => void;
  onOpenBusinessSummary: () => void;
  onOpenExpense: () => void;
  onOpenProduct: () => void;
  onOpenUser: () => void;
  onOpenMigration: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  lowStockCount,
  onLogout,
  onOpenChangePassword,
  onOpenDueLedger,
  onOpenCustomer,
  onOpenCustomerSales,
  onOpenCashClosing,
  onOpenStockInventory,
  onOpenPurchase,
  onOpenBusinessSummary,
  onOpenExpense,
  onOpenProduct,
  onOpenUser,
  onOpenMigration,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const perms = (currentUser.permissions || '').toLowerCase();
  const hasPerm = (p: string) => isAdmin || perms === 'all' || perms.includes(p);

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 shadow-xl backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 p-1 border border-slate-700/80 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Abu Said Computer" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1OXthEw7eAn6SkWLFzlW9G8MItn3ARvFM";
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 font-black text-lg tracking-tight">Abu Said</span>
              <span className="text-white font-black text-lg tracking-tight">Computer</span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Online Service & IT Point • Paduar Bazar, Cumilla
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {hasPerm('due') && (
            <button
              onClick={onOpenDueLedger}
              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Customer Due Ledger & Payment Collection"
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-400" />
              <span>Due Ledger</span>
            </button>
          )}

          {hasPerm('customer') && (
            <button
              onClick={onOpenCustomer}
              className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Customer Directory"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Customers</span>
            </button>
          )}

          {hasPerm('cust_sales') && (
            <button
              onClick={onOpenCustomerSales}
              className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Customer Purchase History & Sales Records"
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Customer Sales</span>
            </button>
          )}

          {hasPerm('cash_closing') && (
            <button
              onClick={onOpenCashClosing}
              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Daily Cash Closing & Drawer Reconciliation"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cash Closing</span>
            </button>
          )}

          {hasPerm('stock') && (
            <button
              onClick={onOpenStockInventory}
              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs relative"
              title="Stock Inventory & Low Stock Alerts"
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stock</span>
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] bg-rose-600 text-white rounded-full font-black animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          {hasPerm('purchase') && (
            <button
              onClick={onOpenPurchase}
              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Product Purchases Register & Khata"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Purchases</span>
            </button>
          )}

          {/* Admin Group */}
          {hasPerm('financial') && (
            <button
              onClick={onOpenBusinessSummary}
              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Business Financial Statement"
            >
              <PieChart className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Financial Statement</span>
            </button>
          )}

          {hasPerm('expense') && (
            <button
              onClick={onOpenExpense}
              className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Operating Expenses"
            >
              <Receipt className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Expenses</span>
            </button>
          )}

          {hasPerm('product') && (
            <button
              onClick={onOpenProduct}
              className="px-3 py-1.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Product Database"
            >
              <Tags className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden xl:inline">Products</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenUser}
              className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="User Accounts & Permissions"
            >
              <UserCog className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden xl:inline">Users</span>
            </button>
          )}

          <button
            onClick={onOpenMigration}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Database Migration & cPanel MySQL Export"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Migration</span>
          </button>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="text-right">
              <div className="text-xs font-black text-white">{currentUser.username}</div>
            </div>
            {onOpenChangePassword && (
              <button
                type="button"
                onClick={onOpenChangePassword}
                className="p-2 bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 rounded-xl border border-slate-700 transition cursor-pointer"
                title="Change Password"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-2 bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
