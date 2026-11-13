import React from 'react';

interface ReportFooterProps {
  reportTitle: string;
  printTimestamp: string;
  currentUser?: string;
  showCustomerSignature?: boolean;
  showAuthorizedSignature?: boolean;
  leftSignatureLabel?: string;
  rightSignatureLabel?: string;
  pageInfo?: string;
  rightBadge?: React.ReactNode;
  className?: string;
}

export const ReportFooter: React.FC<ReportFooterProps> = ({
  reportTitle,
  printTimestamp,
  currentUser = 'Md Abu Said',
  showCustomerSignature = true,
  showAuthorizedSignature = true,
  leftSignatureLabel = 'CUSTOMER SIGNATURE',
  rightSignatureLabel = 'AUTHORIZED SIGNATURE',
  pageInfo = 'Page 1 of 1',
  rightBadge,
  className = ''
}) => {
  const footerLeftText = `${reportTitle} - Printed : ${printTimestamp}${currentUser ? ` • ${currentUser}` : ''}`
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  return (
    <div className={`report-footer-container flex-grow flex flex-col justify-between ${className}`}>
      <style>{`
        @page {
          @bottom-left {
            content: "${footerLeftText}";
            font-family: 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif;
            font-size: 9px;
            line-height: 1.3;
            font-weight: 500;
            color: #475569;
            border-top: 1px solid #cbd5e1;
            vertical-align: top;
            padding-top: 5px;
          }
          @bottom-center {
            content: "\\00a0";
            font-family: 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif;
            font-size: 9px;
            line-height: 1.3;
            border-top: 1px solid #cbd5e1;
            vertical-align: top;
            padding-top: 5px;
          }
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-family: 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif;
            font-size: 9px;
            line-height: 1.3;
            font-weight: 700;
            color: #334155;
            border-top: 1px solid #cbd5e1;
            vertical-align: top;
            padding-top: 5px;
            white-space: nowrap;
          }
        }
      `}</style>

      {/* Top Part of Footer: Stays close to content/table with generous signing space */}
      <div className="space-y-3 sm:space-y-4 pt-3 print:pt-2">
        {/* Shop Info Block + Right Stamp aligned on same row */}
        <div className="pt-2 sm:pt-3 print:pt-1 border-t border-slate-300 flex justify-between items-center gap-4 text-left">
          <div>
            <div className="font-black text-slate-900 tracking-wider uppercase text-xs sm:text-sm">
              ABU SAID COMPUTER
            </div>
            <div className="text-slate-600 font-medium text-[11px] sm:text-xs mt-0.5">
              Office: Bhai Bhai Super Market (2nd Floor), Paduar Bazar, Cumilla
            </div>
            <div className="text-slate-700 text-[11px] sm:text-xs mt-0.5">
              Mobile: <span className="font-bold text-slate-900">+88 01904 142370</span>
            </div>
            <div className="text-slate-600 font-medium text-[11px] sm:text-xs mt-0.5">
              Email: abusaidcomputer2@gmail.com
            </div>
          </div>
          {rightBadge && <div className="flex-shrink-0">{rightBadge}</div>}
        </div>

        {/* Signatures with generous space so signatures can be given easily */}
        <div className="pt-10 sm:pt-14 print:pt-12 pb-1.5 flex justify-between items-end text-center">
          {showCustomerSignature ? (
            <div className="w-52 sm:w-64 text-center">
              <div className="border-b border-dashed border-slate-400 pb-1 mb-1.5" />
              <div className="font-bold text-slate-800 text-[10px] sm:text-[11px] uppercase tracking-wider">
                {leftSignatureLabel}
              </div>
            </div>
          ) : (
            <div className="w-52 sm:w-64 text-center">
              <div className="border-b border-slate-400 pb-1 mb-1.5" />
              <div className="font-bold text-slate-800 text-[10px] sm:text-[11px] uppercase tracking-wider">
                {leftSignatureLabel}
              </div>
            </div>
          )}

          {showAuthorizedSignature && (
            <div className="w-52 sm:w-64 text-center">
              <div className="border-b-2 border-slate-900 pb-1 mb-1.5" />
              <div className="font-bold text-slate-900 text-[10px] sm:text-[11px] uppercase tracking-wider">
                {rightSignatureLabel}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Document Audit Meta Line: Shown in Screen Preview; in Print, @page margin-box renders this exact row on every page */}
      <div className="print-doc-footer mt-auto border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] sm:text-[11px] text-slate-600 font-medium print:hidden">
        <div>
          {reportTitle} - Printed : {printTimestamp} {currentUser ? `• ${currentUser}` : ''}
        </div>
        <div className="font-bold text-slate-700 whitespace-nowrap">
          {pageInfo || 'Page 1 of 1'}
        </div>
      </div>
    </div>
  );
};
