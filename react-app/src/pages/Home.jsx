// 📁 src/pages/Home.jsx
// 🏠 Home page component

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFolder, FiLock } from 'react-icons/fi';
import { useAuthStore, useUIStore } from '../store';
import { apiService } from '../utils/api';
import Button from '../components/common/Button';
import LoginModal from '../components/auth/LoginModal';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const [sourceKeys, setSourceKeys] = useState({
    manga: [],
    movie: [],
    music: []
  });
  const [showSecure, setShowSecure] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');
  
  const { setSourceKey, setSecureKeys, isSecureKey, isAuthenticated, token } = useAuthStore();
  const { setLoading } = useUIStore();

  // Load source keys on mount
  useEffect(() => {
    const loadSourceKeys = async () => {
      try {
        setLoading(true);
        
        // Add small delay to ensure backend is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Load source keys with retry
        const sourceResponse = await fetch('/api/source-keys.js');
        if (!sourceResponse.ok) {
          throw new Error(`HTTP error! status: ${sourceResponse.status}`);
        }
        const sourceScript = await sourceResponse.text();
        
        // Parse the JavaScript response
        const mangaMatch = sourceScript.match(/window\.mangaKeys = (\[.*?\]);/);
        const movieMatch = sourceScript.match(/window\.movieKeys = (\[.*?\]);/);
        const musicMatch = sourceScript.match(/window\.musicKeys = (\[.*?\]);/);
        
        setSourceKeys({
          manga: mangaMatch ? JSON.parse(mangaMatch[1]) : [],
          movie: movieMatch ? JSON.parse(movieMatch[1]) : [],
          music: musicMatch ? JSON.parse(musicMatch[1]) : []
        });

        // Load security keys
        const securityResponse = await fetch('/api/security-keys.js');
        if (!securityResponse.ok) {
          throw new Error(`HTTP error! status: ${securityResponse.status}`);
        }
        const securityScript = await securityResponse.text();
        const secureMatch = securityScript.match(/window\.secureKeys = (\[.*?\]);/);
        
        const keys = secureMatch ? JSON.parse(secureMatch[1]) : [];
        setSecureKeys(keys);
        
      } catch (error) {
        console.error('Error loading source keys:', error);
        toast.error('Lỗi tải danh sách source');
      } finally {
        setLoading(false);
      }
    };

    loadSourceKeys();
  }, [setLoading, setSecureKeys]);

  const handleSourceSelect = async (key, type) => {
    const isSecure = isSecureKey(key);
    
    if (isSecure && !isAuthenticated) {
      setSelectedKey(key);
      setLoginModalOpen(true);
      return;
    }

    setSourceKey(key);
    setLoading(true);

    try {
      if (type === 'manga') {
        navigate('/manga/select');
      } else if (type === 'movie') {
        // Check if movie folder is empty, if empty then scan first
        const response = await apiService.movie.checkEmpty({ key });
        if (response.data.empty) {
          // Empty DB - need to scan first
          await apiService.movie.scan({ key });
        }
        // Always go to movie home after handling empty DB
        navigate('/movie');
      } else if (type === 'music') {
        navigate('/music');
      }
    } catch (error) {
      console.error(`Error checking ${type}:`, error);
      navigate(`/${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (key) => {
    setLoginModalOpen(false);
    const type = getKeyType(key);
    handleSourceSelect(key, type);
  };

  const getKeyType = (key) => {
    if (sourceKeys.manga.includes(key)) return 'manga';
    if (sourceKeys.movie.includes(key)) return 'movie';
    if (sourceKeys.music.includes(key)) return 'music';
    return 'manga';
  };

  const SourceSection = ({ title, keys, type, icon }) => {
    const filteredKeys = showSecure ? keys : keys.filter(key => !isSecureKey(key));
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-3xl">{icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>

        {filteredKeys.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKeys.map((key) => {
              const isSecure = isSecureKey(key);
              
              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start p-4 h-auto"
                    onClick={() => handleSourceSelect(key, type)}
                  >
                    <div className="flex items-center space-x-3">
                      <FiFolder className="h-5 w-5 text-primary-600" />
                      <span className="font-medium">{key}</span>
                      {isSecure && (
                        <FiLock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">📂</div>
            <p>Không có source nào khả dụng</p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
          Chào mừng đến với MainWebSite
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Trình quản lý media local cho manga, phim và nhạc. Chọn source để bắt đầu.
        </p>

        {/* Toggle secure sources */}
        <div className="flex items-center justify-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSecure}
              onChange={(e) => setShowSecure(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị source bảo mật
            </span>
          </label>
        </div>
      </motion.div>

      {/* Source sections */}
      <div className="space-y-8">
        <SourceSection
          title="Manga"
          keys={sourceKeys.manga}
          type="manga"
          icon="📚"
        />
        
        <SourceSection
          title="Movie"
          keys={sourceKeys.movie}
          type="movie"
          icon="🎬"
        />
        
        <SourceSection
          title="Music"
          keys={sourceKeys.music}
          type="music"
          icon="🎵"
        />
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        sourceKey={selectedKey}
        onSuccess={() => handleLoginSuccess(selectedKey)}
      />
    </div>
  );
};

export default Home;
