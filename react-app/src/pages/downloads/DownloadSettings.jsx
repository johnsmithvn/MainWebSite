// 📁 src/pages/downloads/DownloadSettings.jsx
// ⚙️ Download Settings Modal Component

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Download,
  Wifi,
  Bell,
  HardDrive,
  Trash2,
  RotateCcw,
  Info,
  ChevronDown,
  X
} from 'lucide-react';
import useDownloadQueueStore from '../../store/downloadQueueStore';
import { formatFileSize } from '../../utils/formatters';
import { getStorageEstimate } from '../../utils/storageQuota';
import { toast } from 'react-hot-toast';
import Modal from '../../components/common/Modal';

/**
 * Download Settings Modal
 * Manages download queue preferences and storage
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @returns {JSX.Element}
 */
const DownloadSettings = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    clearCompleted,
    clearFailed,
    clearAll
  } = useDownloadQueueStore();

  // Local state for settings
  const [localSettings, setLocalSettings] = useState(settings);
  const [storageInfo, setStorageInfo] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearType, setClearType] = useState(''); // 'completed' | 'failed' | 'all'

  // Load storage info on mount
  useEffect(() => {
    if (isOpen) {
      loadStorageInfo();
    }
  }, [isOpen]);

  const loadStorageInfo = async () => {
    try {
      const estimate = await getStorageEstimate();
      setStorageInfo(estimate);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  // Handle setting change
  const handleChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle save
  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('Đã lưu cài đặt');
    onClose();
  };

  // Handle reset to defaults
  const handleReset = () => {
    const defaults = {
      autoDownload: false,
      maxConcurrent: 2,
      maxRetries: 3,
      wifiOnly: false,
      showNotifications: true,
      autoDeleteAfter: 'never' // 'never' | '1d' | '7d' | '30d'
    };
    setLocalSettings(defaults);
    toast.success('Đã khôi phục cài đặt mặc định');
  };

  // Handle clear actions
  const handleClearClick = (type) => {
    setClearType(type);
    setShowClearConfirm(true);
  };

  const handleClearConfirm = () => {
    switch (clearType) {
      case 'completed':
        clearCompleted();
        toast.success('Đã xóa các task hoàn thành');
        break;
      case 'failed':
        clearFailed();
        toast.success('Đã xóa các task thất bại');
        break;
      case 'all':
        clearAll();
        toast.success('Đã xóa toàn bộ queue');
        break;
    }
    setShowClearConfirm(false);
    loadStorageInfo(); // Refresh storage info
  };

  // Auto-delete options
  const autoDeleteOptions = [
    { value: 'never', label: 'Không bao giờ' },
    { value: '1d', label: '1 ngày' },
    { value: '7d', label: '7 ngày' },
    { value: '30d', label: '30 ngày' }
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Cài đặt Download Queue"
        size="large"
      >
        <div className="space-y-6">
          {/* Download Settings Section */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Download className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Cài đặt tải xuống
            </h3>

            <div className="space-y-4">
              {/* Auto Download */}
              <SettingRow
                icon={Download}
                label="Tự động tải xuống"
                description="Bắt đầu tải ngay khi thêm vào queue"
              >
                <Toggle
                  checked={localSettings.autoDownload}
                  onChange={(checked) => handleChange('autoDownload', checked)}
                />
              </SettingRow>

              {/* Max Concurrent */}
              <SettingRow
                icon={Download}
                label="Số tải đồng thời"
                description={`Tối đa ${localSettings.maxConcurrent} task cùng lúc`}
              >
                <Slider
                  min={1}
                  max={5}
                  value={localSettings.maxConcurrent}
                  onChange={(value) => handleChange('maxConcurrent', value)}
                />
              </SettingRow>

              {/* Max Retries */}
              <SettingRow
                icon={RotateCcw}
                label="Số lần thử lại"
                description="Khi download thất bại"
              >
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={localSettings.maxRetries}
                  onChange={(e) => handleChange('maxRetries', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </SettingRow>

              {/* WiFi Only (Future Feature) */}
              <SettingRow
                icon={Wifi}
                label="Chỉ tải qua WiFi"
                description="Tạm dừng khi dùng dữ liệu di động (Sắp có)"
                disabled
              >
                <Toggle
                  checked={localSettings.wifiOnly}
                  onChange={(checked) => handleChange('wifiOnly', checked)}
                  disabled
                />
              </SettingRow>
            </div>
          </section>

          {/* Notification Settings */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Thông báo
            </h3>

            <div className="space-y-4">
              {/* Show Notifications */}
              <SettingRow
                icon={Bell}
                label="Hiện thông báo"
                description="Thông báo khi download hoàn thành hoặc thất bại"
              >
                <Toggle
                  checked={localSettings.showNotifications}
                  onChange={(checked) => handleChange('showNotifications', checked)}
                />
              </SettingRow>
            </div>
          </section>

          {/* Storage Management */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <HardDrive className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Quản lý bộ nhớ
            </h3>

            {/* Storage Info */}
            {storageInfo && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Đã sử dụng</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatFileSize(storageInfo.usage)} / {formatFileSize(storageInfo.quota)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      storageInfo.percentUsed > 90
                        ? 'bg-red-500'
                        : storageInfo.percentUsed > 70
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${storageInfo.percentUsed}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  {storageInfo.percentUsed.toFixed(1)}% đã sử dụng
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Auto Delete */}
              <SettingRow
                icon={Trash2}
                label="Tự động xóa"
                description="Xóa task hoàn thành sau một khoảng thời gian"
              >
                <select
                  value={localSettings.autoDeleteAfter}
                  onChange={(e) => handleChange('autoDeleteAfter', e.target.value)}
                  className="px-3 py-2 bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  {autoDeleteOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SettingRow>

              {/* Clear Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => handleClearClick('completed')}
                  className="px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  Xóa đã hoàn thành
                </button>
                <button
                  onClick={() => handleClearClick('failed')}
                  className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Xóa thất bại
                </button>
                <button
                  onClick={() => handleClearClick('all')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
          </section>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">Lưu ý về bộ nhớ</p>
              <p>
                Download sử dụng Cache API và IndexedDB. Trình duyệt có thể xóa dữ liệu
                nếu thiếu bộ nhớ. Nên export chapters quan trọng.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Khôi phục mặc định
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Lưu cài đặt
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Xác nhận xóa"
        size="small"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {clearType === 'all'
            ? 'Bạn có chắc muốn xóa toàn bộ download queue? Hành động này không thể hoàn tác.'
            : clearType === 'completed'
            ? 'Xóa tất cả các task đã hoàn thành?'
            : 'Xóa tất cả các task thất bại?'}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowClearConfirm(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleClearConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Xóa
          </button>
        </div>
      </Modal>
    </>
  );
};

/**
 * Setting Row Component
 */
const SettingRow = ({ icon: Icon, label, description, disabled, children }) => (
  <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex items-start gap-3 flex-1">
      <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          {description}
        </p>
      </div>
    </div>
    <div className="flex-shrink-0">
      {children}
    </div>
  </div>
);

/**
 * Toggle Component
 */
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900 ${
      disabled
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer'
    } ${
      checked
        ? 'bg-primary-600'
        : 'bg-gray-200 dark:bg-dark-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

/**
 * Slider Component
 */
const Slider = ({ min, max, value, onChange }) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-32 h-2 bg-gray-200 dark:bg-dark-600 rounded-lg appearance-none cursor-pointer slider-thumb"
      style={{
        background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
          ((value - min) / (max - min)) * 100
        }%, rgb(229, 231, 235) ${((value - min) / (max - min)) * 100}%, rgb(229, 231, 235) 100%)`
      }}
    />
    <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-center">
      {value}
    </span>
  </div>
);

export default DownloadSettings;
