import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { APP_VERSION, IS_DEMO, IS_FULL } from '../config';
import { openUpdate } from '../services/update';
import { ANIMALS, APPS, CATS, CHURU_PACKS, DEFAULT_BLOCK_PKGS, GACHA_CATS, GACHA_COST, GACHA_PITY, MOODS, PG, ROOM_DESC, TIER, catById, won } from '../data';
import { SPOT_COST, spotsOf } from '../spots';
import { CUT_DIM } from '../stage/Stage';
import { paletteOf } from '../stage/pixelCat';
import { CatSpots } from '../ui/CatSpots';
import { affOf, dkg, focusStreak } from '../derive';
import { authEnabled, deleteAccount, unlinkProvider } from '../services/auth';
import { blocker } from '../services/blocker';
import { receiptHtml, sharePdf } from '../services/pdf';
import { deleteRemote, stopSync } from '../services/sync';
import { FloorPlan, houseData } from '../stage/House';
import { sfx } from '../sfx';
import { BlockApp, S, getS, hooks, spotSeed, useApp } from '../store';
import { FONT, useC } from '../theme';
import { Anim, EZ } from '../ui/anim';
import { Btn, CUTOUT, CatFace, ChuruBadge, Primary, Seg, Toggle, Txt } from '../ui/kit';
import { coachRefs } from './coach';

const FULL = { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 };
const ios = Platform.OS === 'ios';

