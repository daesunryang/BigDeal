import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { reward, isoDay, streakOf, growthOf } from '../src/data';
import { clearNav, getS, switchTab, useApp } from '../src/store';

jest.useFakeTimers();

const fresh = () => { getS().reset(); clearNav(); useApp.setState({ screen: 'tabs', tab: 'home', loggedIn: true }); };

describe('집중 세션', () => {
  beforeEach(fresh);

  test('시작하면 집중 화면과 남은 시간이 정해진다', () => {
    getS().start(25);
    const s = getS();
    expect(s.screen).toBe('focus');
    expect(s.remain).toBe(25 * 60);
    expect(s.endAt).toBeGreaterThan(Date.now());
  });

  test('완료하면 츄르·친밀도·기부·우편이 늘어난다', () => {
    const before = getS();
    const churu0 = before.churu, aff0 = before.aff.cheese || 0, mails0 = before.mails.length;
    getS().start(50);
    getS().complete();
    const s = getS(), rw = reward(50);
    expect(s.screen).toBe('done');
    expect(s.churu).toBe(churu0 + rw.churu);
    expect(s.aff.cheese).toBe(Math.min(100, aff0 + rw.aff));
    expect(s.donated).toBe(1);
    expect(s.mails.length).toBeGreaterThan(mails0);
    expect(s.sessions[0]).toMatchObject({ min: 50, ok: true });
    expect(s.fdays).toContain(isoDay(0));
  });

  test('포기하면 시무룩해지고 친밀도가 3 (엄격 모드 6) 줄어든다', () => {
    useApp.setState({ aff: { cheese: 30 } });
    getS().start(25); getS().quit();
    expect(getS()).toMatchObject({ screen: 'fail', sulky: true, failPen: 3 });
    expect(getS().aff.cheese).toBe(27);
    useApp.setState({ toggles: { ...getS().toggles, strict: true } });
    getS().start(25); getS().quit();
    expect(getS().aff.cheese).toBe(21);
  });

  test('일시정지하면 종료 시각이 그만큼 밀린다', () => {
    useApp.setState({ fast: false });
    getS().start(10);
    const end = getS().endAt;
    getS().pauseTimer();
    jest.advanceTimersByTime(5000);
    jest.setSystemTime(Date.now() + 5000);
    getS().resumeTimer();
    expect(getS().endAt).toBeGreaterThanOrEqual(end + 5000);
  });
});

describe('뒤로가기', () => {
  beforeEach(fresh);

  test('팝업 → 하위 화면 → 홈 순서로 닫고, 홈에서 두 번 누르면 종료', () => {
    useApp.setState({ tab: 'menu', menuPage: '공지사항', dlg: { kind: 'refundinfo' } });
    expect(getS().back()).toBe(true); expect(getS().dlg).toBeNull();
    expect(getS().back()).toBe(true); expect(getS().tab).toBe('home'); expect(getS().menuPage).toBeNull();
    expect(getS().back()).toBe(true);
    expect(getS().back()).toBe(false);
  });

  test('집중 중에는 뒤로가기가 막힌다', () => {
    getS().start(25);
    expect(getS().back()).toBe(true);
    expect(getS().screen).toBe('focus');
  });
});

describe('방 꾸미기 · 상점', () => {
  beforeEach(fresh);

  test('미리보기한 가구를 사면 츄르가 빠지고 배치된다', () => {
    useApp.setState({ churu: 100, decorCat: 'furniture' });
    getS().decorTap('tower', 50);
    expect(getS().preview).toEqual({ kind: 'furniture', id: 'tower' });
    getS().buyPreview();
    const s = getS();
    expect(s.churu).toBe(50);
    expect(s.items).toContain('tower');
    expect(s.equipped).toContain('tower');
    expect(s.preview).toBeNull();
  });

  test('츄르가 모자라면 사지 못한다', () => {
    useApp.setState({ churu: 10, decorCat: 'furniture' });
    getS().decorTap('tower', 50); getS().buyPreview();
    expect(getS().items).not.toContain('tower');
    expect(getS().churu).toBe(10);
  });

  test('방마다 벽지를 따로 기억한다', () => {
    useApp.setState({ rooms: ['liv', 'nap'] });
    useApp.setState({ decor: { ...getS().decor, wall: 'mint' } });
    getS().switchRoom('nap');
    expect(getS().decor.wall).toBe('napw');
    getS().switchRoom('liv');
    expect(getS().decor.wall).toBe('mint');
  });
});

