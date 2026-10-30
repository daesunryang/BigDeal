import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { IS_DEMO, IS_FULL } from '../config';
import { CATS } from '../data';
import { AuthError, authEnabled, emailSignIn, googleSignIn } from '../services/auth';
import { blocker } from '../services/blocker';
import { pullOnLogin } from '../services/sync';
import { S, getS, useApp } from '../store';
import { FONT, useC } from '../theme';
import { Anim, EZ } from '../ui/anim';
import { Btn, CatFace, CatScene, Txt } from '../ui/kit';

const ios = Platform.OS === 'ios';

// ── 스플래시: 고양이가 방해 앱들을 몸으로 숨기고, 물어뜯고, 할퀸다 ──
export function Splash() {
  const C = useC();
  useEffect(() => { const t = setTimeout(() => { if (getS().screen === 'splash') S({ screen: getS().loggedIn ? 'tabs' : 'login' }); }, 3600); return () => clearTimeout(t); }, []);
  const ico = (style: any, kids: React.ReactNode, bg?: React.ReactNode) => (
    <View style={[{ position: 'absolute', width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>{bg}{kids}</View>
  );
  const crumb = (left: number, top: number, dx: number, delay: number, bg: string) => (
    <Anim key={left} name="crumb" dur={2} delay={delay} vars={{ x: dx }} easing={EZ.in} style={{ position: 'absolute', left, top, width: 8, height: 8, borderRadius: 2, backgroundColor: bg, zIndex: 4, opacity: 0 }} />
  );
  const scr = (top: number) => (
    <Anim key={top} name="scratch" dur={1.6} easing={EZ.out} style={{ position: 'absolute', left: 8, top, width: 46, height: 3, borderRadius: 2, backgroundColor: C.bg, transformOrigin: '0% 50%', transform: [{ rotate: '-28deg' }] } as any} />
  );
  return (
    <Pressable onPress={() => S({ screen: getS().loggedIn ? 'tabs' : 'login' })} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26, backgroundColor: C.bg }}>
      <View style={{ width: 300, height: 250 }}>
        <Anim name="shake" dur={0.35} style={{ position: 'absolute', left: 28, top: 150, zIndex: 1 }}>
          {ico({ position: 'relative', backgroundColor: '#E0473C' }, <View style={{ width: 0, height: 0, borderLeftWidth: 20, borderLeftColor: '#FFFFFF', borderTopWidth: 12, borderTopColor: 'transparent', borderBottomWidth: 12, borderBottomColor: 'transparent', marginLeft: 4 }} />)}
        </Anim>
        <Anim name="sqbounce" dur={1} style={{ position: 'absolute', left: 65, top: 44, zIndex: 2, transformOrigin: '50% 100%' } as any}>
          <CatFace cat={CATS[0]} size={170} />
        </Anim>
        <View style={{ position: 'absolute', left: 204, top: 24, zIndex: 3, transform: [{ rotate: '14deg' }] }}>
          {ico({ position: 'relative' }, <View style={{ width: 26, height: 26, borderRadius: 9, borderWidth: 4, borderColor: '#FFFFFF' }} />,
            <LinearGradient colors={['#F2A65A', '#D9567A', '#8E5BD0']} locations={[0, 0.55, 1]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />)}
          {/* 물어뜯긴 자리 */}
          <Anim name="bite" dur={2} style={{ position: 'absolute', left: -1, top: -1, width: 66, height: 66 }} pointerEvents="none">
            <Svg width={66} height={66}><Polygon points="31,0 67,0 67,26 61,14 50,17 46,4 37,10" fill={C.bg} /></Svg>
          </Anim>
        </View>
        {crumb(240, 34, 18, 0, '#D9567A')}{crumb(252, 30, 34, 0.15, '#8E5BD0')}{crumb(232, 40, -6, 0.3, '#F2A65A')}
        <Anim name="popin" dur={2} easing={EZ.out} style={{ position: 'absolute', left: 236, top: -10, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, backgroundColor: C.ink, zIndex: 5 }}>
          <Txt jua style={{ fontSize: 14, color: C.bg }}>와작!</Txt>
        </Anim>
        <Anim name="wobble" dur={0.8} style={{ position: 'absolute', left: 198, top: 164, zIndex: 3 }}>
          {ico({ position: 'relative', backgroundColor: '#151515' }, <><Txt style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '700', fontFamily: undefined }}>X</Txt>{scr(18)}{scr(30)}{scr(42)}</>)}
        </Anim>
        <Anim name="popin" dur={2} delay={0.9} easing={EZ.out} style={{ position: 'absolute', left: 20, top: 112, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.ink, zIndex: 5, opacity: 0 }}>
          <Txt jua style={{ fontSize: 13 }}>숨겨!</Txt>
        </Anim>
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Txt jua style={{ fontSize: 42, lineHeight: 46 }}>냥집중</Txt>
        <Txt style={{ fontSize: 14, color: C.sub }}>방해꾼 앱은 고양이가 처리할게요</Txt>
      </View>
      <View style={{ width: 160, height: 6, borderRadius: 3, backgroundColor: C.line, overflow: 'hidden' }}>
        <Anim name="load" dur={3.4} loop={false} easing={EZ.out} style={{ height: '100%', width: '100%', backgroundColor: '#E59A4C', transformOrigin: '0% 50%' } as any} />
      </View>
    </Pressable>
  );
}

