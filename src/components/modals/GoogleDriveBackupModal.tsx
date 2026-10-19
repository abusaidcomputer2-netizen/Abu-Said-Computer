import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ShieldCheck, 
  LogOut,
  FolderSync,
  Unlink,
  Link as LinkIcon,
  Code2,
  Trash2
} from 'lucide-react';
import { googleSignIn, googleLogout } from '../../services/googleAuth';
import { User } from 'firebase/auth';

interface GoogleDriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleUser: User | null;
  googleToken: string | null;
  onGoogleAuthChange: (user: User | null, token: string | null) => void;
  linkedSheetId: string;
  linkedSheetUrl: string;
  lastBackupTime: string;
  onBackupSuccess: (sheetId: string, sheetUrl: string, backupTime: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  isOpen,
  onClose,
  googleUser,
  googleToken,
  onGoogleAuthChange,
  linkedSheetId,
  linkedSheetUrl,
  lastBackupTime,
  onBackupSuccess,
  showToast
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [manualSheetInput, setManualSheetInput] = useState('');
  const [showAppsScript, setShowAppsScript] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'create' | 'sync' | 'unlink' | 'clear_all';
    title: string;
    description: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsProcessing(true);
    try {
      const res = await googleSignIn();
      if (res) {
        onGoogleAuthChange(res.user, res.accessToken);
        showToast(`Google Account (${res.user.email}) connected successfully!`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Google sign-in could not be completed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    await googleLogout();
    onGoogleAuthChange(null, null);
    showToast('Google account disconnected.', 'info');
  };

  const executeCreateAndSync = async () => {
    if (!googleToken) {
      showToast('Please sign in with Google first.', 'warning');
      return;
    }

    setConfirmDialog(null);
    setIsProcessing(true);
    setLastReport(null);
    try {
      const res = await fetch('/api/google-drive/create-and-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleToken}`
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLastReport(data.report);
        onBackupSuccess(data.report.spreadsheetId, data.report.spreadsheetUrl, data.report.syncedAt);
        showToast(data.message || 'Spreadsheet created and synced successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to create Google Spreadsheet.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error while creating spreadsheet.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeSyncNow = async () => {
    if (!googleToken) {
      showToast('Please sign in with Google first.', 'warning');
      return;
    }

    setConfirmDialog(null);
    setIsProcessing(true);
    try {
      const res = await fetch('/api/google-drive/sync-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleToken}`
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLastReport(data.report);
        onBackupSuccess(data.report.spreadsheetId, data.report.spreadsheetUrl, data.report.syncedAt);
        showToast(data.message || 'Spreadsheet synced successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to sync spreadsheet.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeUnlink = async () => {
    setConfirmDialog(null);
    setIsProcessing(true);
    try {
      const res = await fetch('/api/google-drive/unlink', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        onBackupSuccess('', '', '');
        showToast('Google Sheet unlinked successfully.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to unlink spreadsheet.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkExistingSheet = async () => {
    if (!manualSheetInput.trim()) {
      showToast('Please enter a Google Sheet URL or ID.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (googleToken) {
        headers['Authorization'] = `Bearer ${googleToken}`;
      }

      const res = await fetch('/api/google-drive/link-sheet', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sheetUrlOrId: manualSheetInput.trim() })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onBackupSuccess(data.linkedSheetId, data.linkedSheetUrl, new Date().toISOString());
        if (data.report) setLastReport(data.report);
        setManualSheetInput('');
        showToast('Google Sheet linked and verified successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to link Google Sheet.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error linking sheet.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeClearAllData = async () => {
    setConfirmDialog(null);
    setIsProcessing(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (googleToken) {
        headers['Authorization'] = `Bearer ${googleToken}`;
      }

      const res = await fetch('/api/database/clear-all', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.status === 'success') {
        localStorage.removeItem('as_computer_cached_bootstrap');
        showToast('All site and sheet records successfully cleared!', 'success');
        // Refresh page state
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        showToast(data.message || 'Failed to clear data.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing data clear.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copySheetUrl = () => {
    if (!linkedSheetUrl) return;
    navigator.clipboard.writeText(linkedSheetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Google Sheet link copied to clipboard!', 'success');
  };

  const copyAppsScript = () => {
    const code = `// Google Apps Script for AS Computer
// 1. Open Google Sheet > Extensions > Apps Script
// 2. Paste this code and deploy as Web App (Execute as: Me, Access: Anyone)
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    if (payload.action === 'add_sale') {
      var salesSheet = sheet.getSheetByName('Sales Record') || sheet.insertSheet('Sales Record');
      salesSheet.appendRow([
        payload.invoiceNo, payload.timestamp, payload.date, payload.user,
        payload.customer, payload.phone, payload.category, payload.desc,
        payload.subtotal, payload.discount, payload.grandTotal, payload.paid,
        payload.due, JSON.stringify(payload.items || [])
      ]);
    } else if (payload.action === 'add_payment') {
      var dueSheet = sheet.getSheetByName('Due Ledger') || sheet.insertSheet('Due Ledger');
      dueSheet.appendRow([
        payload.entryId, payload.date, payload.customer, payload.phone,
        'Payment Received', payload.desc, 0, payload.amount,
        payload.user, payload.timestamp
      ]);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(code);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
    showToast('Google Apps Script code copied to clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-blue-500/40 text-slate-100 w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4 relative">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
              <Cloud className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Google Drive Live Backup & Sync</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Automated Cloud Backup & Live Google Sheets Integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmDialog && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h4 className="text-base font-bold text-white">{confirmDialog.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.description}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.type === 'create') executeCreateAndSync();
                  else if (confirmDialog.type === 'sync') executeSyncNow();
                  else if (confirmDialog.type === 'unlink') executeUnlink();
                  else if (confirmDialog.type === 'clear_all') executeClearAllData();
                }}
                className={`px-5 py-2 ${
                  confirmDialog.type === 'clear_all'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                } text-white text-xs font-bold rounded-xl transition shadow-lg cursor-pointer`}
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        )}

        {/* Google Authentication Box */}
        {!googleUser ? (
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Connect Google Account</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sign in with Google to automatically create a master spreadsheet in your Google Drive and enable real-time cloud sync.
              </p>
            </div>

            {/* Official Google Sign-in Button */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-bold px-6 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isProcessing ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Account Card */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt={googleUser.displayName || 'Google User'} className="w-10 h-10 rounded-full border border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    {(googleUser.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>{googleUser.displayName || 'Google Account'}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">Connected</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{googleUser.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Disconnect Google Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>

            {/* Linked Google Spreadsheet Status */}
            {linkedSheetUrl ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Master Spreadsheet is Linked in Google Drive</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                    Real-time Auto Sync Active
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-slate-300 truncate">
                      AS Computer - Shop Master Database
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={copySheetUrl}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      title="Copy Google Sheet Link"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={linkedSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>Open in Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {lastBackupTime && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Last Synced: {new Date(lastBackupTime).toLocaleString('en-US')}</span>
                    <span className="text-slate-500">Auto Cloud Sync</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        type: 'sync',
                        title: 'Confirm Google Sheet Sync',
                        description: 'Current shop data (Sales, Due Ledger, Stock, Users, Customers, Expenses) will be synchronized with large spacious rows to your Google Spreadsheet. Continue?'
                      });
                    }}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'Syncing...' : 'Sync All Data to Sheet Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        type: 'unlink',
                        title: 'Confirm Unlink Spreadsheet',
                        description: 'Are you sure you want to unlink this spreadsheet from the app? The sheet in Google Drive will remain intact, but automatic sync will stop.'
                      });
                    }}
                    disabled={isProcessing}
                    className="p-2.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer border border-slate-800"
                    title="Unlink Sheet"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-blue-950/20 border border-blue-500/30 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Create Master Spreadsheet in Google Drive</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    A comprehensive spreadsheet with individual sheets (Sales Record, Due Ledger, Stock Inventory, Customers, Staff Users, Expenses) formatted with large spacious rows will be created in your Google Drive.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left text-[11px] pt-1">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">1. Sales Record</span>
                    <span className="text-[10px] text-slate-400">All memos & items</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">2. Due Ledger</span>
                    <span className="text-[10px] text-slate-400">Customer dues & credits</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">3. Stock Inventory</span>
                    <span className="text-[10px] text-slate-400">Products, prices, stock</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">4. Customers</span>
                    <span className="text-[10px] text-slate-400">Names, phones, addresses</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">5. Staff Users</span>
                    <span className="text-[10px] text-slate-400">Accounts & permissions</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">6. Expenses</span>
                    <span className="text-[10px] text-slate-400">Shop expense records</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      type: 'create',
                      title: 'Confirm Create Master Spreadsheet',
                      description: 'A new Master Spreadsheet will be created in your Google Drive and linked for real-time backup with large, clear rows. Proceed?'
                    });
                  }}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <FolderSync className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Processing...' : 'Create Master Spreadsheet in Google Drive'}</span>
                </button>
              </div>
            )}

            {/* Manual Link Existing Spreadsheet */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Or Link Existing Google Sheet (Paste URL or ID)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                  value={manualSheetInput}
                  onChange={(e) => setManualSheetInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleLinkExistingSheet}
                  disabled={isProcessing || !manualSheetInput.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0"
                >
                  Link Sheet
                </button>
              </div>
            </div>

            {/* Last Report summary if any */}
            {lastReport && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Latest Sync Report:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div>Sales: <strong className="text-white">{lastReport.salesCount}</strong></div>
                  <div>Dues: <strong className="text-white">{lastReport.duesCount}</strong></div>
                  <div>Products: <strong className="text-white">{lastReport.productsCount}</strong></div>
                  <div>Customers: <strong className="text-white">{lastReport.customersCount}</strong></div>
                  <div>Expenses: <strong className="text-white">{lastReport.expensesCount || 0}</strong></div>
                  <div>Staff: <strong className="text-white">{lastReport.usersCount}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Google Apps Script Option */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
          <button
            type="button"
            onClick={() => setShowAppsScript(!showAppsScript)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-slate-900/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2 font-bold">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>Google Apps Script Integration (Optional Webhook)</span>
            </div>
            <span className="text-[10px] text-blue-400">{showAppsScript ? 'Hide Script' : 'View Script'}</span>
          </button>
          {showAppsScript && (
            <div className="p-4 border-t border-slate-800 space-y-3 text-[11px] text-slate-300 bg-slate-950">
              <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1">
                <div className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permanent Google Apps Script Webhook Active</span>
                </div>
                <div className="text-[10.5px] font-mono text-slate-400 break-all select-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                  https://script.google.com/macros/s/AKfycbxpPzExy1dxtfFNivYU4rVuNGQLCSD8DQEnMGFYugplvK_i4NCZ4GuGYuIUZtbjhUyp4g/exec
                </div>
                <p className="text-[10px] text-slate-400">
                  All memo entries, due payments, and daily operations automatically sync to this script in the background.
                </p>
              </div>

              <p className="text-slate-400">
                To update or redeploy Google Apps Script in your spreadsheet, open <strong>Extensions &gt; Apps Script</strong>:
              </p>
              <button
                type="button"
                onClick={copyAppsScript}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {scriptCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{scriptCopied ? 'Copied!' : 'Copy Google Apps Script Code'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 space-y-1 leading-relaxed">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud Sync Highlights:</span>
          </div>
          <div>• Every new sale or payment receipt immediately updates the respective Google Sheet tab.</div>
          <div>• Spreadsheet row heights are formatted tall and spacious (36px data, 44px header) for effortless readability.</div>
          <div>• Download as Excel (.xlsx), PDF, or view from your mobile anytime via Google Drive.</div>
        </div>
      </div>
    </div>
  );
};
