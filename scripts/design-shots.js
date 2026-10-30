// 실제 앱(웹 빌드, 데모)을 화면별로 캡처해 Claude Design 캔버스의 "실제 앱" 페이지에 올릴 이미지를 만든다.
// 사용: npx expo start --web --port 8081 을 켠 뒤  node scripts/design-shots.js <저장 폴더>
// (Playwright가 설치된 환경에서 실행. 화면 크기는 캔버스의 휴대폰 크기 390×844)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = process.argv[2] || 'design-shots';
const URL = process.env.APP_URL || 'http://localhost:8081';

// [파일 이름, 캔버스에 보일 제목, 그 화면까지 가는 동작]
const SHOTS = [
  ['01-login', '로그인', async () => {}],
  ['02-onboard', '권한 안내', async t => { await t.click('Google 계정으로 계속하기'); await t.click('focus.kim@gmail.com'); }],
  ['03-home', '홈', async t => { await t.click('사용 정보 접근 허용'); await t.click('다른 앱 위에 표시'); await t.click('고양이 만나러 가기'); await t.wait(1200); await t.click('건너뛰기'); }],
  ['04-settings', '집중 설정 창', async t => { await t.p.getByLabel(/집중 종료 시각/).click(); await t.wait(500); }],
  ['05-sing', '고양이 노래', async t => { await t.click('확인'); await t.p.getByLabel(/노래 듣기/).click(); await t.wait(300); }],
  ['06-house', '우리 집 평면도', async t => { await t.wait(3500); await t.p.mouse.click(300, 175); }],
  ['07-decor', '방 꾸미기', async t => { await t.click('✕'); await t.click('방 꾸미기 ›'); await t.click('가구'); await t.click('캣타워'); }],
  ['08-focus', '집중', async t => { await t.click('취소'); await t.back(); await t.click('집중 시작'); await t.wait(1200); }],
  ['08b-hearth', '불멍 크게 보기', async t => { await t.p.getByLabel('불멍 화면 크게 보기').click(); await t.wait(1200); }],
  ['09-blocked', '차단 화면', async t => { await t.p.getByLabel('불멍 화면 닫기').click(); await t.wait(400); await t.click('(데모) 인스타그램 열어보기'); }],
  ['10-rest', '휴식 자동 전환', async t => { await t.click('집중으로 돌아가기'); await t.until('바로 집중 이어가기'); await t.wait(600); }],
  ['11-done', '집중 완료', async t => { await t.click('바로 집중 이어가기'); await t.until('잘했어요!'); await t.wait(1500); }],
  ['12-share', '공유 카드', async t => { await t.click('공유 카드'); }],
  ['13-dex', '도감', async t => { await t.click('닫기'); await t.click('홈으로'); await t.tab('도감'); }],
  ['14-dex-song', '도감 · 노래', async t => { await t.click('노래'); }],
  ['15-plus', 'Plus', async t => { await t.click('고양이'); await t.wheel(600); await t.click('Plus 구독으로 만나요'); }],
  ['16-donate', '후원', async t => { await t.back(); await t.tab('후원'); }],
  ['17-shelter', '보호소 상세', async t => { await t.click('투명성 정보 ›'); }],
  ['18-mail', '우편함', async t => { await t.back(); await t.tab('우편함'); }],
  ['19-menu', '메뉴', async t => { await t.tab('메뉴'); }],
  ['20-about', '앱 정보 · 업데이트 확인', async t => { await t.wheel(2500); await t.click('앱 정보'); }],
  ['21-attend', '출석 체크', async t => { await t.back(); await t.wheel(-2500); await t.click('출석 체크'); }],
  ['22-report', '리포트', async t => { await t.back(); await t.click('주간 리포트 · 월간 회고'); }],
  ['23-stats', '집중 기록', async t => { await t.back(); await t.click('집중 기록'); }],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const t = {
    p,
    wait: ms => p.waitForTimeout(ms),
    until: x => p.getByText(x, { exact: true }).first().waitFor({ timeout: 40000 }),
    click: async x => { const l = typeof x === 'string' ? p.getByText(x, { exact: true }) : p.getByText(x); await l.first().click(); await p.waitForTimeout(450); },
    tab: async x => { await p.getByText(x, { exact: true }).last().click(); await p.waitForTimeout(450); },
    back: async () => { await p.getByLabel('뒤로').first().click(); await p.waitForTimeout(450); },
    wheel: async dy => { await p.mouse.move(195, 420); await p.mouse.wheel(0, dy); await p.waitForTimeout(400); },
  };
  await p.goto(URL, { waitUntil: 'networkidle', timeout: 180000 });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(4200);
  const done = [];
  for (const [file, title, step] of SHOTS) {
    try { await step(t); await p.waitForTimeout(700); await p.screenshot({ path: path.join(OUT, file + '.png') }); done.push({ file: file + '.png', title }); }
    catch (e) { console.warn('건너뜀', file, e.message.split('\n')[0]); }
  }
  fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(done, null, 2));
  console.log(done.length + '/' + SHOTS.length + ' 화면 캡처');
  await b.close();
})();
