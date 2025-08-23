// 📁 src/components/common/Breadcrumb.jsx
// 🧭 Breadcrumb navigation component

import React from 'react';
import { motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';

const Breadcrumb = ({ items = [], onNavigate, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    {/* 🧭 Nav chứa breadcrumb với khả năng xuống dòng khi hẹp */}
    <nav
      className={`flex flex-wrap items-center gap-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.path || index}>
          {index > 0 && (
            <FiChevronRight className="w-4 h-4 text-gray-400" />
          )}
          
          {item.isLast || index === items.length - 1 ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          ) : (
            <motion.button
              onClick={() => onNavigate?.(item.path)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                       hover:underline transition-colors duration-150"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.label}
            </motion.button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
