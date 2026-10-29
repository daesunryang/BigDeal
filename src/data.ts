// 프로토타입(집중냥 App.dc.html — 앱 이름은 냥집중으로 바뀜)의 상수를 옮긴 파일. 문구·가격·수치는 프로토타입 그대로다.

export type Fill =
  | { t: 'solid'; c: string }
  | { t: 'stripesV' | 'stripesH'; a: string; b: string; wa: number; wb: number }
  | { t: 'dots'; c: string; bg: string; r: number; gx: number; gy?: number }
  | { t: 'check'; c: string; bg: string; size: number }
  | { t: 'grid'; c: string; bg: string; size: number; w: number }
  | { t: 'diag'; a: string; b: string; wa: number; wb: number; angle: number };

export type Cat = { id: string; name: string; room: [number, number]; c: [number, number]; desc: string; plus?: boolean };

export const CATS: Cat[] = [
  { id: 'cheese', name: '치즈태비', room: [0, 0], c: [727, 440], desc: '햇살을 좋아하는 첫 번째 친구.' },
  { id: 'blue', name: '러시안 블루', room: [1, 0], c: [2098, 442], desc: '조용한 시간을 사랑하는 고양이.' },
  { id: 'calico', name: '삼색이', room: [0, 1], c: [729, 1170], desc: '호기심 많고 수다스러운 고양이.' },
  { id: 'tux', name: '코리안 숏헤어', room: [1, 1], c: [2121, 1159], desc: '턱시도를 입은 든든한 고양이.' },
  { id: 'ragdoll', name: '랙돌', room: [0, 2], c: [754, 1974], plus: true, desc: '안기는 걸 좋아하는 푸근한 고양이.' },
  { id: 'siam', name: '샴', room: [1, 2], c: [2103, 1971], plus: true, desc: '우아하고 말이 많은 고양이.' },
  { id: 'persian', name: '페르시안', room: [0, 3], c: [745, 2720], plus: true, desc: '느긋하게 털을 고르는 고양이.' },
  { id: 'angora', name: '터키시 앙고라', room: [1, 3], c: [2173, 2693], plus: true, desc: '서로 다른 눈빛이 매력인 고양이.' },
];
export const catById = (id: string) => CATS.find(c => c.id === id) ?? CATS[0];
export const IMG_W = 2752, IMG_H = 3072, WIN = 560;

export type AppInfo = { id: string; name: string; letter: string; color: string; usage: string; pkg?: string; icon?: string };
export const APPS: AppInfo[] = [
  { id: 'ig', name: '인스타그램', letter: '인', color: '#D9728A', usage: '1시간 12분' },
  { id: 'yt', name: '유튜브', letter: '유', color: '#D96B5B', usage: '2시간 3분' },
  { id: 'tt', name: '숏폼 영상', letter: '숏', color: '#4A3428', usage: '48분' },
  { id: 'wt', name: '웹툰', letter: '웹', color: '#7FB07F', usage: '35분' },
  { id: 'kk', name: '메신저', letter: '메', color: '#E3B440', usage: '1시간 20분' },
  { id: 'gm', name: '게임', letter: '게', color: '#7E9CC8', usage: '27분' },
];
// 실제 차단 빌드에서 처음에 켜 둘 앱 패키지
export const DEFAULT_BLOCK_PKGS = ['com.instagram.android', 'com.google.android.youtube', 'com.zhiliaoapp.musically', 'com.ss.android.ugc.trill', 'com.nhn.android.webtoon', 'com.naver.linewebtoon', 'com.twitter.android', 'com.facebook.katana'];

export const FOCUS_MSGS = ['고양이가 옆에서 조용히 지켜보고 있어요.', '잘하고 있어요. 휴대폰은 잠시 내려두세요.', '거의 다 왔어요. 고양이가 꼬리를 흔들어요.'];

