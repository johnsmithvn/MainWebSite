// 📁 src/pages/settings/components/SettingSection.jsx
// 📦 Reusable section wrapper for settings pages

import React from 'react';

/**
 * SettingSection Component
 * Provides consistent styling for settings sections
 * 
 * @param {string} title - Section title
 * @param {string} description - Optional section description
 * @param {React.ReactNode} children - Section content
 * @param {string} className - Additional CSS classes
 */
const SettingSection = ({ title, description, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default SettingSection;
