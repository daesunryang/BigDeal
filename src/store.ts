import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { IS_DEMO, IS_FULL } from './config';
import {
  APPS, CATS, DECOR, DecorKind, FRIENDS, MAILS, Mail, ROOMS, ROOM_DEF, SHN, ANIMALS, BEH, BehId,
  Cat, GachaKind, CHURU_PACKS, catById, isoDay, reward, growthOf, won, SPECIAL, SONGS, songMs, GACHA_CATS, GACHA_COST, GACHA_PITY, TIER,
} from './data';
import type { Lang } from './i18n';
import { SPOT_COST, hashSeed } from './spots';
import { markBack, scrollKey } from './ui/scrollMemory';

export type Screen = 'splash' | 'login' | 'onboard' | 'tabs' | 'decor' | 'focus' | 'done' | 'fail' | 'rest';
export type GachaHit = { id: string; tier: 1 | 2 | 3; dup: boolean };
export type Tab = 'home' | 'gacha' | 'dex' | 'donate' | 'mail' | 'menu' | 'shop' | 'stats' | 'shelter';
export type Decor = { wall: string; floor: string; struct: string; outfit: string };
export type RoomData = { decor: Omit<Decor, 'outfit'> & { outfit?: string }; equipped: string[]; pos: Record<string, [number, number]> };
export type Session = { min: number; ok: boolean; tag: string; at: number };
export type Sponsorship = { id: number; animal: string; shelter: string; kind: '츄르' | '결제'; amt: string; kg: number; won: number; date: string; refunded?: boolean };
export type Dlg = { kind: string; name?: string; id?: number };
export type User = { name: string; email: string; provider: string; uid?: string };
export type Friend = { name: string; m: number; c: string; code: string };
export type BlockApp = { id: string; name: string; letter: string; color: string; usage: string; pkg?: string; icon?: string };

export type State = {
  // 진행
  screen: Screen; tab: Tab; prevTab: Tab; menuPage: string | null;
  // 계정
  user: User; linked: Record<string, boolean>; loggedIn: boolean;
  // 집중
  endH: number; endM: number; dur: number; wheel: boolean; tag: string;
  // 휴식 주기: restEvery분 집중할 때마다 restLen분 쉰다. midRest = 집중 도중의 휴식 화면
  restOn: boolean; restEvery: number; restLen: number; midRest: boolean;
  remain: number; total: number; endAt: number; pauseAt: number; fast: boolean;
  blocked: Record<string, boolean>; apps: BlockApp[];
  sessions: Session[]; last: null | { grow: boolean; goal: boolean; tag: string; min: number; churu: number; aff: number; up: boolean };
  showBlocked: boolean; holding: boolean; failPen: number; rest: number; blockedNow: number; blockedApp: string;
  // 고양이
  churu: number; earnedTotal: number; catId: string; owned: string[]; aff: Record<string, number>; sulky: boolean;
  msg: number; behOff: number; seenBeh: string[]; fedUntil: number;
  // 노래: singUntil까지 부르는 중, seenSongs = 수집한 노래(SONGS 번호)
  singUntil: number; songText: string; seenSongs: number[]; songBonus: { basic: boolean; cat: boolean };
  playingSong: number | null; // 도감에서 ▶ 듣기로 재생 중인 노래
  // 고양이 뽑기: gachaPity = 희귀 이상이 안 나온 연속 횟수, gachaRes = 방금 뽑은 결과(결과 창)
  gachaPity: number; gachaTotal: number; gachaRes: null | GachaHit[]; gachaPop: GachaKind | null; // 뽑기 결과 · 열린 뽑기 창
  // 얼룩: spots = 츄르로 다시 뽑은 고양이의 얼룩 씨앗, spotSalt = 이 기기(계정)만의 처음 얼룩 씨앗 (spotSeed)
  spots: Record<string, number>; spotSalt: number;
  // 방 · 집
  decor: Decor; ownedDecor: string[]; items: string[]; equipped: string[]; pos: Record<string, [number, number]>;
  decorCat: DecorKind; preview: null | { kind: DecorKind; id: string }; dragSel: string | null;
  house: boolean; hs: string; rooms: string[]; catRoom: string; jumping: boolean; pinUntil: number;
  rstore: Record<string, RoomData>; dRoom: string; roomNames: Record<string, string>; extra: boolean; houseHint: boolean; renaming: boolean; nameDraft: string;
  // 후원
  shelters: { kg: number }[]; donated: number; pick: number; thanks: string; donTab: 'give' | 'feed' | 'mine';
  sAnimal: string; sMode: 'churu' | 'cash'; sAmt: number; sponsorships: Sponsorship[]; cert: number | null; shIdx: number;
  pay: null | { method: string; agree: number[]; pack?: number }; rcpt: null | 'cum' | 'rcpt'; // pack = 츄르 충전 상품 번호 (없으면 후원 결제)
  churuShop: boolean; spotPop: boolean; // 츄르 충전 창 · 얼룩 창
  // 우편
  mails: Mail[]; mailRead: number[]; claimed: number[]; mailFilter: 'all' | 'reward' | 'report' | 'news'; openMail: number | null;
  // 메뉴 · 설정
  plus: boolean; plusPlan: 'life' | 'month'; plusKind: null | 'life' | 'month';
  toggles: { notif: boolean; sound: boolean; strict: boolean }; themeMode: 'system' | 'light' | 'dark'; lang: Lang;
  big: boolean; cb: boolean; haptic: boolean;
  perm: { a: boolean; b: boolean };
  goal: number; goalHit: string; goalNotify: boolean; remind: { on: boolean; time: string; days: number[] }; reportTab: 'week' | 'month';
  nick: string | null; avatarCat: string | null; wd: { reason: string; agree: boolean };
  bk: { auto: boolean; wifi: boolean; last: string; busy: boolean }; offline: boolean; offlineDemo: boolean;
  ledger: { l: string; a: number; d: string }[]; friends: Friend[]; friendCode: string; friendErr: string; myCode: string;
  tries: Record<string, number>; att: string[]; fdays: string[];
  dexTab: 'cat' | 'beh' | 'song' | 'item'; openNotice: number | null; openFaq: number | null; openOss: number | null;
  inq: { cat: string; text: string; sent: boolean };
  // 오버레이
  sheet: boolean; share: boolean; coach: number; coachSeen: boolean;
  adLeft: number; adDay: string; ad: number | null; dlg: Dlg | null; toastMsg: string; acct: boolean; emailMode: boolean; email: string; pw: string; loginErr: string;
  lastBack: number; mailDay: string; update: null | { tag: string; url: string; page: string; notes: string };
};

