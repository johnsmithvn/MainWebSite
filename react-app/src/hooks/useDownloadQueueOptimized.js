// 📁 src/hooks/useDownloadQueueOptimized.js
// ⚡ Optimized Download Queue Hooks with Memoization

import { useMemo, useCallback } from 'react';
import useDownloadQueueStore, { DOWNLOAD_STATUS } from '../store/downloadQueueStore';

/**
 * Optimized hook for download queue with heavy memoization
 * Prevents unnecessary re-renders when queue updates
 * 
 * @returns {Object} Optimized queue data and actions
 */
export function useDownloadQueueOptimized() {
  const store = useDownloadQueueStore();

  // Memoized selectors
  const tasksArray = useMemo(
    () => Array.from(store.tasks.values()),
    [store.tasks]
  );

  const activeDownloadsArray = useMemo(
    () => Array.from(store.activeDownloads),
    [store.activeDownloads]
  );

  // Memoized statistics
  const statistics = useMemo(() => {
    const stats = {
      total: tasksArray.length,
      downloading: 0,
      pending: 0,
      completed: 0,
      failed: 0,
      paused: 0,
      cancelled: 0
    };

    for (const task of tasksArray) {
      switch (task.status) {
        case DOWNLOAD_STATUS.DOWNLOADING:
          stats.downloading++;
          break;
        case DOWNLOAD_STATUS.PENDING:
          stats.pending++;
          break;
        case DOWNLOAD_STATUS.COMPLETED:
          stats.completed++;
          break;
        case DOWNLOAD_STATUS.FAILED:
          stats.failed++;
          break;
        case DOWNLOAD_STATUS.PAUSED:
          stats.paused++;
          break;
        case DOWNLOAD_STATUS.CANCELLED:
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }, [tasksArray]);

  // Memoized total progress
  const totalProgress = useMemo(() => {
    if (activeDownloadsArray.length === 0) return 0;

    const activeTasks = tasksArray.filter(
      task => task.status === DOWNLOAD_STATUS.DOWNLOADING
    );

    if (activeTasks.length === 0) return 0;

    const totalProgressSum = activeTasks.reduce(
      (sum, task) => sum + (task.progress || 0),
      0
    );

    return Math.round(totalProgressSum / activeTasks.length);
  }, [tasksArray, activeDownloadsArray]);

  // Memoized filtered tasks by status
  const tasksByStatus = useMemo(() => {
    const byStatus = {
      [DOWNLOAD_STATUS.DOWNLOADING]: [],
      [DOWNLOAD_STATUS.PENDING]: [],
      [DOWNLOAD_STATUS.COMPLETED]: [],
      [DOWNLOAD_STATUS.FAILED]: [],
      [DOWNLOAD_STATUS.PAUSED]: [],
      [DOWNLOAD_STATUS.CANCELLED]: []
    };

    for (const task of tasksArray) {
      if (byStatus[task.status]) {
        byStatus[task.status].push(task);
      }
    }

    return byStatus;
  }, [tasksArray]);

  // Memoized queue info
  const queueInfo = useMemo(() => ({
    hasActiveDownloads: activeDownloadsArray.length > 0,
    hasPendingTasks: statistics.pending > 0,
    hasFailedTasks: statistics.failed > 0,
    isProcessing: activeDownloadsArray.length > 0,
    queueLength: statistics.pending + statistics.downloading
  }), [activeDownloadsArray, statistics]);

  // Stable action callbacks
  const actions = useMemo(() => ({
    addToQueue: store.addToQueue,
    removeFromQueue: store.removeFromQueue,
    pauseTask: store.pauseTask,
    resumeTask: store.resumeTask,
    cancelTask: store.cancelTask,
    retryTask: store.retryTask,
    clearCompleted: store.clearCompleted,
    clearFailed: store.clearFailed,
    clearAll: store.clearAll,
    updateSettings: store.updateSettings
  }), [store]);

  return {
    // Data
    tasks: store.tasks,
    tasksArray,
    activeDownloads: store.activeDownloads,
    activeDownloadsArray,
    settings: store.settings,
    stats: store.stats,

    // Computed
    statistics,
    totalProgress,
    tasksByStatus,
    queueInfo,

    // Actions
    ...actions
  };
}

/**
 * Hook for single task with optimized updates
 * Only re-renders when specific task changes
 * 
 * @param {string} taskId - Task ID to watch
 * @returns {Object|null} Task data or null
 */
export function useDownloadTask(taskId) {
  const tasks = useDownloadQueueStore(state => state.tasks);

  return useMemo(() => {
    return tasks.get(taskId) || null;
  }, [tasks, taskId]);
}

/**
 * Hook for task filtering with memoization
 * 
 * @param {Function} filterFn - Filter function
 * @returns {Array} Filtered tasks
 */
export function useFilteredTasks(filterFn) {
  const tasks = useDownloadQueueStore(state => state.tasks);

  return useMemo(() => {
    const tasksArray = Array.from(tasks.values());
    return tasksArray.filter(filterFn);
  }, [tasks, filterFn]);
}

/**
 * Hook for task sorting with memoization
 * 
 * @param {Function} sortFn - Sort function
 * @returns {Array} Sorted tasks
 */
export function useSortedTasks(sortFn) {
  const tasks = useDownloadQueueStore(state => state.tasks);

  return useMemo(() => {
    const tasksArray = Array.from(tasks.values());
    return tasksArray.sort(sortFn);
  }, [tasks, sortFn]);
}

/**
 * Stable sort functions
 */
export const sortFunctions = {
  byAddedTime: (a, b) => a.addedAt - b.addedAt,
  byAddedTimeDesc: (a, b) => b.addedAt - a.addedAt,
  byProgress: (a, b) => (b.progress || 0) - (a.progress || 0),
  byProgressAsc: (a, b) => (a.progress || 0) - (b.progress || 0),
  byMangaTitle: (a, b) => (a.mangaTitle || '').localeCompare(b.mangaTitle || ''),
  byChapterTitle: (a, b) => (a.chapterTitle || '').localeCompare(b.chapterTitle || '')
};

/**
 * Stable filter functions
 */
export const filterFunctions = {
  isActive: (task) => task.status === DOWNLOAD_STATUS.DOWNLOADING,
  isPending: (task) => task.status === DOWNLOAD_STATUS.PENDING,
  isCompleted: (task) => task.status === DOWNLOAD_STATUS.COMPLETED,
  isFailed: (task) => task.status === DOWNLOAD_STATUS.FAILED,
  isPaused: (task) => task.status === DOWNLOAD_STATUS.PAUSED,
  isCancelled: (task) => task.status === DOWNLOAD_STATUS.CANCELLED,
  hasError: (task) => task.error != null,
  bySource: (source) => (task) => task.source === source,
  byManga: (mangaId) => (task) => task.mangaId === mangaId
};

/**
 * Hook for batch operations with optimized performance
 */
export function useBatchOperations() {
  const store = useDownloadQueueStore();

  const pauseAll = useCallback(() => {
    const activeTasks = Array.from(store.tasks.values()).filter(
      task => task.status === DOWNLOAD_STATUS.DOWNLOADING
    );

    activeTasks.forEach(task => store.pauseTask(task.id));
  }, [store]);

  const resumeAll = useCallback(() => {
    const pausedTasks = Array.from(store.tasks.values()).filter(
      task => task.status === DOWNLOAD_STATUS.PAUSED
    );

    pausedTasks.forEach(task => store.resumeTask(task.id));
  }, [store]);

  const retryAllFailed = useCallback(() => {
    const failedTasks = Array.from(store.tasks.values()).filter(
      task => task.status === DOWNLOAD_STATUS.FAILED
    );

    failedTasks.forEach(task => store.retryTask(task.id));
  }, [store]);

  const cancelAll = useCallback(() => {
    const activeTasks = Array.from(store.tasks.values()).filter(
      task => task.status === DOWNLOAD_STATUS.DOWNLOADING || 
              task.status === DOWNLOAD_STATUS.PENDING
    );

    activeTasks.forEach(task => store.cancelTask(task.id));
  }, [store]);

  return {
    pauseAll,
    resumeAll,
    retryAllFailed,
    cancelAll
  };
}
