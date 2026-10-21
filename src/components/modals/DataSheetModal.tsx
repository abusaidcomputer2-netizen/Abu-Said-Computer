import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Database, 
  HardDrive, 
  Cloud, 
  ExternalLink, 
  Download, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck,
  Table,
  ArrowUpRight
} from 'lucide-react';
import { SaleRecord, Customer, Product, ExpenseRecord, DueRecord } from '../../types';
import { formatCurrency, formatDateDisplay } from '../../utils/helpers';
import * as XLSX from 'xlsx';

interface DataSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleRecord[];
  customers: Customer[];
  products: Product[];
  expenses: ExpenseRecord[];
  dueLedger?: DueRecord[];
  linkedSheetUrl?: string;
  googleUser?: { email?: string | null; displayName?: string | null } | null;
  onOpenGoogleDriveBackup: () => void;
  onReload: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

type SheetTab = 'sales' | 'customers' | 'products' | 'due' | 'expenses';

export const DataSheetModal: React.FC<DataSheetModalProps> = ({
  isOpen,
  onClose,
  sales,
  customers,
  products,
  expenses,
  dueLedger = [],
  linkedSheetUrl,
  googleUser,
  onOpenGoogleDriveBackup,
  onReload,
  showToast
}) => {
  const [activeSheet, setActiveSheet] = useState<SheetTab>('sales');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filtered rows for active sheet
  const term = searchTerm.toLowerCase().trim();

  const filteredSales = sales.filter(s => 
    !term || 
    String(s.invoiceNo).includes(term) ||
    s.customer.toLowerCase().includes(term) ||
    (s.phone && s.phone.includes(term)) ||
    s.category.toLowerCase().includes(term) ||
    s.user.toLowerCase().includes(term)
  );

  const filteredCustomers = customers.filter(c => 
    !term ||
    c.name.toLowerCase().includes(term) ||
    (c.phone && c.phone.includes(term)) ||
    (c.address && c.address.toLowerCase().includes(term))
  );

  const filteredProducts = products.filter(p =>
    !term ||
    p.name.toLowerCase().includes(term) ||
    p.category.toLowerCase().includes(term)
  );

  const filteredExpenses = expenses.filter(e =>
    !term ||
    e.category.toLowerCase().includes(term) ||
    (e.desc && e.desc.toLowerCase().includes(term)) ||
    (e.expId && e.expId.toLowerCase().includes(term))
  );

  const filteredDue = dueLedger.filter(d =>
    !term ||
    d.customer.toLowerCase().includes(term) ||
    (d.phone && d.phone.includes(term)) ||
    (d.desc && d.desc.toLowerCase().includes(term))
  );

  // Export ALL sheets into a single master Excel (.xlsx) file with individual sheet tabs
  const handleExportAllSheetsExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const today = new Date().toISOString().split('T')[0];

      // 1. Sales Record
      const salesHeaders = ['SL', 'Invoice No', 'Date', 'Time', 'Customer Name', 'Mobile', 'Address', 'Category', 'Items Breakdown', 'Subtotal', 'Discount', 'Grand Total', 'Paid', 'Due', 'Operator'];
      const salesData = [
        salesHeaders,
        ...sales.map((s, idx) => [
          idx + 1,
          `AS-${s.invoiceNo}`,
          s.rawDate || s.date,
          s.timestamp ? (s.timestamp.split(' ')[1] || '') : '',
          s.customer || 'General Customer',
          s.phone || '',
          s.address || '',
          s.category,
          s.items?.map(it => `${it.name} (${it.qty}x${it.price})`).join('; ') || s.desc || '',
          s.subtotal,
          s.discount,
          s.grandTotal,
          s.paid,
          s.due,
          s.user
        ])
      ];
      const wsSales = XLSX.utils.aoa_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Record');

      // 2. Customers
      const customerHeaders = ['SL', 'Customer Name', 'Mobile', 'Address'];
      const customerData = [
        customerHeaders,
        ...customers.map((c, idx) => [
          idx + 1,
          c.name,
          c.phone || '',
          c.address || ''
        ])
      ];
      const wsCustomers = XLSX.utils.aoa_to_sheet(customerData);
      XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');

      // 3. Products / Stock
      const productHeaders = ['SL', 'Category', 'Product / Service Name', 'Selling Price', 'Cost Price', 'In Stock Qty', 'Low Stock Limit'];
      const productData = [
        productHeaders,
        ...products.map((p, idx) => [
          idx + 1,
          p.category,
          p.name,
          p.price,
          p.costPrice,
          p.stockQty !== null && p.stockQty !== undefined ? p.stockQty : 'Unlimited / Service',
          p.lowStockLimit || 0
        ])
      ];
      const wsProducts = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Stock Inventory');

      // 4. Due Ledger
      const dueHeaders = ['Entry ID', 'Date', 'Customer Name', 'Mobile', 'Transaction Type', 'Description', 'Due (Debit)', 'Paid (Credit)', 'Operator'];
      const dueData = [
        dueHeaders,
        ...dueLedger.map((d, idx) => [
          d.id || `DUE-${idx + 1}`,
          d.date,
          d.customer,
          d.phone || '',
          d.type,
          d.desc,
          d.due,
          d.paid,
          d.user
        ])
      ];
      const wsDue = XLSX.utils.aoa_to_sheet(dueData);
      XLSX.utils.book_append_sheet(wb, wsDue, 'Due Ledger');

      // 5. Expenses
      const expenseHeaders = ['Expense ID', 'Date', 'Category', 'Description', 'Amount', 'Staff'];
      const expenseData = [
        expenseHeaders,
        ...expenses.map((e, idx) => [
          e.expId || `EXP-${e.id || idx + 1}`,
          e.date,
          e.category,
          e.desc || '',
          e.amount,
          e.user || 'Staff'
        ])
      ];
      const wsExpenses = XLSX.utils.aoa_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

      const fileName = `AS_Computer_Master_Database_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast(`${fileName} (All 5 Sheets) downloaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Failed to export all sheets to Excel:', err);
      showToast('Export failed: ' + (err.message || 'Error creating spreadsheet'), 'error');
    }
  };

  // Export all sheets combined into single file (.csv)
  const handleExportAllSheetsCsv = () => {
    const today = new Date().toISOString().split('T')[0];
    const sections: string[] = [];

    // Sales
    sections.push('=== SHEET 1: SALES RECORD ===');
    sections.push(['SL', 'Invoice No', 'Date', 'Time', 'Customer Name', 'Mobile', 'Category', 'Items Breakdown', 'Subtotal', 'Discount', 'Grand Total', 'Paid', 'Due', 'Operator'].map(h => `"${h}"`).join(','));
    sales.forEach((s, idx) => {
      sections.push([
        idx + 1,
        `AS-${s.invoiceNo}`,
        s.rawDate || s.date,
        s.timestamp ? (s.timestamp.split(' ')[1] || '') : '',
        s.customer || 'General Customer',
        s.phone || '',
        s.category,
        s.items?.map(it => `${it.name} (${it.qty}x${it.price})`).join('; ') || s.desc || '',
        s.subtotal,
        s.discount,
        s.grandTotal,
        s.paid,
        s.due,
        s.user
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    });

    // Customers
    sections.push('\r\n=== SHEET 2: CUSTOMERS DIRECTORY ===');
    sections.push(['SL', 'Customer Name', 'Mobile', 'Address'].map(h => `"${h}"`).join(','));
    customers.forEach((c, idx) => {
      sections.push([idx + 1, c.name, c.phone || '', c.address || ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    });

    // Products
    sections.push('\r\n=== SHEET 3: STOCK INVENTORY ===');
    sections.push(['SL', 'Category', 'Product / Service Name', 'Selling Price', 'Cost Price', 'In Stock Qty', 'Low Stock Limit'].map(h => `"${h}"`).join(','));
    products.forEach((p, idx) => {
      sections.push([idx + 1, p.category, p.name, p.price, p.costPrice, p.stockQty ?? 'Unlimited', p.lowStockLimit || 0].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    });

    // Due Ledger
    sections.push('\r\n=== SHEET 4: DUE LEDGER ===');
    sections.push(['Entry ID', 'Date', 'Customer Name', 'Mobile', 'Transaction Type', 'Description', 'Due (Debit)', 'Paid (Credit)', 'Operator'].map(h => `"${h}"`).join(','));
    dueLedger.forEach((d, idx) => {
      sections.push([d.id || `DUE-${idx + 1}`, d.date, d.customer, d.phone || '', d.type, d.desc, d.due, d.paid, d.user].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    });

    // Expenses
    sections.push('\r\n=== SHEET 5: EXPENSES ===');
    sections.push(['Expense ID', 'Date', 'Category', 'Description', 'Amount', 'Staff'].map(h => `"${h}"`).join(','));
    expenses.forEach((e, idx) => {
      sections.push([e.expId || `EXP-${e.id || idx + 1}`, e.date, e.category, e.desc || '', e.amount, e.user || 'Staff'].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = '\uFEFF' + sections.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AS_Computer_All_Sheets_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`AS_Computer_All_Sheets_${today}.csv (All Sheets) downloaded successfully!`, 'success');
  };

  return (
    <div className="no-print print:hidden fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/30 text-slate-100 w-full max-w-6xl rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-2 sm:my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Live Data Sheets & Database Records
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
                  Live Database
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Real-time records from server SQLite database & Google Sheets integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {linkedSheetUrl && (
              <a
                href={linkedSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Open live linked Google Sheet"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Google Sheet</span>
              </a>
            )}

            <button
              type="button"
              onClick={onOpenGoogleDriveBackup}
              className={`px-3 py-1.5 ${
                googleUser
                  ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              } rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer`}
              title="Manage Google Account & Drive Sync Settings"
            >
              <Cloud className="w-3.5 h-3.5 text-amber-300" />
              <span>{googleUser ? (googleUser.email || 'Google Drive Sync') : 'Connect Google Sheet'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportAllSheetsCsv}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Download all sheets combined in a single CSV file (Sales, Customers, Stock, Due, Expenses)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export CSV (All Sheets)</span>
            </button>

            <button
              type="button"
              onClick={handleExportAllSheetsExcel}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Download Master Spreadsheet (.xlsx) with all individual sheet tabs"
            >
              <Download className="w-3.5 h-3.5 text-blue-300" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onReload}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Storage Architecture Info Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-white flex items-center gap-1.5">
                <span>Primary Storage:</span>
                <span className="text-emerald-400 font-mono text-[11px]">Server SQLite Database</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Every sale memo, customer, product, and expense is saved permanently on disk inside <code className="bg-slate-900 px-1 py-0.2 rounded text-emerald-300 font-mono">as_computer.db</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <HardDrive className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-white flex items-center gap-1.5">
                <span>Local Redundancy:</span>
                <span className="text-blue-400 font-mono text-[11px]">Browser Cache Sync</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Indexed in browser storage for instant response times and offline persistence even if internet connection fluctuates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Cloud className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-white flex items-center gap-1.5">
                <span>Cloud Integration:</span>
                <span className="text-purple-400 font-mono text-[11px]">
                  {googleUser ? 'Google Drive Active' : (linkedSheetUrl ? 'Google Sheet Linked' : 'Google Drive Ready')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {googleUser ? (
                  <>Connected: <span className="text-emerald-400 font-medium">{googleUser.email}</span>. Synced with your Google Drive spreadsheet.</>
                ) : (
                  <>Click "Connect Google Sheet" to sign in with your Gmail and sync with your Google Drive.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Sheet Tabs & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => { setActiveSheet('sales'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSheet === 'sales'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Sales & Invoices</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-black">
                {sales.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSheet('customers'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSheet === 'customers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Customers</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-black">
                {customers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSheet('products'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSheet === 'products'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Products & Stock</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-black">
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSheet('due'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSheet === 'due'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Due Ledger</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-black">
                {dueLedger.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSheet('expenses'); setSearchTerm(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSheet === 'expenses'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>Expenses</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 font-black">
                {expenses.length}
              </span>
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={`Search in ${activeSheet} sheet...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>
        </div>

        {/* Main Sheet Table View */}
        <div className="flex-grow overflow-auto border border-slate-800 rounded-2xl bg-slate-950">
          {activeSheet === 'sales' && (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 text-center w-12">SL</th>
                  <th className="p-2.5">Invoice</th>
                  <th className="p-2.5">Date & Time</th>
                  <th className="p-2.5">Customer & Phone</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Items Breakdown</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                  <th className="p-2.5 text-right">Discount</th>
                  <th className="p-2.5 text-right font-black">Total</th>
                  <th className="p-2.5 text-right text-emerald-400">Paid</th>
                  <th className="p-2.5 text-right text-rose-400">Due</th>
                  <th className="p-2.5">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-500 font-medium">
                      No sales records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-2.5 text-center text-slate-500 font-bold font-tabular">{idx + 1}</td>
                      <td className="p-2.5 font-black text-amber-400 whitespace-nowrap">#{s.invoiceNo}</td>
                      <td className="p-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                        <div>{formatDateDisplay(s.rawDate || s.date)}</div>
                        <div className="text-[10px] text-slate-500">{s.timestamp ? (s.timestamp.split(' ')[1] || '') : ''}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-bold text-white">{s.customer}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{s.phone}</div>
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[10px] font-bold">
                          {s.category}
                        </span>
                      </td>
                      <td className="p-2.5 max-w-xs truncate text-[11px] text-slate-300">
                        {s.items?.map(it => `${it.name} (x${it.qty})`).join(', ') || s.desc || '-'}
                      </td>
                      <td className="p-2.5 text-right font-tabular">{formatCurrency(s.subtotal)}</td>
                      <td className="p-2.5 text-right font-tabular text-red-400">{s.discount > 0 ? `-${formatCurrency(s.discount)}` : '0'}</td>
                      <td className="p-2.5 text-right font-black font-tabular text-white">{formatCurrency(s.grandTotal)}</td>
                      <td className="p-2.5 text-right font-black font-tabular text-emerald-400">{formatCurrency(s.paid)}</td>
                      <td className="p-2.5 text-right font-black font-tabular text-rose-400">{s.due > 0 ? formatCurrency(s.due) : '-'}</td>
                      <td className="p-2.5 text-slate-400 text-[11px] font-semibold">{s.user}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeSheet === 'customers' && (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-center w-14">SL</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Mobile Number</th>
                  <th className="p-3">Address / Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                      No customer records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-center text-slate-500 font-bold font-tabular">{idx + 1}</td>
                      <td className="p-3 font-black text-white text-sm">{c.name}</td>
                      <td className="p-3 font-mono font-bold text-blue-400">{c.phone || '01904142370'}</td>
                      <td className="p-3 text-slate-400">{c.address || 'Paduar Bazar, Cumilla'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeSheet === 'products' && (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-center w-14">SL</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Product / Service Name</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3 text-right">Cost Price</th>
                  <th className="p-3 text-center">In-Stock Qty</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                      No product records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const hasStock = p.stockQty !== null && p.stockQty !== undefined;
                    const isLow = hasStock && (p.stockQty || 0) <= (p.lowStockLimit || 5);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-center text-slate-500 font-bold font-tabular">{idx + 1}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[10px] font-bold">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3 font-black text-white text-sm">{p.name}</td>
                        <td className="p-3 text-right font-black font-tabular text-emerald-400">
                          Tk {formatCurrency(p.price)}
                        </td>
                        <td className="p-3 text-right font-tabular text-slate-400">
                          Tk {formatCurrency(p.costPrice)}
                        </td>
                        <td className="p-3 text-center font-black font-tabular">
                          {hasStock ? (
                            <span className={isLow ? 'text-rose-400' : 'text-white'}>
                              {p.stockQty}
                            </span>
                          ) : (
                            <span className="text-slate-500">Service</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {hasStock ? (
                            isLow ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                In Stock
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeSheet === 'due' && (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3">Entry ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right text-rose-400">Due (Debit)</th>
                  <th className="p-3 text-right text-emerald-400">Paid (Credit)</th>
                  <th className="p-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredDue.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                      No due ledger records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredDue.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-amber-400">{d.id || `DUE-${idx + 1}`}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{formatDateDisplay(d.date)}</td>
                      <td className="p-3 font-bold text-white">{d.customer}</td>
                      <td className="p-3 font-mono text-slate-400">{d.phone}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          {d.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{d.desc || '-'}</td>
                      <td className="p-3 text-right font-black font-tabular text-rose-400">
                        {d.due > 0 ? `Tk ${formatCurrency(d.due)}` : '-'}
                      </td>
                      <td className="p-3 text-right font-black font-tabular text-emerald-400">
                        {d.paid > 0 ? `Tk ${formatCurrency(d.paid)}` : '-'}
                      </td>
                      <td className="p-3 text-slate-400">{d.user}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeSheet === 'expenses' && (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3">Expense ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                      No expense records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-amber-400">{e.expId || `EXP-${e.id}`}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap">{formatDateDisplay(e.date)}</td>
                      <td className="p-3 font-bold text-white">{e.category}</td>
                      <td className="p-3 text-slate-400">{e.desc || '-'}</td>
                      <td className="p-3 text-right font-black font-tabular text-rose-400">
                        Tk {formatCurrency(e.amount)}
                      </td>
                      <td className="p-3 text-slate-400">{e.user || 'Staff'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Summary Bar */}
        <div className="flex justify-between items-center text-xs text-slate-400 pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Abu Said Computer</span>
            <span>•</span>
            <span>Total Records in Active Sheet: <strong className="text-white font-tabular">
              {activeSheet === 'sales' && filteredSales.length}
              {activeSheet === 'customers' && filteredCustomers.length}
              {activeSheet === 'products' && filteredProducts.length}
              {activeSheet === 'due' && filteredDue.length}
              {activeSheet === 'expenses' && filteredExpenses.length}
            </strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>All changes automatically saved to SQLite</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
