import config from '../../app/config/env';

export type Platform = 'web' | 'ios' | 'android';

export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export function usePlatform(): PlatformInfo {
  return {
    platform: config.PLATFORM,
    isNative: config.IS_NATIVE,
    isWeb: !config.IS_NATIVE,
    isIOS: config.PLATFORM === 'ios',
    isAndroid: config.PLATFORM === 'android',
  };
}
