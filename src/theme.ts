import { useColorScheme } from 'react-native';
import { useApp } from './store';

// 프로토타입의 CSS 변수(:root / .dk)를 그대로 옮긴 팔레트.
export const LIGHT = {
  bg: '#FBF6EE', card: '#F3EADB', line: '#E2D4BD', ink: '#4A3428', sub: '#7A6352', mute: '#9A8676', body: '#5E4838',
  card2: '#EDE5D8', white: '#FFFFFF', chip1: '#F6E3C9', mint: '#E3EFDF', pink: '#F8DEDC', blue: '#DCE8F3', purple: '#EADCF3',
  sage: '#CFE0C9', sand2: '#E8D9C2', sand3: '#EFE6D8', disabled: '#A8968A', gink: '#4F6B52', red: '#B0604A',
};
export const DARK: typeof LIGHT = {
  bg: '#1F1814', card: '#2B221C', line: '#463A31', ink: '#F0E5D5', sub: '#B9A793', mute: '#9A8B7A', body: '#D9C9B5',
  card2: '#352B24', white: '#2A211B', chip1: '#4A3827', mint: '#2B3A2E', pink: '#4A2F2F', blue: '#2B3645', purple: '#3A3047',
  sage: '#33463A', sand2: '#4A3F30', sand3: '#3A3028', disabled: '#6B5D50', gink: '#A9D4AE', red: '#E59A87',
};
export type Palette = typeof LIGHT;

// 테마와 상관없이 고정인 색
export const K = {
  orange: '#E59A4C', orangeDk: '#C9772F', green: '#8DBF93', heart: '#E07F7F', redDot: '#D9604E', espresso: '#2B221D',
  cream: '#FBF6EE', brown: '#4A3428', tear: '#8CB6D9',
};

export const FONT = { jua: 'Jua_400Regular', body: 'GowunDodum_400Regular' };

export function useDark() {
  const sys = useColorScheme();
  const mode = useApp(s => s.themeMode);
  return mode === 'dark' || (mode === 'system' && sys === 'dark');
}

export function useC(): Palette {
  return useDark() ? DARK : LIGHT;
}
