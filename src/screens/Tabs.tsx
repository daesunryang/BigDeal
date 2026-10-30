import React, { useEffect } from 'react';
import { Image, Platform, ScrollView, View } from 'react-native';
import { IS_DEMO } from '../config';
import { ALL_CATS, ANIMALS, BEH, CATS, DECOR, GACHA_CATS, GACHA_COST, GACHA_PITY, SONGS, TIER, DECOR_KINDS, FEED, FLOOR, PG, SHD, SHELTER_META, SWATCH, WALL, catById, reward, won } from '../data';
import { dkg, focusStreak, todayMin, weekLabels, weekVals } from '../derive';
import { S, baseLeft, getS, listOf, useApp } from '../store';
import { sfx } from '../sfx';
import { useC } from '../theme';
import { useScrollMemory } from '../ui/scrollMemory';
import { Bar, Btn, CUTOUT, CatFace, FACE, Chip, ChuruBadge, FillView, Header, PhotoSlot, Primary, Seg, Txt } from '../ui/kit';

const pad = { paddingTop: 8, paddingHorizontal: 18, paddingBottom: 18 };
const back = () => { getS().back(); };

// 고양이 뽑기 상자: 1회 · 5회, 확률과 보장 안내
function GachaBox() {
  const C = useC();
  const s = useApp(st => st);
  const left = GACHA_PITY - s.gachaPity;
  const btn = (n: 1 | 5) => {
    const cost = n === 5 ? GACHA_COST.five : GACHA_COST.one, ok = s.churu >= cost;
    return (
      <Btn key={n} onPress={() => getS().gachaPull(n)} accessibilityLabel={'고양이 뽑기 ' + n + '회, 츄르 ' + cost + '개'} style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: ok ? C.ink : C.disabled, gap: 0 }}>
        <Txt jua style={{ fontSize: 16, color: C.bg }}>{n + '회 뽑기'}</Txt>
        <Txt style={{ fontSize: 11, color: C.bg }}>{cost + ' 츄르' + (n === 5 ? ' (10% 할인)' : '')}</Txt>
      </Btn>
    );
  };
  return (
    <View style={{ gap: 10, padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.chip1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flexDirection: 'row', marginRight: 2 }}>{GACHA_CATS.filter(c => c.tier === 3).map((c, i) => <CatFace key={c.id} cat={c} size={32} border={1.5} style={{ marginLeft: i ? -10 : 0 }} />)}</View>
        <View style={{ flex: 1 }}>
          <Txt jua style={{ fontSize: 18 }}>고양이 뽑기</Txt>
          <Txt style={{ fontSize: 12, color: C.sub }}>{'집중해서 모은 츄르로 뽑기 전용 고양이 ' + GACHA_CATS.length + '종을 만나요'}</Txt>
        </View>
        <ChuruBadge n={s.churu} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>{btn(1)}{btn(5)}</View>
      <Txt style={{ fontSize: 11, lineHeight: 16, color: C.sub }}>{`확률 · 일반 ${TIER[1].rate}% · 희귀 ${TIER[2].rate}% · 전설 ${TIER[3].rate}%\n${left <= 1 ? '다음 뽑기는 희귀 이상 보장!' : `희귀 이상 보장까지 ${left}번`} · 이미 만난 고양이는 츄르로 돌려받아요 (일반 ${TIER[1].refund} · 희귀 ${TIER[2].refund} · 전설 ${TIER[3].refund})`}</Txt>
    </View>
  );
}

// 뽑기 전용 고양이 목록 (도감과 뽑기 탭에서 함께 쓴다)
function GachaGrid() {
  const C = useC();
  const s = useApp(st => st);
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt jua style={{ fontSize: 17 }}>뽑기 고양이</Txt>
        <Txt style={{ fontSize: 12, color: C.sub }}>{GACHA_CATS.filter(c => s.owned.includes(c.id)).length + '/' + GACHA_CATS.length + ' 만남'}</Txt>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {GACHA_CATS.map(c => {
          const o = s.owned.includes(c.id), t = TIER[c.tier!];
          return (
            <Btn key={c.id} onPress={() => (o ? S({ catId: c.id }) : getS().toast('뽑기에서 만날 수 있어요 · ' + t.name + ' 등급'))} accessibilityLabel={(o ? c.name : '아직 못 만난 고양이') + ', ' + t.name}
              style={{ width: '31%', flexGrow: 1, alignItems: 'stretch', gap: 6, padding: 8, borderRadius: 16, borderWidth: c.id === s.catId ? 2.5 : 1.5, borderColor: c.id === s.catId ? C.ink : C.line, backgroundColor: C.bg }}>
              <View style={{ aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
                {o ? <Image source={FACE[c.id]} resizeMode="cover" accessibilityIgnoresInvertColors style={{ width: '100%', height: '100%' }} />
                  : <Image source={CUTOUT[c.id]} resizeMode="contain" accessibilityLabel="아직 못 만난 고양이 실루엣" style={{ width: '82%', height: '82%', tintColor: C.ink, opacity: 0.3 }} />}
              </View>
              <Txt jua numberOfLines={1} style={{ fontSize: 12 }}>{o ? c.name : '???'}</Txt>
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 7, backgroundColor: t.color }}><Txt style={{ fontSize: 10, color: '#2B221D' }}>{t.name}</Txt></View>
            </Btn>
          );
        })}
      </View>
    </>
  );
}

