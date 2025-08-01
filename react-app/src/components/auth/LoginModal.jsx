// 📁 src/components/auth/LoginModal.jsx
// 🔐 Login modal component

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import Modal from 'react-modal';
import { useAuthStore } from '@/store';
import { apiService } from '@/utils/api';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';

const LoginModal = ({ isOpen, onClose, sourceKey, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { setToken } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.system.login({
        key: sourceKey,
        password: password
      });

      const { token } = response.data;
      setToken(token);
      localStorage.setItem('userToken', token);
      
      toast.success('Đăng nhập thành công');
      setPassword('');
      onSuccess?.();
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.data?.error === 'wrong') {
        toast.error('Mật khẩu không đúng');
      } else if (error.response?.data?.error === 'invalid key') {
        toast.error('Source key không hợp lệ');
      } else {
        toast.error('Lỗi đăng nhập');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="max-w-md mx-auto mt-32 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl outline-none"
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full"
      >
        {/* Header */}
        <div className="text-center p-6 border-b border-gray-200 dark:border-dark-700">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Đăng nhập vào source bảo mật
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Source <span className="font-medium text-primary-600 dark:text-primary-400">{sourceKey}</span> yêu cầu mật khẩu
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-4 py-3 bg-gray-100 dark:bg-dark-700 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white pr-12"
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={loading}
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={loading}
              disabled={!password.trim()}
            >
              Đăng nhập
            </Button>
          </div>
        </form>
      </motion.div>
    </Modal>
  );
};

export default LoginModal;
