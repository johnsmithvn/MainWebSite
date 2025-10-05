import { useAuthStore } from '../../store';
import { Button } from '../../components/common';

/**
 * AccountSettings Component
 * 
 * Quản lý tài khoản người dùng
 * - Hiển thị thông tin đăng nhập
 * - Đăng xuất
 */
export default function AccountSettings() {
  const { isAuthenticated, currentUser, logout } = useAuthStore();

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
}
