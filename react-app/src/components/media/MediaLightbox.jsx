// 📁 react-app/src/components/media/MediaLightbox.jsx
// 🖼️ Media Lightbox Viewer (Google Photos-like)

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Download } from 'lucide-react';

function MediaLightbox({ items, currentIndex, onClose, onFavorite }) {
  const [index, setIndex] = useState(currentIndex);
  const item = items[index];

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const contentRef = useRef(null);
  const touchStartRef = useRef(null);

  // Download state (learned from Music Player behavior)
  const [isDownloading, setIsDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState({ received: 0, total: 0, percent: 0, status: 'idle', error: null });
  const downloadAbortRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-' || e.key === '_') zoomOut();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index]);

  // Reset zoom when item changes
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setIsPanning(false);
  }, [index]);

  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleNext = () => {
    if (index < items.length - 1) setIndex(index + 1);
  };

  if (!item) return null;

  const isVideo = item.type === 'video';
  const mediaSrc = `/media/${item.path}`;

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const zoomBy = (factor, center) => {
    const newScale = clamp(scale * factor, 1, 8);
    if (newScale === scale) return;

    // Zoom towards cursor position (relative to center)
    if (center && contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      const dx = center.x - (rect.left + rect.width / 2);
      const dy = center.y - (rect.top + rect.height / 2);
      const k = newScale / scale - 1;
      setTranslate({ x: translate.x - dx * k, y: translate.y - dy * k });
    }
    setScale(newScale);
  };

  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    zoomBy(factor, { x: e.clientX, y: e.clientY });
  };

  const onMouseDown = (e) => {
    if (scale <= 1) return; // only pan when zoomed
    setIsPanning(true);
    lastPointRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPointRef.current.x;
    const dy = e.clientY - lastPointRef.current.y;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
  };

  const endPan = () => setIsPanning(false);

  const onDoubleClick = (e) => {
    if (scale === 1) {
      zoomBy(2, { x: e.clientX, y: e.clientY });
    } else {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  };

  const zoomIn = () => zoomBy(1.2);
  const zoomOut = () => zoomBy(0.8333);
  const resetZoom = () => { setScale(1); setTranslate({ x: 0, y: 0 }); };

  // ===== Download (similar to Music Player) =====
  const getFilenameFromPath = (p, fallback = 'download') => {
    if (!p) return fallback;
    const base = String(p).split('/').pop() || fallback;
    return base;
  };

  const getMimeFromExt = (name, fallback = 'application/octet-stream') => {
    const ext = (name?.split('.').pop() || '').toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'webp': return 'image/webp';
      case 'gif': return 'image/gif';
      case 'bmp': return 'image/bmp';
      case 'svg': return 'image/svg+xml';
      case 'mp4':
      case 'm4v': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'mov': return 'video/quicktime';
      case 'mkv': return 'video/x-matroska';
      default:
        return isVideo ? 'video/mp4' : fallback;
    }
  };

  const handleDownload = async () => {
    try {
      const fileName = getFilenameFromPath(item.path, item.name);
      const fullUrl = new URL(mediaSrc, window.location.origin).href;
      const mime = item?.mimeType || getMimeFromExt(fileName);

      // Android WebView native download support (like Music Player)
      const isAndroidWebView = typeof window.Android !== 'undefined' && typeof window.Android.downloadFile === 'function';
      if (isAndroidWebView) {
        try {
          window.Android.downloadFile(fullUrl, fileName, mime);
          return; // Native DownloadManager handles progress/notification
        } catch (err) {
          // Fallback to web download if native fails
          console.warn('Android native download failed, fallback to web:', err);
        }
      }

      // Web download with streaming progress (mirrors musicDownloadQueue logic)
      setIsDownloading(true);
      setDlProgress({ received: 0, total: 0, percent: 0, status: 'starting', error: null });
      const controller = new AbortController();
      downloadAbortRef.current = controller;

      const resp = await fetch(fullUrl, { signal: controller.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);

      const contentLength = resp.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      setDlProgress((p) => ({ ...p, total, status: 'downloading' }));

      // If browser supports stream
      if (resp.body && resp.body.getReader) {
        const reader = resp.body.getReader();
        const chunks = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          setDlProgress((p) => ({
            ...p,
            received,
            percent: total > 0 ? Math.round((received / total) * 100) : p.percent,
          }));
        }
        const blob = new Blob(chunks, { type: resp.headers.get('content-type') || mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback: no stream reader (older browsers)
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDlProgress((p) => ({ ...p, status: 'completed', percent: 100 }));
    } catch (err) {
      console.error('Download error:', err);
      setDlProgress((p) => ({ ...p, status: 'error', error: err?.message || 'Download failed' }));
    } finally {
      // Hide after short delay to let user see completion
      setTimeout(() => {
        setIsDownloading(false);
        setDlProgress({ received: 0, total: 0, percent: 0, status: 'idle', error: null });
        downloadAbortRef.current = null;
      }, 1200);
    }
  };

  // Touch handlers for mobile swipe & pan
  const pinchRef = useRef({ initialDistance: 0, initialScale: 1 });

  const getDistance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx*dx + dy*dy);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      if (scale > 1) {
        setIsPanning(true);
        lastPointRef.current = { x: touch.clientX, y: touch.clientY };
      }
    } else if (e.touches.length === 2) {
      pinchRef.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
      pinchRef.current.initialScale = scale;
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const dist = getDistance(e.touches[0], e.touches[1]);
      const { initialDistance, initialScale } = pinchRef.current;
      if (initialDistance > 0) {
        const factor = dist / initialDistance;
        const newScale = clamp(initialScale * factor, 1, 8);
        setScale(newScale);
      }
    } else if (scale > 1 && isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastPointRef.current.x;
      const dy = touch.clientY - lastPointRef.current.y;
      lastPointRef.current = { x: touch.clientX, y: touch.clientY };
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
    }
  };

  const onTouchEnd = (e) => {
    if (isPanning) setIsPanning(false);
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    const endTime = Date.now();
    const duration = endTime - start.time;
    // Use changedTouches if available
    const touch = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
    if (scale === 1 && touch && e.changedTouches.length === 1) {
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx > 50 && absDy < 80 && duration < 600) {
        if (dx < 0) {
          // swipe left => next
          handleNext();
        } else {
          // swipe right => prev
          handlePrev();
        }
      }
    }
    touchStartRef.current = null;
    pinchRef.current.initialDistance = 0;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="text-white max-w-[60vw]">
          <div className="font-medium truncate" title={item.name}>{item.name}</div>
          <div className="text-sm text-gray-400">
            {index + 1} / {items.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFavorite(item.id, !item.isFavorite)}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <Heart
              size={24}
              className={item.isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}
            />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <Download size={24} className="text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Media Content */}
      <div
        ref={contentRef}
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="presentation"
      >
        {isVideo ? (
          <video
            src={mediaSrc}
            controls
            autoPlay
            className="max-w-full max-h-full"
          />
        ) : (
          <img
            src={mediaSrc}
            alt={item.name}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
            }}
            className="max-w-full max-h-full object-contain pointer-events-none"
          />
        )}

        {/* Zoom controls removed per request (pinch to zoom supported) */}

        {/* Navigation Buttons */}
        {/* Desktop navigation buttons (ẩn trên mobile) */}
        {index > 0 && (
          <button
            onClick={handlePrev}
            className="hidden md:flex absolute left-4 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}
        {index < items.length - 1 && (
          <button
            onClick={handleNext}
            className="hidden md:flex absolute right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-black/50 text-white text-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="max-w-[70vw]">
            <div className="font-medium truncate" title={item.name}>{item.name}</div>
            <div className="text-gray-400">
              {item.width && item.height && `${item.width} × ${item.height}`}
              {isVideo && item.duration && ` • ${formatDuration(item.duration)}`}
              {item.size && ` • ${formatFileSize(item.size)}`}
            </div>
          </div>
          <div className="text-gray-400">
            {new Date(item.date_taken).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Download progress mini-overlay (non-blocking) */}
      {isDownloading && (
        <div className="fixed bottom-20 right-4 z-[60] min-w-[220px] rounded-lg bg-black/70 text-white shadow-lg border border-white/10 p-3 backdrop-blur-sm">
          <div className="text-xs mb-1 opacity-80">Đang tải về…</div>
          <div className="text-sm font-medium truncate mb-2" title={item.name}>{getFilenameFromPath(item.path, item.name)}</div>
          <div className="w-full h-2 bg-white/10 rounded overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, dlProgress.percent || 0))}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-gray-300 flex justify-between">
            <span>{dlProgress.percent ? `${dlProgress.percent}%` : '—'}</span>
            <span>
              {dlProgress.total > 0
                ? `${formatFileSize(dlProgress.received)} / ${formatFileSize(dlProgress.total)}`
                : `${formatFileSize(dlProgress.received)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default MediaLightbox;
