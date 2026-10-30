// 상태에서 계산되는 값들. 데모 빌드는 프로토타입의 예시 수치를, 정식 빌드는 실제 기록을 쓴다.
import { IS_DEMO } from './config';
import { WEEK_DEMO, isoDay, streakOf, growthOf } from './data';
import { State, dayOf } from './store';

export const todayMin = (s: State) => s.sessions.filter(x => x.ok && dayOf(x.at) === isoDay(0)).reduce((a, x) => a + x.min, 0);

export const minOn = (s: State, offset: number) => { const d = isoDay(offset); return s.sessions.filter(x => x.ok && dayOf(x.at) === d).reduce((a, x) => a + x.min, 0); };

// 이번 주 그래프 7칸: 6일 전 ~ 오늘
export const weekVals = (s: State) => (IS_DEMO ? [...WEEK_DEMO, todayMin(s)] : [6, 5, 4, 3, 2, 1, 0].map(o => minOn(s, o)));
export const weekLabels = () => {
  const D = ['일', '월', '화', '수', '목', '금', '토'];
  return IS_DEMO ? ['월', '화', '수', '목', '금', '토', '오늘'] : [6, 5, 4, 3, 2, 1].map(o => D[new Date(Date.now() - o * 864e5).getDay()]).concat(['오늘']);
};
export const monthHeat = (s: State) => (IS_DEMO
  ? Array.from({ length: 35 }, (_, i) => (i * 7 + 3) % 6)
  : Array.from({ length: 35 }, (_, i) => { const m = minOn(s, 34 - i); return m === 0 ? 0 : m < 20 ? 1 : m < 40 ? 2 : m < 60 ? 3 : m < 120 ? 4 : 5; }));

export const dkg = (s: State) => (s.donated / 10 + s.sponsorships.reduce((a, r) => a + (r.refunded ? 0 : r.kg), 0)).toFixed(1);
export const focusStreak = (s: State) => streakOf([...s.att, ...s.fdays]);
export const affOf = (s: State) => s.aff[s.catId] || 0;
export const growth = (s: State) => growthOf(affOf(s));
// 최근 n일 안에 완료한 세션
export const recentDone = (s: State, days: number) => { const since = Date.now() - days * 864e5; return s.sessions.filter(x => x.ok && x.at >= since); };
export const totalMin = (s: State) => s.sessions.filter(x => x.ok).reduce((a, x) => a + x.min, 0);

export const badges = (s: State): [string, string, number[], number, string][] => [
  ['연속 집중 일수', '일', [3, 7, 14, 30], focusStreak(s), 'chip1'],
  ['누적 집중 시간', '분', [60, 300, 1000, 3000], (IS_DEMO ? 310 : 0) + (IS_DEMO ? todayMin(s) : totalMin(s)), 'mint'],
  ['츄르 획득량', '개', [50, 200, 500, 1500], s.earnedTotal, 'pink'],
  ['후원 횟수', '회', [1, 5, 15, 30], s.donated + s.sponsorships.length, 'blue'],
  ['고양이 도감 수집', '마리', [1, 2, 3, 4], s.owned.length, 'purple'],
  ['방 꾸미기 아이템', '개', [3, 6, 10, 15], s.ownedDecor.length + s.items.length, '#EDE3C9'],
  ['노래 수집', '곡', [3, 5, 9, 13], s.seenSongs.length, 'mint'],
];
export const gotBadges = (s: State) => badges(s).reduce((a, b) => a + b[2].filter(x => b[3] >= x).length, 0);
export const goalDays = (s: State) => {
  if (IS_DEMO) return 12;
  let n = 0; for (let o = 0; o < 31; o++) if (minOn(s, o) >= s.goal) n++; return n;
};
