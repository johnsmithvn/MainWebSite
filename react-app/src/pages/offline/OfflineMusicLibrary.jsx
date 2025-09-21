import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';

const OfflineMusicLibrary = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6 text-center">
      <div className="text-5xl">🎵</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Music Offline</h1>
      <p className="text-base text-gray-600 dark:text-gray-400">
        Tính năng lưu nhạc offline đang được phát triển. Bạn sẽ sớm có thể nghe playlist yêu thích mà không cần internet.
      </p>
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hãy quay lại trung tâm offline để chọn nội dung hiện có.
        </p>
        <Button className="justify-center" onClick={() => navigate('/offline')}>
          ⬅️ Quay lại chế độ Offline
        </Button>
      </div>
    </div>
  );
};

export default OfflineMusicLibrary;
