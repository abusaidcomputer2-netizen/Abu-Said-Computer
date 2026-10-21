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
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  KeyRound,
  LayoutDashboard,
  FileSpreadsheet,
  Cloud
} from 'lucide-react';
import { User } from '../types';
import { formatCurrency } from '../utils/helpers';

export type ActiveTab = 
  | 'sales' 
  | 'dashboard'
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
  | 'migration'
  | 'drive_backup';

interface LayoutProps {
  currentUser: User;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  lowStockCount: number;
  totalOutstandingDue: number;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  isGoogleDriveLinked?: boolean;
  onOpenGoogleDriveBackup?: () => void;
  onOpenDataSheet?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  lowStockCount,
  totalOutstandingDue,
  onLogout,
  onOpenChangePassword,
  isGoogleDriveLinked,
  onOpenGoogleDriveBackup,
  onOpenDataSheet,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('as_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('as_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };
  const isAdmin = currentUser.role === 'admin';
  const perms = (currentUser.permissions || '').toLowerCase();
  const hasPerm = (p: string) => isAdmin || perms === 'all' || perms.includes(p);

  const navItems = [
    { id: 'sales' as ActiveTab, label: 'Sales & Invoices', icon: Receipt, perm: 'memo' },
    { id: 'dashboard' as ActiveTab, label: 'Analytics Dashboard', icon: LayoutDashboard, perm: 'memo' },
    { id: 'due' as ActiveTab, label: 'Due Ledger', icon: BookMarked, perm: 'due', badge: totalOutstandingDue > 0 ? `Tk ${formatCurrency(totalOutstandingDue)}` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
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
    { id: 'users' as ActiveTab, label: 'Users & Permissions', icon: UserCog, perm: 'admin' }
  ];

  const currentDateDisplay = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'sales': return 'Daily Sales & Memo Entry';
      case 'dashboard': return 'Executive Analytics & Performance Dashboard';
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
      default: return 'Shop Management System';
    }
  };

  return (
    <div id="app-main-layout" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white print:bg-white print:text-black print:block print:min-h-0 print:p-0 print:m-0">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-xs transition-opacity print:hidden no-print"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        onDoubleClick={toggleSidebarCollapse}
        title="Double-click to collapse / expand sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen ${
          isSidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } bg-slate-900 border-r border-slate-800 flex flex-col justify-between z-50 transition-all duration-300 ease-in-out print:hidden no-print ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className={`p-3.5 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl bg-slate-950 p-0.5 border border-slate-700/80 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={toggleSidebarCollapse}
                title="Click or double-click to collapse / expand"
              >
                <img 
                  src="/logo.png" 
                  alt="Abu Said Computer" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1OXthEw7eAn6SkWLFzlW9G8MItn3ARvFM";
                  }}
                />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[#0062cc] font-black text-lg">Abu Said</span>
                    <span className="text-white font-black text-lg">Computer</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Paduar Bazar, Cumilla
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle Icon */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden md:flex p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
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
              {!isSidebarCollapsed ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 block mb-1.5">
                  Main Operations
                </span>
              ) : (
                <div className="border-t border-slate-800/80 my-1.5" />
              )}
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
                      title={item.label}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                      } rounded-xl text-xs font-bold transition cursor-pointer relative group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </div>
                      {!isSidebarCollapsed && item.badge && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${item.badgeColor || ''}`}>
                          {item.badge}
                        </span>
                      )}
                      {isSidebarCollapsed && item.badge && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
                {onOpenDataSheet && (
                  <button
                    onClick={() => {
                      onOpenDataSheet();
                      setSidebarOpen(false);
                    }}
                    title="Google Sheet & Live Data Storage"
                    className={`w-full flex items-center ${
                      isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                    } rounded-xl text-xs font-bold transition cursor-pointer group text-emerald-400 hover:bg-slate-800/80 hover:text-white border border-emerald-500/20 bg-emerald-500/5`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 flex-shrink-0 text-emerald-400 group-hover:text-emerald-300" />
                      {!isSidebarCollapsed && <span>Data Sheets</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Sheet
                      </span>
                    )}
                  </button>
                )}
              </nav>
            </div>

            {/* Management & Admin Section */}
            {(isAdmin || hasPerm('financial') || hasPerm('expense') || hasPerm('product')) && (
              <div>
                {!isSidebarCollapsed ? (
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 block mb-1.5">
                    Financials & System
                  </span>
                ) : (
                  <div className="border-t border-slate-800/80 my-2" />
                )}
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
                        title={item.label}
                        className={`w-full flex items-center ${
                          isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                        } rounded-xl text-xs font-bold transition cursor-pointer group ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                          {!isSidebarCollapsed && <span>{item.label}</span>}
                        </div>
                        {!isSidebarCollapsed && <ChevronRight className="w-3 h-3 text-slate-500" />}
                      </button>
                    );
                  })}
                  {isAdmin && onOpenDataSheet && (
                    <button
                      onClick={() => {
                        onOpenDataSheet();
                        setSidebarOpen(false);
                      }}
                      title="Google Sheet & Live Data Storage"
                      className={`w-full flex items-center ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                      } rounded-xl text-xs font-bold transition cursor-pointer group text-emerald-300 hover:bg-slate-800/80 hover:text-white`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-4 h-4 flex-shrink-0 text-emerald-400 group-hover:text-emerald-300" />
                        {!isSidebarCollapsed && <span>Data Sheets</span>}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Admin
                        </span>
                      )}
                    </button>
                  )}
                </nav>
              </div>
            )}
          </div>

          {/* Current User Card & Logout */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-2xl">
                <div>
                  <div className="text-xs font-black text-white">{currentUser.username}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {currentUser.phone || '01904142370'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {onOpenChangePassword && (
                    <button
                      type="button"
                      onClick={onOpenChangePassword}
                      className="p-2 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 rounded-xl transition cursor-pointer"
                      title="Change Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl transition cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl transition cursor-pointer"
                  title={`Logout (${currentUser.username})`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Viewport Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md print:hidden no-print">
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
                  <span>Abu Said Computer</span>
                  <span>/</span>
                  <span className="text-blue-400 font-semibold">{getSectionTitle()}</span>
                </div>
              </div>
            </div>

            {/* Header Right Stats, Date & User Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentDateDisplay}</span>
              </div>

              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <span className="text-xs font-bold text-white hidden sm:inline">{currentUser.username}</span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl border border-slate-700 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="p-4 sm:p-6 lg:p-8 flex-grow space-y-6 print:p-0 print:m-0 print:space-y-0 print:block">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-3.5 px-6 text-center text-xs text-slate-500 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden no-print">
          <div>
            Abu Said Computer • Paduar Bazar, Cumilla, Bangladesh • Mobile: 01904142370
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Fast Relational Database Engine • v2.0
          </div>
        </footer>
      </div>
    </div>
  );
};