function Scrim({ onClose, z, children, align = 'center', dim = 0.45, pad = 20 }: { onClose?: () => void; z: number; children: React.ReactNode; align?: 'center' | 'bottom'; dim?: number; pad?: number }) {
  return (
    <Pressable onPress={onClose} style={[FULL, { zIndex: z, backgroundColor: `rgba(43,34,29,${dim})`, justifyContent: align === 'bottom' ? 'flex-end' : 'center', alignItems: 'center', padding: align === 'bottom' ? 0 : pad }]}>
      <Pressable onPress={() => {}} style={{ width: '100%', maxHeight: '100%' }}>{children}</Pressable>
    </Pressable>
  );
}
function Grab() { const C = useC(); return <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center', marginBottom: 8 }} />; }

// ── 집중 중 차단할 앱 ──
const HUES = ['#D9728A', '#D96B5B', '#4A3428', '#7FB07F', '#E3B440', '#7E9CC8', '#B8A2D9', '#E59A4C'];
const usageText = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`);
export async function loadInstalledApps() {
  if (!blocker.available) return;
  const list = await blocker.apps();
  const prev = getS().blocked, first = !getS().apps.some(a => a.pkg);
  const apps: BlockApp[] = list.map((a, i) => ({ id: a.pkg, pkg: a.pkg, name: a.name, letter: a.name.slice(0, 1), color: HUES[i % HUES.length], usage: usageText(a.usageMin), icon: a.icon }));
  const blocked: Record<string, boolean> = {};
  for (const a of apps) blocked[a.id] = first ? DEFAULT_BLOCK_PKGS.includes(a.pkg!) : !!prev[a.id];
  S({ apps, blocked });
}
export function AppSheet() {
  const C = useC();
  const apps = useApp(s => s.apps), blocked = useApp(s => s.blocked);
  const [busy, setBusy] = useState(blocker.available), [q, setQ] = useState('');
  useEffect(() => { if (blocker.available) loadInstalledApps().finally(() => setBusy(false)); }, []);
  const list = q ? apps.filter(a => a.name.toLowerCase().includes(q.toLowerCase())) : apps;
  return (
    <Scrim z={5} align="bottom" onClose={() => S({ sheet: false })}>
      <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28, gap: 6, maxHeight: '88%' }}>
        <Grab />
        <Txt jua style={{ fontSize: 20 }}>집중 중 차단할 앱</Txt>
        <Txt style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>{ios ? '스크린 타임으로 선택한 앱이 잠겨요.' : '차단된 앱을 열면 고양이 화면이 위에 나타나요.'}</Txt>
        {blocker.available && apps.length > 8 && <TextInput value={q} onChangeText={setQ} placeholder="앱 검색" placeholderTextColor={C.mute} style={{ height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, paddingHorizontal: 12, fontFamily: FONT.body, color: C.ink, marginBottom: 4 }} />}
        {busy && <ActivityIndicator color={C.ink} />}
        <ScrollView style={{ flexGrow: 0 }}>
          {list.map(a => (
            <Btn key={a.id} onPress={() => S(st => ({ blocked: { ...st.blocked, [a.id]: !st.blocked[a.id] } }))} style={{ flexDirection: 'row', gap: 12, height: 52, justifyContent: 'flex-start' }}>
              {a.icon ? <Image source={{ uri: 'data:image/png;base64,' + a.icon }} style={{ width: 36, height: 36, borderRadius: 10 }} />
                : <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: a.color, alignItems: 'center', justifyContent: 'center' }}><Txt jua style={{ fontSize: 15, color: '#FFFFFF' }}>{a.letter}</Txt></View>}
              <View style={{ flex: 1 }}><Txt numberOfLines={1} style={{ fontSize: 15 }}>{a.name}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{'오늘 ' + a.usage}</Txt></View>
              <Toggle on={!!blocked[a.id]} w={48} h={28} />
            </Btn>
          ))}
        </ScrollView>
        <Primary h={50} label="완료" style={{ marginTop: 10 }} onPress={() => S({ sheet: false })} />
      </View>
    </Scrim>
  );
}

// ── 우리 집 평면도 (탑뷰 팝업) ──
let lastTap: { id: string; t: number } | null = null;
export function HouseModal({ width }: { width: number }) {
  const C = useC();
  const s = useApp(st => st);
  const cat = catById(s.catId);
  const hd = houseData(s, 6), sel = hd.rooms.find(r => r.id === s.hs) || hd.rooms[0];
  const can = s.churu >= sel.price;
  const planW = width - 28 - 32 - 4 - 5;
  const onRoom = (id: string) => {
    const now = Date.now(), dbl = !!lastTap && lastTap.id === id && now - lastTap.t < 450;
    lastTap = { id, t: now }; S({ hs: id, renaming: false });
    if (dbl) { lastTap = null; S({ houseHint: false }); if (getS().rooms.includes(id)) getS().moveCat(id); else getS().toast('잠긴 방이에요. 아래 버튼으로 해금해 주세요'); }
  };
  const act = sel.locked
    ? () => { if (!can) return; getS().log(sel.name + ' 해금', -sel.price); sfx('buy'); S(st => ({ churu: st.churu - sel.price, rooms: [...st.rooms, sel.id] })); getS().toast(sel.name + '이(가) 열렸어요'); }
    : () => { getS().switchRoom(sel.id); S({ house: false, screen: 'decor', preview: null, decorCat: 'wall' }); };
  const expand = () => { if (s.churu < 200) return getS().toast('츄르가 ' + (200 - s.churu) + '개 부족해요'); getS().log('집 넓히기', -200); sfx('buy'); S(st => ({ churu: st.churu - 200, extra: true, rooms: [...st.rooms, 'attic', 'study'] })); getS().toast('다락방과 서재가 생겼어요!'); };
  const rowH = 54;
  return (
    <Scrim z={13} dim={0.55} pad={14} onClose={() => S({ house: false })}>
      <Anim name="pop" dur={0.4} loop={false} easing={EZ.out}>
        <ScrollView style={{ maxHeight: '100%' }} contentContainerStyle={{ backgroundColor: C.bg, borderRadius: 24, borderWidth: 2, borderColor: C.ink, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View><Txt jua style={{ fontSize: 21 }}>우리 집</Txt><Txt style={{ fontSize: 12, color: C.sub }}>방을 두 번 누르면 고양이가 이동해요</Txt></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 14, backgroundColor: C.chip1, borderWidth: 1.5, borderColor: C.ink }}><Txt jua style={{ fontSize: 13 }}>{s.churu + ' 츄르'}</Txt></View>
              <Btn onPress={() => S({ house: false })} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 14 }}>✕</Txt></Btn>
            </View>
          </View>
          <View style={{ borderRadius: 6, borderWidth: 2.5, borderColor: C.ink, overflow: 'hidden' }}>
            <FloorPlan s={s} width={planW} rowH={rowH} rows={6} selId={sel.id} onRoom={onRoom} tokenSize={34}
              overlay={<>
                {!s.extra && <Btn onPress={expand} style={{ position: 'absolute', left: 4, right: 4, top: rowH * 5 + 4, height: rowH - 8, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: C.sub, backgroundColor: C.card }}>
                  <Txt jua style={{ fontSize: 14, color: C.sub }}>＋ 집 넓히기 · 200 츄르 (다락방 · 서재)</Txt></Btn>}
                {s.houseHint && <View pointerEvents="none" style={{ position: 'absolute', left: planW / 2, top: rowH, width: 0, height: 0, zIndex: 6 }}>
                  <Anim name="tapring" dur={1.4} easing={EZ.out} style={{ position: 'absolute', left: -18, top: -18, width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: '#E59A4C' }} />
                  <Anim name="tapring" dur={1.4} delay={0.25} easing={EZ.out} style={{ position: 'absolute', left: -18, top: -18, width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: '#E59A4C', opacity: 0 }} />
                  <View style={{ position: 'absolute', left: -40, top: 26, width: 80, paddingVertical: 3, borderRadius: 10, backgroundColor: '#E59A4C', alignItems: 'center' }}><Txt jua style={{ fontSize: 12, color: '#2B221D' }}>두 번 탭!</Txt></View>
                </View>}
                {!!s.toastMsg && <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: rowH * 2 - 17, alignItems: 'center', zIndex: 10 }}>
                  <Anim name="rise" dur={0.3} loop={false} easing={EZ.out} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#2B221D' }}><Txt style={{ fontSize: 13, color: '#FBF6EE' }}>{s.toastMsg}</Txt></Anim>
                </View>}
              </>} />
          </View>
          <View style={{ gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                <Txt jua style={{ fontSize: 16 }}>{sel.name + (sel.locked ? ' (잠김)' : '')}</Txt>
                {!sel.locked && sel.id === s.catRoom && <CatFace cat={cat} size={26} border={1.5} />}
              </View>
              {!sel.locked && <Btn onPress={() => S({ renaming: !s.renaming, nameDraft: sel.name })} style={{ height: 30, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 12 }}>{s.renaming ? '취소' : '이름 바꾸기'}</Txt></Btn>}
            </View>
            {s.renaming && <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={s.nameDraft} onChangeText={v => S({ nameDraft: v })} maxLength={10} style={{ flex: 1, minWidth: 0, height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white, paddingHorizontal: 12, fontFamily: FONT.body, fontSize: 15, color: C.ink }} />
              <Btn onPress={() => { const v = s.nameDraft.trim(); if (!v) return; S(st => ({ roomNames: { ...st.roomNames, [sel.id]: v }, renaming: false })); getS().toast('방 이름을 바꿨어요'); }} style={{ height: 40, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 14, color: C.bg }}>저장</Txt></Btn>
            </View>}
            <Txt style={{ fontSize: 12, lineHeight: 18, color: C.body }}>{ROOM_DESC[sel.id] || ''}</Txt>
            <Primary h={44} fs={15} bg={sel.locked && !can ? C.disabled : C.ink} label={sel.locked ? (can ? sel.price + ' 츄르로 해금하기' : '츄르가 ' + (sel.price - s.churu) + '개 부족해요') : '이 방 꾸미기 ›'} onPress={act} />
          </View>
        </ScrollView>
      </Anim>
    </Scrim>
  );
}

// ── 결제 시트 (후원) ──
export function PaySheet() {
  const C = useC();
  const pay = useApp(s => s.pay)!, sAmt = useApp(s => s.sAmt), sAnimal = useApp(s => s.sAnimal);
  // pay.pack이 있으면 츄르 충전, 없으면 보호소 후원 결제
  const pk = pay.pack != null ? CHURU_PACKS[pay.pack] : null;
  const amt = pk ? pk[2] : [3000, 5000, 10000][sAmt], all = pay.agree.every(Boolean);
  const name = pk ? '츄르 ' + pk[0] + (pk[1] ? ' + 보너스 ' + pk[1] : '') : ANIMALS.find(x => x.id === sAnimal)!.name + ' 후원';
  const methods = ios ? ['Apple Pay', '신용·체크카드', '카카오페이'] : ['Google Play 결제', '신용·체크카드', '카카오페이', '토스페이'];
  const agree = pk ? ['전체 동의', '(필수) 결제 서비스 이용약관', '(필수) 츄르는 현금으로 환급되지 않고, 쓰지 않은 츄르는 7일 안에 청약철회할 수 있어요'] : ['전체 동의', '(필수) 결제 서비스 이용약관', '(필수) 후원 환불 정책 확인', '(필수) 개인정보 제3자 제공 동의 (보호소 전달용)'];
  return (
    <Scrim z={8} align="bottom" dim={0.5} onClose={() => S({ pay: null })}>
      <ScrollView style={{ maxHeight: '92%' }} contentContainerStyle={{ backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}>
        <Grab />
        <Txt jua style={{ fontSize: 20 }}>결제하기</Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.card }}><Txt style={{ fontSize: 14 }}>{name}</Txt><Txt style={{ fontSize: 14, fontWeight: '700' }}>{won(amt)}</Txt></View>
        <Txt style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>결제 수단</Txt>
        {methods.map(m => (
          <Btn key={m} onPress={() => S(st => ({ pay: { ...st.pay!, method: m } }))} style={{ flexDirection: 'row', gap: 10, height: 48, paddingHorizontal: 12, borderRadius: 14, borderWidth: pay.method === m ? 2 : 1.5, borderColor: pay.method === m ? C.ink : C.line, backgroundColor: C.white, justifyContent: 'flex-start' }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: pay.method === m ? C.ink : 'transparent' }} /></View>
            <Txt style={{ fontSize: 14 }}>{m}</Txt>
          </Btn>
        ))}
        <Txt style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>약관 동의</Txt>
        {agree.map((l, i) => { const on = i === 0 ? all : !!pay.agree[i - 1]; return (
          <Btn key={l} onPress={() => S(st => ({ pay: { ...st.pay!, agree: i === 0 ? st.pay!.agree.map(() => (all ? 0 : 1)) : st.pay!.agree.map((v, j) => (j === i - 1 ? (v ? 0 : 1) : v)) } }))}
            style={{ flexDirection: 'row', gap: 10, minHeight: 38, justifyContent: 'flex-start', borderTopWidth: i === 1 ? 1 : 0, borderTopColor: C.line }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.ink : '#FFFFFF' }}><Txt style={{ fontSize: 13, fontWeight: '700', color: C.bg, fontFamily: undefined }}>{on ? '✓' : ''}</Txt></View>
            <Txt style={{ fontSize: 13, fontWeight: i ? '400' : '700', flexShrink: 1 }}>{l}</Txt>
          </Btn>); })}
        <Primary label={all ? won(amt) + ' 결제하기' : '약관에 동의해 주세요'} bg={all ? C.ink : C.disabled} style={{ marginTop: 8 }} onPress={() => { if (!all) return; if (pk) return getS().buyChuru(pay.pack!); getS().sponsor(); S({ pay: null }); }} />
        <Txt style={{ fontSize: 11, color: C.mute, textAlign: 'center' }}>데모 결제예요. 실제로 돈이 나가지 않아요.</Txt>
      </ScrollView>
    </Scrim>
  );
}

// ── 츄르 충전 ── 츄르 배지 · 메뉴 › 츄르 충전 · 츄르가 모자랄 때 열린다. 상품을 고르면 결제창(PaySheet)으로
export function ChuruShop() {
  const C = useC();
  const churu = useApp(s => s.churu);
  const methods = ios ? 'Apple Pay' : 'Google Play 결제';
  return (
    <Scrim z={8} align="bottom" dim={0.5} onClose={() => S({ churuShop: false })}>
      <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}>
        <Grab />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt jua style={{ fontSize: 20 }}>츄르 충전</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 10, height: 10, transform: [{ rotate: '45deg' }], backgroundColor: '#E59A4C', borderWidth: 1.5, borderColor: C.ink }} /><Txt jua style={{ fontSize: 15 }}>{'보유 ' + churu}</Txt></View>
        </View>
        <Txt style={{ fontSize: 12, lineHeight: 18, color: C.sub }}>츄르는 집중하면 모을 수 있어요. 더 빨리 모으고 싶을 때 충전해요.</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {CHURU_PACKS.map(([n, bonus, price], i) => (
            <Btn key={n} onPress={() => S({ churuShop: false, pay: { method: methods, agree: [0, 0], pack: i } })} accessibilityLabel={'츄르 ' + (n + bonus) + '개, ' + won(price)}
              style={{ width: '47%', flexGrow: 1, alignItems: 'flex-start', gap: 4, padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: bonus ? C.ink : C.line, backgroundColor: bonus ? C.chip1 : C.card }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {Array.from({ length: Math.min(4, i + 1) }, (_, k) => <View key={k} style={{ width: 9, height: 9, marginLeft: k ? -3 : 0, transform: [{ rotate: '45deg' }], backgroundColor: '#E59A4C', borderWidth: 1.2, borderColor: C.ink }} />)}
              </View>
              <Txt jua style={{ fontSize: 18 }}>{n.toLocaleString('ko-KR') + ' 츄르'}</Txt>
              <Txt style={{ fontSize: 11, color: bonus ? '#C9772F' : C.sub }}>{bonus ? '+ 보너스 ' + bonus : ' '}</Txt>
              <View style={{ alignSelf: 'stretch', marginTop: 4, height: 32, borderRadius: 16, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}><Txt jua style={{ fontSize: 14, color: C.bg }}>{won(price)}</Txt></View>
            </Btn>
          ))}
        </View>
        <Txt style={{ fontSize: 11, color: C.mute, textAlign: 'center' }}>{IS_FULL ? '스토어 결제를 준비하고 있어요' : '데모 결제예요. 실제로 돈이 나가지 않아요.'}</Txt>
      </View>
    </Scrim>
  );
}

// ── 고양이 얼룩 ── 홈의 "얼룩" 버튼으로 연다. 지금 함께하는 고양이의 얼룩을 보고 츄르로 다시 뽑는다
export function SpotPop() {
  const C = useC();
  const id = useApp(st => st.catId), seed = useApp(st => spotSeed(st, id)), churu = useApp(st => st.churu);
  const cat = catById(id), sp = spotsOf(seed, paletteOf(id).B);
  const [iw, ih] = CUT_DIM[id] || [580, 560], k = Math.min(150 / iw, 150 / ih), w = Math.round(iw * k), h = Math.round(ih * k);
  const close = () => S({ spotPop: false });
  return (
    <Scrim z={8} dim={0.5} onClose={close}>
      <Anim name="pop" dur={0.35} loop={false} easing={EZ.out} style={{ backgroundColor: C.bg, borderRadius: 24, borderWidth: 2, borderColor: C.ink, padding: 20, gap: 12, alignItems: 'center' }}>
        <Txt jua style={{ fontSize: 20 }}>{cat.name + '의 얼룩'}</Txt>
        <View style={{ width: 170, height: 170, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 }}>
          <View style={{ width: w, height: h }}>
            <Image source={CUTOUT[id]} accessibilityLabel={cat.name + ' · ' + sp.name} style={{ width: w, height: h }} />
            <CatSpots id={id} w={w} h={h} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: sp.color, borderWidth: 1.5, borderColor: C.ink }} />
          <Txt style={{ fontSize: 13, color: C.sub }}>{sp.name + ' · 고양이마다 랜덤으로 생겨요'}</Txt>
        </View>
        <Txt style={{ fontSize: 12, lineHeight: 18, color: C.sub, textAlign: 'center' }}>{'홈 방과 집중 화면의 고양이에 보여요.\n도감은 원래 그림 그대로예요.'}</Txt>
        <Primary h={48} fs={16} style={{ alignSelf: 'stretch' }} label={'얼룩 다시 뽑기 · ' + SPOT_COST + ' 츄르'} onPress={() => (churu < SPOT_COST ? getS().needChuru(SPOT_COST - churu) : S({ dlg: { kind: 'spots' } }))} />
        <Btn onPress={close} style={{ alignSelf: 'stretch', height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.ink }}><Txt jua style={{ fontSize: 15 }}>닫기</Txt></Btn>
      </Anim>
    </Scrim>
  );
}

// ── 영수증 · 누적 증명서 ──
export function Receipt() {
  const C = useC();
  const s = useApp(st => st);
  const rec = s.sponsorships.filter(r => !r.refunded);
  const rows = s.rcpt === 'cum' ? rec.map(r => [r.animal + ' · ' + r.kind + ' 후원', r.kg + 'kg']).concat([['집중 목표 기부 (파트너)', (s.donated / 10).toFixed(1) + 'kg']]) : rec.filter(r => r.won).map(r => [r.animal + ' 후원 (' + r.date + ')', r.amt]);
  const total = s.rcpt === 'cum' ? dkg(s) + 'kg' : won(rec.reduce((a, r) => a + (r.won || 0), 0));
  return (
    <Scrim z={8} dim={0.6} onClose={() => S({ rcpt: null })}>
      <Anim name="pop" dur={0.4} loop={false} easing={EZ.out} style={{ backgroundColor: C.bg, borderRadius: 20, borderWidth: 2, borderColor: C.ink, padding: 18, gap: 10 }}>
        <Txt jua style={{ fontSize: 22, textAlign: 'center' }}>{s.rcpt === 'cum' ? '누적 후원 증명서' : '기부 영수증'}</Txt>
        <Txt style={{ fontSize: 12, color: C.sub, textAlign: 'center' }}>{s.user.name + ' 님 · ' + (s.rcpt === 'cum' ? '집중과 후원의 누적 기록' : '결제 후원 내역 (예시)')}</Txt>
        <View style={{ borderTopWidth: 1.5, borderBottomWidth: 1.5, borderStyle: 'dashed', borderColor: C.sub, paddingVertical: 8, gap: 6 }}>
          {(rows.length ? rows : [['내역이 없어요', '-']]).map(([a, b], i) => <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Txt style={{ fontSize: 13, flexShrink: 1 }}>{a}</Txt><Txt style={{ fontSize: 13 }}>{b}</Txt></View>)}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt jua style={{ fontSize: 16 }}>합계</Txt><Txt jua style={{ fontSize: 16 }}>{total}</Txt></View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn onPress={() => S({ rcpt: null })} style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 15 }}>닫기</Txt></Btn>
          <Btn onPress={async () => {
            const title = s.rcpt === 'cum' ? '누적 후원 증명서' : '기부 영수증', d = new Date();
            const html = receiptHtml({ title, sub: s.user.name + ' 님 · ' + (s.rcpt === 'cum' ? '집중과 후원의 누적 기록' : '결제 후원 내역'), rows: rows.length ? rows : [['내역이 없어요', '-']], total, issued: `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}` });
            try { const ok = await sharePdf(html, title); S({ rcpt: null }); if (!ok) getS().toast('이 기기에서는 PDF를 공유할 수 없어요'); } catch { getS().toast('PDF를 만들지 못했어요'); }
          }} style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 15, color: C.bg }}>PDF로 저장</Txt></Btn>
        </View>
      </Anim>
    </Scrim>
  );
}

// ── 광고 (데모) ──
export function AdView() {
  const C = useC();
  const ad = useApp(s => s.ad)!;
  useEffect(() => { const t = setInterval(() => { const a = getS().ad; if (a == null || a <= 0) { clearInterval(t); return; } S({ ad: a - 1 }); }, 1000); return () => clearInterval(t); }, []);
  const claim = () => { getS().log('광고 시청 보상', 5); sfx('coin'); S(st => ({ ad: null, adLeft: st.adLeft - 1, churu: st.churu + 5, earnedTotal: st.earnedTotal + 5 })); getS().toast('츄르 5개를 받았어요'); };
  return (
    <View style={[FULL, { zIndex: 10, backgroundColor: '#2B221D', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }]}>
      <Txt style={{ fontSize: 12, color: C.line }}>광고 (데모)</Txt>
      <View style={{ width: 240, height: 150, borderRadius: 16, backgroundColor: '#3A2F28', alignItems: 'center', justifyContent: 'center' }}><Txt style={{ fontSize: 12, color: '#E2D4BD' }}>광고 영상 자리</Txt></View>
      <Txt jua style={{ fontSize: 40, color: '#FBF6EE' }}>{ad > 0 ? ad + '초' : '완료'}</Txt>
      <Txt style={{ fontSize: 13, color: '#E2D4BD' }}>{ad > 0 ? '끝까지 보면 츄르 5개를 받아요' : '시청 완료!'}</Txt>
      <Btn onPress={ad > 0 ? () => S({ ad: null }) : claim} style={{ height: 50, paddingHorizontal: 28, borderRadius: 25, backgroundColor: ad > 0 ? C.sub : '#E59A4C' }}><Txt jua style={{ fontSize: 16, color: C.bg }}>{ad > 0 ? '닫기 (보상 없음)' : '츄르 5개 받기'}</Txt></Btn>
    </View>
  );
}

// ── 알림창 ──
export function Dialog() {
  const C = useC();
  const s = useApp(st => st);
  const D = s.dlg!, cat = catById(s.catId);
  const close = () => S({ dlg: null });
  const mm = Math.floor(Math.ceil(s.remain) / 60);
  type B = [string, 'primary' | 'ghost' | 'danger', () => void];
  const toLogin = () => S({ dlg: null, screen: 'login', menuPage: null, emailMode: false, loggedIn: false });
  const M: Record<string, () => { cat?: boolean; title: string; lines: string[]; btns: B[] }> = {
    unlink: () => ({ title: D.name + ' 연결을 해제할까요?', lines: ['해제하면 이 계정으로는 로그인할 수 없어요.', '다른 연결 계정이 있어 기록은 그대로 유지돼요.'], btns: [['취소', 'ghost', close], ['연결 해제', 'danger', async () => {
      if (IS_FULL && authEnabled) { try { const r = await unlinkProvider(D.name!); if (r) S({ linked: r.linked, dlg: null }); else close(); } catch (e: any) { close(); getS().toast(e?.message || '해제하지 못했어요'); } return; }
      S(st => ({ dlg: null, linked: { ...st.linked, [D.name!]: false } }));
    }]] }),
    withdraw: () => ({ title: '정말 탈퇴할까요?', lines: ['고양이와 츄르, 기록이 모두 삭제돼요.', '이 작업은 되돌릴 수 없어요.'], btns: [['취소', 'ghost', close], ['탈퇴하기', 'danger', async () => {
      if (IS_FULL && authEnabled) { try { stopSync(); await deleteRemote(); await deleteAccount(); } catch (e: any) { close(); return getS().toast(e?.message || '탈퇴하지 못했어요'); } }
      S({ dlg: { kind: 'bye' } });
    }]] }),
    bye: () => ({ title: '탈퇴가 완료됐어요', lines: ['그동안 고마웠어요. 고양이도 기억할게요.'], btns: [['처음으로', 'primary', () => { getS().reset(); S({ dlg: null }); }]] }),
    expired: () => ({ title: '로그인이 만료됐어요', lines: ['보안을 위해 다시 로그인해 주세요.', '진행 중이던 기록은 안전하게 저장돼 있어요.'], btns: [['다시 로그인', 'primary', toLogin]] }),
    conflict: () => ({ title: '이미 연결된 계정이에요', lines: ['이 Apple 계정은 다른 냥집중 계정에 연결돼 있어요.', '그 계정으로 전환하면 지금 기록은 이 기기에서 보이지 않아요.'], btns: [['취소', 'ghost', close], ['그 계정으로 전환', 'primary', () => { close(); getS().toast('계정을 전환했어요 (데모)'); }]] }),
    refund: () => { const r = s.sponsorships.find(x => x.id === D.id); return { title: (r ? r.animal : '') + ' 후원 환불을 요청할까요?', lines: ['전달 전이라면 영업일 3일 안에 환불돼요.', '환불을 요청하면 인증서가 취소돼요.'], btns: [['닫기', 'ghost', close], ['환불 요청', 'danger', () => { S(st => ({ dlg: null, sponsorships: st.sponsorships.map(x => (x.id === D.id ? { ...x, refunded: true } : x)) })); getS().toast('환불을 요청했어요'); }]] }; },
    nochuru: () => ({ title: '츄르가 ' + (D.id ?? 0) + '개 더 필요해요', lines: ['집중하면 츄르를 모을 수 있어요.', '지금 바로 충전할 수도 있어요.'], btns: [['츄르 충전하기', 'primary', () => S({ dlg: null, churuShop: true, gachaPop: null })], ['닫기', 'ghost', close]] }),
    spots: () => ({ cat: true, title: cat.name + '의 얼룩을 다시 뽑을까요?', lines: ['츄르 ' + SPOT_COST + '개로 새 얼룩이 랜덤으로 생겨요.', '지금 얼룩으로는 되돌릴 수 없어요.'], btns: [['취소', 'ghost', close], ['다시 뽑기', 'primary', () => { close(); getS().rerollSpots(cat.id); }]] }),
    refundinfo: () => ({ title: '취소·환불 안내', lines: ['결제 후원은 보호소로 전달되기 전(7일 이내)에 환불할 수 있어요.', '전달이 끝난 후원은 환불할 수 없어요.', '츄르 후원은 환불되지 않아요.', '그 밖의 문의는 문의하기에서 남겨 주세요.'], btns: [['확인', 'primary', close]] }),
    call: () => ({ cat: true, title: '전화가 왔어요', lines: ['집중 시간이 잠시 멈췄어요.', '통화 중에는 벌점이 없어요.'], btns: [['받기', 'primary', () => S({ dlg: { kind: 'incall' } })], ['거절', 'ghost', () => { close(); getS().resumeTimer(); }]] }),
    incall: () => ({ title: '통화 중', lines: ['타이머가 멈춰 있어요.'], btns: [['통화 종료', 'primary', () => { close(); getS().resumeTimer(); getS().toast('집중을 이어가요'); }]] }),
    alarm: () => ({ title: '알람이 울려요', lines: ['집중 시간이 잠시 멈췄어요.'], btns: [['알람 끄기', 'primary', () => { close(); getS().resumeTimer(); getS().toast('집중을 이어가요'); }]] }),
    recover: () => ({ cat: true, title: '집중이 중단됐어요', lines: ['앱이 종료되기 전에 ' + mm + '분이 남아 있었어요.', '3분 안에 돌아오면 벌점 없이 이어갈 수 있어요.'], btns: [
      ['이어서 집중하기', 'primary', () => { S({ dlg: null, screen: 'focus' }); hooks.onStart?.(getS()); }],
      ['이번엔 쉬기', 'ghost', () => { S({ dlg: null, remain: 0, total: 0, screen: 'tabs' }); getS().toast('벌점 없이 종료했어요'); }]] }),
    update: () => ({ title: '새 버전 ' + (s.update?.tag ?? '') + '이 나왔어요', lines: ['지금 버전 ' + APP_VERSION + ' → ' + (s.update?.tag ?? '').replace(/^v/, ''), ios ? '눌러서 릴리스 페이지에서 새 버전을 받아요.' : '받은 APK를 설치하면 기록은 그대로 이어져요.'], btns: [
      ['지금 업데이트', 'primary', () => { close(); openUpdate(); }], ['나중에', 'ghost', close]] }),
    permlost: () => ({ title: '권한이 꺼져 있어요', lines: ['방해 앱을 막으려면 다시 허용해야 해요.', '설정 → ' + (ios ? '스크린 타임' : '사용 정보 접근') + ' → 냥집중 켜기'], btns: [
      ['설정 열기', 'primary', () => { if (blocker.available) { close(); blocker.openUsage(); return; } S({ dlg: null, perm: { a: true, b: true } }); getS().toast('권한이 다시 켜졌어요'); }], ['나중에', 'ghost', close]] }),
  };
  const v = M[D.kind]?.(); if (!v) return null;
  return (
    <View style={[FULL, { zIndex: 11, backgroundColor: 'rgba(43,34,29,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Anim name="pop" dur={0.35} loop={false} easing={EZ.out} style={{ width: '100%', backgroundColor: C.bg, borderRadius: 24, borderWidth: 2, borderColor: C.ink, padding: 20, alignItems: 'center', gap: 10 }}>
        {v.cat && <CatFace cat={cat} size={84} />}
        <Txt jua style={{ fontSize: 20, textAlign: 'center' }}>{v.title}</Txt>
        <View style={{ gap: 4 }}>{v.lines.map(l => <Txt key={l} style={{ fontSize: 13, lineHeight: 20, color: C.body, textAlign: 'center' }}>{l}</Txt>)}</View>
        <View style={{ gap: 8, width: '100%', marginTop: 6 }}>
          {v.btns.map(([l, k, f]) => <Btn key={l} onPress={f} style={{ height: 48, borderRadius: 24, borderWidth: k === 'ghost' ? 1.5 : 0, borderColor: C.ink, backgroundColor: k === 'primary' ? C.ink : k === 'danger' ? C.red : C.bg }}>
            <Txt jua style={{ fontSize: 16, color: k === 'ghost' ? C.ink : C.bg }}>{l}</Txt></Btn>)}
        </View>
      </Anim>
    </View>
  );
}

// ── 첫 사용 코치마크 ──
const CO = [['고양이 방', '탭하면 우리 집 전체를 평면도로 볼 수 있어요. 방 꾸미기는 오른쪽 아래 버튼으로 들어가요.'], ['집중 설정', '시계를 누르면 종료 시각과 휴식 주기를 한 창에서 정해요.'], ['차단 제외 앱', '집중하는 동안에도 쓸 앱을 골라요. 나머지 방해 앱은 막아요.'], ['집중 시작', '시작하면 고양이가 옆에서 지켜봐요. 완료하면 츄르와 친밀도를 받아요.']];
export function Coach({ height }: { height: number }) {
  const C = useC();
  const n = useApp(s => s.coach);
  const [r, setR] = useState<{ l: number; t: number; w: number; h: number } | null>(null);
  useEffect(() => {
    const el = coachRefs.items[n], sc = coachRefs.scroll, root = coachRefs.root;
    if (!el || !root) return;
    const t1 = setTimeout(() => {
      const inner = (sc as any)?.getInnerViewNode?.();
      const measure = () => root.measureInWindow((rx, ry) => el.measureInWindow((x, y, w, h) => setR({ l: x - rx - 4, t: y - ry - 4, w: w + 8, h: h + 8 })));
      if (sc && inner) (el as any).measureLayout(inner, (_x: number, y: number) => { sc.scrollTo({ y: Math.max(0, y - 70), animated: false }); setTimeout(measure, 160); }, measure);
      else measure();
    }, 120);
    return () => clearTimeout(t1);
  }, [n]);
  const done = () => S({ coach: -1, coachSeen: true });
  const next = () => (n >= 3 ? done() : S({ coach: n + 1 }));
  if (!r) return <View style={[FULL, { zIndex: 9, backgroundColor: 'rgba(43,34,29,0.66)' }]} />;
  const dim = 'rgba(43,34,29,0.66)', ty = r.t > height * 0.47 ? r.t - 170 : r.t + r.h + 14;
  return (
    <View style={[FULL, { zIndex: 9 }]}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(0, r.t), backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: r.t + r.h, bottom: 0, backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: 0, width: Math.max(0, r.l), top: r.t, height: r.h, backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: r.l + r.w, right: 0, top: r.t, height: r.h, backgroundColor: dim }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: r.l, top: r.t, width: r.w, height: r.h, borderRadius: 18, borderWidth: 2, borderColor: '#E59A4C' }} />
      <View style={{ position: 'absolute', left: 16, right: 16, top: Math.max(8, ty), backgroundColor: C.bg, borderRadius: 18, borderWidth: 2, borderColor: C.ink, padding: 14, gap: 6 }}>
        <Txt style={{ fontSize: 11, color: C.sub }}>{(n + 1) + ' / 4'}</Txt>
        <Txt jua style={{ fontSize: 17 }}>{CO[n][0]}</Txt>
        <Txt style={{ fontSize: 13, lineHeight: 20, color: C.body }}>{CO[n][1]}</Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Btn onPress={done}><Txt style={{ fontSize: 13, color: C.sub }}>건너뛰기</Txt></Btn>
          <Btn onPress={next} style={{ height: 38, paddingHorizontal: 20, borderRadius: 19, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 15, color: C.bg }}>{n === 3 ? '시작하기' : '다음'}</Txt></Btn>
        </View>
      </View>
    </View>
  );
}

// ── 공유 카드 ──
export function ShareCard() {
  const C = useC();
  const s = useApp(st => st);
  const ref = useRef<View>(null);
  const cat = catById(s.catId), last = s.last!;
  const save = async () => {
    if (Platform.OS !== 'web') {
      try { const uri = await captureRef(ref, { format: 'png', quality: 1 }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '냥집중 공유 카드' }); S({ share: false }); return; } catch {}
    }
    S({ share: false }); getS().toast('공유 카드를 저장했어요 (데모)');
  };
  return (
    <Scrim z={8} dim={0.6} onClose={() => S({ share: false })}>
      <View style={{ gap: 12 }}>
        <Anim name="pop" dur={0.4} loop={false} easing={EZ.out}>
          <View ref={ref} collapsable={false} style={{ borderRadius: 24, backgroundColor: '#F6E3C9', borderWidth: 2, borderColor: '#4A3428', paddingVertical: 24, paddingHorizontal: 18, alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%', backgroundColor: '#FBF6EE' }} />
            <Txt style={{ fontSize: 12, color: '#7A6352' }}>{last.tag + ' · 오늘의 집중'}</Txt>
            <CatFace cat={cat} size={96} bg="#FBF6EE" style={{ borderColor: '#4A3428' }} />
            <Txt jua style={{ fontSize: 32, color: '#4A3428' }}>{last.min + '분 집중 완료'}</Txt>
            <Txt style={{ fontSize: 13, color: '#4A3428' }}>{cat.name + ' · 지금 표정 ' + MOODS[Math.min(5, Math.floor(affOf(s) / 20))]}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
              {[['+' + last.churu, '츄르'], [focusStreak(s) + '일', '연속 집중'], [dkg(s) + 'kg', '전한 사료']].map(([v, k]) => (
                <View key={k} style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center' }}><Txt jua style={{ fontSize: 18, color: '#4A3428' }}>{v}</Txt><Txt style={{ fontSize: 11, color: '#7A6352' }}>{k}</Txt></View>
              ))}
            </View>
            <Txt jua style={{ fontSize: 14, marginTop: 4, color: '#4A3428' }}>냥집중 · 집중하면 고양이가 자라요</Txt>
          </View>
        </Anim>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn onPress={() => S({ share: false })} style={{ flex: 1, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 15 }}>닫기</Txt></Btn>
          <Btn onPress={save} style={{ flex: 1, height: 46, borderRadius: 23, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 15, color: C.bg }}>{Platform.OS === 'web' ? '이미지 저장' : '이미지 공유'}</Txt></Btn>
        </View>
      </View>
    </Scrim>
  );
}

// ── 후원 인증서 ──
export function Cert() {
  const C = useC();
  const s = useApp(st => st);
  const rec = s.sponsorships.find(r => r.id === s.cert); if (!rec) return null;
  const cat = catById(s.catId);
  return (
    <Scrim z={7} dim={0.6} onClose={() => S({ cert: null })}>
      <Anim name="pop" dur={0.5} loop={false} easing={EZ.out} style={{ backgroundColor: C.bg, borderRadius: 20, padding: 10 }}>
        <View style={{ borderWidth: 2, borderColor: C.ink, borderRadius: 14, padding: 6 }}>
          <View style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C9772F', borderRadius: 10, paddingVertical: 22, paddingHorizontal: 16, alignItems: 'center', gap: 10 }}>
            <Txt style={{ fontSize: 11, color: C.mute, letterSpacing: 1 }}>{'후원 인증서 · No. ' + String(rec.id).slice(-6)}</Txt>
            <Txt jua style={{ fontSize: 26 }}>고마운 마음 인증서</Txt>
            <CatFace cat={cat} size={100} />
            <Txt style={{ fontSize: 14, lineHeight: 23, textAlign: 'center' }}><Txt style={{ fontSize: 14, fontWeight: '700' }}>{s.user.name}</Txt>{` 님은\n${rec.shelter}의 `}<Txt style={{ fontSize: 14, fontWeight: '700' }}>{rec.animal}</Txt>{`에게\n${rec.amt} 후원으로 사료 ${rec.kg}kg을 전했어요.`}</Txt>
            <Txt style={{ fontSize: 12, color: C.sub }}>{rec.date + ' · ' + cat.name + '와(과) 함께'}</Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, paddingTop: 12, paddingHorizontal: 4, paddingBottom: 4 }}>
          <Btn onPress={() => S({ cert: null })} style={{ flex: 1, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 15 }}>닫기</Txt></Btn>
          <Btn onPress={() => S({ cert: null, tab: 'mail', screen: 'tabs' })} style={{ flex: 1, height: 46, borderRadius: 23, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 15, color: C.bg }}>우편함 확인</Txt></Btn>
        </View>
      </Anim>
    </Scrim>
  );
}

// ── 새 고양이 등장 ──
// 고양이 뽑기 창: 일반 뽑기(기본 고양이) · Plus 전용 뽑기(Plus 구독 전용 고양이 14종), 1회 · 10회
export function GachaPop() {
  const C = useC();
  const s = useApp(st => st);
  const kind = s.gachaPop!, plus = kind === 'plus', cost = GACHA_COST[kind];
  const cats = plus ? GACHA_CATS : CATS.filter(c => !c.plus);
  const met = cats.filter(c => s.owned.includes(c.id)).length, left = GACHA_PITY - s.gachaPity;
  const locked = plus && !s.plus;
  const btn = (n: 1 | 10) => {
    const price = n === 10 ? cost.ten : cost.one, ok = s.churu >= price;
    return (
      <Btn key={n} onPress={() => getS().gachaPull(kind, n)} accessibilityLabel={(plus ? 'Plus 전용 뽑기 ' : '일반 뽑기 ') + n + '회, 츄르 ' + price + '개'} style={{ flex: 1, height: 54, borderRadius: 27, backgroundColor: ok ? C.ink : C.disabled, gap: 0 }}>
        <Txt jua style={{ fontSize: 17, color: C.bg }}>{n + '회 뽑기'}</Txt>
        <Txt style={{ fontSize: 11, color: C.bg }}>{price + ' 츄르' + (n === 10 ? ' (10% 할인)' : '')}</Txt>
      </Btn>
    );
  };
  return (
    <Pressable onPress={() => S({ gachaPop: null })} accessibilityLabel="고양이 뽑기 닫기" style={[FULL, { zIndex: 5, backgroundColor: 'rgba(43,34,29,0.55)', alignItems: 'center', justifyContent: 'center', padding: 18 }]}>
      <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 440, backgroundColor: C.bg, borderRadius: 28, borderWidth: 2, borderColor: C.ink, padding: 18, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt jua style={{ fontSize: 21 }}>고양이 뽑기</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ChuruBadge n={s.churu} small />
            <Btn onPress={() => S({ gachaPop: null })} accessibilityLabel="닫기" hitSlop={8} style={{ width: 36, height: 36 }}><Txt style={{ fontSize: 20 }}>✕</Txt></Btn>
          </View>
        </View>
        <Seg items={[['basic', '일반 뽑기'], ['plus', 'Plus 전용 뽑기']]} value={kind} onPick={k => S({ gachaPop: k })} h={38} />
        <View style={{ padding: 14, borderRadius: 18, backgroundColor: plus ? '#F6E3C9' : C.card, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt jua style={{ fontSize: 16, color: plus ? '#4A3428' : C.ink }}>{plus ? 'Plus 구독 전용 고양이 ' + cats.length + '종' : '기본 고양이 ' + cats.length + '종'}</Txt>
            <Txt style={{ fontSize: 12, color: plus ? '#6B5444' : C.sub }}>{met + '/' + cats.length + ' 만남'}</Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {cats.map(c => s.owned.includes(c.id) ? <CatFace key={c.id} cat={c} size={plus ? 34 : 44} border={1.5} />
              : <View key={c.id} style={{ width: plus ? 34 : 44, height: plus ? 34 : 44, borderRadius: 22, borderWidth: 1.5, borderColor: plus ? '#C9B79F' : C.line, backgroundColor: plus ? '#EAD8BF' : C.card2, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={CUTOUT[c.id]} resizeMode="contain" style={{ width: '78%', height: '78%', tintColor: '#4A3428', opacity: 0.3 }} /></View>)}
          </View>
          <Txt style={{ fontSize: 11, lineHeight: 17, color: plus ? '#6B5444' : C.sub }}>{plus
            ? `확률 · 일반 ${TIER[1].rate}% · 희귀 ${TIER[2].rate}% · 전설 ${TIER[3].rate}%\n${left <= 1 ? '다음 뽑기는 희귀 이상 보장!' : `희귀 이상 보장까지 ${left}번`} · 이미 만난 고양이는 츄르로 돌려받아요 (일반 ${TIER[1].refund} · 희귀 ${TIER[2].refund} · 전설 ${TIER[3].refund})`
            : `기본 고양이 중 한 마리가 같은 확률로 나와요.\n이미 만난 고양이는 츄르 ${TIER[1].refund}개로 돌려받아요.`}</Txt>
        </View>
        {locked
          ? <View style={{ gap: 8 }}>
            <Txt style={{ fontSize: 13, color: C.sub, textAlign: 'center' }}>Plus 구독 중에만 뽑을 수 있어요. 만난 고양이는 도감에서 볼 수 있어요.</Txt>
            <Primary h={52} label="Plus 구독하고 뽑기" bg="#C9772F" onPress={() => S({ gachaPop: null, tab: 'menu', menuPage: PG.plus, prevTab: 'gacha' })} />
          </View>
          : <View style={{ flexDirection: 'row', gap: 8 }}>{btn(1)}{btn(10)}</View>}
      </Pressable>
    </Pressable>
  );
}

// 뽑기 결과: 1회는 크게, 10회는 5×2 칸. 새로 만난 고양이에는 NEW, 이미 만난 고양이는 돌려받은 츄르를 보여준다.
export function GachaResult() {
  const C = useC();
  const { width: sw } = useWindowDimensions();
  const res = useApp(s => s.gachaRes)!;
  const one = res.length === 1, first = res[0];
  const newOnes = res.filter(r => !r.dup);
  const close = () => S({ gachaRes: null });
  const cell = Math.floor((Math.min(440, sw - 36) - 36 - 4 * 6) / 5); // 카드 안쪽 폭(패딩 · 테두리 제외)을 5칸으로
  const card = (r: (typeof res)[number], i: number, big: boolean) => {
    const c = catById(r.id), t = TIER[r.tier], sz = big ? 212 : cell - 4, plusCat = !!c.tier;
    return (
      <Anim key={i} name="pop" dur={0.45} delay={big ? 0 : i * 0.08} loop={false} easing={EZ.out} style={{ width: big ? '100%' : cell, alignItems: 'center', gap: big ? 8 : 2, opacity: 0 }}>
        <View style={{ borderRadius: big ? 28 : 12, borderWidth: 2, borderColor: plusCat ? t.color : C.ink, overflow: 'hidden' }}>
          <CatFace cat={c} size={sz} border={0} round={false} bg={C.card} />
          {r.tier === 3 && <View style={{ position: 'absolute', left: 4, right: 4, top: 4, bottom: 4, borderRadius: big ? 22 : 9, borderWidth: 2, borderStyle: 'dashed', borderColor: '#FFF3E0' }} />}
          {!r.dup && <View style={{ position: 'absolute', top: big ? 10 : 2, right: big ? 10 : 2, paddingHorizontal: big ? 6 : 3, paddingVertical: big ? 1 : 0, borderRadius: 8, backgroundColor: '#E07F7F' }}><Txt jua style={{ fontSize: big ? 13 : 8, color: '#FFFFFF' }}>NEW</Txt></View>}
        </View>
        <Txt jua numberOfLines={1} style={{ fontSize: big ? 24 : 10 }}>{c.name}</Txt>
        {plusCat && <View style={{ paddingHorizontal: big ? 8 : 4, paddingVertical: big ? 1 : 0, borderRadius: 8, backgroundColor: t.color }}><Txt style={{ fontSize: big ? 12 : 9, color: '#2B221D' }}>{t.name}</Txt></View>}
        {r.dup ? <Txt style={{ fontSize: big ? 13 : 9, color: C.sub, textAlign: 'center' }}>{big ? '이미 만났어요 · 츄르 +' + t.refund : '츄르 +' + t.refund}</Txt>
          : big ? <Txt style={{ fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 19 }}>{c.desc}</Txt> : null}
      </Anim>
    );
  };
  return (
    <View style={[FULL, { zIndex: 7, backgroundColor: 'rgba(43,34,29,0.6)', alignItems: 'center', justifyContent: 'center', padding: 18 }]}>
      <View style={{ width: '100%', maxWidth: 440, backgroundColor: C.bg, borderRadius: 28, borderWidth: 2, borderColor: C.ink, padding: 16, alignItems: 'center', gap: 14 }}>
        <Txt jua style={{ fontSize: 18 }}>{one ? '뽑기 결과' : `뽑기 결과 · 새 고양이 ${newOnes.length}마리`}</Txt>
        {one ? card(first, 0, true) : <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 10, justifyContent: 'center' }}>{res.map((r, i) => card(r, i, false))}</View>}
        <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
          {one && !first.dup ? <>
            <Btn onPress={close} style={{ flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 16 }}>도감에 두기</Txt></Btn>
            <Btn onPress={() => S({ catId: first.id, gachaRes: null, gachaPop: null })} style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 16, color: C.bg }}>함께 지내기</Txt></Btn>
          </> : <Btn onPress={close} style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 16, color: C.bg }}>확인</Txt></Btn>}
        </View>
      </View>
    </View>
  );
}

export function Toast({ bottom }: { bottom: number }) {
  const msg = useApp(s => s.toastMsg), house = useApp(s => s.house);
  if (!msg || house) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom, alignItems: 'center', zIndex: 30 }}>
      <Anim key={msg} name="rise" dur={0.3} loop={false} easing={EZ.out} style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#2B221D', maxWidth: '90%' }}>
        <Txt style={{ fontSize: 13, color: '#FBF6EE', textAlign: 'center' }}>{msg}</Txt>
      </Anim>
    </View>
  );
}
void APPS; void IS_DEMO;