const today = () => isoDay(0);
const mmdd = () => { const d = new Date(); return String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); };

function initial(): State {
  const d = new Date(Date.now() + 30 * 60000), m = Math.ceil(d.getMinutes() / 5) * 5;
  const endH = (d.getHours() + (m === 60 ? 1 : 0)) % 24, endM = m % 60;
  const demo = IS_DEMO;
  return {
    screen: 'splash', tab: 'home', prevTab: 'menu', menuPage: null,
    user: demo ? { name: '김집중', email: 'focus.kim@gmail.com', provider: 'Google' } : { name: '', email: '', provider: '' }, linked: demo ? { Google: true } : {}, loggedIn: false,
    endH, endM, dur: 30, wheel: false, tag: '공부', restOn: true, restEvery: 25, restLen: 5, midRest: false,
    remain: 0, total: 0, endAt: 0, pauseAt: 0, fast: demo,
    blocked: { ig: true, yt: true, tt: true, wt: true, kk: false, gm: false }, apps: APPS,
    sessions: [], last: null, showBlocked: false, holding: false, failPen: 3, rest: 0, blockedNow: 0, blockedApp: '인스타그램',
    churu: demo ? 124 : 0, earnedTotal: demo ? 144 : 0, catId: 'cheese', owned: ['cheese'], aff: { cheese: demo ? 34 : 0 }, sulky: false,
    msg: 0, behOff: 0, seenBeh: ['idle'], fedUntil: 0, singUntil: 0, songText: '', seenSongs: [0], songBonus: { basic: false, cat: false }, playingSong: null, gachaPity: 0, gachaTotal: 0, gachaRes: null, gachaPop: null,
    spots: {}, spotSalt: Math.floor(Math.random() * 2 ** 31), churuShop: false, spotPop: false,
    decor: { wall: 'cream', floor: 'wood', struct: 'basic', outfit: 'none' }, ownedDecor: ['cream', 'wood', 'basic', 'none'], items: ['rug'], equipped: ['rug'], pos: {},
    decorCat: 'wall', preview: null, dragSel: null,
    house: false, hs: 'liv', rooms: ['liv', 'nap'], catRoom: 'liv', jumping: false, pinUntil: 0, rstore: {}, dRoom: 'liv', roomNames: {}, extra: false, houseHint: true, renaming: false, nameDraft: '',
    shelters: [{ kg: 12.4 }, { kg: 6.1 }], donated: 0, pick: 0, thanks: '', donTab: 'give', sAnimal: 'a0', sMode: 'churu', sAmt: 1, sponsorships: [], cert: null, shIdx: 0, pay: null, rcpt: null,
    mails: demo ? MAILS : MAILS.filter(m => m.id === 1 || m.type === 'news').map(m => (m.id === 1 ? { ...m, date: mmdd() } : m)), mailRead: [], claimed: [], mailFilter: 'all', openMail: null,
    plus: false, plusPlan: 'life', plusKind: null, toggles: { notif: true, sound: true, strict: false }, themeMode: 'system', lang: '한국어', big: false, cb: false, haptic: true,
    perm: { a: false, b: false },
    goal: 60, goalHit: '', goalNotify: true, remind: { on: true, time: '21:00', days: [1, 1, 1, 1, 1, 0, 0] }, reportTab: 'week',
    nick: null, avatarCat: null, wd: { reason: '', agree: false },
    bk: { auto: true, wifi: true, last: demo ? '방금 전' : '아직 없음', busy: false }, offline: false, offlineDemo: false,
    ledger: demo ? [{ l: '집중 50분 완료', a: 20, d: '10.27' }, { l: '출석 보상', a: 8, d: '10.26' }, { l: '털실 장난감 구매', a: -12, d: '10.25' }, { l: '집중 25분 완료', a: 10, d: '10.24' }, { l: '웰컴 선물', a: 20, d: '10.20' }] : [],
    friends: demo ? FRIENDS : [], friendCode: '', friendErr: '', myCode: 'CAT-4821',
    tries: demo ? { ig: 7, yt: 4, tt: 3, kk: 2 } : {}, att: demo ? [isoDay(3), isoDay(2), isoDay(1)] : [], fdays: demo ? [isoDay(3), isoDay(2), isoDay(1)] : [],
    dexTab: 'cat', openNotice: 0, openFaq: null, openOss: null, inq: { cat: '기능 제안', text: '', sent: false },
    sheet: false, share: false, coach: -1, coachSeen: false, adLeft: 3, adDay: today(), ad: null, dlg: null, toastMsg: '', acct: false, emailMode: false, email: '', pw: '', loginErr: '',
    lastBack: 0, mailDay: '', update: null,
  };
}