// ── 로그인 ──
export function Login() {
  const C = useC();
  const emailMode = useApp(st => st.emailMode), email = useApp(st => st.email), pw = useApp(st => st.pw), loginErr = useApp(st => st.loginErr);
  const [busy, setBusy] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const done = async (r: Awaited<ReturnType<typeof googleSignIn>>) => { if (!r) return; getS().afterLogin(r.user, r.linked); if (r.user.uid) await pullOnLogin(r.user.uid); };
  const google = async () => {
    if (!authEnabled) {
      // Firebase 키 없이 만든 정식 빌드: 이 기기에만 저장되는 계정으로 들어간다
      if (IS_FULL) { getS().toast('Firebase 설정이 없어 이 기기에만 저장돼요'); return getS().afterLogin({ name: '집사', email: '', provider: 'Google' }, { Google: true }); }
      return S({ acct: true });
    }
    setBusy(true); try { await done(await googleSignIn()); } catch (e) { getS().toast(e instanceof AuthError ? e.message : '로그인하지 못했어요'); } finally { setBusy(false); }
  };
  const emailLogin = async () => {
    if (!valid) return S({ loginErr: '올바른 이메일 주소를 입력해 주세요.' });
    if (pw.length < 6) return S({ loginErr: '비밀번호는 6자 이상이어야 해요.' });
    if (!authEnabled) return getS().afterLogin({ name: email.split('@')[0], email, provider: '이메일' }, { '이메일': true });
    setBusy(true); try { await done(await emailSignIn(email, pw)); } catch (e) { S({ loginErr: e instanceof AuthError ? e.message : '로그인하지 못했어요.' }); } finally { setBusy(false); }
  };
  const input = { height: 50, borderRadius: 14, borderWidth: 1.5, backgroundColor: C.white, paddingHorizontal: 14, fontFamily: FONT.body, fontSize: 16, color: C.ink };
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: 24, paddingHorizontal: 22, paddingBottom: 22, gap: 14 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', gap: 12, paddingTop: 16 }}>
        <CatFace cat={CATS[0]} size={120} />
        <Txt jua style={{ fontSize: 30 }}>냥집중 시작하기</Txt>
        <Txt style={{ fontSize: 14, lineHeight: 21, color: C.sub, textAlign: 'center' }}>로그인하면 고양이, 집중 기록, 후원 내역이 안전하게 저장돼요.</Txt>
      </View>
      <View style={{ flex: 1 }} />
      {busy && <ActivityIndicator color={C.ink} />}
      {!emailMode ? (
        <View style={{ gap: 10 }}>
          <Btn onPress={google} style={{ height: 54, borderRadius: 27, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white, flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}><Txt style={{ fontSize: 13, fontWeight: '700', fontFamily: undefined }}>G</Txt></View>
            <Txt style={{ fontSize: 16 }}>Google 계정으로 계속하기</Txt>
          </Btn>
          {ios && <Btn onPress={() => getS().afterLogin({ name: '김집중', email: '비공개 Apple ID', provider: 'Apple' }, { Apple: true })} style={{ height: 54, borderRadius: 27, backgroundColor: '#111111' }}><Txt style={{ fontSize: 16, color: '#FFFFFF' }}>Apple로 계속하기</Txt></Btn>}
          <Btn onPress={() => S({ emailMode: true, loginErr: '' })} style={{ height: 54, borderRadius: 27, backgroundColor: C.ink }}><Txt style={{ fontSize: 16, color: C.bg }}>이메일로 계속하기</Txt></Btn>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Txt style={{ fontSize: 13, color: C.sub }}>이메일</Txt>
          <TextInput value={email} onChangeText={v => S({ email: v, loginErr: '' })} placeholder="name@example.com" placeholderTextColor={C.mute} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={[input, { borderColor: email && !valid ? C.red : C.ink }]} />
          <Txt style={{ fontSize: 13, color: C.sub }}>비밀번호</Txt>
          <TextInput value={pw} onChangeText={v => S({ pw: v, loginErr: '' })} placeholder="6자 이상" placeholderTextColor={C.mute} secureTextEntry autoComplete="password" style={[input, { borderColor: C.ink }]} />
          {!!loginErr && <Txt style={{ fontSize: 12, color: C.red }}>{loginErr}</Txt>}
          <Btn onPress={emailLogin} style={{ height: 54, borderRadius: 27, backgroundColor: valid && pw.length >= 6 ? C.ink : C.disabled }}><Txt jua style={{ fontSize: 17, color: C.bg }}>로그인 / 가입</Txt></Btn>
          <Btn onPress={() => S({ emailMode: false, loginErr: '' })} style={{ paddingVertical: 4 }}><Txt style={{ fontSize: 13, color: C.sub }}>다른 방법으로 로그인</Txt></Btn>
        </View>
      )}
      <Txt style={{ fontSize: 11, lineHeight: 16, color: C.mute, textAlign: 'center' }}>계속하면 이용약관 및 개인정보 처리방침에 동의하게 됩니다.</Txt>
    </ScrollView>
  );
}

