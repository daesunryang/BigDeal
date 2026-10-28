import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { reward, isoDay, streakOf, growthOf } from '../src/data';
import { getS, useApp } from '../src/store';

jest.useFakeTimers();

const fresh = () => { getS().reset(); useApp.setState({ screen: 'tabs', tab: 'home', loggedIn: true }); };

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
    expect(getS().back()).toBe(true); expect(getS().menuPage).toBeNull();
    expect(getS().back()).toBe(true); expect(getS().tab).toBe('home');
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