// ── 뽑기 (하단 탭) ── 츄르로 고양이를 만나는 곳: 고양이 뽑기 · 창밖 고양이 부르기 · 뽑기 고양이 목록
export function GachaTab() {
  const sm = useScrollMemory('gacha');
  const C = useC();
  const s = useApp(st => st);
  return (
    <ScrollView {...sm} style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 14 }]}>
      <Header title="고양이 뽑기" right={<Txt style={{ fontSize: 14, color: C.sub }}>{GACHA_CATS.filter(c => s.owned.includes(c.id)).length + '/' + GACHA_CATS.length + ' 만남'}</Txt>} />
      {IS_DEMO && <Txt style={{ fontSize: 12, color: C.sub }}>데모 버전 · 테스트용 츄르가 무제한이에요</Txt>}
      <GachaBox />
      <View style={{ gap: 10, padding: 16, borderRadius: 20, backgroundColor: C.card }}>
        <Txt jua style={{ fontSize: 17 }}>새로운 고양이 만나기</Txt>
        <Txt style={{ fontSize: 13, lineHeight: 20, color: C.sub }}>츄르 30개로 창밖의 고양이를 불러요. 아직 못 만난 고양이만 나와요.</Txt>
        <Primary h={50} label={!baseLeft(s.owned) ? '모든 고양이를 만났어요' : s.churu >= 30 ? '츄르 30개로 부르기' : `츄르가 ${30 - s.churu}개 더 필요해요`} bg={s.churu >= 30 && baseLeft(s.owned) ? C.ink : C.disabled} onPress={() => getS().pull()} />
      </View>
      <GachaGrid />
    </ScrollView>
  );
}

