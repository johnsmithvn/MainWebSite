/**
 * Time & Date Constants
 * Centralized time-related constants and formatting utilities
 */

/**
 * ⏰ Time Calculations
 */
export const TIME = {
  // Basic time units in minutes
  MINUTES_PER_HOUR: 60,
  MINUTES_PER_DAY: 1440, // 24 * 60
  MINUTES_PER_WEEK: 10080, // 7 * 24 * 60
  
  // In seconds
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 3600, // 60 * 60
  SECONDS_PER_DAY: 86400, // 24 * 60 * 60
  
  // In milliseconds
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60000, // 60 * 1000
  MS_PER_HOUR: 3600000, // 60 * 60 * 1000
  MS_PER_DAY: 86400000 // 24 * 60 * 60 * 1000
};

/**
 * 📅 Date Format Options
 */
export const DATE_FORMATS = {
  // For display
  short: 'dd/MM/yyyy',
  long: 'dd/MM/yyyy HH:mm',
  time: 'HH:mm',
  
  // For API
  iso: 'yyyy-MM-dd',
  isoWithTime: 'yyyy-MM-dd HH:mm:ss'
};

/**
 * 🌏 Locale Settings
 */
export const LOCALE = {
  default: 'en', // Changed from 'vi' to 'en' for consistent English timestamps
  timezone: 'Asia/Ho_Chi_Minh'
};

/**
 * ⏱️ Relative Time Thresholds
 */
export const RELATIVE_TIME = {
  // Thresholds for different relative time displays
  justNow: 1, // Less than 1 minute
  minutes: 60, // Less than 1 hour
  hours: 24 * 60, // Less than 1 day
  days: 7 * 24 * 60, // Less than 1 week
  
  // Mobile abbreviations
  mobileFormats: {
    justNow: 'just now',
    minute: 'm ago',
    minutes: 'm ago', 
    hour: 'h ago',
    hours: 'h ago',
    day: 'd ago',
    days: 'd ago',
    week: 'w ago',
    weeks: 'w ago'
  }
};
