import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CATS } from '../data';
import { S } from '../store';
import { CatFace } from '../ui/kit';

// 화면을 그리다 오류가 나면 앱 전체가 꺼지지 않고 고양이 오류 화면을 보여 준다.
// (테마 훅이 깨졌을 수도 있으니 라이트 색을 직접 쓴다)
type Props = { children: React.ReactNode };
export class ErrorBoundary extends React.Component<Props, { err: Error | null }> {
  state = { err: null as Error | null };

  static getDerivedStateFromError(err: Error) { return { err }; }

  componentDidCatch(err: Error) { console.warn('화면 오류', err); }

  retry = () => this.setState({ err: null });
  home = () => { S({ screen: 'tabs', tab: 'home', menuPage: null, dlg: null, house: false, sheet: false, pay: null, rcpt: null, share: false, cert: null, gachaPop: null, gachaRes: null, coach: -1 }); this.setState({ err: null }); };

  render() {
    if (!this.state.err) return this.props.children;
    const btn = { height: 50, borderRadius: 25, alignItems: 'center' as const, justifyContent: 'center' as const, alignSelf: 'stretch' as const };
    return (
      <View style={{ flex: 1, backgroundColor: '#FBF6EE', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 }}>
        <CatFace cat={CATS[0]} size={120} />
        <Text style={{ fontSize: 22, color: '#4A3428', fontFamily: 'Jua_400Regular' }}>앗, 고양이가 줄을 엉켰어요</Text>
        <Text style={{ fontSize: 14, lineHeight: 21, color: '#7A6352', textAlign: 'center', fontFamily: 'GowunDodum_400Regular' }}>화면을 그리다 문제가 생겼어요. 기록은 안전하게 저장돼 있어요.</Text>
        <Pressable accessibilityRole="button" onPress={this.retry} style={[btn, { backgroundColor: '#4A3428', marginTop: 8 }]}>
          <Text style={{ fontSize: 17, color: '#FBF6EE', fontFamily: 'Jua_400Regular' }}>다시 시도</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={this.home} style={[btn, { borderWidth: 1.5, borderColor: '#4A3428' }]}>
          <Text style={{ fontSize: 16, color: '#4A3428', fontFamily: 'Jua_400Regular' }}>홈으로</Text>
        </Pressable>
      </View>
    );
  }
}
