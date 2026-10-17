import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Download, 
  Check, 
  Server, 
  FileCode, 
  CheckCircle2, 
  Link2, 
  RefreshCw, 
  AlertTriangle, 
  Table, 
  Info, 
  HelpCircle,
  Trash2,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

interface MigrationModalProps {
  onClose: () => void;
  onSyncSuccess?: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ onClose, onSyncSuccess, showToast }) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'cpanel'>('sheets');
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1-KTTPMKUbEZGyEVtTWOQwJZS8Ednit5svHaPW1tDB6g/edit');
  const [tabName, setTabName] = useState('');
  const [clearExisting, setClearExisting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<{ totalRows: number; headers: string[]; previewRows: string[][] } | null>(null);
  const [report, setReport] = useState<any>(null);

  // Preview Google Sheet data
  const handlePreview = async () => {
    if (!sheetUrl.trim()) {
      showToast('অনুগ্রহ করে একটি গুগল শিটের লিঙ্ক দিন!', 'warning');
      return;
    }

    setIsPreviewing(true);
    setPreviewData(null);
    try {
      const res = await fetch('/api/google-sheets/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim(), tabName: tabName.trim() || undefined })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPreviewData({
          totalRows: data.totalRows,
          headers: data.headers,
          previewRows: data.previewRows
        });
        showToast(`গুগল শিট ফেচ সফল হয়েছে! মোট ${data.totalRows}টি রো পাওয়া গেছে।`, 'success');
      } else {
        showToast(data.message || 'শিট ফেচ করা যায়নি।', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'সার্ভার ত্রুটি। শিট লিঙ্ক চেক করুন।', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Sync and Wipe/Update
  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      showToast('অনুগ্রহ করে একটি গুগল শিটের লিঙ্ক দিন!', 'warning');
      return;
    }

    setIsLoading(true);
    setReport(null);
    try {
      const res = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetUrl: sheetUrl.trim(),
          clearExisting,
          tabName: tabName.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReport(data.report);
        showToast(data.message, 'success');
        if (onSyncSuccess) {
          onSyncSuccess();
        }
      } else {
        showToast(data.message || 'ডাটা সিঙ্ক ব্যর্থ হয়েছে।', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'ডাটা সিঙ্ক চলাকালীন সার্ভার ত্রুটি।', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/40 text-slate-100 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Google Sheets Sync & Data Integration</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                গুগল শিট থেকে রিয়েল-টাইম ডাটা আপডেট এবং সিস্টেম ডাটাবেজ পরিচালনা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('sheets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'sheets'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Google Sheets Sync</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cpanel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'cpanel'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>MySQL & cPanel</span>
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'sheets' ? (
          /* Tab 1: Google Sheets Direct Sync */
          <div className="space-y-4">
            {/* Guide Card */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>গুগল শিটের লিঙ্ক সংযুক্ত করার সহজ নিয়মাবলী:</span>
              </div>
              <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px] leading-relaxed">
                <li>আপনার গুগল স্প্রেডশিটে ৪টি ট্যাব স্বয়ংক্রিয়ভাবে শনাক্ত ও সিঙ্ক হবে: <strong>বিক্রয় খাতা</strong> (Sales), <strong>বাকির খাতা</strong> (Due Ledger - কাস্টমারদের আসল নাম ও মোবাইলসহ), <strong>স্টক তালিকা</strong> (Stock), এবং <strong>ইউজার তালিকা</strong> (Staff Users)।</li>
                <li>গুগল শিটটির Share সেটিংসে <strong>"Anyone with the link can view"</strong> নিশ্চিত করুন।</li>
                <li>নিচের বাটনে ক্লিক করলে আপনার গুগল শিটের সম্পূর্ণ ডাটাবেজ নির্ভুলভাবে অ্যাপ্লিকেশনে সিঙ্ক ও আপডেট হয়ে যাবে।</li>
              </ul>
            </div>

            {/* Sync Form */}
            <form onSubmit={handleSyncSubmit} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Sheets Link (গুগল শিটের লিংক দিন):</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit?usp=sharing"
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={isPreviewing || !sheetUrl.trim()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>{isPreviewing ? 'চেক হচ্ছে...' : 'Preview'}</span>
                  </button>
                </div>
              </div>

              {/* Optional Tab Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Specific Sheet Tab Name (ঐচ্ছিক - নির্দিষ্ট ট্যাবের নাম):
                  </label>
                  <input
                    type="text"
                    value={tabName}
                    onChange={e => setTabName(e.target.value)}
                    placeholder="e.g. Sales, Sheet1, খরচ..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Wipe Existing Data Checkbox */}
                <div className="flex items-center gap-2.5 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 p-2 rounded-xl w-full">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={e => setClearExisting(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-500"
                    />
                    <div className="leading-tight">
                      <span>বর্তমান সকল ডাটা মুছে নতুন শিট দিয়ে রিপ্লেস করুন</span>
                      <span className="block text-[10px] text-amber-400/80 font-normal">
                        (Wipe existing entries & import fresh from Google Sheet)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table if Previewed */}
              {previewData && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5" />
                      শিটের কলাম তালিকা ({previewData.headers.length} Columns, {previewData.totalRows} Total Rows)
                    </span>
                    <span className="text-emerald-400">Ready to Sync</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {previewData.headers.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
                        {h || `Col ${i + 1}`}
                      </span>
                    ))}
                  </div>

                  {previewData.previewRows.length > 0 && (
                    <div className="mt-2 overflow-x-auto max-h-36 border border-slate-800 rounded-lg">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                          <tr>
                            {previewData.headers.slice(0, 7).map((h, i) => (
                              <th key={i} className="p-1.5 px-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {previewData.previewRows.map((r, ri) => (
                            <tr key={ri} className="text-slate-300">
                              {r.slice(0, 7).map((c, ci) => (
                                <td key={ci} className="p-1.5 px-2 font-mono whitespace-nowrap">{c}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Success Report Card */}
              {report && (
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>গুগল শিট থেকে ডাটাবেজ আপডেট সফলভাবে সম্পন্ন হয়েছে!</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">ইনভয়েস / মেমো</span>
                      <span className="font-black text-emerald-400 text-sm">{report.importedSales}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">নতুন কাস্টমার</span>
                      <span className="font-black text-blue-400 text-sm">{report.importedCustomers}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">বকেয়া লেজার এন্ট্রি</span>
                      <span className="font-black text-amber-400 text-sm">{report.importedDues}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">খরচের রেকর্ড</span>
                      <span className="font-black text-rose-400 text-sm">{report.importedExpenses}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Sync Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3.5 rounded-xl text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>গুগল শিট থেকে ডাটা সিঙ্ক ও প্রতিস্থাপন হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>গুগল শিট থেকে ডাটা আপডেট করুন (Sync & Replace All Data)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Tab 2: cPanel Deployment & MySQL Export */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Production MySQL Export */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Server className="w-4 h-4" />
                    <span>Production MySQL / MariaDB Schema</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Download the complete, normalized SQL DDL schema with Bengali UTF8MB4 support, indexes, and initial seeds ready for cPanel phpMyAdmin or direct MySQL import.
                  </p>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                    <div>• File: /database/as_computer_mysql.sql</div>
                    <div>• Engine: InnoDB, UTF8MB4_UNICODE_CI</div>
                    <div>• Tables: users, customers, products, sales, sale_items, due_ledger, expenses, cash_closings</div>
                  </div>
                </div>

                <a
                  href="/database/as_computer_mysql.sql"
                  download="as_computer_mysql.sql"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm text-center"
                >
                  <Download className="w-4 h-4" /> Download MySQL Schema (.sql)
                </a>
              </div>

              {/* Card 2: cPanel Deployment Steps */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <FileCode className="w-4 h-4" />
                  <span>cPanel Deployment Steps</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>Log in to your cPanel dashboard.</li>
                  <li>Under <strong>MySQL Databases</strong>, create a new database & user.</li>
                  <li>Open <strong>phpMyAdmin</strong> and import <code className="text-amber-300 font-mono">as_computer_mysql.sql</code>.</li>
                  <li>Upload the built application files to <code className="text-blue-300 font-mono">public_html</code>.</li>
                  <li>Configure Node.js app or PHP API bridge in cPanel Application Manager.</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
