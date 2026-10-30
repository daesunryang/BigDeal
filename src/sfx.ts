import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform, Vibration } from 'react-native';
import { getS, hooks } from './store';

// 프로토타입의 WebAudio 합성음을 같은 음높이·길이로 미리 만든 WAV 파일 (assets/sfx).
const SRC: Record<string, number> = {
  start: require('../assets/sfx/start.wav'), done: require('../assets/sfx/done.wav'), fail: require('../assets/sfx/fail.wav'),
  coin: require('../assets/sfx/coin.wav'), buy: require('../assets/sfx/buy.wav'), meow: require('../assets/sfx/meow.wav'),
  // 고양이 노래 (src/data.ts SONGS 순서, scripts/gen-songs.py로 생성)
  song0: require('../assets/sfx/song0.wav'), song1: require('../assets/sfx/song1.wav'), song2: require('../assets/sfx/song2.wav'), song3: require('../assets/sfx/song3.wav'),
  song4: require('../assets/sfx/song4.wav'), song5: require('../assets/sfx/song5.wav'), song6: require('../assets/sfx/song6.wav'), song7: require('../assets/sfx/song7.wav'),
  song8: require('../assets/sfx/song8.wav'), song9: require('../assets/sfx/song9.wav'), song10: require('../assets/sfx/song10.wav'), song11: require('../assets/sfx/song11.wav'),
  song12: require('../assets/sfx/song12.wav'),
};
const VIB: Record<string, number[]> = { done: [0, 30, 40, 60], fail: [0, 80], start: [0, 20] };
const players: Record<string, AudioPlayer> = {};

export function initSfx() {
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  for (const k of Object.keys(SRC)) { try { players[k] = createAudioPlayer(SRC[k]); } catch {} }
  hooks.sfx = n => sfx(n);
}

// 노래는 한 번에 한 곡만: 새 곡을 틀거나 'songstop'이면 재생 중인 노래를 멈춘다
function stopSongs(except?: string) {
  for (const k of Object.keys(players)) if (k.startsWith('song') && k !== except) { try { players[k].pause(); players[k].seekTo(0); } catch {} }
}

export function sfx(n: string, force = false) {
  const st = getS();
  if (n === 'songstop') { stopSongs(); return; }
  if (!force && !st.toggles.sound) return;
  if (n.startsWith('song')) stopSongs(n);
  try { const p = players[n]; if (p) { p.seekTo(0); p.play(); } } catch {}
  if (st.haptic && Platform.OS !== 'web' && !n.startsWith('song')) Vibration.vibrate(VIB[n] || [0, 10]);
}