export const WALL: Record<string, Fill> = {
  cream: { t: 'solid', c: '#F7EEDF' },
  mint: { t: 'stripesV', a: '#DDEFE3', b: '#C9E4D1', wa: 14, wb: 14 },
  pinkdot: { t: 'dots', c: '#F0B3B0', bg: '#FBE8E5', r: 3, gx: 22 },
  skycheck: { t: 'check', c: 'rgba(140,185,220,0.28)', bg: '#EEF5FA', size: 28 },
  lime: { t: 'solid', c: '#E4F0C4' }, napw: { t: 'solid', c: '#E4EAF0' }, playw: { t: 'solid', c: '#EFE3F3' }, kitw: { t: 'solid', c: '#F2E6CE' },
  sky: { t: 'solid', c: '#CFE6F3' }, atticw: { t: 'solid', c: '#EADFC9' }, studyw: { t: 'solid', c: '#E6DCEA' },
};
export const FLOOR: Record<string, Fill> = {
  wood: { t: 'stripesH', a: '#DCC29E', b: '#C9AD86', wa: 12, wb: 2 },
  pinkfloor: { t: 'solid', c: '#EFC0BE' },
  tile: { t: 'grid', c: 'rgba(74,52,40,0.14)', bg: '#EEE6D8', size: 26, w: 1.5 },
  gray: { t: 'solid', c: '#CFCAC3' }, napf: { t: 'solid', c: '#D5DCE6' }, playf: { t: 'solid', c: '#D9C9E3' }, kitf: { t: 'solid', c: '#E3D3B5' },
  grass: { t: 'solid', c: '#A9CFA0' }, atticf: { t: 'solid', c: '#CDB48C' }, studyf: { t: 'solid', c: '#BFA98C' },
};
// 평면도에서 바닥 단색
export const FLOOR_FLAT: Record<string, string> = { wood: '#DCC29E', pinkfloor: '#EFC0BE', tile: '#EEE6D8', gray: '#CFCAC3', napf: '#D5DCE6', playf: '#D9C9E3', kitf: '#E3D3B5', grass: '#A9CFA0', atticf: '#CDB48C', studyf: '#BFA98C' };

export type DecorKind = 'wall' | 'floor' | 'struct' | 'furniture' | 'props' | 'outfit' | 'snack' | 'special' | 'season';
export type DecorEntry = [string, string, number];
export const DECOR: Record<DecorKind, { label: string; single?: boolean; list: DecorEntry[] }> = {
  wall: { label: '벽지', single: true, list: [['cream', '크림', 0], ['mint', '민트 스트라이프', 15], ['pinkdot', '핑크 도트', 20], ['skycheck', '하늘 체크', 20], ['lime', '연두', 10]] },
  floor: { label: '바닥', single: true, list: [['wood', '원목', 0], ['pinkfloor', '핑크 장판', 12], ['tile', '타일', 18], ['gray', '그레이 카펫', 15]] },
  struct: { label: '구조', single: true, list: [['basic', '기본 창', 0], ['big', '큰 창', 30], ['arch', '아치 창', 25], ['attic', '다락방', 45]] },
  furniture: { label: '가구', list: [['rug', '초록 러그', 0], ['scratch', '스크래처', 15], ['tower', '캣타워', 50], ['hammock', '창가 해먹', 40], ['cushion', '생선 쿠션', 25]] },
  props: { label: '소품', list: [['plant', '캣닢 화분', 20], ['yarn', '털실 장난감', 12], ['frame', '나뭇잎 액자', 10], ['lamp', '펜던트 조명', 18]] },
  outfit: { label: '옷', single: true, list: [['none', '입히지 않기', 0], ['scarf', '빨간 스카프', 15], ['bow', '리본', 12], ['hat', '파티 모자', 20], ['witch', '마녀 모자', 25]] },
  snack: { label: '간식', list: [['tuna', '참치 캔', 10], ['dried', '북어 트릿', 6], ['milk', '고양이 우유', 8]] },
  special: { label: '전용', list: [] },
  season: { label: '시즌', list: [['pumpkin', '호박 쿠션', 18], ['leaves', '낙엽 러그', 14], ['ghost', '유령 가랜드', 16]] },
};
export const DECOR_KINDS = Object.keys(DECOR) as DecorKind[];

