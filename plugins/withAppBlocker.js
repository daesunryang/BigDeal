// 정식 빌드(APP_FLAVOR=full)에만 붙는 설정 플러그인.
// 실제 앱 차단에 필요한 권한과 포그라운드 서비스를 AndroidManifest에 넣는다.
const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const PERMS = [
  'android.permission.PACKAGE_USAGE_STATS',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.INTERNET',
];

module.exports = function withAppBlocker(config) {
  config = AndroidConfig.Permissions.withPermissions(config, PERMS);
  return withAndroidManifest(config, cfg => {
    const m = cfg.modResults.manifest;
    m.$['xmlns:tools'] = m.$['xmlns:tools'] || 'http://schemas.android.com/tools';
    // PACKAGE_USAGE_STATS는 시스템 권한이라 lint 경고를 끈다
    for (const p of m['uses-permission'] || []) if (p.$['android:name'] === 'android.permission.PACKAGE_USAGE_STATS') p.$['tools:ignore'] = 'ProtectedPermissions';
    // 설치된 앱 목록(런처 앱)을 읽기 위한 queries
    m.queries = m.queries && m.queries.length ? m.queries : [{}];
    const q = m.queries[0];
    q.intent = q.intent || [];
    const hasLauncher = q.intent.some(i => (i.category || []).some(c => c.$['android:name'] === 'android.intent.category.LAUNCHER'));
    if (!hasLauncher) q.intent.push({ action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }], category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }] });
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.service = app.service || [];
    if (!app.service.some(s => s.$['android:name'] === 'expo.modules.appblocker.BlockerService')) {
      app.service.push({
        $: { 'android:name': 'expo.modules.appblocker.BlockerService', 'android:exported': 'false', 'android:foregroundServiceType': 'specialUse' },
        property: [{ $: { 'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE', 'android:value': 'focus_session_app_blocking' } }],
      });
    }
    return cfg;
  });
};
