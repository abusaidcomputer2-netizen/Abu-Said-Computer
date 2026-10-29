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
  className = ''
}) => {
  return (
    <div className={`report-footer-container mt-auto space-y-4 pt-4 ${className}`}>
      {/* Shop Info Block */}
      <div className="pt-3 border-t border-slate-300 text-left">
        <div className="font-black text-slate-900 tracking-wider uppercase text-xs sm:text-sm">
          ABU SAID COMPUTER
        </div>
        <div className="text-slate-600 font-medium text-[11px] sm:text-xs mt-0.5">
          Office: Bhai Bhai Super Market (2nd Floor), Paduar Bazar, Cumilla-3500
        </div>
        <div className="text-slate-700 text-[11px] sm:text-xs mt-0.5">
          Mobile: <span className="font-bold text-slate-900">+88 01904 142370</span>
        </div>
        <div className="text-slate-600 font-medium text-[11px] sm:text-xs mt-0.5">
          Email: abusaidcomputer2@gmail.com
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-6 pb-2 flex justify-between items-end text-center">
        {showCustomerSignature ? (
          <div className="w-52 sm:w-60 text-center">
            <div className="border-b border-dashed border-slate-400 pb-1 mb-1.5" />
            <div className="font-bold text-slate-800 text-[10px] sm:text-[11px] uppercase tracking-wider">
              {leftSignatureLabel}
            </div>
          </div>
        ) : (
          <div className="w-52 sm:w-60 text-center">
            <div className="border-b border-slate-400 pb-1 mb-1.5" />
            <div className="font-bold text-slate-800 text-[10px] sm:text-[11px] uppercase tracking-wider">
              {leftSignatureLabel}
            </div>
          </div>
        )}

        {showAuthorizedSignature && (
          <div className="w-52 sm:w-60 text-center">
            <div className="border-b-2 border-slate-900 pb-1 mb-1.5" />
            <div className="font-bold text-slate-900 text-[10px] sm:text-[11px] uppercase tracking-wider">
              {rightSignatureLabel}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Document Audit Meta Line */}
      <div className="print-doc-footer border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] sm:text-[11px] text-slate-600 font-medium">
        <div>
          {reportTitle} - Printed : {printTimestamp} {currentUser ? `• ${currentUser}` : ''}
        </div>
        <div className="font-bold text-slate-700 whitespace-nowrap">
          <span className="print:hidden">{pageInfo}</span>
          <span className="hidden print:inline auto-page-counter">Page <span className="page-number-val"></span></span>
        </div>
      </div>
    </div>
  );
};
