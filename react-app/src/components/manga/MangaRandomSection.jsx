// 📁 src/components/manga/MangaRandomSection.jsx
// 🎯 Component hiển thị các section random cho manga

import RandomSlider from '@/components/common/RandomSlider';
import TopViewSlider from '@/components/common/TopViewSlider';
import RecentSlider from '@/components/common/RecentSlider';
import { useAuthStore } from '@/store';

const MangaRandomSection = () => {
  const { sourceKey } = useAuthStore();

  // Chỉ hiển thị cho manga sources (ROOT_*)
  if (!sourceKey || !sourceKey.startsWith('ROOT_')) {
    return null;
  }

  return (
    // 🛡️ Bao các slider bằng w-full + overflow-hidden để tránh tràn
    <div className="manga-random-sections space-y-6 w-full overflow-hidden">
      {/* Random Banner */}
      <RandomSlider
        type="manga"
        title="📚 Manga ngẫu nhiên"
        showViews={true}
        autoplay={true}
        showRefresh={true}
        showTimestamp={true}
        className="manga-random-banner"
      />
      
      {/* Top View - using dedicated TopViewSlider */}
      <TopViewSlider
        type="manga"
        title="🔥 Manga xem nhiều"
        autoplay={false}
        className="manga-top-view"
      />

      {/* Recent Viewed */}
      <RecentSlider
        type="manga"
        title="🕒 Vừa đọc"
        autoplay={false}
        showRefresh={false}
        showTimestamp={true}
        maxItems={15}
        className="manga-recent-view"
      />
    </div>
  );
};

export default MangaRandomSection;
