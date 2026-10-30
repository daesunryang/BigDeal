import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import {
  EmailAuthProvider, GoogleAuthProvider, User as FbUser, createUserWithEmailAndPassword, deleteUser, linkWithCredential,
  onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, signOut, unlink,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { FIREBASE_READY, GOOGLE_WEB_CLIENT_ID, IS_FULL } from '../config';
import type { User } from '../store';
import { fb } from './firebase';

// 정식 빌드의 실제 로그인. 데모 빌드에서는 쓰지 않는다.
export const authEnabled = IS_FULL && FIREBASE_READY;

let configured = false;
function gConf() {
  if (configured || Platform.OS === 'web') return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID || undefined });
  configured = true;
}

const PROVIDER_NAME: Record<string, string> = { 'google.com': 'Google', password: '이메일', 'apple.com': 'Apple' };

export function toUser(u: FbUser): { user: User; linked: Record<string, boolean> } {
  const linked: Record<string, boolean> = {};
  for (const p of u.providerData) { const n = PROVIDER_NAME[p.providerId]; if (n) linked[n] = true; }
  const first = u.providerData[0]?.providerId;
  return { user: { uid: u.uid, name: u.displayName || (u.email ? u.email.split('@')[0] : '집사'), email: u.email || '', provider: PROVIDER_NAME[first] || '이메일' }, linked };
}

export class AuthError extends Error {}
const KO: Record<string, string> = {
  'auth/invalid-email': '올바른 이메일 주소를 입력해 주세요.', 'auth/wrong-password': '비밀번호가 맞지 않아요.', 'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않아요.',
  'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 해 주세요.', 'auth/network-request-failed': '네트워크에 연결할 수 없어요.', 'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
  'auth/email-already-in-use': '이미 가입된 이메일이에요.', 'auth/credential-already-in-use': '이미 다른 냥집중 계정에 연결된 계정이에요.', 'auth/requires-recent-login': '보안을 위해 다시 로그인한 뒤 시도해 주세요.',
};
const wrap = (e: any) => new AuthError(KO[e?.code] || e?.message || '로그인하지 못했어요.');

async function googleCredential() {
  gConf();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  try {
    const r = await GoogleSignin.signIn();
    if (r.type !== 'success') return null;
    const idToken = r.data.idToken;
    if (!idToken) throw new AuthError('Google 토큰을 받지 못했어요. 웹 클라이언트 ID 설정을 확인해 주세요.');
    return GoogleAuthProvider.credential(idToken);
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) return null;
    if (e instanceof AuthError) throw e;
    throw wrap(e);
  }
}

export async function googleSignIn() {
  const f = fb(); if (!f) throw new AuthError('Firebase 설정이 없어요.');
  const cred = await googleCredential(); if (!cred) return null;
  try { const r = await signInWithCredential(f.auth, cred); return toUser(r.user); } catch (e) { throw wrap(e); }
}

// 이메일은 "로그인 / 가입" 한 버튼: 계정이 없으면 만든다
export async function emailSignIn(email: string, pw: string) {
  const f = fb(); if (!f) throw new AuthError('Firebase 설정이 없어요.');
  try { return toUser((await signInWithEmailAndPassword(f.auth, email, pw)).user); }
  catch (e: any) {
    if (e?.code === 'auth/user-not-found' || e?.code === 'auth/invalid-credential') {
      try { return toUser((await createUserWithEmailAndPassword(f.auth, email, pw)).user); }
      catch (e2: any) { if (e2?.code === 'auth/email-already-in-use') throw wrap({ code: 'auth/invalid-credential' }); throw wrap(e2); }
    }
    throw wrap(e);
  }
}

export async function linkGoogle() {
  const f = fb(); const u = f?.auth.currentUser; if (!u) throw new AuthError('로그인이 필요해요.');
  const cred = await googleCredential(); if (!cred) return null;
  try { return toUser((await linkWithCredential(u, cred)).user); } catch (e) { throw wrap(e); }
}
export async function linkEmail(email: string, pw: string) {
  const f = fb(); const u = f?.auth.currentUser; if (!u) throw new AuthError('로그인이 필요해요.');
  try { return toUser((await linkWithCredential(u, EmailAuthProvider.credential(email, pw))).user); } catch (e) { throw wrap(e); }
}
export async function unlinkProvider(name: string) {
  const f = fb(); const u = f?.auth.currentUser; if (!u) return null;
  const id = Object.keys(PROVIDER_NAME).find(k => PROVIDER_NAME[k] === name); if (!id) return null;
  try { return toUser(await unlink(u, id)); } catch (e) { throw wrap(e); }
}

export async function logOut() {
  const f = fb(); if (!f) return;
  try { if (Platform.OS !== 'web') { gConf(); await GoogleSignin.signOut(); } } catch {}
  await signOut(f.auth);
}

export async function deleteAccount() {
  const f = fb(); const u = f?.auth.currentUser; if (!u) return;
  try { await deleteUser(u); } catch (e) { throw wrap(e); }
  try { if (Platform.OS !== 'web') await GoogleSignin.revokeAccess(); } catch {}
}

export function watchAuth(fn: (u: FbUser | null) => void) {
  const f = fb(); if (!f) return () => {};
  return onAuthStateChanged(f.auth, fn);
}
export const currentUid = () => fb()?.auth.currentUser?.uid ?? null;
