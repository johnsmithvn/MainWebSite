/**
 * Download Queue Store
 * 
 * Manages download queue state with concurrent processing and persistence
 * Features:
 * - Task-based queue with status tracking
 * - Max 2 concurrent downloads
 * - localStorage persistence
 * - Retry mechanism with exponential backoff
 * - Progress tracking and statistics
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import downloadWorker from '../workers/downloadWorker';

// ============================================================================
// CONSTANTS
// ============================================================================

export const DOWNLOAD_STATUS = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
};

export const MAX_CONCURRENT_DOWNLOADS = 2;
export const DEFAULT_RETRY_COUNT = 3;
export const RETRY_DELAY_BASE = 1000; // 1 second, will use exponential backoff

// ============================================================================
// TASK INTERFACE
// ============================================================================

/**
 * @typedef {Object} DownloadTask
 * @property {string} id - Unique task ID (format: `${source}_${mangaId}_${chapterId}_${timestamp}`)
 * @property {string} source - Source database (e.g., 'ROOT_MANGAH')
 * @property {string} mangaId - Manga folder ID
 * @property {string} mangaTitle - Manga display name
 * @property {string} chapterId - Chapter folder name
 * @property {string} chapterTitle - Chapter display name
 * @property {'pending'|'downloading'|'completed'|'failed'|'paused'|'cancelled'} status
 * @property {number} progress - Progress percentage (0-100)
 * @property {number} currentPage - Current downloaded page
 * @property {number} totalPages - Total pages in chapter
 * @property {number} downloadedSize - Downloaded bytes
 * @property {number} totalSize - Total bytes (estimated)
 * @property {string|null} error - Error message if failed
 * @property {number} retryCount - Current retry attempt
 * @property {number} maxRetries - Maximum retry attempts
 * @property {number} createdAt - Task creation timestamp
 * @property {number|null} startedAt - Download start timestamp
 * @property {number|null} completedAt - Download completion timestamp
 * @property {AbortController|null} abortController - For cancellation (not persisted)
 */

// ============================================================================
// STORE
// ============================================================================

