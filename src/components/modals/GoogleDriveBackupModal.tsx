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
  HelpCircle
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
  const [lastReport, setLastReport] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'create' | 'sync' | 'unlink';
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
        showToast(`গুগল অ্যাকাউন্ট (${res.user.email}) সফলভাবে যুক্ত হয়েছে!`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    await googleLogout();
    onGoogleAuthChange(null, null);
    showToast('গুগল অ্যাকাউন্ট সাইন-আউট করা হয়েছে।', 'info');
  };

  const executeCreateAndSync = async () => {
    if (!googleToken) {
      showToast('প্রথমে গুগল দিয়ে সাইন-ইন করুন।', 'warning');
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
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'গুগল শিট তৈরি করা যায়নি।', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'সার্ভার এরর। শিট তৈরি ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeSyncNow = async () => {
    if (!googleToken) {
      showToast('প্রথমে গুগল দিয়ে সাইন-ইন করুন।', 'warning');
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
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'সিঙ্ক করা যায়নি।', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'সিঙ্ক ব্যর্থ হয়েছে।', 'error');
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
        showToast('গুগল ড্রাইভ শিট লিঙ্ক সফলভাবে বিচ্ছিন্ন করা হয়েছে।', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'লিঙ্ক বিচ্ছিন্ন করা যায়নি।', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copySheetUrl = () => {
    if (!linkedSheetUrl) return;
    navigator.clipboard.writeText(linkedSheetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('গুগল শিটের লিঙ্ক কপি করা হয়েছে!', 'success');
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
                আপনার গুগল ড্রাইভে স্বয়ংক্রিয় ক্লাউড ব্যাকআপ ও গুগল শিট ইন্টিগ্রেশন
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

        {/* Confirmation Modal Overlay (User Confirmation for Workspace API Operations) */}
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
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.type === 'create') executeCreateAndSync();
                  else if (confirmDialog.type === 'sync') executeSyncNow();
                  else if (confirmDialog.type === 'unlink') executeUnlink();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg cursor-pointer"
              >
                নিশ্চিত করুন (Confirm & Proceed)
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
              <h4 className="text-sm font-bold text-white">গুগল অ্যাকাউন্ট সংযুক্ত করুন</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                আপনার গুগল ড্রাইভে স্বয়ংক্রিয়ভাবে একটি সুরক্ষিত মাস্টার স্প্রেডশিট তৈরি করতে ও রিয়েল-টাইম ব্যাকআপ রাখতে সাইন-ইন করুন।
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
                <span>{isProcessing ? 'সাইন-ইন হচ্ছে...' : 'Sign in with Google'}</span>
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
                    <span>গুগল ড্রাইভে মাস্টার স্প্রেডশিট লিঙ্ক করা আছে</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                    রিয়েল-টাইম অটো ব্যাকআপ সক্রিয়
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
                      <span>গুগল ড্রাইভে দেখুন</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {lastBackupTime && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>সর্বশেষ ব্যাকআপ: {new Date(lastBackupTime).toLocaleString('bn-BD')}</span>
                    <span className="text-slate-500">স্বয়ংক্রিয় ক্লাউড সিঙ্ক</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        type: 'sync',
                        title: 'গুগল শিট ডাটা সিঙ্ক নিশ্চিতকরণ',
                        description: 'আপনার গুগল ড্রাইভে অবস্থিত "AS Computer - Shop Master Database" শিটে বর্তমান সমস্ত ডাটা (বিক্রয় খাতা, বাকির খাতা, স্টক, ইউজার) আপডেট করা হবে। আপনি কি এগিয়ে যেতে চান?'
                      });
                    }}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>{isProcessing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সমস্ত তথ্য শিটে সিঙ্ক করুন (Sync All Now)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        type: 'unlink',
                        title: 'শিট লিঙ্ক বিচ্ছিন্ন করার নিশ্চিতকরণ',
                        description: 'আপনি কি নিশ্চিত যে গুগল ড্রাইভের সাথে এই স্প্রেডশিটের সংযোগ বিচ্ছিন্ন করতে চান? ড্রাইভে থাকা শিটটি মুছে যাবে না, তবে স্বয়ংক্রিয় সিঙ্ক বন্ধ হবে।'
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
                  <h4 className="text-sm font-bold text-white">গুগল ড্রাইভে নতুন মাস্টার স্প্রেডশিট তৈরি করুন</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    আপনার গুগল ড্রাইভে সফটওয়্যারের সকল টেবিল (বিক্রয় খাতা, বাকির খাতা, স্টক, ইউজার ও কাস্টমার তালিকা) নিয়ে একটি স্বয়ংসম্পূর্ণ স্প্রেডশিট তৈরি ও ব্যাকআপ হবে।
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left text-[11px] pt-1">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">১. বিক্রয় খাতা</span>
                    <span className="text-[10px] text-slate-400">সকল ইনভয়েস ও মেমো</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">২. বাকির খাতা</span>
                    <span className="text-[10px] text-slate-400">কাস্টমার নামসহ দেনা-পাওনা</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">৩. স্টক তালিকা</span>
                    <span className="text-[10px] text-slate-400">মালের নাম, দাম ও সংখ্যা</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="font-bold text-white block">৪. ইউজার তালিকা</span>
                    <span className="text-[10px] text-slate-400">স্টাফ অ্যাকাউন্ট ও তথ্য</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      type: 'create',
                      title: 'গুগল ড্রাইভে মাস্টার স্প্রেডশিট তৈরির নিশ্চিতকরণ',
                      description: 'আপনার গুগল ড্রাইভের সাথে যুক্ত করে একটি নতুন স্প্রেডশিট তৈরি করা হবে এবং বর্তমান সকল বিক্রয়, বাকি, স্টক এবং ইউজার তথ্য ব্যাকআপ হিসেবে আপলোড করা হবে। আপনি কি সম্মতি দিচ্ছেন?'
                    });
                  }}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <FolderSync className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'প্রসেসিং হচ্ছে...' : 'গুগল ড্রাইভে স্প্রেডশিট তৈরি ও সম্পূর্ণ ব্যাকআপ নিন'}</span>
                </button>
              </div>
            )}

            {/* Last Report summary if any */}
            {lastReport && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>সর্বশেষ ব্যাকআপ রিপোর্ট:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                  <div>বিক্রয় খাতা: <strong className="text-white">{lastReport.salesCount}টি</strong></div>
                  <div>বাকির খাতা: <strong className="text-white">{lastReport.duesCount}টি</strong></div>
                  <div>স্টক আইটেম: <strong className="text-white">{lastReport.productsCount}টি</strong></div>
                  <div>কাস্টমার: <strong className="text-white">{lastReport.customersCount} জন</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Highlights */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 space-y-1 leading-relaxed">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>স্বয়ংক্রিয় ক্লাউড সিঙ্কের সুবিধা:</span>
          </div>
          <div>• নতুন কোনো মেমো তৈরি করলে বা বাকি পরিশোধ হলে তা সাথে সাথে গুগল শিটের সংশ্লিষ্ট পাতায় জমা হবে।</div>
          <div>• গুগল ড্রাইভের এই স্প্রেডশিট থেকে আপনি যেকোনো সময় এক্সেল ফাইল ডাউনলোড করতে পারবেন বা মোবাইল থেকেও দেখতে পারবেন।</div>
        </div>
      </div>
    </div>
  );
};
