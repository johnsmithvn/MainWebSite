// 📁 src/components/common/CardActionSheet.jsx
// 📋 Bảng thao tác của card (yêu thích, thêm vào playlist, xoá...).
// Điện thoại: trượt từ dưới lên. Máy tính: hộp giữa màn hình. Luôn hiện tên đầy đủ ở đầu bảng.
// Dùng cùng hook useCardActions (nút ⋯, nhấn giữ, chuột phải).

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FiMoreHorizontal } from 'react-icons/fi';

const stop = (e) => e.stopPropagation();

/**
 * @param {object} props
 * @param {string} props.title - Tên đầy đủ của item
 * @param {string} [props.subtitle] - Dòng phụ, ví dụ đường dẫn
 * @param {Array<{key: string, label: string, icon?: Function, onClick: Function, danger?: boolean}|false|null>} props.actions
 * @param {Function} props.onClose
 */
export default function CardActionSheet({ title, subtitle, actions = [], onClose }) {
  const panelRef = useRef(null);
  // Chỉ nhận click bắt đầu bên trong bảng. Cú click "ma" khi nhả tay sau lúc nhấn giữ bị bỏ qua.
  const armedRef = useRef(false);
  const items = actions.filter(Boolean);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const guardClick = (e) => {
    if (!armedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      onPointerDown={() => { armedRef.current = true; }}
      onKeyDown={() => { armedRef.current = true; }}
      onClickCapture={guardClick}
      onClick={stop}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onTouchStart={stop}
      onTouchMove={stop}
      onTouchEnd={stop}
    >
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full sm:max-w-sm max-h-[85vh] overflow-y-auto outline-none
                   bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl
                   px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pt-4 sm:pb-3"
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600 sm:hidden" />
        <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-[15px] font-semibold leading-snug text-gray-900 dark:text-white [overflow-wrap:anywhere]">
            {title}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 [overflow-wrap:anywhere]">{subtitle}</p>
          )}
        </div>
        <ul className="mt-1 -mx-2">
          {items.map(({ key, label, icon: Icon, onClick, danger }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onClick?.();
                }}
                className={`flex w-full items-center gap-3.5 h-12 px-2 rounded-lg text-left text-[15px] transition-colors
                            hover:bg-gray-100 dark:hover:bg-gray-700
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                            ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}
              >
                {Icon && <Icon className="w-5 h-5 flex-none opacity-80" aria-hidden="true" />}
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>,
    document.body
  );
}

/** Nút ⋯ mở bảng thao tác. Vùng chạm 32px nhưng không làm dòng chữ cao thêm. */
export function CardMoreButton({ onClick, label = 'Thao tác', className = '' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={`flex-none inline-grid place-items-center w-8 h-8 -my-1.5 -mr-1.5 rounded-md transition-colors
                  text-gray-500 hover:bg-gray-100 hover:text-gray-800
                  dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
    >
      <FiMoreHorizontal className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}