// ── 도감 ── (메뉴 › 고양이 도감에서 들어온다)
export function Dex() {
  const sm = useScrollMemory('dex');
  // 도감을 떠나면 듣던 노래를 멈춘다
  useEffect(() => () => { if (getS().playingSong != null) getS().stopSong(); }, []);
  const C = useC();
  const s = useApp(st => st);
  const isOwned = (k: string, id: string) => (DECOR as any)[k].single ? s.ownedDecor.includes(id) : s.items.includes(id);
  let tot = 0, own = 0;
  const groups = DECOR_KINDS.map(k => {
    const items = listOf(k, s.dRoom).map(([id, name]) => { const o = isOwned(k, id); tot++; if (o) own++; return { id, nm: o ? name : '???', sw: k === 'wall' ? WALL[id] : k === 'floor' ? FLOOR[id] : SWATCH[id], op: o ? 1 : 0.25 }; });
    return { k, title: DECOR[k].label, count: items.filter(x => x.op === 1).length + '/' + items.length, items };
  });
  const count = s.dexTab === 'cat' ? (s.owned.length + (s.plus ? CATS.filter(c => c.plus).length : 0)) + '/' + ALL_CATS.length + ' 만남' : s.dexTab === 'beh' ? s.seenBeh.length + '/7 수집' : s.dexTab === 'song' ? s.seenSongs.length + '/' + SONGS.length + ' 수집' : own + '/' + tot + ' 보유';
  return (
    <ScrollView {...sm} style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 14 }]}>
      <Header title="도감" onBack={back} right={<Txt style={{ fontSize: 14, color: C.sub }}>{count}</Txt>} />
      <Seg items={[['cat', '고양이'], ['beh', '행동'], ['song', '노래'], ['item', '아이템']]} value={s.dexTab} onPick={k => S({ dexTab: k })} />
      {s.dexTab === 'cat' && <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {CATS.map(c => {
            const o = s.owned.includes(c.id) || (!!c.plus && s.plus);
            return (
              <Btn key={c.id} onPress={() => (o ? S({ catId: c.id }) : c.plus ? S({ tab: 'menu', menuPage: PG.plus, prevTab: 'dex' }) : null)}
                style={{ width: '47.5%', flexGrow: 1, alignItems: 'stretch', gap: 8, padding: 10, borderRadius: 20, borderWidth: c.id === s.catId ? 2.5 : 1.5, borderColor: c.id === s.catId ? C.ink : C.line, backgroundColor: C.bg }}>
                <View style={{ aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
                  {o || c.plus ? <CatFace cat={c} size={140} border={0} round={false} bg={C.card} dim={o ? 1 : 0.55} shade={o ? 0 : 0.36} style={{ borderRadius: 14 }} />
                    : <Image source={CUTOUT[c.id]} resizeMode="contain" accessibilityLabel="아직 못 만난 고양이 실루엣" style={{ width: '84%', height: '84%', tintColor: C.ink, opacity: 0.3 }} />}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt jua style={{ fontSize: 15, flexShrink: 1 }} numberOfLines={1}>{o ? c.name : '???'}</Txt>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: c.id === s.catId ? C.mint : c.plus && !o ? '#F6D58E' : C.card }}>
                    <Txt style={{ fontSize: 11, color: c.plus && !o ? '#4A3428' : C.ink }}>{o ? '♥ ' + Math.floor((s.aff[c.id] || 0) / 20) + (c.id === s.catId ? ' · 함께' : '') : c.plus ? 'PLUS' : '잠김'}</Txt>
                  </View>
                </View>
                {!o && <Txt style={{ fontSize: 11, color: '#C9772F' }}>{c.plus ? 'Plus 구독으로 만나요' : '츄르 30개로 만나요'}</Txt>}
              </Btn>
            );
          })}
        </View>
        <GachaGrid />
      </>}
      {s.dexTab === 'beh' && <>
        <Txt style={{ fontSize: 13, lineHeight: 20, color: C.sub }}>홈의 고양이는 6초마다 새로운 행동을 보여줘요. 한 번 본 행동은 여기에 기록돼요.</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {BEH.map(b => { const on = s.seenBeh.includes(b.id); return (
            <View key={b.id} style={{ width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, borderWidth: 1.5, borderColor: on ? C.ink : C.line, backgroundColor: C.bg }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: on ? b.bg : C.card2, alignItems: 'center', justifyContent: 'center' }}><Txt jua style={{ fontSize: 20, color: '#4A3428' }}>{on ? b.g : '?'}</Txt></View>
              <View style={{ flexShrink: 1 }}><Txt jua style={{ fontSize: 15 }}>{on ? b.name : '???'}</Txt><Txt style={{ fontSize: 11, color: on ? C.gink : C.mute }}>{on ? '수집 완료' : '아직 못 봤어요'}</Txt></View>
            </View>); })}
        </View>
      </>}
      {s.dexTab === 'song' && <>
        <Txt style={{ fontSize: 13, lineHeight: 20, color: C.sub }}>{'홈에서 고양이를 누르면 노래를 불러요. 한 번 들은 노래는 여기서 다시 들을 수 있어요. 고양이마다 전용 노래도 한 곡씩 있어요.\n기본 5곡 모으면 츄르 20 · 전용 8곡 모으면 츄르 50' + (s.songBonus.basic ? ' · 기본 보상 받음' : '') + (s.songBonus.cat ? ' · 전용 보상 받음' : '')}</Txt>
        <View style={{ gap: 8 }}>
          {SONGS.map((x, i) => {
            const on = s.seenSongs.includes(i), cc = x.cat ? catById(x.cat) : null, cOwn = !!cc && (s.owned.includes(cc.id) || (!!cc.plus && s.plus));
            const tag = cc ? (cOwn ? cc.name + ' 전용' : '??? 전용') : '기본';
            const lyric = on ? x.t : cc ? (cOwn ? cc.name + '와(과) 함께일 때 눌러 보세요' : '아직 못 만난 고양이의 노래예요') : '고양이를 눌러 들어 보세요';
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1.5, borderColor: on ? C.ink : C.line, backgroundColor: C.bg }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: on ? (cc ? C.chip1 : C.mint) : C.card2, alignItems: 'center', justifyContent: 'center' }}><Txt jua style={{ fontSize: 20 }}>{on ? (cc ? '♬' : '♪') : '?'}</Txt></View>
                <View style={{ flex: 1, minWidth: 0 }}><Txt jua style={{ fontSize: 15 }}>{(on ? x.name : '???') + ' · ' + tag}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{lyric}</Txt></View>
                {on && <Btn onPress={() => getS().sing(i)} accessibilityLabel={x.name + (s.playingSong === i ? ' 중지' : ' 듣기')} style={{ height: 34, minWidth: 74, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1.5, borderColor: C.ink, backgroundColor: s.playingSong === i ? C.ink : C.chip1 }}><Txt jua style={{ fontSize: 13, color: s.playingSong === i ? C.bg : C.ink }}>{s.playingSong === i ? '■ 중지' : '▶ 듣기'}</Txt></Btn>}
              </View>
            );
          })}
        </View>
      </>}
      {s.dexTab === 'item' && groups.map(g => (
        <View key={g.k} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Txt jua style={{ fontSize: 16 }}>{g.title}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{g.count}</Txt></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {g.items.map(it => (
              <View key={it.id} style={{ width: '22.5%', gap: 4, alignItems: 'center' }}>
                <FillView fill={it.sw || C.card} radius={10} style={{ width: '100%', aspectRatio: 1, borderWidth: 1.5, borderColor: C.ink, opacity: it.op }} />
                <Txt style={{ fontSize: 10, lineHeight: 12, textAlign: 'center' }}>{it.nm}</Txt>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ── 상점 · 꾸미기 ──
const SHOP: [string, string, number][] = [['rug', '초록 러그', 0], ['scratch', '스크래처', 15], ['plant', '캣닢 화분', 20], ['yarn', '털실 장난감', 12], ['hammock', '창가 해먹', 40], ['cushion', '생선 쿠션', 25]];
export function Shop() {
  const sm = useScrollMemory('shop');
  const C = useC();
  const s = useApp(st => st);
  const cat = catById(s.catId);
  const watchAd = () => { if (s.adLeft <= 0) return getS().toast('오늘 광고 보상을 모두 받았어요'); S({ ad: 5 }); };
  return (
    <ScrollView {...sm} style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 16 }]}>
      <Header title="상점 · 꾸미기" onBack={back} size={24} right={<ChuruBadge n={s.churu} />} />
      <Txt style={{ fontSize: 13, color: C.sub, lineHeight: 20 }}>{`방을 꾸미면 ${cat.name}의 친밀도가 조금 올라요. 장착한 아이템은 홈 방에 표시돼요.`}</Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Btn onPress={watchAd} style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.chip1 }}><Txt jua style={{ fontSize: 14 }}>{'광고 보고 츄르 5개 (' + s.adLeft + '/3)'}</Txt></Btn>
        <Btn onPress={() => S({ tab: 'menu', menuPage: PG.ledger, prevTab: 'shop' })} style={{ height: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 14 }}>츄르 내역 ›</Txt></Btn>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {SHOP.map(([id, name, price]) => {
          const own = s.items.includes(id), eq = s.equipped.includes(id), can = s.churu >= price, prop = id === 'plant' || id === 'yarn';
          const act = () => {
            const st = getS();
            if (own) return S({ equipped: eq ? st.equipped.filter(x => x !== id) : [...st.equipped, id] });
            if (!can) return; st.log(name + ' 구매', -price); sfx('buy');
            S({ churu: st.churu - price, items: [...st.items, id], equipped: [...st.equipped, id], aff: { ...st.aff, [st.catId]: Math.min(100, (st.aff[st.catId] || 0) + 2) } });
          };
          return (
            <View key={id} style={{ width: '47.5%', flexGrow: 1, gap: 8, padding: 10, borderRadius: 20, borderWidth: eq ? 2.5 : 1.5, borderColor: eq ? C.ink : C.line, backgroundColor: C.bg }}>
              <View style={{ aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: prop ? C.chip1 : '#DCEBD6', alignItems: 'center', justifyContent: 'center' }}>
                <Txt style={{ fontSize: 12, color: '#7A6352' }}>아이템 그림</Txt>
                <View style={{ position: 'absolute', left: 6, top: 6, paddingHorizontal: 9, paddingVertical: 2, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.7)' }}><Txt jua style={{ fontSize: 12, color: '#4A3428' }}>{prop ? '소품' : '가구'}</Txt></View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Txt jua style={{ fontSize: 15 }}>{name}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{own ? '보유' : price + ' 츄르'}</Txt></View>
              <Btn onPress={act} style={{ height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: C.ink, backgroundColor: eq ? C.sage : own ? C.bg : can ? C.ink : C.card2 }}>
                <Txt jua style={{ fontSize: 14, color: !own && can ? C.bg : C.ink }}>{eq ? '장착 중' : own ? '장착하기' : can ? '구매하기' : '츄르 부족'}</Txt>
              </Btn>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── 후원 ──
export function Donate() {
  const sm = useScrollMemory('donate');
  const C = useC();
  const s = useApp(st => st);
  const an = ANIMALS.find(x => x.id === s.sAnimal)!, cm = s.sMode === 'churu';
  const AMT = cm ? [10, 30, 50] : [3000, 5000, 10000], KG = cm ? [0.1, 0.3, 0.5] : [1, 2, 4], amt = AMT[s.sAmt], short = cm && s.churu < amt;
  const kg = dkg(s);
  const payMethod = Platform.OS === 'ios' ? 'Apple Pay' : 'Google Play 결제';
  return (
    <ScrollView {...sm} style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 14 }]}>
      <Header title="함께 후원" right={<Txt style={{ fontSize: 14, color: C.sub }}>{'내 후원 ' + kg + 'kg'}</Txt>} />
      <Seg items={[['give', '후원하기'], ['feed', '소식 피드'], ['mine', '내 후원']]} value={s.donTab} onPick={k => S({ donTab: k })} />
      {s.donTab === 'give' && <>
        <View style={{ padding: 16, borderRadius: 20, backgroundColor: C.mint, borderWidth: 1.5, borderColor: C.ink, gap: 6 }}>
          <Txt style={{ fontSize: 13, color: C.gink }}>파트너 · 냠냠펫푸드 (가칭)</Txt>
          <Txt jua style={{ fontSize: 19, lineHeight: 26 }}>집중 목표를 달성할 때마다 파트너가 사료 100g을 대신 기부해요.</Txt>
          <Txt style={{ fontSize: 13, color: C.gink }}>{`내 집중으로 전달된 사료 ${kg}kg · ${s.donated}회 달성`}</Txt>
        </View>
        {SHELTER_META.map((m, i) => {
          const k = s.shelters[i].kg, sel = s.pick === i;
          return (
            <View key={i} style={{ gap: 12, padding: 12, borderRadius: 22, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}>
              <PhotoSlot label={m.photo} style={{ height: 110, borderRadius: 14 }} />
              <Btn onPress={() => S({ tab: 'shelter', shIdx: i, thanks: '' })} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ gap: 2 }}><Txt jua style={{ fontSize: 17 }}>{m.name}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{`${m.place} · 보호 중 ${m.cats}마리`}</Txt></View>
                <Txt style={{ fontSize: 12, color: C.sub }}>투명성 정보 ›</Txt>
              </Btn>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt style={{ fontSize: 12 }}>{`이번 달 사료 ${k.toFixed(1)}kg / ${m.goal}kg`}</Txt><Txt style={{ fontSize: 12 }}>{Math.round(k / m.goal * 100) + '%'}</Txt></View>
                <Bar pct={k / m.goal * 100} />
              </View>
              <Txt style={{ fontSize: 12, color: C.sub }}>후원할 아이를 골라 주세요</Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {ANIMALS.filter(a => a.sh === i).map(a => (
                  <Btn key={a.id} onPress={() => S({ sAnimal: a.id, pick: i })} style={{ width: 100, alignItems: 'stretch', gap: 4, padding: 6, borderRadius: 14, borderWidth: s.sAnimal === a.id ? 2.5 : 1.5, borderColor: s.sAnimal === a.id ? C.ink : C.line, backgroundColor: C.bg }}>
                    <PhotoSlot label="사진" style={{ height: 60, borderRadius: 9 }} />
                    <Txt jua style={{ fontSize: 14 }}>{a.name}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{a.age}</Txt>
                  </Btn>
                ))}
              </ScrollView>
              <Btn onPress={() => S({ pick: i, thanks: `이제 집중 목표를 달성하면 ${m.name}에 사료가 기부돼요. 매월 말 기부 리포트와 근황을 보내드려요.` })}
                style={{ height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: C.ink, backgroundColor: sel ? C.ink : C.bg }}>
                <Txt jua style={{ fontSize: 15, color: sel ? C.bg : C.ink }}>{sel ? '내 기부처 ✓' : '이곳을 기부처로 선택'}</Txt>
              </Btn>
            </View>
          );
        })}
        <View style={{ gap: 12, padding: 16, borderRadius: 20, backgroundColor: C.card }}>
          <Txt jua style={{ fontSize: 18 }}>{an.name + '에게 후원하기'}</Txt>
          <Txt style={{ fontSize: 13, lineHeight: 20, color: C.body }}>{an.story}</Txt>
          <Seg h={32} jua={false} fs={13} items={[['churu', '츄르로 후원'], ['cash', '결제 후원']]} value={s.sMode} onPick={k => S({ sMode: k, sAmt: 0 })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {AMT.map((a, i) => (
              <Btn key={i} onPress={() => S({ sAmt: i })} style={{ flex: 1, height: 40, borderRadius: 12, borderWidth: s.sAmt === i ? 2 : 1.5, borderColor: s.sAmt === i ? C.ink : C.line, backgroundColor: s.sAmt === i ? C.ink : C.bg }}>
                <Txt jua style={{ fontSize: 14, color: s.sAmt === i ? C.bg : C.ink }}>{cm ? a + ' 츄르' : won(a)}</Txt>
              </Btn>
            ))}
          </View>
          <Txt style={{ fontSize: 12, lineHeight: 17, color: short ? C.red : C.sub }}>{short ? '츄르가 ' + (amt - s.churu) + '개 부족해요. 집중하면 모을 수 있어요.' : '사료 ' + KG[s.sAmt] + 'kg이 ' + SHELTER_META[an.sh].name + '에 전달되고 인증서가 발급돼요.' + (cm ? '' : ' (데모: 실제 결제는 일어나지 않아요)')}</Txt>
          <Primary h={50} fs={16} label={(cm ? amt + ' 츄르로 ' : won(amt) + ' 결제로 ') + '후원하기'} bg={short ? C.disabled : C.ink} onPress={() => getS().trySponsor(payMethod)} />
        </View>
        {!!s.thanks && <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.ink }}><Txt style={{ fontSize: 13, lineHeight: 19, color: C.bg }}>{s.thanks}</Txt></View>}
      </>}
      {s.donTab === 'feed' && FEED.map((f, i) => (
        <View key={i} style={{ gap: 10, padding: 12, borderRadius: 20, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.bg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt style={{ fontSize: 12, color: C.sub }}>{f.shelter}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{f.date}</Txt></View>
          <PhotoSlot label={f.animal + ' 사진'} style={{ height: 120, borderRadius: 12 }} />
          <Txt jua style={{ fontSize: 16 }}>{f.title}</Txt>
          <Txt style={{ fontSize: 13, lineHeight: 20, color: C.body }}>{f.body}</Txt>
        </View>
      ))}
      {s.donTab === 'mine' && <>
        {s.sponsorships.length === 0 && <Txt style={{ paddingVertical: 40, textAlign: 'center', fontSize: 14, color: C.sub, lineHeight: 22 }}>{'아직 후원 내역이 없어요.\n\'후원하기\'에서 마음에 드는 아이를 골라 보세요.'}</Txt>}
        <View style={{ gap: 10, padding: 16, borderRadius: 20, backgroundColor: C.mint, borderWidth: 1.5, borderColor: C.ink }}>
          <Txt style={{ fontSize: 13, color: C.gink }}>누적 후원</Txt>
          <Txt jua style={{ fontSize: 24 }}>{`사료 ${kg}kg · ${s.sponsorships.length}건`}</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn onPress={() => S({ rcpt: 'cum' })} style={{ flex: 1, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 14 }}>누적 증명서</Txt></Btn>
            <Btn onPress={() => S({ rcpt: 'rcpt' })} style={{ flex: 1, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt jua style={{ fontSize: 14 }}>기부 영수증</Txt></Btn>
          </View>
          <Btn onPress={() => S({ dlg: { kind: 'refundinfo' } })}><Txt style={{ fontSize: 12, color: C.gink, textDecorationLine: 'underline' }}>취소·환불 안내</Txt></Btn>
        </View>
        {s.sponsorships.map(r => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: C.card }}>
            <View style={{ flex: 1, gap: 2 }}><Txt jua style={{ fontSize: 16 }}>{r.animal + '에게 ' + r.amt}</Txt><Txt style={{ fontSize: 12, color: C.sub }}>{`${r.shelter} · ${r.kind} 후원 · 사료 ${r.kg}kg`}</Txt></View>
            <View style={{ gap: 6 }}>
              <Btn onPress={() => S({ cert: r.id })} style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.bg }}><Txt style={{ fontSize: 12 }}>인증서</Txt></Btn>
              <Btn onPress={() => S({ dlg: r.kind === '츄르' || r.refunded ? { kind: 'refundinfo' } : { kind: 'refund', id: r.id } })} style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: C.line }}>
                <Txt style={{ fontSize: 11, color: C.sub }}>{r.kind === '츄르' ? '환불 불가' : r.refunded ? '환불 요청됨' : '환불 요청'}</Txt>
              </Btn>
            </View>
          </View>
        ))}
      </>}
    </ScrollView>
  );
}

