import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { IS_FULL } from '../config';
import { catById } from '../data';
import { State, useApp } from '../store';

// 정식 빌드의 실제 알림: 집중 리마인더(요일·시간 반복)와 목표 달성 알림.
// 데모 빌드는 화면만 보여 주고 알림을 예약하지 않는다.
export const notifyEnabled = IS_FULL && Platform.OS !== 'web';

const CH_REMIND = 'jjn_remind', CH_GOAL = 'jjn_goal';
const REMIND_ID = (i: number) => 'jjn-remind-' + i;

export async function initNotify() {
  if (!notifyEnabled) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CH_REMIND, { name: '집중 리마인더', importance: Notifications.AndroidImportance.DEFAULT }).catch(() => {});
    await Notifications.setNotificationChannelAsync(CH_GOAL, { name: '목표 달성', importance: Notifications.AndroidImportance.DEFAULT }).catch(() => {});
  }
}

export async function ensurePermission() {
  if (!notifyEnabled) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// 화면의 요일 순서(월~일, 0~6)를 알림 요일(1=일요일 … 7=토요일)로 바꾼다
export const toWeekday = (i: number) => ((i + 1) % 7) + 1;

export function reminderPlan(s: Pick<State, 'remind' | 'toggles'>) {
  if (!s.toggles.notif || !s.remind.on) return [];
  const [hour, minute] = s.remind.time.split(':').map(Number);
  return s.remind.days.map((on, i) => (on ? { i, weekday: toWeekday(i), hour, minute } : null)).filter(Boolean) as { i: number; weekday: number; hour: number; minute: number }[];
}

let last = '';
export async function syncReminders(s: State) {
  if (!notifyEnabled) return;
  const plan = reminderPlan(s), cat = catById(s.catId).name;
  const key = JSON.stringify([plan, cat]);
  if (key === last) return;
  last = key;
  for (let i = 0; i < 7; i++) await Notifications.cancelScheduledNotificationAsync(REMIND_ID(i)).catch(() => {});
  if (!plan.length || !(await ensurePermission())) return;
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: REMIND_ID(p.i),
      content: { title: '같이 집중할까요?', body: `${cat}가 기다리고 있어요. 지금 집중을 시작해 보세요.` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: p.weekday, hour: p.hour, minute: p.minute, channelId: CH_REMIND },
    }).catch(e => console.warn('schedule reminder', e));
  }
}

export async function notifyGoal(goal: number, catName: string) {
  if (!notifyEnabled || !useApp.getState().toggles.notif) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: '오늘의 집중 목표를 달성했어요!', body: `${goal}분을 채웠어요. ${catName}가 골골송을 불러요.` },
    trigger: Platform.OS === 'android' ? { channelId: CH_GOAL } as any : null,
  }).catch(() => {});
}
