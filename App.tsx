import { GowunDodum_400Regular } from '@expo-google-fonts/gowun-dodum';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { AppState, BackHandler, PermissionsAndroid, Platform, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { IS_FULL } from './src/config';
import { catById } from './src/data';
import { AccountPicker, Login, Onboard, Splash, usePermSync } from './src/screens/Entry';
import { Decor } from './src/screens/Decor';
import { FocusSettings, Home } from './src/screens/Home';
import { Menu } from './src/screens/Menu';
import { Nav } from './src/screens/Nav';
import { AdView, AppSheet, Cert, Coach, Dialog, Gacha, HouseModal, PaySheet, Receipt, ShareCard, Toast, loadInstalledApps } from './src/screens/Overlays';
import { Done, Fail, Focus, Rest } from './src/screens/Session';
import { Dex, Donate, Mailbox, Shelter, Shop, Stats } from './src/screens/Tabs';
import { coachRefs } from './src/screens/coach';
import { authEnabled, toUser, watchAuth } from './src/services/auth';
import { blocker } from './src/services/blocker';
import { pullOnLogin, startSync } from './src/services/sync';
import { initNotify, notifyGoal, syncReminders } from './src/services/notify';
import { checkUpdate } from './src/services/update';
import { initSfx } from './src/sfx';
import { ErrorBoundary } from './src/screens/ErrorBoundary';
import { S, getS, hooks, useApp } from './src/store';
import { useC, useDark } from './src/theme';
import { Txt } from './src/ui/kit';

// 실제 차단 연결 (정식 빌드 · Android)
hooks.onStart = s => {
  if (!blocker.available) return;
  const pkgs = s.apps.filter(a => s.blocked[a.id] && a.pkg).map(a => a.pkg!);
  const names: Record<string, string> = {}; for (const a of s.apps) if (a.pkg) names[a.pkg] = a.name;
  if (Platform.OS === 'android' && Platform.Version >= 33) PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any).catch(() => {});
  const p = blocker.perms();
  if (!p.usage || !p.overlay) setTimeout(() => S({ dlg: { kind: 'permlost' } }), 400);
  blocker.start({ endAt: s.endAt, packages: pkgs, names, strict: s.toggles.strict, catName: catById(s.catId).name, catImage: s.catId });
};
hooks.onStop = () => blocker.stop();
hooks.onGoal = (goal, cat) => { notifyGoal(goal, cat); };

// 네이티브 차단 화면에서 쌓인 기록(방해 시도 · 세션 포기)을 반영한다. 포기했으면 true.
function pullBlockerEvents() {
  if (!blocker.available) return false;
  const ev = blocker.consume();
  const keys = Object.keys(ev.tries);
  if (keys.length) S(s => { const t = { ...s.tries }; let n = 0; for (const k of keys) { t[k] = (t[k] || 0) + ev.tries[k]; n += ev.tries[k]; } return { tries: t, blockedNow: s.blockedNow + n }; });
  if (ev.gaveUp && getS().screen === 'focus') { getS().quit(); return true; }
  return false;
}

