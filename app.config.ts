import type { ConfigContext, ExpoConfig } from 'expo/config';

// 두 가지 APK를 같은 코드에서 만든다.
//   APP_FLAVOR=demo (기본): UI 데모. 로그인·차단·동기화는 흉내만 낸다.
//   APP_FLAVOR=full       : 실제 앱 차단(Android), Firebase 로그인·동기화.
const flavor = process.env.APP_FLAVOR === 'full' ? 'full' : 'demo';
const full = flavor === 'full';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: full ? '냥집중' : '냥집중 데모',
  slug: 'jibjungnyang',
  version: '1.1.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#FBF6EE',
  scheme: 'jibjungnyang',
  ios: { supportsTablet: false, bundleIdentifier: full ? 'com.jibjungnyang.app' : 'com.jibjungnyang.demo' },
  android: {
    package: full ? 'com.jibjungnyang.app' : 'com.jibjungnyang.demo',
    versionCode: 3,
    adaptiveIcon: {
      backgroundColor: '#E59A4C',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: 'resize',
    permissions: ['VIBRATE'],
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK'],
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-font',
    ['expo-splash-screen', { image: './assets/splash-icon.png', imageWidth: 180, backgroundColor: '#FBF6EE', dark: { image: './assets/splash-icon.png', backgroundColor: '#1F1814' } }],
    ['expo-audio', { microphonePermission: false, enableBackgroundPlayback: false }],
    'expo-sharing',
    ['expo-build-properties', { android: { minSdkVersion: 26 } }],
    ...(full ? ['./plugins/withAppBlocker', ['expo-notifications', { color: '#E59A4C', defaultChannel: 'jjn_remind' }]] : []),
  ] as ExpoConfig['plugins'],
  extra: { flavor },
});
