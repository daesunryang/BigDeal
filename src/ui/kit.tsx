import React from 'react';
import { Image, Pressable, PressableProps, StyleProp, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';
import { Cat, Fill, IMG_H, IMG_W, WIN } from '../data';
import { tr } from '../i18n';
import { useApp } from '../store';
import { FONT, useC } from '../theme';

export const CATS_IMG = require('../../assets/img/cats-all.jpg');
export const CUTOUT: Record<string, number> = {
  cheese: require('../../assets/img/cat-cheese.png'), blue: require('../../assets/img/cat-blue.png'), calico: require('../../assets/img/cat-calico.png'), tux: require('../../assets/img/cat-tux.png'),
  ragdoll: require('../../assets/img/cat-ragdoll.png'), siam: require('../../assets/img/cat-siam.png'), persian: require('../../assets/img/cat-persian.png'), angora: require('../../assets/img/cat-angora.png'),
};

// 글자. 문자열 자식은 선택한 언어로 바꾸고, 큰 글씨 설정이면 10% 키운다.
export function Txt({ style, jua, children, ...rest }: TextProps & { jua?: boolean; style?: StyleProp<TextStyle> }) {
  const C = useC();
  const lang = useApp(s => s.lang), big = useApp(s => s.big);
  const flat: TextStyle = Object.assign({}, ...(Array.isArray(style) ? style.flat(4) : [style]).filter(Boolean));
  const fs = (flat.fontSize ?? 14) * (big ? 1.1 : 1);
  const lh = flat.lineHeight ? flat.lineHeight * (big ? 1.1 : 1) : undefined;
  const kids = typeof children === 'string' ? tr(children, lang) : children;
  return <Text {...rest} style={[{ color: C.ink, fontFamily: jua ? FONT.jua : FONT.body }, flat, { fontSize: fs, lineHeight: lh }]}>{kids}</Text>;
}

// 눌렀을 때 살짝 작아지는 버튼
export function Btn({ style, children, onPress, disabled, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  return (
    <Pressable {...rest} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [{ alignItems: 'center', justifyContent: 'center' }, style as any, pressed && onPress ? { transform: [{ scale: 0.98 }], opacity: 0.92 } : null]}>
      {children as any}
    </Pressable>
  );
}

export function Toggle({ on, w = 44, h = 26 }: { on: boolean; w?: number; h?: number }) {
  const C = useC();
  const k = h - 9;
  return (
    <View style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: on ? '#8DBF93' : C.line, borderWidth: 1.5, borderColor: C.ink }}>
      <View style={{ position: 'absolute', top: 3 - 1.5, left: (on ? w - k - 6 : 3) - 1.5, width: k, height: k, borderRadius: k / 2, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink }} />
    </View>
  );
}

// 세그먼트(탭) 컨트롤: 회색 바탕 위 선택 칸만 밝게
export function Seg<T extends string>({ items, value, onPick, h = 34, jua = true, fs = 14 }: { items: [T, string][]; value: T; onPick: (k: T) => void; h?: number; jua?: boolean; fs?: number }) {
  const C = useC();
  return (
    <View style={{ flexDirection: 'row', gap: 2, padding: 3, borderRadius: 14, backgroundColor: C.line }}>
      {items.map(([k, label]) => (
        <Btn key={k} onPress={() => onPick(k)} style={{ flex: 1, height: h, borderRadius: 11, backgroundColor: value === k ? C.bg : 'transparent' }}>
          <Txt jua={jua} style={{ fontSize: fs }}>{label}</Txt>
        </Btn>
      ))}
    </View>
  );
}

export function Chip({ label, on, onPress, h = 30, fs = 13, jua, style }: { label: string; on: boolean; onPress: () => void; h?: number; fs?: number; jua?: boolean; style?: StyleProp<ViewStyle> }) {
  const C = useC();
  return (
    <Btn onPress={onPress} style={[{ height: h, paddingHorizontal: 12, borderRadius: h / 2, borderWidth: 1.5, borderColor: C.ink, backgroundColor: on ? C.ink : C.bg }, style]}>
      <Txt jua={jua} style={{ fontSize: fs, color: on ? C.bg : C.ink }}>{label}</Txt>
    </Btn>
  );
}

