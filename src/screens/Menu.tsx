import * as Clipboard from 'expo-clipboard';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, TextInput, View } from 'react-native';
import { APP_VERSION, IS_DEMO, IS_FULL } from '../config';
import { CATS, DOCS, FAQS, MOODS, NOTICES, OSS, PARTNER_ROWS, PG, PLAT, PLUS_PLANS, catById, isoDay, streakOf } from '../data';
import { affOf, badges, dkg, goalDays, recentDone, gotBadges, growth, monthHeat, todayMin, weekLabels, weekVals } from '../derive';
import { AuthError, authEnabled, linkEmail, linkGoogle, logOut } from '../services/auth';
import { blocker } from '../services/blocker';
import { fb } from '../services/firebase';
import { pushNow, readFriend, stopSync } from '../services/sync';
import { notifyEnabled } from '../services/notify';
import { checkUpdate, openUpdate } from '../services/update';
import { sfx } from '../sfx';
import { S, State, getS, useApp } from '../store';
import { FONT, useC } from '../theme';
import { Anim } from '../ui/anim';
import { Bar, Btn, CatFace, Chip, Header, Hearts, ListCard, PhotoSlot, Primary, Seg, Toggle, ToggleRow, Txt } from '../ui/kit';
import { grantPerm, permRows } from './Entry';

const ios = Platform.OS === 'ios';
const pad = { paddingTop: 8, paddingHorizontal: 18, paddingBottom: 18 };
const page = (t: string) => () => S({ menuPage: t });
const go = (tab: State['tab']) => () => S(st => ({ tab, prevTab: st.tab, menuPage: null }));

type Row = { label: string; value?: string; onPress: () => void; toggle?: boolean; on?: boolean; color?: string };

export async function doLogout() {
  if (IS_FULL && authEnabled) { try { await pushNow(true); } catch {} stopSync(); await logOut().catch(() => {}); getS().reset(); return; }
  S({ screen: 'login', tab: 'home', menuPage: null, emailMode: false, loggedIn: false });
}

function MenuRoot() {
  const C = useC();
  const s = useApp(st => st);
  const av = catById(s.avatarCat || s.catId);
  const tog = (k: keyof State['toggles']) => () => S(st => ({ toggles: { ...st.toggles, [k]: !st.toggles[k] } }));
  const strictRow: Row = { label: '엄격 모드', value: (s.cb ? (s.toggles.strict ? '켜짐 ' : '꺼짐 ') : '') + '포기 버튼 숨김', onPress: tog('strict'), toggle: true, on: s.toggles.strict };
  const SECS: [string, Row[]][] = [
    ['내 활동', [
      { label: '집중냥 Plus', value: s.plus ? (s.plusKind === 'life' ? '평생 이용' : '구독 중') : '고양이 4종 더', onPress: page(PG.plus), color: '#C9772F' },
      { label: '집중 기록', onPress: go('stats') }, { label: '상점 · 꾸미기', value: s.churu + ' 츄르', onPress: go('shop') },
      { label: '고양이 도감', value: (s.owned.length + (s.plus ? 4 : 0)) + '/8', onPress: go('dex') }, { label: '업적 · 배지', value: gotBadges(s) + '/' + badges(s).length * 4, onPress: page('업적 · 배지') },
      { label: '출석 체크', value: streakOf(s.att) + '일', onPress: page(PG.attend) }, { label: '주간 리포트 · 월간 회고', onPress: page(PG.report) }, { label: '친구와 비교', onPress: page(PG.friends) },
      { label: '고양이 성장', value: growth(s).name, onPress: page(PG.growth) }, { label: '츄르 내역', onPress: page(PG.ledger) }]],
    ['후원', [{ label: '후원 현황', value: dkg(s) + 'kg 전달', onPress: go('donate') }, { label: '기부 영수증 · 증명서', onPress: () => S({ tab: 'donate', donTab: 'mine' }) }, { label: '파트너 단체 소개', onPress: page(PG.partner) }]],
    ['집중 설정', [
      { label: '기본 차단 앱', value: s.apps.filter(a => s.blocked[a.id]).length + '개', onPress: () => S({ sheet: true }) },
      strictRow, { label: '집중 목표', value: s.goal + '분/일', onPress: page(PG.goal) }, { label: '집중 리마인더', value: s.remind.on ? '매일 ' + s.remind.time : '꺼짐', onPress: page(PG.remind) }]],
    ['앱 설정', [
      { label: '알림', onPress: tog('notif'), toggle: true, on: s.toggles.notif }, { label: '소리 · 진동', onPress: tog('sound'), toggle: true, on: s.toggles.sound },
      { label: '화면 테마', value: ({ system: '시스템 설정', light: '라이트', dark: '다크' } as const)[s.themeMode], onPress: () => S(st => ({ themeMode: st.themeMode === 'system' ? 'light' : st.themeMode === 'light' ? 'dark' : 'system' })) },
      { label: '언어', value: s.lang, onPress: page('언어 선택') }, { label: '접근성', value: s.big || s.cb ? '켜짐' : '', onPress: page(PG.a11y) }, { label: '효과음 · 햅틱', onPress: page(PG.sfx) },
      { label: '권한 설정', value: s.perm.a && s.perm.b ? '모두 허용' : '확인 필요', onPress: page('권한 설정') }]],
    ['계정', [
      { label: '내 정보 수정', onPress: page(PG.profile) }, { label: '로그인 관리', value: s.user.provider + ' 연동', onPress: page('login') },
      { label: '데이터 백업 · 동기화', value: s.bk.last, onPress: page(PG.backup) }, { label: '로그아웃', onPress: () => { doLogout(); } }, { label: '회원 탈퇴', onPress: page(PG.withdraw), color: C.red }]],
    ['고객 지원', [
      { label: '공지사항', onPress: page('공지사항') }, { label: '자주 묻는 질문', onPress: page('자주 묻는 질문') }, { label: '문의하기', onPress: page('문의하기') },
      { label: '이용약관', onPress: page('이용약관') }, { label: '개인정보 처리방침', onPress: page('개인정보 처리방침') }, { label: '오픈소스 라이선스', onPress: page(PG.oss) }, { label: '앱 정보', value: APP_VERSION, onPress: page('앱 정보') },
      ...(IS_FULL ? [{ label: '위젯 미리보기', onPress: page(PG.widget) }, { label: '튜토리얼 다시 보기', onPress: () => S({ menuPage: null, tab: 'home', coach: 0 }) }] : [])]],
    ...(IS_DEMO ? [['프로토타입 검토', [
      { label: '데모 상황', onPress: page(PG.demo) }, { label: '위젯 미리보기', onPress: page(PG.widget) }, { label: '상태 화면 모음', onPress: page(PG.states) },
      { label: '플랫폼 차이', value: 'Android / iOS', onPress: page(PG.platform) }, { label: '빠른 타이머 (30배속)', onPress: () => S(st => ({ fast: !st.fast })), toggle: true, on: s.fast },
      { label: '튜토리얼 다시 보기', onPress: () => S({ menuPage: null, tab: 'home', coach: 0 }) }]] as [string, Row[]]] : []),
  ];
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 14 }]}>
      <Header title="메뉴" />
      {!!s.update && <Btn onPress={openUpdate} style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 18, backgroundColor: '#F6D58E', borderWidth: 1.5, borderColor: '#4A3428', justifyContent: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}><Txt jua style={{ fontSize: 16, color: '#4A3428' }}>{'새 버전 ' + s.update.tag + '이 나왔어요'}</Txt><Txt style={{ fontSize: 12, color: '#7A6352' }}>눌러서 APK를 받고 설치하면 기록은 그대로 이어져요</Txt></View>
        <Txt jua style={{ fontSize: 14, color: '#4A3428' }}>받기 ›</Txt>
      </Btn>}
      <Btn onPress={page(PG.profile)} style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}>
        <CatFace cat={av} size={52} border={1.5} />
        <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
          <Txt jua style={{ fontSize: 18 }}>{s.user.name || '집사'}</Txt>
          {!!s.user.email && <Txt numberOfLines={1} style={{ fontSize: 12, color: C.sub }}>{s.user.email}</Txt>}
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: C.mint }}><Txt style={{ fontSize: 11 }}>{(s.user.provider || '이메일') + ' 계정 연동'}</Txt></View>
        </View>
        <Txt style={{ fontSize: 18, color: C.mute }}>›</Txt>
      </Btn>
      {SECS.map(([title, rows]) => (
        <View key={title} style={{ gap: 6 }}>
          <Txt style={{ fontSize: 12, color: C.sub, paddingHorizontal: 4 }}>{title}</Txt>
          <ListCard>
            {rows.map(r => (
              <Btn key={r.label} onPress={r.onPress} style={{ flexDirection: 'row', gap: 10, minHeight: 50, paddingHorizontal: 14, justifyContent: 'flex-start' }}>
                <Txt style={{ flex: 1, fontSize: 15, color: r.color ?? C.ink }}>{r.label}</Txt>
                {!!r.value && <Txt style={{ fontSize: 12, color: C.sub }}>{r.value}</Txt>}
                {r.toggle ? <Toggle on={!!r.on} /> : <Txt style={{ fontSize: 16, color: C.mute }}>›</Txt>}
              </Btn>
            ))}
          </ListCard>
        </View>
      ))}
    </ScrollView>
  );
}

