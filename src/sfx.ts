import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform, Vibration } from 'react-native';
import { getS, hooks } from './store';

// 프로토타입의 WebAudio 합성음을 같은 음높이·길이로 미리 만든 WAV 파일 (assets/sfx).
const SRC: Record<string, number> = {
  start: require('../assets/sfx/start.wav'), done: require('../assets/sfx/done.wav'), fail: require('../assets/sfx/fail.wav'),
  coin: require('../assets/sfx/coin.wav'), buy: require('../assets/sfx/buy.wav'), meow: require('../assets/sfx/meow.wav'),
};
const VIB: Record<string, number[]> = { done: [0, 30, 40, 60], fail: [0, 80], start: [0, 20] };
const players: Record<string, AudioPlayer> = {};

export function initSfx() {
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  for (const k of Object.keys(SRC)) { try { players[k] = createAudioPlayer(SRC[k]); } catch {} }
  hooks.sfx = n => sfx(n);
}

export function sfx(n: string, force = false) {
  const st = getS();
  if (!force && !st.toggles.sound) return;
  try { const p = players[n]; if (p) { p.seekTo(0); p.play(); } } catch {}
  if (st.haptic && Platform.OS !== 'web') Vibration.vibrate(VIB[n] || [0, 10]);
}
