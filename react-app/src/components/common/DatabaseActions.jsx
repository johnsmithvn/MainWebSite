// 📁 src/components/common/DatabaseActions.jsx
// 🔄 Centralized database actions component with loading and confirmations

import React from 'react';
import { FiRefreshCw, FiTrash2, FiRotateCcw } from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { useModal } from './Modal';
import { 
  getContentTypeFromSourceKey, 
  isValidContentType,
  performDatabaseScan,
  performDatabaseDelete,
  performDatabaseReset,
  getDatabaseOperationLabels
} from '@/utils/databaseOperations';
import Button from './Button';

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
  
  // Use provided values or fallback to auth store
  const currentSourceKey = sourceKey || authSourceKey;
  const currentRootFolder = rootFolder || authRootFolder;
  
  // Auto-detect content type if not provided
  const currentContentType = contentType || getContentTypeFromSourceKey(currentSourceKey);
  
  // Check if operations are valid
  const isValid = isValidContentType(currentContentType, currentSourceKey, currentRootFolder);
  
  // Get labels for current content type
  const labels = getDatabaseOperationLabels(currentContentType);
  
  if (!isValid || !currentContentType) {
    return null; // Don't render if invalid
  }
  
  // Handle scan operation
  const handleScan = async () => {
    const confirmed = await confirmModal(
      `🔍 ${labels.scan}`,
      <div className="text-left space-y-3">
        <p className="font-medium">{labels.scanDescription}</p>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Thông tin:</p>
          <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
            <li>• Source: <strong>{currentSourceKey}</strong></li>
            {currentContentType === 'manga' && (
              <li>• Root: <strong>{currentRootFolder}</strong></li>
            )}
            <li>• Thao tác này sẽ KHÔNG xóa dữ liệu hiện có</li>
            <li>• Chỉ thêm mới các folder/file được tìm thấy</li>
          </ul>
        </div>
      </div>,
      'confirm'
    );
    
    if (confirmed) {
      performDatabaseScan(
        currentContentType,
        currentSourceKey,
        currentRootFolder,
        (data, message) => {
          successModal({
            title: '✅ Quét hoàn tất!',
            message: `${message}${data.stats?.total ? ` - Tìm thấy ${data.stats.total} mục.` : ''}`
          });
        },
        (error) => {
          errorModal({
            title: '❌ Lỗi quét',
            message: error
          });
        }
      );
    }
  };
  
  // Handle delete operation
  const handleDelete = async () => {
    const confirmed = await confirmModal(
      `🗑️ ${labels.delete}`,
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
      </div>,
      'confirm'
    );
    
    if (confirmed) {
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
  };
  
  // Handle reset operation
  const handleReset = async () => {
    const confirmed = await confirmModal(
      `🔄 ${labels.reset}`,
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
      </div>,
      'confirm'
    );
    
    if (confirmed) {
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
  };
  
  // Button configurations
  const buttons = [
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
    },
    {
      key: 'reset',
      icon: FiRotateCcw,
      label: showLabels ? labels.reset : '',
      onClick: handleReset,
      className: 'text-yellow-600 hover:text-yellow-700 border-yellow-300 hover:border-yellow-400'
    }
  ];
  
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
    </div>
  );
};

export default DatabaseActions;
