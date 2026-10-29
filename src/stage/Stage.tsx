import React, { useState } from 'react';
import { Image, PanResponder, Pressable, View } from 'react-native';
import { BehId, Cat, FLOOR, Fill, WALL } from '../data';
import { growth } from '../derive';
import { getS, useApp } from '../store';
import { Anim, AnimName, EZ } from '../ui/anim';
import { CUTOUT, FillView, Txt } from '../ui/kit';
import { Dims, INK, Sh } from './Shape';

const ROPE: Fill = { t: 'stripesH', a: '#D9B98C', b: '#C29D6E', wa: 4, wb: 2 };
const B = 2;
// 잘라낸 고양이 그림 크기 (contain + 아래 정렬 계산용)
const CUT_DIM: Record<string, [number, number]> = { angora: [547, 574], blue: [565, 564], calico: [571, 544], cheese: [598, 550], persian: [599, 495], ragdoll: [627, 592], siam: [492, 604], tux: [544, 523] };

type Box = { l?: number; r?: number; t?: number; b?: number; w: number; h?: number; ar?: number };
type Outer = { bg?: string | Fill; bd?: number; rad?: any; ell?: boolean; poly?: [number, number][] };
type Spec = { box: Box; outer?: Outer; inner?: (d: Dims) => React.ReactNode };

