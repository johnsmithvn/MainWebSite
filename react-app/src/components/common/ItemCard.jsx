// 📁 src/components/common/ItemCard.jsx
// 🃏 Card dùng chung cho Manga, Movie, Music, Media (lưới, slider và dạng danh sách).
// Chỉ lo phần hiển thị + bảng thao tác; việc mở item và các thao tác do lớp bọc theo loại truyền vào
// (MangaCard, MovieCard, MusicCard, UniversalCard...). Quy tắc: docs/CARD-REDESIGN-PROPOSAL.md mục 3.
//
// - Không nền trắng, không bóng: ảnh bo 8px có viền mờ, chữ nằm trên nền trang.
// - Thư mục có mép xếp chồng phía trên ảnh.
// - Tối đa 2 badge: góc trên trái (trạng thái), góc dưới phải (số liệu); ❤ chỉ là dấu khi đã thích.
// - Tên 2 dòng, luôn giữ chỗ 2 dòng; dòng phụ 1 dòng; nút ⋯ (hoặc nhấn giữ / chuột phải) mở bảng thao tác.

import { FiHeart, FiPlay } from 'react-icons/fi';
import CardThumb from '@/components/common/CardThumb';
import CardActionSheet, { CardMoreButton } from '@/components/common/CardActionSheet';
import useCardActions from '@/hooks/useCardActions';
import { getContentType } from '@/config/contentTypes';

const BADGE_TONES = {
  dark: 'bg-black/60 text-white',
  blue: 'bg-blue-600/90 text-white',
  gold: 'bg-amber-500 text-white',
  silver: 'bg-slate-400 text-white',
  bronze: 'bg-orange-700/90 text-white',
};

/** badge: chuỗi, hoặc { text, tone, icon } */
function Badge({ badge, className = '' }) {
  if (!badge) return null;
  const { text, tone = 'dark', icon: Icon } = typeof badge === 'object' && !Array.isArray(badge) && badge.text !== undefined
    ? badge
    : { text: badge };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[10.5px] sm:text-[11px] font-semibold leading-none
                  whitespace-nowrap tabular-nums backdrop-blur-sm pointer-events-none ${BADGE_TONES[tone] || BADGE_TONES.dark} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
      {text}
    </span>
  );
}

/**
 * @param {object} props
 * @param {'manga'|'movie'|'music'|'media'} props.type
 * @param {string} props.title - Tên đầy đủ (tooltip, bảng thao tác)
 * @param {string} [props.displayTitle] - Tên hiển thị (ví dụ đã bỏ đuôi file)
 * @param {string|string[]} [props.thumbnail]
 * @param {boolean} [props.isFolder] - Có mép xếp chồng
 * @param {string} [props.thumbKind] - Biểu tượng ô dự phòng (mặc định theo loại; 'folder' cho thư mục)
 * @param {React.ReactNode} [props.subtitle]
 * @param {string|object} [props.badgeTopLeft]
 * @param {string|object} [props.badgeBottomRight]
 * @param {string} [props.statusLabel] - Ví dụ "Đang đọc": badge xanh + viền xanh
 * @param {boolean} [props.favorite] - Hiện dấu ❤
 * @param {boolean} [props.playable] - Hiện ▶ khi rê chuột
 * @param {() => void} props.onOpen
 * @param {Array} [props.actions] - Thao tác trong bảng ⋯
 * @param {string} [props.sheetSubtitle] - Dòng phụ trong bảng thao tác (thường là đường dẫn)
 * @param {'grid'|'slider'|'list'} [props.variant]
 */
