// 📁 src/components/common/Layout.jsx
// 🏗️ Main layout component

import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingOverlay from './LoadingOverlay';
import { useUIStore } from '../../store';
import PlaylistModal from '@/components/music/PlaylistModal';

const Layout = () => {
  const { sidebarOpen, loading, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isMoviePlayer = location.pathname.startsWith('/movie/player');
  const isHomePage = location.pathname === '/';
  const isSelectPage = location.pathname === '/manga/select';

  useEffect(() => {
    const offlineAllowedPrefixes = ['/offline', '/manga/reader'];

    const redirectToOffline = () => {
      if (typeof window === 'undefined' || navigator.onLine) {
        return;
      }

      const currentPath = window.location.pathname;
      const isAllowed = offlineAllowedPrefixes.some((prefix) => currentPath.startsWith(prefix));

      if (!isAllowed) {
        navigate('/offline', { replace: true });
      }
    };

    // Run immediately if the app loads offline
    redirectToOffline();

    window.addEventListener('offline', redirectToOffline);

    return () => {
      window.removeEventListener('offline', redirectToOffline);
    };
  }, [navigate]); // location.pathname intentionally omitted to avoid effect re-run issues on redirect
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
      <Header />
      
      <div className="flex">
        <AnimatePresence>
          {sidebarOpen && !isMoviePlayer && !isHomePage && !isSelectPage && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-20"
                onClick={() => setSidebarOpen(false)}
              />
              
              {/* Sidebar */}
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-72 shadow-lg pointer-events-auto"
                style={{ pointerEvents: 'auto' }}
              >
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 transition-all duration-200">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && <LoadingOverlay loading={loading} />}
      </AnimatePresence>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

  {/* Global Playlist Modal */}
  <PlaylistModal />
    </div>
  );
};

export default Layout;
