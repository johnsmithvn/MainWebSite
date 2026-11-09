// 📁 src/components/manga/MangaSeriesHeader.jsx
// 📖 Đầu trang của một bộ truyện (khi đang ở trong một thư mục): bìa, tên đầy đủ, số chương,
// nút "Đọc tiếp · <chương>" / "Đọc từ đầu" / "Đọc ngay", "Xem N ảnh", ❤ cho cả thư mục.

import { FiPlay, FiHeart, FiImage } from 'react-icons/fi';
import CardThumb from '@/components/common/CardThumb';
import { formatRelativeVi } from '@/utils/formatters';

const formatCount = (n) => Number(n || 0).toLocaleString('vi-VN');

/**
 * @param {object} props
 * @param {{name: string, cover?: string, chapterCount: number, pdfCount: number, imageCount: number}} props.info
 * @param {object|null} props.continueItem - Mục đọc gần nhất trong thư mục này (lịch sử Recent)
 * @param {{label: string, onClick: () => void}|null} props.primary - Nút chính
 * @param {(() => void)|null} props.onOpenImages - Mở ảnh nằm ngay trong thư mục (nếu có)
 * @param {boolean} props.isFavorite
 * @param {() => void} props.onToggleFavorite
 */
export default function MangaSeriesHeader({ info, continueItem, primary, onOpenImages, isFavorite, onToggleFavorite }) {
  const meta = [
    info.chapterCount > 0 && `${formatCount(info.chapterCount)} chương`,
    info.pdfCount > 0 && `${formatCount(info.pdfCount)} PDF`,
    info.imageCount > 0 && `${formatCount(info.imageCount)} ảnh`,
  ].filter(Boolean).join(' · ');

  return (
    <section className="flex gap-3 sm:gap-5 items-start mb-5 sm:mb-6" aria-label="Thông tin thư mục">
      <div className="relative w-24 sm:w-32 flex-none aspect-[5/7] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10">
        <CardThumb src={info.cover} alt={info.name} kind="manga" className="object-top" />
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <h1
          className="text-lg sm:text-2xl font-semibold leading-snug text-gray-900 dark:text-white line-clamp-3 [overflow-wrap:anywhere]"
          title={info.name}
        >
          {info.name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
          {meta}
          {continueItem?.lastViewed && (
            <span className={`block ${meta ? "sm:inline sm:before:content-['_·_']" : ''}`}>
              Đọc gần nhất {formatRelativeVi(continueItem.lastViewed)}
            </span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {primary && (
            <button
              type="button"
              onClick={primary.onClick}
              title={primary.label}
              className="inline-flex items-center gap-2 h-10 px-4 max-w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            >
              <FiPlay className="w-4 h-4 flex-none" aria-hidden="true" />
              <span className="truncate">{primary.label}</span>
            </button>
          )}
          {onOpenImages && (
            <button
              type="button"
              onClick={onOpenImages}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                         text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <FiImage className="w-4 h-4" aria-hidden="true" />
              Xem {formatCount(info.imageCount)} ảnh
            </button>
          )}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Bỏ yêu thích thư mục này' : 'Thêm thư mục này vào yêu thích'}
            title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            className="inline-grid place-items-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                       hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <FiHeart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-500' : 'text-gray-500 dark:text-gray-400'}`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
