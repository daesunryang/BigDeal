import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

// 뒤로가기로 돌아온 화면은 떠날 때의 스크롤 위치에서 다시 보여준다 (메뉴 → 하위 화면 → 뒤로 = 메뉴의 그 자리).
// 앞으로 새로 들어갈 때는 항상 맨 위에서 시작한다.
// 키: 메뉴는 'menu|<하위 페이지>', 나머지 탭은 탭 이름.
const pos: Record<string, number> = {};
let restoreKey: string | null = null;

export const scrollKey = (tab: string, menuPage: string | null) => (tab === 'menu' ? 'menu|' + (menuPage ?? '') : tab);
// store의 back()이 화면을 되돌리기 직전에 부른다
export function markBack(key: string) { restoreKey = key; }
function takeRestore(key: string) { const y = restoreKey === key ? pos[key] || 0 : 0; restoreKey = null; return y; }
function remember(key: string, y: number) { pos[key] = y; }

export function useScrollMemory(key: string) {
  const ref = useRef<ScrollView>(null);
  const [want] = useState(() => takeRestore(key));
  const done = useRef(want === 0);
  return {
    ref,
    scrollEventThrottle: 32,
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => remember(key, e.nativeEvent.contentOffset.y),
    // 내용 높이가 정해진 뒤에야 그 위치로 갈 수 있다
    onContentSizeChange: (_w: number, h: number) => {
      if (done.current || h < want) return;
      done.current = true;
      ref.current?.scrollTo({ y: want, animated: false });
    },
  };
}
