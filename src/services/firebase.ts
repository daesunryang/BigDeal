import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import { FIREBASE, FIREBASE_READY, IS_FULL } from '../config';

// 정식 빌드에서만 Firebase를 켠다. 키는 빌드 때 EXPO_PUBLIC_FIREBASE_* 환경 변수로 들어온다.
let app: FirebaseApp | null = null, auth: Auth | null = null, db: Firestore | null = null;

export function fb() {
  if (!IS_FULL || !FIREBASE_READY) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(FIREBASE);
    if (Platform.OS === 'web') auth = getAuth(app);
    else {
      // getReactNativePersistence는 @firebase/auth의 react-native 빌드에만 있다 (타입 정의에는 없음)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getReactNativePersistence } = require('@firebase/auth') as any;
      try { auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); } catch { auth = getAuth(app); }
    }
    try { db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true }); } catch { db = getFirestore(app); }
  }
  return { app: app!, auth: auth!, db: db! };
}
