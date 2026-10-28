import { NativeModule, requireNativeModule } from 'expo';

export type InstalledApp = { pkg: string; name: string; icon: string; usageMin: number };
export type BlockerEvents = { tries: Record<string, number>; gaveUp: boolean };

declare class AppBlockerModule extends NativeModule<{ onGiveUp: (e: { pkg: string }) => void; onBlocked: (e: { pkg: string }) => void }> {
  hasUsageAccess(): boolean;
  canDrawOverlays(): boolean;
  openUsageAccessSettings(): void;
  openOverlaySettings(): void;
  openAppSettings(): void;
  getInstalledApps(): Promise<InstalledApp[]>;
  startBlocking(opts: { endAt: number; packages: string[]; names: Record<string, string>; strict: boolean; catName: string; catImage: string }): void;
  stopBlocking(): void;
  isBlocking(): boolean;
  consumeEvents(): BlockerEvents;
}

export default requireNativeModule<AppBlockerModule>('AppBlocker');
