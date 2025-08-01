// 📁 src/pages/NotFound.jsx
// 🚫 404 Not Found page

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        {/* 404 Illustration */}
        <div className="text-8xl mb-8">🤔</div>
        
        {/* Error message */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Trang không tìm thấy
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. 
            Có thể link đã bị thay đổi hoặc trang đã bị xóa.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary">
              🏠 Về trang chủ
            </Button>
          </Link>
          
          <Button 
            variant="secondary" 
            onClick={() => window.history.back()}
          >
            ← Quay lại
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