export default function ItemCard({
  type = 'manga',
  title = '',
  displayTitle,
  thumbnail,
  isFolder = false,
  thumbKind,
  subtitle,
  badgeTopLeft,
  badgeBottomRight,
  statusLabel,
  favorite = false,
  playable = false,
  onOpen,
  actions = [],
  sheetSubtitle,
  variant = 'grid',
  className = '',
}) {
  const cfg = getContentType(type);
  const { open: actionsOpen, openSheet, closeSheet, pressHandlers } = useCardActions();
  const shown = displayTitle ?? title;
  const kind = thumbKind || (isFolder ? 'folder' : cfg.thumbKind);
  const visibleActions = actions.filter(Boolean);
  const topLeft = statusLabel ? { text: statusLabel, tone: 'blue' } : badgeTopLeft;

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen?.();
    }
  };

  const sheet = actionsOpen && (
    <CardActionSheet title={title} subtitle={sheetSubtitle} actions={visibleActions} onClose={closeSheet} />
  );

  const ring = statusLabel
    ? 'ring-2 ring-blue-500'
    : 'ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-2 group-hover:ring-blue-500/70';

  if (variant === 'list') {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          aria-label={title}
          onClick={() => onOpen?.()}
          onKeyDown={handleKeyDown}
          {...pressHandlers}
          className={`card-pressable group flex items-center gap-3 p-2 sm:p-2.5 rounded-xl cursor-pointer transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                      ${statusLabel ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800/70'} ${className}`}
        >
          <div className={`relative flex-none ${cfg.listThumbWidth} ${cfg.ratio} rounded-md overflow-hidden bg-gray-200 dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10`}>
            <CardThumb src={thumbnail} alt={title} kind={kind} className={cfg.objectPosition} />
            {badgeBottomRight && <Badge badge={badgeBottomRight} className="absolute bottom-1 right-1 z-[2] !text-[10px] !px-1 !py-0.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm sm:text-[15px] font-medium leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 [overflow-wrap:anywhere]
                         group-hover:text-blue-600 dark:group-hover:text-blue-400"
              title={title}
            >
              {shown}
            </h3>
            <div className="mt-0.5 flex items-center gap-2 min-w-0 text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">
              {statusLabel && <span className="flex-none font-semibold text-blue-600 dark:text-blue-400">{statusLabel}</span>}
              <span className="min-w-0 flex items-center gap-1 truncate">{subtitle}</span>
            </div>
          </div>
          {favorite && <FiHeart className="flex-none w-4 h-4 fill-current text-rose-500" aria-label="Đã thích" />}
          {visibleActions.length > 0 && <CardMoreButton onClick={openSheet} className="!my-0 !mr-0" />}
        </div>
        {sheet}
      </>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={title}
        onClick={() => onOpen?.()}
        onKeyDown={handleKeyDown}
        {...pressHandlers}
        className={`card-pressable group relative flex flex-col min-w-0 cursor-pointer rounded-lg
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4
                    focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-900 ${className}`}
      >
        {/* Mép xếp chồng cho thư mục; luôn chừa chỗ (mt-1.5) để các hàng thẳng nhau */}
        <div className={`relative mt-1.5 ${isFolder ? 'item-card-stack' : ''}`}>
          <div className={`relative z-[1] ${cfg.ratio} rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 transition-shadow ${ring}`}>
            <CardThumb src={thumbnail} alt={title} kind={kind} className={cfg.objectPosition} />
            {playable && (
              <span
                className="absolute inset-0 z-[2] grid place-items-center bg-black/30 text-white opacity-0 group-hover:opacity-100
                           transition-opacity pointer-events-none [@media(hover:none)]:hidden"
                aria-hidden="true"
              >
                <FiPlay className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg fill-current" />
              </span>
            )}
            {topLeft && <Badge badge={topLeft} className="absolute top-1.5 left-1.5 z-[3]" />}
            {badgeBottomRight && <Badge badge={badgeBottomRight} className="absolute bottom-1.5 right-1.5 z-[3]" />}
            {favorite && (
              <span
                className="absolute top-1.5 right-1.5 z-[3] grid place-items-center w-6 h-6 rounded-full bg-black/50 text-rose-400 pointer-events-none"
                aria-label="Đã thích"
              >
                <FiHeart className="w-3 h-3 fill-current" />
              </span>
            )}
          </div>
        </div>

        <h3
          className="mt-2 text-[13px] sm:text-sm font-medium leading-[1.3] min-h-[2.6em] line-clamp-2 [overflow-wrap:anywhere]
                     text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          title={title}
        >
          {shown}
        </h3>
        <div className="mt-0.5 flex items-center gap-1 min-h-[1.25rem] text-[11.5px] sm:text-xs text-gray-500 dark:text-gray-400">
          <span className="flex-1 min-w-0 flex items-center gap-1 truncate">{subtitle}</span>
          {visibleActions.length > 0 && <CardMoreButton onClick={openSheet} />}
        </div>
      </div>
      {sheet}
    </>
  );
}

export { Badge as CardBadge };
