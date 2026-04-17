import type { ReactNode } from 'react';
import { usePlatform, type Platform } from '../../../hooks/usePlatform';

interface GateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function WebOnly({ children, fallback = null }: GateProps) {
  const { isWeb } = usePlatform();
  return <>{isWeb ? children : fallback}</>;
}

export function NativeOnly({ children, fallback = null }: GateProps) {
  const { isNative } = usePlatform();
  return <>{isNative ? children : fallback}</>;
}

interface PlatformGateProps {
  web?: ReactNode;
  ios?: ReactNode;
  android?: ReactNode;
  native?: ReactNode;
  children?: ReactNode;
}

export function PlatformGate({ web, ios, android, native, children = null }: PlatformGateProps) {
  const { platform } = usePlatform();
  const resolved = pickSlot(platform, { web, ios, android, native });
  return <>{resolved ?? children}</>;
}

function pickSlot(
  platform: Platform,
  slots: { web?: ReactNode; ios?: ReactNode; android?: ReactNode; native?: ReactNode },
): ReactNode | undefined {
  if (platform === 'ios' && slots.ios !== undefined) return slots.ios;
  if (platform === 'android' && slots.android !== undefined) return slots.android;
  if (platform !== 'web' && slots.native !== undefined) return slots.native;
  if (platform === 'web' && slots.web !== undefined) return slots.web;
  return undefined;
}
