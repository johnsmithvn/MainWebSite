// 📁 src/utils/musicDownloadQueue.js
// 📥 Music Download Queue Manager with background processing

import { useState, useEffect } from 'react';

class MusicDownloadQueue {
  constructor() {
    this.queue = [];
    this.activeDownloads = new Map(); // trackPath -> { progress, status, controller }
    this.maxConcurrent = 3; // Maximum concurrent downloads
    this.listeners = new Set();
    this.isProcessing = false;
  }

  // Subscribe to queue updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notify() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  // Get current state
  getState() {
    return {
      queue: [...this.queue],
      activeDownloads: Array.from(this.activeDownloads.entries()).map(([path, data]) => ({
        path,
        ...data
      })),
      totalInQueue: this.queue.length,
      totalActive: this.activeDownloads.size,
      isProcessing: this.isProcessing
    };
  }

  // Add tracks to queue
  addToQueue(tracks, sourceKey) {
    if (!Array.isArray(tracks)) tracks = [tracks];
    
    // Filter out tracks already in queue or downloading
    const newTracks = tracks.filter(track => {
      const exists = this.queue.some(t => t.path === track.path) || 
                     this.activeDownloads.has(track.path);
      return !exists;
    });

    if (newTracks.length === 0) return;

    // Add tracks to queue
    this.queue.push(...newTracks.map(track => ({
      ...track,
      sourceKey,
      addedAt: Date.now(),
      status: 'queued'
    })));

    this.notify();
    this.processQueue();
  }

  // Process queue
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeDownloads.size < this.maxConcurrent) {
      const track = this.queue.shift();
      this.downloadTrack(track);
    }

    this.isProcessing = false;
    this.notify();
  }

  // Download a single track
  async downloadTrack(track) {
    const { path, sourceKey, name } = track;
    const controller = new AbortController();

    // Add to active downloads
    this.activeDownloads.set(path, {
      track,
      progress: 0,
      status: 'downloading',
      controller,
      startedAt: Date.now()
    });
    this.notify();

    try {
      const downloadUrl = `/api/music/download?key=${encodeURIComponent(sourceKey)}&file=${encodeURIComponent(path)}`;
      const fileName = path.split('/').pop();

      // Check if running in Android WebView
      const isAndroidWebView = typeof window.Android !== 'undefined' && 
                               typeof window.Android.downloadFile === 'function';

      if (isAndroidWebView) {
        // Use Android native download
        console.log('📱 Using Android native download for:', fileName);
        
        // Build full URL (relative to absolute)
        const fullUrl = new URL(downloadUrl, window.location.origin).href;
        
        // Call Android interface
        window.Android.downloadFile(fullUrl, fileName, 'audio/mpeg');
        
        // Mark as completed immediately (Android handles the actual download)
        this.activeDownloads.delete(path);
        this.notify();
        this.processQueue();
        return;
      }

      // Web browser download (existing code)
      const response = await fetch(downloadUrl, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Update progress
        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100);
          const activeData = this.activeDownloads.get(path);
          if (activeData) {
            activeData.progress = progress;
            this.notify();
          }
        }
      }

      // Combine chunks
      const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'audio/mpeg' });
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Mark as completed
      this.activeDownloads.delete(path);
      this.notify();

      // Continue processing queue
      this.processQueue();

    } catch (error) {
      console.error('Download error:', error);
      
      // Mark as failed
      const activeData = this.activeDownloads.get(path);
      if (activeData) {
        activeData.status = 'failed';
        activeData.error = error.message;
        this.notify();
        
        // Remove after 5 seconds
        setTimeout(() => {
          this.activeDownloads.delete(path);
          this.notify();
          this.processQueue();
        }, 5000);
      }
    }
  }

  // Cancel a download
  cancelDownload(path) {
    const activeData = this.activeDownloads.get(path);
    if (activeData && activeData.controller) {
      activeData.controller.abort();
    }
    this.activeDownloads.delete(path);
    this.notify();
    this.processQueue();
  }

  // Remove from queue
  removeFromQueue(path) {
    this.queue = this.queue.filter(t => t.path !== path);
    this.notify();
  }

  // Clear completed downloads
  clearCompleted() {
    // Active downloads with progress 100 are considered completed
    // (they're removed immediately after download, so this is just a safeguard)
    this.notify();
  }

  // Clear all
  clearAll() {
    // Cancel all active downloads
    this.activeDownloads.forEach((data, path) => {
      if (data.controller) {
        data.controller.abort();
      }
    });
    
    this.queue = [];
    this.activeDownloads.clear();
    this.notify();
  }
}

// Singleton instance
export const musicDownloadQueue = new MusicDownloadQueue();

// React hook for using the queue
export const useMusicDownloadQueue = () => {
  const [state, setState] = useState(musicDownloadQueue.getState());

  useEffect(() => {
    const unsubscribe = musicDownloadQueue.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    addToQueue: (tracks, sourceKey) => musicDownloadQueue.addToQueue(tracks, sourceKey),
    cancelDownload: (path) => musicDownloadQueue.cancelDownload(path),
    removeFromQueue: (path) => musicDownloadQueue.removeFromQueue(path),
    clearCompleted: () => musicDownloadQueue.clearCompleted(),
    clearAll: () => musicDownloadQueue.clearAll(),
  };
};
