// 📁 src/components/common/Layout.jsx
// 🏗️ Main layout component

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingOverlay from './LoadingOverlay';
import { useUIStore } from '../../store';

const Layout = () => {
  const { sidebarOpen, loading, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const isMoviePlayer = location.pathname.startsWith('/movie/player');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
      <Header />
      
      <div className="flex">
        <AnimatePresence>
          {sidebarOpen && !isMoviePlayer && (
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
        {loading && <LoadingOverlay />}
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
    </div>
  );
};

export default Layout;
