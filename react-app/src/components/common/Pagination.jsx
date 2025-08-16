// 📁 src/components/common/Pagination.jsx
// 📄 Pagination component with page navigation

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiMoreHorizontal } from 'react-icons/fi';
import Button from './Button';

const Pagination = ({ 
  currentPage = 0, 
  totalPages = 1, 
  onPageChange, 
  showInfo = false,
  totalItems = 0,
  itemsPerPage = 10,
  className = '',
  enableJump = false,
  center = false
}) => {
  if (totalPages <= 1) return null;

  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpInput, setJumpInput] = useState('');

  // ===== Helpers / small sub components (avoid duplication) =====
  const openJumpModal = useCallback(() => {
    setJumpInput('');
    setShowJumpModal(true);
  }, []);

  const PageNumberButton = ({ pageIndex }) => {
    const isActive = pageIndex === currentPage;
    return (
      <motion.button
        key={pageIndex}
        onClick={() => onPageChange(pageIndex)}
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {pageIndex + 1}
      </motion.button>
    );
  };

  const EllipsisButton = ({ title = 'Jump to page' }) => (
    <button
      type="button"
      onClick={openJumpModal}
      className="px-2 py-1 text-gray-500 hover:text-gray-300 transition-colors"
      title={title}
    >
      <FiMoreHorizontal className="w-4 h-4" />
    </button>
  );

  // (Inline jump input removed; only modal remains)

  // Modal jump submit
  const handleModalSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(jumpInput, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n - 1);
      setShowJumpModal(false);
      setJumpInput('');
    }
  };

  // Close modal on ESC
  useEffect(() => {
    if (!showJumpModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowJumpModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showJumpModal]);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);
      
      if (currentPage <= 2) {
        // Near beginning
        pages.push(1, 2, 3);
        if (totalPages > 4) pages.push('...');
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        // Near end
        if (totalPages > 4) pages.push('...');
        pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        // Middle
        pages.push('...');
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push('...');
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  const isLarge = totalPages > 20;
  const pageNumbers = isLarge ? [] : generatePageNumbers();
  const startItem = currentPage * itemsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

  const baseLayout = center ? 'justify-center' : 'justify-between';
  return (
    <div className={`flex flex-col sm:flex-row items-center ${baseLayout} space-y-4 sm:space-y-0 ${className}`}>
      {/* Info */}
      {showInfo && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          icon={FiChevronLeft}
          className="mr-2"
        >
          Previous
        </Button>

        {/* Page numbers + central jump (large mode) */}
        {isLarge ? (
          <div className="flex items-center space-x-1">
            {[0,1,2]
              .filter(p => p < totalPages)
              .map(p => <PageNumberButton key={p} pageIndex={p} />)}
            <EllipsisButton />
            {[totalPages-3, totalPages-2, totalPages-1]
              .filter(p => p >= 0 && p > 2 && p < totalPages)
              .filter((v,i,a) => a.indexOf(v) === i)
              .map(p => <PageNumberButton key={p} pageIndex={p} />)}
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return <EllipsisButton key={`ellipsis-${index}`} />;
              }
              return <PageNumberButton key={page} pageIndex={page} />;
            })}
          </div>
        )}

        {/* Next button */}
  <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="ml-2"
        >
          Next
          <FiChevronRight className="w-4 h-4 ml-1" />
        </Button>

  {/* Inline jump removed */}
      </div>
      {showJumpModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowJumpModal(false); }}
        >
          <div className="relative w-full max-w-sm bg-gray-900 text-gray-100 rounded-xl shadow-2xl ring-1 ring-white/10 overflow-hidden animate-in fade-in zoom-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold tracking-wide text-gray-200">Jump to page</h2>
              <button
                onClick={() => setShowJumpModal(false)}
                className="text-gray-400 hover:text-white transition-colors rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close"
              >✕</button>
            </div>
            <form onSubmit={handleModalSubmit} className="px-5 pt-4 pb-3 border-b border-white/5">
              <label className="block text-xs uppercase tracking-wider font-medium mb-1 text-gray-400">Page number</label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  placeholder={`1-${totalPages}`}
                  className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 appearance-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!jumpInput}
                >Go</button>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">Current: <span className="text-gray-300 font-medium">{currentPage + 1}</span> / {totalPages}</p>
            </form>
            {(() => {
              const total = totalPages;
              if (total <= 300) {
                return (
                  <div className="p-4 max-h-[45vh] overflow-y-auto custom-scrollbar grid grid-cols-6 gap-2 md:grid-cols-8 lg:grid-cols-10">
                    {Array.from({ length: total }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { onPageChange(i); setShowJumpModal(false); }}
                        className={`group relative h-9 rounded-md text-xs font-medium flex items-center justify-center transition-all border ${i === currentPage ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30' : 'bg-gray-800/70 border-gray-700 text-gray-300 hover:bg-gray-700/70 hover:text-white hover:border-gray-600'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                );
              }
              return (
                <div className="px-5 py-5 text-xs text-gray-400 space-y-3">
                  <p>Too many pages ({total}). Use input or quick jumps.</p>
                  <div className="flex flex-wrap gap-2">
                    {['1','5','10','25','50','100'].map(v => {
                      const jump = parseInt(v,10)-1;
                      if (jump >= total) return null;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => { onPageChange(jump); setShowJumpModal(false); }}
                          className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium border border-gray-700"
                        >{v}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-800/60 border-t border-white/5 text-[11px]">
              <button
                onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-xs font-medium text-gray-200"
              >← Prev</button>
              <button
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-xs font-medium text-gray-200"
              >Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagination;
