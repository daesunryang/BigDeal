import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { runsOf } from '../stage/pixelCat';

// 도트 고양이 한 장. 일러스트가 아직 없는 뽑기 고양이의 초상·방 안 모습에 쓴다.
// 그림이 차지하는 영역에 딱 맞게 잘라(fit) 주어진 크기 안에 가운데 맞춰 그린다.
export function PixelCat({ id, frame = 'sit', width, height, dark = false, opacity = 1 }: { id: string; frame?: string; width: number; height: number; dark?: boolean; opacity?: number }) {
  const runs = runsOf(frame, id);
  const box = useMemo(() => {
    let x0 = 99, y0 = 99, x1 = 0, y1 = 0;
    for (const [x, y, n] of runs) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + n); y1 = Math.max(y1, y + 1); }
    return { x0, y0, w: x1 - x0, h: y1 - y0 };
  }, [runs]);
  return (
    <Svg width={width} height={height} viewBox={`${box.x0} ${box.y0} ${box.w} ${box.h}`} opacity={opacity}>
      {runs.map(([x, y, n, c], i) => <Rect key={i} x={x} y={y} width={n + 0.02} height={1.02} fill={dark ? '#4A3428' : c} />)}
    </Svg>
  );
}
