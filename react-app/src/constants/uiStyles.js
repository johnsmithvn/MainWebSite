/**
 * UI Style Constants
 * Centralized styling and animation values for consistent theming
 */

/**
 * 🎨 Card Variants - Base styling for different card layouts
 */
export const CARD_VARIANTS = {
  default: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
  compact: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
  slider: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200',
  'compact-slider': 'bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200'
};

/**
 * 🖼️ Image Styles
 */
export const IMAGE_STYLES = {
  base: 'w-full h-full object-cover will-change-transform transition-transform duration-300 group-hover:scale-105',
  overlay: 'absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200'
};

/**
 * 🎯 Button Styles
 */
export const BUTTON_STYLES = {
  // Favorite button
  favorite: {
    base: 'absolute top-2 right-2 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-colors duration-200',
    active: 'bg-red-500/80 text-white hover:bg-red-600/80',
    inactive: 'bg-black/20 text-white hover:bg-black/40'
  },
  
  // Delete view button
  deleteView: 'absolute bottom-2 right-2 p-1.5 sm:p-2 rounded-full bg-gray-900/80 text-white hover:bg-red-600/80 backdrop-blur-sm transition-colors duration-200',
  
  // Add to playlist button
  addPlaylist: 'absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 flex items-center justify-center rounded-full border-2 border-white/80 text-white bg-black/30 hover:bg-black/40 backdrop-blur-sm shadow-md transition-all'
};

/**
 * 🏷️ Badge Styles
 */
export const BADGE_STYLES = {
  view: 'flex items-center space-x-1 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs',
  type: 'flex items-center space-x-1 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs'
};

/**
 * 📝 Text Styles
 */
export const TEXT_STYLES = {
  // Tên tối đa 2 dòng và luôn giữ chỗ đủ 2 dòng (min-h) để card trong cùng hàng cao bằng nhau
  title: {
    default: 'font-medium text-gray-900 dark:text-white text-sm leading-[1.3] line-clamp-2 min-h-[2.6em] [overflow-wrap:anywhere] mb-1',
    compact: 'font-medium text-gray-900 dark:text-white text-sm leading-[1.3] line-clamp-2 min-h-[2.6em] [overflow-wrap:anywhere] mb-1',
    slider: 'font-medium text-gray-900 dark:text-white text-sm leading-[1.3] line-clamp-2 min-h-[2.6em] [overflow-wrap:anywhere] mb-1',
    'compact-slider': 'font-medium text-gray-900 dark:text-white text-[13px] leading-[1.3] line-clamp-2 min-h-[2.6em] [overflow-wrap:anywhere] mb-0.5'
  },

  metadata: {
    default: 'flex items-center justify-between text-xs text-gray-500 dark:text-gray-400',
    compact: 'flex items-center justify-between text-xs text-gray-500 dark:text-gray-400',
    slider: 'flex items-center justify-between text-xs text-gray-500 dark:text-gray-400',
    'compact-slider': 'flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400'
  },
  
  typeLabel: 'truncate max-w-[60%]',
  viewCount: 'flex items-center gap-0.5 sm:gap-1'
};

/**
 * 📐 Layout & Spacing
 */
export const LAYOUT = {
  cardPadding: {
    default: 'p-3',
    compact: 'p-3',
    slider: 'p-3',
    'compact-slider': 'p-2'
  },
  
  container: 'relative cursor-pointer group overflow-hidden',
  
  badgePositions: {
    music: 'top-2 left-2',
    default: 'bottom-2 left-2'
  }
};

/**
 * 🎭 Animation Values
 */
export const ANIMATIONS = {
  // Framer Motion animation configs
  cardHover: {
    y: -4,
    transition: { duration: 0.2 }
  },
  
  cardTap: {
    y: 2,
    transition: { duration: 0.1 }
  },
  
  buttonHover: {
    scale: 1.05,
    transition: { duration: 0.15 }
  },
  
  buttonTap: {
    y: 1,
    transition: { duration: 0.1 }
  }
};

/**
 * 🔢 Icon Sizes
 */
export const ICON_SIZES = {
  // Main play icon in overlay
  playOverlay: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white drop-shadow-lg',
  
  // Small icons in buttons and badges
  small: 'w-3 h-3 sm:w-4 sm:h-4',
  extraSmall: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
  tiny: 'w-2 h-2 sm:w-2.5 sm:h-2.5',
  
  // Add to playlist button icon
  addPlaylist: 'w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4'
};

/**
 * 📱 Responsive Aspect Ratios
 */
export const ASPECT_RATIOS = {
  manga: 'aspect-[5/7]', // Bìa dọc, gần khổ trang truyện B6/B5 (trước là 3:4)
  movie: 'aspect-video', // Widescreen for videos (same as aspect-[16/9])
  music: 'aspect-square', // Square for album covers
  folder: 'aspect-square' // Square for folder icons
};

/**
 * 🧱 Lưới card theo loại (docs/CARD-REDESIGN-PROPOSAL.md, mục 3.2)
 * Lưới tự chia cột theo bề rộng tối thiểu của card (auto-fill), không gắn số cột cố định theo breakpoint,
 * nên vẫn đúng khi bề rộng nội dung thay đổi (ví dụ mở sidebar).
 * Bề rộng tối thiểu: <640px / ≥640px / ≥1024px. Khe dọc lớn hơn khe ngang vì dưới ảnh còn 2 dòng tên.
 * Kết quả với Layout px-4: điện thoại 390px → Manga/Music 3 cột, Movie 2, Media 3; máy tính 1280px → 7 / 5 / 8.
 */
export const CARD_GRIDS = {
  manga: 'grid grid-cols-[repeat(auto-fill,minmax(var(--card-min),1fr))] [--card-min:104px] sm:[--card-min:128px] lg:[--card-min:144px] gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5 lg:gap-x-4 lg:gap-y-6',
  movie: 'grid grid-cols-[repeat(auto-fill,minmax(var(--card-min),1fr))] [--card-min:152px] sm:[--card-min:200px] lg:[--card-min:220px] gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5 lg:gap-x-4 lg:gap-y-6',
  music: 'grid grid-cols-[repeat(auto-fill,minmax(var(--card-min),1fr))] [--card-min:104px] sm:[--card-min:128px] lg:[--card-min:144px] gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5 lg:gap-x-4 lg:gap-y-6',
  // Ảnh/video: lưới khít kiểu Google Photos, không chữ
  media: 'grid grid-cols-[repeat(auto-fill,minmax(var(--card-min),1fr))] [--card-min:104px] sm:[--card-min:132px] lg:[--card-min:150px] gap-0.5 sm:gap-[3px] lg:gap-1',
  // Thư mục / album của Media: dùng ItemCard ảnh vuông nên cùng cỡ với nhạc
  mediaFolders: 'grid grid-cols-[repeat(auto-fill,minmax(var(--card-min),1fr))] [--card-min:104px] sm:[--card-min:128px] lg:[--card-min:144px] gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5 lg:gap-x-4 lg:gap-y-6'
};

/**
 * 🎨 Theme Colors (opacity variants)
 */
export const THEME_COLORS = {
  overlay: {
    dark: 'bg-black/60',
    medium: 'bg-black/40',
    light: 'bg-black/30'
  },
  
  backdrop: 'backdrop-blur-sm',
  
  border: {
    light: 'border-white/80',
    medium: 'border-gray-200 dark:border-gray-700'
  }
};
