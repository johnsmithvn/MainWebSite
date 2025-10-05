// 📁 src/pages/settings/index.jsx  
// ⚙️ Main settings page with tab navigation

import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Palette, Database, Volume2,
  User, Shield, Globe, Download, Upload, RotateCcw, Trash2
} from 'lucide-react';
import { useUIStore } from '@/store';
import { useModal } from '@/components/common/Modal';
import Button from '@/components/common/Button';

// Import setting pages
import AppearanceSettings from './AppearanceSettings';
import GeneralSettings from './GeneralSettings';
import CacheSettings from './CacheSettings';
import MediaSettings from './MediaSettings';
import AccountSettings from './AccountSettings';
import PrivacySettings from './PrivacySettings';
import AboutSettings from './AboutSettings';

/**
 * Settings Page Component
 * Main settings page with tab navigation and quick actions
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const { darkMode, animationsEnabled, toggleDarkMode, toggleAnimations, language, setLanguage } = useUIStore();
  const { confirmModal, successModal, errorModal, Modal } = useModal();

  // Settings tabs configuration
  const settingsTabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'cache', label: 'Cache & Storage', icon: Database },
    { id: 'media', label: 'Media', icon: Volume2 },
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'about', label: 'About', icon: Globe }
  ];

  // Export settings
  const handleExportSettings = () => {
    const settings = {
      appearance: { darkMode, animationsEnabled },
      language: language || 'en',
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mainwebsite-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import settings
  const handleImportSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);
        // Apply imported settings
        if (settings.appearance) {
          if (settings.appearance.darkMode !== darkMode) {
            toggleDarkMode();
          }
          if (settings.appearance.animationsEnabled !== animationsEnabled) {
            toggleAnimations();
          }
        }
        if (settings.language) {
          setLanguage(settings.language);
        }
        successModal({
          title: '✅ Settings Imported',
          message: 'Your settings have been imported successfully!'
        });
      } catch (error) {
        errorModal({
          title: '❌ Import Failed',
          message: 'Failed to import settings. Please check the file format.'
        });
      }
    };
    reader.readAsText(file);
  };

  // Reset app
  const handleResetApp = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
      return;
    }

    confirmModal({
      title: '⚠️ Reset Application',
      message: (
        <div>
          <p className="mb-2">This will reset all settings to default values.</p>
          <p className="text-red-600 dark:text-red-400 font-semibold">This action cannot be undone!</p>
        </div>
      ),
      confirmText: 'Reset App',
      onConfirm: () => {
        // Reset to default settings
        if (darkMode) toggleDarkMode();
        if (!animationsEnabled) toggleAnimations();
        setLanguage('en');
        setShowResetConfirm(false);
        
        successModal({
          title: '✅ Reset Complete',
          message: 'Application has been reset to default settings.'
        });
      }
    });
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceSettings />;
      case 'general':
        return <GeneralSettings />;
      case 'cache':
        return <CacheSettings />;
      case 'media':
        return <MediaSettings />;
      case 'account':
        return <AccountSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your MainWebSite experience
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar - Mobile: Horizontal scroll, Desktop: Vertical list */}
          <div className="w-full lg:w-64 flex-shrink-0">
            {/* Mobile: Horizontal Scrollable Icons */}
            <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <nav className="flex p-2 gap-1">
                {settingsTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-md transition-colors min-w-[64px] ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={tab.label}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="text-[10px] mt-1 font-medium truncate max-w-[60px]">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Desktop: Vertical List */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <nav className="p-4 space-y-2">
                {settingsTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions - Desktop only */}
            <div className="hidden lg:block mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleExportSettings}
                  icon={Download}
                >
                  Export Settings
                </Button>
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    icon={Upload}
                    as="span"
                  >
                    Import Settings
                  </Button>
                </label>
                <Button
                  variant={showResetConfirm ? 'danger' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleResetApp}
                  icon={showResetConfirm ? Trash2 : RotateCcw}
                >
                  {showResetConfirm ? 'Confirm Reset' : 'Reset App'}
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {/* Modal Component */}
      <Modal />
    </div>
  );
};

export default Settings;
