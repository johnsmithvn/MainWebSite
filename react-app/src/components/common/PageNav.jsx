// 📁 src/components/common/PageNav.jsx
// 📄 Phân trang gọn, nút 40px (dễ chạm). Trang đánh số từ 1.
// Điện thoại: "‹ Trang 3 / 42 ›" (bấm vào chữ để nhảy trang). Máy tính: các số trang quanh trang hiện tại + "…" để nhảy trang.

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const GAP = '…';

/** Danh sách số trang cần hiện, ví dụ [1, '…', 4, 5, 6, '…', 42] */
function pageItems(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(GAP);
    out.push(p);
  });
  return out;
}

const BTN =
  'min-w-[2.5rem] h-10 px-2 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
const IDLE =
  'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ' +
  'hover:bg-gray-100 dark:hover:bg-gray-700';
const ACTIVE = 'border border-transparent bg-blue-600 text-white shadow-sm';

/**
 * @param {number} page - Trang hiện tại (từ 1)
 * @param {number} totalPages
 * @param {(page: number) => void} onChange
 * @param {() => void} [onJump] - Mở hộp "Chuyển tới trang"
 */
export default function PageNav({ page, totalPages, onChange, onJump, className = '' }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className={`flex items-center justify-center gap-1.5 sm:gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Trang trước"
        className={`${BTN} ${IDLE} disabled:opacity-40 disabled:pointer-events-none`}
      >
        <FiChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Điện thoại */}
      <button
        type="button"
        onClick={onJump}
        disabled={!onJump}
        title="Chuyển tới trang…"
        className="sm:hidden h-10 px-3 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 tabular-nums"
      >
        Trang <b className="font-semibold text-gray-900 dark:text-white">{page}</b> / {totalPages}
      </button>

      {/* Máy tính */}
      <div className="hidden sm:flex items-center gap-1.5">
        {pageItems(page, totalPages).map((p, i) =>
          p === GAP ? (
            <button
              key={`gap-${i}`}
              type="button"
              onClick={onJump}
              disabled={!onJump}
              title="Chuyển tới trang…"
              aria-label="Chuyển tới trang…"
              className={`${BTN} text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800`}
            >
              {GAP}
            </button>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${BTN} tabular-nums ${p === page ? ACTIVE : IDLE}`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Trang sau"
        className={`${BTN} ${IDLE} disabled:opacity-40 disabled:pointer-events-none`}
      >
        <FiChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </nav>
  );
}
