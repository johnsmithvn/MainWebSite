// 📁 frontend/constants/ui.js
// 🎨 Frontend UI Constants (ES Modules)

export const UI = {
  // Z-index values
  Z_INDEX: {
    TOAST: 9999,              // Toast notifications
    MODAL: 99999,             // Modal dialogs
    OVERLAY: 110000,          // Full screen overlays
    LOADING: 120000,          // Loading spinners
    TOOLTIP: 130000,          // Tooltips
  },
  
  // Colors
  COLORS: {
    PRIMARY: '#007bff',           // Primary blue
    SECONDARY: '#6c757d',         // Secondary gray
    SUCCESS: '#28a745',           // Success green
    DANGER: '#dc3545',            // Danger red
    WARNING: '#ffc107',           // Warning yellow
    INFO: '#17a2b8',              // Info cyan
    LIGHT: '#f8f9fa',             // Light gray
    DARK: '#343a40',              // Dark gray
    
    // Toast colors
    TOAST_BACKGROUND: '#333',     // Background color cho toast
    TOAST_TEXT: '#fff',           // Text color cho toast
    TOAST_SUCCESS: '#28a745',     // Success toast
    TOAST_ERROR: '#dc3545',       // Error toast
    TOAST_WARNING: '#ffc107',     // Warning toast
    TOAST_INFO: '#17a2b8',        // Info toast
    
    // Theme colors
    BACKGROUND_LIGHT: '#ffffff',   // Light theme background
    BACKGROUND_DARK: '#1a1a1a',    // Dark theme background
    TEXT_LIGHT: '#333333',         // Light theme text
    TEXT_DARK: '#ffffff',          // Dark theme text
  },
  
  // Typography
  TYPOGRAPHY: {
    FONT_FAMILY: {
      PRIMARY: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      MONOSPACE: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    },
    
    FONT_SIZE: {
      XS: '0.75rem',    // 12px
      SM: '0.875rem',   // 14px
      BASE: '1rem',     // 16px
      LG: '1.125rem',   // 18px
      XL: '1.25rem',    // 20px
      XXL: '1.5rem',    // 24px
      XXXL: '2rem',     // 32px
    },
    
    FONT_WEIGHT: {
      LIGHT: 300,       // Light font weight
      NORMAL: 400,      // Normal font weight
      MEDIUM: 500,      // Medium font weight
      SEMIBOLD: 600,    // Semibold font weight
      BOLD: 700,        // Bold font weight
    },
    
    LINE_HEIGHT: {
      TIGHT: 1.2,       // Tight line height
      NORMAL: 1.5,      // Normal line height
      RELAXED: 1.8,     // Relaxed line height
    },
  },
  
  // Spacing
  SPACING: {
    XS: '0.25rem',    // 4px
    SM: '0.5rem',     // 8px
    BASE: '1rem',     // 16px
    LG: '1.5rem',     // 24px
    XL: '2rem',       // 32px
    XXL: '3rem',      // 48px
    XXXL: '4rem',     // 64px
  },
  
  // Border radius
  BORDER_RADIUS: {
    SM: '0.25rem',    // 4px
    BASE: '0.5rem',   // 8px
    LG: '0.75rem',    // 12px
    XL: '1rem',       // 16px
    ROUND: '50%',     // Circle
    PILL: '9999px',   // Pill shape
  },
  
  // Shadows
  SHADOW: {
    SM: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    BASE: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    LG: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
    XL: '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
  },
  
  // Transitions
  TRANSITION: {
    FAST: 'all 0.15s ease',
    NORMAL: 'all 0.3s ease',
    SLOW: 'all 0.5s ease',
  },
  
  // Animation duration
  ANIMATION_DURATION: {
    FAST: 150,        // Fast animations
    NORMAL: 300,      // Normal animations
    SLOW: 500,        // Slow animations
  },
  
  // Breakpoints
  BREAKPOINTS: {
    MOBILE: 480,      // Mobile devices
    TABLET: 768,      // Tablet devices
    DESKTOP: 1024,    // Desktop devices
    WIDE: 1440,       // Wide screens
  },
  
  // Layout
  LAYOUT: {
    CONTAINER_MAX_WIDTH: '1200px',
    SIDEBAR_WIDTH: '250px',
    HEADER_HEIGHT: '60px',
    FOOTER_HEIGHT: '40px',
  },
  
  // Card sizes and spacing
  SIZES: {
    CARD_DEFAULT_WIDTH: 200,      // Default card width in px
  },
  
  // Card sizes
  CARD: {
    DEFAULT_WIDTH: 200,     // Default card width (px)
    MIN_WIDTH: 160,         // Minimum card width (px)
    MAX_WIDTH: 300,         // Maximum card width (px)
    MARGIN: 16,             // Card margin (px)
    PADDING: 12,            // Card padding (px)
  },

  // Icons
  ICONS: {
    SIZE_SM: '16px',
    SIZE_BASE: '20px',
    SIZE_LG: '24px',
    SIZE_XL: '32px',
  },
};

export default UI;
