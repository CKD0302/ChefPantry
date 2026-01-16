import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

export type Platform = 'web' | 'ios' | 'android';

export function getPlatform(): Platform {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() as 'ios' | 'android';
  }
  return 'web';
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function isWeb(): boolean {
  return !Capacitor.isNativePlatform();
}

export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isCapacitorAvailable(): boolean {
  return Capacitor.isPluginAvailable('App');
}

export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobileBrowser: boolean;
}

export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => ({
    platform: getPlatform(),
    isNative: isNative(),
    isWeb: isWeb(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isMobileBrowser: isMobileBrowser()
  }));

  useEffect(() => {
    setInfo({
      platform: getPlatform(),
      isNative: isNative(),
      isWeb: isWeb(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      isMobileBrowser: isMobileBrowser()
    });
  }, []);

  return info;
}