describe('우편 · 후원 · 도감', () => {
  beforeEach(fresh);

  test('모두 받기는 받을 수 있는 츄르를 한 번에 더한다', () => {
    const s0 = getS(), sum = s0.mails.filter(m => m.churu && !s0.claimed.includes(m.id)).reduce((a, m) => a + (m.churu || 0), 0);
    getS().claimAll();
    expect(getS().churu).toBe(s0.churu + sum);
    getS().claimAll();
    expect(getS().churu).toBe(s0.churu + sum);
  });

  test('츄르 후원은 츄르를 쓰고 인증서를 만든다', () => {
    useApp.setState({ churu: 100, sMode: 'churu', sAmt: 1, sAnimal: 'a0' });
    getS().sponsor();
    const s = getS();
    expect(s.churu).toBe(70);
    expect(s.sponsorships[0]).toMatchObject({ animal: '보리', kind: '츄르', kg: 0.3 });
    expect(s.cert).toBe(s.sponsorships[0].id);
  });

  test('새 고양이 만나기는 아직 못 만난 기본 고양이만 나온다', () => {
    useApp.setState({ churu: 30, owned: ['cheese'] });
    getS().pull();
    const s = getS();
    expect(s.churu).toBe(0);
    expect(s.owned).toHaveLength(2);
    expect(['blue', 'calico', 'tux']).toContain(s.gacha);
  });
});

describe('계산 도우미', () => {
  test('보상과 성장 단계', () => {
    expect(reward(25)).toEqual({ churu: 10, aff: 10 });
    expect(reward(5)).toEqual({ churu: 2, aff: 3 });
    expect(growthOf(39).name).toBe('아기 고양이');
    expect(growthOf(40).name).toBe('어린 고양이');
    expect(growthOf(80).name).toBe('어른 고양이');
  });

  test('연속 일수는 오늘(없으면 어제)부터 끊김 없이 센다', () => {
    expect(streakOf([isoDay(0), isoDay(1), isoDay(2)])).toBe(3);
    expect(streakOf([isoDay(1), isoDay(2)])).toBe(2);
    expect(streakOf([isoDay(0), isoDay(2)])).toBe(1);
    expect(streakOf([])).toBe(0);
  });
});

describe('뒤로가기는 바로 전 화면으로', () => {
  beforeEach(fresh);
  const at = () => { const s = getS(); return [s.screen, s.tab, s.menuPage]; };

  test('도감에서 잠긴 Plus 고양이를 누르면 Plus 페이지, 뒤로가면 도감', () => {
    switchTab({ tab: 'dex' });
    useApp.setState({ tab: 'menu', menuPage: '냥집중 Plus' });
    expect(at()).toEqual(['tabs', 'menu', '냥집중 Plus']);
    getS().back();
    expect(at()).toEqual(['tabs', 'dex', null]);
  });

  test('홈 → 메뉴 → 하위 페이지 → 또 하위 페이지를 거꾸로 되짚는다', () => {
    switchTab({ tab: 'menu', menuPage: null });
    useApp.setState({ menuPage: '앱 정보' });
    useApp.setState({ menuPage: '이용약관' });
    getS().back(); expect(at()).toEqual(['tabs', 'menu', '앱 정보']);
    getS().back(); expect(at()).toEqual(['tabs', 'menu', null]);
    getS().back(); expect(at()).toEqual(['tabs', 'home', null]);
  });

  test('홈의 하트 영역에서 성장 페이지로 갔다가 뒤로가면 홈', () => {
    useApp.setState({ tab: 'menu', menuPage: '고양이 성장' });
    getS().back(); expect(at()).toEqual(['tabs', 'home', null]);
  });

  test('상점 → 츄르 내역 → 뒤로가면 상점, 한 번 더 가면 홈', () => {
    useApp.setState({ tab: 'shop' });
    useApp.setState({ tab: 'menu', menuPage: '츄르 내역' });
    getS().back(); expect(at()).toEqual(['tabs', 'shop', null]);
    getS().back(); expect(at()).toEqual(['tabs', 'home', null]);
  });

  test('방 꾸미기에서 뒤로가면 들어오기 전 화면', () => {
    switchTab({ tab: 'menu', menuPage: null });
    useApp.setState({ tab: 'shop' });
    useApp.setState({ screen: 'decor' });
    getS().back(); expect(at()).toEqual(['tabs', 'shop', null]);
  });

  test('보호소 상세 → 뒤로가면 후원', () => {
    switchTab({ tab: 'donate' });
    useApp.setState({ tab: 'shelter' });
    getS().back(); expect(at()).toEqual(['tabs', 'donate', null]);
  });

  test('하단 탭으로 옮기면 기록을 새로 시작한다', () => {
    useApp.setState({ tab: 'menu', menuPage: '앱 정보' });
    switchTab({ tab: 'dex', menuPage: null });
    getS().back(); expect(at()).toEqual(['tabs', 'home', null]);
  });
});

