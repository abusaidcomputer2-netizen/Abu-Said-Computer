import React, { useState } from 'react';
import { X, Database, Download, Upload, Check, Server, FileCode, CheckCircle2 } from 'lucide-react';

interface MigrationModalProps {
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ onClose, showToast }) => {
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleDownloadMysqlSchema = () => {
    // Fetch schema file or trigger download
    window.open('/database/as_computer_mysql.sql', '_blank');
    showToast('Downloading MySQL schema file...', 'info');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) {
      showToast('Please paste valid JSON data to import!', 'warning');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(importJson);
    } catch (err: any) {
      showToast('Invalid JSON format! Please check the structure.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/migrate/import-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReport(data.report);
        showToast(data.message, 'success');
      } else {
        showToast(data.message || 'Import failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Server error during migration', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-cyan-500/40 text-slate-100 w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <span>Database Migration & cPanel Hosting Deployment</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Tabs: Deployment / MySQL Download & Google Sheets Importer */}
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
                <div>• Tables: users, customers, products, sales, sale_items, due_ledger, purchases, expenses, cash_closings</div>
              </div>
            </div>

            <a
              href="/database/as_computer_mysql.sql"
              download="as_computer_mysql.sql"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download MySQL Schema (.sql)
            </a>
          </div>

          {/* Card 2: cPanel Deployment Guide Summary */}
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

        {/* Google Sheets Data Importer */}
        <form onSubmit={handleImportSubmit} className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Upload className="w-4 h-4" />
            <span>Google Sheets Historical Data Importer</span>
          </div>
          <p className="text-xs text-slate-300">
            Paste exported JSON data from your existing Google Sheets database to automatically seed historical customers, products, and invoices without data loss.
          </p>

          <textarea
            rows={4}
            value={importJson}
            onChange={e => setImportJson(e.target.value)}
            placeholder='{ "customers": [{ "name": "...", "phone": "..." }], "products": [...], "sales": [...] }'
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
          />

          {report && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Import complete: {report.importedCustomers} customers, {report.importedProducts} products, {report.importedSales} sales imported.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isImporting}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Run Data Import & Validate
          </button>
        </form>
      </div>
    </div>
  );
};
