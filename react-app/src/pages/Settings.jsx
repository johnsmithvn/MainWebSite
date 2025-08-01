// 📁 src/pages/Settings.jsx
// ⚙️ Trang cài đặt ứng dụng

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Moon, Sun, Monitor, Globe, 
  Palette, Volume2, Eye, Database, Download, Upload,
  Shield, User, Bell, Trash2, RotateCcw, Save
} from 'lucide-react';
import { useUIStore, useAuthStore, useMangaStore, useMovieStore, useMusicStore } from '@/store';
import Button from '@/components/common/Button';

const Settings = () => {
  const { 
    darkMode, 
    toggleDarkMode, 
    language, 
    setLanguage,
    animationsEnabled,
    toggleAnimations
  } = useUIStore();
  
  const { isAuthenticated, currentUser, logout } = useAuthStore();
  const { clearMangaCache } = useMangaStore();
  const { clearMovieCache } = useMovieStore();
  const { clearMusicCache } = useMusicStore();

  const [activeTab, setActiveTab] = useState('appearance');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const settingsTabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'media', label: 'Media', icon: Database },
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'about', label: 'About', icon: Globe }
  ];

  const handleExportSettings = () => {
    const settings = {
      appearance: { darkMode, animationsEnabled },
      language,
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
        alert('Settings imported successfully!');
      } catch (error) {
        alert('Failed to import settings. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetApp = () => {
    if (showResetConfirm) {
      // Clear all data
      clearMangaCache();
      clearMovieCache();
      clearMusicCache();
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset to defaults
      window.location.reload();
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Appearance Settings
            </h3>
            
            {/* Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Theme</h4>
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
                
                <button className="p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 opacity-50 cursor-not-allowed">
                  <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p className="font-medium text-gray-900 dark:text-white">Auto</p>
                  <p className="text-xs text-gray-500">Coming Soon</p>
                </button>
              </div>
            </div>

            {/* Animations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Animations</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable smooth transitions and animations
                  </p>
                </div>
                <Button
                  variant={animationsEnabled ? 'primary' : 'outline'}
                  onClick={toggleAnimations}
                >
                  {animationsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              General Settings
            </h3>
            
            {/* Language */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Language</h4>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            {/* Auto-refresh */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Auto-refresh</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically refresh content every 30 minutes
                  </p>
                </div>
                <Button variant="outline">
                  Disabled
                </Button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Show browser notifications for updates
                  </p>
                </div>
                <Button variant="outline" icon={Bell}>
                  Configure
                </Button>
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Media Settings
            </h3>
            
            {/* Cache Management */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Cache Management</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Manga Cache</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clear manga thumbnails and data</p>
                  </div>
                  <Button variant="outline" onClick={clearMangaCache}>
                    Clear
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Movie Cache</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clear movie thumbnails and data</p>
                  </div>
                  <Button variant="outline" onClick={clearMovieCache}>
                    Clear
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Music Cache</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clear music thumbnails and data</p>
                  </div>
                  <Button variant="outline" onClick={clearMusicCache}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Quality Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quality Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Video Quality
                  </label>
                  <select className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Audio Quality
                  </label>
                  <select className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="high">High (320kbps)</option>
                    <option value="medium">Medium (192kbps)</option>
                    <option value="low">Low (128kbps)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account Settings
            </h3>
            
            {isAuthenticated ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Logged in as: {currentUser?.username}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Access level: {currentUser?.role || 'User'}
                    </p>
                  </div>
                  <Button variant="outline" onClick={logout}>
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Not signed in
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Sign in to access secure sources and sync your preferences
                </p>
                <Button variant="primary">
                  Sign In
                </Button>
              </div>
            )}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Privacy Settings
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Analytics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help improve the app by sharing usage data
                    </p>
                  </div>
                  <Button variant="outline">
                    Disabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Error Reporting</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically report errors to help fix issues
                    </p>
                  </div>
                  <Button variant="outline">
                    Disabled
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              About MainWebSite
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">MainWebSite React</h4>
                <p className="text-gray-600 dark:text-gray-400">Version 1.0.0</p>
              </div>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  A modern React-based media management application for organizing and viewing
                  manga, movies, and music collections.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Built with:</h5>
                    <ul className="space-y-1">
                      <li>• React 18</li>
                      <li>• Vite</li>
                      <li>• Tailwind CSS</li>
                      <li>• Zustand</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Features:</h5>
                    <ul className="space-y-1">
                      <li>• Manga Reader</li>
                      <li>• Movie Player</li>
                      <li>• Music Player</li>
                      <li>• Dark Mode</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

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

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                      <IconComponent className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
    </div>
  );
};

export default Settings;
