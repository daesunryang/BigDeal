import React, { useEffect, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, View } from 'react-native';
import { MOODS, PG, TAGS, catById, reward } from '../data';
import { affOf, growth, todayMin, weekVals } from '../derive';
import { Stage } from '../stage/Stage';
import { S, getS, useApp } from '../store';
import { useC } from '../theme';
import { Btn, ChuruBadge, Chip, Hearts, Txt } from '../ui/kit';
import { coachRefs } from './coach';

const p2 = (n: number) => String(n).padStart(2, '0');

// 숫자를 누르면 열리는 휠 (40px 칸에 맞춰 멈춤)
function Wheel({ items, idx, onIdx, k }: { items: string[]; idx: number; onIdx: (i: number) => void; k: string }) {
  const C = useC();
  const ref = useRef<ScrollView>(null);
  // 휠을 열거나 형식을 바꿨을 때만 현재 값으로 맞춘다 (스크롤 중 idx가 바뀔 때는 건드리지 않음)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTimeout(() => ref.current?.scrollTo({ y: idx * 40, animated: false }), 0); }, [k]);
  const end = (e: NativeSyntheticEvent<NativeScrollEvent>) => { const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / 40))); if (i !== idx) onIdx(i); };
  return (
    <ScrollView ref={ref} style={{ width: 72, height: 160 }} showsVerticalScrollIndicator={false} snapToInterval={40} decelerationRate="fast" nestedScrollEnabled
      onMomentumScrollEnd={end} onScrollEndDrag={e => { const v = e.nativeEvent.velocity; if (!v || Math.abs(v.y) < 0.05) end(e); }}>
      <View style={{ height: 60 }} />
      {items.map((t, i) => <View key={t + i} style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}><Txt jua style={{ fontSize: 24, color: i === idx ? C.ink : C.mute }}>{t}</Txt></View>)}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