const TITLES: Record<string, string> = { login: '로그인 관리' };

export function Menu({ width }: { width: number }) {
  const mp = useApp(s => s.menuPage);
  if (!mp) return <MenuRoot />;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 14 }]} keyboardShouldPersistTaps="handled">
      <Header title={TITLES[mp] || mp} onBack={() => { getS().back(); }} />
      <SubPage p={mp} width={width} />
    </ScrollView>
  );
}

function Expand({ title, body, open, onPress, pin, right, divider }: { title: string; body: string; open: boolean; onPress: () => void; pin?: boolean; right?: string; divider?: boolean }) {
  const C = useC();
  return (
    <Btn onPress={onPress} style={{ alignItems: 'stretch', padding: 14, gap: 8, borderTopWidth: divider ? 1 : 0, borderTopColor: C.line }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {pin && <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: C.chip1 }}><Txt style={{ fontSize: 11 }}>중요</Txt></View>}
        <Txt style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{title}</Txt>
        {!!right && <Txt style={{ fontSize: right.length > 2 ? 11 : 16, color: C.mute }}>{right}</Txt>}
      </View>
      {open && <Txt style={{ fontSize: 13, lineHeight: 20, color: C.body }}>{body}</Txt>}
    </Btn>
  );
}

function KV({ rows }: { rows: [string, string][] }) {
  const C = useC();
  return <ListCard>{rows.map(([k, v]) => (
    <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}>
      <Txt style={{ fontSize: 13, color: C.sub }}>{k}</Txt><Txt style={{ fontSize: 13, textAlign: 'right', flexShrink: 1, lineHeight: 19 }}>{v}</Txt>
    </View>))}</ListCard>;
}

