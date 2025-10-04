import React from 'react';
import { X, HardDrive, Database, Image, Package } from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

const StorageInfoModal = ({ isOpen, onClose, storageStats }) => {
  if (!isOpen || !storageStats) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl ring-1 ring-gray-200 dark:ring-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            <h2 className="text-xl font-semibold">Thông tin lưu trữ</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-md p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Storage Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {storageStats.chapters.count}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                  Chapters
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-center mb-2">
                <Image className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {storageStats.chapters.totalImages}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                  Ảnh
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-center mb-2">
                <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {storageStats.formattedSize}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                  Dung lượng
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
              <div className="flex items-center justify-center mb-2">
                <HardDrive className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {storageStats.quota ? `${storageStats.quota.percentage}%` : 'N/A'}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                  Đã dùng
                </div>
              </div>
            </div>
          </div>

          {/* Storage Quota Details */}
          {storageStats.quota && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Storage Quota
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {storageStats.quota.percentage}% used
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      storageStats.quota.percentage > 90 ? 'bg-red-500' :
                      storageStats.quota.percentage > 75 ? 'bg-yellow-500' :
                      storageStats.quota.percentage > 50 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, storageStats.quota.percentage)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Đã sử dụng</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatBytes(storageStats.quota.usage)}
                  </p>
                </div>
                <div className="text-center border-x border-gray-300 dark:border-gray-600">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Còn lại</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatBytes(storageStats.quota.available)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Tổng</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatBytes(storageStats.quota.quota)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              ℹ️ Thông tin
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Dữ liệu được lưu offline trong Cache Storage của trình duyệt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Bạn có thể xóa từng chapter hoặc xóa toàn bộ để giải phóng dung lượng</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Khi storage đầy, hệ thống sẽ tự động thông báo trước khi download</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorageInfoModal;
