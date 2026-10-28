import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { IS_FULL } from '../config';
import { minOn } from '../derive';
import { SYNC_KEYS, State, getS, useApp } from '../store';
import { authEnabled, currentUid } from './auth';
import { fb } from './firebase';

// 정식 빌드의 데이터 백업·동기화 (Firestore).
//  users/{uid}  : 게임 데이터 전체 (본인만 읽기·쓰기)
//  public/{code}: 친구 비교용 공개 정보 (이름, 대표 고양이, 이번 주 집중 분)
let net: NetInfoState | null = null;
let unsubStore: (() => void) | null = null, unsubNet: (() => void) | null = null, timer: ReturnType<typeof setTimeout> | undefined;

const nowLabel = () => { const d = new Date(); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const snapshot = (s: State) => { const o: any = {}; for (const k of SYNC_KEYS) o[k] = (s as any)[k]; return JSON.parse(JSON.stringify(o)); };

export function codeFor(uid: string) { let h = 0; for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'CAT-' + String(1000 + (h % 9000)); }
const weekMin = (s: State) => [0, 1, 2, 3, 4, 5, 6].reduce((a, o) => a + minOn(s, o), 0);

export async function pushNow(force = false) {
  const f = fb(), uid = currentUid(), s = getS();
  if (!f || !uid) return false;
  if (net && !net.isConnected) return false;
  if (!force && s.bk.wifi && net && net.type !== 'wifi' && net.type !== 'ethernet') return false;
  await setDoc(doc(f.db, 'users', uid), { data: snapshot(s), updatedAt: serverTimestamp() });
  await setDoc(doc(f.db, 'public', s.myCode), { uid, name: s.user.name, cat: s.avatarCat || s.catId, weekMin: weekMin(s), updatedAt: serverTimestamp() });
  useApp.setState({ bk: { ...getS().bk, last: nowLabel() } });
  return true;
}

// 로그인 직후: 서버에 기록이 있으면 불러오고, 없으면 이 기기의 기록을 올린다
export async function pullOnLogin(uid: string) {
  const f = fb(); if (!f) return;
  useApp.setState({ myCode: codeFor(uid) });
  try {
    const snap = await getDoc(doc(f.db, 'users', uid));
    if (snap.exists()) {
      const data = (snap.data() as any).data || {};
      const keep = getS().user;
      useApp.setState({ ...data, user: { ...keep, name: data.user?.name || keep.name }, myCode: codeFor(uid), bk: { ...getS().bk, last: '불러옴 · ' + nowLabel() } });
    } else await pushNow(true);
  } catch (e) { console.warn('pullOnLogin', e); }
}

export function startSync() {
  if (!IS_FULL || !authEnabled || unsubStore) return;
  unsubNet = NetInfo.addEventListener(st => { net = st; useApp.setState({ offline: st.isConnected === false }); });
  let prev = JSON.stringify(snapshot(getS()));
  unsubStore = useApp.subscribe(s => {
    if (!s.bk.auto || !currentUid()) return;
    const cur = JSON.stringify(snapshot(s)); if (cur === prev) return; prev = cur;
    clearTimeout(timer); timer = setTimeout(() => { pushNow().catch(() => {}); }, 4000);
  });
}
export function stopSync() { unsubStore?.(); unsubNet?.(); unsubStore = unsubNet = null; clearTimeout(timer); }

export async function readFriend(code: string) {
  const f = fb(); if (!f) return null;
  const snap = await getDoc(doc(f.db, 'public', code));
  return snap.exists() ? (snap.data() as { name: string; cat: string; weekMin: number }) : null;
}

export async function deleteRemote() {
  const f = fb(), uid = currentUid(), s = getS(); if (!f || !uid) return;
  await deleteDoc(doc(f.db, 'users', uid)).catch(() => {});
  await deleteDoc(doc(f.db, 'public', s.myCode)).catch(() => {});
}
