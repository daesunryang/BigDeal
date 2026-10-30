import React, { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { FLOOR_FLAT, ROOMS, TOPD, catById } from '../data';
import { State, getS } from '../store';
import { useC } from '../theme';
import { Anim, EZ } from '../ui/anim';
import { CatFace, Txt } from '../ui/kit';

export type HRoom = { id: string; gc: [number, number]; gr: [number, number]; name: string; price: number; locked: boolean; bg: string; deco: [number, number, number, number, string, number | 'round'][]; op: number; cx: number; cy: number };

// 평면도 데이터 (프로토타입 houseData(rows))
export function houseData(s: State, rows: number) {
  const rd = (id: string) => getS().roomData(id);
  const mk = (items: string[], struct: string) => [
    ...(struct === 'none' ? [] : [struct === 'big' ? [16, -4, 68, 8, '#CFE6F3', 3] : [60, -4, 28, 8, '#CFE6F3', 3]]),
    ...items.filter(i => TOPD[i]).map(i => TOPD[i]),
  ] as HRoom['deco'];
  const rooms: HRoom[] = ROOMS.filter(r => !r.ext || s.extra).map(r => {
    const d = rd(r.id), lk = r.price > 0 && !s.rooms.includes(r.id);
    return { id: r.id, gc: r.gc, gr: r.gr, name: s.roomNames[r.id] || r.name, price: r.price, locked: lk, bg: lk ? '#E2DACB' : FLOOR_FLAT[d.decor.floor] || '#E9DFCF', deco: mk(d.equipped, d.decor.struct), op: lk ? 0.35 : 1,
      cx: ((r.gc[0] + r.gc[1] - 2) / 2 / 6) * 100, cy: ((r.gr[0] + r.gr[1] - 2) / 2 / rows) * 100 };
  });
  const here = rooms.find(r => r.id === s.catRoom) || rooms[0];
  return { rooms, here };
}

// 6열 격자 평면도. mini=true면 집중 화면의 작은 지도.
export function FloorPlan({ s, width, rowH, rows, mini, selId, onRoom, overlay, tokenSize }: {
  s: State; width: number; rowH: number; rows: number; mini?: boolean; selId?: string; onRoom?: (id: string) => void; overlay?: React.ReactNode; tokenSize: number;
}) {
  const C = useC();
  const hd = houseData(s, rows), colW = width / 6, H = rowH * rows;
  const cat = catById(s.catId);
  return (
    <View style={{ width, height: H, backgroundColor: '#D9CDB8', overflow: 'hidden' }}>
      {hd.rooms.map(r => {
        const sel = r.id === selId;
        const L = (r.gc[0] - 1) * colW, T = (r.gr[0] - 1) * rowH, W = (r.gc[1] - r.gc[0]) * colW, Hh = (r.gr[1] - r.gr[0]) * rowH;
        return (
          <Pressable key={r.id} disabled={!onRoom} onPress={onRoom ? () => onRoom(r.id) : undefined}
            style={{ position: 'absolute', left: L, top: T, width: W, height: Hh, backgroundColor: r.bg, overflow: 'hidden', zIndex: sel ? 2 : 1 }}>
            {r.deco.map(([l, t, w, h, bg, rad], i) => {
              const pw = (w * W) / 100, ph = (h * Hh) / 100;
              return <View key={i} style={{ position: 'absolute', left: (l * W) / 100, top: (t * Hh) / 100, width: pw, height: ph, backgroundColor: bg, borderRadius: rad === 'round' ? Math.min(pw, ph) / 2 : rad, borderWidth: mini ? 0 : 1.5, borderColor: C.ink, opacity: r.op }} />;
            })}
            {!mini && <View style={{ position: 'absolute', left: 5, top: 3, paddingHorizontal: 5, borderRadius: 6, backgroundColor: 'rgba(251,246,238,0.82)' }}>
              <Lbl t={r.name} />
            </View>}
            {!mini && r.locked && <View style={{ position: 'absolute', right: 4, bottom: 3, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: 'rgba(251,246,238,0.9)' }}><Lbl t={'잠김 · ' + r.price} /></View>}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderWidth: sel ? 3 : mini ? 1 : 2, borderColor: sel ? '#E59A4C' : C.ink }} />
          </Pressable>
        );
      })}
      {overlay}
      <Token x={(hd.here.cx / 100) * width} y={(hd.here.cy / 100) * H}>
        <Anim key={s.jumping ? 'j' : 'b'} name={s.jumping ? 'hopj' : 'bob'} dur={s.jumping ? 0.7 : 2.4} loop={!s.jumping} easing={EZ.inOut}
          style={{ position: 'absolute', left: -tokenSize / 2, top: -tokenSize / 2 }}>
          <CatFace cat={cat} size={tokenSize} border={mini ? 1.5 : 2} />
        </Anim>
      </Token>
    </View>
  );
}

function Lbl({ t }: { t: string }) { return <Txt jua style={{ fontSize: 11, color: '#4A3428' }}>{t}</Txt>; }

// 고양이 토큰: 방이 바뀌면 0.7초 동안 미끄러지듯 옮겨 간다
function Token({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  const [v] = useState(() => new Animated.ValueXY({ x, y }));
  useEffect(() => { Animated.timing(v, { toValue: { x, y }, duration: 700, useNativeDriver: false }).start(); }, [v, x, y]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: v.x, top: v.y, width: 0, height: 0, zIndex: 4 }}>{children}</Animated.View>;
}
