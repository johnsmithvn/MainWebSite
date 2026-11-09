// 📁 src/components/manga/MangaCard.jsx
// Lớp bọc của ItemCard cho Manga: cách mở (thư mục / trình đọc), dòng phụ, thao tác.
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiFileText, FiFolder, FiTrash2 } from 'react-icons/fi';
import { useRecentManager } from '@/hooks/useRecentManager';
import ItemCard from '@/components/common/ItemCard';
import { stripExtension } from '@/utils/formatters';

const MangaCard = ({
  manga,
  isFavorite,
  onToggleFavorite,
  onDeleteClick,
  onClick,
  className = '',
  variant = 'grid', // 'grid' | 'list' ('default', 'slider' được coi như 'grid')
  statusLabel, // Nhãn trạng thái ở góc trên trái ảnh, ví dụ "Đang đọc"
  subtitle, // Ghi đè dòng phụ (ví dụ ngày thêm vào yêu thích)
}) => {
  const navigate = useNavigate();
  const { addRecentItem } = useRecentManager('manga');

  // Normalize isFavorite - handle both boolean and 0/1 values
  const isCurrentlyFavorite = Boolean(isFavorite || manga?.isFavorite);

  const handleOpen = () => {
    if (onClick) {
      onClick(manga);
      return;
    }

    const hasImages = manga.hasImages && manga.images?.length > 0;
    const hasImagesArray = Array.isArray(manga.images) && manga.images.length > 0;
    const isReaderItem = manga.isSelfReader || hasImages || hasImagesArray || manga.path?.endsWith('/__self__');

    if (isReaderItem) {
      const readerParams = new URLSearchParams();
      readerParams.set('path', manga.path);
      // Add return URL for proper back navigation
      if (window.location.pathname === '/manga') {
        readerParams.set('returnUrl', `${window.location.pathname}${window.location.search}`);
      }
      navigate(`/manga/reader?${readerParams.toString()}`);

      // Only add to recent when going to reader
      setTimeout(() => {
        try {
          addRecentItem(manga);
        } catch (error) {
          console.warn('Error adding to recent:', error);
        }
      }, 0);
    } else {
      navigate(`/manga?path=${encodeURIComponent(manga.path)}`);
    }
  };

  const displayName = manga.name === '__self__' ? 'Đọc ngay' : manga.name;
  const isPdf = manga.type === 'pdf';
  // PDF đã có nhãn ở dòng phụ, nên tên trên card bỏ đuôi .pdf
  const shownName = isPdf ? stripExtension(displayName) : displayName;
  const isSeries = !isPdf && manga.chapterCount > 0;

  const defaultSubtitle = isPdf ? (
    <>
      <FiFileText className="flex-none" aria-hidden="true" />
      PDF
    </>
  ) : isSeries ? (
    // Bộ truyện: số thư mục con (chương/tập), đếm sẵn lúc quét
    <>
      <FiFolder className="flex-none" aria-hidden="true" />
      {manga.chapterCount} chương
    </>
  ) : manga.imageCount > 0 ? (
    // Chương: số ảnh trong thư mục
    `${manga.imageCount} trang`
  ) : null;

  // Thao tác trong bảng ⋯ / nhấn giữ / chuột phải
  const actions = [
    onToggleFavorite && {
      key: 'favorite',
      label: isCurrentlyFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích',
      icon: FiHeart,
      onClick: () => onToggleFavorite(manga),
    },
    onDeleteClick && {
      key: 'delete',
      label: 'Xoá khỏi cơ sở dữ liệu',
      icon: FiTrash2,
      danger: true,
      onClick: () => onDeleteClick(manga),
    },
  ];

  return (
    <ItemCard
      type="manga"
      title={displayName}
      displayTitle={shownName}
      thumbnail={manga.thumbnail}
      thumbKind={isPdf ? 'pdf' : 'manga'}
      isFolder={isSeries}
      subtitle={subtitle ?? defaultSubtitle}
      statusLabel={statusLabel}
      favorite={isCurrentlyFavorite}
      onOpen={handleOpen}
      actions={actions}
      sheetSubtitle={manga.path}
      variant={variant === 'list' ? 'list' : 'grid'}
      className={className}
    />
  );
};

export default MangaCard;
