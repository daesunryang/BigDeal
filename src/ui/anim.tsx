import React, { createContext, useContext, useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';

// 프로토타입의 CSS @keyframes를 옮긴 것. 각 키프레임: [진행(0~1), { y, x, sx, sy, s, r(deg), o }]
type P = { x?: number; y?: number; s?: number; sx?: number; sy?: number; r?: number; o?: number };
type KF = [number, P][];
const K: Record<string, KF> = {
  bob: [[0, { y: 0 }], [0.5, { y: -4 }], [1, { y: 0 }]],
  pop: [[0, { s: 0.6, o: 0 }], [0.7, { s: 1.06, o: 1 }], [1, { s: 1, o: 1 }]],
  sqbounce: [[0, { y: 0, sx: 1.06, sy: 0.94 }], [0.35, { y: -30, sx: 0.95, sy: 1.05 }], [0.55, { y: -34, sx: 1, sy: 1 }], [0.85, { y: 0, sx: 1.03, sy: 0.97 }], [1, { y: 0, sx: 1.06, sy: 0.94 }]],
  shake: [[0, { r: -14, x: 0 }], [0.25, { r: -6, x: -4 }], [0.75, { r: -20, x: 4 }], [1, { r: -14, x: 0 }]],
  bite: [[0, { o: 0 }], [0.25, { o: 0 }], [0.45, { o: 1 }], [0.9, { o: 1 }], [1, { o: 0 }]],
  crumb: [[0, { o: 0, x: 0, y: 0, r: 0 }], [0.4, { o: 0, x: 0, y: 0, r: 0 }], [0.5, { o: 1 }], [1, { o: 0, y: 80, r: 160 }]],
  scratch: [[0, { sx: 0 }], [0.15, { sx: 0 }], [0.4, { sx: 1 }], [1, { sx: 1 }]],
  popin: [[0, { s: 0, o: 0 }], [0.4, { s: 0, o: 0 }], [0.52, { s: 1.25, o: 1 }], [0.62, { s: 1, o: 1 }], [0.88, { s: 1, o: 1 }], [1, { s: 1, o: 0 }]],
  load: [[0, { sx: 0 }], [1, { sx: 1 }]],
  nap: [[0, { sx: 1.04, sy: 0.9, r: -3 }], [0.5, { sx: 1.07, sy: 0.87, r: -3 }], [1, { sx: 1.04, sy: 0.9, r: -3 }]],
  meow: [[0, { y: 0, sx: 1, sy: 1 }], [0.12, { y: 0, sx: 1.06, sy: 0.92 }], [0.25, { y: -10, sx: 0.96, sy: 1.05 }], [0.4, { y: 0, sx: 1, sy: 1 }], [0.6, { y: 0, sx: 1, sy: 1 }], [1, { y: 0, sx: 1, sy: 1 }]],
  stretch: [[0, { sx: 1, sy: 1 }], [0.4, { sx: 1.14, sy: 0.88 }], [0.6, { sx: 1.14, sy: 0.88 }], [1, { sx: 1, sy: 1 }]],
  sway: [[0, { r: 0 }], [0.25, { r: -6 }], [0.75, { r: 6 }], [1, { r: 0 }]],
  hop: [[0, { y: 0, sx: 1.06, sy: 0.94 }], [0.45, { y: -34, sx: 0.96, sy: 1.05 }], [1, { y: 0, sx: 1.06, sy: 0.94 }]],
  purr: [[0, { x: 0 }], [0.5, { x: 1 }], [1, { x: -1 }]],
  zfloat: [[0, { o: 0, x: 0, y: 0, s: 0.6 }], [0.25, { o: 1 }], [1, { o: 0, x: 22, y: -46, s: 1.2 }]],
  hfloat: [[0, { o: 0, x: 0, y: 0, s: 0.6 }], [0.2, { o: 1 }], [1, { o: 0, y: -60, s: 1.1 }]],
  bubblepop: [[0, { s: 0, o: 0 }], [0.08, { s: 0, o: 0 }], [0.2, { s: 1.15, o: 1 }], [0.3, { s: 1, o: 1 }], [0.7, { s: 1, o: 1 }], [0.85, { s: 0.9, o: 0 }], [1, { s: 0.9, o: 0 }]],
  wobble: [[0, { r: 10, y: 0 }], [0.5, { r: 16, y: -2 }], [1, { r: 10, y: 0 }]],
  behin: [[0, { o: 0, s: 0.86 }], [1, { o: 1, s: 1 }]],
  confetti: [[0, { y: -20, r: 0, o: 0 }], [0.1, { o: 1 }], [1, { y: 560, r: 540, o: 1 }]],
  tear: [[0, { y: 0, o: 0 }], [0.2, { o: 1 }], [1, { y: 46, o: 0 }]],
  droop: [[0, { r: -2, sy: 0.97 }], [0.5, { r: 2, sy: 0.94 }], [1, { r: -2, sy: 0.97 }]],
  rise: [[0, { o: 0, y: 14 }], [1, { o: 1, y: 0 }]],
  fillbar: [[0, { sx: 0 }], [1, { sx: 1 }]],
  spark: [[0, { o: 0, s: 0.4, r: 0 }], [0.5, { o: 1, s: 1.1, r: 30 }], [1, { o: 0, s: 0.4, r: 0 }]],
  note: [[0, { o: 0, x: 0, y: 0, r: 0 }], [0.25, { o: 1 }], [1, { o: 0, x: 16, y: -40, r: 14 }]],
  songnote: [[0, { o: 0, x: 0, y: 0, s: 0.7 }], [0.2, { o: 1 }], [1, { o: 0, x: 0, y: -46, s: 1.1 }]],
  hopj: [[0, { y: 0, sx: 1.1, sy: 0.9 }], [0.3, { y: -26, sx: 0.95, sy: 1.08 }], [0.6, { y: -30, sx: 1, sy: 1 }], [1, { y: 0, sx: 1.1, sy: 0.9 }]],
  tapring: [[0, { s: 0.4, o: 0.95 }], [0.7, { s: 1.6, o: 0 }], [1, { s: 1.6, o: 0 }]],
  pulse: [[0, { o: 0.45 }], [0.5, { o: 1 }], [1, { o: 0.45 }]],
};
export type AnimName = keyof typeof K;

// true인 동안 안쪽 애니메이션을 그 자리에서 멈춘다 (집중 설정 창이 열린 홈)
export const Freeze = createContext(false);

const DEF: Required<P> = { x: 0, y: 0, s: 1, sx: 1, sy: 1, r: 0, o: 1 };
const native = Platform.OS !== 'web';

function track(kf: KF, key: keyof P) {
  const pts = kf.filter(([, p]) => p[key] !== undefined).map(([t, p]) => [t, p[key] as number] as [number, number]);
  if (!pts.length) return null;
  if (pts[0][0] > 0) pts.unshift([0, pts[0][1]]);
  if (pts[pts.length - 1][0] < 1) pts.push([1, pts[pts.length - 1][1]]);
  // 같은 시점이 두 번 나오면 interpolate가 거부하므로 살짝 민다
  for (let i = 1; i < pts.length; i++) if (pts[i][0] <= pts[i - 1][0]) pts[i][0] = pts[i - 1][0] + 1e-4;
  return { inputRange: pts.map(p => p[0]), outputRange: pts.map(p => p[1]) };
}

export function useAnim(name: AnimName | null, dur: number, opt: { delay?: number; loop?: boolean; easing?: (t: number) => number; vars?: P } = {}) {
  const [v] = useState(() => new Animated.Value(0));
  const { delay = 0, loop = true } = opt;
  const frozen = useContext(Freeze);
  useEffect(() => {
    if (!name || frozen) return;
    v.setValue(0);
    const run = Animated.timing(v, { toValue: 1, duration: dur * 1000, easing: Easing.linear, useNativeDriver: native });
    const anim = loop ? Animated.loop(run) : run;
    const seq = delay ? Animated.sequence([Animated.delay(delay * 1000), anim]) : anim;
    seq.start();
    return () => seq.stop();
  }, [v, name, dur, delay, loop, frozen]);
  if (!name) return {};
  const kf: KF = opt.vars ? K[name].map(([t, p]) => [t, { ...p, ...(t === 1 && opt.vars ? opt.vars : {}) }]) : K[name];
  const ez = opt.easing ?? Easing.inOut(Easing.ease);
  const it = (k: keyof P) => { const t = track(kf, k); return t ? v.interpolate({ ...t, easing: ez }) : null; };
  const tf: any[] = [];
  const x = it('x'), y = it('y'), s = it('s'), sx = it('sx'), sy = it('sy'), r = it('r'), o = it('o');
  if (x) tf.push({ translateX: x }); if (y) tf.push({ translateY: y });
  if (r) tf.push({ rotate: r.interpolate({ inputRange: [-1000, 1000], outputRange: ['-1000deg', '1000deg'] }) });
  if (s) tf.push({ scale: s }); if (sx) tf.push({ scaleX: sx }); if (sy) tf.push({ scaleY: sy });
  const st: any = {};
  if (tf.length) st.transform = tf;
  if (o) st.opacity = o;
  return st;
}

export function Anim({ name, dur, delay, loop, easing, vars, style, children, pointerEvents }: {
  name: AnimName | null; dur: number; delay?: number; loop?: boolean; easing?: (t: number) => number; vars?: P;
  style?: StyleProp<ViewStyle>; children?: React.ReactNode; pointerEvents?: 'none' | 'auto' | 'box-none';
}) {
  const a = useAnim(name, dur, { delay, loop, easing, vars });
  return <Animated.View pointerEvents={pointerEvents} style={[style, a]}>{children}</Animated.View>;
}

export const EZ = { out: Easing.out(Easing.ease), in: Easing.in(Easing.ease), linear: Easing.linear, inOut: Easing.inOut(Easing.ease) };
export { DEF };