const ITEMS: Record<string, Spec> = {
  frame: { box: { l: 8, t: 12, w: 16, h: 22 }, outer: { bg: '#F6CFD6', bd: 3 }, inner: d => <Sh p={d} l={36} t={20} w={28} h={56} ell bg="#6FA56B" /> },
  lamp: { box: { l: 41, t: 0, w: 13, h: 18 }, inner: d => <>
    <Sh p={d} l={46} t={0} w={(2 / d[0]) * 100} h={64} bg={INK} />
    <Sh p={d} l={0} b={0} w={100} h={40} bg="#F2C46B" bd={B} rad={[999, 999, 0, 0]} /></> },
  hammock: { box: { r: 10, t: 45, w: 26, h: 9 }, outer: { bg: '#E59A4C', bd: B, rad: [0, 0, 999, 999] } },
  tower: { box: { l: 3, b: 8, w: 16, h: 54 }, inner: d => <>
    <Sh p={d} l={40} t={8} w={20} h={92} bg={ROPE} bd={B} />
    <Sh p={d} l={0} t={4} w={100} h={10} bg="#B8A2D9" bd={B} rad={6} />
    <Sh p={d} l={0} t={46} w={100} h={10} bg="#B8A2D9" bd={B} rad={6} />
    <Sh p={d} l={-10} b={0} w={120} h={9} bg="#B8A2D9" bd={B} rad={6} /></> },
  scratch: { box: { l: 19, b: 8, w: 13, h: 32 }, inner: d => <>
    <Sh p={d} l={23} t={0} w={54} h={90} bg={ROPE} bd={B} />
    <Sh p={d} l={0} b={0} w={100} h={14} bg="#8A6244" bd={B} rad={4} /></> },
  plant: { box: { r: 3, b: 16, w: 16, h: 22 }, inner: d => <>
    <Sh p={d} r={25} b={0} w={62} h={55} bg="#D98762" bd={B} rad={[2, 2, 6, 6]} />
    <Sh p={d} r={6} t={4} w={44} ar={1} bg="#6FA56B" bd={B} rad="pill" />
    <Sh p={d} l={2} t={0} w={44} ar={1} bg="#6FA56B" bd={B} rad="pill" /></> },
  rug: { box: { l: 22, b: 3, w: 56, h: 17 }, outer: { ell: true, bg: '#A9CFA0', bd: B }, inner: d => <Sh p={d} l={12} t={18} w={76} h={64} ell bd={2} bdc="#CFE6C6" bg="transparent" /> },
  sofa: { box: { l: 8, b: 6, w: 36, h: 17 }, outer: { bg: '#B5714F', bd: B, rad: [14, 14, 5, 5] }, inner: d => <Sh p={d} l={6} t={-22} w={88} h={34} bg="#C98562" bd={B} rad={[10, 10, 0, 0]} /> },
  tv: { box: { r: 6, b: 30, w: 24, h: 16 }, outer: { bg: '#2B221D', bd: B, rad: 4 }, inner: d => <Sh p={d} l={8} t={12} w={84} h={76} bg="#7E9CC8" rad={2} /> },
  tunnel: { box: { l: 6, b: 6, w: 34, h: 18 }, outer: { bg: { t: 'stripesV', a: '#C29D6E', b: '#B38A5C', wa: 8, wb: 2 }, bd: B, rad: [60, 60, 6, 6] } },
  ballpit: { box: { r: 8, b: 5, w: 30, h: 14 }, outer: { bg: { t: 'dots', c: '#F2B8B5', bg: '#9DB6DA', r: 4, gx: 14 }, bd: B, rad: 8 } },
  bed: { box: { l: 26, b: 5, w: 44, h: 11 }, outer: { bg: '#F2B8B5', bd: B, rad: 16 }, inner: d => <Sh p={d} l={6} t={14} w={26} h={60} bg="#FBF6EE" bd={B} rad={8} /> },
  nightlight: { box: { l: 12, b: 30, w: 7, ar: 1 }, outer: { bg: '#F2C46B', bd: B, rad: 'pill' } },
  bowl: { box: { l: 20, b: 4, w: 14, h: 7 }, outer: { bg: '#7E9CC8', bd: B, rad: [0, 0, 999, 999] } },
  table: { box: { r: 6, b: 6, w: 30, h: 20 }, outer: { bg: '#D9B98C', bd: B, rad: 6 } },
  flowers: { box: { l: 4, b: 3, w: 92, h: 9 }, outer: { bg: { t: 'dots', c: '#F2B8B5', bg: 'transparent', r: 5, gx: 22, gy: 18 } } },
  tree: { box: { r: 4, b: 6, w: 20, h: 56 }, inner: d => <>
    <Sh p={d} l={38} b={0} w={24} h={46} bg="#8A6244" bd={B} />
    <Sh p={d} l={0} t={0} w={100} h={66} ell bg="#6FA56B" bd={B} /></> },
  trunk: { box: { l: 8, b: 6, w: 22, h: 16 }, outer: { bg: '#8A6244', bd: B, rad: 5 } },
  telescope: { box: { r: 12, b: 6, w: 6, h: 44 }, inner: d => <>
    <Sh p={d} l={30} t={30} w={40} h={70} bg={INK} />
    <View style={{ position: 'absolute', left: -0.8 * d[0], top: 0, width: 2.6 * d[0], height: 0.22 * d[1], backgroundColor: '#B8A2D9', borderWidth: B, borderColor: INK, borderRadius: 4, transform: [{ rotate: '-28deg' }] }} /></> },
  desk: { box: { l: 6, b: 6, w: 38, h: 20 }, outer: { bg: '#8A6244', bd: B, rad: [6, 6, 0, 0] }, inner: d => <Sh p={d} l={10} t={-34} w={30} h={38} bg="#FBF6EE" bd={B} rad={3} /> },
  books: { box: { r: 8, b: 6, w: 16, h: 14 }, outer: { bg: '#B8A2D9', bd: B, rad: 3 }, inner: d => <Sh p={d} l={10} t={-60} w={80} h={55} bg="#E59A4C" bd={B} rad={3} /> },
  bookshelf: { box: { l: 6, b: 30, w: 28, h: 38 }, outer: { bg: '#8A6244', bd: B, rad: 3 }, inner: d => <>
    <Sh p={d} l={8} t={14} w={84} h={20} bg="#B8A2D9" /><Sh p={d} l={8} t={50} w={84} h={20} bg="#E59A4C" /></> },
  fireplace: { box: { r: 8, b: 28, w: 22, h: 24 }, outer: { bg: '#B5714F', bd: B, rad: [6, 6, 0, 0] }, inner: d => <>
    <Sh p={d} l={22} t={30} w={56} h={70} bg="#2B221D" /><Sh p={d} l={36} t={56} w={28} h={38} bg="#E59A4C" rad={[999, 999, 0, 0]} /></> },
  seesaw: { box: { l: 34, b: 5, w: 34, h: 12 }, inner: d => <>
    <View style={{ position: 'absolute', left: 0, top: 0.2 * d[1], width: d[0], height: 0.28 * d[1], backgroundColor: '#E59A4C', borderWidth: B, borderColor: INK, borderRadius: 6, transform: [{ rotate: '-8deg' }] }} />
    <Sh p={d} l={40} t={46} w={20} h={54} poly={[[0.5, 0], [1, 1], [0, 1]]} bg="#D9B98C" /></> },
  slide: { box: { r: 6, b: 6, w: 24, h: 36 }, inner: d => <>
    <Sh p={d} l={60} t={0} w={40} h={100} bg="#D9B98C" bd={B} rad={3} />
    <Sh p={d} l={0} t={8} w={70} h={92} poly={[[0, 0], [0.4, 0], [1, 1], [0.6, 1]]} bg="#7E9CC8" bd={B} /></> },
  blanket: { box: { l: 18, b: 4, w: 46, h: 9 }, outer: { bg: { t: 'stripesV', a: '#B8A2D9', b: '#CDBBE6', wa: 10, wb: 10 }, bd: B, rad: 8 } },
  curtain: { box: { l: 8, t: 8, w: 14, h: 46 }, outer: { bg: '#F2B8B5', bd: B, rad: [2, 2, 14, 14] } },
  fridge: { box: { l: 6, b: 6, w: 18, h: 46 }, outer: { bg: '#DCE8F3', bd: B, rad: 5 }, inner: d => <>
    <Sh p={d} l={0} t={38} w={100} h={(2 / d[1]) * 100} bg={INK} /><Sh p={d} r={12} t={10} w={8} h={18} bg={INK} /></> },
  fishbowl: { box: { r: 8, b: 6, w: 14, ar: 1 }, outer: { bg: '#9DB6DA', bd: B, rad: 'pill' }, inner: d => <Sh p={d} l={30} t={38} w={40} h={24} ell bg="#E59A4C" /> },
  fence: { box: { l: 0, b: 30, w: 100, h: 12 }, inner: d => <>
    <FillView fill={{ t: 'stripesV', a: '#D9B98C', b: 'transparent', wa: 10, wb: 6 }} style={{ position: 'absolute', left: 0, top: 0, width: d[0], height: d[1] }} />
    <View style={{ position: 'absolute', left: 0, top: 0, width: d[0], height: B, backgroundColor: INK }} /><View style={{ position: 'absolute', left: 0, bottom: 0, width: d[0], height: B, backgroundColor: INK }} /></> },
  pond: { box: { l: 10, b: 6, w: 38, h: 16 }, outer: { ell: true, bg: '#7E9CC8', bd: B }, inner: d => <Sh p={d} l={30} t={30} w={20} h={30} ell bg="#A9CFA0" /> },
  globe: { box: { r: 8, b: 6, w: 14, h: 26 }, inner: d => <>
    <Sh p={d} l={45} t={60} w={10} h={40} bg={INK} /><Sh p={d} l={0} t={0} w={100} ar={1} bg="#7E9CC8" bd={B} rad="pill" /></> },
  lantern: { box: { l: 10, b: 6, w: 8, h: 16 }, outer: { bg: '#F2C46B', bd: B, rad: 4 } },
  standlamp: { box: { l: 6, b: 6, w: 8, h: 48 }, inner: d => <>
    <Sh p={d} l={42} t={20} w={16} h={80} bg={INK} /><Sh p={d} l={-20} t={0} w={140} h={28} bg="#F2C46B" bd={B} rad={[8, 8, 2, 2]} /></> },
  cabinet: { box: { r: 6, b: 6, w: 26, h: 22 }, outer: { bg: '#8A6244', bd: B, rad: 3 }, inner: d => <>
    <Sh p={d} l={8} t={14} w={84} h={30} bg="#A87D58" bd={B} /><Sh p={d} l={8} t={56} w={84} h={30} bg="#A87D58" bd={B} /></> },
  leaves: { box: { l: 6, b: 2, w: 22, h: 9 }, outer: { ell: true, bg: '#D98762', bd: B } },
  ghost: { box: { l: 28, t: 2, w: 44, h: 8 }, outer: { bg: { t: 'stripesV', a: '#E2D4F0', b: 'transparent', wa: 14, wb: 12 }, bd: B, rad: [0, 0, 10, 10] } },
  pumpkin: { box: { r: 27, b: 4, w: 11, ar: 1 }, outer: { bg: '#E59A4C', bd: B, rad: 'pill' }, inner: d => <Sh p={d} l={38} t={-14} w={20} h={26} bg="#6FA56B" bd={B} /> },
  cushion: { box: { r: 6, b: 5, w: 20, h: 10 }, outer: { bg: '#F2B8B5', bd: B, rad: 'pill' } },
  yarn: { box: { l: 30, b: 4, w: 8, ar: 1 }, outer: { bg: { t: 'diag', a: '#7E9CC8', b: '#9DB6DA', wa: 3, wb: 3, angle: 45 }, bd: B, rad: 'pill' } },
};
// 그리는 순서 (뒤 → 앞). 고양이 뒤에 오는 것과 앞에 오는 것을 나눈다.
const BEHIND = ['frame', 'lamp', 'hammock', 'tower', 'scratch', 'plant', 'rug', 'sofa', 'tv', 'tunnel', 'ballpit', 'bed', 'nightlight', 'bowl', 'table', 'flowers', 'tree', 'trunk', 'telescope', 'desk', 'books', 'bookshelf', 'fireplace', 'seesaw', 'slide', 'blanket', 'curtain', 'fridge', 'fishbowl', 'fence', 'pond', 'globe', 'lantern', 'standlamp', 'cabinet'];
const FRONT = ['leaves', 'ghost', 'pumpkin', 'cushion', 'yarn'];