// 저장하지 않는 화면 상태
const TRANSIENT: (keyof State)[] = ['tab', 'prevTab', 'menuPage', 'wheel', 'midRest', 'singUntil', 'songText', 'playingSong', 'gachaRes', 'showBlocked', 'holding', 'msg', 'behOff', 'preview', 'dragSel', 'house', 'jumping', 'renaming', 'nameDraft',
  'thanks', 'cert', 'pay', 'rcpt', 'churuShop', 'spotPop', 'openMail', 'sheet', 'gachaPop', 'share', 'coach', 'ad', 'dlg', 'toastMsg', 'acct', 'emailMode', 'pw', 'loginErr', 'lastBack', 'update', 'friendErr', 'friendCode', 'offline', 'nick'];

// 동기화(백업)에 올릴 게임 데이터
export const SYNC_KEYS: (keyof State)[] = ['user', 'linked', 'churu', 'earnedTotal', 'catId', 'owned', 'aff', 'sulky', 'seenBeh', 'decor', 'ownedDecor', 'items', 'equipped', 'pos', 'rooms', 'catRoom', 'rstore', 'dRoom', 'roomNames', 'extra',
  'donated', 'pick', 'sponsorships', 'mails', 'mailRead', 'claimed', 'plus', 'plusKind', 'toggles', 'themeMode', 'lang', 'big', 'cb', 'haptic', 'goal', 'goalNotify', 'remind', 'avatarCat', 'ledger', 'friends', 'myCode', 'tries', 'att', 'fdays',
  'sessions', 'blocked', 'tag', 'restOn', 'restEvery', 'restLen', 'seenSongs', 'songBonus', 'gachaPity', 'gachaTotal', 'spots', 'spotSalt', 'coachSeen', 'houseHint', 'mailDay'];

type Actions = {
  set: (p: Partial<State> | ((s: State) => Partial<State> | null)) => void;
  toast: (m: string) => void;
  log: (l: string, a: number) => void;
  setEnd: (h: number, m: number) => void;
  start: (min: number) => void;
  tick: () => void;
  complete: () => void;
  quit: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  endRest: (auto?: boolean) => void;
  behavior: () => { id: BehId; text: string };
  markBeh: () => void;
  nextBehavior: () => void;
  sing: (pick?: number) => void;
  stopSong: () => void;
  moveCat: (id: string) => void;
  callCat: () => void;
  feed: (id: string, price: number) => void;
  roomData: (id: string) => RoomData;
  switchRoom: (id: string) => void;
  decorTap: (id: string, price: number) => void;
  buyPreview: () => void;
  sponsor: () => void;
  trySponsor: (platformMethod: string) => void;
  claimMail: (id: number) => void;
  claimAll: () => void;
  gachaPull: (kind: GachaKind, n: 1 | 10, rnd?: () => number) => void;
  rerollSpots: (id: string, rnd?: () => number) => void;
  needChuru: (n: number) => void;
  buyChuru: (pack: number) => void;
  back: () => boolean;
  reset: () => void;
  afterLogin: (u: User, linked: Record<string, boolean>) => void;
  dailyMail: () => void;
};

let toastT: ReturnType<typeof setTimeout> | undefined;
let restK = 0, songK = -1, playT: ReturnType<typeof setTimeout> | undefined; // 마지막으로 휴식한 주기 번호 · 마지막으로 부른 노래
export const hooks: { onStart?: (s: State) => void; onStop?: () => void; sfx?: (n: string) => void; onGoal?: (goal: number, catName: string) => void } = {};
const sfx = (n: string) => hooks.sfx?.(n);

