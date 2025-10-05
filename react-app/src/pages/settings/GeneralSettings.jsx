// 📁 src/pages/settings/GeneralSettings.jsx
// ⚙️ General settings: language, notifications, auto-refresh

import React from 'react';
import { Bell, Globe } from 'lucide-react';
import { useUIStore } from '@/store';
import Button from '@/components/common/Button';
import SettingSection from './components/SettingSection';
import SettingItem from './components/SettingItem';

/**
 * GeneralSettings Component
 * Manages general app preferences: language, notifications, auto-refresh
 */
const GeneralSettings = () => {
  const { language, setLanguage } = useUIStore();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        General Settings
      </h3>
      
      {/* Language Section */}
      <SettingSection 
        title="Language" 
        description="Choose your preferred language"
      >
        <SettingItem
          label="Display Language"
          description="Change the language used throughout the app"
          control={
            <select
              value={language || 'en'}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
              <option value="ja">日本語</option>
            </select>
          }
        />
      </SettingSection>

      {/* Auto-refresh Section */}
      <SettingSection 
        title="Auto-refresh" 
        description="Control automatic content updates"
      >
        <SettingItem
          label="Auto-refresh Content"
          description="Automatically refresh content every 30 minutes"
          control={
            <Button variant="outline" disabled className="opacity-50">
              Coming Soon
            </Button>
          }
        />
      </SettingSection>

      {/* Notifications Section */}
      <SettingSection 
        title="Notifications" 
        description="Manage notification preferences"
      >
        <SettingItem
          label="Browser Notifications"
          description="Show browser notifications for updates and new content"
          control={
            <Button variant="outline" icon={Bell} disabled className="opacity-50">
              Coming Soon
            </Button>
          }
        />
      </SettingSection>
    </div>
  );
};

export default GeneralSettings;
