// 📁 src/components/manga/MangaRandomSection.jsx
// 🎯 Component hiển thị các section random cho manga

import React from 'react';
import RandomSlider from '@/components/common/RandomSlider';
import TopViewSlider from '@/components/common/TopViewSlider';
import { useAuthStore } from '@/store';

const MangaRandomSection = () => {
  const { sourceKey } = useAuthStore();

  // Chỉ hiển thị cho manga sources (ROOT_*)
  if (!sourceKey || !sourceKey.startsWith('ROOT_')) {
    return null;
  }

  return (
    <div className="manga-random-sections space-y-6">
      {/* Random Banner */}
      <RandomSlider
        type="manga"
        title="📚 Manga ngẫu nhiên"
        showViews={false}
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
    </div>
  );
};

export default MangaRandomSection;
