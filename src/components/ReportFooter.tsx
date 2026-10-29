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
    <div className={`report-footer-container flex-grow flex flex-col justify-between ${className}`}>
      {/* Top Part of Footer: Stays close to content/table with generous signing space */}
      <div className="space-y-3 sm:space-y-4 pt-3 print:pt-2">
        {/* Shop Info Block */}
        <div className="pt-2 sm:pt-3 print:pt-1 border-t border-slate-300 text-left">
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

      {/* Bottom Document Audit Meta Line: Anchored at the very bottom of the page */}
      <div className="print-doc-footer mt-auto border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] sm:text-[11px] text-slate-600 font-medium">
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
