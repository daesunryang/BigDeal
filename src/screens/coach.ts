import { ScrollView, View } from 'react-native';

// 첫 사용 코치마크가 가리킬 홈 화면 요소들
export const coachRefs: { scroll: ScrollView | null; root: View | null; items: (View | null)[] } = { scroll: null, root: null, items: [] };
