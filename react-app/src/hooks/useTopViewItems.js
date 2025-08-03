// 📁 src/hooks/useTopViewItems.js
// 🎯 Hook để lấy danh sách manga/movie/music có lượt xem cao nhất

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { apiService } from '@/utils/api';

export const useTopViewItems = (type = 'manga', options = {}) => {
  const { sourceKey, rootFolder } = useAuthStore();
  
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes - top view ít thay đổi
    ...restOptions
  } = options;

  return useQuery({
    queryKey: ['topViewItems', type, sourceKey, rootFolder],
    queryFn: async () => {
      if (!sourceKey) {
        throw new Error('No source key available');
      }

      if (!rootFolder) {
        throw new Error('No root folder available');
      }
      
      let response;
      switch (type) {
        case 'manga': {
          response = await apiService.manga.getFolders({
            key: sourceKey,
            mode: 'top',
            root: rootFolder
          });
          break;
        }
        case 'movie': {
          response = await apiService.movie.getVideoCache({
            key: sourceKey,
            mode: 'top',
            root: rootFolder
          });
          break;
        }
        case 'music': {
          response = await apiService.music.getAudioCache({
            key: sourceKey,
            mode: 'top',
            root: rootFolder
          });
          break;
        }
        default:
          throw new Error(`Unsupported type: ${type}`);
      }

      // Handle different response formats
      let data = response.data;
      
      // Backend might return direct array or wrapped in success/data
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.folders)) {
        return data.folders;
      } else if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
      
      return [];
    },
    enabled: enabled && !!sourceKey && !!rootFolder,
    staleTime,
    refetchOnWindowFocus: false,
    ...restOptions
  });
};

// Helper function to get root folder from source key
const getRootFolderFromKey = (sourceKey) => {
  // Map source keys to root folders
  const keyToRoot = {
    'ROOT_DOW': 'dow',
    'ROOT_FANTASY': 'fantasy', 
    'ROOT_MANGAH': 'mangah',
    'V_ANIME': 'anime',
    'V_ANIMEH': 'animeh',
    'V_JAVA': 'java',
    'V_MOVIE': 'movie',
    'M_MUSIC': 'music'
  };
  
  return keyToRoot[sourceKey] || sourceKey.toLowerCase().replace(/^(root_|v_|m_)/, '');
};