const useDownloadQueueStore = create(
  persist(
    (set, get) => ({
      // ========================================================================
      // STATE
      // ========================================================================

      /** @type {Map<string, DownloadTask>} */
      tasks: new Map(),

      /** @type {Set<string>} Task IDs currently being downloaded */
      activeDownloads: new Set(),

      /** Statistics */
      stats: {
        totalDownloaded: 0,
        totalFailed: 0,
        totalCancelled: 0,
        totalSize: 0
      },

      /** Settings */
      settings: {
        autoDownload: true,
        maxConcurrent: MAX_CONCURRENT_DOWNLOADS,
        maxRetries: DEFAULT_RETRY_COUNT,
        showNotifications: true
      },

      // ========================================================================
      // ACTIONS: Task Management
      // ========================================================================

      /**
       * Add a new task to the queue
       * @param {Object} taskData - Task parameters
       * @returns {string} Task ID
       */
      addToQueue: (taskData) => {
        const { source, mangaId, mangaTitle, chapterId, chapterTitle, totalPages } = taskData;
        
        // Generate unique task ID
        const taskId = `${source}_${mangaId}_${chapterId}_${Date.now()}`;
        
        // Create task object
        const task = {
          id: taskId,
          source,
          mangaId,
          mangaTitle,
          chapterId,
          chapterTitle,
          status: DOWNLOAD_STATUS.PENDING,
          progress: 0,
          currentPage: 0,
          totalPages: totalPages || 0,
          downloadedSize: 0,
          totalSize: 0,
          error: null,
          retryCount: 0,
          maxRetries: get().settings.maxRetries,
          createdAt: Date.now(),
          startedAt: null,
          completedAt: null,
          abortController: null
        };

        set((state) => {
          const newTasks = new Map(state.tasks);
          newTasks.set(taskId, task);
          return { tasks: newTasks };
        });

        console.log('[DownloadQueue] Task added:', taskId, task);
        
        // Auto-start processing if enabled
        if (get().settings.autoDownload) {
          setTimeout(() => get().processQueue(), 100);
        }

        return taskId;
      },

      /**
       * Remove a task from the queue
       * @param {string} taskId
       */
      removeFromQueue: (taskId) => {
        const state = get();
        const task = state.tasks.get(taskId);
        
        if (!task) {
          console.warn('[DownloadQueue] Task not found:', taskId);
          return;
        }

        // Cancel if downloading
        if (task.status === DOWNLOAD_STATUS.DOWNLOADING && task.abortController) {
          task.abortController.abort();
        }

        set((state) => {
          const newTasks = new Map(state.tasks);
          newTasks.delete(taskId);
          
          const newActiveDownloads = new Set(state.activeDownloads);
          newActiveDownloads.delete(taskId);
          
          return { 
            tasks: newTasks,
            activeDownloads: newActiveDownloads
          };
        });

        console.log('[DownloadQueue] Task removed:', taskId);
      },

      /**
       * Update task progress
       * @param {string} taskId
       * @param {number} currentPage
       * @param {number} totalPages
       * @param {number} downloadedSize
       */
      updateProgress: (taskId, currentPage, totalPages, downloadedSize) => {
        set((state) => {
          const newTasks = new Map(state.tasks);
          const task = newTasks.get(taskId);
          
          if (task && task.status === DOWNLOAD_STATUS.DOWNLOADING) {
            const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
            
            newTasks.set(taskId, {
              ...task,
              currentPage,
              totalPages,
              downloadedSize,
              progress
            });
          }
          
          return { tasks: newTasks };
        });
      },

      /**
       * Update task status
       * @param {string} taskId
       * @param {string} status
       * @param {string|null} error
       */
      updateStatus: (taskId, status, error = null) => {
        set((state) => {
          const newTasks = new Map(state.tasks);
          const task = newTasks.get(taskId);
          
          if (!task) return state;

          const updates = {
            ...task,
            status,
            error
          };

          // Set timestamps based on status
          if (status === DOWNLOAD_STATUS.DOWNLOADING && !task.startedAt) {
            updates.startedAt = Date.now();
          }
          
          if (status === DOWNLOAD_STATUS.COMPLETED || status === DOWNLOAD_STATUS.FAILED || status === DOWNLOAD_STATUS.CANCELLED) {
            updates.completedAt = Date.now();
            updates.abortController = null;
            
            // Update stats
            const newStats = { ...state.stats };
            if (status === DOWNLOAD_STATUS.COMPLETED) {
              newStats.totalDownloaded += 1;
              newStats.totalSize += task.downloadedSize;
            } else if (status === DOWNLOAD_STATUS.FAILED) {
              newStats.totalFailed += 1;
            } else if (status === DOWNLOAD_STATUS.CANCELLED) {
              newStats.totalCancelled += 1;
            }
            
            // Remove from active downloads
            const newActiveDownloads = new Set(state.activeDownloads);
            newActiveDownloads.delete(taskId);
            
            newTasks.set(taskId, updates);
            
            return { 
              tasks: newTasks,
              activeDownloads: newActiveDownloads,
              stats: newStats
            };
          }

          newTasks.set(taskId, updates);
          return { tasks: newTasks };
        });

        console.log('[DownloadQueue] Status updated:', taskId, status);

        // Continue processing queue if task completed/failed/cancelled
        if ([DOWNLOAD_STATUS.COMPLETED, DOWNLOAD_STATUS.FAILED, DOWNLOAD_STATUS.CANCELLED].includes(status)) {
          setTimeout(() => get().processQueue(), 500);
        }
      },

      // ========================================================================
      // ACTIONS: Task Control
      // ========================================================================

      /**
       * Cancel a download task
       * @param {string} taskId
       */
      cancelTask: (taskId) => {
        const task = get().tasks.get(taskId);
        
        if (!task) {
          console.warn('[DownloadQueue] Task not found:', taskId);
          return;
        }

        // Abort if downloading
        if (task.abortController && task.status === DOWNLOAD_STATUS.DOWNLOADING) {
          task.abortController.abort();
        }

        get().updateStatus(taskId, DOWNLOAD_STATUS.CANCELLED);
        console.log('[DownloadQueue] Task cancelled:', taskId);
      },

      /**
       * Retry a failed task
       * @param {string} taskId
       */
      retryTask: (taskId) => {
        const state = get();
        const task = state.tasks.get(taskId);
        
        if (!task || task.status !== DOWNLOAD_STATUS.FAILED) {
          console.warn('[DownloadQueue] Cannot retry task:', taskId);
          return;
        }

        set((state) => {
          const newTasks = new Map(state.tasks);
          newTasks.set(taskId, {
            ...task,
            status: DOWNLOAD_STATUS.PENDING,
            error: null,
            retryCount: task.retryCount + 1,
            progress: 0,
            currentPage: 0,
            downloadedSize: 0
          });
          return { tasks: newTasks };
        });

        console.log('[DownloadQueue] Task retry queued:', taskId);
        
        // Start processing
        setTimeout(() => get().processQueue(), 100);
      },

      /**
       * Pause a downloading task
       * @param {string} taskId
       */
      pauseTask: (taskId) => {
        const task = get().tasks.get(taskId);
        
        if (!task || task.status !== DOWNLOAD_STATUS.DOWNLOADING) {
          console.warn('[DownloadQueue] Cannot pause task:', taskId);
          return;
        }

        // Abort current download
        if (task.abortController) {
          task.abortController.abort();
        }

        get().updateStatus(taskId, DOWNLOAD_STATUS.PAUSED);
        console.log('[DownloadQueue] Task paused:', taskId);
      },

      /**
       * Resume a paused task
       * @param {string} taskId
       */
      resumeTask: (taskId) => {
        const task = get().tasks.get(taskId);
        
        if (!task || task.status !== DOWNLOAD_STATUS.PAUSED) {
          console.warn('[DownloadQueue] Cannot resume task:', taskId);
          return;
        }

        get().updateStatus(taskId, DOWNLOAD_STATUS.PENDING);
        console.log('[DownloadQueue] Task resumed:', taskId);
        
        // Start processing
        setTimeout(() => get().processQueue(), 100);
      },

      // ========================================================================
      // ACTIONS: Queue Processing
      // ========================================================================

      /**
       * Process the queue and start pending downloads
       */
      processQueue: () => {
        const state = get();
        const { tasks, activeDownloads, settings } = state;

        // Check if we can start more downloads
        if (activeDownloads.size >= settings.maxConcurrent) {
          console.log('[DownloadQueue] Max concurrent downloads reached:', activeDownloads.size);
          return;
        }

        // Find pending tasks
        const pendingTasks = Array.from(tasks.values())
          .filter(task => task.status === DOWNLOAD_STATUS.PENDING)
          .sort((a, b) => a.createdAt - b.createdAt); // FIFO

        if (pendingTasks.length === 0) {
          console.log('[DownloadQueue] No pending tasks');
          return;
        }

        // Start downloads up to max concurrent limit
        const slotsAvailable = settings.maxConcurrent - activeDownloads.size;
        const tasksToStart = pendingTasks.slice(0, slotsAvailable);

        console.log('[DownloadQueue] Starting', tasksToStart.length, 'downloads');

        tasksToStart.forEach(task => {
          get().startDownload(task.id);
        });
      },

      /**
       * Start downloading a specific task
       * @param {string} taskId
       */
      startDownload: async (taskId) => {
        const state = get();
        const task = state.tasks.get(taskId);

        if (!task) {
          console.error('[DownloadQueue] Task not found:', taskId);
          return;
        }

        console.log('[DownloadQueue] Starting download:', taskId);

        // Create abort controller
        const abortController = new AbortController();

        // Update task status
        set((state) => {
          const newTasks = new Map(state.tasks);
          const newActiveDownloads = new Set(state.activeDownloads);
          
          newTasks.set(taskId, {
            ...task,
            status: DOWNLOAD_STATUS.DOWNLOADING,
            startedAt: Date.now(),
            abortController
          });
          
          newActiveDownloads.add(taskId);
          
          return { 
            tasks: newTasks,
            activeDownloads: newActiveDownloads
          };
        });

        // Use downloadWorker instead of direct downloadChapter call
        try {
          await downloadWorker.processTask(
            task,
            // Progress callback
            (currentPage, totalPages, downloadedSize) => {
              get().updateProgress(taskId, currentPage, totalPages, downloadedSize);
            },
            // Complete callback
            (result) => {
              get().updateStatus(taskId, DOWNLOAD_STATUS.COMPLETED);
              console.log('[DownloadQueue] Download completed:', taskId);

              // Show notification if enabled
              if (state.settings.showNotifications) {
                console.log('[DownloadQueue] Notification: Download completed -', task.chapterTitle);
              }
            },
            // Error callback
            (error) => {
              // Handle cancellation
              if (error.message === 'Download cancelled') {
                console.log('[DownloadQueue] Download cancelled by worker:', taskId);
                return;
              }

              // Handle failure
              console.error('[DownloadQueue] Download failed:', taskId, error);

              // Check if should retry
              if (task.retryCount < task.maxRetries) {
                // Schedule retry with exponential backoff
                const delay = RETRY_DELAY_BASE * Math.pow(2, task.retryCount);
                console.log('[DownloadQueue] Scheduling retry in', delay, 'ms');
                
                setTimeout(() => {
                  get().retryTask(taskId);
                }, delay);
              } else {
                // Max retries reached
                get().updateStatus(taskId, DOWNLOAD_STATUS.FAILED, error.message);
              }
            }
          );

        } catch (error) {
          console.error('[DownloadQueue] Unexpected error during download:', taskId, error);
          get().updateStatus(taskId, DOWNLOAD_STATUS.FAILED, error.message);
        }
      },

      // ========================================================================
      // ACTIONS: Batch Operations
      // ========================================================================

      /**
       * Clear all completed tasks
       */
      clearCompleted: () => {
        set((state) => {
          const newTasks = new Map();
          
          state.tasks.forEach((task, id) => {
            if (task.status !== DOWNLOAD_STATUS.COMPLETED) {
              newTasks.set(id, task);
            }
          });
          
          console.log('[DownloadQueue] Cleared', state.tasks.size - newTasks.size, 'completed tasks');
          return { tasks: newTasks };
        });
      },

      /**
       * Clear all failed tasks
       */
      clearFailed: () => {
        set((state) => {
          const newTasks = new Map();
          
          state.tasks.forEach((task, id) => {
            if (task.status !== DOWNLOAD_STATUS.FAILED) {
              newTasks.set(id, task);
            }
          });
          
          console.log('[DownloadQueue] Cleared', state.tasks.size - newTasks.size, 'failed tasks');
          return { tasks: newTasks };
        });
      },

      /**
       * Clear all tasks (with confirmation)
       */
      clearAll: () => {
        const state = get();
        
        // Cancel all active downloads
        state.activeDownloads.forEach(taskId => {
          get().cancelTask(taskId);
        });

        // Clear all tasks
        set({ 
          tasks: new Map(),
          activeDownloads: new Set()
        });

        console.log('[DownloadQueue] All tasks cleared');
      },

      // ========================================================================
      // ACTIONS: Settings
      // ========================================================================

      /**
       * Update settings
       * @param {Object} newSettings
       */
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
        
        console.log('[DownloadQueue] Settings updated:', newSettings);
      },

      // ========================================================================
      // SELECTORS (Helper Methods)
      // ========================================================================

      /**
       * Get tasks by status
       * @param {string} status
       * @returns {DownloadTask[]}
       */
      getTasksByStatus: (status) => {
        return Array.from(get().tasks.values())
          .filter(task => task.status === status);
      },

      /**
       * Get task by ID
       * @param {string} taskId
       * @returns {DownloadTask|undefined}
       */
      getTask: (taskId) => {
        return get().tasks.get(taskId);
      },

      /**
       * Check if a chapter is already in queue or completed
       * @param {string} source
       * @param {string} mangaId
       * @param {string} chapterId
       * @returns {DownloadTask|null}
       */
      findTaskByChapter: (source, mangaId, chapterId) => {
        return Array.from(get().tasks.values()).find(
          task => task.source === source && 
                  task.mangaId === mangaId && 
                  task.chapterId === chapterId &&
                  task.status !== DOWNLOAD_STATUS.CANCELLED
        ) || null;
      }
    }),
    {
      name: 'download-queue-storage',
      // Custom serialization to handle Map and Set
      partialize: (state) => ({
        tasks: Array.from(state.tasks.entries()),
        stats: state.stats,
        settings: state.settings
        // Don't persist activeDownloads - will be recalculated on load
      }),
      // Custom deserialization
      merge: (persistedState, currentState) => {
        const tasks = new Map(persistedState.tasks || []);
        
        // Reset any "downloading" tasks to "pending" on load
        tasks.forEach((task, id) => {
          if (task.status === DOWNLOAD_STATUS.DOWNLOADING) {
            tasks.set(id, { ...task, status: DOWNLOAD_STATUS.PENDING, abortController: null });
          }
        });
        
        return {
          ...currentState,
          ...persistedState,
          tasks,
          activeDownloads: new Set() // Always start fresh
        };
      }
    }
  )
);

export default useDownloadQueueStore;