function boxPx(b: Box, [pw, ph]: Dims) {
  const W = (b.w * pw) / 100, H = b.ar ? W / b.ar : ((b.h ?? 0) * ph) / 100;
  return { left: b.l != null ? (b.l * pw) / 100 : pw - ((b.r ?? 0) * pw) / 100 - W, top: b.t != null ? (b.t * ph) / 100 : ph - ((b.b ?? 0) * ph) / 100 - H, width: W, height: H };
}

function Item({ id, dims, sc, drag, off }: { id: string; dims: Dims; sc: number; drag: boolean; off: [number, number] }) {
  const sp = ITEMS[id]; const sel = useApp(s => s.dragSel === id);
  // 끌기 시작 위치는 PanResponder 안에만 두는 값이라 상태로 두지 않는다
  const [pr] = useState(() => { const p0: { current: [number, number] } = { current: [0, 0] }; return PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { p0.current = (getS().pos[id] || [0, 0]) as [number, number]; getS().set({ dragSel: id }); },
    onPanResponderMove: (_, g) => { const cl = (v: number) => Math.max(-300, Math.min(300, v)); getS().set(st => ({ pos: { ...st.pos, [id]: [cl(p0.current[0] + g.dx / sc), cl(p0.current[1] + g.dy / sc)] } })); },
    onPanResponderRelease: () => getS().set({ dragSel: null }), onPanResponderTerminate: () => getS().set({ dragSel: null }),
  }); });
  const bx = boxPx(sp.box, dims), d: Dims = [bx.width, bx.height], o = sp.outer;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width: dims[0], height: dims[1], zIndex: sel ? 5 : undefined, transform: [{ translateX: off[0] * sc }, { translateY: off[1] * sc }] }}>
      <View {...(drag ? pr.panHandlers : {})} pointerEvents={drag ? 'auto' : 'none'} style={{ position: 'absolute', ...bx }}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: d[0], height: d[1] }} pointerEvents="none">
          {o && <Sh p={d} l={0} t={0} w={100} h={100} bg={o.bg} bd={o.bd} rad={o.rad} ell={o.ell} poly={o.poly} kids={sp.inner} />}
          {!o && sp.inner?.(d)}
        </View>
        {drag && sel && <View pointerEvents="none" style={{ position: 'absolute', left: -5, top: -5, right: -5, bottom: -5, borderWidth: 2, borderStyle: 'dashed', borderColor: '#E59A4C', borderRadius: 4 }} />}
      </View>
    </View>
  );
}

