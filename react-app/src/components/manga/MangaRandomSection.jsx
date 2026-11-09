// 📁 src/components/manga/MangaRandomSection.jsx
// 🎯 Các hàng slider ở thư mục gốc Manga:
//   1. "Đọc tiếp" (lịch sử đọc) lên đầu: tên chương, tên bộ ở dòng phụ, thời điểm đọc ở góc ảnh.
//   2. "Ngẫu nhiên" và "Xem nhiều" gộp thành một hàng có tab (tiết kiệm một hàng slider trên điện thoại).
// Tắt tự chạy và chấm trang; vuốt ngang, card kế tiếp lộ một phần để báo còn nữa.

import { useState } from 'react';
import RandomSlider from '@/components/common/RandomSlider';
import TopViewSlider from '@/components/common/TopViewSlider';
import RecentSlider from '@/components/common/RecentSlider';
import { useAuthStore } from '@/store';

const TAB_KEY = 'manga.discoverTab';
const TABS = [
  { key: 'random', label: 'Ngẫu nhiên' },
  { key: 'top', label: 'Xem nhiều' },
];

const readTab = () => {
  try {
    return localStorage.getItem(TAB_KEY) === 'top' ? 'top' : 'random';
  } catch (_) {
    return 'random';
  }
};

const MangaRandomSection = () => {
  const { sourceKey } = useAuthStore();
  const [tab, setTab] = useState(readTab);

  // Chỉ hiển thị cho manga sources (ROOT_*)
  if (!sourceKey || !sourceKey.startsWith('ROOT_')) {
    return null;
  }

  const selectTab = (key) => {
    setTab(key);
    try { localStorage.setItem(TAB_KEY, key); } catch (_) { /* bỏ qua */ }
  };

  const tabs = (
    <div role="tablist" aria-label="Khám phá" className="inline-flex flex-none rounded-lg bg-gray-100 dark:bg-gray-700/60 p-0.5">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={tab === key}
          onClick={() => selectTab(key)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            tab === key
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="manga-random-sections space-y-3 w-full">
      {/* Đọc tiếp: ẩn hẳn khi chưa có lịch sử */}
      <RecentSlider
        type="manga"
        title="Đọc tiếp"
        autoplay={false}
        showRefresh={false}
        showTimestamp={false}
        showDots={false}
        maxItems={15}
        className="manga-recent-view !mb-0"
      />

      {tab === 'random' ? (
        <RandomSlider
          key="random"
          type="manga"
          headerLeft={tabs}
          showViews={true}
          autoplay={false}
          showRefresh={true}
          showTimestamp={false}
          showDots={false}
          className="manga-random-banner !mb-0"
        />
      ) : (
        <TopViewSlider
          key="top"
          type="manga"
          headerLeft={tabs}
          autoplay={false}
          showDots={false}
          className="manga-top-view !mb-0"
        />
      )}
    </div>
  );
};

export default MangaRandomSection;