export const useApp = create<State & Actions>()(persist((set, get) => ({
  ...initial(),
  set: p => set(p as any),
  toast: m => { clearTimeout(toastT); set({ toastMsg: m }); toastT = setTimeout(() => set({ toastMsg: '' }), 2200); },
  log: (l, a) => set(st => ({ ledger: [{ l, a, d: mmdd() }, ...st.ledger].slice(0, 300) })),

  setEnd: (h, m) => { const d = new Date(), now = d.getHours() * 60 + d.getMinutes(); const dur = Math.max(5, ((h * 60 + m) - now + 1440) % 1440); set({ endH: h, endM: m, dur }); },

  start: min => {
    sfx('start'); restK = 0;
    set({ screen: 'focus', dur: min, remain: min * 60, total: min * 60, endAt: Date.now() + min * 60000, pauseAt: 0, sheet: false, showBlocked: false, blockedNow: 0, house: false });
    hooks.onStart?.(get());
  },
  tick: () => {
    const s = get();
    if (s.screen === 'rest') {
      const rr = s.rest - (s.fast ? 30 : 0.25);
      if (rr > 0) set({ rest: rr }); else if (s.midRest) get().endRest(true); else set({ screen: 'tabs', tab: 'home', rest: 0 });
      return;
    }
    if (s.screen !== 'focus' || s.pauseAt) return;
    const r = s.fast ? s.remain - 30 : (s.endAt - Date.now()) / 1000;
    if (r <= 0) { get().complete(); return; }
    // 휴식 주기에 닿으면 타이머를 멈추고 휴식 화면으로 (같은 주기에서는 한 번만)
    if (s.restOn) {
      const k = Math.floor((s.total - r) / (s.restEvery * 60));
      if (k > 0 && k !== restK) {
        restK = k; sfx('coin'); get().toast(s.restEvery + '분 집중했어요 · ' + s.restLen + '분 쉬어 가요');
        hooks.onStop?.();
        set({ remain: r, screen: 'rest', rest: s.restLen * 60, midRest: true, pauseAt: Date.now() });
        return;
      }
    }
    set({ remain: r });
  },
  // 도중 휴식을 끝내고 남은 집중을 이어 간다 (휴식 시간만큼 종료 시각을 미룬다)
  endRest: auto => {
    const s = get(); if (!s.midRest) return;
    if (auto) { sfx('start'); get().toast('다시 집중해요'); }
    set({ screen: 'focus', midRest: false, rest: 0, pauseAt: 0, endAt: s.pauseAt ? s.endAt + (Date.now() - s.pauseAt) : s.endAt });
    hooks.onStart?.(get());
  },
  pauseTimer: () => { if (!get().pauseAt) set({ pauseAt: Date.now() }); },
  resumeTimer: () => { const s = get(); if (s.pauseAt) set({ endAt: s.endAt + (Date.now() - s.pauseAt), pauseAt: 0 }); },
  complete: () => {
    const s = get(), min = s.dur, rw = reward(min);
    const a0 = s.aff[s.catId] || 0, a1 = Math.min(100, a0 + rw.aff);
    const td = today();
    const todayMin = [{ min, ok: true, at: Date.now() }, ...s.sessions].filter(x => x.ok && isoDay(0) === dayOf(x.at)).reduce((a, x) => a + x.min, 0);
    const goalNow = todayMin >= s.goal && s.goalHit !== td;
    get().log('집중 ' + min + '분 완료', rw.churu); sfx('done');
    const up = Math.floor(a1 / 20) > Math.floor(a0 / 20);
    hooks.onStop?.();
    set({
      screen: 'done', fdays: s.fdays.includes(td) ? s.fdays : [...s.fdays, td], remain: 0, goalHit: goalNow ? td : s.goalHit,
      churu: s.churu + rw.churu, earnedTotal: s.earnedTotal + rw.churu, aff: { ...s.aff, [s.catId]: a1 }, sulky: false, showBlocked: false,
      mails: [...(up ? [{ id: Date.now() + 7, type: 'reward' as const, title: catById(s.catId).name + '와 친밀도 ♥' + Math.floor(a1 / 20) + ' 달성!', body: '표정이 한 단계 부드러워졌어요. 축하 선물을 보내요.', churu: 5, date: mmdd(), exp: '7일 후 만료' }] : []),
        { id: Date.now(), type: 'report' as const, title: '기부 완료 · 사료 100g', body: `${SHN[s.pick]}에 파트너가 사료 100g을 기부했어요. ${min}분 집중해 줘서 고마워요!`, date: mmdd() }, ...s.mails],
      donated: s.donated + 1, shelters: s.shelters.map((x, j) => (j === s.pick ? { kg: x.kg + 0.1 } : x)),
      last: { grow: growthOf(a1).idx > growthOf(a0).idx, goal: goalNow && s.goalNotify, tag: s.tag, min, churu: rw.churu, aff: rw.aff, up },
      sessions: [{ min, ok: true, tag: s.tag, at: Date.now() }, ...s.sessions].slice(0, 500),
    });
    if (goalNow && s.goalNotify) hooks.onGoal?.(s.goal, catById(s.catId).name);
  },
  quit: () => {
    sfx('fail'); hooks.onStop?.();
    set(st => { const pen = st.toggles.strict ? 6 : 3; return { screen: 'fail', showBlocked: false, holding: false, sulky: true, failPen: pen, dlg: null, aff: { ...st.aff, [st.catId]: Math.max(0, (st.aff[st.catId] || 0) - pen) }, sessions: [{ min: st.dur, ok: false, tag: st.tag, at: Date.now() }, ...st.sessions].slice(0, 500) }; });
  },

  behavior: () => {
    const s = get();
    if (s.singUntil > Date.now()) return { id: 'sing', text: s.songText || SONGS[0].t };
    if (s.fedUntil > Date.now()) return { id: 'purr', text: '냠냠, 골골골… 맛있어요!' };
    if (s.sulky) return { id: 'sulky', text: '…조금 서운했어요. 다시 같이 해요.' };
    return BEH[(s.msg + s.behOff) % BEH.length];
  },
  markBeh: () => {
    const b = get().behavior(), st = get();
    if (b.id === 'sing') return;
    if (b.id !== 'sulky' && !st.seenBeh.includes(b.id)) set({ seenBeh: [...st.seenBeh, b.id] });
    if (Date.now() < st.pinUntil) return;
    let tgt = st.sulky ? 'nap' : st.fedUntil > Date.now() ? 'kit' : (({ nap: 'nap', look: 'gar', hop: 'play' } as Record<string, string>)[b.id] || 'liv');
    if (!st.rooms.includes(tgt)) tgt = 'liv';
    if (tgt !== st.catRoom) {
      set({ catRoom: tgt, jumping: true }); setTimeout(() => set({ jumping: false }), 800);
      if (st.screen === 'focus' && !st.toggles.strict) get().toast(catById(st.catId).name + '가 ' + (st.roomNames[tgt] || ROOMS.find(r => r.id === tgt)!.name) + '(으)로 갔어요');
    }
  },
  nextBehavior: () => { sfx('meow'); set(st => ({ behOff: st.behOff + 1 })); get().markBeh(); },
  stopSong: () => { clearTimeout(playT); sfx('songstop'); set({ playingSong: null }); },
  // 홈에서 고양이를 누르면 노래한다. 기본 5곡 + 지금 고양이의 전용 곡 중 무작위(같은 곡 연속 금지).
  // pick을 주면 도감의 ▶ 듣기: 소리만 내고 수집 상태는 그대로.
  sing: pick => {
    const st = get();
    // 도감 ▶ 듣기: 같은 곡을 다시 누르면 멈추고, 다른 곡을 누르면 앞 곡을 멈추고 새로 튼다
    if (pick != null) {
      if (st.playingSong === pick) { get().stopSong(); return; }
      if (!st.toggles.sound) { get().toast('효과음이 꺼져 있어요 · 메뉴 → 소리 · 진동'); return; }
      clearTimeout(playT); sfx('song' + pick); set({ playingSong: pick });
      playT = setTimeout(() => set({ playingSong: null }), songMs(SONGS[pick]) - 700);
      return;
    }
    clearTimeout(playT); if (st.playingSong != null) set({ playingSong: null });
    const pool = SONGS.map((_, i) => i).filter(i => !SONGS[i].cat || SONGS[i].cat === st.catId);
    let k = pool[Math.floor(Math.random() * pool.length)];
    if (k === songK) k = pool[(pool.indexOf(k) + 1) % pool.length];
    songK = k; sfx('song' + k);
    const sg = SONGS[k], dur = songMs(sg);
    const isNew = !st.seenSongs.includes(k), ns = isNew ? [...st.seenSongs, k] : st.seenSongs;
    const basicAll = SONGS.every((x, i) => x.cat || ns.includes(i)), catAll = SONGS.every((x, i) => !x.cat || ns.includes(i));
    const bonus = (isNew && basicAll && !st.songBonus.basic ? 20 : 0) + (isNew && catAll && !st.songBonus.cat ? 50 : 0);
    set({ singUntil: Date.now() + dur, songText: sg.t, seenSongs: ns, songBonus: { basic: st.songBonus.basic || basicAll, cat: st.songBonus.cat || catAll }, churu: st.churu + bonus, earnedTotal: st.earnedTotal + bonus });
    if (isNew) get().toast('새 노래 · ' + sg.name + ' 수집!');
    if (bonus) {
      get().log(bonus === 20 ? '기본 노래 모두 수집' : '전용 노래 모두 수집', bonus);
      setTimeout(() => { sfx('coin'); get().toast((bonus === 20 ? '기본 노래 5곡 완성! 배지 · 츄르 +' : '전용 노래 8곡 완성! 배지 · 츄르 +') + bonus); }, 1800);
    }
    setTimeout(() => { if (get().singUntil && get().singUntil <= Date.now()) set({ singUntil: 0 }); }, dur + 100);
  },
  moveCat: id => {
    if (get().catRoom !== id) {
      sfx('meow'); set({ catRoom: id, jumping: true, pinUntil: Date.now() + 60000 });
      setTimeout(() => set({ jumping: false }), 800); setTimeout(() => set({ house: false }), 1000);
    } else set({ pinUntil: Date.now() + 60000 });
  },
  callCat: () => { sfx('meow'); set({ catRoom: 'liv', jumping: true, pinUntil: Date.now() + 30000 }); setTimeout(() => set({ jumping: false }), 800); get().toast('고양이를 거실로 불렀어요'); },
  feed: (id, price) => {
    const st = get(); if (st.churu < price) { get().toast('츄르가 부족해요'); return; }
    const gain = ({ tuna: 3, dried: 2, milk: 2 } as Record<string, number>)[id]; get().log('간식 구매', -price); sfx('meow');
    set({ churu: st.churu - price, aff: { ...st.aff, [st.catId]: Math.min(100, (st.aff[st.catId] || 0) + gain) }, fedUntil: Date.now() + 4000, sulky: false });
    get().toast('냠냠! 친밀도 +' + gain); get().markBeh();
    setTimeout(() => { set(s2 => ({ msg: s2.msg })); get().markBeh(); }, 4100);
  },

  roomData: id => {
    const s = get();
    if (id === s.dRoom) return { decor: s.decor, equipped: s.equipped, pos: s.pos };
    if (s.rstore[id]) return s.rstore[id];
    const df = ROOM_DEF[id];
    return df ? { decor: { wall: df.wall, floor: df.floor, struct: df.struct }, equipped: df.items, pos: {} } : { decor: s.decor, equipped: s.equipped, pos: s.pos };
  },
  switchRoom: id => set(st => {
    if (id === st.dRoom) return {};
    const cur = { decor: st.decor, equipped: st.equipped, pos: st.pos }, rs = { ...st.rstore, [st.dRoom]: cur };
    const df = ROOM_DEF[id], nx = rs[id] || (df ? { decor: { wall: df.wall, floor: df.floor, struct: df.struct }, equipped: df.items, pos: {} } : cur);
    return { rstore: rs, dRoom: id, decor: { ...(nx.decor as Decor), outfit: st.decor.outfit }, equipped: nx.equipped, pos: nx.pos, preview: null };
  }),
  decorTap: (id, price) => {
    const st = get(), k = st.decorCat, kind = DECOR[k];
    if (k === 'snack') return get().feed(id, price);
    const own = (kind.single ? st.ownedDecor.includes(id) : st.items.includes(id)) || (!kind.single && st.equipped.includes(id));
    if (own) {
      if (kind.single) set({ decor: { ...st.decor, [k]: id }, preview: null });
      else set({ equipped: st.equipped.includes(id) ? st.equipped.filter(x => x !== id) : [...st.equipped, id], preview: null });
    } else set({ preview: st.preview && st.preview.id === id ? null : { kind: k, id } });
  },
  buyPreview: () => {
    const st = get(), p0 = st.preview; if (!p0) return;
    const e = listOf(p0.kind, st.dRoom).find(x => x[0] === p0.id); if (!e || st.churu < e[2]) return;
    get().log(e[1] + ' 구매', -e[2]); sfx('buy');
    const aff = { ...st.aff, [st.catId]: Math.min(100, (st.aff[st.catId] || 0) + 2) };
    if (DECOR[p0.kind].single) set({ churu: st.churu - e[2], ownedDecor: [...st.ownedDecor, p0.id], decor: { ...st.decor, [p0.kind]: p0.id }, preview: null, aff });
    else set({ churu: st.churu - e[2], items: [...st.items, p0.id], equipped: [...st.equipped, p0.id], preview: null, aff });
  },

  sponsor: () => {
    const st = get(), an = ANIMALS.find(x => x.id === st.sAnimal)!, cm = st.sMode === 'churu';
    const amt = (cm ? [10, 30, 50] : [3000, 5000, 10000])[st.sAmt], kg = (cm ? [0.1, 0.3, 0.5] : [1, 2, 4])[st.sAmt];
    if (cm && st.churu < amt) return;
    if (cm) get().log(an.name + ' 후원', -amt); sfx('done');
    const id = Date.now();
    const rec: Sponsorship = { id, animal: an.name, shelter: SHN[an.sh], kind: cm ? '츄르' : '결제', amt: cm ? amt + ' 츄르' : won(amt), kg, won: cm ? 0 : amt, date: mmdd() };
    set({ churu: cm ? st.churu - amt : st.churu, sponsorships: [rec, ...st.sponsorships], cert: id, shelters: st.shelters.map((x, j) => (j === an.sh ? { kg: x.kg + kg } : x)),
      mails: [{ id: id + 1, type: 'report', title: an.name + ' 후원 완료', body: an.name + '에게 ' + rec.amt + ' 후원이 전달됐어요. 인증서는 후원 탭의 내 후원에서 다시 볼 수 있어요.', date: mmdd() }, ...st.mails] });
  },
  trySponsor: method => {
    const st = get();
    if (st.sMode === 'cash') { if (st.offline) { get().toast('오프라인에서는 결제할 수 없어요'); return; } set({ pay: { method, agree: [0, 0, 0] } }); }
    else get().sponsor();
  },
  claimMail: id => {
    const st = get(), m = st.mails.find(x => x.id === id); if (!m || !m.churu || st.claimed.includes(id)) return;
    get().log(m.title, m.churu); sfx('coin');
    set({ churu: st.churu + m.churu, earnedTotal: st.earnedTotal + m.churu, claimed: [...st.claimed, id], mailRead: st.mailRead.includes(id) ? st.mailRead : [...st.mailRead, id] });
  },
  claimAll: () => {
    const st = get(), cl = st.mails.filter(m => m.churu && !st.claimed.includes(m.id)); if (!cl.length) return;
    cl.forEach(m => get().log(m.title, m.churu!)); sfx('coin');
    const sum = cl.reduce((a, m) => a + (m.churu || 0), 0);
    set({ churu: st.churu + sum, earnedTotal: st.earnedTotal + sum, claimed: [...st.claimed, ...cl.map(m => m.id)], mailRead: [...st.mailRead, ...cl.map(m => m.id)] });
  },


  // 고양이 뽑기: 1회 40 츄르, 5회 180 츄르. 일반 65% · 희귀 28% · 전설 7%, 10번째마다 희귀 이상 보장.
  // 이미 만난 고양이가 나오면 등급에 따라 츄르를 돌려준다(일반 10 · 희귀 20 · 전설 40).
  gachaPull: (kind, n, rnd = Math.random) => {
    const st = get(), cost = n === 10 ? GACHA_COST[kind].ten : GACHA_COST[kind].one;
    if (kind === 'plus' && !st.plus) { get().toast('Plus 전용 뽑기는 Plus 구독 중에 할 수 있어요'); return; }
    if (st.churu < cost) { get().needChuru(cost - st.churu); return; }
    let pity = st.gachaPity, refund = 0;
    const owned = [...st.owned], res: GachaHit[] = [];
    const basic = CATS.filter(c => !c.plus);
    for (let i = 0; i < n; i++) {
      let tier: 1 | 2 | 3 = 1, c: Cat;
      if (kind === 'basic') c = basic[Math.floor(rnd() * basic.length) % basic.length];
      else {
        pity++;
        const r = rnd() * 100;
        tier = r < TIER[3].rate ? 3 : r < TIER[3].rate + TIER[2].rate ? 2 : 1;
        if (pity >= GACHA_PITY && tier < 2) tier = 2;
        if (tier >= 2) pity = 0;
        const pool = GACHA_CATS.filter(g => g.tier === tier);
        c = pool[Math.floor(rnd() * pool.length) % pool.length];
      }
      const dup = owned.includes(c.id);
      if (dup) refund += TIER[tier].refund; else owned.push(c.id);
      res.push({ id: c.id, tier, dup });
    }
    get().log((kind === 'plus' ? 'Plus 전용 뽑기 ' : '일반 뽑기 ') + n + '회', -cost); if (refund) get().log('이미 만난 고양이 · 츄르 돌려받기', refund);
    sfx('coin');
    set({ churu: st.churu - cost + refund, owned, gachaPity: pity, gachaTotal: st.gachaTotal + n, gachaRes: res });
  },
  // 얼룩 다시 뽑기: 200 츄르로 고양이의 얼룩을 새로 정한다 (만난 고양이만)
  rerollSpots: (id, rnd = Math.random) => {
    const st = get(), c = catById(id);
    if (!st.owned.includes(id) && !(c.plus && st.plus)) return;
    if (st.churu < SPOT_COST) { get().needChuru(SPOT_COST - st.churu); return; }
    const old = spotSeed(st, id);
    let seed = Math.floor(rnd() * 2 ** 31); if (seed === old) seed = (seed + 1) % 2 ** 31;
    get().log(c.name + ' 얼룩 다시 뽑기', -SPOT_COST); sfx('coin');
    set({ churu: st.churu - SPOT_COST, spots: { ...st.spots, [id]: seed } });
    get().toast(c.name + '에게 새 얼룩이 생겼어요');
  },
  // 츄르가 모자랄 때: 모자란 개수를 알려 주고 츄르 충전으로 바로 갈 수 있는 창
  needChuru: n => set({ dlg: { kind: 'nochuru', id: n } }),
  // 츄르 충전 (데모 결제). 정식 빌드는 스토어 결제를 붙이기 전까지 막아 둔다
  buyChuru: pack => {
    const p = CHURU_PACKS[pack]; if (!p) return;
    if (IS_FULL) { get().toast('츄르 충전은 곧 열려요'); set({ pay: null }); return; }
    const n = p[0] + p[1];
    get().log('츄르 충전 ' + p[0] + (p[1] ? ' + 보너스 ' + p[1] : ''), n); sfx('coin');
    set(st => ({ churu: st.churu + n, pay: null, churuShop: false }));
    get().toast('츄르 ' + n + '개를 충전했어요 (데모)');
  },


  // Android 뒤로가기 · 순서: 팝업 → 시트 → 하위 화면 → 탭 → 홈 → "한 번 더 누르면 종료". false를 돌려주면 앱을 닫는다.
  back: () => {
    const s = get(), S = (p: Partial<State>) => { set(p); return true; };
    if (s.dlg) { if (['bye', 'expired'].includes(s.dlg.kind)) return true; return S({ dlg: null }); }
    if (s.pay) return S({ pay: null }); if (s.churuShop) return S({ churuShop: false }); if (s.spotPop) return S({ spotPop: false }); if (s.rcpt) return S({ rcpt: null }); if (s.cert) return S({ cert: null });
    if (s.ad != null) return S({ ad: null }); if (s.share) return S({ share: false }); if (s.gachaRes) return S({ gachaRes: null }); if (s.gachaPop) return S({ gachaPop: null });
    if (s.wheel) return S({ wheel: false });
    if (s.sheet) return S({ sheet: false }); if (s.acct) return S({ acct: false }); if (s.house) return S({ house: false });
    if (s.showBlocked) return S({ showBlocked: false });
    if (s.coach >= 0) return S({ coach: -1, coachSeen: true });
    if (s.screen === 'decor' || s.screen === 'tabs') { if (popNav()) return true; }
    if (s.screen === 'decor') return S({ screen: 'tabs', preview: null });
    if (s.screen === 'focus') { get().toast('집중 중에는 뒤로가기가 막혀 있어요'); return true; }
    if (s.screen === 'rest' && s.midRest) { get().toast('휴식이 끝나면 남은 집중을 이어서 해요'); return true; }
    if (['done', 'fail', 'rest'].includes(s.screen)) return S({ screen: 'tabs', tab: 'home' });
    if (s.screen === 'onboard') return S({ screen: 'login' });
    if (s.screen === 'login' && s.emailMode) return S({ emailMode: false });
    if (s.screen === 'tabs') {
      if (s.tab === 'menu' && s.menuPage) { markBack(scrollKey('menu', null)); return S({ menuPage: null }); }
      if (s.tab === 'shelter') { markBack('donate'); return S({ tab: 'donate' }); }
      if (s.tab === 'dex') { markBack(scrollKey('menu', null)); return S({ tab: 'menu', menuPage: null }); }
      if (s.tab === 'shop' || s.tab === 'stats') { markBack(scrollKey(s.prevTab === 'home' ? 'home' : 'menu', null)); return S({ tab: s.prevTab === 'home' ? 'home' : 'menu' }); }
      if (s.tab !== 'home') return S({ tab: 'home' });
    }
    if (Date.now() - s.lastBack < 2000) return false;
    set({ lastBack: Date.now() }); get().toast('한 번 더 누르면 앱이 종료돼요'); return true;
  },
  // 정식 빌드: 하루에 한 번 출석 보상 우편이 온다 (데모는 프로토타입의 예시 우편 그대로)
  dailyMail: () => {
    const s = get(), td = today();
    if (IS_DEMO || !s.loggedIn || s.mailDay === td) return;
    const m: Mail = { id: Date.now(), type: 'reward', title: '출석 보상 · 오늘 출석 체크', body: '오늘도 냥집중에 와 줘서 고마워요. 출석 보상 츄르를 받으세요.', churu: 3, date: mmdd(), exp: '7일 후 만료' };
    set({ mailDay: td, mails: [m, ...s.mails].slice(0, 200) });
  },
  reset: () => { const keep = { themeMode: get().themeMode, lang: get().lang }; set({ ...initial(), ...keep, screen: 'login' }); },
  afterLogin: (u, linked) => { set(st => ({ user: st.user.uid && st.user.uid === u.uid ? { ...u, name: st.user.name || u.name } : u, linked, loggedIn: true, acct: false, emailMode: false, pw: '', loginErr: '', screen: st.perm.a && st.perm.b && st.coachSeen ? 'tabs' : 'onboard' })); get().dailyMail(); },
}), {
  name: 'jjn-state',
  version: 1,
  storage: createJSONStorage(() => AsyncStorage),
  partialize: s => {
    const o: any = {};
    for (const k of Object.keys(s) as (keyof State)[]) { const v = (s as any)[k]; if (typeof v !== 'function' && !TRANSIENT.includes(k)) o[k] = v; }
    // 화면은 집중 중일 때만 기억해서 강제 종료 후 복구에 쓴다
    o.screen = s.screen === 'focus' ? 'focus' : s.loggedIn ? 'tabs' : 'splash';
    return o;
  },
}));

