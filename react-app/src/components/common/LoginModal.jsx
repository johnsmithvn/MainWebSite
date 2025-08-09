// 📁 src/components/common/LoginModal.jsx
// 🔐 Login modal component for secure sources

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store';
import Button from './Button';

const LoginModal = ({ isOpen, onClose, sourceKey, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setToken } = useAuthStore();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call login API
      const response = await fetch('/api/system/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: sourceKey, 
          password: password.trim() 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save token
        setToken(data.token);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(sourceKey);
        }
        
        // Close modal
        onClose();
      } else {
        setError(data.message || 'Mật khẩu không đúng');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setPassword('');
    setError('');
    onClose();
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                🔐 Đăng nhập
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nguồn <span className="font-medium">{sourceKey}</span> yêu cầu mật khẩu
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Password Input */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-500 dark:placeholder-gray-400"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
                >
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ❌ {error}
                  </p>
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={loading || !password.trim()}
                  loading={loading}
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Hủy
                </Button>
              </div>
            </form>

            {/* Helper Text */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                💡 Nhấn <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> để đăng nhập
                hoặc <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> để hủy
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
