/**
 * Global type declarations for Weekly Task Board
 * These types extend the Window interface for global properties
 */

/**
 * Global window interface extensions
 */
declare global {
  interface Window {
    WeeklyTaskBoard?: {
      state: import('./app').AppState;
    };
    APP_VERSION?: string;
    BUILD_DATE?: string;
    CALENDAR_CONFIG?: any;
  }
}

/**
 * Global type for the module
 */
export {};