describe('휴식 주기 · 노래 (디자인 라운드 9~13)', () => {
  beforeEach(fresh);

  test('휴식 주기에 닿으면 휴식 화면으로 갔다가 남은 집중을 이어 간다', () => {
    useApp.setState({ fast: true, restOn: true, restEvery: 25, restLen: 5 });
    getS().start(60);
    for (let i = 0; i < 60 && getS().screen === 'focus'; i++) getS().tick(); // 빠른 타이머: 틱마다 30초
    expect(getS()).toMatchObject({ screen: 'rest', midRest: true, rest: 300 });
    const remain = getS().remain;
    expect(getS().back()).toBe(true); // 도중 휴식에서는 뒤로가기로 세션을 버리지 않는다
    expect(getS().screen).toBe('rest');
    for (let i = 0; i < 10; i++) getS().tick();
    expect(getS()).toMatchObject({ screen: 'focus', midRest: false, remain });
    getS().tick();
    expect(getS().screen).toBe('focus'); // 같은 주기에서 다시 쉬지 않는다
  });

  test('휴식 없음이면 끝까지 집중한다', () => {
    useApp.setState({ fast: true, restOn: false });
    getS().start(60);
    for (let i = 0; i < 200 && getS().screen === 'focus'; i++) getS().tick();
    expect(getS().screen).toBe('done');
  });

  test('바로 집중 이어가기는 휴식한 만큼 종료 시각을 미룬다', () => {
    useApp.setState({ fast: false });
    getS().start(60);
    const endAt = getS().endAt;
    useApp.setState({ screen: 'rest', midRest: true, pauseAt: Date.now() - 60000 });
    getS().endRest();
    expect(getS()).toMatchObject({ screen: 'focus', midRest: false, pauseAt: 0 });
    expect(getS().endAt).toBeGreaterThanOrEqual(endAt + 60000);
  });

  test('고양이를 누르면 기본 5곡 또는 지금 고양이 전용 곡을 부르고 수집한다', () => {
    for (let i = 0; i < 40; i++) { getS().sing(); jest.advanceTimersByTime(4000); }
    const seen = getS().seenSongs;
    expect(seen.every(i => [0, 1, 2, 3, 4, 5].includes(i))).toBe(true); // 치즈태비 전용 = 5번
    expect(getS().behavior().id).not.toBe('sing');
    getS().sing();
    expect(getS().behavior().id).toBe('sing');
  });

  test('기본 5곡을 다 모으면 츄르 20을 한 번만 받는다', () => {
    useApp.setState({ seenSongs: [0, 1, 2, 3], churu: 0 });
    for (let i = 0; i < 60 && !getS().seenSongs.includes(4); i++) getS().sing();
    expect(getS().churu).toBe(20);
    expect(getS().songBonus.basic).toBe(true);
    getS().sing();
    expect(getS().churu).toBe(20);
  });

  test('도감의 듣기는 수집 상태를 바꾸지 않는다', () => {
    getS().sing(7);
    expect(getS().seenSongs).toEqual([0]);
    expect(getS().singUntil).toBe(0);
  });
});

describe('불멍 도트 고양이', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { nextAct, frameOf } = require('../src/stage/Hearth');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FRAMES, PALETTES, runsOf } = require('../src/stage/pixelCat');

  test('모든 그림은 20×14이고, 모든 고양이에 털색이 있다', () => {
    for (const rows of Object.values(FRAMES) as string[][]) { expect(rows).toHaveLength(14); rows.forEach(r => expect(r).toHaveLength(20)); }
    for (const id of ['cheese', 'blue', 'calico', 'tux', 'ragdoll', 'siam', 'persian', 'angora']) { expect(PALETTES[id]).toBeTruthy(); expect(runsOf('sit', id).length).toBeGreaterThan(20); }
  });

  test('동작은 이어지고, 오래 머무르면 잠들었다가 기지개를 켜고 걷는다', () => {
    let c = { x: 64, dir: 1, act: 'sit', until: 0, tx: 64, t0: 0 }, now = 0;
    const seen = new Set<string>();
    let r = 0; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 400; i++) { c = nextAct(c.act === 'walk' ? { ...c, x: c.tx } : c, (now += 1000), rnd); seen.add(c.act); expect(c.x).toBeGreaterThanOrEqual(0); expect(c.x).toBeLessThanOrEqual(120); }
    for (const a of ['walk', 'sit', 'groom', 'loaf', 'sleep', 'stretch']) expect(seen.has(a)).toBe(true);
    expect(Object.keys(FRAMES)).toContain(frameOf({ ...c, act: 'walk', t0: 0 }, 300));
  });
});

describe('노래 듣기 · 중지', () => {
  beforeEach(fresh);
  test('같은 곡을 다시 누르면 멈추고, 다른 곡은 앞 곡을 멈추고 재생한다', () => {
    useApp.setState({ toggles: { ...getS().toggles, sound: true } });
    getS().sing(0);
    expect(getS().playingSong).toBe(0);
    getS().sing(2);
    expect(getS().playingSong).toBe(2);
    getS().sing(2);
    expect(getS().playingSong).toBeNull();
    getS().sing(1);
    jest.advanceTimersByTime(10000);
    expect(getS().playingSong).toBeNull(); // 곡이 끝나면 버튼이 ▶ 듣기로 돌아온다
  });
});