export function Shelter() {
  const sm = useScrollMemory('shelter');
  const C = useC();
  const s = useApp(st => st);
  const i = s.shIdx, meta = SHD[i], m = SHELTER_META[i];
  return (
    <ScrollView {...sm} style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 14 }]}>
      <Header title={m.name} onBack={back} />
      <PhotoSlot label="보호소 전경 사진" style={{ height: 120, borderRadius: 16 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[[String(m.cats), '보호 중'], [meta.since, '설립'], [s.shelters[i].kg.toFixed(1) + 'kg', '이번 달 사료']].map(([v, k]) => (
          <View key={k} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, backgroundColor: C.card, alignItems: 'center' }}><Txt jua style={{ fontSize: 20 }}>{v}</Txt><Txt style={{ fontSize: 11, color: C.sub }}>{k}</Txt></View>
        ))}
      </View>
      <View style={{ gap: 10, padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: C.line }}>
        <Txt jua style={{ fontSize: 16 }}>후원금은 이렇게 쓰여요</Txt>
        {meta.budget.map(([label, pct], j) => (
          <View key={label} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt style={{ fontSize: 12 }}>{label}</Txt><Txt style={{ fontSize: 12 }}>{pct + '%'}</Txt></View>
            <Bar h={9} pct={pct} color={['#E59A4C', '#8DBF93', '#7E9CC8'][j]} />
          </View>
        ))}
      </View>
      <View style={{ borderRadius: 18, backgroundColor: C.card, overflow: 'hidden' }}>
        {meta.facts.map(([k, v], j) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderTopWidth: j ? 1 : 0, borderTopColor: C.line }}>
            <Txt style={{ fontSize: 13, color: C.sub }}>{k}</Txt><Txt style={{ fontSize: 13, textAlign: 'right' }}>{v}</Txt>
          </View>
        ))}
      </View>
      <Txt style={{ fontSize: 11, color: C.mute, lineHeight: 16 }}>프로토타입용 예시 정보예요. 실제 출시 전 보호소의 공식 자료로 교체해요.</Txt>
      <Primary h={50} fs={16} label="이곳에 후원하기" onPress={() => S({ tab: 'donate', donTab: 'give', pick: i })} />
    </ScrollView>
  );
}