export function Home({ width }: { width: number }) {
  const C = useC();
  const s = useApp(st => st);
  const cat = catById(s.catId);
  const aff = affOf(s), h = Math.floor(aff / 20), gr = growth(s);
  const mood = s.sulky ? '시무룩' : MOODS[h];
  const rd = s.roomData(s.catRoom);
  const sw = Math.min(width - 40, 420), sh = Math.round(sw * 262 / 320);
  const bubble = s.behavior().text;
  const is12 = s.fmt === '12', pm = s.endH >= 12, h12 = s.endH % 12 === 0 ? 12 : s.endH % 12;
  const dh = Math.floor(s.dur / 60), dm = s.dur % 60;
  const durText = (dh ? dh + '시간 ' : '') + (dm ? dm + '분' : dh ? '' : '5분');
  const blockedList = s.apps.filter(a => s.blocked[a.id]);
  const tm = todayMin(s), wk = weekVals(s);
  const openDecor = () => { getS().switchRoom(s.catRoom); S({ screen: 'decor', preview: null }); };
  const hours = is12 ? ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'] : Array.from({ length: 24 }, (_, i) => p2(i));
  const mins = Array.from({ length: 12 }, (_, i) => p2(i * 5));
  const setEnd = getS().setEnd;
  const reg = (n: number) => (el: View | null) => { coachRefs.items[n] = el; };
  const digit = { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: s.wheel ? '#4A3428' : 'transparent' };
  return (
    <ScrollView ref={r => { coachRefs.scroll = r; }} style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 18, paddingBottom: 18, gap: 16 }}>
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt jua style={{ fontSize: 24 }}>집중냥</Txt>
        <Btn onPress={() => S({ tab: 'shop', prevTab: 'home' })}><ChuruBadge n={s.churu} /></Btn>
      </View>

      <View ref={reg(0)} collapsable={false} style={{ alignSelf: 'center' }}>
        <Pressable onPress={() => S({ house: true, hs: s.catRoom })} style={{ width: sw, height: sh, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: C.ink }}>
          <View style={{ position: 'absolute', left: -2, top: -2 }}><Stage w={sw} H={sh} decor={{ ...rd.decor, outfit: s.decor.outfit }} items={rd.equipped} cat={cat} pos={rd.pos} /></View>
          {s.sulky && <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(200,196,190,0.45)' }} />}
          <View style={{ position: 'absolute', left: 12, top: 12, maxWidth: 150, paddingVertical: 8, paddingHorizontal: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomRightRadius: 14, borderBottomLeftRadius: 4, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink }}>
            <Txt style={{ fontSize: 13, lineHeight: 17 }}>{bubble}</Txt>
          </View>
          <Btn onPress={openDecor} style={{ position: 'absolute', right: 10, bottom: 10, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink }}>
            <Txt jua style={{ fontSize: 13 }}>방 꾸미기 ›</Txt>
          </Btn>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Btn onPress={() => S({ tab: 'menu', menuPage: PG.growth, prevTab: 'home' })} style={{ alignItems: 'flex-start', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt jua style={{ fontSize: 20 }}>{cat.name}</Txt>
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: C.mint }}><Txt style={{ fontSize: 11 }}>{gr.name}</Txt></View>
          </View>
          <Txt style={{ fontSize: 13, color: C.sub }}>{'지금 표정 · ' + mood}</Txt>
        </Btn>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Hearts n={h} />
          <Txt style={{ fontSize: 11, color: C.sub }}>{'다음 하트까지 ' + (h >= 5 ? 'MAX' : (aff % 20) + '/20')}</Txt>
        </View>
      </View>

      <View style={{ gap: 10, padding: 14, borderRadius: 20, backgroundColor: C.card }}>
        <Txt jua style={{ fontSize: 16 }}>얼마나 집중할까요?</Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt style={{ fontSize: 13, color: C.sub }}>종료 시각 · 숫자를 눌러 설정</Txt>
          <View style={{ flexDirection: 'row', gap: 2, padding: 3, borderRadius: 12, backgroundColor: C.line }}>
            {([['24', '24시간'], ['12', '12시간']] as const).map(([k, l]) => (
              <Btn key={k} onPress={() => S({ fmt: k })} style={{ height: 28, paddingHorizontal: 10, borderRadius: 9, backgroundColor: s.fmt === k ? C.bg : 'transparent' }}>
                <Txt style={{ fontSize: 12, color: s.fmt === k ? C.ink : C.sub }}>{l}</Txt>
              </Btn>
            ))}
          </View>
        </View>
        <View ref={reg(1)} collapsable={false} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14, borderRadius: 16, backgroundColor: '#2B221D', borderWidth: 2, borderColor: '#2B221D' }}>
          {is12 && <Btn onPress={() => S({ wheel: true })} style={{ paddingHorizontal: 6 }}><Txt jua style={{ fontSize: 22, color: '#E59A4C' }}>{pm ? 'PM' : 'AM'}</Txt></Btn>}
          <Btn onPress={() => S({ wheel: true })} style={digit}><Txt jua style={{ fontSize: 52, lineHeight: 58, color: '#FBF6EE' }}>{is12 ? p2(h12) : p2(s.endH)}</Txt></Btn>
          <Txt jua style={{ fontSize: 46, lineHeight: 52, color: '#FBF6EE' }}>:</Txt>
          <Btn onPress={() => S({ wheel: true })} style={digit}><Txt jua style={{ fontSize: 52, lineHeight: 58, color: '#FBF6EE' }}>{p2(s.endM)}</Txt></Btn>
        </View>
        {s.wheel && <>
          <View style={{ height: 160, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink, overflow: 'hidden', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <View pointerEvents="none" style={{ position: 'absolute', left: 10, right: 10, top: 60 - 1.5, height: 40, borderRadius: 10, backgroundColor: C.card }} />
            {is12 && <Wheel k={'ap' + s.fmt} items={['AM', 'PM']} idx={pm ? 1 : 0} onIdx={i => setEnd((s.endH % 12) + (i ? 12 : 0), s.endM)} />}
            <Wheel k={'h' + s.fmt} items={hours} idx={is12 ? s.endH % 12 : s.endH} onIdx={i => setEnd(is12 ? i + (pm ? 12 : 0) : i, s.endM)} />
            <Wheel k={'m' + s.fmt} items={mins} idx={s.endM / 5} onIdx={i => setEnd(s.endH, i * 5)} />
          </View>
          <Btn onPress={() => S({ wheel: false })} style={{ height: 40, borderRadius: 20, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 15, color: C.bg }}>확인</Txt></Btn>
        </>}
        <Txt style={{ fontSize: 13, color: C.sub, textAlign: 'center' }}>{'집중 시간 ' + durText}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {TAGS.map(t => <Chip key={t} label={t} on={s.tag === t} onPress={() => S({ tag: t })} />)}
        </View>
        <View ref={reg(2)} collapsable={false}>
          <Btn onPress={() => S({ sheet: true })} style={{ flexDirection: 'row', gap: 10, height: 48, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.sub }}>
            <View style={{ flexDirection: 'row' }}>{blockedList.slice(0, 6).map(a => <View key={a.id} style={{ width: 22, height: 22, borderRadius: 7, marginRight: -6, borderWidth: 1.5, borderColor: C.bg, backgroundColor: a.color }} />)}</View>
            <Txt style={{ flex: 1, fontSize: 14, paddingLeft: 8 }}>{blockedList.length + '개 앱 차단'}</Txt>
            <Txt style={{ fontSize: 13, color: C.sub }}>변경 ›</Txt>
          </Btn>
        </View>
      </View>

      <View ref={reg(3)} collapsable={false}>
        <Btn onPress={() => getS().start(s.dur)} style={{ height: 58, borderRadius: 29, backgroundColor: C.ink }}>
          <Txt jua style={{ fontSize: 20, color: C.bg }}>{'집중 시작 · 보상 ' + reward(s.dur).churu + ' 츄르'}</Txt>
        </Btn>
      </View>

      <Btn onPress={() => S({ tab: 'stats', prevTab: 'home' })} style={{ flexDirection: 'row', gap: 14, padding: 14, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}>
        <View style={{ gap: 2 }}>
          <Txt style={{ fontSize: 12, color: C.sub }}>오늘 집중</Txt>
          <Txt jua style={{ fontSize: 24 }}>{tm + '분'}</Txt>
          <Txt style={{ fontSize: 11, color: C.sub }}>{'목표 ' + s.goal + '분 · ' + Math.min(100, Math.round(tm / s.goal * 100)) + '%'}</Txt>
          <View style={{ height: 5, width: 96, borderRadius: 3, backgroundColor: C.line, overflow: 'hidden' }}><View style={{ height: '100%', width: `${Math.min(100, tm / s.goal * 100)}%`, backgroundColor: '#E59A4C' }} /></View>
        </View>
        <View style={{ flex: 1, height: 44, flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
          {wk.map((v, i) => <View key={i} style={{ flex: 1, height: Math.max(4, Math.min(44, Math.round(v * 0.36))), borderRadius: 4, backgroundColor: i === 6 ? '#E59A4C' : C.sage }} />)}
        </View>
        <Txt style={{ fontSize: 18, color: C.mute }}>›</Txt>
      </Btn>
    </ScrollView>
  );
}