function Root() {
  const C = useC(), dark = useDark(), ins = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const screen = useApp(s => s.screen), tab = useApp(s => s.tab), offline = useApp(s => s.offline), coachN = useApp(s => s.coach);
  const ov = useApp(useShallow(s => ({ sheet: s.sheet, house: s.house, pay: !!s.pay, rcpt: !!s.rcpt, ad: s.ad != null, dlg: !!s.dlg, coach: s.coach >= 0, share: s.share && !!s.last, cert: s.cert != null, gacha: !!s.gacha, acct: s.acct, wheel: s.wheel })));
  const [hydrated, setHydrated] = useState(useApp.persist.hasHydrated());
  usePermSync();

  useEffect(() => useApp.persist.onFinishHydration(() => setHydrated(true)), []);

  // 타이머 · 고양이 행동 · 뒤로가기
  useEffect(() => {
    const t = setInterval(() => getS().tick(), 250);
    const m = setInterval(() => { if (AppState.currentState === 'active' && !getS().wheel) { S(s => ({ msg: s.msg + 1 })); getS().markBeh(); } }, 6000);
    const bh = BackHandler.addEventListener('hardwareBackPress', () => getS().back());
    return () => { clearInterval(t); clearInterval(m); bh.remove(); };
  }, []);

  // 저장된 상태를 불러온 뒤: 집중 중에 앱이 강제 종료됐다면 복구 안내
  useEffect(() => {
    if (!hydrated) return;
    const s = getS(), day = new Date().toDateString();
    if (s.adDay !== day) S({ adLeft: 3, adDay: day });
    if (s.screen === 'focus') {
      if (pullBlockerEvents()) return;
      if (!s.fast && Date.now() >= s.endAt) { getS().complete(); return; }
      if (blocker.available && blocker.isBlocking()) return;
      S({ screen: 'tabs', tab: 'home', remain: Math.max(0, (s.endAt - Date.now()) / 1000), dlg: { kind: 'recover' } });
    } else if (s.screen !== 'splash') S({ screen: 'splash' });
    if (blocker.available && !s.apps.some(a => a.pkg)) loadInstalledApps().catch(() => {});
    getS().dailyMail();
    checkUpdate().catch(() => {});
  }, [hydrated]);

  // 리마인더 알림을 설정에 맞춰 다시 예약하고, 앱으로 돌아올 때 새 날의 출석 우편을 확인한다
  useEffect(() => {
    if (!hydrated) return;
    initNotify().then(() => syncReminders(getS())).catch(() => {});
    let t: ReturnType<typeof setTimeout> | undefined;
    const un = useApp.subscribe((st, prev) => {
      if (st.remind !== prev.remind || st.toggles.notif !== prev.toggles.notif || st.catId !== prev.catId) { clearTimeout(t); t = setTimeout(() => syncReminders(getS()).catch(() => {}), 800); }
    });
    const c = AppState.addEventListener('change', st => { if (st === 'active') getS().dailyMail(); });
    return () => { un(); c.remove(); clearTimeout(t); };
  }, [hydrated]);

  // 차단 화면에서 이벤트가 오거나 앱으로 돌아올 때마다 기록을 가져온다
  useEffect(() => {
    if (!hydrated || !blocker.available) return;
    const a = blocker.on('onBlocked', pullBlockerEvents), b = blocker.on('onGiveUp', pullBlockerEvents);
    const c = AppState.addEventListener('change', st => { if (st === 'active') pullBlockerEvents(); });
    return () => { a.remove(); b.remove(); c.remove(); };
  }, [hydrated]);

  // Firebase 로그인 상태 · 동기화
  useEffect(() => {
    if (!(IS_FULL && authEnabled)) return;
    startSync();
    return watchAuth(u => {
      const s = getS();
      if (u && (!s.loggedIn || s.user.uid !== u.uid)) { const r = toUser(u); getS().afterLogin(r.user, r.linked); pullOnLogin(u.uid); }
      else if (!u && s.loggedIn && s.user.uid) S({ dlg: { kind: 'expired' } });
    });
  }, []);

  const statusBg = screen === 'rest' ? C.mint : screen === 'focus' ? C.card : C.bg;
  const navBg = screen === 'rest' ? C.mint : screen === 'focus' || screen === 'tabs' ? C.card : C.bg;
  useEffect(() => { SystemUI.setBackgroundColorAsync(C.bg).catch(() => {}); }, [dark]);

  const isTabs = screen === 'tabs';
  let body: React.ReactNode = null;
  if (screen === 'splash') body = <Splash />;
  else if (screen === 'login') body = <Login />;
  else if (screen === 'onboard') body = <Onboard width={width} />;
  else if (screen === 'decor') body = <Decor width={width} />;
  else if (screen === 'focus') body = <Focus />;
  else if (screen === 'done') body = <Done width={width} height={height} />;
  else if (screen === 'fail') body = <Fail />;
  else if (screen === 'rest') body = <Rest />;
  else body = tab === 'home' ? <Home width={width} /> : tab === 'dex' ? <Dex /> : tab === 'donate' ? <Donate /> : tab === 'shelter' ? <Shelter />
    : tab === 'mail' ? <Mailbox /> : tab === 'shop' ? <Shop /> : tab === 'stats' ? <Stats /> : <Menu width={width} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <View style={{ height: ins.top, backgroundColor: statusBg }} />
      {offline && <View style={{ paddingVertical: 6, paddingHorizontal: 14, backgroundColor: C.ink }}><Txt style={{ fontSize: 12, color: C.bg, textAlign: 'center' }}>오프라인 · 기록은 저장되고 연결되면 동기화돼요</Txt></View>}
      <View ref={r => { coachRefs.root = r; }} collapsable={false} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: C.bg }}>{hydrated ? body : null}</View>
        {isTabs && <Nav />}
        {ov.wheel && isTabs && tab === 'home' && <FocusSettings />}
        {ov.acct && <AccountPicker />}
        {ov.sheet && <AppSheet />}
        {ov.gacha && <Gacha width={width} />}
        {ov.cert && <Cert />}
        {ov.pay && <PaySheet />}
        {ov.rcpt && <Receipt />}
        {ov.share && <ShareCard />}
        {ov.coach && isTabs && tab === 'home' && <Coach key={coachN} height={height - ins.top - ins.bottom} />}
        {ov.ad && <AdView />}
        {ov.dlg && <Dialog />}
        {ov.house && <HouseModal width={width} />}
        <Toast bottom={isTabs ? 96 : 40} />
      </View>
      <View style={{ height: ins.bottom, backgroundColor: navBg }} />
    </View>
  );
}

export default function App() {
  const [fonts] = useFonts({ Jua_400Regular, GowunDodum_400Regular });
  useEffect(() => { initSfx(); }, []);
  if (!fonts) return <View style={{ flex: 1, backgroundColor: '#FBF6EE' }} />;
  return <SafeAreaProvider><ErrorBoundary><Root /></ErrorBoundary></SafeAreaProvider>;
}
