/**
 * Download Queue - Custom React Hooks
 * 
 * Provides optimized hooks for accessing download queue state:
 * - useDownloadQueue: Main hook for queue operations
 * - useDownloadTask: Hook for single task operations
 * - useDownloadStats: Hook for statistics
 * - useActiveDownloads: Hook for active downloads
 */

import { useMemo } from 'react';
import { useDownloadQueueStore } from '../store/downloadQueueStore';
import {
  calculateTotalProgress,
  estimateTimeRemaining,
  formatDuration,
} from '../utils/downloadHelpers';

/**
 * Main hook for download queue operations
 * 
 * Provides memoized selectors and actions for queue management
 * 
 * @returns {Object} Queue state and actions
 * 
 * @example
 * const { tasks, activeCount, addToQueue } = useDownloadQueue();
 */
export function useDownloadQueue() {
  // Subscribe to store state
  const tasks = useDownloadQueueStore(state => state.tasks);
  const activeDownloads = useDownloadQueueStore(state => state.activeDownloads);
  const stats = useDownloadQueueStore(state => state.stats);
  
  // Subscribe to actions
  const addToQueue = useDownloadQueueStore(state => state.addToQueue);
  const removeFromQueue = useDownloadQueueStore(state => state.removeFromQueue);
  const pauseTask = useDownloadQueueStore(state => state.pauseTask);
  const resumeTask = useDownloadQueueStore(state => state.resumeTask);
  const cancelTask = useDownloadQueueStore(state => state.cancelTask);
  const retryTask = useDownloadQueueStore(state => state.retryTask);
  const processQueue = useDownloadQueueStore(state => state.processQueue);
  const clearCompleted = useDownloadQueueStore(state => state.clearCompleted);
  const clearFailed = useDownloadQueueStore(state => state.clearFailed);
  const clearAll = useDownloadQueueStore(state => state.clearAll);

  // Memoized computed values
  const tasksArray = useMemo(() => {
    return Array.from(tasks.values());
  }, [tasks]);

  const activeCount = useMemo(() => {
    return activeDownloads.size;
  }, [activeDownloads]);

  const pendingCount = useMemo(() => {
    return tasksArray.filter(task => task.status === 'pending').length;
  }, [tasksArray]);

  const completedCount = useMemo(() => {
    return tasksArray.filter(task => task.status === 'completed').length;
  }, [tasksArray]);

  const failedCount = useMemo(() => {
    return tasksArray.filter(task => task.status === 'failed').length;
  }, [tasksArray]);

  const totalProgress = useMemo(() => {
    return calculateTotalProgress(tasks, activeDownloads);
  }, [tasks, activeDownloads]);

  const hasActiveDownloads = useMemo(() => {
    return activeDownloads.size > 0;
  }, [activeDownloads]);

  const hasPendingTasks = useMemo(() => {
    return pendingCount > 0;
  }, [pendingCount]);

  return {
    // State
    tasks,
    tasksArray,
    activeDownloads,
    stats,
    
    // Computed
    activeCount,
    pendingCount,
    completedCount,
    failedCount,
    totalProgress,
    hasActiveDownloads,
    hasPendingTasks,
    
    // Actions
    addToQueue,
    removeFromQueue,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    processQueue,
    clearCompleted,
    clearFailed,
    clearAll,
  };
}

/**
 * Hook for single download task operations
 * 
 * Subscribes to a specific task by ID and provides task-specific actions
 * 
 * @param {string} taskId - Task ID to subscribe to
 * @returns {Object} Task state and actions
 * 
 * @example
 * const { task, isActive, pause, resume } = useDownloadTask(taskId);
 */
export function useDownloadTask(taskId) {
  // Subscribe to specific task
  const task = useDownloadQueueStore(state => 
    state.tasks.get(taskId)
  );

  const isActive = useDownloadQueueStore(state => 
    state.activeDownloads.has(taskId)
  );

  // Actions
  const pauseTask = useDownloadQueueStore(state => state.pauseTask);
  const resumeTask = useDownloadQueueStore(state => state.resumeTask);
  const cancelTask = useDownloadQueueStore(state => state.cancelTask);
  const retryTask = useDownloadQueueStore(state => state.retryTask);
  const removeFromQueue = useDownloadQueueStore(state => state.removeFromQueue);

  // Memoized task info
  const timeInfo = useMemo(() => {
    if (!task || !task.startedAt) {
      return {
        elapsed: 0,
        remaining: null,
        eta: null,
        elapsedFormatted: '0s',
        remainingFormatted: null,
      };
    }

    const { elapsed, remaining, eta } = estimateTimeRemaining(
      task.progress || 0,
      task.startedAt
    );

    return {
      elapsed,
      remaining,
      eta,
      elapsedFormatted: formatDuration(elapsed),
      remainingFormatted: remaining ? formatDuration(remaining) : null,
    };
  }, [task]);

  // Task-specific actions
  const pause = useMemo(() => 
    () => pauseTask(taskId),
    [pauseTask, taskId]
  );

  const resume = useMemo(() => 
    () => resumeTask(taskId),
    [resumeTask, taskId]
  );

  const cancel = useMemo(() => 
    () => cancelTask(taskId),
    [cancelTask, taskId]
  );

  const retry = useMemo(() => 
    () => retryTask(taskId),
    [retryTask, taskId]
  );

  const remove = useMemo(() => 
    () => removeFromQueue(taskId),
    [removeFromQueue, taskId]
  );

  return {
    // State
    task,
    isActive,
    timeInfo,
    
    // Computed
    exists: !!task,
    isDownloading: task?.status === 'downloading',
    isPaused: task?.status === 'paused',
    isCompleted: task?.status === 'completed',
    isFailed: task?.status === 'failed',
    isCancelled: task?.status === 'cancelled',
    isPending: task?.status === 'pending',
    
    // Actions
    pause,
    resume,
    cancel,
    retry,
    remove,
  };
}

