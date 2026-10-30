// 프로토타입처럼 주요 화면 문구만 번역한다. 사전에 없는 문구는 한국어 그대로 둔다.
// <Txt>가 문자열 자식을 받으면 자동으로 이 함수를 거친다.
export type Lang = '한국어' | 'English' | '日本語';

const LD: [string, string, string][] = [['홈', 'Home', 'ホーム'], ['도감', 'Collection', '図鑑'], ['뽑기', 'Draw', 'ガチャ'], ['고양이 뽑기', 'Cat draw', 'ねこガチャ'], ['뽑기 고양이', 'Draw-only cats', 'ガチャのねこ'], ['후원', 'Support', '応援'], ['우편함', 'Mailbox', '郵便受け'], ['메뉴', 'Menu', 'メニュー'],
  ['얼마나 집중할까요?', 'How long will you focus?', 'どのくらい集中する?'], ['종료 시각 · 숫자를 눌러 설정', 'End time · tap the numbers', '終了時刻・数字をタップ'], ['24시간', '24-hour', '24時間'], ['12시간', '12-hour', '12時間'], ['확인', 'OK', 'OK'], ['변경 ›', 'Change ›', '変更 ›'],
  ['방 꾸미기 ›', 'Decorate ›', '部屋を飾る ›'], ['방 꾸미기', 'Decorate room', '部屋を飾る'], ['이 방 꾸미기 ›', 'Decorate this room ›', 'この部屋を飾る ›'], ['츄르', 'Churu', 'チュール'], ['집중 시작 · 보상', 'Start focus · reward', '集中スタート・報酬'], ['집중 시간', 'Focus time', '集中時間'], ['개 앱 차단', 'apps blocked', '個のアプリをブロック'],
  ['오늘 집중', 'Today', '今日の集中'], ['분', 'min', '分'], ['지금 표정 ·', 'Mood ·', '今の表情 ·'], ['다음 하트까지', 'Next heart', '次のハートまで'], ['포기하기', 'Give up', 'あきらめる'], ['집중으로 돌아가기', 'Back to focus', '集中に戻る'], ['잘했어요!', 'Great job!', 'よくできました!'], ['홈으로', 'Home', 'ホームへ'], ['후원 현황', 'Support status', '応援状況'], ['휴식 5분', '5-min break', '5分休憩'],
  ['집중 기록', 'Focus log', '集中記録'], ['이번 주', 'This week', '今週'], ['최근 세션', 'Recent sessions', '最近のセッション'], ['상점 · 꾸미기', 'Shop · Decor', 'ショップ・飾り'], ['고양이', 'Cats', 'ねこ'], ['행동', 'Behaviors', 'しぐさ'], ['아이템', 'Items', 'アイテム'], ['새로운 고양이 만나기', 'Meet a new cat', '新しいねこに会う'],
  ['함께 후원', 'Sponsor together', 'みんなで応援'], ['후원하기', 'Sponsor', '応援する'], ['소식 피드', 'News feed', 'ニュース'], ['내 후원', 'My support', '私の応援'], ['츄르로 후원', 'With Churu', 'チュールで応援'], ['결제 후원', 'With payment', '決済で応援'],
  ['모두 받기', 'Claim all', 'すべて受け取る'], ['전체', 'All', 'すべて'], ['보상', 'Rewards', '報酬'], ['공지·이벤트', 'News & events', 'お知らせ'], ['모두 읽음', 'Mark all read', 'すべて既読'], ['읽은 우편 삭제', 'Delete read', '既読を削除'], ['삭제', 'Delete', '削除'],
  ['내 활동', 'My activity', 'アクティビティ'], ['집중 설정', 'Focus settings', '集中設定'], ['앱 설정', 'App settings', 'アプリ設定'], ['계정', 'Account', 'アカウント'], ['고객 지원', 'Help', 'サポート'], ['프로토타입 검토', 'Prototype review', 'プロトタイプ確認'],
  ['알림', 'Notifications', '通知'], ['소리 · 진동', 'Sound · haptics', 'サウンド・振動'], ['화면 테마', 'Theme', 'テーマ'], ['언어', 'Language', '言語'], ['접근성', 'Accessibility', 'アクセシビリティ'], ['효과음 · 햅틱', 'Sound effects · haptics', '効果音・ハプティクス'], ['권한 설정', 'Permissions', '権限設定'],
  ['엄격 모드', 'Strict mode', '厳格モード'], ['시계 형식', 'Clock format', '時計の形式'], ['기본 차단 앱', 'Default blocked apps', 'ブロックするアプリ'], ['집중 목표', 'Daily goal', '集中目標'], ['집중 리마인더', 'Focus reminder', '集中リマインダー'], ['출석 체크', 'Check-in', '出席チェック'], ['업적 · 배지', 'Achievements', '実績・バッジ'],
  ['친구와 비교', 'Friends', '友だちと比較'], ['고양이 성장', 'Cat growth', 'ねこの成長'], ['츄르 내역', 'Churu history', 'チュール履歴'], ['로그아웃', 'Log out', 'ログアウト'], ['공지사항', 'Notices', 'お知らせ'], ['자주 묻는 질문', 'FAQ', 'よくある質問'], ['문의하기', 'Contact us', 'お問い合わせ'], ['이용약관', 'Terms of Service', '利用規約'], ['개인정보 처리방침', 'Privacy Policy', 'プライバシーポリシー'], ['앱 정보', 'About', 'アプリ情報'],
  ['우리 집', 'Our house', 'わが家'], ['낮잠방', 'Nap room', 'お昼寝部屋'], ['놀이방', 'Play room', '遊び部屋'], ['마당', 'Yard', '庭'], ['간식 주방', 'Snack kitchen', 'おやつキッチン'], ['거실 · 내 방', 'Living room', 'リビング'], ['다락방', 'Attic', '屋根裏'], ['서재', 'Study', '書斎'], ['이름 바꾸기', 'Rename', '名前を変更'], ['취소', 'Cancel', 'キャンセル'], ['저장', 'Save', '保存'], ['닫기', 'Close', '閉じる'],
  ['벽지', 'Wallpaper', '壁紙'], ['바닥', 'Floor', '床'], ['구조', 'Layout', '構造'], ['가구', 'Furniture', '家具'], ['소품', 'Props', '小物'], ['옷', 'Outfits', '服'], ['간식', 'Snacks', 'おやつ'], ['시즌', 'Season', 'シーズン'], ['전용', 'Room only', '専用'], ['집중 중', 'Focusing', '集中中'], ['다음', 'Next', '次へ'], ['건너뛰기', 'Skip', 'スキップ']];
const LPAT: [RegExp, string, string][] = [[/^(\d+)시간 (\d+)분$/, '$1h $2m', '$1時間$2分'], [/^(\d+)분 집중 완료$/, '$1 min focus done', '$1分の集中が完了'], [/^내 후원 (.+)kg$/, 'My support $1kg', '私の応援 $1kg']];
const DICT = new Map(LD.map(x => [x[0], x]));

export function tr(text: string, lang: Lang): string {
  const L = lang === 'English' ? 1 : lang === '日本語' ? 2 : 0;
  if (!L) return text;
  const k = text.trim();
  const e = DICT.get(k);
  let out = e ? e[L] : null;
  if (!out) for (const p of LPAT) if (p[0].test(k)) { out = k.replace(p[0], p[L]); break; }
  return out ? text.replace(k, out) : text;
}
