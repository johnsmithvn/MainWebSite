import { Globe } from 'lucide-react';

/**
 * AboutSettings Component
 * 
 * Thông tin về ứng dụng
 * - Version
 * - Credits
 * - Links
 */
export default function AboutSettings() {
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
          <p className="text-gray-600 dark:text-gray-400">Version 2.0.0 (Refactored)</p>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            A modern React-based media management application for organizing and viewing
            manga, movies, and music content.
          </p>
          
          <div className="border-t pt-4 dark:border-gray-700">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Features:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>📚 Manga reader with multiple reading modes</li>
              <li>🎬 Movie player with quality selection</li>
              <li>🎵 Music player with playlist support</li>
              <li>🌙 Dark mode support</li>
              <li>💾 Offline library capabilities</li>
              <li>🔒 Secure source management</li>
            </ul>
          </div>
          
          <div className="border-t pt-4 dark:border-gray-700">
            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Tech Stack:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>React 18.2.0</li>
              <li>Vite (Build tool)</li>
              <li>TailwindCSS (Styling)</li>
              <li>Zustand (State management)</li>
              <li>React Router (Routing)</li>
            </ul>
          </div>
          
          <div className="border-t pt-4 dark:border-gray-700">
            <p className="text-xs text-gray-500">
              © 2024 MainWebSite. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
