import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, RadialGradient, Rect, Stop } from 'react-native-svg';
import { SPRITE_H, SPRITE_W, runsOf } from './pixelCat';

// 집중 화면의 "불멍" 장면: 어두운 방, 타닥타닥 타는 벽난로, 창밖 별, 그리고 도트 고양이.
// 고양이는 느긋하게 걷다가 불 앞에 앉아 꼬리를 흔들고, 털을 고르고, 식빵을 굽다가 잠들어요.
// 한 동작이 몇 초~1분씩 이어지고 빠르게 깜빡이는 것이 없어서, 집중하다가 가끔 바라보기 좋게 만들었다.
// 좌표는 가로 120 × 세로 64 도트이고, 화면 크기에 맞춰 늘려 그린다.

export const SCENE_W = 120, SCENE_H = 64;
const FLOOR_Y = 46, FEET_Y = 57;
const FIRE_X = 92, FIRE_W = 18; // 불이 타는 자리
const RUG_X = 64, WINDOW_X = 18;

type Act = 'walk' | 'sit' | 'groom' | 'loaf' | 'sleep' | 'stretch';
export type CatState = { x: number; dir: 1 | -1; act: Act; until: number; tx: number; t0: number };
export const ACT_TEXT: Record<Act, string> = {
  walk: '살금살금 걸어가요', sit: '불을 가만히 바라보고 있어요', groom: '앞발로 세수하고 있어요',
  loaf: '식빵을 굽고 있어요', sleep: '불 앞에서 꾸벅꾸벅 졸고 있어요', stretch: '쭉 기지개를 켜요',
};

// 다음 동작 고르기 (rnd: 0~1). 같은 자리에서 오래 머물수록 잠들 확률이 커진다.
export function nextAct(c: CatState, now: number, rnd: () => number): CatState {
  const s = (a: number, b: number) => (a + rnd() * (b - a)) * 1000;
  const atRug = Math.abs(c.x - RUG_X) < 6, atWindow = Math.abs(c.x - WINDOW_X) < 6;
  const walkTo = (tx: number): CatState => ({ ...c, act: 'walk', tx, dir: tx > c.x ? 1 : -1, until: Infinity, t0: now });
  switch (c.act) {
    case 'walk': return { ...c, act: 'sit', until: now + s(8, 14), t0: now };
    case 'sit': {
      const r = rnd();
      if (r < 0.3) return { ...c, act: 'groom', until: now + s(4, 6), t0: now };
      if (r < 0.65 && atRug) return { ...c, act: 'loaf', until: now + s(10, 20), t0: now };
      if (r < 0.8 && atWindow) return { ...c, act: 'sit', until: now + s(10, 16), t0: now };
      return walkTo(rnd() < 0.6 ? RUG_X + (rnd() * 6 - 3) : rnd() < 0.5 ? WINDOW_X : 30 + rnd() * 40);
    }
    case 'groom': return { ...c, act: 'sit', until: now + s(6, 10), t0: now };
    case 'loaf': return rnd() < 0.7 ? { ...c, act: 'sleep', until: now + s(30, 60), t0: now } : { ...c, act: 'sit', until: now + s(6, 10), t0: now };
    case 'sleep': return { ...c, act: 'stretch', until: now + 2400, t0: now };
    case 'stretch': return walkTo(rnd() < 0.5 ? WINDOW_X : 30 + rnd() * 30);
  }
}

// 지금 그릴 그림 이름
export function frameOf(c: CatState, now: number) {
  const t = (now - c.t0) / 1000;
  if (c.act === 'walk') return ['walk1', 'walk2', 'walk3', 'walk2'][Math.floor(t * 4) % 4];
  if (c.act === 'sleep') return Math.floor(t / 1.4) % 2 ? 'sleep2' : 'sleep1';
  if (c.act === 'loaf') return 'loaf';
  if (c.act === 'stretch') return 'stretch';
  if (c.act === 'groom') return Math.floor(t * 2) % 2 ? 'groom' : 'blink';
  // 앉아 있을 때: 가끔 꼬리를 흔들고 천천히 눈을 깜빡인다
  const k = Math.floor(t * 2.5) % 20;
  return k === 7 ? 'blink' : k >= 12 && k <= 14 ? 'sitTail' : 'sit';
}

