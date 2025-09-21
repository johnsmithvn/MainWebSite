import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';

const OfflineMovieLibrary = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6 text-center">
      <div className="text-5xl">🎬</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Movie Offline</h1>
      <p className="text-base text-gray-600 dark:text-gray-400">
        Chúng tôi đang chuẩn bị hỗ trợ lưu trữ phim để xem offline. Tính năng này sẽ xuất hiện trong phiên bản tiếp theo.
      </p>
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Trong lúc chờ đợi, bạn có thể quay lại trung tâm offline để chọn nội dung khác.
        </p>
        <Button className="justify-center" onClick={() => navigate('/offline')}>
          ⬅️ Quay lại chế độ Offline
        </Button>
      </div>
    </div>
  );
};

export default OfflineMovieLibrary;
