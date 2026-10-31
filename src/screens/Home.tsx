import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, View } from 'react-native';
import { REST_PRESETS, catById } from '../data';
import { todayMin } from '../derive';
import { Stage } from '../stage/Stage';
import { S, getS, useApp } from '../store';
import { useC } from '../theme';
import { Freeze } from '../ui/anim';
import { Btn, Txt } from '../ui/kit';
import { coachRefs } from './coach';

const p2 = (n: number) => String(n).padStart(2, '0');
// 네이티브는 experimental_backgroundImage, 웹은 CSS 그대로 (+ 뒤를 흑백·흐리게)
const VIGNETTE = 'radial-gradient(ellipse 70% 58% at 50% 50%, rgba(24,16,11,0.2), rgba(24,16,11,0.86))';
const vignette: any = Platform.OS === 'web' ? { backgroundImage: VIGNETTE, backdropFilter: 'grayscale(.7) blur(2px)' } : { experimental_backgroundImage: VIGNETTE };

// 숫자 휠 (40px 칸에 맞춰 멈춤)
function Wheel({ items, idx, onIdx, w = 72 }: { items: string[]; idx: number; onIdx: (i: number) => void; w?: number }) {
  const C = useC();
  const ref = useRef<ScrollView>(null);
  // 창을 열 때만 현재 값으로 맞춘다 (스크롤 중 idx가 바뀔 때는 건드리지 않음)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTimeout(() => ref.current?.scrollTo({ y: idx * 40, animated: false }), 0); }, []);
  const end = (e: NativeSyntheticEvent<NativeScrollEvent>) => { const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / 40))); if (i !== idx) onIdx(i); };
  return (
    <ScrollView ref={ref} style={{ width: w, height: 160 }} showsVerticalScrollIndicator={false} snapToInterval={40} decelerationRate="fast" nestedScrollEnabled
      onMomentumScrollEnd={end} onScrollEndDrag={e => { const v = e.nativeEvent.velocity; if (!v || Math.abs(v.y) < 0.05) end(e); }}>
      <View style={{ height: 60 }} />
      {items.map((t, i) => <View key={t + i} style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}><Txt jua style={{ fontSize: 24, color: i === idx ? C.ink : C.mute }}>{t}</Txt></View>)}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}