// 데모 빌드의 Google 계정 선택 창
export function AccountPicker() {
  const C = useC();
  const pick = () => getS().afterLogin({ name: '김집중', email: 'focus.kim@gmail.com', provider: 'Google' }, { Google: true });
  const rows = [{ name: '김집중', email: 'focus.kim@gmail.com', initial: '김', color: '#8DBF93' }, { name: '다른 계정 사용', email: 'Google 계정 추가', initial: '+', color: C.line }];
  return (
    <Pressable onPress={() => S({ acct: false })} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(43,34,29,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 5 }}>
      <Pressable onPress={() => {}} style={{ width: '100%', backgroundColor: C.white, borderRadius: 24, padding: 20, gap: 6 }}>
        <Txt style={{ fontSize: 13, fontWeight: '700', textAlign: 'center', fontFamily: undefined }}>G</Txt>
        <Txt style={{ fontSize: 18, textAlign: 'center' }}>계정 선택</Txt>
        <Txt style={{ fontSize: 13, color: C.sub, textAlign: 'center', marginBottom: 10 }}>냥집중(으)로 이동</Txt>
        {rows.map(a => (
          <Btn key={a.email} onPress={pick} style={{ flexDirection: 'row', justifyContent: 'flex-start', gap: 12, height: 56, borderTopWidth: 1, borderTopColor: C.sand3, paddingHorizontal: 4 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: a.color, alignItems: 'center', justifyContent: 'center' }}><Txt style={{ fontSize: 14, color: '#FFFFFF' }}>{a.initial}</Txt></View>
            <View><Txt style={{ fontSize: 14 }}>{a.name}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{a.email}</Txt></View>
          </Btn>
        ))}
      </Pressable>
    </Pressable>
  );
}