export function dayOf(ts: number) { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

export function listOf(kind: DecorKind, room: string) {
  if (kind === 'special') return SPECIAL[room] || [];
  return DECOR[kind].list;
}

// ── 화면 이동 기록 ──
// 탭·하위 화면(메뉴 페이지, 상점, 기록, 방 꾸미기 등)을 옮길 때마다 직전 위치를 쌓아 두고,
// 뒤로가기(시스템 · 화면 위 ‹ 버튼)는 항상 "바로 전에 있던 화면"으로 돌아간다.
// 위치가 바뀌는 모든 setState를 여기서 한 번에 지켜보기 때문에, 새 화면을 추가해도 따로 할 일이 없다.
const NAV_OK = (sc: Screen) => sc === 'tabs' || sc === 'decor';
type Loc = { screen: Screen; tab: Tab; menuPage: string | null };
const locOf = (s: State): Loc => ({ screen: s.screen, tab: s.tab, menuPage: s.screen === 'tabs' && s.tab === 'menu' ? s.menuPage : null });
const locKey = (l: Loc) => l.screen === 'decor' ? 'decor' : l.screen + '|' + l.tab + '|' + (l.menuPage ?? '');
let navStack: Loc[] = [], navMute = false;

export const navDepth = () => navStack.length;
export function clearNav() { navStack = []; }
// 하단 탭을 눌러 이동할 때: 기록을 비우고 새로 시작한다 (탭 사이를 오가며 기록이 쌓이지 않게)
export function switchTab(patch: Partial<State>) { navMute = true; try { useApp.getState().set(patch); } finally { navMute = false; } navStack = []; }
export function popNav(): boolean {
  while (navStack.length) {
    const l = navStack.pop()!, cur = useApp.getState();
    if (locKey(l) === locKey(locOf(cur))) continue;
    navMute = true;
    if (l.screen === 'tabs') markBack(scrollKey(l.tab, l.menuPage));
    try { useApp.setState({ screen: l.screen, tab: l.tab, menuPage: l.menuPage, preview: null }); } finally { navMute = false; }
    return true;
  }
  return false;
}
useApp.subscribe((s, prev) => {
  if (navMute) return;
  if (!NAV_OK(s.screen)) { navStack = []; return; }
  if (!NAV_OK(prev.screen)) return;
  const a = locOf(prev), b = locOf(s);
  if (locKey(a) === locKey(b)) return;
  navStack.push(a);
  if (navStack.length > 40) navStack.shift();
});

// 고양이의 지금 얼룩 씨앗: 다시 뽑았으면 그 값, 아니면 이 기기만의 처음 얼룩
export const spotSeed = (s: Pick<State, 'spots' | 'spotSalt'>, id: string) => s.spots[id] ?? hashSeed(id + ':' + s.spotSalt);

export const getS = () => useApp.getState();
export const S = (p: Partial<State> | ((s: State) => Partial<State> | null)) => useApp.getState().set(p);