// 홈 — 스크롤 없는 한 화면: 헤더 · 방 · 시계 묶음 · 집중 시작 (디자인 라운드 9·13)
export function Home({ width }: { width: number }) {
  const C = useC();
  const s = useApp(st => st);
  const cat = catById(s.catId);
  const rd = s.roomData(s.catRoom);
  const [roomH, setRoomH] = useState(0);
  const maxW = Math.min(width - 36, 420);
  const sw = roomH ? Math.max(160, Math.min(maxW, Math.floor(roomH * 320 / 262))) : maxW, sh = Math.round(sw * 262 / 320);
  const pm = s.endH >= 12, h12 = s.endH % 12 === 0 ? 12 : s.endH % 12;
  const allow = s.apps.length - s.apps.filter(a => s.blocked[a.id]).length;
  const pct = Math.min(100, Math.round(todayMin(s) / s.goal * 100));
  const openDecor = () => { getS().switchRoom(s.catRoom); S({ screen: 'decor', preview: null }); };
  const goStats = () => S({ tab: 'stats', prevTab: 'home' });
  const reg = (n: number) => (el: View | null) => { coachRefs.items[n] = el; };
  return (
    <Freeze.Provider value={s.wheel}>
      <View style={{ flex: 1, minHeight: 0, overflow: 'hidden', justifyContent: 'space-between', gap: 12, paddingTop: 6, paddingHorizontal: 18, paddingBottom: 18 }}>
        <View style={{ height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt jua style={{ fontSize: 24 }}>냥집중</Txt>
          <Btn onPress={goStats} accessibilityLabel={'오늘 목표 ' + pct + '%'} style={{ flexDirection: 'row', gap: 6, height: 30, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.bg }}>
            <Txt style={{ fontSize: 12, color: C.sub }}>오늘 목표</Txt>
            <Txt jua style={{ fontSize: 14 }}>{pct + '%'}</Txt>
            <View style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: C.line, overflow: 'hidden' }}><View style={{ height: '100%', width: `${pct}%`, backgroundColor: '#E59A4C' }} /></View>
          </Btn>
        </View>

        <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }} onLayout={e => setRoomH(Math.floor(e.nativeEvent.layout.height))}>
          <View ref={reg(0)} collapsable={false}>
            <Pressable onPress={() => S({ house: true, hs: s.catRoom })} style={{ width: sw, height: sh, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: C.ink }}>
              <View style={{ position: 'absolute', left: -2, top: -2 }}><Stage w={sw} H={sh} decor={{ ...rd.decor, outfit: s.decor.outfit }} items={rd.equipped} cat={cat} pos={rd.pos} onCat={() => getS().sing()} /></View>
              {s.sulky && <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(200,196,190,0.45)' }} />}
              <View pointerEvents="none" style={{ position: 'absolute', left: 12, top: 12, maxWidth: 150, paddingVertical: 8, paddingHorizontal: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomRightRadius: 14, borderBottomLeftRadius: 4, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink }}>
                <Txt style={{ fontSize: 13, lineHeight: 17 }}>{s.behavior().text}</Txt>
              </View>
              <View style={{ position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', gap: 6 }}>
                <Btn onPress={() => S({ spotPop: true })} accessibilityLabel="고양이 얼룩 보기" style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink }}>
                  <Txt jua style={{ fontSize: 13 }}>얼룩 ›</Txt>
                </Btn>
                <Btn onPress={openDecor} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink }}>
                  <Txt jua style={{ fontSize: 13 }}>방 꾸미기 ›</Txt>
                </Btn>
              </View>
            </Pressable>
          </View>
        </View>

        {/* 시계 + 휴식 · 차단 제외 버튼을 한 카드로 묶음 (캔버스 디자인) */}
        <View style={{ gap: 10, padding: 12, borderRadius: 24, backgroundColor: C.card }}>
          <View>
            <View ref={reg(1)} collapsable={false}>
              <Btn onPress={() => S({ wheel: true })} accessibilityLabel={'집중 종료 시각 ' + (pm ? '오후 ' : '오전 ') + h12 + '시 ' + s.endM + '분, 눌러서 집중 설정'}
                style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 22, backgroundColor: '#2B221D', borderWidth: 2, borderColor: '#2B221D' }}>
                <Txt jua style={{ fontSize: 22, color: '#E59A4C' }}>{pm ? '오후' : '오전'}</Txt>
                <Txt jua style={{ fontSize: 54, lineHeight: 60, color: '#FBF6EE', fontVariant: ['tabular-nums'] }}>{p2(h12)}</Txt>
                <Txt jua style={{ fontSize: 48, lineHeight: 60, color: '#FBF6EE' }}>:</Txt>
                <Txt jua style={{ fontSize: 54, lineHeight: 60, color: '#FBF6EE', fontVariant: ['tabular-nums'] }}>{p2(s.endM)}</Txt>
              </Btn>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn onPress={() => S({ wheel: true })} style={{ flex: 1, minWidth: 0, height: 55, paddingHorizontal: 8, borderRadius: 21, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.mint }}>
              <Txt jua numberOfLines={2} adjustsFontSizeToFit style={{ fontSize: 16, lineHeight: 19, textAlign: 'center' }}>{s.restOn ? s.restEvery + '분마다\n' + s.restLen + '분 휴식' : '휴식 없음'}</Txt>
            </Btn>
            <View ref={reg(2)} collapsable={false} style={{ flex: 1, minWidth: 0 }}>
              <Btn onPress={() => S({ sheet: true })} style={{ height: 55, paddingHorizontal: 8, borderRadius: 21, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.sub }}>
                <Txt jua numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 18 }}>{allow + '개앱 차단 제외 ›'}</Txt>
              </Btn>
            </View>
          </View>
        </View>

        <View ref={reg(3)} collapsable={false}>
          <Btn onPress={() => getS().start(s.dur)} style={{ height: 56, borderRadius: 28, backgroundColor: C.ink }}>
            <Txt jua style={{ fontSize: 30, lineHeight: 36, color: C.bg }}>집중 시작</Txt>
          </Btn>
        </View>
      </View>
    </Freeze.Provider>
  );
}

