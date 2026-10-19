import React from 'react';
import {
  Server,
  Download,
  FileCode,
  X,
  Database
} from 'lucide-react';

interface MigrationModalProps {
  onClose: () => void;
  onSyncSuccess?: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/40 text-slate-100 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Database Export & cPanel Migration</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Export MySQL database dump for cPanel deployment and offline archiving
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

        {/* cPanel Deployment & MySQL Export */}
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
                  Download the complete, normalized SQL DDL schema with indexes and initial seeds ready for cPanel phpMyAdmin or direct MySQL import.
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
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm text-center cursor-pointer"
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
      </div>
    </div>
  );
};
