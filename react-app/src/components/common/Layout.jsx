// 📁 src/components/common/Layout.jsx
// 🏗️ Main layout component

import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingOverlay from './LoadingOverlay';
import DownloadBadge from './DownloadBadge';
import { useUIStore } from '../../store';
import { useMiniPlayerVisible, MINI_PLAYER_HEIGHT } from '@/components/music/MiniPlayer';

const Layout = () => {
  const { sidebarOpen, loading, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isMoviePlayer = location.pathname.startsWith('/movie/player');
  const isHomePage = location.pathname === '/';
  const isSelectPage = location.pathname === '/manga/select';
  const miniPlayerVisible = useMiniPlayerVisible();

  useEffect(() => {
    const offlineAllowedPrefixes = ['/offline', '/manga/reader'];

    // Check if server is accessible
    const checkServerAccessibility = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout - balanced for slow networks
        
        // Use dedicated health check endpoint
        const response = await fetch('/api/health', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        console.log('🔍 Server health check:', response.status, response.ok);
        return response.ok;
      } catch (error) {
        console.log('❌ Server health check failed:', error.message);
        // Network error, server down, or no access
        return false;
      }
    };

    const redirectToOffline = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      const currentPath = window.location.pathname;
      const isAllowed = offlineAllowedPrefixes.some((prefix) => currentPath.startsWith(prefix));

      // Check both network status and server accessibility
      const isOnline = navigator.onLine;
      console.log('🌐 Network status:', isOnline);
      
      let serverAccessible = true;
      if (isOnline) {
        serverAccessible = await checkServerAccessibility();
        console.log('🖥️ Server accessible:', serverAccessible);
      }

      const shouldRedirect = !isOnline || !serverAccessible;
      console.log('🔄 Should redirect to offline:', shouldRedirect, '| Current path:', currentPath, '| Is allowed:', isAllowed);

      if (shouldRedirect && !isAllowed) {
        console.log('➡️ Redirecting to offline...');
        navigate('/offline', { replace: true });
      }
    };

    // Run immediately if the app loads
    redirectToOffline();

    // Listen for network changes
    window.addEventListener('offline', redirectToOffline);
    window.addEventListener('online', redirectToOffline); // Also check when coming back online

    return () => {
      window.removeEventListener('offline', redirectToOffline);
      window.removeEventListener('online', redirectToOffline);
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

        {/* Keep the end of each page clear of the fixed music mini player */}
        <main
          className="flex-1 transition-all duration-200"
          style={miniPlayerVisible ? { paddingBottom: MINI_PLAYER_HEIGHT } : undefined}
        >
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && <LoadingOverlay loading={loading} />}
      </AnimatePresence>

      {/* Toast notifications (<Toaster>) and Playlist Modal are mounted once in App.jsx for all routes */}

      {/* Floating Download Badge */}
      <DownloadBadge />
    </div>
  );
};

export default Layout;