// 실제 권한 상태를 앱으로 돌아올 때마다 다시 읽는다 (정식 빌드)
export function usePermSync() {
  useEffect(() => {
    if (!blocker.available) return;
    const read = () => { const p = blocker.perms(); S({ perm: { a: p.usage, b: p.overlay } }); };
    read();
    const sub = AppState.addEventListener('change', st => { if (st === 'active') read(); });
    return () => sub.remove();
  }, []);
}

export function permRows() {
  return ios
    ? [['a', '스크린 타임 접근', '집중 중 선택한 앱을 잠가요'], ['b', '알림 허용', '세션 종료·고양이 소식을 알려드려요']]
    : [['a', '사용 정보 접근 허용', '어떤 앱이 열렸는지 확인해요'], ['b', '다른 앱 위에 표시', '차단 앱 위에 고양이 화면을 띄워요']];
}
export function grantPerm(k: 'a' | 'b') {
  if (blocker.available) { if (k === 'a') blocker.openUsage(); else blocker.openOverlay(); return; }
  S(st => ({ perm: { ...st.perm, [k]: !st.perm[k] } }));
}

// ── 권한 안내 (온보딩) ──
export function Onboard({ width }: { width: number }) {
  const C = useC();
  const perm = useApp(s => s.perm), coachSeen = useApp(s => s.coachSeen);
  const all = perm.a && perm.b;
  const finish = () => {
    if (!all) { if (IS_DEMO || !blocker.available) S({ perm: { a: true, b: true } }); else grantPerm(!perm.a ? 'a' : 'b'); return; }
    S({ screen: 'tabs', tab: 'home' });
    if (!coachSeen) setTimeout(() => S({ coach: 0 }), 500);
  };
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingTop: 16, paddingHorizontal: 22, paddingBottom: 20, gap: 18 }}>
      <CatScene cat={CATS[0]} width={width - 44} style={{ borderRadius: 24 }} />
      <View style={{ gap: 8 }}>
        <Txt jua style={{ fontSize: 25, lineHeight: 32 }}>최고의 집중시간을 경험하고, 달라진 나만의 고양이를 발견하세요.</Txt>
        <Txt style={{ fontSize: 14, lineHeight: 21, color: C.sub }}>방해 앱을 잠시 막으려면 권한이 필요해요.</Txt>
      </View>
      <View style={{ gap: 10 }}>
        {permRows().map(([k, title, desc]) => {
          const on = perm[k as 'a' | 'b'];
          return (
            <Btn key={k} onPress={() => grantPerm(k as 'a' | 'b')} style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: C.ink, backgroundColor: on ? C.mint : C.bg }}>
              <View style={{ flex: 1, gap: 2 }}><Txt jua style={{ fontSize: 16 }}>{title}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{desc}</Txt></View>
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.ink, backgroundColor: on ? '#8DBF93' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <Txt style={{ fontSize: 13, fontWeight: '700', color: C.bg, fontFamily: undefined }}>{on ? '✓' : ''}</Txt>
              </View>
            </Btn>
          );
        })}
        {blocker.available && <Txt style={{ fontSize: 12, lineHeight: 18, color: C.sub }}>누르면 설정 화면이 열려요. 냥집중을 찾아 허용한 뒤 돌아오세요.</Txt>}
      </View>
      <View style={{ flex: 1 }} />
      <Btn onPress={finish} style={{ height: 56, borderRadius: 28, backgroundColor: all ? C.ink : C.disabled }}>
        <Txt jua style={{ fontSize: 19, color: C.bg }}>{all ? '고양이 만나러 가기' : '권한을 허용해 주세요'}</Txt>
      </Btn>
    </ScrollView>
  );
}
