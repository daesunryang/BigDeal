import React, { useId, useMemo } from 'react';
import { Platform } from 'react-native';
import Svg, { Defs, Ellipse, G, Image as SvgImage, Mask } from 'react-native-svg';
import { paletteOf } from '../stage/pixelCat';
import { spotsOf } from '../spots';
import { spotSeed, useApp } from '../store';
import { CUTOUT } from './kit';

// 그림의 밝기가 아니라 투명도로 자른다 (웹은 react-native-web이 maskType을 넘기지 않아 DOM에 직접 mask-type을 단다)
const ALPHA: any = Platform.OS === 'web' ? { forwardedRef: (el: any) => el?.setAttribute?.('mask-type', 'alpha') } : { maskType: 'alpha' };

// 배경을 지운 고양이 그림(CUTOUT) 위에 얼룩을 덧그린다. 그림의 투명한 부분은 마스크로 가려서 얼룩이 고양이 밖으로 나가지 않는다.
// 그림과 같은 자리 · 같은 크기(w × h)에 겹쳐 놓는다.
export function CatSpots({ id, w, h, opacity = 0.78 }: { id: string; w: number; h: number; opacity?: number }) {
  const seed = useApp(s => spotSeed(s, id));
  const sp = useMemo(() => spotsOf(seed, paletteOf(id).B), [seed, id]);
  const mid = 'spm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!CUTOUT[id] || !w || !h) return null;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <Mask id={mid} {...ALPHA} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
          <SvgImage href={CUTOUT[id]} x={0} y={0} width={w} height={h} preserveAspectRatio="none" />
        </Mask>
      </Defs>
      <G mask={`url(#${mid})`} opacity={opacity}>
        {sp.blobs.map(([cx, cy, rx, ry, deg], i) => (
          <Ellipse key={i} cx={cx * w} cy={cy * h} rx={rx * w} ry={ry * h} fill={sp.color} transform={`rotate(${deg} ${cx * w} ${cy * h})`} />
        ))}
      </G>
    </Svg>
  );
}
