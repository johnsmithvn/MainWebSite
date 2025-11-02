// 📁 src/components/music/LyricsModal.jsx
// 🎤 Lyrics Display and Edit Modal

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit3, FiCheck, FiChevronLeft } from 'react-icons/fi';
import { useMusicStore, useAuthStore } from '@/store';
import { buildThumbnailUrl } from '@/utils/thumbnailUtils';
import { DEFAULT_IMAGES } from '@/constants';
import toast from 'react-hot-toast';

const LyricsModal = ({ isOpen, onClose, currentTrack }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentTrack) {
      // Load lyrics from track or fetch from API
      setLyrics(currentTrack.lyrics || '');
      setIsEditMode(false);
    }
  }, [isOpen, currentTrack]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSave = async () => {
    console.log('🔵 handleSave called');
    console.log('Current Track:', currentTrack);
    console.log('Lyrics:', lyrics);

    if (!currentTrack) {
      console.error('❌ No current track');
      toast.error('Không tìm thấy bài hát hiện tại');
      return;
    }

    // Get sourceKey from auth store
    const { sourceKey } = useAuthStore.getState();
    console.log('Source Key:', sourceKey);

    if (!sourceKey) {
      console.error('❌ No sourceKey');
      toast.error('Không tìm thấy database key');
      return;
    }

    setIsSaving(true);
    console.log('💾 Starting save process...');

    try {
      const payload = {
        key: sourceKey,
        path: currentTrack.path,
        lyrics: lyrics.trim(),
      };
      
      console.log('📤 Sending request with payload:', payload);

      const response = await fetch('/api/music/update-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to update lyrics: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Success response:', result);
      
      // Update current track in store
      useMusicStore.setState((state) => ({
        currentTrack: {
          ...state.currentTrack,
          lyrics: lyrics.trim(),
        },
      }));

      toast.success('Đã lưu lời bài hát thành công! 🎵', {
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
      setIsEditMode(false);
      console.log('✅ Save completed successfully');
    } catch (error) {
      console.error('❌ Error saving lyrics:', error);
      toast.error(`Lỗi khi lưu lời bài hát: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLyrics(currentTrack?.lyrics || '');
    setIsEditMode(false);
  };

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-black flex flex-col"
          onClick={(e) => {
            // Only close if clicking the backdrop in view mode
            if (!isEditMode && e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Header - Dark with title and action buttons */}
          <div className="flex-none bg-black border-b border-gray-800">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={isEditMode ? handleCancel : onClose}
                className="p-2 -ml-2 text-white/90 hover:text-white active:bg-white/10 rounded-full transition-colors"
                aria-label={isEditMode ? "Cancel" : "Back"}
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
              
              <h1 className="text-white text-base font-normal flex-1 text-center">
                {isEditMode ? 'Sửa lời bài hát' : 'Lời bài hát'}
              </h1>

              {isEditMode ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-2 -mr-2 text-white/90 hover:text-white active:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save"
                >
                  <FiCheck className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 -mr-2 text-white/90 hover:text-white active:bg-white/10 rounded-full transition-colors"
                  aria-label="Edit"
                >
                  <FiEdit3 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {isEditMode ? (
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Nhập lời bài hát..."
                className="w-full h-full min-h-[400px] bg-black text-white/90 px-4 py-4 resize-none focus:outline-none"
                style={{ 
                  lineHeight: '1.7',
                  fontSize: '15px'
                }}
                autoFocus
              />
            ) : (
              <div className="px-4 py-4">
                {lyrics ? (
                  <pre className="text-white/90 whitespace-pre-wrap font-sans leading-relaxed text-center" style={{ fontSize: '15px', lineHeight: '1.7' }}>
                    {lyrics}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-white/40">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-center text-base">
                      Chưa có lời bài hát
                      <br />
                      <span className="text-sm text-white/30">Nhấn biểu tượng ✏️ để thêm</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LyricsModal;