// 벽난로 불꽃: 기둥마다 높이가 천천히 출렁인다
function flames(t: number) {
  const out: [number, number, number, string][] = [];
  for (let i = 0; i < FIRE_W; i++) {
    const mid = 1 - Math.abs(i - (FIRE_W - 1) / 2) / (FIRE_W / 2);
    const h = Math.max(1, Math.round((3 + 8 * mid) + 2.2 * Math.sin(i * 0.9 + t * 3.1) + 1.4 * Math.sin(i * 2.3 - t * 4.7)));
    const y0 = 44 - h;
    out.push([FIRE_X + i, y0, h, '#C8553D']);
    const m = Math.round(h * 0.68); if (m > 0) out.push([FIRE_X + i, 44 - m, m, '#E59A4C']);
    const c = Math.round(h * 0.35 * mid + 0.4); if (c > 0) out.push([FIRE_X + i, 44 - c, c, '#F6D58E']);
  }
  return out;
}

const STARS: [number, number, number][] = [[12, 11, 0.3], [17, 15, 1.7], [23, 10, 2.9], [14, 21, 4.1], [27, 19, 0.9], [31, 13, 3.3], [20, 25, 5.2]];

function Room() {
  // 움직이지 않는 배경 (한 번만 만든다)
  return useMemo(() => (
    <G>
      <Rect x={0} y={0} width={SCENE_W} height={FLOOR_Y} fill="#3B2D25" />
      {Array.from({ length: 12 }, (_, i) => <Rect key={'w' + i} x={i * 10 + 4} y={0} width={1} height={FLOOR_Y} fill="#41322A" />)}
      <Rect x={0} y={FLOOR_Y} width={SCENE_W} height={SCENE_H - FLOOR_Y} fill="#5C4232" />
      {[50, 55, 60].map(y => <Rect key={'f' + y} x={0} y={y} width={SCENE_W} height={1} fill="#513A2C" />)}
      {[[14, 47], [46, 52], [78, 47], [30, 57], [102, 56]].map(([x, y]) => <Rect key={'s' + x} x={x} y={y} width={1} height={3} fill="#513A2C" />)}
      {/* 창 */}
      <Rect x={9} y={7} width={27} height={24} fill="#6B5040" />
      <Rect x={10} y={8} width={25} height={22} fill="#1E2A44" />
      <Rect x={10} y={22} width={25} height={8} fill="#24314D" />
      <Rect x={8} y={30} width={29} height={2} fill="#7A5C49" />
      {/* 달 */}
      <Rect x={28} y={10} width={4} height={4} fill="#F3E3B0" /><Rect x={27} y={11} width={6} height={2} fill="#F3E3B0" /><Rect x={30} y={10} width={2} height={2} fill="#1E2A44" />
      {/* 벽난로 */}
      <Rect x={84} y={15} width={34} height={3} fill="#6B5040" />
      <Rect x={86} y={18} width={30} height={28} fill="#8A7666" />
      {[[86, 22], [96, 22], [106, 22], [91, 27], [101, 27], [111, 27], [86, 32], [111, 34], [86, 40], [111, 40]].map(([x, y]) => <Rect key={'b' + x + '-' + y} x={x} y={y} width={9} height={1} fill="#7A6758" />)}
      <Rect x={91} y={27} width={20} height={19} fill="#1A1210" />
      <Rect x={92} y={28} width={18} height={2} fill="#241A16" />
      {/* 벽난로 위 작은 화분과 컵 */}
      <Rect x={89} y={11} width={4} height={4} fill="#B0604A" /><Rect x={88} y={8} width={2} height={3} fill="#8DBF93" /><Rect x={91} y={7} width={2} height={4} fill="#8DBF93" />
      <Rect x={108} y={12} width={4} height={3} fill="#E3EFDF" /><Rect x={112} y={13} width={1} height={1} fill="#E3EFDF" />
      {/* 러그 */}
      <Ellipse cx={RUG_X + 6} cy={56} rx={17} ry={3.5} fill="#8C4A3C" />
      <Ellipse cx={RUG_X + 6} cy={56} rx={13} ry={2} fill="#A35A48" />
    </G>
  ), []);
}

function CatSprite({ catId, c, frame }: { catId: string; c: CatState; frame: string }) {
  const runs = runsOf(frame, catId);
  const x = Math.round(c.x - SPRITE_W / 2), y = FEET_Y - SPRITE_H;
  // 앉은 그림은 정면이라 뒤집지 않는다
  const flip = c.dir < 0 && (frame.startsWith('walk') || frame === 'loaf' || frame.startsWith('sleep') || frame === 'stretch');
  return (
    <G transform={flip ? `translate(${x + SPRITE_W} ${y}) scale(-1 1)` : `translate(${x} ${y})`}>
      {runs.map(([rx, ry, n, col], i) => <Rect key={i} x={rx} y={ry} width={n} height={1} fill={col} />)}
    </G>
  );
}

