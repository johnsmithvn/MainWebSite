// 📁 src/components/common/CardSkeleton.jsx
// 💀 Khung chờ (skeleton) có đúng hình ItemCard: cùng tỉ lệ ảnh, cùng khoảng cách, 2 dòng tên và 1 dòng phụ.
// Thay cho spinner che cả trang và khối xám cao cố định, để bố cục không nhảy khi dữ liệu về.

import { CARD_GRIDS } from '@/constants';
import { getContentType } from '@/config/contentTypes';

const BAR = 'rounded bg-gray-200 dark:bg-gray-700/80';

/**
 * Một card skeleton (cùng cấu trúc với ItemCard dạng lưới/slider).
 * @param {'manga'|'movie'|'music'|'media'} type
 * @param {'grid'|'slider'|'photo'} variant - photo: ô ảnh vuông không chữ (lưới Media)
 */
export function CardSkeleton({ type = 'manga', variant = 'grid', className = '' }) {
  if (variant === 'photo') {
    return <div className={`aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse ${className}`} aria-hidden="true" />;
  }

  const cfg = getContentType(type);
  return (
    <div className={`flex flex-col min-w-0 animate-pulse ${className}`} aria-hidden="true">
      <div className={`mt-1.5 ${cfg.ratio} rounded-lg bg-gray-200 dark:bg-gray-800`} />
      {/* Cùng cỡ chữ và chiều cao dòng với tên thật để chiều cao khớp tuyệt đối */}
      <div className="mt-2 text-[13px] sm:text-sm leading-[1.3] min-h-[2.6em] flex flex-col justify-center gap-1.5">
        <div className={`h-3 w-11/12 ${BAR}`} />
        <div className={`h-3 w-7/12 ${BAR}`} />
      </div>
      <div className="mt-0.5 min-h-[1.25rem] flex items-center">
        <div className={`h-2.5 w-5/12 ${BAR}`} />
      </div>
    </div>
  );
}

/** Lưới skeleton dùng cùng lưới với card thật (CARD_GRIDS), nên số cột và kích thước khớp nhau. */
export function CardGridSkeleton({ type = 'manga', count = 12, className = '' }) {
  const photo = type === 'media';
  return (
    <div className={`${photo ? CARD_GRIDS.media : CARD_GRIDS[getContentType(type).grid] || CARD_GRIDS.manga} ${className}`} role="status" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} type={type} variant={photo ? 'photo' : 'grid'} />
      ))}
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}

/** Danh sách skeleton cho chế độ xem dạng danh sách (cùng cấu trúc với ItemCard variant="list"). */
export function CardListSkeleton({ type = 'manga', count = 8, className = '' }) {
  const cfg = getContentType(type);
  return (
    <div className={`flex flex-col gap-1 ${className}`} role="status" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 sm:p-2.5 animate-pulse" aria-hidden="true">
          <div className={`flex-none ${cfg.listThumbWidth} ${cfg.ratio} rounded-md bg-gray-200 dark:bg-gray-800`} />
          <div className="flex-1 min-w-0">
            <div className={`h-3.5 w-2/3 ${BAR}`} />
            <div className={`h-3 w-1/3 mt-2.5 ${BAR}`} />
          </div>
        </div>
      ))}
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}

export default CardSkeleton;
