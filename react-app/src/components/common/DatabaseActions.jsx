// 📁 src/components/common/DatabaseActions.jsx
// 🔄 Centralized database actions component with loading and confirmations

import React, { useState } from 'react';
import { FiRefreshCw, FiTrash2, FiRotateCcw, FiImage } from 'react-icons/fi';
import { useAuthStore, useMovieStore, useMusicStore } from '@/store';
import { useModal } from './Modal';
import { 
  getContentTypeFromSourceKey, 
  isValidContentType,
  performDatabaseScan,
  performDatabaseDelete,
  performDatabaseReset,
  performThumbnailExtraction,
  getDatabaseOperationLabels
} from '@/utils/databaseOperations';
import Button from './Button';
import ScanModal from './ScanModal';
import { apiService } from '@/utils/api';

const ThumbnailOverwriteToggle = ({
  defaultChecked = false,
  onChange,
}) => {
  const [checked, setChecked] = React.useState(defaultChecked);

  React.useEffect(() => {
    setChecked(defaultChecked);
  }, [defaultChecked]);

  React.useEffect(() => {
    onChange?.(checked);
  }, [checked, onChange]);

  return (
    <label className="flex items-start space-x-3 p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50/60 dark:bg-purple-900/20 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
      <div className="text-sm text-left">
        <p className="font-semibold text-purple-800 dark:text-purple-100">
          Ghi đè thumbnail hiện có
        </p>
        <p className="text-xs text-purple-700 dark:text-purple-300">
          Khi bật tùy chọn này hệ thống sẽ tạo lại toàn bộ thumbnail ngay cả khi đã tồn tại.
          Nếu tắt, các thumbnail sẵn có sẽ được giữ nguyên và bỏ qua.
        </p>
      </div>
    </label>
  );
};

