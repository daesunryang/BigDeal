import Constants from 'expo-constants';

// 빌드 종류. app.config.ts에서 APP_FLAVOR 환경 변수로 정해져 extra.flavor에 들어온다.
//  - demo: 프로토타입과 같은 UI 데모. 로그인·차단·동기화는 모두 흉내만 낸다.
//  - full: 실제 앱 차단(Android), Firebase 로그인, Firestore 동기화.
export type Flavor = 'demo' | 'full';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, any>;

export const FLAVOR: Flavor = extra.flavor === 'full' ? 'full' : 'demo';
export const IS_DEMO = FLAVOR === 'demo';
// 데모 빌드의 테스트용 츄르: 이 값 아래로 내려가면 다시 채운다 (App.tsx)
export const DEMO_CHURU = 99999;
export const IS_FULL = FLAVOR === 'full';

export const FIREBASE = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
export const FIREBASE_READY = !!(FIREBASE.apiKey && FIREBASE.projectId && FIREBASE.appId);

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// 업데이트 확인에 쓰는 GitHub 저장소 (릴리스에 APK를 올린다)
export const GITHUB_REPO = 'elpong2-ai/BigDeal';
