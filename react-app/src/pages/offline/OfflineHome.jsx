import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';

const MODES = [
  {
    id: 'manga',
    title: 'Manga',
    description: 'Đọc các chapter đã tải xuống và tiếp tục tiến độ đọc.',
    icon: '📚',
    path: '/offline/manga',
    ready: true,
  },
  {
    id: 'movie',
    title: 'Movie',
    description: 'Danh sách phim offline sẽ xuất hiện tại đây (sắp ra mắt).',
    icon: '🎬',
    path: '/offline/movie',
    ready: false,
  },
  {
    id: 'music',
    title: 'Music',
    description: 'Kho nhạc offline sẽ được bổ sung trong phiên bản tới.',
    icon: '🎵',
    path: '/offline/music',
    ready: false,
  },
];

const OfflineHome = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-10">
      <div className="text-center space-y-4">
        <div className="text-5xl">📴</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Chế độ Offline
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Không thể kết nối tới server. Chọn chế độ để sử dụng các nội dung đã được tải về máy.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {MODES.map((mode) => (
          <div
            key={mode.id}
            className="flex flex-col h-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
          >
            <div className="flex-1 p-6 space-y-4 text-center">
              <div className="text-4xl">{mode.icon}</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{mode.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{mode.description}</p>
            </div>
            <div className="p-6 pt-0">
              <Button
                className="w-full justify-center"
                variant={mode.ready ? 'primary' : 'outline'}
                onClick={() => navigate(mode.path)}
                disabled={!mode.ready}
              >
                {mode.ready ? 'Mở thư viện' : 'Đang phát triển'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Một số tính năng chỉ hoạt động khi bạn đã tải nội dung trước đó. Trở lại trực tuyến để đồng bộ thêm dữ liệu mới.
      </div>
    </div>
  );
};

export default OfflineHome;
