import React, { useState, useMemo } from 'react';
import { X, Printer, Calendar, RefreshCw, Layers, Award, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { SaleRecord, User, StaffLeaveRecord } from '../../types';
import { formatCurrency, formatInvoicePrintTimestamp, normalizeCategory } from '../../utils/helpers';
import { ReportFooter } from '../ReportFooter';

interface CommissionReportModalProps {
  sales: SaleRecord[];
  users: User[];
  currentUser: User;
  onClose: () => void;
}

export const CommissionReportModal: React.FC<CommissionReportModalProps> = ({
  sales,
  users,
  currentUser,
  onClose
}) => {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedStaff, setSelectedStaff] = useState<string>(currentUser.username || 'Md Abu Said');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [leaveMode, setLeaveMode] = useState<'single' | 'range'>('single');
  const [leaveStaff, setLeaveStaff] = useState<string>(currentUser.username || 'Md Abu Said');
  const [leaveDate, setLeaveDate] = useState<string>(now.toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState<string>(now.toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState<string>('');
  
  // Persisted staff leaves
  const [leaves, setLeaves] = useState<StaffLeaveRecord[]>(() => {
    try {
      const saved = localStorage.getItem('as_computer_staff_leaves');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveLeaves = (newLeaves: StaffLeaveRecord[]) => {
    setLeaves(newLeaves);
    try {
      localStorage.setItem('as_computer_staff_leaves', JSON.stringify(newLeaves));
    } catch (e) {
      console.error('Failed to save leaves:', e);
    }
  };

  // Staff list
  const staffList = useMemo(() => {
    const set = new Set<string>();
    if (currentUser?.username) set.add(currentUser.username);
    users.forEach(u => {
      if (u.username) set.add(u.username);
    });
    sales.forEach(s => {
      if (s.user) set.add(s.user);
    });
    return Array.from(set).sort();
  }, [users, sales, currentUser]);

  // Set This Month / Last Month
  const handleSetThisMonth = () => {
    setSelectedMonth(currentMonthStr);
  };

  const handleSetLastMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Filter sales for selected staff and month
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Month match (YYYY-MM)
      const rawDate = s.rawDate || s.date || '';
      const matchMonth = selectedMonth ? rawDate.startsWith(selectedMonth) : true;
      
      // Staff match
      const matchStaff = selectedStaff === 'ALL' || !selectedStaff 
        ? true 
        : (s.user || '').trim().toLowerCase() === selectedStaff.trim().toLowerCase();
        
      return matchMonth && matchStaff;
    });
  }, [sales, selectedMonth, selectedStaff]);

  // Commission calculations
  // Category 1: Photocopy (30%)
  // Category 2: Online Application (50%)
  // Category 3: Stationery Products (0%)
  const stats = useMemo(() => {
    let netSales = 0;
    let memoCount = filteredSales.length;
    let photocopySales = 0;
    let onlineSales = 0;
    let stationerySales = 0;

    filteredSales.forEach(s => {
      const saleNet = s.grandTotal || (s.subtotal - (s.discount || 0)) || 0;
      netSales += saleNet;

      // Classify by category or items
      if (s.items && s.items.length > 0) {
        // If discount exists on memo, distribute proportionally or take item total
        const itemsSum = s.items.reduce((sum, it) => sum + (it.total || 0), 0) || 1;
        const discountRatio = saleNet / itemsSum;

        s.items.forEach(it => {
          const cat = normalizeCategory(it.category || s.category);
          const effectiveAmount = (it.total || 0) * discountRatio;
          if (cat === 'Photocopy') {
            photocopySales += effectiveAmount;
          } else if (cat === 'Online Application') {
            onlineSales += effectiveAmount;
          } else {
            stationerySales += effectiveAmount;
          }
        });
      } else {
        const cat = normalizeCategory(s.category);
        if (cat === 'Photocopy') {
          photocopySales += saleNet;
        } else if (cat === 'Online Application') {
          onlineSales += saleNet;
        } else {
          stationerySales += saleNet;
        }
      }
    });

    const photocopyCommission = photocopySales * 0.30;
    const onlineCommission = onlineSales * 0.50;
    const stationeryCommission = 0;
    const totalCommission = photocopyCommission + onlineCommission + stationeryCommission;

    return {
      netSales,
      memoCount,
      photocopySales,
      photocopyCommission,
      onlineSales,
      onlineCommission,
      stationerySales,
      stationeryCommission,
      totalCommission
    };
  }, [filteredSales]);

  // Leaves for selected month and staff
  const staffMonthLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchMonth = selectedMonth ? l.date.startsWith(selectedMonth) : true;
      const matchStaff = selectedStaff === 'ALL' || !selectedStaff
        ? true
        : l.staffName.toLowerCase() === selectedStaff.toLowerCase();
      return matchMonth && matchStaff;
    });
  }, [leaves, selectedMonth, selectedStaff]);

  const totalLeaveDays = useMemo(() => {
    return staffMonthLeaves.reduce((acc, cur) => acc + (cur.days || 1), 0);
  }, [staffMonthLeaves]);

  // Handle Add Leave
  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStaff || !leaveDate) return;

    let days = 1;
    let dateStr = leaveDate;
    if (leaveMode === 'range' && leaveEndDate && leaveEndDate >= leaveDate) {
      const start = new Date(leaveDate);
      const end = new Date(leaveEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      dateStr = `${leaveDate} to ${leaveEndDate}`;
    }

    const newRecord: StaffLeaveRecord = {
      id: `leave_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      staffName: leaveStaff,
      date: leaveDate,
      endDate: leaveMode === 'range' ? leaveEndDate : undefined,
      days,
      reason: leaveReason.trim() || 'Approved Leave',
      createdAt: new Date().toISOString()
    };

    saveLeaves([newRecord, ...leaves]);
    setLeaveReason('');
  };

  const handleDeleteLeave = (id: string) => {
    saveLeaves(leaves.filter(l => l.id !== id));
  };

  // Formatted Month Title e.g. "October 2026"
  const formattedMonthDisplay = useMemo(() => {
    if (!selectedMonth) return 'All Periods';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const nowFormatted = formatInvoicePrintTimestamp(new Date());
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block">
      <div className="print-modal-dialog bg-slate-900 border border-purple-500/40 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4 print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:space-y-0">
        
        {/* Top Header Bar */}
        <div className="no-print flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <span>Staff Commission & Leave Report</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-200" />
              <span>Print Report / PDF</span>
            </button>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Section (No Print) */}
        <div className="no-print bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>SELECT STAFF & MONTH</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleSetThisMonth}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleSetLastMonth}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => {}}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">SELECT STAFF</label>
              <select
                value={selectedStaff}
                onChange={e => {
                  setSelectedStaff(e.target.value);
                  setLeaveStaff(e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
              >
                {staffList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">SELECT MONTH</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="sm:col-span-3">
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">
                  ACTIVE PERIOD
                </span>
                <span className="text-xs font-black text-purple-300 truncate block mt-0.5">
                  {formattedMonthDisplay} • {selectedStaff}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Printable & Interactive Area */}
        <div className="print-page-container bg-slate-950/80 border border-slate-800/80 text-slate-100 p-5 sm:p-6 rounded-2xl print:bg-white print:text-slate-900 print:p-0 print:border-none print:shadow-none flex flex-col justify-between min-h-[270mm] print:min-h-[270mm]">
          <div className="print-content-body space-y-5 flex-grow">
          
          {/* Printable Report Header */}
          <div className="hidden print:flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 bg-transparent">
                <img 
                  src="/logo.png" 
                  alt="Abu Said Computer" 
                  className="w-full h-full object-contain filter-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1OXthEw7eAn6SkWLFzlW9G8MItn3ARvFM";
                  }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  <span className="text-[#0062cc]">Abu Said</span> Computer
                </h2>
                <p className="text-xs font-bold text-slate-700 tracking-wide mt-1">
                  Staff Sales Commission & Leave Performance Statement
                </p>
                <p className="text-[10px] text-slate-500">
                  Office: Bhai Bhai Super Market (2nd Floor), Paduar Bazar, Cumilla • Mobile: +88 01904 142370
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-900 rounded-lg inline-block border border-purple-200">
                Staff: {selectedStaff}
              </span>
              <p className="text-xs font-bold mt-1 text-slate-700">
                Period: <span className="font-black text-slate-900">{formattedMonthDisplay}</span>
              </p>
            </div>
          </div>

          {/* 5 KPI Summary Cards (Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Card 1: Net Sales */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xs print:bg-white print:border-slate-300">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block print:text-slate-600">
                NET SALES (AFTER DISC.)
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-tabular mt-1 print:text-slate-900">
                {formatCurrency(stats.netSales)}
              </div>
              <span className="text-[11px] font-bold text-blue-400 block mt-0.5 print:text-blue-700">
                {stats.memoCount} Memos
              </span>
            </div>

            {/* Card 2: Photocopy */}
            <div className="bg-slate-900/90 border border-blue-500/30 p-3.5 rounded-2xl shadow-xs print:bg-white print:border-slate-300">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block print:text-blue-800">
                PHOTOCOPY (30%)
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-400 font-tabular mt-1 print:text-blue-700">
                {formatCurrency(stats.photocopyCommission)}
              </div>
              <span className="text-[10px] font-medium text-slate-400 block mt-0.5 print:text-slate-600">
                Sales: {formatCurrency(stats.photocopySales)}
              </span>
            </div>

            {/* Card 3: Online App */}
            <div className="bg-slate-900/90 border border-emerald-500/30 p-3.5 rounded-2xl shadow-xs print:bg-white print:border-slate-300">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block print:text-emerald-800">
                ONLINE APP (50%)
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-tabular mt-1 print:text-emerald-700">
                {formatCurrency(stats.onlineCommission)}
              </div>
              <span className="text-[10px] font-medium text-slate-400 block mt-0.5 print:text-slate-600">
                Sales: {formatCurrency(stats.onlineSales)}
              </span>
            </div>

            {/* Card 4: Total Commission (Highlighted Card) */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 border border-purple-400 p-3.5 rounded-2xl shadow-md text-white print:bg-purple-100 print:text-purple-950 print:border-purple-300">
              <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider block print:text-purple-900">
                TOTAL COMMISSION
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-tabular mt-1 print:text-purple-950">
                {formatCurrency(stats.totalCommission)}
              </div>
              <span className="text-[10px] font-medium text-indigo-200 block mt-0.5 print:text-purple-800">
                Billed Sales Commission
              </span>
            </div>

            {/* Card 5: Total Leave Days */}
            <div className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-2xl shadow-xs col-span-2 sm:col-span-1 print:bg-white print:border-slate-300">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block print:text-amber-800">
                TOTAL LEAVE DAYS
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-tabular mt-1 print:text-amber-700">
                {totalLeaveDays} Days
              </div>
              <span className="text-[10px] font-medium text-slate-400 block mt-0.5 print:text-slate-600">
                Unique Days in Month
              </span>
            </div>
          </div>

          {/* Category-Wise Sales & Commission Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden print:border print:border-slate-300 print:bg-white">
            <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2 print:border-b-2 print:border-slate-300">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400 print:text-purple-700" />
                <span className="text-xs font-black uppercase tracking-wider text-white print:text-slate-900">
                  CATEGORY-WISE SALES & COMMISSION BREAKDOWN
                </span>
              </div>
              <span className="text-[10px] text-slate-400 italic print:text-slate-600">
                * Commission is calculated on net sales after discount (full commission applies even with due)
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-slate-800 print:border-slate-300">SL</th>
                  <th className="py-2.5 px-4 border-r border-slate-800 print:border-slate-300">CATEGORY</th>
                  <th className="py-2.5 px-4 text-right border-r border-slate-800 print:border-slate-300">NET SALES AFTER DISCOUNT</th>
                  <th className="py-2.5 px-4 text-center border-r border-slate-800 print:border-slate-300">COMMISSION RATE</th>
                  <th className="py-2.5 px-4 text-right">COMMISSION AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 font-medium">
                {/* Row 1: Photocopy */}
                <tr className="hover:bg-slate-800/40 print:hover:bg-transparent">
                  <td className="py-2.5 px-3 text-center border-r border-slate-800 text-slate-500 font-bold print:border-slate-300">1</td>
                  <td className="py-2.5 px-4 border-r border-slate-800 print:border-slate-300">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 print:bg-blue-50 print:text-blue-800">
                      Photocopy
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black font-tabular text-slate-200 border-r border-slate-800 print:border-slate-300 print:text-slate-900">
                    {formatCurrency(stats.photocopySales)}
                  </td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-800 print:border-slate-300">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 print:bg-purple-100 print:text-purple-800">
                      30%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black font-tabular text-blue-400 print:text-blue-700">
                    {formatCurrency(stats.photocopyCommission)}
                  </td>
                </tr>

                {/* Row 2: Online Application */}
                <tr className="hover:bg-slate-800/40 print:hover:bg-transparent">
                  <td className="py-2.5 px-3 text-center border-r border-slate-800 text-slate-500 font-bold print:border-slate-300">2</td>
                  <td className="py-2.5 px-4 border-r border-slate-800 print:border-slate-300">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 print:bg-emerald-50 print:text-emerald-800">
                      Online Application
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black font-tabular text-slate-200 border-r border-slate-800 print:border-slate-300 print:text-slate-900">
                    {formatCurrency(stats.onlineSales)}
                  </td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-800 print:border-slate-300">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 print:bg-purple-100 print:text-purple-800">
                      50%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black font-tabular text-emerald-400 print:text-emerald-700">
                    {formatCurrency(stats.onlineCommission)}
                  </td>
                </tr>

                {/* Row 3: Stationery Products */}
                <tr className="hover:bg-slate-800/40 print:hover:bg-transparent">
                  <td className="py-2.5 px-3 text-center border-r border-slate-800 text-slate-500 font-bold print:border-slate-300">3</td>
                  <td className="py-2.5 px-4 border-r border-slate-800 print:border-slate-300">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 print:bg-amber-50 print:text-amber-800">
                      Stationery Products
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black font-tabular text-slate-200 border-r border-slate-800 print:border-slate-300 print:text-slate-900">
                    {formatCurrency(stats.stationerySales)}
                  </td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-800 print:border-slate-300">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 print:bg-purple-100 print:text-purple-800">
                      0%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black font-tabular text-slate-400 print:text-slate-500">
                    0
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-slate-700 bg-slate-950 font-black text-xs print:bg-slate-50 print:border-slate-400">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-white print:text-slate-900">
                    TOTAL:
                  </td>
                  <td className="py-3 px-4 text-right font-black text-sm text-white font-tabular border-r border-slate-800 print:border-slate-300 print:text-slate-950">
                    {formatCurrency(stats.netSales)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 border-r border-slate-800 print:border-slate-300">
                    --
                  </td>
                  <td className="py-3 px-4 text-right font-black text-base text-purple-400 font-tabular print:text-purple-900">
                    {formatCurrency(stats.totalCommission)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* STAFF LEAVE MANAGEMENT (ADMIN ONLY) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 print:border print:border-slate-300 print:bg-white">
            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-800 pb-3 print:border-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400 print:text-amber-600" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 print:text-amber-800">
                  STAFF LEAVE MANAGEMENT (ADMIN ONLY)
                </span>
              </div>
              
              <div className="no-print flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setLeaveMode('single')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    leaveMode === 'single'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Day
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveMode('range')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    leaveMode === 'range'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Start - End Date
                </button>
              </div>
            </div>

            {/* Leave Add Form (Only visible to admin, hidden in print) */}
            {isAdmin && (
              <form onSubmit={handleAddLeave} className="no-print grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Staff Name *</label>
                  <select
                    value={leaveStaff}
                    onChange={e => setLeaveStaff(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    {staffList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className={leaveMode === 'single' ? 'sm:col-span-3' : 'sm:col-span-2'}>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    {leaveMode === 'single' ? 'Leave Date *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    value={leaveDate}
                    onChange={e => setLeaveDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                {leaveMode === 'range' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={leaveEndDate}
                      onChange={e => setLeaveEndDate(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className={leaveMode === 'single' ? 'sm:col-span-4' : 'sm:col-span-3'}>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Leave Note / Reason</label>
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    placeholder="e.g. Sick leave / Personal work..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-orange-600/30 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Leave</span>
                  </button>
                </div>
              </form>
            )}

            {/* Recorded Leaves Table */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>RECORDED LEAVES IN SELECTED PERIOD (ADMIN ONLY)</span>
                <span className="text-[11px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  {staffMonthLeaves.length} Records
                </span>
              </div>

              {staffMonthLeaves.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-medium border border-dashed border-slate-800 rounded-xl print:border-slate-300">
                  No leave records found in this month.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl print:border-slate-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/70 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                        <th className="py-2 px-3 text-center w-10">SL</th>
                        <th className="py-2 px-3">STAFF</th>
                        <th className="py-2 px-3">DATE / RANGE</th>
                        <th className="py-2 px-3 text-center">DAYS IN MONTH</th>
                        <th className="py-2 px-3">LEAVE NOTE</th>
                        <th className="py-2 px-3 text-center w-16 no-print">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium print:divide-slate-200">
                      {staffMonthLeaves.map((l, idx) => (
                        <tr key={l.id} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-white print:text-slate-900">{l.staffName}</td>
                          <td className="py-2 px-3 text-slate-300 print:text-slate-700">
                            {l.endDate && l.endDate !== l.date ? `${l.date} to ${l.endDate}` : l.date}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-amber-400 print:text-amber-800">
                            {l.days || 1} Days
                          </td>
                          <td className="py-2 px-3 text-slate-400 print:text-slate-600">{l.reason || '-'}</td>
                          <td className="py-2 px-3 text-center no-print">
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteLeave(l.id)}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Footer - Only visible on physical print/PDF, hidden on interactive screen form */}
        <div className="hidden print:block pt-6">
          <ReportFooter
            reportTitle="Staff Commission & Leave Report"
            printTimestamp={nowFormatted}
            currentUser={selectedStaff}
            leftSignatureLabel="STAFF SIGNATURE"
            rightSignatureLabel="AUTHORIZED SIGNATURE"
          />
        </div>
        </div>
      </div>
    </div>
  );
};
