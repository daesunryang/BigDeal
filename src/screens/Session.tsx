import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { IS_DEMO } from '../config';
import { FOCUS_MSGS, MOODS, SHN, catById } from '../data';
import { affOf, growth } from '../derive';
import { Hearth } from '../stage/Hearth';
import { S, getS, useApp } from '../store';
import { useC, useDark } from '../theme';
import { Anim, EZ } from '../ui/anim';
import { Btn, CatFace, Primary, Txt } from '../ui/kit';

// 이름 뒤 조사 이/가 (받침이 있으면 이)
const iga = (w: string) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 ? '이' : '가'); };
const mmss = (sec: number) => { const t = Math.ceil(sec); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };

export function Focus() {
  const C = useC();
  const s = useApp(st => st);
  const cat = catById(s.catId), strict = s.toggles.strict;
  const prog = s.total ? 1 - s.remain / s.total : 0;
  const blockedN = s.apps.filter(a => s.blocked[a.id]).length;
  const holdT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { width, height } = useWindowDimensions();
  // 불멍: 장면 아래 한 줄 설명, 누르면 화면 가득 크게
  const [act, setAct] = useState('');
  const [big, setBig] = useState(false);
  const onAct = useCallback((t: string) => setAct(t), []);
  return (
    <View style={{ flex: 1, backgroundColor: C.card }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingTop: 24, paddingHorizontal: 22, paddingBottom: 22, gap: 18 }}>
        <Txt style={{ fontSize: 14, color: C.sub, textAlign: 'center' }}>{strict ? cat.name + '와(과) 집중 중' : s.tag + ' · ' + cat.name + '와(과) 함께 집중 중 · ' + blockedN + '개 앱 차단됨'}</Txt>
        <View style={{ width: 200, height: 200, marginTop: 4 }}>
          <Svg width={200} height={200} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={100} cy={100} r={93} fill="none" stroke={C.line} strokeWidth={9} />
            <Circle cx={100} cy={100} r={93} fill="none" stroke="#8DBF93" strokeWidth={9} strokeLinecap="round" strokeDasharray="584.3" strokeDashoffset={584.3 * (1 - prog)} />
          </Svg>
          <Anim name="bob" dur={3} style={{ position: 'absolute', left: 20, top: 20 }}><CatFace cat={cat} size={160} /></Anim>
        </View>
        <Txt jua style={{ fontSize: 60, lineHeight: 64, letterSpacing: 1, fontVariant: ['tabular-nums'] }}>{mmss(s.remain)}</Txt>
        {!strict && <Txt style={{ fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 21 }}>{FOCUS_MSGS[prog < 0.4 ? 0 : prog < 0.8 ? 1 : 2]}</Txt>}
        <Pressable onPress={() => setBig(true)} accessibilityRole="button" accessibilityLabel="불멍 화면 크게 보기" style={{ width: '100%', gap: 8 }}>
          <View style={{ borderRadius: 18, borderWidth: 2, borderColor: C.ink, overflow: 'hidden', backgroundColor: '#3B2D25' }}>
            {!big && <Hearth catId={s.catId} width={Math.min(width - 44, 520) - 4} onAct={onAct} />}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
            <Txt style={{ fontSize: 13, color: C.sub, flexShrink: 1 }}>{iga(cat.name) + ' ' + act}</Txt>
            <Txt style={{ fontSize: 12, color: C.sub }}>크게 보기 ⤢</Txt>
          </View>
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={{ width: '100%', gap: 10 }}>
          {IS_DEMO && <Btn onPress={() => S(st => ({ showBlocked: true, blockedApp: '인스타그램', tries: { ...st.tries, ig: (st.tries.ig || 0) + 1 }, blockedNow: st.blockedNow + 1 }))} style={{ height: 46, borderRadius: 23, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.sub }}>
            <Txt style={{ fontSize: 14 }}>(데모) 인스타그램 열어보기</Txt></Btn>}
          {!strict ? <Btn onPress={() => getS().quit()} style={{ height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 17 }}>포기하기</Txt></Btn>
            : <Pressable onPressIn={() => { clearTimeout(holdT.current); S({ holding: true }); holdT.current = setTimeout(() => getS().quit(), 3000); }} onPressOut={() => { clearTimeout(holdT.current); S({ holding: false }); }}
                style={{ height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.red, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                {s.holding && <Anim name="fillbar" dur={3} loop={false} easing={EZ.linear} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', backgroundColor: 'rgba(176,96,74,0.25)', transformOrigin: '0% 50%' } as any} />}
                <Txt style={{ fontSize: 13, color: C.red }}>긴급 종료 · 3초간 길게 누르기 (친밀도 -6)</Txt>
              </Pressable>}
        </View>
      </ScrollView>
      {big && (
        <Pressable onPress={() => setBig(false)} accessibilityLabel="불멍 화면 닫기" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#140E0B', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <Txt jua style={{ fontSize: 44, color: '#F3E3B0', fontVariant: ['tabular-nums'], opacity: 0.85 }}>{mmss(s.remain)}</Txt>
          <Hearth catId={s.catId} width={Math.min(width, height * 1.4)} onAct={onAct} />
          <Txt style={{ fontSize: 14, color: '#C9B7A3' }}>{iga(cat.name) + ' ' + act}</Txt>
          <Txt style={{ fontSize: 12, color: '#7A6352' }}>화면을 누르면 돌아가요</Txt>
        </Pressable>
      )}
      {s.showBlocked && (
        <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(43,34,29,0.55)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 22, paddingHorizontal: 22, paddingBottom: 24, alignItems: 'center', gap: 14 }}>
            <CatFace cat={cat} size={110} />
            <Txt jua style={{ fontSize: 21 }}>지금은 집중 시간이에요</Txt>
            <Txt style={{ fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 21 }}>{`${s.blockedApp}은 ${mmss(s.remain)} 뒤에 열 수 있어요.` + (strict ? '' : `\n${cat.name}가 기다리고 있어요.`)}</Txt>
            <Primary label="집중으로 돌아가기" fs={18} style={{ width: '100%' }} onPress={() => S({ showBlocked: false })} />
            {!strict && <Btn onPress={() => getS().quit()}><Txt style={{ fontSize: 13, color: C.sub, textDecorationLine: 'underline' }}>그래도 열기 (세션 포기)</Txt></Btn>}
          </View>
        </View>
      )}
    </View>
  );
}