export const SWATCH: Record<string, string> = { basic: '#CFE6F3', big: '#BBDCEF', arch: '#D5E9F5', attic: '#E8D9C2', rug: '#A9CFA0', scratch: '#D9B98C', tower: '#B8A2D9', hammock: '#E59A4C', cushion: '#F2B8B5', plant: '#6FA56B', yarn: '#7E9CC8', frame: '#F6CFD6', lamp: '#F2C46B', none: '#F3EADB', scarf: '#D9604E', bow: '#F2B8B5', hat: '#B8A2D9', witch: '#4A3428', tuna: '#9DB6DA', dried: '#D9B98C', milk: '#FBF6EE', pumpkin: '#E59A4C', leaves: '#D98762', ghost: '#E2D4F0', sofa: '#B5714F', tv: '#2B221D', tunnel: '#C29D6E', ballpit: '#9DB6DA', bed: '#F2B8B5', nightlight: '#F2C46B', bowl: '#7E9CC8', table: '#D9B98C', flowers: '#F2B8B5', tree: '#6FA56B', trunk: '#8A6244', telescope: '#B8A2D9', desk: '#8A6244', books: '#B8A2D9', bookshelf: '#8A6244', fireplace: '#B5714F', seesaw: '#E59A4C', slide: '#7E9CC8', blanket: '#B8A2D9', curtain: '#F2B8B5', fridge: '#DCE8F3', fishbowl: '#9DB6DA', fence: '#D9B98C', pond: '#7E9CC8', globe: '#7E9CC8', lantern: '#F2C46B', standlamp: '#F2C46B', cabinet: '#8A6244' };

export type Mail = { id: number; type: 'reward' | 'report' | 'news' | 'event'; title: string; body: string; churu?: number; date: string; exp?: string; photo?: boolean };
export const MAILS: Mail[] = [
  { id: 1, type: 'reward', title: '웰컴 선물이 도착했어요', body: '냥집중에 온 걸 환영해요! 첫 집중을 응원하는 츄르를 보내요.', churu: 20, date: '오늘', exp: '7일 후 만료' },
  { id: 7, type: 'reward', title: '출석 보상 · 오늘 출석 체크', body: '오늘도 냥집중에 와 줘서 고마워요. 출석 보상 츄르를 받으세요.', churu: 3, date: '오늘', exp: '7일 후 만료' },
  { id: 9, type: 'report', title: '보리의 근황이 도착했어요', body: '후원해 주신 보리가 새 담요에서 곤히 자고 있어요. 사료도 잘 먹고 몸무게가 200g 늘었어요.', photo: true, date: '10.27' },
  { id: 2, type: 'reward', title: '출석 보상 · 4일 연속 달성', body: '4일 연속 집중 목표를 달성했어요. 보너스 츄르를 받으세요.', churu: 8, date: '어제', exp: '6일 후 만료' },
  { id: 8, type: 'reward', title: '치즈태비와 친밀도 ♥1 달성!', body: '치즈태비가 마음을 열었어요. 표정이 한 단계 부드러워졌어요. 축하 선물을 보내요.', churu: 5, date: '10.25', exp: '6일 후 만료' },
  { id: 6, type: 'event', title: '가을 츄르 이벤트 · 선물이 도착했어요', body: '10월 한 달 동안 매일 집중하면 보너스 츄르를 드려요. 오늘의 선물을 받아가세요.', churu: 15, date: '10.26', exp: '5일 후 만료' },
  { id: 3, type: 'report', title: '9월 기부 리포트', body: '햇살 고양이 쉼터에 냥집중 사용자들의 집중으로 사료 312kg이 전달됐어요. 새 가족을 만난 고양이 4마리의 근황도 함께 보내요.', photo: true, date: '10.01' },
  { id: 4, type: 'news', title: '창밖에 낯선 고양이가 나타났어요', body: '도감에서 츄르 30개로 새 고양이를 불러보세요. 어떤 고양이가 올지는 비밀이에요.', date: '10.24' },
  { id: 5, type: 'news', title: '[공지] 냥집중 1.0 출시 안내', body: '방해 앱 차단, 고양이 도감, 파트너 기부 기능이 정식 오픈했어요.', date: '10.20' },
];

