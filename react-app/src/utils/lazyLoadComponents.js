// 📁 src/utils/lazyLoadComponents.js
// ⚡ Lazy Loading Configuration for Download Queue

import { lazy } from 'react';

/**
 * Lazy load download-related components for better performance
 * These components are only loaded when needed
 */

// Download Manager Page (loaded when user navigates to /downloads)
export const DownloadManager = lazy(() =>
  import('../pages/downloads/DownloadManager').catch(err => {
    console.error('Failed to load DownloadManager:', err);
    return { default: () => <div>Failed to load Download Manager</div> };
  })
);

// Download Settings Modal (loaded when user opens settings)
export const DownloadSettings = lazy(() =>
  import('../pages/downloads/DownloadSettings').catch(err => {
    console.error('Failed to load DownloadSettings:', err);
    return { default: () => <div>Failed to load Settings</div> };
  })
);

// Download Task Card (loaded with Download Manager)
export const DownloadTaskCard = lazy(() =>
  import('../pages/downloads/DownloadTaskCard').catch(err => {
    console.error('Failed to load DownloadTaskCard:', err);
    return { default: () => <div>Failed to load Task Card</div> };
  })
);

/**
 * Preload components for better UX
 * Call these functions when user is likely to navigate to download features
 */
export const preloadDownloadManager = () => {
  return import('../pages/downloads/DownloadManager');
};

export const preloadDownloadSettings = () => {
  return import('../pages/downloads/DownloadSettings');
};

/**
 * Preload all download components at once
 * Call this when user first interacts with download features
 */
export const preloadAllDownloadComponents = () => {
  return Promise.all([
    preloadDownloadManager(),
    preloadDownloadSettings()
  ]);
};