const BEH_ANIM: Record<string, [AnimName, number, ((t: number) => number)?]> = {
  idle: ['bob', 3], nap: ['nap', 3.6], meow: ['meow', 2.4, EZ.out], stretch: ['stretch', 2.6], look: ['sway', 2], hop: ['hop', 0.9, EZ.out], purr: ['purr', 0.14, EZ.linear], sulky: ['nap', 5], sing: ['meow', 0.7],
};

export function Outfit({ o, cid, d }: { o: string; cid: string; d: Dims }) {
  const P = ({ cheese: { cx: 42, nk: 62 }, blue: { cx: 46, nk: 64 }, calico: { cx: 44, nk: 60 }, tux: { cx: 46, nk: 66 } } as Record<string, { cx: number; nk: number }>)[cid] || { cx: 44, nk: 62 };
  if (o === 'scarf') return <Sh p={d} l={P.cx - 19} t={P.nk} w={38} h={7} bg="#D9604E" bd={B} rad={6} />;
  if (o === 'bow') return <Sh p={d} l={P.cx + 13} t={24} w={15} h={10} ell bg="#F2B8B5" bd={B} />;
  if (o === 'hat') return <Sh p={d} l={P.cx - 11} t={-4} w={22} h={22} poly={[[0.5, 0], [1, 1], [0, 1]]} bg="#B8A2D9" />;
  if (o === 'witch') return <Sh p={d} l={P.cx - 19} t={-8} w={38} h={26} poly={[[0.5, 0], [0.7, 0.62], [1, 0.74], [1, 1], [0, 1], [0, 0.74], [0.3, 0.62]]} bg="#2B221D" />;
  return null;
}