export type BehId = 'idle' | 'nap' | 'meow' | 'stretch' | 'look' | 'hop' | 'purr' | 'sulky' | 'sing';
export const BEH: { id: BehId; name: string; g: string; bg: string; text: string }[] = [
  { id: 'idle', name: '쉬는 중', g: '♪', bg: '#F3EADB', text: '오늘도 같이 집중해요!' },
  { id: 'nap', name: '낮잠', g: 'z', bg: '#DCE8F3', text: '쿨쿨… 햇살 아래 낮잠 중이에요' },
  { id: 'meow', name: '야옹', g: '!', bg: '#F6E3C9', text: '야옹~ 놀아달래요' },
  { id: 'stretch', name: '기지개', g: '✦', bg: '#E3EFDF', text: '으쌰, 기지개 켜는 중' },
  { id: 'look', name: '두리번', g: '?', bg: '#EADCF3', text: '두리번두리번, 뭐가 있나?' },
  { id: 'hop', name: '콩콩', g: '↑', bg: '#F8DEDC', text: '신나서 콩콩 뛰어요' },
  { id: 'purr', name: '골골송', g: '♥', bg: '#F8DEDC', text: '골골골… 기분 최고예요' },
];
// 고양이 노래 (디자인 라운드 9~12). 기본 5곡 + 품종마다 전용 1곡. n = [음 높이(Hz), 길이(초)] — assets/sfx/song<i>.wav는 scripts/gen-songs.py로 이 표에서 만든다
export type Song = { name: string; t: string; n: [number, number][]; cat?: string };
export const SONGS: Song[] = [
  { name: '냐옹냐옹 왈츠', t: '야옹야옹~ 냐옹냐옹♪', n: [[660, .22], [880, .3], [660, .22], [784, .3], [988, .22], [880, .22], [784, .45]] },
  { name: '츄르 송', t: '냥냥냥~ 츄르 송♫', n: [[523, .18], [523, .18], [784, .18], [784, .18], [880, .18], [880, .18], [784, .4]] },
  { name: '낮잠 자장가', t: '골골~ 자장자장 야옹♪', n: [[784, .35], [659, .35], [698, .35], [587, .5], [523, .6]] },
  { name: '신나는 냥', t: '미야우! 신나는 냥♬', n: [[880, .12], [988, .12], [1047, .12], [988, .12], [880, .12], [784, .24], [880, .12], [1047, .36]] },
  { name: '아침 인사', t: '야~옹 야~옹 아침 냥♪', n: [[587, .3], [740, .3], [880, .45], [740, .2], [880, .2], [1175, .5]] },
  { cat: 'cheese', name: '햇살 항아리', t: '햇살이 따끈냥~♪', n: [[523, .2], [659, .2], [784, .3], [659, .2], [880, .4], [784, .5]] },
  { cat: 'blue', name: '조용한 밤', t: '쉬잇… 조용히 냐옹♫', n: [[440, .4], [523, .4], [494, .4], [392, .6], [440, .7]] },
  { cat: 'calico', name: '수다 폭발', t: '냐냐냐냐! 있잖아♬', n: [[784, .1], [880, .1], [784, .1], [988, .1], [880, .1], [1047, .1], [988, .1], [1175, .3]] },
  { cat: 'tux', name: '턱시도 행진', t: '둥둥 야옹 행진♪', n: [[392, .25], [392, .25], [523, .25], [392, .25], [659, .25], [523, .5]] },
  { cat: 'ragdoll', name: '포근한 안기', t: '안아줘옹~ 포근♫', n: [[587, .35], [523, .35], [587, .35], [659, .35], [587, .7]] },
  { cat: 'siam', name: '수다쟁이 아리아', t: '마아아옹~ 마아옹!♬', n: [[880, .3], [1047, .2], [1175, .2], [1319, .4], [1175, .2], [1047, .5]] },
  { cat: 'persian', name: '느긋한 오후', t: '느엇… 냐아옹♪', n: [[349, .5], [392, .5], [440, .5], [392, .8]] },
  { cat: 'angora', name: '두 빛깔 왕국', t: '반짝반짝 야옹♫', n: [[1047, .15], [1319, .15], [1568, .3], [1319, .15], [1175, .15], [1047, .45]] },
];
export const songMs = (sg: Song) => Math.max(2600, sg.n.reduce((a, x) => a + x[1], 0) * 1000 + 900);
export const REST_PRESETS: [number, number][] = [[25, 5], [50, 10], [90, 15], [0, 0]];
export const TAGS = ['공부', '업무', '독서', '운동', '창작', '기타'];
export const ANIMALS = [
  { id: 'a0', sh: 0, name: '보리', age: '3살 · 수컷', story: '비 오는 날 쉼터 앞에서 구조된 치즈냥이에요. 사람 손길을 좋아하는 순둥이예요.' },
  { id: 'a1', sh: 0, name: '콩이', age: '1살 · 암컷', story: '겁이 많지만 간식 앞에서는 용감해져요. 평생 가족을 기다리고 있어요.' },
  { id: 'a2', sh: 1, name: '나비', age: '5살 · 암컷', story: '골목에서 새끼들을 돌보던 어미 고양이예요. 지금은 쉼터의 든든한 맏언니예요.' },
  { id: 'a3', sh: 1, name: '달이', age: '2살 · 수컷', story: '달빛 같은 은회색 털을 가졌어요. 창가에서 햇살 쬐는 걸 가장 좋아해요.' },
];
export const SHELTER_META = [
  { name: '햇살 고양이 쉼터', place: '경기 파주', cats: 38, goal: 20, photo: '보호소 고양이 사진' },
  { name: '골목냥 돌봄 협회', place: '서울 마포', cats: 21, goal: 15, photo: '길고양이 급식소 사진' },
];
export const SHN = SHELTER_META.map(s => s.name);
export const FEED = [
  { shelter: '햇살 고양이 쉼터', animal: '보리', date: '10.27', title: '보리가 처음으로 배를 보여줬어요', body: '한 달 만에 마음을 열었어요. 새 담요 위에서 곤히 자고, 사료도 잘 먹어요.' },
  { shelter: '골목냥 돌봄 협회', animal: '달이', date: '10.25', title: '달이의 중성화 수술이 잘 끝났어요', body: '회복 중이라 며칠은 조용히 쉬어요. 응원해 주신 마음 덕분이에요.' },
  { shelter: '햇살 고양이 쉼터', animal: '콩이', date: '10.22', title: '콩이의 입양 상담이 시작됐어요', body: '첫 방문 가족과 짧게 만났어요. 낯선 손길에도 꼬리를 살짝 세웠어요.' },
  { shelter: '골목냥 돌봄 협회', animal: '나비', date: '10.18', title: '이번 달 급식소 사료가 도착했어요', body: '냥집중 사용자들의 집중으로 모인 사료가 급식소 세 곳에 나뉘어 전달됐어요.' },
];
export const NOTICES = [
  { pin: true, t: '냥집중 1.0 정식 오픈 안내', d: '10.20', b: '방해 앱 차단, 고양이 도감, 파트너 기부 기능이 정식 오픈했어요. 불편한 점은 문의하기로 알려 주세요.' },
  { pin: false, t: '엄격 모드가 추가됐어요', d: '10.26', b: '엄격 모드를 켜면 집중 중 포기 버튼이 사라져요. 긴급할 때는 3초간 길게 눌러 종료할 수 있지만 친밀도가 더 크게 줄어요.' },
  { pin: false, t: '가을 츄르 이벤트', d: '10.26', b: '10월 31일까지 매일 집중을 완료하면 우편함으로 보너스 츄르가 도착해요.' },
  { pin: false, t: '11월 정기 점검 안내', d: '10.24', b: '11월 5일 02:00~04:00 서버 점검이 있어요. 점검 중에도 진행 중인 집중은 이어져요.' },
];
export const FAQS: [string, string][] = [
  ['포기하면 어떻게 되나요?', '보상과 기부가 없고 친밀도가 3 줄어요(엄격 모드는 6). 고양이는 다음 성공 때까지 시무룩해 있어요.'],
  ['츄르는 어디에 쓰나요?', '방 꾸미기 아이템 구매, 새 고양이 만나기, 보호소 동물 후원에 쓸 수 있어요.'],
  ['차단 앱은 어떻게 막나요?', 'Android는 사용 정보 접근과 다른 앱 위에 표시 권한으로, iOS는 스크린 타임으로 막아요. 권한 설정에서 확인할 수 있어요.'],
  ['후원한 사료는 정말 전달되나요?', '매달 파트너와 보호소가 전달 내역을 확인하고, 기부 리포트를 우편함으로 보내드려요.'],
  ['기기를 바꾸면 기록이 사라지나요?', '연결한 계정으로 로그인하면 고양이, 집중 기록, 후원 내역을 그대로 불러와요.'],
  ['엄격 모드는 언제 쓰면 좋나요?', '중간에 흔들리기 쉬운 중요한 집중에 추천해요. 안내와 알림도 최소한으로 줄어요.'],
];
export const DOCS: Record<string, [string, string][]> = {
  '이용약관': [['제1조 (목적)', '이 약관은 냥집중이 제공하는 집중 타이머, 고양이 육성, 후원 연계 서비스의 이용 조건과 절차를 정합니다.'], ['제2조 (계정)', '이용자는 Google, Apple, 이메일 중 하나로 가입할 수 있으며 계정 정보는 정확하게 유지해야 합니다.'], ['제3조 (츄르와 보상)', '츄르는 서비스 내 재화로 현금으로 환급되지 않습니다. 부정한 방법으로 얻은 츄르는 회수될 수 있습니다.'], ['제4조 (후원)', '파트너 기부는 집중 목표 달성에 따라 이행되며, 결제 후원은 별도 안내에 따라 보호소에 전달됩니다.']],
  '개인정보 처리방침': [['수집 항목', '이메일, 닉네임, 로그인 제공자 정보, 집중 기록, 차단 앱 설정을 수집합니다.'], ['이용 목적', '계정 식별, 기록 동기화, 후원 내역 관리, 서비스 개선에 이용합니다.'], ['앱 사용 정보', '앱 차단을 위해 실행 중인 앱 정보를 기기 안에서만 확인하며 서버로 전송하지 않습니다.'], ['보관과 삭제', '회원 탈퇴 시 개인정보는 지체 없이 삭제하며, 법령상 보관 의무가 있는 정보는 해당 기간 보관합니다.']],
};
export const LIMITED = ['witch', 'pumpkin', 'leaves', 'ghost'];
export const PG = { plus: '냥집중 Plus', partner: '파트너 단체 소개', widget: '위젯 미리보기', attend: '출석 체크', goal: '집중 목표', report: '주간 리포트 · 월간 회고', friends: '친구와 비교', profile: '내 정보 수정', withdraw: '회원 탈퇴', backup: '데이터 백업 · 동기화', growth: '고양이 성장', ledger: '츄르 내역', a11y: '접근성', sfx: '효과음 · 햅틱', oss: '오픈소스 라이선스', states: '상태 화면 모음', platform: '플랫폼 차이', demo: '데모 상황', remind: '집중 리마인더' };
export const FRIENDS = [{ name: '하늘', m: 480, c: 'blue', code: '' }, { name: '마루', m: 355, c: 'calico', code: '' }, { name: '연우', m: 120, c: 'tux', code: '' }];
export const SHD = [
  { since: '2016', budget: [['사료', 68], ['진료·중성화', 22], ['시설·운영', 10]] as [string, number][], facts: [['법인 형태', '비영리 임의단체'], ['고유번호', '경기-파주-0231'], ['연간 감사 보고', '2025년 공개'], ['방문 확인', '냥집중 팀 연 2회']] },
  { since: '2019', budget: [['사료', 62], ['진료·중성화', 28], ['시설·운영', 10]] as [string, number][], facts: [['법인 형태', '사단법인'], ['고유번호', '서울-마포-0118'], ['연간 감사 보고', '2025년 공개'], ['방문 확인', '냥집중 팀 연 2회']] },
];
export const OSS = [
  ['React · React Native', 'MIT', 'Copyright (c) Meta Platforms, Inc. and affiliates. 저작권 고지와 허가 문구를 포함하면 자유롭게 사용·복사·수정·배포할 수 있어요.'],
  ['Expo', 'MIT', 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo).'],
  ['Firebase JS SDK', 'Apache-2.0', 'Copyright Google LLC. Apache License 2.0에 따라 사용해요.'],
  ['Zustand', 'MIT', 'Copyright (c) 2019 Paul Henschel.'],
  ['react-native-svg', 'MIT', 'Copyright (c) 2015-2016 Horcrux.'],
  ['Jua 글꼴', 'SIL OFL 1.1', 'Copyright The Jua Project Authors. 글꼴은 자유롭게 쓰고 재배포할 수 있지만 글꼴만 단독으로 판매할 수 없어요.'],
  ['Gowun Dodum 글꼴', 'SIL OFL 1.1', 'Copyright The Gowun Dodum Project Authors.'],
];
export const PLAT = [['로그인', 'Google · 이메일', 'Apple · Google · 이메일'], ['앱 차단', '사용 정보 접근 + 다른 앱 위에 표시', '스크린 타임(FamilyControls)으로 앱 선택'], ['차단 화면', '오버레이로 고양이 화면 표시', 'Shield 확장 화면으로 대체'], ['권한 안내', '설정 앱에서 두 항목 허용', '스크린 타임 권한 팝업 1회'], ['알림', '진행 중 알림 고정', '로컬 알림 · Live Activity'], ['뒤로가기', '시스템 뒤로 제스처', '왼쪽 가장자리 스와이프'], ['결제 후원', 'Google Play 결제', 'Apple 인앱결제'], ['상태바', '펀치홀 카메라', '다이내믹 아일랜드'], ['햅틱', '진동 패턴', 'Taptic Engine 시스템 햅틱']];

