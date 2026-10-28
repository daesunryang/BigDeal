import { Platform } from 'react-native';
import { IS_FULL } from '../config';

// 실제 앱 차단 (정식 빌드 · Android). 네이티브 모듈 modules/app-blocker를 감싼다.
// 데모 빌드나 다른 플랫폼에서는 모든 함수가 아무 일도 하지 않는다.
export type InstalledApp = { pkg: string; name: string; icon: string; usageMin: number };
type Native = {
  hasUsageAccess(): boolean; canDrawOverlays(): boolean;
  openUsageAccessSettings(): void; openOverlaySettings(): void; openAppSettings(): void;
  getInstalledApps(): Promise<InstalledApp[]>;
  startBlocking(opts: { endAt: number; packages: string[]; names: Record<string, string>; strict: boolean; catName: string; catImage: string }): void;
  stopBlocking(): void;
  isBlocking(): boolean;
  consumeEvents(): { tries: Record<string, number>; gaveUp: boolean };
  addListener(ev: string, fn: (e: any) => void): { remove(): void };
};

let mod: Native | null = null;
if (IS_FULL && Platform.OS === 'android') {
  try { mod = require('../../modules/app-blocker').default as Native; } catch { mod = null; }
}

export const blocker = {
  available: !!mod,
  perms: () => (mod ? { usage: mod.hasUsageAccess(), overlay: mod.canDrawOverlays() } : { usage: false, overlay: false }),
  openUsage: () => mod?.openUsageAccessSettings(),
  openOverlay: () => mod?.openOverlaySettings(),
  openAppSettings: () => mod?.openAppSettings(),
  apps: async (): Promise<InstalledApp[]> => (mod ? mod.getInstalledApps() : []),
  start: (o: Parameters<Native['startBlocking']>[0]) => { try { mod?.startBlocking(o); } catch (e) { console.warn('startBlocking', e); } },
  stop: () => { try { mod?.stopBlocking(); } catch {} },
  isBlocking: () => (mod ? mod.isBlocking() : false),
  consume: () => (mod ? mod.consumeEvents() : { tries: {}, gaveUp: false }),
  on: (ev: 'onBlocked' | 'onGiveUp', fn: (e: any) => void) => (mod ? mod.addListener(ev, fn) : { remove() {} }),
};
