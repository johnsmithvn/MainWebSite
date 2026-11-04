// 📁 src/components/music/TrackListSkeleton.jsx
// 💀 Placeholder rows while a folder/playlist loads (instead of a misleading "empty" message)

import React from 'react';

const TrackListSkeleton = ({ rows = 8 }) => (
  <div role="status" aria-live="polite" aria-label="Đang tải danh sách bài hát" className="divide-y divide-white/5">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-2 animate-pulse">
        <div className="w-6 h-3 rounded bg-white/10 flex-none" />
        <div className="w-10 h-10 rounded bg-white/10 flex-none" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3 rounded bg-white/15" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
          <div className="h-2.5 rounded bg-white/10" style={{ width: `${25 + ((i * 11) % 25)}%` }} />
        </div>
        <div className="w-10 h-3 rounded bg-white/10 flex-none" />
      </div>
    ))}
  </div>
);

export default TrackListSkeleton;
