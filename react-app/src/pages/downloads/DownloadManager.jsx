// 📁 src/pages/downloads/DownloadManager.jsx
// 📥 Download Queue Manager Page

import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import useDownloadQueueStore, { DOWNLOAD_STATUS } from '../../store/downloadQueueStore';
import DownloadTaskCard from './DownloadTaskCard';
import Modal from '../../components/common/Modal';
import { toast } from 'react-hot-toast';

/**
 * Download Manager Page
 * Shows all download tasks with controls for pause/resume/cancel/retry
 * Features statistics dashboard, task list with tabs, and batch operations
 * 
 * @component
 * @returns {JSX.Element} Download manager page
 */
const DownloadManager = () => {
  // Store subscriptions
  const {
    tasks,
    activeDownloads,
    stats,
    clearCompleted,
    clearFailed,
    clearAll
  } = useDownloadQueueStore();

  // Local state
  const [activeTab, setActiveTab] = useState('all'); // all, downloading, pending, completed, failed
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearType, setClearType] = useState(''); // 'completed', 'failed', 'all'

  // Convert Map to Array and sort by createdAt (newest first)
  const tasksArray = useMemo(() => {
    return Array.from(tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks]);

  // Filter tasks by tab
  const filteredTasks = useMemo(() => {
    if (activeTab === 'all') return tasksArray;
    if (activeTab === 'downloading') {
      return tasksArray.filter(task => task.status === DOWNLOAD_STATUS.DOWNLOADING);
    }
    if (activeTab === 'pending') {
      return tasksArray.filter(task => task.status === DOWNLOAD_STATUS.PENDING);
    }
    if (activeTab === 'completed') {
      return tasksArray.filter(task => task.status === DOWNLOAD_STATUS.COMPLETED);
    }
    if (activeTab === 'failed') {
      return tasksArray.filter(task => 
        task.status === DOWNLOAD_STATUS.FAILED || task.status === DOWNLOAD_STATUS.CANCELLED
      );
    }
    return tasksArray;
  }, [tasksArray, activeTab]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const downloading = tasksArray.filter(t => t.status === DOWNLOAD_STATUS.DOWNLOADING).length;
    const pending = tasksArray.filter(t => t.status === DOWNLOAD_STATUS.PENDING).length;
    const completed = tasksArray.filter(t => t.status === DOWNLOAD_STATUS.COMPLETED).length;
    const failed = tasksArray.filter(t => 
      t.status === DOWNLOAD_STATUS.FAILED || t.status === DOWNLOAD_STATUS.CANCELLED
    ).length;
    
    return {
      total: tasksArray.length,
      downloading,
      pending,
      completed,
      failed
    };
  }, [tasksArray]);

  // Handle clear actions
  const handleClearConfirm = () => {
    try {
      if (clearType === 'completed') {
        clearCompleted();
        toast.success('Đã xóa tất cả download hoàn thành');
      } else if (clearType === 'failed') {
        clearFailed();
        toast.success('Đã xóa tất cả download thất bại');
      } else if (clearType === 'all') {
        clearAll();
        toast.success('Đã xóa toàn bộ queue');
      }
    } catch (error) {
      toast.error('Không thể xóa: ' + error.message);
    } finally {
      setShowClearModal(false);
      setClearType('');
    }
  };

  const handleClearClick = (type) => {
    setClearType(type);
    setShowClearModal(true);
  };

  // Tab configuration
  const tabs = [
    { id: 'all', label: 'Tất cả', count: statistics.total },
    { id: 'downloading', label: 'Đang tải', count: statistics.downloading },
    { id: 'pending', label: 'Chờ tải', count: statistics.pending },
    { id: 'completed', label: 'Hoàn thành', count: statistics.completed },
    { id: 'failed', label: 'Thất bại', count: statistics.failed }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Download className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Download Manager
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Quản lý queue download của bạn
                </p>
              </div>
            </div>

            {/* Clear buttons */}
            <div className="flex gap-2">
              {statistics.completed > 0 && (
                <button
                  onClick={() => handleClearClick('completed')}
                  className="px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline-block mr-2" />
                  Xóa hoàn thành
                </button>
              )}
              {statistics.failed > 0 && (
                <button
                  onClick={() => handleClearClick('failed')}
                  className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline-block mr-2" />
                  Xóa thất bại
                </button>
              )}
              {statistics.total > 0 && (
                <button
                  onClick={() => handleClearClick('all')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-dark-700 rounded-lg hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline-block mr-2" />
                  Xóa tất cả
                </button>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total */}
            <StatCard
              icon={Download}
              label="Tổng số"
              value={statistics.total}
              color="blue"
            />
            
            {/* Downloading */}
            <StatCard
              icon={Loader2}
              label="Đang tải"
              value={statistics.downloading}
              color="purple"
              animated
            />
            
            {/* Pending */}
            <StatCard
              icon={Clock}
              label="Chờ tải"
              value={statistics.pending}
              color="yellow"
            />
            
            {/* Completed */}
            <StatCard
              icon={CheckCircle}
              label="Hoàn thành"
              value={statistics.completed}
              color="green"
            />
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 mb-4">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <DownloadTaskCard key={task.id} task={task} />
              ))
            ) : (
              <EmptyState activeTab={activeTab} />
            )}
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <Modal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          title="Xác nhận xóa"
        >
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {clearType === 'all' && 'Xóa toàn bộ queue?'}
                  {clearType === 'completed' && 'Xóa tất cả download hoàn thành?'}
                  {clearType === 'failed' && 'Xóa tất cả download thất bại?'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {clearType === 'all' && 'Hành động này sẽ xóa TẤT CẢ các download (bao gồm cả đang tải). Bạn không thể hoàn tác.'}
                  {clearType === 'completed' && 'Hành động này sẽ xóa tất cả download đã hoàn thành khỏi danh sách.'}
                  {clearType === 'failed' && 'Hành động này sẽ xóa tất cả download thất bại và bị hủy khỏi danh sách.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearModal(false)}
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
          </div>
        </Modal>
      )}
    </div>
  );
};

/**
 * Statistics Card Component
 */
const StatCard = ({ icon: Icon, label, value, color, animated }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${animated ? 'animate-spin' : ''}`} />
        </div>
      </div>
    </div>
  );
};

/**
 * Empty State Component
 */
const EmptyState = ({ activeTab }) => {
  const emptyStateConfig = {
    all: {
      icon: Download,
      title: 'Chưa có download nào',
      description: 'Queue download của bạn đang trống. Hãy thêm chapter để tải xuống.'
    },
    downloading: {
      icon: Loader2,
      title: 'Không có download đang chạy',
      description: 'Hiện tại không có download nào đang được xử lý.'
    },
    pending: {
      icon: Clock,
      title: 'Không có download đang chờ',
      description: 'Tất cả download đã được xử lý hoặc queue đang trống.'
    },
    completed: {
      icon: CheckCircle,
      title: 'Chưa có download hoàn thành',
      description: 'Download hoàn thành sẽ xuất hiện ở đây.'
    },
    failed: {
      icon: XCircle,
      title: 'Không có download thất bại',
      description: 'Tuyệt vời! Không có download nào bị lỗi.'
    }
  };

  const config = emptyStateConfig[activeTab] || emptyStateConfig.all;
  const Icon = config.icon;

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 p-12">
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-700 mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {config.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {config.description}
        </p>
      </div>
    </div>
  );
};

export default DownloadManager;
