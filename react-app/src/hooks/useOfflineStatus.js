// 📁 src/hooks/useOfflineStatus.js
// 🌐 Track online/offline status

import { useEffect, useState } from 'react';

const getOfflineStatus = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return !navigator.onLine;
};

const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(getOfflineStatus);

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOffline(getOfflineStatus());
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return isOffline;
};

export default useOfflineStatus;
