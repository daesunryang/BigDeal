import React from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, Polygon } from 'react-native-svg';
import { Fill } from '../data';
import { FillView } from '../ui/kit';

export const INK = '#4A3428';
export type Dims = [number, number];
type Rad = number | [number, number, number, number] | 'pill';

// CSS 절대 위치(% 단위)를 부모 크기 기준 픽셀로 바꿔 그리는 도형.
// ell: 타원, poly: 0~1 좌표 다각형(clip-path 대체), kids: 이 도형 크기를 부모로 받는 자식.
export function Sh({ p, l, r, t, b, w, h, ar, bg, bd = 0, bdc = INK, rad = 0, ell, poly, kids, z, op, children }: {
  p: Dims; l?: number; r?: number; t?: number; b?: number; w: number; h?: number; ar?: number;
  bg?: string | Fill; bd?: number; bdc?: string; rad?: Rad; ell?: boolean; poly?: [number, number][]; kids?: (d: Dims) => React.ReactNode; z?: number; op?: number; children?: React.ReactNode;
}) {
  const [pw, ph] = p;
  const W = (w * pw) / 100, H = ar ? W / ar : ((h ?? 0) * ph) / 100;
  const left = l != null ? (l * pw) / 100 : pw - ((r ?? 0) * pw) / 100 - W;
  const top = t != null ? (t * ph) / 100 : ph - ((b ?? 0) * ph) / 100 - H;
  const base = { position: 'absolute' as const, left, top, width: W, height: H, zIndex: z, opacity: op };
  if (ell || poly) {
    const color = typeof bg === 'string' ? bg : 'transparent';
    return (
      <View style={base} pointerEvents="none">
        <Svg width={W} height={H}>
          {ell ? <Ellipse cx={W / 2} cy={H / 2} rx={Math.max(0, W / 2 - bd / 2)} ry={Math.max(0, H / 2 - bd / 2)} fill={color} stroke={bd ? bdc : 'none'} strokeWidth={bd} />
            : <Polygon points={poly!.map(([x, y]) => `${x * W},${y * H}`).join(' ')} fill={color} stroke={bd ? bdc : 'none'} strokeWidth={bd} />}
        </Svg>
        {kids?.([W, H])}{children}
      </View>
    );
  }
  const R = rad === 'pill' ? Math.min(W, H) / 2 : rad;
  const rs = Array.isArray(R) ? { borderTopLeftRadius: R[0], borderTopRightRadius: R[1], borderBottomRightRadius: R[2], borderBottomLeftRadius: R[3] } : { borderRadius: R };
  const pattern = bg && typeof bg !== 'string';
  return (
    <View pointerEvents="box-none" style={[base, rs, { backgroundColor: typeof bg === 'string' ? bg : undefined, borderWidth: bd, borderColor: bdc, overflow: pattern ? 'hidden' : 'visible' }]}>
      {pattern && <FillView fill={bg as Fill} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />}
      {kids?.([W - bd * 2, H - bd * 2])}{children}
    </View>
  );
}