const CC = ['#E59A4C', '#8DBF93', '#E07F7F', '#7E9CC8', '#F2C46B', '#B8A2D9'];
export function Done({ width, height }: { width: number; height: number }) {
  const C = useC();
  const s = useApp(st => st);
  const cat = catById(s.catId), last = s.last, gr = growth(s);
  const mood = MOODS[Math.min(5, Math.floor(affOf(s) / 20))];
  if (!last) return null;
  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingTop: 36, paddingHorizontal: 22, paddingBottom: 22, gap: 16 }}>
        <Anim name="rise" dur={0.5} loop={false} easing={EZ.out}><Txt style={{ fontSize: 14, color: C.sub }}>{(last.tag ? last.tag + ' · ' : '') + last.min + '분 집중 완료'}</Txt></Anim>
        <Anim name="rise" dur={0.5} delay={0.1} loop={false} easing={EZ.out} style={{ opacity: 0 }}><Txt jua style={{ fontSize: 28 }}>잘했어요!</Txt></Anim>
        <Anim name="pop" dur={0.6} loop={false} easing={EZ.out}><CatFace cat={cat} size={200} /></Anim>
        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <Anim name="pop" dur={0.5} delay={0.4} loop={false} easing={EZ.out} style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: C.chip1, gap: 2, opacity: 0, alignItems: 'center' }}><Txt jua style={{ fontSize: 24 }}>{'+' + last.churu}</Txt><Txt style={{ fontSize: 12 }}>츄르</Txt></Anim>
          <Anim name="pop" dur={0.5} delay={0.6} loop={false} easing={EZ.out} style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: C.pink, gap: 2, opacity: 0, alignItems: 'center' }}><Txt jua style={{ fontSize: 24 }}>{'+' + last.aff}</Txt><Txt style={{ fontSize: 12 }}>친밀도 ♥</Txt></Anim>
        </View>
        {last.parts.length > 0 && <Anim name="rise" dur={0.5} delay={0.7} loop={false} easing={EZ.out} style={{ opacity: 0, width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>{last.parts.map(p => <View key={p} style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.chip1 }}><Txt style={{ fontSize: 12 }}>{p}</Txt></View>)}</Anim>}
        {last.goal && <Anim name="rise" dur={0.5} delay={0.8} loop={false} easing={EZ.out} style={{ opacity: 0, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#E59A4C' }}><Txt jua style={{ fontSize: 16, color: '#2B221D' }}>오늘의 집중 목표를 달성했어요!</Txt></Anim>}
        {last.grow && <Anim name="rise" dur={0.5} delay={0.85} loop={false} easing={EZ.out} style={{ opacity: 0, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#8DBF93' }}><Txt jua style={{ fontSize: 16, color: '#2B221D' }}>{gr.name + '(으)로 자랐어요!'}</Txt></Anim>}
        {last.up && <Anim name="rise" dur={0.5} delay={0.9} loop={false} easing={EZ.out} style={{ opacity: 0, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 16, color: C.bg, textAlign: 'center' }}>{`하트가 하나 늘었어요 · 표정이 '${mood}'(으)로 바뀌었어요`}</Txt></Anim>}
        <Anim name="rise" dur={0.5} delay={1} loop={false} easing={EZ.out} style={{ opacity: 0, width: '100%', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.gink, backgroundColor: C.mint }}>
          <Txt style={{ fontSize: 13, lineHeight: 20 }}>목표 달성! 파트너가 <Txt style={{ fontSize: 13, fontWeight: '700' }}>{SHN[s.pick]}</Txt>에 사료 100g을 기부했어요.</Txt>
        </Anim>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          {([['휴식 ' + (s.restOn ? s.restLen : 5) + '분', () => S({ screen: 'rest', midRest: false, rest: (s.restOn ? s.restLen : 5) * 60 }), C.mint], ['후원 현황', () => S({ screen: 'tabs', tab: 'donate' }), C.bg], ['공유 카드', () => S({ share: true }), C.chip1]] as const).map(([l, f, bg]) => (
            <Btn key={l} onPress={f} style={{ flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.ink, backgroundColor: bg }}><Txt jua style={{ fontSize: 15 }}>{l}</Txt></Btn>
          ))}
        </View>
        <Primary label="홈으로" style={{ width: '100%' }} onPress={() => S({ screen: 'tabs', tab: 'home' })} />
      </ScrollView>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
        {Array.from({ length: 22 }, (_, i) => (
          <Anim key={i} name="confetti" dur={2.4 + (i % 5) * 0.35} delay={(i % 7) * 0.18} loop={false} easing={EZ.in} vars={{ y: height + 40 }}
            style={{ position: 'absolute', top: 0, left: ((i * 37) % 100) / 100 * width, width: 7 + (i % 3) * 2, height: 11, backgroundColor: CC[i % 6], borderRadius: 2, opacity: 0 }} />
        ))}
      </View>
    </View>
  );
}

export function Fail() {
  const C = useC(); const dark = useDark();
  const s = useApp(st => st);
  const cat = catById(s.catId);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingTop: 44, paddingHorizontal: 22, paddingBottom: 22, gap: 14 }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 400, backgroundColor: C.card2, opacity: 0.6 }} />
      <View style={{ width: 180, height: 200 }}>
        <Anim name="droop" dur={3.4} style={{ position: 'absolute', left: 0, top: 20, transformOrigin: '50% 100%' } as any}>
          <CatFace cat={cat} size={180} dim={dark ? 0.6 : 0.75} bg={C.card2} />
        </Anim>
        {[[62, 108, 0], [104, 108, 1.1]].map(([l, t, d], i) => <Anim key={i} name="tear" dur={2.2} delay={d} easing={EZ.in} style={{ position: 'absolute', left: l, top: t, width: 7, height: 11, borderRadius: 4, backgroundColor: '#8CB6D9', opacity: 0 }} />)}
        <Anim name="bubblepop" dur={3} easing={EZ.out} style={{ position: 'absolute', right: -26, top: 0, paddingVertical: 4, paddingHorizontal: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomRightRadius: 12, borderBottomLeftRadius: 3, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink, transformOrigin: '0% 100%' } as any}>
          <Txt jua style={{ fontSize: 14 }}>…</Txt>
        </Anim>
      </View>
      <Anim name="rise" dur={0.5} loop={false} easing={EZ.out}><Txt jua style={{ fontSize: 24 }}>{cat.name + '가 조금 시무룩해요'}</Txt></Anim>
      <Anim name="rise" dur={0.5} delay={0.15} loop={false} easing={EZ.out} style={{ opacity: 0 }}><Txt style={{ fontSize: 14, color: C.sub, lineHeight: 21, textAlign: 'center' }}>이번 세션은 보상과 기부가 없어요. 괜찮아요, 짧게 다시 해볼까요?</Txt></Anim>
      <Anim name="rise" dur={0.5} delay={0.3} loop={false} easing={EZ.out} style={{ opacity: 0, flexDirection: 'row', gap: 10, width: '100%' }}>
        <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: C.pink, alignItems: 'center', gap: 2 }}><Txt jua style={{ fontSize: 20 }}>{'-' + s.failPen}</Txt><Txt style={{ fontSize: 12 }}>친밀도 ♥</Txt></View>
        <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: C.card2, alignItems: 'center', gap: 2 }}><Txt jua style={{ fontSize: 20 }}>+0</Txt><Txt style={{ fontSize: 12 }}>츄르</Txt></View>
      </Anim>
      <View style={{ flex: 1 }} />
      <Primary label="15분만 다시 해보기" style={{ width: '100%' }} onPress={() => getS().start(15)} />
      <Btn onPress={() => S({ screen: 'tabs', tab: 'home' })}><Txt style={{ fontSize: 14, color: C.sub }}>홈으로</Txt></Btn>
    </ScrollView>
  );
}

