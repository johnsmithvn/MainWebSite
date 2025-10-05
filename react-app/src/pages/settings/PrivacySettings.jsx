import { Button } from '../../components/common';

/**
 * PrivacySettings Component
 * 
 * Cài đặt quyền riêng tư
 * - Analytics
 * - Error reporting
 */
export default function PrivacySettings() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Privacy Settings
      </h3>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {/* Analytics */}
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
          
          {/* Error Reporting */}
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
}
