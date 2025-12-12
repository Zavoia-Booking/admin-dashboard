import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from '../../app/config/env';

// Re-export isNativeApp for convenience
export { isNativeApp };

const REFRESH_TOKEN_KEY = 'bookaroo_refresh_token';

/**
 * Token storage for native apps using Capacitor Preferences.
 * For web, tokens are handled via HTTP-only cookies by the backend.
 */
export const tokenStorage = {
  /**
   * Save refresh token to persistent storage (native only)
   */
  async saveRefreshToken(token: string | null): Promise<void> {
    if (!isNativeApp()) return;
    
    try {
      if (token) {
        await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token });
      } else {
        await Preferences.remove({ key: REFRESH_TOKEN_KEY });
      }
    } catch (error) {
      console.error('[TokenStorage] Failed to save refresh token:', error);
    }
  },

  /**
   * Load refresh token from persistent storage (native only)
   */
  async loadRefreshToken(): Promise<string | null> {
    if (!isNativeApp()) return null;
    
    try {
      const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
      return value;
    } catch (error) {
      console.error('[TokenStorage] Failed to load refresh token:', error);
      return null;
    }
  },

  /**
   * Clear refresh token from persistent storage (native only)
   */
  async clearRefreshToken(): Promise<void> {
    if (!isNativeApp()) return;
    
    try {
      await Preferences.remove({ key: REFRESH_TOKEN_KEY });
    } catch (error) {
      console.error('[TokenStorage] Failed to clear refresh token:', error);
    }
  },
};