const DatabaseActions = ({ 
  contentType = null, // If null, will auto-detect from sourceKey
  sourceKey = null, // If null, will use from auth store
  rootFolder = null, // If null, will use from auth store
  layout = 'vertical', // 'vertical' | 'horizontal' | 'grid'
  size = 'sm', // Button size
  variant = 'outline', // Button variant
  showLabels = true,
  className = ''
}) => {
  const { sourceKey: authSourceKey, rootFolder: authRootFolder } = useAuthStore();
  const { confirmModal, successModal, errorModal, Modal: ModalComponent } = useModal();
  
  // Scan modal state
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  
  // Use provided values or fallback to auth store
  const currentSourceKey = sourceKey || authSourceKey;
  const currentRootFolder = rootFolder || authRootFolder;
  
  // Auto-detect content type if not provided
  const currentContentType = contentType || getContentTypeFromSourceKey(currentSourceKey);

  // Check if operations are valid
  const isValid = isValidContentType(currentContentType, currentSourceKey, currentRootFolder);

  // Get labels for current content type
  const labels = getDatabaseOperationLabels(currentContentType);

  // Current folder path for contextual actions
  const moviePath = useMovieStore((state) => state.currentPath);
  const musicPath = useMusicStore((state) => state.currentPath);
  const overwriteRef = React.useRef(false);
  const currentPath = React.useMemo(() => {
    if (currentContentType === 'movie') return moviePath || '';
    if (currentContentType === 'music') return musicPath || '';
    return '';
  }, [currentContentType, moviePath, musicPath]);
  
  if (!isValid || !currentContentType) {
    return null; // Don't render if invalid
  }
  
  // Handle scan operation - Open ScanModal for partial scan
  const handleScan = () => {
    setScanModalOpen(true);
  };

  // Handle modal close - Reset state
  const handleScanModalClose = () => {
    setScanModalOpen(false);
    // Reset state after modal animation completes
    setTimeout(() => {
      setScanProgress(null);
      setIsScanning(false);
    }, 300);
  };

  // Handle scan confirm from modal
  const handleScanConfirm = async (path) => {
    console.log('🔄 Starting scan:', { type: currentContentType, path, sourceKey: currentSourceKey });
    
    if (!currentSourceKey) {
      console.error('❌ No sourceKey available');
      setScanProgress({ message: 'Chưa chọn database. Vui lòng chọn source trước.' });
      return;
    }

    setIsScanning(true);
    setScanProgress({ current: 0, total: 0, message: 'Đang khởi tạo...' });

    try {
      let response;
      
      // Call appropriate API based on type
      switch (currentContentType) {
        case 'music':
          setScanProgress({ current: 1, total: 3, message: 'Đang scan music folders...' });
          response = await apiService.music.scan({ key: currentSourceKey, path });
          break;
        case 'movie':
          setScanProgress({ current: 1, total: 3, message: 'Đang scan movie folders...' });
          response = await apiService.movie.scan({ key: currentSourceKey, path });
          break;
        case 'manga':
          setScanProgress({ current: 1, total: 3, message: 'Đang scan manga folders...' });
          response = await apiService.manga.scan({ dbkey: currentSourceKey, path });
          break;
        default:
          throw new Error(`Unknown scan type: ${currentContentType}`);
      }
      
      console.log('✅ Scan response:', response.data);
      
      // Show success with stats
      const stats = response.data.stats || {};
      const statsMsg = `Thêm: ${stats.inserted || 0}, Sửa: ${stats.updated || 0}, Xóa: ${stats.deleted || 0}`;
      
      setScanProgress({ 
        current: 3, 
        total: 3, 
        message: `Hoàn tất! ${statsMsg}`, 
        success: true 
      });
      
      // Don't auto-close - let user close manually
      // User can review stats and close when ready
      
    } catch (error) {
      console.error('❌ Scan failed:', error);
      setScanProgress({ 
        message: `Scan thất bại: ${error.response?.data?.error || error.message}` 
      });
    } finally {
      setIsScanning(false);
      // Don't reset progress here - let it persist until modal closes
    }
  };

  // Handle thumbnail extraction (movie & music)
  const handleThumbnailExtraction = () => {
    if (!['movie', 'music'].includes(currentContentType)) {
      return;
    }

    const folderLabel = currentPath || 'Thư mục gốc (root)';
    overwriteRef.current = false;

    confirmModal({
      title: `🖼️ ${labels.thumbnail || 'Quét thumbnail'}`,
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">{labels.thumbnailDescription || 'Tạo lại thumbnail cho thư mục hiện tại.'}</p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">📁 Phạm vi quét:</p>
            <ul className="text-sm space-y-1 text-purple-700 dark:text-purple-300">
              <li>• Source: <strong>{currentSourceKey}</strong></li>
              <li>• Thư mục: <strong>{folderLabel}</strong></li>
              <li>
                • Bao gồm toàn bộ {currentContentType === 'movie' ? 'video' : 'bài hát'} và thư mục con hiện có
              </li>
            </ul>
          </div>
          <ThumbnailOverwriteToggle
            defaultChecked={false}
            onChange={(value) => {
              overwriteRef.current = value;
            }}
          />
          <p className="text-xs text-purple-600 dark:text-purple-300">
            Lưu ý: thao tác có thể mất vài phút tùy số lượng file. Vui lòng giữ ứng dụng mở trong khi xử lý.
          </p>
        </div>
      ),
      confirmText: '🖼️ Bắt đầu quét thumbnail',
      cancelText: 'Hủy',
      onConfirm: () => {
        performThumbnailExtraction(
          currentContentType,
          currentSourceKey,
          { path: currentPath, overwrite: overwriteRef.current },
          (data) => {
            const countInfo = data.count ? `Đã xử lý ${data.count} mục.` : '';
            const successTitle = labels.thumbnailSuccess || '✅ Hoàn tất!';
            const successMessage = [
              labels.thumbnailSuccessDetail || 'Đã hoàn tất quét thumbnail.',
              countInfo
            ]
              .filter(Boolean)
              .join(' ');
            successModal({
              title: successTitle,
              message: successMessage || 'Đã hoàn tất quét thumbnail.',
            });
          },
          (error) => {
            errorModal({
              title: '❌ Lỗi quét thumbnail',
              message: error,
            });
          }
        );
      }
    });
  };

  // Handle delete operation
  const handleDelete = () => {
    confirmModal({
      title: `🗑️ ${labels.delete}`,
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">{labels.deleteDescription}</p>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="font-semibold text-red-800 dark:text-red-200 mb-2">💀 Cảnh báo:</p>
            <ul className="text-sm space-y-1 text-red-700 dark:text-red-300">
              <li>• Source: <strong>{currentSourceKey}</strong></li>
              {currentContentType === 'manga' && (
                <li>• Root: <strong>{currentRootFolder}</strong></li>
              )}
              <li>• Tất cả dữ liệu database sẽ bị xóa</li>
              <li>• Lượt xem và thống kê sẽ bị mất</li>
              <li>• File thực tế sẽ KHÔNG bị ảnh hưởng</li>
            </ul>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg border border-red-300 dark:border-red-700">
            <p className="font-bold text-red-800 dark:text-red-200">
              ❌ Hành động này không thể hoàn tác!
            </p>
          </div>
        </div>
      ),
      confirmText: '🗑️ Xóa Database',
      cancelText: 'Hủy',
      onConfirm: () => {
        performDatabaseDelete(
          currentContentType,
          currentSourceKey,
          currentRootFolder,
          (data, message) => {
            successModal({
              title: '✅ Xóa hoàn tất!',
              message: message
            });
          },
          (error) => {
            errorModal({
              title: '❌ Lỗi xóa',
              message: error
            });
          }
        );
      }
    });
  };
  
  // Handle reset operation
  const handleReset = () => {
    confirmModal({
      title: `🔄 ${labels.reset}`,
      message: (
        <div className="text-left space-y-3">
          <p className="font-medium">{labels.resetDescription}</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🔄 Thao tác:</p>
            <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• Source: <strong>{currentSourceKey}</strong></li>
              {currentContentType === 'manga' && (
                <li>• Root: <strong>{currentRootFolder}</strong></li>
              )}
              <li>• 1. Xóa tất cả dữ liệu database hiện có</li>
              <li>• 2. Quét lại và tạo database mới</li>
              <li>• 3. Tất cả lượt xem sẽ về 0</li>
            </ul>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700">
            <p className="font-bold text-yellow-800 dark:text-yellow-200">
              ⚠️ Tất cả thống kê và lượt xem sẽ bị reset!
            </p>
          </div>
        </div>
      ),
      confirmText: '🔄 Reset & Quét',
      cancelText: 'Hủy',
      onConfirm: () => {
        performDatabaseReset(
          currentContentType,
          currentSourceKey,
          currentRootFolder,
          (data, message) => {
            successModal({
              title: '✅ Reset hoàn tất!',
              message: message
            });
          },
          (error) => {
            errorModal({
              title: '❌ Lỗi reset',
              message: error
            });
          }
        );
      }
    });
  };
  
  // Button configurations
  const buttons = [];

  if (['movie', 'music'].includes(currentContentType) && labels.thumbnail) {
    buttons.push({
      key: 'thumbnail',
      icon: FiImage,
      label: showLabels ? labels.thumbnail : '',
      onClick: handleThumbnailExtraction,
      className: 'text-purple-600 hover:text-purple-700 border-purple-300 hover:border-purple-400'
    });
  }

  buttons.push(
    {
      key: 'scan',
      icon: FiRefreshCw,
      label: showLabels ? labels.scan : '',
      onClick: handleScan,
      className: 'text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400'
    },
    {
      key: 'delete',
      icon: FiTrash2,
      label: showLabels ? labels.delete : '',
      onClick: handleDelete,
      className: 'text-red-600 hover:text-red-700 border-red-300 hover:border-red-400'
    }
  );

  // Media doesn't support reset operation
  if (currentContentType !== 'media') {
    buttons.push({
      key: 'reset',
      icon: FiRotateCcw,
      label: showLabels ? labels.reset : '',
      onClick: handleReset,
      className: 'text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400'
    });
  }
  
  // Layout classes
  const layoutClasses = {
    vertical: 'flex flex-col space-y-2',
    horizontal: 'flex flex-row space-x-2',
    grid: 'grid grid-cols-1 sm:grid-cols-3 gap-2'
  };
  
  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {buttons.map(({ key, icon: Icon, label, onClick, className: buttonClassName }) => (
        <Button
          key={key}
          variant={variant}
          size={size}
          onClick={onClick}
          icon={Icon}
          className={`${buttonClassName} justify-start`}
        >
          {label}
        </Button>
      ))}
      
      {/* Modal Component */}
      <ModalComponent />
      
      {/* Scan Modal for partial scan */}
      <ScanModal
        isOpen={scanModalOpen}
        onClose={handleScanModalClose}
        onConfirm={handleScanConfirm}
        type={currentContentType}
        isScanning={isScanning}
        progress={scanProgress}
      />
    </div>
  );
};

export default DatabaseActions;