function SubPage({ p, width }: { p: string; width: number }) {
  const C = useC();
  const s = useApp(st => st);
  const cat = catById(s.catId);
  const input = { height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white, paddingHorizontal: 12, fontFamily: FONT.body, fontSize: 15, color: C.ink };
  const [emailDraft, setEmailDraft] = useState(''), [pwDraft, setPwDraft] = useState(''), [linkOpen, setLinkOpen] = useState(false);

  // 친구 기록 새로 읽기 (정식 빌드)
  useEffect(() => {
    if (p !== PG.friends || !IS_FULL || !authEnabled) return;
    (async () => {
      const fr = await Promise.all(getS().friends.map(async f => { try { const r = await readFriend(f.code); return r ? { ...f, name: r.name, m: r.weekMin, c: r.cat } : f; } catch { return f; } }));
      S({ friends: fr });
    })();
  }, [p]);

  if (p === 'login') {
    const PROV: [string, string, string][] = [['Google', 'G', '#6F9BD1'], ['Apple', 'A', '#111111'], ['카카오', 'K', '#E3B440'], ['이메일', '@', C.sub]];
    const linkedCount = Object.values(s.linked).filter(Boolean).length;
    const connect = async (name: string) => {
      if (!(IS_FULL && authEnabled)) return S(st => ({ linked: { ...st.linked, [name]: true } }));
      try {
        if (name === 'Google') { const r = await linkGoogle(); if (r) S({ linked: r.linked }); }
        else if (name === '이메일') setLinkOpen(true);
        else getS().toast(name + ' 연결은 곧 지원돼요');
      } catch (e) { getS().toast(e instanceof AuthError ? e.message : '연결하지 못했어요'); }
    };
    return <>
      <Txt style={{ fontSize: 13, lineHeight: 20, color: C.sub }}>연결된 계정 중 하나로 어느 기기에서든 고양이와 기록을 불러올 수 있어요. 최소 1개 계정은 연결되어 있어야 해요.</Txt>
      <ListCard>{PROV.filter(([n]) => ios || n !== 'Apple' || s.linked.Apple).map(([name, ini, color]) => {
        const on = !!s.linked[name], last = on && linkedCount <= 1;
        return (
          <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingHorizontal: 14 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}><Txt style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontFamily: undefined }}>{ini}</Txt></View>
            <View style={{ flex: 1 }}><Txt style={{ fontSize: 15 }}>{name}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{on ? (name === s.user.provider ? '로그인 중 · 연결됨' : '연결됨') : '연결 안 됨'}</Txt></View>
            <Btn onPress={() => { if (last) return; if (on) return S({ dlg: { kind: 'unlink', name } }); connect(name); }} style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5, borderColor: C.ink, backgroundColor: on ? C.bg : C.ink }}>
              <Txt style={{ fontSize: 12, color: on ? (last ? C.mute : C.ink) : C.bg }}>{on ? (last ? '기본 계정' : '연결 해제') : '연결하기'}</Txt>
            </Btn>
          </View>);
      })}</ListCard>
      {linkOpen && <View style={{ gap: 8 }}>
        <TextInput value={emailDraft} onChangeText={setEmailDraft} placeholder="name@example.com" placeholderTextColor={C.mute} autoCapitalize="none" keyboardType="email-address" style={input} />
        <TextInput value={pwDraft} onChangeText={setPwDraft} placeholder="비밀번호 6자 이상" placeholderTextColor={C.mute} secureTextEntry style={input} />
        <Primary h={46} fs={15} label="이메일 연결" onPress={async () => { try { const r = await linkEmail(emailDraft.trim(), pwDraft); S({ linked: r!.linked }); setLinkOpen(false); getS().toast('이메일을 연결했어요'); } catch (e) { getS().toast(e instanceof AuthError ? e.message : '연결하지 못했어요'); } }} />
      </View>}
    </>;
  }
  if (p === '공지사항') return <View style={{ gap: 8 }}>{NOTICES.map((n, i) => (
    <View key={i} style={{ borderRadius: 16, backgroundColor: C.card }}><Expand title={n.t} body={n.b} pin={n.pin} right={n.d} open={s.openNotice === i} onPress={() => S({ openNotice: s.openNotice === i ? null : i })} /></View>))}</View>;
  if (p === '자주 묻는 질문') return <View style={{ borderRadius: 18, backgroundColor: C.card, overflow: 'hidden' }}>{FAQS.map(([q, a], i) => <Expand key={i} divider={!!i} title={q} body={a} right={s.openFaq === i ? '−' : '+'} open={s.openFaq === i} onPress={() => S({ openFaq: s.openFaq === i ? null : i })} />)}</View>;
  if (p === '업적 · 배지') return <View style={{ gap: 12 }}>
    <View style={{ padding: 14, borderRadius: 18, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}><Txt jua style={{ fontSize: 15, color: C.bg }}>획득한 배지</Txt><Txt jua style={{ fontSize: 24, color: C.bg }}>{gotBadges(s) + ' / ' + badges(s).length * 4}</Txt></View>
    {badges(s).map(([title, unit, th, cur, color]) => {
      const got = th.filter(x => cur >= x).length, nx = th.find(x => cur < x), lo = got ? th[got - 1] : 0;
      const col = (C as any)[color] ?? color;
      return (
        <View key={title} style={{ padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.bg, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Txt jua style={{ fontSize: 16 }}>{title}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{'현재 ' + cur + unit}</Txt></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>{th.map((x, i) => (
            <View key={x} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: cur >= x ? C.ink : C.line, backgroundColor: cur >= x ? col : C.card2, alignItems: 'center', justifyContent: 'center' }}><Txt jua style={{ fontSize: 17, color: cur >= x ? C.ink : C.mute }}>{String(i + 1)}</Txt></View>
              <Txt style={{ fontSize: 10, color: C.sub }}>{x + unit}</Txt>
            </View>))}</View>
          <Bar h={8} pct={nx ? Math.min(100, (cur - lo) / (nx - lo) * 100) : 100} />
          <Txt style={{ fontSize: 11, color: C.sub }}>{nx ? '다음 배지까지 ' + (nx - cur) + unit : '모든 배지를 모았어요'}</Txt>
        </View>);
    })}</View>;
  if (p === '문의하기') {
    const ok = s.inq.text.trim().length >= 5;
    if (s.inq.sent) return <View style={{ paddingVertical: 24, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.mint, alignItems: 'center', gap: 10 }}>
      <Txt jua style={{ fontSize: 20 }}>문의가 접수됐어요</Txt>
      <Txt style={{ fontSize: 13, lineHeight: 20, color: C.gink, textAlign: 'center' }}>{`영업일 기준 2일 안에 ${s.user.email || '등록한 이메일'}로 답변드릴게요.`}</Txt>
      <Btn onPress={() => S({ inq: { cat: '기능 제안', text: '', sent: false } })} style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 13 }}>새 문의 작성</Txt></Btn>
    </View>;
    const send = async () => {
      if (!ok) return;
      if (IS_FULL && authEnabled) { try { const f = fb()!; await addDoc(collection(f.db, 'inquiries'), { uid: s.user.uid ?? null, email: s.user.email, cat: s.inq.cat, text: s.inq.text.trim(), platform: Platform.OS, version: APP_VERSION, at: serverTimestamp() }); } catch { return getS().toast('보내지 못했어요. 네트워크를 확인해 주세요'); } }
      S(st => ({ inq: { ...st.inq, sent: true } }));
    };
    return <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['기능 제안', '오류 신고', '후원 문의', '계정·결제'].map(c => <Chip key={c} h={32} label={c} on={s.inq.cat === c} onPress={() => S(st => ({ inq: { ...st.inq, cat: c } }))} />)}</View>
      <View style={{ gap: 6 }}><Txt style={{ fontSize: 12, color: C.sub }}>답변 받을 이메일</Txt><View style={{ height: 46, borderRadius: 14, backgroundColor: C.card, justifyContent: 'center', paddingHorizontal: 14 }}><Txt style={{ fontSize: 14 }}>{s.user.email || '-'}</Txt></View></View>
      <TextInput multiline value={s.inq.text} onChangeText={v => S(st => ({ inq: { ...st.inq, text: v } }))} placeholder="내용을 적어 주세요 (5자 이상)" placeholderTextColor={C.mute} textAlignVertical="top"
        style={{ height: 150, borderRadius: 14, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white, padding: 12, fontFamily: FONT.body, fontSize: 15, lineHeight: 22, color: C.ink }} />
      <Primary label="보내기" bg={ok ? C.ink : C.disabled} onPress={send} />
    </View>;
  }
  if (DOCS[p]) return <View style={{ gap: 14 }}>
    <View style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.chip1 }}><Txt style={{ fontSize: 12, lineHeight: 18 }}>예시 문안이에요. 출시 전에 실제 약관·방침으로 교체하고 법무 검토를 받아야 해요.</Txt></View>
    {DOCS[p].map(([t, b]) => <View key={t} style={{ gap: 6 }}><Txt jua style={{ fontSize: 15 }}>{t}</Txt><Txt style={{ fontSize: 13, lineHeight: 21, color: C.body }}>{b}</Txt></View>)}
    <Txt style={{ fontSize: 11, color: C.mute }}>시행일 2026년 10월 20일</Txt>
  </View>;
  if (p === '앱 정보') return <View style={{ gap: 16 }}>
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 10 }}>
      <CatFace cat={cat} size={96} />
      <Txt jua style={{ fontSize: 26 }}>집중냥</Txt>
      <Txt style={{ fontSize: 13, color: C.sub }}>{`버전 ${APP_VERSION} (${IS_DEMO ? '데모' : '정식'})`}</Txt>
      {s.update ? <Btn onPress={openUpdate} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: '#F6D58E' }}><Txt style={{ fontSize: 12, color: '#4A3428' }}>{'새 버전 ' + s.update.tag + ' 받기 ›'}</Txt></Btn>
        : <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: C.mint }}><Txt style={{ fontSize: 12 }}>최신 버전을 사용 중이에요</Txt></View>}
      <Btn onPress={() => { checkUpdate(true); }} style={{ paddingVertical: 4 }}><Txt style={{ fontSize: 12, color: C.sub, textDecorationLine: 'underline' }}>업데이트 확인</Txt></Btn>
    </View>
    <ListCard>{['이용약관', '개인정보 처리방침', '문의하기', PG.oss].map(l => (
      <Btn key={l} onPress={page(l)} style={{ flexDirection: 'row', minHeight: 50, paddingHorizontal: 14, justifyContent: 'flex-start' }}><Txt style={{ flex: 1, fontSize: 15 }}>{l}</Txt><Txt style={{ fontSize: 16, color: C.mute }}>›</Txt></Btn>))}</ListCard>
    <Txt style={{ fontSize: 11, lineHeight: 18, color: C.mute, textAlign: 'center' }}>© 2026 집중냥 · 고양이 일러스트 © 집중냥</Txt>
  </View>;
  if (p === '언어 선택') return <View style={{ gap: 12 }}>
    <ListCard>{(['한국어', 'English', '日本語'] as const).map(l => (
      <Btn key={l} onPress={() => S({ lang: l })} style={{ flexDirection: 'row', gap: 12, minHeight: 54, paddingHorizontal: 14, justifyContent: 'flex-start' }}>
        <Txt style={{ flex: 1, fontSize: 15 }}>{l}</Txt>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.lang === l ? C.ink : 'transparent' }} /></View>
      </Btn>))}</ListCard>
    {s.lang !== '한국어' && <Txt style={{ fontSize: 12, lineHeight: 18, color: '#C9772F' }}>주요 화면(홈·탭·메뉴·후원) 위주로 번역돼요. 나머지는 한국어로 보여요.</Txt>}
  </View>;
  if (p === '권한 설정') return <View style={{ gap: 12 }}>
    <Txt style={{ fontSize: 13, lineHeight: 20, color: C.sub }}>집중 중 방해 앱을 막으려면 아래 권한이 필요해요. 끄면 앱 차단이 동작하지 않아요.</Txt>
    <ListCard>{permRows().map(([k, label, desc]) => <ToggleRow key={k} label={label.replace(' 허용', '')} desc={desc} on={s.perm[k as 'a' | 'b']} onPress={() => grantPerm(k as 'a' | 'b')} />)}</ListCard>
    {blocker.available && <Btn onPress={() => blocker.openAppSettings()} style={{ alignSelf: 'flex-start' }}><Txt style={{ fontSize: 12, color: C.sub, textDecorationLine: 'underline' }}>앱 설정 열기</Txt></Btn>}
  </View>;
  if (p === PG.plus) return <PlusPage />;
  if (p === PG.partner) return <View style={{ gap: 14 }}>
    <PhotoSlot label="파트너 로고 · 사진" style={{ height: 110, borderRadius: 16 }} />
    <Txt style={{ fontSize: 14, lineHeight: 23 }}>파트너가 집중 목표를 달성할 때마다 사료를 대신 기부해요. 단체명과 조건은 가칭·예시이고, 확정되면 교체해요.</Txt>
    <KV rows={PARTNER_ROWS as [string, string][]} />
    <Primary h={50} fs={16} label="후원 현황 보기" onPress={() => S({ tab: 'donate', menuPage: null })} />
  </View>;
  if (p === PG.widget) { const tm = todayMin(s); return <View style={{ gap: 16 }}>
    <Txt style={{ fontSize: 13, lineHeight: 20, color: C.sub }}>휴대폰 홈 화면에 올려 두는 위젯 예시예요.</Txt>
    <View style={{ width: 148, height: 148, borderRadius: 28, backgroundColor: C.chip1, borderWidth: 1.5, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10 }}>
      <CatFace cat={cat} size={72} /><Txt jua style={{ fontSize: 13 }}>{cat.name}</Txt><Txt style={{ fontSize: 11 }}>{s.sulky ? '시무룩' : MOODS[Math.floor(affOf(s) / 20)]}</Txt>
    </View>
    <View style={{ borderRadius: 28, backgroundColor: C.mint, borderWidth: 1.5, borderColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
      <CatFace cat={cat} size={64} />
      <View style={{ flex: 1, gap: 6 }}><Txt jua style={{ fontSize: 15 }}>{`오늘 ${tm}분 / 목표 ${s.goal}분`}</Txt><Bar h={8} bg={C.bg} pct={tm / s.goal * 100} /><Txt style={{ fontSize: 11 }}>탭하면 바로 집중을 시작해요</Txt></View>
    </View>
  </View>; }
  if (p === PG.attend) {
    const REW = [3, 3, 5, 3, 3, 5, 15], td = isoDay(0), claimed = s.att.includes(td), st = streakOf(s.att);
    const dcount = claimed ? ((st - 1) % 7) + 1 : st % 7, tIdx = claimed ? dcount - 1 : dcount;
    return <View style={{ gap: 14 }}>
      <View style={{ padding: 16, borderRadius: 18, backgroundColor: C.chip1, gap: 4 }}><Txt jua style={{ fontSize: 20 }}>{st + '일째 출석 중'}</Txt><Txt style={{ fontSize: 13, color: C.sub }}>7일을 채우면 큰 보너스 츄르를 받아요</Txt></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{REW.map((r, i) => { const dn = i < dcount, today = i === tIdx; return (
        <View key={i} style={{ width: (width - 36 - 24) / 4, paddingVertical: 10, paddingHorizontal: 2, borderRadius: 14, borderWidth: 2, borderColor: today && !dn ? '#E59A4C' : dn ? C.ink : C.line, backgroundColor: dn ? C.mint : today ? C.chip1 : C.bg, alignItems: 'center', gap: 3 }}>
          <Txt style={{ fontSize: 11, color: C.sub }}>{(i + 1) + '일차'}</Txt><Txt jua style={{ fontSize: 15, minHeight: 20 }}>{dn ? '✓' : today ? '오늘' : ''}</Txt><Txt style={{ fontSize: 11 }}>{'+' + r}</Txt>
        </View>); })}</View>
      <Primary label={claimed ? '오늘 출석 완료 · 내일 또 만나요' : '출석하고 츄르 ' + REW[tIdx] + '개 받기'} bg={claimed ? C.disabled : C.ink}
        onPress={() => { if (claimed) return; getS().log('출석 보상', REW[tIdx]); sfx('coin'); S(x => ({ att: [...x.att, td], churu: x.churu + REW[tIdx], earnedTotal: x.earnedTotal + REW[tIdx] })); getS().toast('츄르 ' + REW[tIdx] + '개를 받았어요'); }} />
    </View>;
  }
  if (p === PG.goal) { const tm = todayMin(s); return <View style={{ gap: 14 }}>
    <View style={{ padding: 18, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', gap: 10 }}>
      <Txt style={{ fontSize: 13, color: C.sub }}>하루 집중 목표</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Btn onPress={() => S(x => ({ goal: Math.max(10, x.goal - 10) }))} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 22 }}>−</Txt></Btn>
        <Txt jua style={{ fontSize: 40 }}>{s.goal + '분'}</Txt>
        <Btn onPress={() => S(x => ({ goal: Math.min(240, x.goal + 10) }))} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 22 }}>＋</Txt></Btn>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>{[30, 60, 90, 120].map(m => <Chip key={m} label={m + '분'} on={s.goal === m} onPress={() => S({ goal: m })} />)}</View>
    </View>
    <View style={{ padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: C.line, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt style={{ fontSize: 13 }}>{'오늘 ' + tm + '분'}</Txt><Txt style={{ fontSize: 13 }}>{Math.min(100, Math.round(tm / s.goal * 100)) + '%'}</Txt></View>
      <Bar pct={tm / s.goal * 100} />
    </View>
    <ListCard><ToggleRow label="달성 알림" desc="목표를 채우면 고양이가 알려줘요" on={s.goalNotify} onPress={() => S(x => ({ goalNotify: !x.goalNotify }))} /></ListCard>
  </View>; }
  if (p === PG.remind) { const days = ['월', '화', '수', '목', '금', '토', '일']; return <View style={{ gap: 14 }}>
    <ListCard><ToggleRow label="집중 리마인더" desc="정해진 시간에 고양이가 불러요" on={s.remind.on} onPress={() => S(x => ({ remind: { ...x.remind, on: !x.remind.on } }))} /></ListCard>
    <View style={{ gap: 8 }}><Txt style={{ fontSize: 12, color: C.sub }}>알림 시간</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['08:00', '12:00', '18:00', '21:00', '23:00'].map(t => <Chip key={t} jua h={38} fs={15} label={t} on={s.remind.time === t} onPress={() => S(x => ({ remind: { ...x.remind, time: t } }))} />)}</View></View>
    <View style={{ gap: 8 }}><Txt style={{ fontSize: 12, color: C.sub }}>반복 요일</Txt>
      <View style={{ flexDirection: 'row', gap: 6 }}>{days.map((d, i) => <Chip key={d} h={38} label={d} on={!!s.remind.days[i]} style={{ flex: 1, paddingHorizontal: 0 }} onPress={() => S(x => ({ remind: { ...x.remind, days: x.remind.days.map((v, j) => (j === i ? (v ? 0 : 1) : v)) } }))} />)}</View></View>
    <View style={{ padding: 14, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.sub }}>
      <Txt style={{ fontSize: 13, lineHeight: 20 }}>{s.remind.on ? '“같이 집중할까요?” — ' + cat.name + '가 ' + days.filter((_, i) => s.remind.days[i]).join('·') + ' ' + s.remind.time + '에 불러요.' : '리마인더가 꺼져 있어요.'}</Txt>
      {notifyEnabled && s.remind.on && !s.toggles.notif && <Txt style={{ fontSize: 12, color: C.red, marginTop: 6 }}>메뉴 → 알림이 꺼져 있어서 리마인더가 오지 않아요.</Txt>}
      {!notifyEnabled && <Txt style={{ fontSize: 11, color: C.mute, marginTop: 6 }}>데모 빌드는 알림을 예약하지 않아요.</Txt>}
    </View>
  </View>; }
  if (p === PG.report) {
    const wk = weekVals(s), lb = weekLabels(), total = wk.reduce((a, b) => a + b, 0), gr = growth(s);
    const best = lb[wk.indexOf(Math.max(...wk))], heatC = [C.sand3, '#DCEBD6', '#C5E0BE', '#9FCB97', '#7FB07F', '#E59A4C'];
    const tiles = s.reportTab === 'week' ? [['총 집중', total + '분'], ['완료 횟수', (recentDone(s, 7).length + (IS_DEMO ? 8 : 0)) + '회'], ['최고의 요일', total ? best : '-']]
      : [['총 집중', (IS_DEMO ? Math.round((total * 4 + 120) / 60) : Math.round(recentDone(s, 30).reduce((a, x) => a + x.min, 0) / 60)) + '시간'], ['목표 달성', goalDays(s) + '일'], ['후원', dkg(s) + 'kg']];
    return <View style={{ gap: 14 }}>
      <Seg items={[['week', '주간'], ['month', '월간']]} value={s.reportTab} onPick={k => S({ reportTab: k })} />
      <View style={{ flexDirection: 'row', gap: 8 }}>{tiles.map(([k, v]) => <View key={k} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, backgroundColor: C.card, alignItems: 'center' }}><Txt jua style={{ fontSize: 19 }}>{v}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{k}</Txt></View>)}</View>
      <View style={{ padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: C.ink, gap: 10 }}>
        {s.reportTab === 'week' ? <View style={{ height: 126, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>{wk.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 5 }}><View style={{ width: '100%', height: Math.max(4, Math.min(100, v * 1.1)), borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: i === 6 ? '#E59A4C' : C.sage }} /><Txt style={{ fontSize: 11, color: C.sub }}>{lb[i]}</Txt></View>))}</View>
          : <><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>{monthHeat(s).map((h, i) => <View key={i} style={{ width: (width - 36 - 32 - 30) / 7, aspectRatio: 1, borderRadius: 6, backgroundColor: heatC[h] }} />)}</View>
            <Txt style={{ fontSize: 11, color: C.sub }}>진할수록 오래 집중한 날이에요</Txt></>}
      </View>
      <View style={{ padding: 14, borderRadius: 16, backgroundColor: C.mint }}>
        <Txt style={{ fontSize: 13, lineHeight: 21 }}>{s.reportTab === 'week' ? `이번 주 ${total}분 집중했어요. ` + (total ? `${best}요일이 가장 길었어요. ` : '') + `${cat.name}도 ${gr.name} 단계로 잘 자라고 있어요.` : `이번 달 목표를 ${goalDays(s)}일 달성했고 사료 ${dkg(s)}kg을 전했어요. 가장 자주 고른 목적은 “${s.tag}”이에요.`}</Txt>
      </View>
    </View>;
  }
  if (p === PG.friends) {
    const total = weekVals(s).reduce((a, b) => a + b, 0);
    const fr = [{ name: s.user.name + ' (나)', m: total, c: s.avatarCat || s.catId, me: true }, ...s.friends.map(f => ({ ...f, me: false }))].sort((a, b) => b.m - a.m);
    const mx = Math.max(1, fr[0].m);
    const add = async () => {
      const c = s.friendCode.trim().toUpperCase();
      if (!/^CAT-\d{4}$/.test(c)) return S({ friendErr: '코드 형식은 CAT-0000 이에요' });
      if (c === s.myCode) return S({ friendErr: '내 코드예요' });
      if (s.friends.some(f => f.code === c)) return S({ friendErr: '이미 추가한 친구예요' });
      if (IS_FULL && authEnabled) {
        try { const r = await readFriend(c); if (!r) return S({ friendErr: '이 코드를 쓰는 친구를 찾지 못했어요' }); S(x => ({ friends: [...x.friends, { name: r.name, m: r.weekMin, c: r.cat, code: c }], friendCode: '', friendErr: '' })); getS().toast(r.name + ' 님을 친구로 추가했어요'); }
        catch { S({ friendErr: '친구를 불러오지 못했어요. 네트워크를 확인해 주세요' }); }
        return;
      }
      const n = +c.slice(4), nm = ['구름', '하루', '도담', '보름', '새벽'][n % 5];
      S(x => ({ friends: [...x.friends, { name: nm, m: 80 + (n % 400), c: ['cheese', 'blue', 'calico', 'tux'][n % 4], code: c }], friendCode: '', friendErr: '' })); getS().toast(nm + ' 님을 친구로 추가했어요');
    };
    return <View style={{ gap: 14 }}>
      <View style={{ padding: 14, borderRadius: 18, backgroundColor: C.chip1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, gap: 2 }}><Txt style={{ fontSize: 12, color: C.sub }}>내 초대 코드</Txt><Txt jua style={{ fontSize: 22, letterSpacing: 1 }}>{s.myCode}</Txt></View>
        <Btn onPress={async () => { await Clipboard.setStringAsync(s.myCode).catch(() => {}); getS().toast('초대 코드를 복사했어요'); }} style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 13 }}>복사</Txt></Btn>
      </View>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={s.friendCode} onChangeText={v => S({ friendCode: v, friendErr: '' })} placeholder="친구 코드 (예: CAT-1234)" placeholderTextColor={C.mute} maxLength={8} autoCapitalize="characters" style={[input, { flex: 1, minWidth: 0, height: 44 }]} />
          <Btn onPress={add} style={{ height: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 14, color: C.bg }}>추가</Txt></Btn>
        </View>
        {!!s.friendErr && <Txt style={{ fontSize: 12, color: C.red }}>{s.friendErr}</Txt>}
      </View>
      <Txt jua style={{ fontSize: 16 }}>이번 주 집중 시간</Txt>
      <View style={{ gap: 8 }}>{fr.map((f, i) => (
        <View key={f.name + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: f.me ? 2 : 1.5, borderColor: f.me ? C.ink : C.line, backgroundColor: f.me ? C.chip1 : C.bg }}>
          <Txt jua style={{ width: 18, fontSize: 16, textAlign: 'center' }}>{String(i + 1)}</Txt>
          <CatFace cat={catById(f.c)} size={36} border={1.5} />
          <View style={{ flex: 1, gap: 4 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt style={{ fontSize: 14 }}>{f.name}</Txt><Txt style={{ fontSize: 14 }}>{f.m + '분'}</Txt></View><Bar h={7} pct={f.m / mx * 100} /></View>
        </View>))}</View>
      <Txt style={{ fontSize: 12, color: C.sub, lineHeight: 18 }}>친구에게는 집중 시간 합계만 보여요. 차단 앱이나 세부 기록은 공개되지 않아요.</Txt>
    </View>;
  }
  if (p === PG.profile) {
    const draft = s.nick === null ? s.user.name : s.nick, av = catById(s.avatarCat || s.catId);
    const cats = CATS.filter(x => s.owned.includes(x.id) || (x.plus && s.plus));
    return <View style={{ gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 8 }}><CatFace cat={av} size={96} /><Txt style={{ fontSize: 12, color: C.sub }}>프로필 고양이</Txt></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>{cats.map(c => (
        <Btn key={c.id} onPress={() => S({ avatarCat: c.id })}><CatFace cat={c} size={56} border={(s.avatarCat || s.catId) === c.id ? 3 : 1.5} style={(s.avatarCat || s.catId) === c.id ? null : { borderColor: C.line }} /></Btn>))}</View>
      <Txt style={{ fontSize: 13, color: C.sub }}>닉네임</Txt>
      <TextInput value={draft} onChangeText={v => S({ nick: v })} maxLength={12} style={[input, { height: 50, fontSize: 16 }]} />
      <Txt style={{ fontSize: 13, color: C.sub }}>이메일</Txt>
      <View style={{ height: 46, borderRadius: 14, backgroundColor: C.card, justifyContent: 'center', paddingHorizontal: 14 }}><Txt style={{ fontSize: 14 }}>{s.user.email || '-'}</Txt></View>
      <Primary label="저장" bg={draft.trim() ? C.ink : C.disabled} onPress={() => { if (!draft.trim()) return; S(x => ({ user: { ...x.user, name: draft.trim() }, nick: null })); getS().toast('저장했어요'); }} />
    </View>;
  }
  if (p === PG.withdraw) return <View style={{ gap: 14 }}>
    <View style={{ padding: 14, borderRadius: 16, backgroundColor: C.pink }}><Txt style={{ fontSize: 13, lineHeight: 22 }}>{`탈퇴하면 아래 정보가 모두 삭제되고 되돌릴 수 없어요.\n· 고양이 ${s.owned.length}마리와 친밀도\n· 보유 츄르 ${s.churu}개와 아이템\n· 집중 기록, 업적, 우편함\n· 후원 내역은 법령에 따라 일정 기간 보관돼요`}</Txt></View>
    <View style={{ gap: 8 }}><Txt style={{ fontSize: 12, color: C.sub }}>떠나는 이유 (선택)</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['사용 빈도 낮음', '집중에 도움 안 됨', '다른 앱 사용', '개인정보 걱정', '기타'].map(r => <Chip key={r} h={32} label={r} on={s.wd.reason === r} onPress={() => S(x => ({ wd: { ...x.wd, reason: r } }))} />)}</View></View>
    <Btn onPress={() => S(x => ({ wd: { ...x.wd, agree: !x.wd.agree } }))} style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-start' }}>
      <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: s.wd.agree ? C.ink : '#FFFFFF' }}><Txt style={{ fontSize: 14, fontWeight: '700', color: C.bg, fontFamily: undefined }}>{s.wd.agree ? '✓' : ''}</Txt></View>
      <Txt style={{ fontSize: 13 }}>위 내용을 확인했어요</Txt>
    </Btn>
    <Primary label="회원 탈퇴" bg={s.wd.agree ? C.red : C.disabled} fg="#FFFFFF" onPress={() => s.wd.agree && S({ dlg: { kind: 'withdraw' } })} />
  </View>;
  if (p === PG.backup) return <View style={{ gap: 14 }}>
    <View style={{ padding: 16, borderRadius: 18, backgroundColor: C.mint, gap: 4 }}><Txt style={{ fontSize: 12, color: C.gink }}>마지막 백업</Txt><Txt jua style={{ fontSize: 22 }}>{s.bk.last}</Txt><Txt style={{ fontSize: 12, color: C.gink }}>{'연결 계정 ' + (s.user.provider || '-')}</Txt></View>
    <Primary h={50} fs={16} label={s.bk.busy ? '백업 중…' : '지금 백업'} onPress={async () => {
      if (s.offline) return getS().toast('오프라인이라 백업할 수 없어요');
      S(x => ({ bk: { ...x.bk, busy: true } }));
      if (IS_FULL && authEnabled) { let ok = false; try { ok = await pushNow(true); } catch {} S(x => ({ bk: { ...x.bk, busy: false } })); getS().toast(ok ? '백업했어요' : '백업하지 못했어요'); }
      else setTimeout(() => { S(x => ({ bk: { ...x.bk, busy: false, last: '방금 전' } })); getS().toast(IS_FULL ? '이 기기에 저장돼 있어요 (Firebase 설정 필요)' : '백업했어요'); }, 1500);
    }} />
    <ListCard>
      <ToggleRow label="자동 백업" desc={IS_FULL ? '바뀐 내용을 몇 초 뒤 자동으로 올려요' : '하루 한 번, 충전 중일 때'} on={s.bk.auto} onPress={() => S(x => ({ bk: { ...x.bk, auto: !x.bk.auto } }))} />
      <ToggleRow label="Wi-Fi에서만" desc="데이터 요금을 아껴요" on={s.bk.wifi} onPress={() => S(x => ({ bk: { ...x.bk, wifi: !x.bk.wifi } }))} />
      {IS_DEMO && <ToggleRow label="오프라인 상태 보기 (데모)" desc="연결이 끊긴 화면을 확인해요" on={s.offline} onPress={() => S(x => ({ offline: !x.offline }))} />}
    </ListCard>
    <Txt style={{ fontSize: 12, color: C.sub, lineHeight: 19 }}>백업 항목: 고양이·친밀도, 츄르·아이템, 방 배치, 집중 기록, 후원 내역, 설정</Txt>
  </View>;
  if (p === PG.growth) { const gr = growth(s), aff = affOf(s); return <View style={{ gap: 14 }}>
    <View style={{ padding: 14, borderRadius: 18, backgroundColor: C.card, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Txt jua style={{ fontSize: 18 }}>{cat.name + ' · ' + gr.name}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{`친밀도 ${aff}/100`}</Txt></View>
      <Bar pct={aff} bg={C.line} />
      <Txt style={{ fontSize: 12, color: C.sub }}>{aff >= 80 ? '다 자랐어요! 앞으로도 함께 지내요' : '다음 단계까지 ' + ((aff < 40 ? 40 : 80) - aff) + ' 남았어요'}</Txt>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>{([['아기 고양이', '친밀도 0~39', 56], ['어린 고양이', '40~79', 72], ['어른 고양이', '80~100', 88]] as const).map(([n, r, px], i) => (
      <View key={n} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 16, borderWidth: gr.idx === i ? 2.5 : 1.5, borderColor: gr.idx === i ? C.ink : C.line, backgroundColor: gr.idx === i ? C.chip1 : C.bg }}>
        <CatFace cat={cat} size={px} border={1.5} dim={i <= gr.idx ? 1 : 0.35} />
        <Txt jua style={{ fontSize: 14 }}>{n}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{r}</Txt>
      </View>))}</View>
    <Txt style={{ fontSize: 12, color: C.sub, lineHeight: 19 }}>친밀도가 올라가면 고양이가 자라요. 방 꾸미기 화면에서 크기가 달라진 모습을 볼 수 있어요.</Txt>
  </View>; }
  if (p === PG.ledger) { const inn = s.ledger.filter(x => x.a > 0).reduce((a, x) => a + x.a, 0), out = -s.ledger.filter(x => x.a < 0).reduce((a, x) => a + x.a, 0); return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: C.mint }}><Txt style={{ fontSize: 11, color: C.gink }}>획득</Txt><Txt jua style={{ fontSize: 22 }}>{'+' + inn}</Txt></View>
      <View style={{ flex: 1, padding: 14, borderRadius: 16, backgroundColor: C.pink }}><Txt style={{ fontSize: 11, color: C.sub }}>사용</Txt><Txt jua style={{ fontSize: 22 }}>{'-' + out}</Txt></View>
    </View>
    {s.ledger.length === 0 ? <Txt style={{ paddingVertical: 30, textAlign: 'center', fontSize: 13, color: C.sub }}>아직 츄르 내역이 없어요.</Txt> :
    <ListCard>{s.ledger.slice(0, 100).map((x, i) => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14 }}>
        <View style={{ flex: 1 }}><Txt style={{ fontSize: 14 }}>{x.l}</Txt><Txt style={{ fontSize: 11, color: C.mute }}>{x.d}</Txt></View>
        <Txt jua style={{ fontSize: 16, color: x.a > 0 ? C.gink : C.red }}>{(x.a > 0 ? '+' : '') + x.a}</Txt>
      </View>))}</ListCard>}
  </View>; }
  if (p === PG.a11y) return <View style={{ gap: 14 }}>
    <ListCard>
      <ToggleRow label="큰 글씨" desc="화면 글자를 약 10% 키워요" on={s.big} onPress={() => S(x => ({ big: !x.big }))} />
      <ToggleRow label="색약 대응" desc="색뿐 아니라 ♥/♡, 켜짐/꺼짐 글자로도 상태를 보여줘요" on={s.cb} onPress={() => S(x => ({ cb: !x.cb }))} />
    </ListCard>
    <View style={{ padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.sub, gap: 8 }}>
      <Txt style={{ fontSize: 12, color: C.sub }}>미리보기</Txt><Hearts n={Math.floor(affOf(s) / 20)} size={22} />
      <Txt style={{ fontSize: 14 }}>친밀도는 하트 색뿐 아니라 ♥ / ♡ 모양으로도 보여요.</Txt>
    </View>
  </View>;
  if (p === PG.sfx) return <View style={{ gap: 14 }}>
    <ListCard>{([['집중 시작', 'start', '짧은 두 음 상승 · 진동 20ms'], ['집중 완료', 'done', '세 음 상승 · 진동 30-40-60ms'], ['포기', 'fail', '두 음 하강 · 진동 80ms'], ['츄르 획득', 'coin', '높은 두 음 · 약한 진동'], ['구매', 'buy', '짧은 두 음'], ['고양이 탭', 'meow', '야옹 같은 하강 두 음']] as const).map(([l, k, d]) => (
      <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingVertical: 6, paddingHorizontal: 14 }}>
        <View style={{ flex: 1, gap: 2 }}><Txt style={{ fontSize: 14 }}>{l}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{d}</Txt></View>
        <Btn onPress={() => sfx(k, true)} style={{ width: 40, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 12 }}>▶</Txt></Btn>
      </View>))}</ListCard>
    <ListCard>
      <ToggleRow label="효과음" on={s.toggles.sound} onPress={() => S(x => ({ toggles: { ...x.toggles, sound: !x.toggles.sound } }))} />
      <ToggleRow label="진동 (햅틱)" desc={ios ? 'iOS는 시스템 햅틱으로 대체돼요' : ''} on={s.haptic} onPress={() => S(x => ({ haptic: !x.haptic }))} />
    </ListCard>
  </View>;
  if (p === PG.oss) return <View style={{ borderRadius: 18, backgroundColor: C.card, overflow: 'hidden' }}>{OSS.map(([n, l, t], i) => <Expand key={n} divider={!!i} title={n} right={l} body={t} open={s.openOss === i} onPress={() => S({ openOss: s.openOss === i ? null : i })} />)}</View>;
  if (p === PG.states) return <View style={{ gap: 12 }}>
    <View style={{ paddingVertical: 20, paddingHorizontal: 14, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', gap: 8 }}><Txt style={{ fontSize: 11, color: C.mute }}>빈 상태</Txt><View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderStyle: 'dashed', borderColor: C.sub }} /><Txt jua style={{ fontSize: 16 }}>받은 우편이 없어요</Txt><Txt style={{ fontSize: 12, color: C.sub }}>집중하면 고양이가 소식을 보내와요</Txt></View>
    <View style={{ paddingVertical: 20, paddingHorizontal: 14, borderRadius: 18, backgroundColor: C.card, gap: 10 }}><Txt style={{ fontSize: 11, color: C.mute, textAlign: 'center' }}>로딩 (스켈레톤)</Txt>
      <Anim name="pulse" dur={1.2} style={{ flexDirection: 'row', gap: 10 }}><View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.line }} /><View style={{ flex: 1, gap: 8 }}><View style={{ height: 12, borderRadius: 6, backgroundColor: C.line, width: '70%' }} /><View style={{ height: 12, borderRadius: 6, backgroundColor: C.line }} /></View></Anim></View>
    <View style={{ paddingVertical: 20, paddingHorizontal: 14, borderRadius: 18, backgroundColor: C.pink, alignItems: 'center', gap: 8 }}><Txt style={{ fontSize: 11, color: C.mute }}>오류</Txt><Txt jua style={{ fontSize: 16 }}>불러오지 못했어요</Txt><Txt style={{ fontSize: 12, color: C.sub }}>네트워크를 확인하고 다시 시도해 주세요</Txt>
      <Btn onPress={() => getS().toast('다시 불러왔어요')} style={{ height: 38, paddingHorizontal: 18, borderRadius: 19, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 13 }}>다시 시도</Txt></Btn></View>
    <View style={{ paddingVertical: 20, paddingHorizontal: 14, borderRadius: 18, backgroundColor: C.chip1, alignItems: 'center', gap: 6 }}><Txt style={{ fontSize: 11, color: C.mute }}>서버 점검</Txt><Txt jua style={{ fontSize: 16 }}>고양이가 청소 중이에요</Txt><Txt style={{ fontSize: 12, color: C.sub }}>11월 5일 02:00~04:00 · 진행 중인 집중은 이어져요</Txt></View>
  </View>;
  if (p === PG.platform) return <View style={{ borderRadius: 18, backgroundColor: C.card, overflow: 'hidden' }}>
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 10, paddingHorizontal: 12 }}><View style={{ width: 70 }} /><Txt style={{ flex: 1, fontSize: 12, color: C.sub, fontWeight: '700' }}>Android</Txt><Txt style={{ flex: 1, fontSize: 12, color: C.sub, fontWeight: '700' }}>iOS</Txt></View>
    {PLAT.map(([k, a, i]) => <View key={k} style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.line }}>
      <Txt style={{ width: 70, fontSize: 12, color: C.sub }}>{k}</Txt><Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, fontWeight: ios ? '400' : '700' }}>{a}</Txt><Txt style={{ flex: 1, fontSize: 12, lineHeight: 17, fontWeight: ios ? '700' : '400' }}>{i}</Txt></View>)}
  </View>;
  if (p === PG.demo) {
    const DEMO: [string, string, () => void][] = [
      ['집중 중 전화 수신', '타이머가 멈추고 벌점 없이 이어져요', () => { getS().start(s.dur); setTimeout(() => { getS().pauseTimer(); S({ dlg: { kind: 'call' } }); }, 1300); }],
      ['집중 중 알람', '알람이 울리는 동안 타이머가 멈춰요', () => { getS().start(s.dur); setTimeout(() => { getS().pauseTimer(); S({ dlg: { kind: 'alarm' } }); }, 1300); }],
      ['앱 강제 종료 후 복구', '3분 안에 돌아오면 벌점 없이 이어가요', () => S({ screen: 'tabs', tab: 'home', menuPage: null, remain: s.remain || 900, total: s.total || 1500, endAt: Date.now() + (s.remain || 900) * 1000, dlg: { kind: 'recover' } })],
      ['권한이 해제된 상태', '다시 허용하도록 안내해요', () => S({ perm: { a: false, b: false }, dlg: { kind: 'permlost' } })],
      ['로그인 만료', '다시 로그인 화면으로 이동해요', () => S({ dlg: { kind: 'expired' } })],
      ['계정 연결 충돌', '이미 다른 계정에 연결된 경우', () => S({ dlg: { kind: 'conflict' } })],
      ['오프라인 전환', '배너와 결제 제한을 확인해요', () => S(x => ({ offline: !x.offline }))],
    ];
    return <View style={{ gap: 10 }}>
      <Txt style={{ fontSize: 13, lineHeight: 20, color: C.sub }}>실제로 겪기 어려운 상황을 바로 볼 수 있어요.</Txt>
      {DEMO.map(([l, sub, f]) => <Btn key={l} onPress={f} style={{ flexDirection: 'row', gap: 10, minHeight: 56, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}>
        <View style={{ flex: 1, gap: 2 }}><Txt style={{ fontSize: 15 }}>{l}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{sub}</Txt></View><Txt style={{ fontSize: 16, color: C.mute }}>›</Txt></Btn>)}
    </View>;
  }
  return <View style={{ height: 240, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}><Txt style={{ fontSize: 12, color: C.sub, textAlign: 'center' }}>{p + ' 상세 화면\n피드백 후 설계 예정'}</Txt></View>;
}

function PlusPage() {
  const C = useC();
  const s = useApp(st => st);
  const plusCats = CATS.filter(c => c.plus);
  return <View style={{ gap: 16 }}>
    <View style={{ paddingVertical: 20, paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#F6D58E', borderWidth: 2, borderColor: '#4A3428', alignItems: 'center', gap: 12 }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12, backgroundColor: '#4A3428' }}><Txt jua style={{ fontSize: 13, color: '#F6D58E', letterSpacing: 1 }}>PLUS</Txt></View>
      <View style={{ flexDirection: 'row', gap: 8 }}>{plusCats.map(c => <CatFace key={c.id} cat={c} size={62} bg="#FBF6EE" style={{ borderColor: '#4A3428' }} />)}</View>
      <Txt jua style={{ fontSize: 22, lineHeight: 29, textAlign: 'center', color: '#4A3428' }}>{'새로운 고양이 4종과\n함께 집중해요'}</Txt>
      <Txt style={{ fontSize: 13, color: '#4A3428' }}>랙돌 · 샴 · 페르시안 · 터키시 앙고라</Txt>
    </View>
    <ListCard>
      <Txt style={{ padding: 13, fontSize: 13, lineHeight: 20 }}>Plus 전용 고양이 4종을 바로 만나요. 츄르를 쓰지 않아도 돼요.</Txt>
      <Txt style={{ padding: 13, fontSize: 13, lineHeight: 20 }}>기본 고양이 4종, 츄르 보상, 후원은 구독하지 않아도 그대로 쓸 수 있어요.</Txt>
      <Txt style={{ padding: 13, fontSize: 13, lineHeight: 20, color: C.sub }}>새 Plus 고양이와 아이템은 순서대로 추가할 예정이에요.</Txt>
    </ListCard>
    {s.plus ? <>
      <View style={{ padding: 16, borderRadius: 18, backgroundColor: C.mint, gap: 6 }}><Txt jua style={{ fontSize: 18 }}>{s.plusKind === 'life' ? 'Plus 평생 이용 중이에요' : 'Plus 구독 중이에요'}</Txt><Txt style={{ fontSize: 13, color: C.gink }}>도감에서 Plus 고양이를 골라 함께할 수 있어요.</Txt></View>
      {s.plusKind !== 'life' && <Btn onPress={() => { S(st => ({ plus: false, catId: catById(st.catId).plus ? 'cheese' : st.catId, avatarCat: st.avatarCat && catById(st.avatarCat).plus ? null : st.avatarCat })); getS().toast('구독을 해지했어요. 기본 고양이로 돌아가요'); }}
        style={{ height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 15 }}>구독 해지</Txt></Btn>}
    </> : <>
      <View style={{ flexDirection: 'row', gap: 10 }}>{PLUS_PLANS.map(([id, l, price, sub]) => (
        <Btn key={id} onPress={() => S({ plusPlan: id as 'life' | 'month' })} style={{ flex: 1, alignItems: 'flex-start', gap: 3, padding: 14, borderRadius: 16, borderWidth: s.plusPlan === id ? 2.5 : 1.5, borderColor: s.plusPlan === id ? C.ink : C.line, backgroundColor: s.plusPlan === id ? C.chip1 : C.bg }}>
          <Txt jua style={{ fontSize: 15 }}>{l}</Txt><Txt jua style={{ fontSize: 20 }}>{price}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{sub}</Txt>
        </Btn>))}</View>
      <Primary h={54} label={(s.plusPlan === 'life' ? '₩19,900 · 한 번만' : '₩3,900 / 월') + ' · Plus 시작하기'} onPress={() => { sfx('buy'); S({ plus: true, plusKind: s.plusPlan }); getS().toast(s.plusPlan === 'life' ? 'Plus 평생 이용을 시작했어요 (데모)' : 'Plus 구독을 시작했어요 (데모)'); }} />
    </>}
    <Txt style={{ fontSize: 11, lineHeight: 18, color: C.mute, textAlign: 'center' }}>가격은 예시예요. 평생 이용은 한 번 결제하면 계속 쓸 수 있어요. 월간 구독은 스토어 계정으로 결제되고, 해지하면 Plus 고양이는 잠겨요. (결제는 아직 데모예요)</Txt>
  </View>;
}
