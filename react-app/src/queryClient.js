// 📁 src/queryClient.js
// QueryClient dùng chung: main.jsx gắn vào <QueryClientProvider>, còn code ngoài component
// (utils/cacheInvalidation.js) dùng để vô hiệu hoá cache sau khi scan/xoá (PERFORMANCE-CACHE-REPORT PF7)

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