// 큰 버튼 (진한 배경)
export function Primary({ label, onPress, h = 52, bg, fs = 17, style, fg }: { label: string; onPress?: () => void; h?: number; bg?: string; fs?: number; style?: StyleProp<ViewStyle>; fg?: string }) {
  const C = useC();
  return (
    <Btn onPress={onPress} style={[{ height: h, borderRadius: h / 2, backgroundColor: bg ?? C.ink }, style]}>
      <Txt jua style={{ fontSize: fs, color: fg ?? C.bg }}>{label}</Txt>
    </Btn>
  );
}
export function Ghost({ label, onPress, h = 46, fs = 15, style, bg }: { label: string; onPress?: () => void; h?: number; fs?: number; style?: StyleProp<ViewStyle>; bg?: string }) {
  const C = useC();
  return (
    <Btn onPress={onPress} style={[{ height: h, borderRadius: h / 2, borderWidth: 1.5, borderColor: C.ink, backgroundColor: bg ?? C.bg }, style]}>
      <Txt jua style={{ fontSize: fs }}>{label}</Txt>
    </Btn>
  );
}

export function ChuruBadge({ n, small }: { n: number; small?: boolean }) {
  const C = useC();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: small ? 5 : 6, paddingHorizontal: small ? 10 : 12, borderRadius: 16, backgroundColor: C.chip1, borderWidth: 1.5, borderColor: C.ink }}>
      <View style={{ width: 10, height: 10, transform: [{ rotate: '45deg' }], backgroundColor: '#E59A4C', borderWidth: 1.5, borderColor: C.ink }} />
      <Txt jua style={{ fontSize: small ? 13 : 15 }}>{n + ' 츄르'}</Txt>
    </View>
  );
}

// 화면 상단 제목줄 (뒤로가기 화살표 선택)
export function Header({ title, onBack, right, size = 24 }: { title: string; onBack?: () => void; right?: React.ReactNode; size?: number }) {
  return (
    <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 1 }}>
        {onBack && <Btn onPress={onBack} style={{ width: 36, height: 40 }}><Txt style={{ fontSize: 26 }}>‹</Txt></Btn>}
        <Txt jua style={{ fontSize: onBack && size === 24 ? 21 : size }} numberOfLines={1}>{title}</Txt>
      </View>
      {right}
    </View>
  );
}

// cats-all.jpg에서 고양이 얼굴을 원형으로 잘라 보여준다 (프로토타입의 crop()).
export function CatFace({ cat, size, border = 2, round = true, style, dim, bg, shade }: { cat: Cat; size: number; border?: number; round?: boolean; style?: StyleProp<ViewStyle>; dim?: number; bg?: string; shade?: number }) {
  const C = useC();
  const s = size / WIN;
  return (
    <View style={[{ width: size, height: size, borderRadius: round ? size / 2 : 14, overflow: 'hidden', borderWidth: border, borderColor: C.ink, backgroundColor: bg ?? C.bg }, style]}>
      <Image source={CATS_IMG} style={{ position: 'absolute', width: IMG_W * s, height: IMG_H * s, left: size / 2 - cat.c[0] * s - border, top: size / 2 - cat.c[1] * s - border, opacity: dim ?? 1 }} />
      {!!shade && <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: `rgba(0,0,0,${shade})` }} />}
    </View>
  );
}

// cats-all.jpg는 2열×4행 장면. 한 칸을 그대로 보여준다 (background-size 200% 400%).
export function CatScene({ cat, width, style }: { cat: Cat; width: number; style?: StyleProp<ViewStyle> }) {
  const C = useC();
  const h = width * 768 / 1376;
  return (
    <View style={[{ width, height: h, overflow: 'hidden', borderWidth: 2, borderColor: C.ink }, style]}>
      <Image source={CATS_IMG} style={{ position: 'absolute', width: width * 2, height: h * 4, left: -cat.room[0] * width - 2, top: -cat.room[1] * h - 2 }} />
    </View>
  );
}

