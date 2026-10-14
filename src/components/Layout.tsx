import React, { useState } from 'react';
import { 
  Building2, 
  Menu, 
  X, 
  Receipt, 
  BookMarked, 
  Users, 
  TrendingUp, 
  Coins, 
  Boxes, 
  ShoppingCart, 
  PieChart, 
  Tags, 
  UserCog, 
  Database, 
  LogOut,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { User } from '../types';
import { formatCurrency } from '../utils/helpers';

export type ActiveTab = 
  | 'sales' 
  | 'due' 
  | 'customers' 
  | 'cust_sales' 
  | 'cash_closing' 
  | 'stock' 
  | 'purchases' 
  | 'financial' 
  | 'expenses' 
  | 'products' 
  | 'users' 
  | 'migration';

interface LayoutProps {
  currentUser: User;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  lowStockCount: number;
  totalOutstandingDue: number;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  lowStockCount,
  totalOutstandingDue,
  onLogout,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = currentUser.role === 'admin';
  const perms = (currentUser.permissions || '').toLowerCase();
  const hasPerm = (p: string) => isAdmin || perms === 'all' || perms.includes(p);

  const navItems = [
    { id: 'sales' as ActiveTab, label: 'Sales & Invoices', icon: Receipt, perm: 'memo' },
    { id: 'due' as ActiveTab, label: 'Due Ledger', icon: BookMarked, perm: 'due', badge: totalOutstandingDue > 0 ? `৳${formatCurrency(totalOutstandingDue)}` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'customers' as ActiveTab, label: 'Customer Directory', icon: Users, perm: 'customer' },
    { id: 'cust_sales' as ActiveTab, label: 'Customer Sales', icon: TrendingUp, perm: 'cust_sales' },
    { id: 'cash_closing' as ActiveTab, label: 'Daily Cash Closing', icon: Coins, perm: 'cash_closing' },
    { id: 'stock' as ActiveTab, label: 'Stock Inventory', icon: Boxes, perm: 'stock', badge: lowStockCount > 0 ? `${lowStockCount} Low` : null, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' },
    { id: 'purchases' as ActiveTab, label: 'Purchases Khata', icon: ShoppingCart, perm: 'purchase' }
  ];

  const adminItems = [
    { id: 'financial' as ActiveTab, label: 'Financial Statement', icon: PieChart, perm: 'financial' },
    { id: 'expenses' as ActiveTab, label: 'Operating Expenses', icon: Receipt, perm: 'expense' },
    { id: 'products' as ActiveTab, label: 'Products & Services', icon: Tags, perm: 'product' },
    { id: 'users' as ActiveTab, label: 'Users & Permissions', icon: UserCog, perm: 'admin' },
    { id: 'migration' as ActiveTab, label: 'cPanel MySQL Export', icon: Database, perm: 'admin' }
  ];

  const currentDateDisplay = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'sales': return 'Daily Sales & Memo Entry';
      case 'due': return 'Customer Due Ledger & Debt Collection';
      case 'customers': return 'Customer Directory & Accounts';
      case 'cust_sales': return 'Customer Purchase History & Sales';
      case 'cash_closing': return 'Daily Cash Closing & Drawer Reconciliation';
      case 'stock': return 'Stationery Stock Inventory & Valuation';
      case 'purchases': return 'Product Purchases Register & Khata';
      case 'financial': return 'Business Financial Statement (P&L)';
      case 'expenses': return 'Operating Expense Management';
      case 'products': return 'Product & Service Master Catalog';
      case 'users': return 'Staff Accounts & Granular Permissions';
      case 'migration': return 'Database Migration & cPanel Hosting';
      default: return 'Shop Management System';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-950 p-2 border border-slate-700/80 flex items-center justify-center text-amber-400 shadow-inner">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-amber-500 font-black text-lg">AS</span>
                  <span className="text-white font-black text-lg">Computer</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Paduar Bazar, Cumilla
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-4 flex-grow">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 block mb-1.5">
                Main Operations
              </span>
              <nav className="space-y-1">
                {navItems.map(item => {
                  if (!hasPerm(item.perm)) return null;
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${item.badgeColor || ''}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Management & Admin Section */}
            {(isAdmin || hasPerm('financial') || hasPerm('expense') || hasPerm('product')) && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 block mb-1.5">
                  Financials & System
                </span>
                <nav className="space-y-1">
                  {adminItems.map(item => {
                    if (item.perm === 'admin' && !isAdmin) return null;
                    if (item.perm !== 'admin' && !hasPerm(item.perm)) return null;
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          {/* Current User Card & Logout */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-2xl">
              <div>
                <div className="text-xs font-black text-white">{currentUser.username}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-black ${
                      currentUser.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentUser.phone || '01904142370'}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md">
          <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <span>AS Computer</span>
                  <span>/</span>
                  <span className="text-blue-400 font-semibold">{getSectionTitle()}</span>
                </div>
              </div>
            </div>

            {/* Header Right Stats & Date Indicator */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentDateDisplay}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold">
                <Sparkles className="w-3 h-3" />
                <span>BDT (৳) Asia/Dhaka</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="p-4 sm:p-6 lg:p-8 flex-grow space-y-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-3.5 px-6 text-center text-xs text-slate-500 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AS Computer • Paduar Bazar, Cumilla, Bangladesh • Mobile: 01904142370
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Fast Relational Database Engine • v2.0
          </div>
        </footer>
      </div>
    </div>
  );
};