// ── 집중 기록 ──
export function Stats() {
  const sm = useScrollMemory('stats');
  const C = useC();
  const s = useApp(st => st);
  const wk = weekVals(s), lb = weekLabels();
  const tries = Object.entries(s.tries).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const mx = Math.max(1, ...tries.map(t => t[1]));
  const name = (k: string) => s.apps.find(a => a.id === k)?.name || ({ ig: '인스타그램', yt: '유튜브', tt: '숏폼 영상', kk: '메신저', wt: '웹툰', gm: '게임' } as Record<string, string>)[k] || k;
  return (
    <ScrollView {...sm} style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 16 }]}>
      <Header title="집중 기록" onBack={back} size={24} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[['오늘 집중', todayMin(s) + '분'], ['연속 달성', focusStreak(s) + '일']].map(([k, v]) => (
          <View key={k} style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: C.card, gap: 4 }}><Txt style={{ fontSize: 12, color: C.sub }}>{k}</Txt><Txt jua style={{ fontSize: 26 }}>{v}</Txt></View>
        ))}
      </View>
      <View style={{ padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: C.ink, gap: 12 }}>
        <Txt jua style={{ fontSize: 16 }}>이번 주</Txt>
        <View style={{ height: 136, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          {wk.map((v, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{ width: '100%', height: Math.max(4, Math.min(110, v * 1.1)), borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: i === 6 ? '#E59A4C' : C.sage }} />
              <Txt style={{ fontSize: 11, color: C.sub }}>{lb[i]}</Txt>
            </View>
          ))}
        </View>
      </View>
      <View style={{ padding: 16, borderRadius: 20, backgroundColor: C.card, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Txt jua style={{ fontSize: 16 }}>{IS_DEMO ? '이번 주 방해 시도' : '방해 시도'}</Txt><Txt jua style={{ fontSize: 18 }}>{tries.reduce((a, t) => a + t[1], 0) + '회'}</Txt></View>
        <Txt style={{ fontSize: 12, color: C.sub }}>{s.blockedNow ? '이번 집중에서 ' + s.blockedNow + '회 막았어요' : '이번 집중에서는 방해가 없었어요'}</Txt>
        {tries.map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Txt style={{ width: 64, fontSize: 12 }} numberOfLines={1}>{name(k)}</Txt>
            <View style={{ flex: 1 }}><Bar h={8} pct={v / mx * 100} color="#D9604E" bg={C.line} /></View>
            <Txt style={{ width: 34, textAlign: 'right', fontSize: 12 }}>{v + '회'}</Txt>
          </View>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Txt jua style={{ fontSize: 16 }}>최근 세션</Txt>
        {s.sessions.length === 0 && <Txt style={{ fontSize: 13, color: C.sub }}>아직 오늘 기록이 없어요. 첫 집중을 시작해 보세요.</Txt>}
        {s.sessions.slice(0, 5).map((x, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.card }}>
            <Txt style={{ fontSize: 14 }}>{(x.tag ? x.tag + ' · ' : '') + x.min + '분 집중'}</Txt>
            <Txt style={{ fontSize: 14, color: x.ok ? C.gink : C.red }}>{x.ok ? `+${reward(x.min).churu} 츄르` : '포기'}</Txt>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── 우편함 ──
const TYPES: Record<string, [string, string]> = { reward: ['보상', 'chip1'], report: ['후원', 'mint'], news: ['공지', 'card'], event: ['이벤트', 'pink'] };
export function Mailbox() {
  const sm = useScrollMemory('mail');
  const C = useC();
  const s = useApp(st => st);
  const inF = (m: { type: string }) => s.mailFilter === 'all' || m.type === s.mailFilter || (s.mailFilter === 'news' && m.type === 'event');
  const claimable = s.mails.filter(m => m.churu && !s.claimed.includes(m.id));
  const list = s.mails.filter(inF);
  return (
    <ScrollView {...sm} style={{ flex: 1 }} contentContainerStyle={[pad, { gap: 12 }]}>
      <Header title="우편함" right={
        <Btn onPress={() => getS().claimAll()} style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1.5, borderColor: C.ink, backgroundColor: claimable.length ? C.ink : C.card2 }}>
          <Txt jua style={{ fontSize: 14, color: claimable.length ? C.bg : C.mute }}>{'모두 받기 ' + (claimable.length || '')}</Txt>
        </Btn>} />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {([['all', '전체'], ['reward', '보상'], ['report', '후원'], ['news', '공지·이벤트']] as const).map(([k, l]) => <Chip key={k} h={32} label={l} on={s.mailFilter === k} onPress={() => S({ mailFilter: k })} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Btn onPress={() => S(st => ({ mailRead: st.mails.map(m => m.id) }))} style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: C.line }}><Txt style={{ fontSize: 12 }}>모두 읽음</Txt></Btn>
        <Btn onPress={() => S(st => ({ openMail: null, mails: st.mails.filter(m => !(st.mailRead.includes(m.id) && (!m.churu || st.claimed.includes(m.id)))) }))} style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: C.line }}><Txt style={{ fontSize: 12, color: C.red }}>읽은 우편 삭제</Txt></Btn>
      </View>
      {list.length === 0 && <Txt style={{ paddingVertical: 40, textAlign: 'center', fontSize: 14, color: C.sub }}>받은 우편이 없어요.</Txt>}
      {list.map(m => {
        const read = s.mailRead.includes(m.id), got = s.claimed.includes(m.id), open = s.openMail === m.id, T = TYPES[m.type];
        return (
          <Btn key={m.id} onPress={() => S(st => ({ openMail: st.openMail === m.id ? null : m.id, mailRead: st.mailRead.includes(m.id) ? st.mailRead : [...st.mailRead, m.id] }))}
            style={{ alignItems: 'stretch', gap: 10, padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: open ? C.ink : C.line, backgroundColor: read ? C.bg : C.white }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: read ? 'transparent' : '#D9604E' }} />
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: (C as any)[T[1]] }}><Txt style={{ fontSize: 11 }}>{T[0]}</Txt></View>
              <Txt numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: read ? '400' : '700' }}>{m.title}</Txt>
              <Txt style={{ fontSize: 11, color: C.mute }}>{m.date}</Txt>
            </View>
            {open && <>
              <Txt style={{ fontSize: 13, lineHeight: 20, color: C.body }}>{m.body}</Txt>
              {m.photo && <PhotoSlot label="보호소 고양이 근황 사진" style={{ height: 120, borderRadius: 12 }} />}
              <Btn onPress={() => S(st => ({ mails: st.mails.filter(x => x.id !== m.id), openMail: null }))} style={{ alignSelf: 'flex-end', height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: C.line }}><Txt style={{ fontSize: 12, color: C.red }}>삭제</Txt></Btn>
            </>}
            {!!m.churu && !got && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt style={{ fontSize: 11, color: C.red }}>{m.exp || ''}</Txt>
                <Btn onPress={() => getS().claimMail(m.id)} style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: C.ink }}><Txt jua style={{ fontSize: 14, color: C.bg }}>{`츄르 ${m.churu}개 받기`}</Txt></Btn>
              </View>
            )}
            {!!m.churu && got && <Txt style={{ fontSize: 12, color: C.gink }}>{`츄르 ${m.churu}개를 받았어요`}</Txt>}
          </Btn>
        );
      })}
    </ScrollView>
  );
}
