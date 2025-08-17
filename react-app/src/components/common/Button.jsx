// 📁 src/components/common/Button.jsx
// 🔘 Reusable button component

import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-white focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:hover:bg-dark-700 dark:text-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
    outline: 'border border-gray-300 dark:border-dark-600 bg-transparent hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const classes = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production')
      || (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
    if (isDev) {
      console.log('🔘 Button clicked:', { disabled, loading, e });
    }
    if (disabled || loading) {
      if (isDev) console.log('❌ Button click blocked - disabled or loading');
      return;
    }
    onClick?.(e);
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {Icon && (
        <Icon className="h-4 w-4 mr-2" />
      )}
      {children}
    </motion.button>
  );
};

export default Button;