export function Rest() {
  const C = useC();
  const s = useApp(st => st);
  const cat = catById(s.catId);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.mint }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 22, paddingBottom: 22, gap: 16 }}>
      <Txt style={{ fontSize: 14, color: C.gink }}>휴식 타이머</Txt>
      <Anim name="nap" dur={3.6}><CatFace cat={cat} size={190} /></Anim>
      <Txt jua style={{ fontSize: 64, lineHeight: 68, fontVariant: ['tabular-nums'] }}>{mmss(s.rest)}</Txt>
      <Txt style={{ fontSize: 14, color: C.gink, lineHeight: 21, textAlign: 'center' }}>{cat.name + '와(과) 함께 잠깐 쉬어요.\n' + (s.midRest ? '휴식이 끝나면 남은 집중을 이어서 해요.' : '시간이 끝나면 홈으로 돌아가요.')}</Txt>
      <View style={{ flex: 1 }} />
      <Btn onPress={() => S(st => ({ rest: st.rest + 300 }))} style={{ width: '100%', height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 15 }}>5분 더 쉬기</Txt></Btn>
      <Primary label={s.midRest ? '바로 집중 이어가기' : '휴식 끝내고 홈으로'} style={{ width: '100%' }} onPress={() => (s.midRest ? getS().endRest() : S({ screen: 'tabs', tab: 'home', rest: 0 }))} />
    </ScrollView>
  );
}