function Fx({ ch, style, anim, dur, delay = 0, vars, color = INK, size }: { ch: string; style: any; anim: AnimName; dur: number; delay?: number; vars?: any; color?: string; size: number }) {
  return <Anim name={anim} dur={dur} delay={delay} vars={vars} easing={EZ.out} pointerEvents="none" style={[{ position: 'absolute', opacity: 0 }, style]}>
    <Txt jua style={{ fontSize: size, color }}>{ch}</Txt>
  </Anim>;
}

function CatSprite({ cat, w, H, drag, beh, outfit, onCat }: { cat: Cat; w: number; H: number; drag: boolean; beh: BehId; outfit: string; onCat?: () => void }) {
  const gf = useApp(s => growth(s).f), nextBehavior = useApp(s => s.nextBehavior);
  const size = Math.round(Math.min(w * 0.42, H * 0.62));
  const cw = Math.round(size * 1.1 * gf), chh = Math.round(size * 0.98 * gf), L = Math.round((w - cw) / 2), Bt = Math.round(H * 0.06);
  const fs = Math.max(12, Math.round(w / 24));
  const [iw, ih] = CUT_DIM[cat.id] || [580, 560], k = Math.min(cw / iw, chh / ih), dw = iw * k, dh = ih * k;
  const [an, du, ez] = BEH_ANIM[beh] || BEH_ANIM.idle;
  const body = (
    <Anim name="behin" dur={0.5} loop={false} easing={EZ.out} style={{ position: 'absolute', left: L, top: H - Bt - chh, width: cw, height: chh }}>
      {beh === 'hop' && <View style={{ position: 'absolute', left: '28%', right: '28%', bottom: -4, height: 8, borderRadius: 999, backgroundColor: 'rgba(74,52,40,0.18)' }} />}
      <Anim name={an} dur={du} easing={ez} style={{ position: 'absolute', left: 0, top: 0, width: cw, height: chh, transformOrigin: '50% 100%' } as any}>
        <Image source={CUTOUT[cat.id]} style={{ position: 'absolute', left: (cw - dw) / 2, top: chh - dh, width: dw, height: dh, opacity: beh === 'nap' || beh === 'sulky' ? 0.94 : 1 }} />
        <Outfit o={outfit} cid={cat.id} d={[cw, chh]} />
      </Anim>
      {beh === 'nap' && [0, 1, 2].map(i => <Fx key={'z' + i} ch="z" size={fs + i * 3} anim="zfloat" dur={2.4} delay={i * 0.8} style={{ right: '8%', top: '4%' }} />)}
      {beh === 'meow' && <Anim name="bubblepop" dur={2.4} easing={EZ.out} pointerEvents="none" style={{ position: 'absolute', right: '-6%', top: '-4%', paddingVertical: 4, paddingHorizontal: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomRightRadius: 12, borderBottomLeftRadius: 3, backgroundColor: '#FBF6EE', borderWidth: 1.5, borderColor: INK, transformOrigin: '0% 100%' } as any}>
        <Txt jua style={{ fontSize: fs, color: INK }}>야옹~</Txt></Anim>}
      {beh === 'purr' && ([[-14, 0], [10, 0.5], [-2, 1]] as [number, number][]).map(([dx, dl], i) => <Fx key={'h' + i} ch="♥" size={fs} color="#E07F7F" anim="hfloat" dur={1.8} delay={dl} vars={{ x: dx }} style={{ left: '46%', top: '2%' }} />)}
      {beh === 'look' && <Anim name="bubblepop" dur={2} easing={EZ.out} pointerEvents="none" style={{ position: 'absolute', right: '4%', top: '-2%' }}><Txt jua style={{ fontSize: fs + 4, color: INK }}>?</Txt></Anim>}
      {beh === 'idle' && [0, 1].map(i => <Fx key={'n' + i} ch="♪" size={fs + 2} color="#7E9CC8" anim="note" dur={2.6} delay={i * 1.3} style={{ right: i ? '14%' : '2%', top: '8%' }} />)}
      {beh === 'stretch' && [0, 1].map(i => <Fx key={'s' + i} ch="✦" size={fs + 2} color="#E59A4C" anim="spark" dur={1.6} delay={i * 0.5} style={{ left: i ? '4%' : '82%', top: i ? '30%' : '16%' }} />)}
      {beh === 'hop' && <Fx ch="✦" size={fs + 2} color="#E59A4C" anim="spark" dur={1.2} style={{ left: '8%', top: '6%' }} />}
      {beh === 'sing' && <Anim name="bubblepop" dur={1.6} easing={EZ.out} pointerEvents="none" style={{ position: 'absolute', right: '-10%', top: '-8%', paddingVertical: 4, paddingHorizontal: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomRightRadius: 12, borderBottomLeftRadius: 3, backgroundColor: '#FBF6EE', borderWidth: 1.5, borderColor: INK, transformOrigin: '0% 100%' } as any}>
        <Txt jua style={{ fontSize: fs, color: INK }}>야옹야옹♪</Txt></Anim>}
      {beh === 'sing' && ([[-18, 0, '♪'], [14, 0.5, '♫'], [-4, 1, '♪'], [22, 1.4, '♬']] as [number, number, string][]).map(([dx, dl, n], i) =>
        <Fx key={'sg' + i} ch={n} size={fs + 2} anim="songnote" dur={1.6} delay={dl} vars={{ x: dx }} style={{ left: (20 + i * 16) + '%', top: '6%' }} />)}
    </Anim>
  );
  if (!drag && onCat) return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: H }}>
    {body}
    <Pressable onPress={onCat} accessibilityRole="button" accessibilityLabel={cat.name + ' 노래 듣기'} style={{ position: 'absolute', left: L, top: H - Bt - chh, width: cw, height: chh }} />
  </View>;
  if (!drag) return <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: H }}>{body}</View>;
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: H }}>
    {body}
    <Pressable onPress={nextBehavior} style={{ position: 'absolute', left: L, top: H - Bt - chh, width: cw, height: chh }} />
  </View>;
}

