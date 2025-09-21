import { apiService } from '@/utils/api';

export const sendLog = async (message, extra = null) => {
  try {
    await apiService.log.send({ message, extra });
  } catch (err) {
    console.warn('❌ Failed to send log:', err);
  }
};

