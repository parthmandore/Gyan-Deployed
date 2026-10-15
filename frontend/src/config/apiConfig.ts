/**
 * Purpose: API configuration for Gyan standalone offline deployment.
 *          Configured for 100% offline-first operation with no runtime backend dependencies.
 * Module: Config
 * Folder: frontend/src/config
 */

export const API_CONFIG = {
  STT_BASE_URL: '',
  MAIN_API_URL: '',
  TIMEOUT_MS: 5000,
  IS_OFFLINE_DEPLOYMENT: true,
} as const;

