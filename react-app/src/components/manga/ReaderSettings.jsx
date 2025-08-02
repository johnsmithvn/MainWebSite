import React, { useState } from 'react';
import { X, Settings, Image, Layers, Zap } from 'lucide-react';
import { useMangaStore } from '../../store';
import './ReaderSettings.css';

const ReaderSettings = ({ isOpen, onClose }) => {
  const { readerSettings, updateReaderSettings } = useMangaStore();
  const [tempSettings, setTempSettings] = useState(readerSettings);

  const handleSave = () => {
    updateReaderSettings(tempSettings);
    onClose();
  };

  const handleReset = () => {
    setTempSettings({
      readingMode: 'vertical',
      darkMode: false,
      zoomLevel: 100,
      autoNext: false,
      preloadCount: 10,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="reader-settings-overlay">
      <div className="reader-settings-modal">
        <div className="settings-header">
          <div className="settings-title">
            <Settings size={20} />
            <span>Reader Settings</span>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {/* Reading Mode */}
          <div className="setting-group">
            <div className="setting-label">
              <Layers size={16} />
              <span>Reading Mode</span>
            </div>
            <div className="setting-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="readingMode"
                  value="vertical"
                  checked={tempSettings.readingMode === 'vertical'}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    readingMode: e.target.value
                  })}
                />
                <span>Vertical Scroll</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="readingMode"
                  value="horizontal"
                  checked={tempSettings.readingMode === 'horizontal'}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    readingMode: e.target.value
                  })}
                />
                <span>Horizontal Page</span>
              </label>
            </div>
          </div>

          {/* Preload Count */}
          <div className="setting-group">
            <div className="setting-label">
              <Image size={16} />
              <span>Preload Images</span>
              <span className="setting-description">Number of images to preload before/after current page</span>
            </div>
            <div className="setting-control">
              <input
                type="range"
                min="1"
                max="20"
                value={tempSettings.preloadCount}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  preloadCount: parseInt(e.target.value)
                })}
                className="range-slider"
              />
              <span className="range-value">{tempSettings.preloadCount}</span>
            </div>
          </div>

          {/* Zoom Level */}
          <div className="setting-group">
            <div className="setting-label">
              <Zap size={16} />
              <span>Zoom Level</span>
            </div>
            <div className="setting-control">
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={tempSettings.zoomLevel}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  zoomLevel: parseInt(e.target.value)
                })}
                className="range-slider"
              />
              <span className="range-value">{tempSettings.zoomLevel}%</span>
            </div>
          </div>

          {/* Auto Next */}
          <div className="setting-group">
            <div className="setting-label">
              <span>Auto Next Page</span>
              <span className="setting-description">Automatically go to next page when reaching bottom</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={tempSettings.autoNext}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  autoNext: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Dark Mode */}
          <div className="setting-group">
            <div className="setting-label">
              <span>Dark Mode</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={tempSettings.darkMode}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  darkMode: e.target.checked
                })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-footer">
          <button onClick={handleReset} className="reset-btn">
            Reset to Default
          </button>
          <div className="action-buttons">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleSave} className="save-btn">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReaderSettings;