export type RoomDef = { id: string; name: string; gc: [number, number]; gr: [number, number]; price: number; ext?: boolean };
export const ROOMS: RoomDef[] = [
  { id: 'liv', name: '거실 · 내 방', gc: [1, 5], gr: [3, 6], price: 0 },
  { id: 'play', name: '놀이방', gc: [1, 3], gr: [1, 3], price: 60 },
  { id: 'nap', name: '낮잠방', gc: [3, 5], gr: [1, 3], price: 0 },
  { id: 'kit', name: '간식 주방', gc: [5, 7], gr: [1, 3], price: 80 },
  { id: 'gar', name: '마당', gc: [5, 7], gr: [3, 6], price: 120 },
  { id: 'attic', name: '다락방', gc: [1, 4], gr: [6, 7], price: 0, ext: true },
  { id: 'study', name: '서재', gc: [4, 7], gr: [6, 7], price: 0, ext: true },
];
export const ROOM_DEF: Record<string, { wall: string; floor: string; struct: string; items: string[] }> = {
  play: { wall: 'playw', floor: 'playf', struct: 'basic', items: ['tower', 'scratch', 'yarn'] },
  nap: { wall: 'napw', floor: 'napf', struct: 'basic', items: ['cushion', 'lamp'] },
  kit: { wall: 'kitw', floor: 'kitf', struct: 'basic', items: ['plant', 'rug'] },
  gar: { wall: 'sky', floor: 'grass', struct: 'none', items: ['plant', 'yarn'] },
  attic: { wall: 'atticw', floor: 'atticf', struct: 'attic', items: ['lamp'] },
  study: { wall: 'studyw', floor: 'studyf', struct: 'basic', items: ['frame', 'lamp', 'rug'] },
};
export const ROOM_DESC: Record<string, string> = { liv: '지금 꾸미고 있는 기본 방이에요.', play: '캣타워와 터널이 있는 놀이방. 콩콩 뛰는 행동이 여기서 나와요.', nap: '햇살이 드는 작은 방. 낮잠 행동이 여기서 나와요.', kit: '간식을 먹는 곳. 간식을 주면 여기서 맛있게 먹어요.', gar: '햇볕과 풀이 있는 마당. 두리번거리는 행동이 여기서 나와요.', attic: '비밀 기지 같은 다락방. 집을 넓히면 열려요.', study: '조용한 서재. 집을 넓히면 열려요.' };
export const SPECIAL: Record<string, DecorEntry[]> = { liv: [['sofa', '소파', 30], ['tv', 'TV 선반', 26], ['bookshelf', '책장', 32], ['fireplace', '벽난로', 40]], play: [['tunnel', '캣 터널', 25], ['ballpit', '공 풀장', 30], ['seesaw', '시소', 28], ['slide', '미끄럼틀', 34]], nap: [['bed', '수면 침대', 28], ['nightlight', '수면등', 16], ['blanket', '담요', 18], ['curtain', '커튼', 20]], kit: [['bowl', '밥그릇', 10], ['table', '식탁', 24], ['fridge', '냉장고', 30], ['fishbowl', '어항', 22]], gar: [['flowers', '꽃밭', 14], ['tree', '나무', 32], ['fence', '울타리', 18], ['pond', '연못', 34]], attic: [['trunk', '나무 상자', 20], ['telescope', '망원경', 35], ['globe', '지구본', 26], ['lantern', '랜턴', 18]], study: [['desk', '책상', 30], ['books', '책 더미', 14], ['standlamp', '스탠드', 20], ['cabinet', '서랍장', 26]] };
// 평면도(탑뷰)에서 가구 위치: [left, top, width, height, color, radius]
export const TOPD: Record<string, [number, number, number, number, string, number | 'round']> = {
  rug: [22, 38, 50, 42, '#A9CFA0', 'round'], tower: [6, 10, 20, 28, '#B8A2D9', 'round'], scratch: [32, 8, 12, 24, '#D9B98C', 4], hammock: [60, 10, 32, 18, '#E59A4C', 6], cushion: [70, 68, 24, 22, '#F2B8B5', 'round'], plant: [5, 66, 14, 24, '#6FA56B', 'round'], yarn: [50, 76, 10, 16, '#7E9CC8', 'round'], lamp: [44, 44, 10, 16, '#F2C46B', 'round'], pumpkin: [76, 40, 12, 20, '#E59A4C', 'round'], leaves: [4, 44, 16, 20, '#D98762', 'round'], ghost: [28, 88, 40, 8, '#E2D4F0', 4], frame: [8, -3, 14, 6, '#F6CFD6', 2],
  sofa: [10, 12, 40, 24, '#B5714F', 8], tv: [60, 4, 34, 14, '#4A3428', 3], tunnel: [10, 44, 60, 28, '#C29D6E', 40], ballpit: [52, 40, 40, 44, '#F2B8B5', 'round'], bed: [22, 28, 56, 48, '#F2B8B5', 12], nightlight: [78, 14, 12, 16, '#F2C46B', 'round'], bowl: [40, 50, 20, 24, '#9DB6DA', 'round'], table: [20, 24, 52, 46, '#D9B98C', 6], flowers: [8, 70, 84, 20, '#F2B8B5', 'round'], tree: [62, 12, 30, 42, '#6FA56B', 'round'], trunk: [60, 50, 28, 30, '#8A6244', 4], telescope: [64, 10, 10, 46, '#4A3428', 3], desk: [10, 10, 60, 30, '#8A6244', 4], books: [76, 60, 16, 26, '#B8A2D9', 2], bookshelf: [4, -2, 40, 14, '#8A6244', 3], fireplace: [56, -2, 28, 18, '#B5714F', 4], seesaw: [20, 52, 50, 12, '#E59A4C', 6], slide: [64, 20, 20, 50, '#7E9CC8', 8], blanket: [30, 36, 44, 36, '#B8A2D9', 8], curtain: [2, -2, 14, 40, '#F2B8B5', 2], fridge: [4, -2, 20, 26, '#DCE8F3', 4], fishbowl: [70, 60, 16, 22, '#9DB6DA', 'round'], fence: [2, -2, 96, 8, '#D9B98C', 2], pond: [10, 50, 46, 34, '#7E9CC8', 'round'], globe: [70, 12, 16, 22, '#7E9CC8', 'round'], lantern: [8, 60, 12, 18, '#F2C46B', 4], standlamp: [6, 10, 8, 30, '#F2C46B', 'round'], cabinet: [60, 4, 34, 16, '#8A6244', 3],
};
export const MOODS = ['새침함', '경계 풀림', '편안함', '기분 좋음', '골골송', '애교 만점'];
export const PARTNER_ROWS = [['단체명', '냠냠펫푸드 (가칭)'], ['기부 방식', '집중 목표 달성 1회당 사료 100g'], ['전달 주기', '매월 말 보호소 2곳에 일괄 전달'], ['검증', '전달 영수증과 보호소 확인서를 기부 리포트로 공개'], ['문의', 'partner@jibjungnyang.example']];
export const WEEK_DEMO = [40, 75, 25, 90, 50, 60];
export const PLUS_PLANS: [string, string, string, string][] = [['life', '평생', '₩19,900', '한 번 결제로 계속 · 월간 약 5개월치'], ['month', '월간', '₩3,900', '매달 결제 · 언제든 해지']];

export const isoDay = (o: number) => { const d = new Date(Date.now() - o * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export const streakOf = (list: string[]) => { const set = new Set(list); let n = 0, o = set.has(isoDay(0)) ? 0 : 1; while (set.has(isoDay(o))) { n++; o++; } return n; };
export const reward = (min: number) => ({ churu: Math.round(min * 0.4), aff: Math.max(3, Math.round(min / 2.5)) });
export const growthOf = (a: number) => { const i = a < 40 ? 0 : a < 80 ? 1 : 2; return { idx: i, f: [0.74, 0.88, 1][i], name: ['아기 고양이', '어린 고양이', '어른 고양이'][i] }; };
export const won = (n: number) => '₩' + n.toLocaleString('ko-KR');