function Win({ struct, w, H }: { struct: string; w: number; H: number }) {
  const W: Record<string, Box & { rad: any }> = {
    basic: { l: 60, t: 8, w: 28, h: 34, rad: 4 }, big: { l: 16, t: 6, w: 68, h: 36, rad: 4 },
    arch: { l: 60, t: 5, w: 26, h: 42, rad: [999, 999, 4, 4] }, attic: { l: 66, t: 9, w: 20, ar: 1, rad: 'pill' },
  };
  const b = W[struct]; if (!b) return null;
  const bx = boxPx(b, [w, H]);
  const R = b.rad === 'pill' ? bx.width / 2 : Array.isArray(b.rad) ? b.rad.map((x: number) => Math.min(x, bx.width / 2)) : b.rad;
  const rs = Array.isArray(R) ? { borderTopLeftRadius: R[0], borderTopRightRadius: R[1], borderBottomRightRadius: R[2], borderBottomLeftRadius: R[3] } : { borderRadius: R };
  const d: Dims = [bx.width - 6, bx.height - 6];
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', ...bx, backgroundColor: '#CFE6F3', borderWidth: 3, borderColor: INK, overflow: 'hidden' }, rs]}>
      <Sh p={d} r={14} t={12} w={24} ar={1} bg="#F7E08A" rad="pill" />
      <View style={{ position: 'absolute', left: d[0] / 2 - 1.5, top: 0, bottom: 0, width: 3, backgroundColor: INK }} />
      <View style={{ position: 'absolute', top: d[1] / 2 - 1.5, left: 0, right: 0, height: 3, backgroundColor: INK }} />
    </View>
  );
}

