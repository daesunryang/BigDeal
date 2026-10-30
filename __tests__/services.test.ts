import { describe, expect, jest, test } from '@jest/globals';
import { tr } from '../src/i18n';
import { reminderPlan, toWeekday } from '../src/services/notify';
import { isNewer, parseVer, pickApk, promptUpdate } from '../src/services/update';
import { getS, useApp } from '../src/store';

describe('업데이트 확인', () => {
  test('버전 비교', () => {
    expect(parseVer('v1.2.3')).toEqual([1, 2, 3]);
    expect(isNewer('v1.1.0', '1.0.0')).toBe(true);
    expect(isNewer('v1.0.0', '1.0.0')).toBe(false);
    expect(isNewer('v1.0.9', '1.1.0')).toBe(false);
    expect(isNewer('v2.0.0', '1.9.9')).toBe(true);
  });

  test('빌드에 맞는 APK를 고른다', () => {
    const assets = [
      { name: 'nyangjibjung-v1.1.0.apk', browser_download_url: 'full' },
      { name: 'nyangjibjung-demo-v1.1.0.apk', browser_download_url: 'demo' },
      { name: 'notes.txt', browser_download_url: 'txt' },
    ];
    expect(pickApk(assets, true)?.browser_download_url).toBe('demo');
    expect(pickApk(assets, false)?.browser_download_url).toBe('full');
    expect(pickApk([], false)).toBeNull();
  });
});

describe('앱을 열 때 업데이트 묻기', () => {
  test('새 버전이 있으면 업데이트 창을 띄운다', async () => {
    useApp.setState({ dlg: null, screen: 'tabs', update: null });
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, json: async () => ({ tag_name: 'v99.0.0', html_url: 'page', assets: [{ name: 'nyangjibjung-demo-v99.0.0.apk', browser_download_url: 'apk' }] }) }));
    await promptUpdate();
    expect(getS().dlg).toEqual({ kind: 'update' });
    expect(getS().update?.tag).toBe('v99.0.0');
  });

  test('최신 버전이면 앱을 열 때 "최신 버전입니다"를 띄운다', async () => {
    useApp.setState({ dlg: null, screen: 'splash', update: null, toastMsg: '' });
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, json: async () => ({ tag_name: 'v0.0.1', html_url: 'page', assets: [] }) }));
    await promptUpdate(true);
    expect(getS().toastMsg).toBe('최신 버전입니다');
    expect(getS().dlg).toBeNull();
  });
});

describe('리마인더', () => {
  test('월~일을 알림 요일(일=1)로 바꾼다', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(toWeekday)).toEqual([2, 3, 4, 5, 6, 7, 1]);
  });

  test('켜진 요일만 예약하고, 알림이나 리마인더가 꺼지면 비운다', () => {
    const remind = { on: true, time: '21:30', days: [1, 0, 0, 0, 1, 0, 1] };
    expect(reminderPlan({ remind, toggles: { notif: true, sound: true, strict: false } })).toEqual([
      { i: 0, weekday: 2, hour: 21, minute: 30 }, { i: 4, weekday: 6, hour: 21, minute: 30 }, { i: 6, weekday: 1, hour: 21, minute: 30 },
    ]);
    expect(reminderPlan({ remind, toggles: { notif: false, sound: true, strict: false } })).toEqual([]);
    expect(reminderPlan({ remind: { ...remind, on: false }, toggles: { notif: true, sound: true, strict: false } })).toEqual([]);
  });
});

describe('번역', () => {
  test('사전과 패턴으로 바꾸고, 없는 문구는 그대로 둔다', () => {
    expect(tr('홈', 'English')).toBe('Home');
    expect(tr('도감', '日本語')).toBe('図鑑');
    expect(tr('1시간 30분', 'English')).toBe('1h 30m');
    expect(tr('25분 집중 완료', '日本語')).toBe('25分の集中が完了');
    expect(tr('사전에 없는 문구', 'English')).toBe('사전에 없는 문구');
    expect(tr('홈', '한국어')).toBe('홈');
  });
});
