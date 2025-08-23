// 📁 src/components/movie/MovieRandomSection.jsx
// 🎬 Component hiển thị các section random cho movie

import React from 'react';
import RandomSlider from '@/components/common/RandomSlider';
import TopViewSlider from '@/components/common/TopViewSlider';
import RecentSlider from '@/components/common/RecentSlider';
import { useAuthStore } from '@/store';

const MovieRandomSection = () => {
  const { sourceKey } = useAuthStore();

  // Chỉ hiển thị cho movie sources (V_*)
  if (!sourceKey || !sourceKey.startsWith('V_')) {
    return null;
  }

  return (
    // 🛡️ Đảm bảo vùng random không gây tràn ngang, thêm px-2 cho mobile
    <div className="movie-random-sections space-y-6 w-full overflow-hidden px-2 sm:px-0">
      {/* Random Banner */}
      <RandomSlider
        type="movie"
        title="🎬 Phim ngẫu nhiên"
        showViews={true}
        autoplay={true}
        showRefresh={true}
        showTimestamp={true}
        className="movie-random-banner"
      />
      
      {/* Top View - using dedicated TopViewSlider */}
      <TopViewSlider
        type="movie"
        title="🔥 Phim xem nhiều"
        autoplay={false}
        className="movie-top-view"
      />

      {/* Recent Viewed */}
      <RecentSlider
        type="movie"
        title="🕒 Vừa xem"
        autoplay={false}
        showRefresh={false}
        showTimestamp={true}
        maxItems={15}
        className="movie-recent-view"
      />
    </div>
  );
};

export default MovieRandomSection;