// 고양이 방 한 장면 (프로토타입 stage(w, H, d, items, cat, drag, pos, showCat))
export function Stage({ w, H, decor, items, cat, drag = false, pos, showCat = true, onCat }: {
  w: number; H: number; decor: { wall: string; floor: string; struct: string; outfit?: string }; items: string[]; cat: Cat; drag?: boolean; pos: Record<string, [number, number]>; showCat?: boolean;
  onCat?: () => void; // 고양이를 누를 때 (홈: 노래). 없으면 방 전체 터치가 그대로 지나간다
}) {
  const beh = useApp(s => s.behavior().id);
  const ft = Math.round(H * 0.64), sc = w / 360, dims: Dims = [w, H];
  const has = (id: string) => items.includes(id);
  const it = (id: string) => has(id) && ITEMS[id] ? <Item key={id} id={id} dims={dims} sc={sc} drag={drag} off={(pos[id] || [0, 0]) as [number, number]} /> : null;
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: H, overflow: 'hidden' }}>
      <FillView fill={WALL[decor.wall] ?? WALL.cream} style={{ position: 'absolute', left: 0, top: 0, width: w, height: ft }} />
      {decor.struct === 'attic' && <>
        <Sh p={dims} l={0} t={0} w={58} h={(ft * 0.6 / H) * 100} poly={[[0, 0], [1, 0], [0, 1]]} bg={INK} />
        <Sh p={dims} l={0} t={0} w={56} h={(ft * 0.57 / H) * 100} poly={[[0, 0], [1, 0], [0, 1]]} bg="#E8D9C2" /></>}
      <View style={{ position: 'absolute', left: 0, top: ft, width: w, height: H - ft, borderTopWidth: 2, borderTopColor: INK, overflow: 'hidden' }}>
        <FillView fill={FLOOR[decor.floor] ?? FLOOR.wood} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      </View>
      {decor.struct !== 'none' && <Win struct={decor.struct} w={w} H={H} />}
      {BEHIND.map(it)}
      {showCat && <CatSprite key={'cat-' + beh} cat={cat} w={w} H={H} drag={drag} beh={beh} outfit={decor.outfit || 'none'} onCat={onCat} />}
      {FRONT.map(it)}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: H }}>
        <FillView fill={{ t: 'diag', a: 'rgba(74,52,40,0.04)', b: 'transparent', wa: 2, wb: 3, angle: 25 }} style={{ width: w, height: H }} />
      </View>
    </View>
  );
}