// 집중 설정 창 (시계를 누르면): 종료 시각 + 휴식 주기. 바깥은 비네팅, 누르면 닫힌다.
export function FocusSettings() {
  const C = useC();
  const s = useApp(st => st);
  const setEnd = getS().setEnd;
  const pm = s.endH >= 12;
  const dh = Math.floor(s.dur / 60), dm = s.dur % 60;
  const summary = '지금부터 ' + (dh ? dh + '시간 ' : '') + (dm ? dm + '분' : dh ? '' : '5분') + ' 집중해요';
  const hours = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  const mins = Array.from({ length: 12 }, (_, i) => p2(i * 5));
  const close = () => S({ wheel: false });
  const step = (k: 'restEvery' | 'restLen', d: number) => S(st => ({ restOn: true, [k]: k === 'restEvery' ? Math.max(5, Math.min(180, st.restEvery + d)) : Math.max(1, Math.min(30, st.restLen + d)) }));
  const pm1 = { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg };
  const row = (k: 'restEvery' | 'restLen', d: number, unit: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <Btn onPress={() => step(k, -d)} accessibilityLabel={unit + ' 줄이기'} style={pm1}><Txt style={{ fontSize: 16 }}>−</Txt></Btn>
      <Txt jua style={{ width: 34, textAlign: 'center', fontSize: 18, fontVariant: ['tabular-nums'] }}>{String(s[k])}</Txt>
      <Btn onPress={() => step(k, d)} accessibilityLabel={unit + ' 늘리기'} style={pm1}><Txt style={{ fontSize: 16 }}>+</Txt></Btn>
      <Txt style={{ width: 52, fontSize: 13, color: C.sub, paddingLeft: 2 }}>{unit}</Txt>
    </View>
  );
  return (
    <Pressable onPress={close} accessibilityLabel="집중 설정 닫기" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 6, alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      {/* 비네팅: 가운데는 옅고 바깥으로 갈수록 어둡게 */}
      <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, vignette]} />
      <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 420, gap: 14, padding: 18, borderRadius: 26, borderWidth: 2, borderColor: C.ink, backgroundColor: C.bg }}>
        <View style={{ gap: 2 }}>
          <Txt jua style={{ fontSize: 20 }}>집중 설정</Txt>
          <Txt style={{ fontSize: 12, color: C.sub }}>{summary}</Txt>
        </View>
        <Txt jua style={{ fontSize: 14 }}>집중 종료 시각</Txt>
        <View style={{ marginTop: -6, height: 160, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.line, overflow: 'hidden', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          <View pointerEvents="none" style={{ position: 'absolute', left: 10, right: 10, top: 60 - 1.5, height: 40, borderRadius: 10, backgroundColor: C.card }} />
          <Wheel w={80} items={['오전', '오후']} idx={pm ? 1 : 0} onIdx={i => setEnd((s.endH % 12) + (i ? 12 : 0), s.endM)} />
          <Wheel items={hours} idx={s.endH % 12} onIdx={i => setEnd(i + (pm ? 12 : 0), s.endM)} />
          <Wheel items={mins} idx={s.endM / 5} onIdx={i => setEnd(s.endH, i * 5)} />
          <LinearGradient pointerEvents="none" colors={[C.bg, C.bg + '00']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 44 }} />
          <LinearGradient pointerEvents="none" colors={[C.bg + '00', C.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 44 }} />
        </View>
        <View style={{ gap: 8 }}>
          <Txt jua style={{ fontSize: 14 }}>휴식 주기</Txt>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {REST_PRESETS.map(([e, l]) => {
              const on = e ? s.restOn && s.restEvery === e && s.restLen === l : !s.restOn;
              return (
                <Btn key={e} onPress={() => S(e ? { restOn: true, restEvery: e, restLen: l } : { restOn: false })} accessibilityState={{ selected: on }}
                  style={{ flex: 1, height: 44, paddingHorizontal: 2, borderRadius: 14, borderWidth: 1.5, borderColor: C.ink, backgroundColor: on ? C.ink : C.bg }}>
                  <Txt jua style={{ fontSize: 12, lineHeight: 15, textAlign: 'center', color: on ? C.bg : C.ink }}>{e ? e + '분 · ' + l + '분' : '휴식 없음'}</Txt>
                </Btn>
              );
            })}
          </View>
          <View style={{ gap: 6, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 16, backgroundColor: C.card, opacity: s.restOn ? 1 : 0.45 }}>
            {row('restEvery', 5, '분마다')}
            {row('restLen', 1, '분 휴식')}
          </View>
        </View>
        <Btn onPress={close} style={{ height: 50, borderRadius: 25, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 17, color: C.bg }}>확인</Txt></Btn>
      </Pressable>
    </Pressable>
  );
}