// 잠잘 때 떠오르는 z (도트 3×3)
function Zz({ x, y, t }: { x: number; y: number; t: number }) {
  const k = (t % 3) / 3, yy = y - k * 9, xx = x + k * 4, o = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
  return <G opacity={o} transform={`translate(${Math.round(xx)} ${Math.round(yy)})`}><Rect x={0} y={0} width={3} height={1} fill="#F3E3B0" /><Rect x={1} y={1} width={1} height={1} fill="#F3E3B0" /><Rect x={0} y={2} width={3} height={1} fill="#F3E3B0" /></G>;
}

type Spark = { x: number; y: number; v: number; born: number };
type Sim = { start: number; now: number; cat: CatState; sparks: Spark[] };

function step(p: Sim, t: number): Sim {
  const dt = Math.min(0.5, (t - p.now) / 1000);
  let c = p.cat;
  if (c.act === 'walk') {
    c = { ...c, x: c.x + 6 * dt * c.dir }; // 1초에 6도트, 아주 느긋하게
    if ((c.dir > 0 && c.x >= c.tx) || (c.dir < 0 && c.x <= c.tx)) c = nextAct({ ...c, x: c.tx }, t, Math.random);
  } else if (t >= c.until) c = nextAct(c, t, Math.random);
  // 불티: 가끔 하나씩 올라가다 사라진다
  const sparks = p.sparks.filter(q => t - q.born < 2600);
  if (Math.random() < 0.08) sparks.push({ x: FIRE_X + 4 + Math.random() * (FIRE_W - 8), y: 32, v: 3 + Math.random() * 3, born: t });
  return { ...p, now: t, cat: c, sparks };
}

export function Hearth({ catId, width, onAct, paused }: { catId: string; width: number; onAct?: (text: string) => void; paused?: boolean }) {
  const [sim, setSim] = useState<Sim>(() => { const t0 = Date.now(); return { start: t0, now: t0, cat: { x: RUG_X, dir: 1, act: 'sit', until: t0 + 6000, tx: RUG_X, t0 }, sparks: [] }; });
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSim(p => step(p, Date.now())), 160);
    return () => clearInterval(id);
  }, [paused]);
  const act = sim.cat.act;
  useEffect(() => { onAct?.(ACT_TEXT[act]); }, [act, onAct]);
  const { now, cat: c } = sim, t = (now - sim.start) / 1000, frame = frameOf(c, now);
  const glow = 0.13 + 0.03 * Math.sin(t * 1.3) + 0.015 * Math.sin(t * 3.7);
  const h = width * SCENE_H / SCENE_W;
  return (
    <View style={{ width, height: h }} accessible accessibilityLabel={'벽난로 앞의 도트 고양이. ' + ACT_TEXT[c.act]}>
      <Svg width={width} height={h} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#F2A65A" stopOpacity={0.9} /><Stop offset="0.4" stopColor="#F2A65A" stopOpacity={0.35} /><Stop offset="1" stopColor="#F2A65A" stopOpacity={0} /></RadialGradient>
        </Defs>
        <Room />
        {STARS.map(([x, y, ph]) => <Rect key={'st' + x} x={x} y={y} width={1} height={1} fill="#F3E3B0" opacity={0.35 + 0.65 * Math.max(0, Math.sin(t * 0.8 + ph))} />)}
        {/* 불빛: 가운데서 바깥으로 부드럽게 퍼지고 천천히 일렁인다 */}
        <Circle cx={FIRE_X + FIRE_W / 2} cy={38} r={44} fill="url(#glow)" opacity={glow * 1.6} />
        <Ellipse cx={FIRE_X + FIRE_W / 2} cy={53} rx={46} ry={8} fill="url(#glow)" opacity={glow * 1.8} />
        {flames(t).map(([x, y, hh, col], i) => <Rect key={'fl' + i} x={x} y={y} width={1} height={hh} fill={col} />)}
        <Rect x={93} y={43} width={16} height={2} fill="#6B4A32" /><Rect x={95} y={42} width={12} height={1} fill="#7D5A3E" />
        {sim.sparks.map((p, i) => { const a = (now - p.born) / 1000; return <Rect key={'sp' + p.born + i} x={Math.round(p.x + Math.sin(a * 3 + i) * 1.5)} y={Math.round(p.y - a * p.v)} width={1} height={1} fill="#F6D58E" opacity={Math.max(0, 1 - a / 2.6)} />; })}
        <CatSprite catId={catId} c={c} frame={frame} />
        {c.act === 'sleep' && <><Zz x={c.x + (c.dir > 0 ? 5 : -8)} y={FEET_Y - 9} t={t} /><Zz x={c.x + (c.dir > 0 ? 5 : -8)} y={FEET_Y - 9} t={t + 1.5} /></>}
      </Svg>
    </View>
  );
}
