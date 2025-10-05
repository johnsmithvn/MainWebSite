// 📁 src/pages/settings/components/SettingItem.jsx
// 📦 Reusable setting item row component

import React from 'react';

/**
 * SettingItem Component
 * Provides consistent row layout for individual settings
 * 
 * @param {string} label - Setting label
 * @param {string} description - Optional setting description
 * @param {React.ReactNode} control - Control element (toggle, select, input, etc.)
 * @param {string} className - Additional CSS classes
 */
const SettingItem = ({ label, description, control, className = '' }) => {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {control}
      </div>
    </div>
  );
};

export default SettingItem;
