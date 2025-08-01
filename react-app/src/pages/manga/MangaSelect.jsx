// 📁 src/pages/manga/MangaSelect.jsx
// 📚 Manga root folder selection page

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFolder, FiRefreshCw } from 'react-icons/fi';
import { useAuthStore, useUIStore } from '@/store';
import { apiService } from '@/utils/api';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';

const MangaSelect = () => {
  const navigate = useNavigate();
  const [rootFolders, setRootFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { sourceKey, setRootFolder } = useAuthStore();
  const { setLoading: setGlobalLoading } = useUIStore();

  // Redirect if no source key
  useEffect(() => {
    if (!sourceKey) {
      navigate('/');
      return;
    }
    loadRootFolders();
  }, [sourceKey, navigate]);

  const loadRootFolders = async () => {
    try {
      setLoading(true);
      const response = await apiService.system.listRoots({ key: sourceKey });
      setRootFolders(response.data || []);
    } catch (error) {
      console.error('Error loading root folders:', error);
      toast.error('Lỗi tải danh sách thư mục gốc');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = async (folderName) => {
    setRootFolder(folderName);
    setGlobalLoading(true);
    
    try {
      // Navigate to manga home with selected root folder
      navigate(`/manga?root=${encodeURIComponent(folderName)}`);
    } catch (error) {
      console.error('Error selecting folder:', error);
      toast.error('Lỗi chọn thư mục');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Chọn thư mục Manga
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Source: <span className="font-medium text-primary-600 dark:text-primary-400">{sourceKey}</span>
        </p>
        
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={loadRootFolders}
            loading={loading}
          >
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </motion.div>

      {/* Folder Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-4 text-gray-600 dark:text-gray-400">Đang tải...</span>
        </div>
      ) : rootFolders.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {rootFolders.map((folder, index) => (
            <motion.div
              key={folder}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                onClick={() => handleFolderSelect(folder)}
                className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <FiFolder className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {folder}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Thư mục manga
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không tìm thấy thư mục nào
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Có thể source không có thư mục manga hoặc cần cấu hình lại
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </motion.div>
      )}

      {/* Back button */}
      <div className="flex justify-center pt-6">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Về trang chủ
        </Button>
      </div>
    </div>
  );
};

export default MangaSelect;
