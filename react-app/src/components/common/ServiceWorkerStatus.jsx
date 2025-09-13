/**
 * Service Worker Status Component
 * Displays SW info and provides management controls
 */

import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Info,
  Settings
} from 'lucide-react';
import useServiceWorker from '../../hooks/useServiceWorker';
import toast from 'react-hot-toast';

const ServiceWorkerStatus = ({ isOpen, onClose }) => {
  const {
    supported,
    registered,
    controller,
    online,
    updateAvailable,
    ready,
    isLoading,
    cacheInfo,
    applyUpdate,
    getCacheInfo,
    clearCache,
    checkOfflineCapability,
    checkForUpdate
  } = useServiceWorker();

  const [offlineCapability, setOfflineCapability] = useState(null);
  const [showCacheDetails, setShowCacheDetails] = useState(false);

  // Check offline capability on mount
  useEffect(() => {
    if (ready) {
      checkOfflineCapability().then(setOfflineCapability);
    }
  }, [ready, checkOfflineCapability]);

  // Refresh cache info when modal opens
  useEffect(() => {
    if (isOpen && ready) {
      getCacheInfo();
    }
  }, [isOpen, ready, getCacheInfo]);

  const handleApplyUpdate = async () => {
    try {
      const success = await applyUpdate();
      if (success) {
        toast.success('✅ Cập nhật đã được áp dụng!');
      } else {
        toast.error('❌ Không thể áp dụng cập nhật');
      }
    } catch (error) {
      toast.error('❌ Lỗi khi cập nhật: ' + error.message);
    }
  };

  const handleClearCache = async (cacheName) => {
    try {
      const success = await clearCache(cacheName);
      if (success) {
        toast.success(`✅ Đã xóa cache: ${cacheName}`);
      } else {
        toast.error(`❌ Không thể xóa cache: ${cacheName}`);
      }
    } catch (error) {
      toast.error('❌ Lỗi khi xóa cache: ' + error.message);
    }
  };

  const handleCheckUpdate = async () => {
    try {
      const hasUpdate = await checkForUpdate();
      if (hasUpdate) {
        toast.success('🔍 Đang kiểm tra cập nhật...');
      } else {
        toast.info('ℹ️ Không có cập nhật mới');
      }
    } catch (error) {
      toast.error('❌ Lỗi khi kiểm tra cập nhật: ' + error.message);
    }
  };

  const getStatusIcon = () => {
    if (!supported) return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (!registered) return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    if (!controller) return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
    if (ready) return <CheckCircle className="w-5 h-5 text-green-400" />;
    return <Info className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (!supported) return 'Không hỗ trợ Service Worker';
    if (!registered) return 'Chưa đăng ký Service Worker';
    if (!controller) return 'Đang khởi động Service Worker...';
    if (ready) return 'Service Worker đã sẵn sàng';
    return 'Đang kiểm tra trạng thái...';
  };

  const getStatusColor = () => {
    if (!supported || !registered) return 'text-red-400';
    if (!controller) return 'text-blue-400';
    if (ready) return 'text-green-400';
    return 'text-gray-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-gray-900 text-gray-100 rounded-xl shadow-2xl ring-1 ring-white/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Service Worker Status</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-md p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-medium">Trạng thái</h3>
                <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                {online ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm">
                  {online ? 'Trực tuyến' : 'Ngoại tuyến'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {offlineCapability?.capable ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
                <span className="text-sm">
                  {offlineCapability?.capable ? 'Hỗ trợ offline' : 'Cần online'}
                </span>
              </div>
            </div>

            {offlineCapability && !offlineCapability.capable && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-300">
                  {offlineCapability.reason}
                </p>
              </div>
            )}
          </div>

          {/* Update Available */}
          {updateAvailable && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-300">Cập nhật có sẵn</h3>
                  <p className="text-sm text-blue-400">
                    Phiên bản mới của ứng dụng đã sẵn sàng
                  </p>
                </div>
                <button
                  onClick={handleApplyUpdate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang cập nhật...' : 'Cập nhật ngay'}
                </button>
              </div>
            </div>
          )}

          {/* Cache Information */}
          {cacheInfo && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Cache Information</h3>
                <button
                  onClick={() => setShowCacheDetails(!showCacheDetails)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {showCacheDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                </button>
              </div>

              <div className="text-sm text-gray-400 mb-3">
                <p>Version: {cacheInfo.version}</p>
                <p>Total Caches: {cacheInfo.totalCaches}</p>
              </div>

              {showCacheDetails && (
                <div className="space-y-2">
                  {cacheInfo.details.map((cache) => (
                    <div key={cache.name} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium">{cache.displayName}</p>
                        <p className="text-sm text-gray-400">
                          {cache.count} items • {cache.type}
                        </p>
                      </div>
                      
                      {cache.type !== 'images' && (
                        <button
                          onClick={() => handleClearCache(cache.name)}
                          disabled={isLoading}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Xóa cache"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCheckUpdate}
              disabled={isLoading || !ready}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Kiểm tra cập nhật
            </button>

            <button
              onClick={getCacheInfo}
              disabled={isLoading || !ready}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Info className="w-4 h-4" />
              Làm mới thông tin
            </button>
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-800/30 rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-400 mb-2">
                Debug Information
              </summary>
              <pre className="text-xs text-gray-500 overflow-auto">
                {JSON.stringify({
                  supported,
                  registered,
                  controller,
                  online,
                  updateAvailable,
                  ready,
                  offlineCapability
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkerStatus;
