// 📁 src/pages/settings/AppearanceSettings.jsx
// 🎨 Appearance settings: theme, animations, visual preferences

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '@/store';
import Button from '@/components/common/Button';
import SettingSection from './components/SettingSection';
import SettingItem from './components/SettingItem';

/**
 * AppearanceSettings Component
 * Manages visual preferences: theme (light/dark), animations, etc.
 */
const AppearanceSettings = () => {
  const { darkMode, toggleDarkMode, animationsEnabled, toggleAnimations } = useUIStore();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Appearance Settings
      </h3>
      
      {/* Theme Section */}
      <SettingSection 
        title="Theme" 
        description="Choose your preferred color scheme"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => !darkMode && toggleDarkMode()}
            className={`p-4 rounded-lg border-2 transition-all ${
              !darkMode 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="font-medium text-gray-900 dark:text-white">Light</p>
          </button>
          
          <button
            onClick={() => darkMode && toggleDarkMode()}
            className={`p-4 rounded-lg border-2 transition-all ${
              darkMode 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Moon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="font-medium text-gray-900 dark:text-white">Dark</p>
          </button>
          
          <button 
            className="p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 opacity-50 cursor-not-allowed"
            disabled
          >
            <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p className="font-medium text-gray-900 dark:text-white">Auto</p>
            <p className="text-xs text-gray-500">Coming Soon</p>
          </button>
        </div>
      </SettingSection>

      {/* Animations Section */}
      <SettingSection 
        title="Animations" 
        description="Control visual effects and transitions"
      >
        <SettingItem
          label="Enable Animations"
          description="Smooth transitions and visual effects throughout the app"
          control={
            <Button
              variant={animationsEnabled ? 'primary' : 'outline'}
              onClick={toggleAnimations}
            >
              {animationsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          }
        />
      </SettingSection>
    </div>
  );
};

export default AppearanceSettings;