/**
 * Hook for download statistics
 * 
 * Provides memoized statistics about the download queue
 * 
 * @returns {Object} Statistics object
 * 
 * @example
 * const { totalTasks, successRate, averageSpeed } = useDownloadStats();
 */
export function useDownloadStats() {
  const tasks = useDownloadQueueStore(state => state.tasks);
  const stats = useDownloadQueueStore(state => state.stats);

  const statistics = useMemo(() => {
    const tasksArray = Array.from(tasks.values());
    
    const total = tasksArray.length;
    const downloading = tasksArray.filter(t => t.status === 'downloading').length;
    const pending = tasksArray.filter(t => t.status === 'pending').length;
    const completed = tasksArray.filter(t => t.status === 'completed').length;
    const failed = tasksArray.filter(t => t.status === 'failed').length;
    const paused = tasksArray.filter(t => t.status === 'paused').length;
    const cancelled = tasksArray.filter(t => t.status === 'cancelled').length;

    // Calculate success rate
    const finishedTasks = completed + failed + cancelled;
    const successRate = finishedTasks > 0 
      ? (completed / finishedTasks) * 100 
      : 0;

    // Calculate average download size
    const completedTasks = tasksArray.filter(t => t.status === 'completed');
    const totalSize = completedTasks.reduce((sum, t) => sum + (t.downloadedBytes || 0), 0);
    const averageSize = completedTasks.length > 0 
      ? totalSize / completedTasks.length 
      : 0;

    // Calculate average time
    const completedWithTime = completedTasks.filter(t => t.startedAt && t.completedAt);
    const totalTime = completedWithTime.reduce(
      (sum, t) => sum + (t.completedAt - t.startedAt),
      0
    );
    const averageTime = completedWithTime.length > 0 
      ? totalTime / completedWithTime.length 
      : 0;

    return {
      total,
      downloading,
      pending,
      completed,
      failed,
      paused,
      cancelled,
      successRate: Math.round(successRate * 10) / 10,
      averageSize: Math.round(averageSize),
      averageTime: Math.round(averageTime),
      averageTimeFormatted: formatDuration(averageTime),
      ...stats,
    };
  }, [tasks, stats]);

  return statistics;
}

/**
 * Hook for active downloads tracking
 * 
 * Provides information about currently active downloads
 * 
 * @returns {Object} Active downloads info
 * 
 * @example
 * const { activeDownloads, activeCount, totalProgress } = useActiveDownloads();
 */
export function useActiveDownloads() {
  const tasks = useDownloadQueueStore(state => state.tasks);
  const activeDownloads = useDownloadQueueStore(state => state.activeDownloads);

  const activeInfo = useMemo(() => {
    const activeTasksArray = Array.from(activeDownloads)
      .map(taskId => tasks.get(taskId))
      .filter(Boolean);

    const count = activeTasksArray.length;
    
    // Calculate total progress
    const totalProgress = count > 0
      ? activeTasksArray.reduce((sum, task) => sum + (task.progress || 0), 0) / count
      : 0;

    // Calculate total downloaded bytes
    const totalDownloadedBytes = activeTasksArray.reduce(
      (sum, task) => sum + (task.downloadedBytes || 0),
      0
    );

    // Calculate total bytes
    const totalBytes = activeTasksArray.reduce(
      (sum, task) => sum + (task.totalBytes || 0),
      0
    );

    // Calculate average speed
    const now = Date.now();
    const totalSpeed = activeTasksArray.reduce((sum, task) => {
      if (!task.startedAt) return sum;
      const elapsed = now - task.startedAt;
      if (elapsed <= 0) return sum;
      return sum + ((task.downloadedBytes || 0) / elapsed) * 1000;
    }, 0);

    return {
      activeDownloads,
      activeTasks: activeTasksArray,
      count,
      totalProgress: Math.round(totalProgress * 10) / 10,
      totalDownloadedBytes,
      totalBytes,
      averageSpeed: Math.round(totalSpeed),
    };
  }, [tasks, activeDownloads]);

  return activeInfo;
}

/**
 * Hook for filtered tasks
 * 
 * Returns tasks filtered by status
 * 
 * @param {string} status - Status to filter by (or 'all')
 * @returns {Array} Filtered tasks array
 * 
 * @example
 * const downloadingTasks = useFilteredTasks('downloading');
 */
export function useFilteredTasks(status = 'all') {
  const tasks = useDownloadQueueStore(state => state.tasks);

  const filteredTasks = useMemo(() => {
    const tasksArray = Array.from(tasks.values());
    
    if (status === 'all') {
      return tasksArray;
    }

    return tasksArray.filter(task => task.status === status);
  }, [tasks, status]);

  return filteredTasks;
}

export default {
  useDownloadQueue,
  useDownloadTask,
  useDownloadStats,
  useActiveDownloads,
  useFilteredTasks,
};