// CSS 배경 무늬(줄무늬·도트·체크·격자)를 SVG 패턴으로
export function FillView({ fill, style, radius = 0 }: { fill: Fill | string; style?: StyleProp<ViewStyle>; radius?: number }) {
  const f: Fill = typeof fill === 'string' ? { t: 'solid', c: fill } : fill;
  const id = React.useMemo(() => 'p' + Math.random().toString(36).slice(2, 10), []);
  if (f.t === 'solid') return <View style={[{ backgroundColor: f.c, borderRadius: radius, overflow: 'hidden' }, style]} />;
  let pat: React.ReactNode = null, bg = 'transparent';
  if (f.t === 'stripesV' || f.t === 'stripesH') {
    const w = f.wa + f.wb, v = f.t === 'stripesV';
    pat = <Pattern id={id} patternUnits="userSpaceOnUse" width={v ? w : 10} height={v ? 10 : w}>
      <Rect x={0} y={0} width={v ? f.wa : 10} height={v ? 10 : f.wa} fill={f.a} />
      <Rect x={v ? f.wa : 0} y={v ? 0 : f.wa} width={v ? f.wb : 10} height={v ? 10 : f.wb} fill={f.b} />
    </Pattern>;
  } else if (f.t === 'dots') {
    const gy = f.gy ?? f.gx; bg = f.bg;
    pat = <Pattern id={id} patternUnits="userSpaceOnUse" width={f.gx} height={gy}><Circle cx={f.gx / 2} cy={gy / 2} r={f.r} fill={f.c} /></Pattern>;
  } else if (f.t === 'check') {
    bg = f.bg; const h = f.size / 2;
    pat = <Pattern id={id} patternUnits="userSpaceOnUse" width={f.size} height={f.size}><Rect x={0} y={0} width={h} height={f.size} fill={f.c} /><Rect x={0} y={0} width={f.size} height={h} fill={f.c} /></Pattern>;
  } else if (f.t === 'grid') {
    bg = f.bg;
    pat = <Pattern id={id} patternUnits="userSpaceOnUse" width={f.size} height={f.size}><Rect x={0} y={0} width={f.w} height={f.size} fill={f.c} /><Rect x={0} y={0} width={f.size} height={f.w} fill={f.c} /></Pattern>;
  } else if (f.t === 'diag') {
    const w = f.wa + f.wb;
    pat = <Pattern id={id} patternUnits="userSpaceOnUse" width={w} height={w} patternTransform={`rotate(${f.angle})`}>
      <Rect x={0} y={0} width={f.wa} height={w} fill={f.a} /><Rect x={f.wa} y={0} width={f.wb} height={w} fill={f.b} />
    </Pattern>;
  }
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: bg }, style]}>
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}><Defs>{pat}</Defs><Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} /></Svg>
    </View>
  );
}

// 사진 자리 (프로토타입의 <image-slot>). 실제 사진이 정해지면 Image로 바꾼다.
export function PhotoSlot({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  const C = useC();
  return (
    <View style={[{ overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
      <FillView fill={{ t: 'diag', a: C.card, b: C.sand2, wa: 8, wb: 8, angle: 45 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Txt style={{ fontSize: 12, color: C.sub }}>{label}</Txt>
    </View>
  );
}

export function Divider() { const C = useC(); return <View style={{ height: 1, backgroundColor: C.line }} />; }

// 메뉴형 목록 카드
export function ListCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const C = useC();
  const kids = React.Children.toArray(children).filter(Boolean);
  return <View style={[{ borderRadius: 18, backgroundColor: C.card, overflow: 'hidden' }, style]}>{kids.map((k, i) => <View key={i} style={i ? { borderTopWidth: 1, borderTopColor: C.line } : null}>{k}</View>)}</View>;
}

export function ToggleRow({ label, desc, on, onPress }: { label: string; desc?: string; on: boolean; onPress: () => void }) {
  const C = useC(); const cb = useApp(s => s.cb);
  return (
    <Btn onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58, paddingVertical: 6, paddingHorizontal: 14, justifyContent: 'flex-start' }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt style={{ fontSize: 15 }}>{label}</Txt>
        {!!desc && <Txt style={{ fontSize: 11, color: C.sub, lineHeight: 15 }}>{desc}</Txt>}
      </View>
      {cb && <Txt style={{ fontSize: 12, color: C.sub }}>{on ? '켜짐' : '꺼짐'}</Txt>}
      <Toggle on={on} />
    </Btn>
  );
}

export function Bar({ pct, h = 10, color = '#E59A4C', bg }: { pct: number; h?: number; color?: string; bg?: string }) {
  const C = useC();
  return <View style={{ height: h, borderRadius: h / 2, backgroundColor: bg ?? C.card, overflow: 'hidden' }}><View style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }} /></View>;
}

export function Hearts({ n, size = 20 }: { n: number; size?: number }) {
  const C = useC(); const cb = useApp(s => s.cb);
  return <View style={{ flexDirection: 'row', gap: 2 }}>{[0, 1, 2, 3, 4].map(i => <Text key={i} style={{ fontSize: size, lineHeight: size * 1.1, color: i < n ? '#E07F7F' : C.line }}>{cb && i >= n ? '♡' : '♥'}</Text>)}</View>;
}
