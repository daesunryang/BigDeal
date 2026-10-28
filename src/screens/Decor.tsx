import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { DECOR, DECOR_KINDS, FLOOR, LIMITED, ROOMS, SWATCH, WALL, catById } from '../data';
import { Stage } from '../stage/Stage';
import { S, getS, listOf, useApp } from '../store';
import { useC } from '../theme';
import { Btn, ChuruBadge, FillView, Txt } from '../ui/kit';

export function Decor({ width }: { width: number }) {
  const C = useC();
  const s = useApp(st => st);
  const catRef = useRef<ScrollView>(null), xs = useRef<Record<string, { x: number; w: number }>>({}), sv = useRef({ x: 0, w: 0, cw: 0 });
  const cat = catById(s.catId), pv = s.preview, kind = DECOR[s.decorCat];
  const d = { ...s.decor }, items = [...s.equipped];
  if (pv && DECOR[pv.kind].single) (d as any)[pv.kind] = pv.id;
  if (pv && !DECOR[pv.kind].single && !items.includes(pv.id)) items.push(pv.id);
  const list = listOf(s.decorCat, s.dRoom);
  const pvEntry = pv ? listOf(pv.kind, s.dRoom).find(x => x[0] === pv.id) : null;
  const H = Math.round(width * 295 / 360);
  const rooms = ROOMS.filter(r => (!r.ext || s.extra) && s.rooms.includes(r.id));
  // 옷 같은 카테고리를 누르면 가능하면 그 버튼이 줄 가운데로 오게 스크롤
  const pickCat = (k: typeof s.decorCat) => {
    S({ decorCat: k });
    const b = xs.current[k], v = sv.current; if (!b || !catRef.current) return;
    const c = b.x - (v.w - b.w) / 2; catRef.current.scrollTo({ x: Math.max(0, Math.min(v.cw - v.w, c)), animated: true });
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.card }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 6, paddingRight: 14, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Btn onPress={() => S({ screen: 'tabs', preview: null })} style={{ width: 40, height: 44 }}><Txt style={{ fontSize: 26 }}>‹</Txt></Btn>
          <Txt jua style={{ fontSize: 21 }}>방 꾸미기</Txt>
        </View>
        <ChuruBadge n={s.churu} />
      </View>
      <View style={{ height: H + 4, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.ink, overflow: 'hidden' }}>
        <Stage w={width} H={H} decor={d} items={items} cat={cat} drag pos={s.pos} showCat={s.catRoom === s.dRoom} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 12, bottom: 10, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(251,246,238,0.92)', borderWidth: 1, borderColor: '#4A3428' }}>
          <Txt style={{ fontSize: 11, color: '#4A3428' }}>물건은 끌어서 옮기고, 고양이는 탭해 보세요</Txt>
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', left: 10, top: 10, maxWidth: 170, paddingVertical: 6, paddingHorizontal: 10, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomRightRadius: 12, borderBottomLeftRadius: 3, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink }}>
          <Txt style={{ fontSize: 12, lineHeight: 16 }}>{s.behavior().text}</Txt>
        </View>
        {Object.keys(s.pos).length > 0 && <Btn onPress={() => S({ pos: {} })} style={{ position: 'absolute', right: 10, top: 10, height: 30, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 12 }}>위치 초기화</Txt></Btn>}
        {!!pv && <View pointerEvents="none" style={{ position: 'absolute', right: 10, bottom: 10, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: C.ink }}><Txt style={{ fontSize: 12, color: C.bg }}>미리보기 중</Txt></View>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingTop: 10, paddingHorizontal: 14 }}>
        {rooms.map(r => { const on = s.dRoom === r.id; return (
          <Btn key={r.id} onPress={() => getS().switchRoom(r.id)} style={{ height: 28, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderColor: C.ink, backgroundColor: on ? C.ink : C.bg }}>
            <Txt style={{ fontSize: 12, color: on ? C.bg : C.ink }}>{(s.roomNames[r.id] || r.name).replace(' · 내 방', '')}</Txt>
          </Btn>); })}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
        <Btn onPress={() => catRef.current?.scrollTo({ x: Math.max(0, sv.current.x - 150), animated: true })} style={{ width: 30, height: 34 }}><Txt style={{ fontSize: 20 }}>‹</Txt></Btn>
        <ScrollView ref={catRef} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6 }}
          onLayout={e => { sv.current.w = e.nativeEvent.layout.width; }} onContentSizeChange={w => { sv.current.cw = w; }} onScroll={e => { sv.current.x = e.nativeEvent.contentOffset.x; }} scrollEventThrottle={32}>
          {DECOR_KINDS.map(k => { const on = s.decorCat === k; return (
            <Btn key={k} onLayout={e => { xs.current[k] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width }; }} onPress={() => pickCat(k)}
              style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1.5, borderColor: C.ink, backgroundColor: on ? C.ink : C.bg }}>
              <Txt jua style={{ fontSize: 14, color: on ? C.bg : C.ink }}>{DECOR[k].label}</Txt>
            </Btn>); })}
        </ScrollView>
        <Btn onPress={() => catRef.current?.scrollTo({ x: Math.min(sv.current.cw - sv.current.w, sv.current.x + 150), animated: true })} style={{ width: 30, height: 34 }}><Txt style={{ fontSize: 20 }}>›</Txt></Btn>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {list.map(([id, name, price]) => {
          const own = (kind.single ? s.ownedDecor.includes(id) : s.items.includes(id)) || (!kind.single && s.equipped.includes(id));
          const active = kind.single ? (s.decor as any)[s.decorCat] === id : s.equipped.includes(id);
          const previewed = pv && pv.id === id;
          const status = s.decorCat === 'snack' ? price + ' 츄르 · 탭해서 주기' : previewed ? '미리보기' : active ? (kind.single ? '적용 중' : '배치됨 · 탭해서 빼기') : own ? (kind.single ? '보유 · 탭해서 적용' : '보유 · 탭해서 배치') : price + ' 츄르';
          const sw = s.decorCat === 'wall' ? WALL[id] : s.decorCat === 'floor' ? FLOOR[id] : SWATCH[id];
          return (
            <Btn key={id} onPress={() => getS().decorTap(id, price)} style={{ width: (width - 28 - 20) / 3, alignItems: 'stretch', gap: 6, padding: 8, borderRadius: 16, borderWidth: previewed || active ? 2.5 : 1.5, borderStyle: previewed ? 'dashed' : 'solid', borderColor: previewed ? '#E59A4C' : active ? C.ink : C.line, backgroundColor: C.bg }}>
              <FillView fill={sw || C.card} radius={10} style={{ width: '100%', aspectRatio: 1, borderWidth: 1.5, borderColor: C.ink }} />
              <Txt style={{ fontSize: 12, lineHeight: 15 }}>{LIMITED.includes(id) ? name + ' (한정)' : name}</Txt>
              <Txt style={{ fontSize: 11, color: active ? C.gink : own ? C.sub : '#C9772F' }}>{status}</Txt>
            </Btn>
          );
        })}
      </ScrollView>
      {!!pv && pvEntry && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: C.bg, borderTopWidth: 1.5, borderTopColor: C.line }}>
          <View style={{ flex: 1 }}>
            <Txt jua style={{ fontSize: 15 }}>{pvEntry[1]}</Txt>
            <Txt style={{ fontSize: 11, color: C.sub }}>{s.churu < pvEntry[2] ? `츄르가 ${pvEntry[2] - s.churu}개 부족해요` : '마음에 들면 구매해서 바로 적용해요'}</Txt>
          </View>
          <Btn onPress={() => S({ preview: null })} style={{ height: 42, paddingHorizontal: 14, borderRadius: 21, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 14 }}>취소</Txt></Btn>
          <Btn onPress={() => getS().buyPreview()} style={{ height: 42, paddingHorizontal: 14, borderRadius: 21, backgroundColor: s.churu >= pvEntry[2] ? C.ink : C.disabled }}><Txt jua style={{ fontSize: 15, color: C.bg }}>{pvEntry[2] + ' 츄르로 구매'}</Txt></Btn>
        </View>
      )}
    </View>
  );
}
