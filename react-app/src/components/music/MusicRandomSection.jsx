// 📁 src/components/music/MusicRandomSection.jsx
// 🎵 Component hiển thị các section random cho music

import React from 'react';
import RandomSlider from '@/components/common/RandomSlider';
import TopViewSlider from '@/components/common/TopViewSlider';
import RecentSlider from '@/components/common/RecentSlider';
import { useAuthStore } from '@/store';

const MusicRandomSection = () => {
  const { sourceKey } = useAuthStore();

  // Chỉ hiển thị cho music sources (M_*)
  if (!sourceKey || !sourceKey.startsWith('M_')) {
    return null;
  }

  return (
    // 🛡️ Section bao quanh có w-full + overflow-hidden để không tạo scroll ngang
    <div className="music-random-sections space-y-6 w-full overflow-hidden">
      {/* Random Banner */}
      <RandomSlider
        type="music"
        title="🎵 Random Music"
        showViews={true}
        autoplay={true}
        showRefresh={true}
        showTimestamp={true}
        className="music-random-banner px-2 sm:px-0"
      />
      
      {/* Top View - using dedicated TopViewSlider */}
      <TopViewSlider
        type="music"
        title="🔥 Most Played"
        autoplay={false}
        className="music-top-view px-2 sm:px-0"
      />

      {/* Recent Viewed */}
      <RecentSlider
        type="music"
        title="🕒 Recently Played"
        autoplay={false}
        showRefresh={false}
        showTimestamp={true}
        maxItems={15}
        className="music-recent-view px-2 sm:px-0"
      />
    </div>
  );
};

export default MusicRandomSection;
