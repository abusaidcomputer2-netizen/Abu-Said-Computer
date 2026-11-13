import React, { useState, useMemo, useEffect } from 'react';
import { X, Printer, Layers, Award, Users, UserCheck } from 'lucide-react';
import { SaleRecord, User } from '../../types';
import { formatCurrency, formatInvoicePrintTimestamp, formatPeriodHeader, normalizeCategory } from '../../utils/helpers';
import { ReportFooter } from '../ReportFooter';

interface CommissionReportModalProps {
  sales: SaleRecord[];
  users: User[];
  currentUser: User;
  onClose: () => void;
}

interface StaffCommissionStats {
  staffName: string;
  netSales: number;
  memoCount: number;
  workingDays: number;
  photocopySales: number;
  photocopyCommission: number;
  onlineSales: number;
  onlineCommission: number;
  stationerySales: number;
  stationeryCommission: number;
  totalCommission: number;
}

function computeCommissionStats(staffName: string, records: SaleRecord[]): StaffCommissionStats {
  let netSales = 0;
  const memoCount = records.length;
  let photocopySales = 0;
  let onlineSales = 0;
  let stationerySales = 0;
  const uniqueDays = new Set<string>();

  records.forEach(s => {
    const d = (s.rawDate || s.date || '').substring(0, 10).trim();
    if (d) uniqueDays.add(d);

    const saleNet = s.grandTotal || (s.subtotal - (s.discount || 0)) || 0;
    netSales += saleNet;

    if (s.items && s.items.length > 0) {
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
    staffName,
    netSales,
    memoCount,
    workingDays: uniqueDays.size,
    photocopySales,
    photocopyCommission,
    onlineSales,
    onlineCommission,
    stationerySales,
    stationeryCommission,
    totalCommission
  };
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

  useEffect(() => {
    try {
      localStorage.removeItem('as_computer_staff_leaves');
    } catch {}
  }, []);

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

  const handleSetThisMonth = () => setSelectedMonth(currentMonthStr);

  const handleSetLastMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Month-filtered sales (across all staff)
  const monthSales = useMemo(() => {
    return sales.filter(s => {
      const rawDate = s.rawDate || s.date || '';
      return selectedMonth ? rawDate.startsWith(selectedMonth) : true;
    });
  }, [sales, selectedMonth]);

  // Filter sales for active selection (ALL or individual)
  const filteredSales = useMemo(() => {
    if (selectedStaff === 'ALL' || !selectedStaff) return monthSales;
    return monthSales.filter(
      s => (s.user || '').trim().toLowerCase() === selectedStaff.trim().toLowerCase()
    );
  }, [monthSales, selectedStaff]);

  const isAllStaff = selectedStaff === 'ALL';

  const stats = useMemo(
    () => computeCommissionStats(isAllStaff ? 'All Staff' : selectedStaff, filteredSales),
    [filteredSales, isAllStaff, selectedStaff]
  );

  // Per-staff breakdown for combined 1-page view
  const staffBreakdown = useMemo(() => {
    return staffList.map(staffName => {
      const staffRecords = monthSales.filter(
        s => (s.user || '').trim().toLowerCase() === staffName.trim().toLowerCase()
      );
      return computeCommissionStats(staffName, staffRecords);
    });
  }, [staffList, monthSales]);

  // Formatted Month Title e.g. "October-2026"
  const formattedMonthDisplay = useMemo(() => {
    if (!selectedMonth) return 'All Periods';
    return formatPeriodHeader('', '', selectedMonth);
  }, [selectedMonth]);

  const nowFormatted = formatInvoicePrintTimestamp(new Date());

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:block">
      <div className="print-modal-dialog bg-slate-900 border border-slate-700/80 text-slate-100 w-full max-w-5xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4 print:w-full print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:space-y-0">
        
        {/* Top Header Bar */}
        <div className="no-print flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <span>Staff Commission Report</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-100" />
              <span>Print Report / PDF</span>
            </button>
            <button 
              type="button"
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
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>SELECT STAFF & MONTH</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedStaff('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                  isAllStaff
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Staff (1 Page)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isAllStaff) setSelectedStaff(currentUser.username || staffList[0] || 'Md Abu Said');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                  !isAllStaff
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Individual Staff</span>
              </button>
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">SELECT STAFF</label>
              <select
                value={selectedStaff}
                onChange={e => setSelectedStaff(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Staff (Combined Report)</option>
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-3">
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">
                  ACTIVE PERIOD
                </span>
                <span className="text-xs font-black text-blue-300 truncate block mt-0.5">
                  {formattedMonthDisplay} • {isAllStaff ? 'All Staff' : selectedStaff}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Printable & Interactive Area */}
        <div className="print-page-container bg-slate-950/80 border border-slate-800/80 text-slate-100 p-5 sm:p-6 rounded-2xl print:bg-white print:text-slate-900 print:p-0 print:border-none print:shadow-none flex flex-col justify-start print:justify-between print:min-h-[248mm]">
          <div className="print-content-body space-y-4 print:space-y-3">
          
            {/* Printable Report Header */}
            <div className="hidden print:flex justify-between items-start border-b-2 border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 flex items-center justify-center flex-shrink-0 bg-transparent">
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
                    {isAllStaff
                      ? 'All Staff Sales Commission Summary Statement'
                      : 'Staff Sales Commission & Performance Statement'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Office: Bhai Bhai Super Market (2nd Floor), Paduar Bazar, Cumilla • Mobile: +88 01904 142370
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-slate-700 text-right">
                  <span className="text-xs font-black px-2.5 py-0.5 bg-slate-100 text-slate-900 rounded-md inline-block border border-slate-300">
                    {isAllStaff ? 'All Staff Combined' : selectedStaff}
                  </span> : Staff
                </p>
                <p className="text-xs font-semibold mt-1 text-slate-700 text-right">
                  <span className="font-black text-slate-900">{formattedMonthDisplay}</span> : Period
                </p>
              </div>
            </div>

            {/* 5 Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 print:gap-2">
              {/* Card 1: Net Sales */}
              <div className="bg-slate-900 border border-slate-700/80 p-3 print:p-2.5 rounded-2xl print:rounded-xl print:bg-slate-50 print:border-slate-300">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block print:text-slate-600">
                  NET SALES (AFTER DISC.)
                </span>
                <div className="text-xl sm:text-2xl print:text-lg font-black text-white font-tabular mt-1 print:text-slate-900">
                  {formatCurrency(stats.netSales)}
                </div>
                <span className="text-[11px] font-bold text-blue-400 block mt-0.5 print:text-blue-700">
                  {stats.memoCount} Memos
                </span>
              </div>

              {/* Card 2: Photocopy */}
              <div className="bg-slate-900 border border-blue-500/30 p-3 print:p-2.5 rounded-2xl print:rounded-xl print:bg-blue-50/50 print:border-blue-300">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block print:text-blue-800">
                  PHOTOCOPY (30%)
                </span>
                <div className="text-xl sm:text-2xl print:text-lg font-black text-blue-400 font-tabular mt-1 print:text-blue-800">
                  {formatCurrency(stats.photocopyCommission)}
                </div>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5 print:text-slate-600">
                  Sales: {formatCurrency(stats.photocopySales)}
                </span>
              </div>

              {/* Card 3: Online App */}
              <div className="bg-slate-900 border border-emerald-500/30 p-3 print:p-2.5 rounded-2xl print:rounded-xl print:bg-emerald-50/50 print:border-emerald-300">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block print:text-emerald-800">
                  ONLINE APP (50%)
                </span>
                <div className="text-xl sm:text-2xl print:text-lg font-black text-emerald-400 font-tabular mt-1 print:text-emerald-800">
                  {formatCurrency(stats.onlineCommission)}
                </div>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5 print:text-slate-600">
                  Sales: {formatCurrency(stats.onlineSales)}
                </span>
              </div>

              {/* Card 4: Total Commission (Executive Navy Highlight - Zero Gradient Leak) */}
              <div className="bg-blue-950 border border-blue-400/50 p-3 print:p-2.5 rounded-2xl print:rounded-xl text-white print:bg-slate-900 print:border-slate-900 print:text-white">
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block print:text-slate-300">
                  TOTAL COMMISSION
                </span>
                <div className="text-xl sm:text-2xl print:text-lg font-black text-white font-tabular mt-1 print:text-white">
                  {formatCurrency(stats.totalCommission)}
                </div>
                <span className="text-[10px] font-medium text-blue-200/80 block mt-0.5 print:text-slate-300">
                  Billed Sales Commission
                </span>
              </div>

              {/* Card 5: Working Days */}
              <div className="bg-slate-900 border border-amber-500/30 p-3 print:p-2.5 rounded-2xl print:rounded-xl col-span-2 sm:col-span-1 print:bg-amber-50/50 print:border-amber-300">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block print:text-amber-800">
                  WORKING DAYS
                </span>
                <div className="text-xl sm:text-2xl print:text-lg font-black text-amber-400 font-tabular mt-1 print:text-amber-800">
                  {stats.workingDays} Days
                </div>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5 print:text-slate-600">
                  Unique Days in Month
                </span>
              </div>
            </div>

            {/* Combined All-Staff Commission Summary Table (when ALL selected, fits cleanly on 1 page) */}
            {isAllStaff && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl print:rounded-xl overflow-hidden print:border print:border-slate-300 print:bg-white">
                <div className="px-4 py-2.5 print:py-2 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2 print:bg-slate-800 print:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400 print:text-white" />
                    <span className="text-xs font-black uppercase tracking-wider text-white print:text-white">
                      STAFF-WISE COMMISSION SUMMARY ({formattedMonthDisplay})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold print:text-slate-300">
                    {staffBreakdown.length} Staff Accounts
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs print:text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                        <th className="py-2 px-2.5 text-center w-9 border-r border-slate-800 print:border-slate-300">SL</th>
                        <th className="py-2 px-3 border-r border-slate-800 print:border-slate-300">STAFF NAME</th>
                        <th className="py-2 px-2 text-center border-r border-slate-800 print:border-slate-300">DAYS</th>
                        <th className="py-2 px-2 text-center border-r border-slate-800 print:border-slate-300">MEMOS</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-800 print:border-slate-300">PHOTO (30%)</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-800 print:border-slate-300">ONLINE (50%)</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-800 print:border-slate-300">STATIONERY</th>
                        <th className="py-2 px-3 text-right border-r border-slate-800 print:border-slate-300">NET SALES</th>
                        <th className="py-2 px-3 text-right">COMMISSION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-slate-200 font-medium">
                      {staffBreakdown.map((row, idx) => (
                        <tr key={row.staffName} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                          <td className="py-2 px-2.5 print:py-1.5 text-center border-r border-slate-800 text-slate-500 font-bold print:border-slate-300">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 print:py-1.5 border-r border-slate-800 font-bold text-white print:text-slate-900 print:border-slate-300">
                            {row.staffName}
                          </td>
                          <td className="py-2 px-2 print:py-1.5 text-center border-r border-slate-800 font-bold text-amber-400 font-tabular print:text-amber-800 print:border-slate-300">
                            {row.workingDays}
                          </td>
                          <td className="py-2 px-2 print:py-1.5 text-center border-r border-slate-800 font-bold text-slate-300 font-tabular print:text-slate-700 print:border-slate-300">
                            {row.memoCount}
                          </td>
                          <td className="py-2 px-2.5 print:py-1.5 text-right border-r border-slate-800 font-tabular text-blue-300 print:text-blue-800 print:border-slate-300">
                            <div className="font-bold">{formatCurrency(row.photocopyCommission)}</div>
                            <div className="text-[9px] text-slate-500 print:text-slate-500">({formatCurrency(row.photocopySales)})</div>
                          </td>
                          <td className="py-2 px-2.5 print:py-1.5 text-right border-r border-slate-800 font-tabular text-emerald-300 print:text-emerald-800 print:border-slate-300">
                            <div className="font-bold">{formatCurrency(row.onlineCommission)}</div>
                            <div className="text-[9px] text-slate-500 print:text-slate-500">({formatCurrency(row.onlineSales)})</div>
                          </td>
                          <td className="py-2 px-2.5 print:py-1.5 text-right border-r border-slate-800 font-tabular text-slate-400 print:text-slate-600 print:border-slate-300">
                            {formatCurrency(row.stationerySales)}
                          </td>
                          <td className="py-2 px-3 print:py-1.5 text-right border-r border-slate-800 font-bold font-tabular text-slate-200 print:text-slate-900 print:border-slate-300">
                            {formatCurrency(row.netSales)}
                          </td>
                          <td className="py-2 px-3 print:py-1.5 text-right font-black font-tabular text-white bg-blue-950/30 print:bg-slate-50 print:text-slate-950">
                            {formatCurrency(row.totalCommission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-700 bg-slate-950 font-black text-xs print:text-[11px] print:bg-slate-100 print:border-slate-400">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 print:py-1.5 text-right uppercase tracking-wider text-white print:text-slate-900 border-r border-slate-800 print:border-slate-300">
                          ALL STAFF TOTAL:
                        </td>
                        <td className="py-2.5 px-2 print:py-1.5 text-center text-amber-400 print:text-amber-800 font-tabular border-r border-slate-800 print:border-slate-300">
                          {stats.workingDays}
                        </td>
                        <td className="py-2.5 px-2 print:py-1.5 text-center text-slate-200 print:text-slate-900 font-tabular border-r border-slate-800 print:border-slate-300">
                          {stats.memoCount}
                        </td>
                        <td className="py-2.5 px-2.5 print:py-1.5 text-right text-blue-400 print:text-blue-800 font-tabular border-r border-slate-800 print:border-slate-300">
                          {formatCurrency(stats.photocopyCommission)}
                        </td>
                        <td className="py-2.5 px-2.5 print:py-1.5 text-right text-emerald-400 print:text-emerald-800 font-tabular border-r border-slate-800 print:border-slate-300">
                          {formatCurrency(stats.onlineCommission)}
                        </td>
                        <td className="py-2.5 px-2.5 print:py-1.5 text-right text-slate-400 print:text-slate-700 font-tabular border-r border-slate-800 print:border-slate-300">
                          {formatCurrency(stats.stationerySales)}
                        </td>
                        <td className="py-2.5 px-3 print:py-1.5 text-right text-white print:text-slate-950 font-tabular border-r border-slate-800 print:border-slate-300">
                          {formatCurrency(stats.netSales)}
                        </td>
                        <td className="py-2.5 px-3 print:py-1.5 text-right font-black text-sm text-blue-300 print:text-slate-950 font-tabular">
                          {formatCurrency(stats.totalCommission)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Category-Wise Sales & Commission Breakdown Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl print:rounded-xl overflow-hidden print:border print:border-slate-300 print:bg-white">
              <div className="px-4 py-2.5 print:py-2 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2 print:bg-slate-100 print:border-b-2 print:border-slate-300">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400 print:text-slate-800" />
                  <span className="text-xs font-black uppercase tracking-wider text-white print:text-slate-900">
                    CATEGORY-WISE SALES & COMMISSION BREAKDOWN
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 italic print:text-slate-600">
                  * Commission is calculated on net sales after discount (full commission applies even with due)
                </span>
              </div>

              <table className="w-full text-left text-xs print:text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider print:bg-slate-50 print:text-slate-800 print:border-slate-300">
                    <th className="py-2 px-3 text-center w-12 border-r border-slate-800 print:border-slate-300">SL</th>
                    <th className="py-2 px-4 border-r border-slate-800 print:border-slate-300">CATEGORY</th>
                    <th className="py-2 px-4 text-right border-r border-slate-800 print:border-slate-300">NET SALES AFTER DISCOUNT</th>
                    <th className="py-2 px-4 text-center border-r border-slate-800 print:border-slate-300">COMMISSION RATE</th>
                    <th className="py-2 px-4 text-right">COMMISSION AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200 font-medium">
                  {/* Row 1: Photocopy */}
                  <tr className="hover:bg-slate-800/40 print:hover:bg-transparent">
                    <td className="py-2 px-3 print:py-1.5 text-center border-r border-slate-800 text-slate-500 font-bold print:border-slate-300">1</td>
                    <td className="py-2 px-4 print:py-1.5 border-r border-slate-800 print:border-slate-300">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 print:bg-blue-50 print:text-blue-900 print:border-blue-200">
                        Photocopy
                      </span>
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-right font-black font-tabular text-slate-200 border-r border-slate-800 print:border-slate-300 print:text-slate-900">
                      {formatCurrency(stats.photocopySales)}
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-center border-r border-slate-800 print:border-slate-300">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                        30%
                      </span>
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-right font-black font-tabular text-blue-400 print:text-blue-800">
                      {formatCurrency(stats.photocopyCommission)}
                    </td>
                  </tr>

                  {/* Row 2: Online Application */}
                  <tr className="hover:bg-slate-800/40 print:hover:bg-transparent">
                    <td className="py-2 px-3 print:py-1.5 text-center border-r border-slate-800 text-slate-500 font-bold print:border-slate-300">2</td>
                    <td className="py-2 px-4 print:py-1.5 border-r border-slate-800 print:border-slate-300">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 print:bg-emerald-50 print:text-emerald-900 print:border-emerald-200">
                        Online Application
                      </span>
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-right font-black font-tabular text-slate-200 border-r border-slate-800 print:border-slate-300 print:text-slate-900">
                      {formatCurrency(stats.onlineSales)}
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-center border-r border-slate-800 print:border-slate-300">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                        50%
                      </span>
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-right font-black font-tabular text-emerald-400 print:text-emerald-800">
                      {formatCurrency(stats.onlineCommission)}
                    </td>
                  </tr>

                  {/* Row 3: Stationery Products */}
                  <tr className="hover:bg-slate-800/40 print:hover:bg-transparent">
                    <td className="py-2 px-3 print:py-1.5 text-center border-r border-slate-800 text-slate-500 font-bold print:border-slate-300">3</td>
                    <td className="py-2 px-4 print:py-1.5 border-r border-slate-800 print:border-slate-300">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 print:bg-amber-50 print:text-amber-900 print:border-amber-200">
                        Stationery Products
                      </span>
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-right font-black font-tabular text-slate-200 border-r border-slate-800 print:border-slate-300 print:text-slate-900">
                      {formatCurrency(stats.stationerySales)}
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-center border-r border-slate-800 print:border-slate-300">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 print:bg-slate-100 print:text-slate-600 print:border-slate-300">
                        0%
                      </span>
                    </td>
                    <td className="py-2 px-4 print:py-1.5 text-right font-black font-tabular text-slate-400 print:text-slate-600">
                      0
                    </td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-slate-700 bg-slate-950 font-black text-xs print:bg-slate-100 print:border-slate-400">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-4 print:py-2 text-right uppercase tracking-wider text-white print:text-slate-900 border-r border-slate-800 print:border-slate-300">
                      TOTAL:
                    </td>
                    <td className="py-2.5 px-4 print:py-2 text-right font-black text-sm text-white font-tabular border-r border-slate-800 print:border-slate-300 print:text-slate-950">
                      {formatCurrency(stats.netSales)}
                    </td>
                    <td className="py-2.5 px-4 print:py-2 text-center text-slate-500 border-r border-slate-800 print:border-slate-300">
                      --
                    </td>
                    <td className="py-2.5 px-4 print:py-2 text-right font-black text-base text-blue-400 font-tabular print:text-slate-950">
                      {formatCurrency(stats.totalCommission)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Report Footer - Print only, NO signatures, always stamps logged-in printing user */}
          <div className="hidden print:block pt-4">
            <ReportFooter
              reportTitle="Staff Commission Report"
              printTimestamp={nowFormatted}
              currentUser={currentUser.username}
              hideSignatures={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
