// 📁 src/pages/manga/MangaReader.jsx
// 📖 Manga reader component với nhiều mode đọc

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut,
  Settings, Home, BookOpen, Monitor, Smartphone, Menu,
  Eye, EyeOff, SkipForward, SkipBack, Maximize, Minimize
} from 'lucide-react';
import { useMangaStore, useUIStore } from '../../store';
import Button from '../../components/common/Button';

const MangaReader = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mangaId = searchParams.get('id');
  const chapterId = searchParams.get('chapter');

  const { currentManga, currentChapter, readerSettings, updateReaderSettings } = useMangaStore();
  const { darkMode } = useUIStore();

  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const readerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Sample chapter data
  const samplePages = [
    '/default/default-cover.jpg',
    '/default/folder-thumb.png',
    '/default/video-thumb.png',
    '/default/music-thumb.png'
  ];

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, [mangaId, chapterId]);

  useEffect(() => {
    // Auto hide controls
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleKeyPress = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        previousPage();
        break;
      case 'ArrowRight':
        nextPage();
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 'Escape':
        if (isFullscreen) toggleFullscreen();
        break;
    }
  };

  const nextPage = () => {
    if (currentPage < samplePages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      readerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const zoomIn = () => setZoom(Math.min(zoom + 25, 300));
  const zoomOut = () => setZoom(Math.max(zoom - 25, 50));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading chapter...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={readerRef}
      className={`relative min-h-screen ${
        readerSettings.backgroundColor === 'black' ? 'bg-black' : 
        readerSettings.backgroundColor === 'white' ? 'bg-white' : 'bg-gray-100'
      }`}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Top Controls */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-75 
                     transition-transform duration-300 ${
                       showControls ? 'translate-y-0' : '-translate-y-full'
                     }`}>
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              icon={ChevronLeft}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              Back
            </Button>
            <div>
              <h1 className="font-semibold">
                {currentManga?.title || 'Sample Manga'}
              </h1>
              <p className="text-sm text-gray-300">
                Chapter {chapterId || '1'} - Page {currentPage + 1} of {samplePages.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              icon={Settings}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              icon={isFullscreen ? Minimize : Maximize}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Reader Settings
          </h3>
          
          <div className="space-y-4">
            {/* Reading Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reading Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['horizontal', 'vertical'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateReaderSettings({ readingMode: mode })}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors ${
                      readerSettings.readingMode === mode
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {mode === 'horizontal' ? '← →' : '↑ ↓'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['black', 'white', 'gray'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateReaderSettings({ backgroundColor: color })}
                    className={`h-10 rounded-md border-2 ${
                      color === 'black' ? 'bg-black' :
                      color === 'white' ? 'bg-white' : 'bg-gray-400'
                    } ${
                      readerSettings.backgroundColor === color
                        ? 'border-blue-500'
                        : 'border-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Zoom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zoom: {zoom}%
              </label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={zoomOut} icon={ZoomOut} />
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="25"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={zoomIn} icon={ZoomIn} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex items-center justify-center min-h-screen pt-16 pb-16">
        <div 
          className="relative"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <img
            src={samplePages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-screen object-contain"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black bg-opacity-75 
                     transition-transform duration-300 ${
                       showControls ? 'translate-y-0' : 'translate-y-full'
                     }`}>
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousPage}
              disabled={currentPage === 0}
              icon={SkipBack}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              Previous
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">
              {currentPage + 1} / {samplePages.length}
            </span>
            <input
              type="range"
              min="0"
              max={samplePages.length - 1}
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="w-32"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === samplePages.length - 1}
              icon={SkipForward}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Areas (Click zones) */}
      <div className="fixed inset-0 z-10 flex">
        {/* Left click area */}
        <div 
          className="w-1/3 h-full cursor-pointer"
          onClick={previousPage}
        />
        {/* Center area (no action) */}
        <div className="w-1/3 h-full" />
        {/* Right click area */}
        <div 
          className="w-1/3 h-full cursor-pointer"
          onClick={nextPage}
        />
      </div>

      {/* Keyboard shortcuts help */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-black bg-opacity-50 text-white text-xs p-2 rounded">
          <p>← → Arrow keys to navigate</p>
          <p>F for fullscreen</p>
          <p>ESC to exit fullscreen</p>
        </div>
      </div>
    </div>
  );
};

export default MangaReader;
