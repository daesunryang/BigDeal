import React from 'react';
import { View } from 'react-native';
import { Tab, switchTab, useApp } from '../store';
import { useC } from '../theme';
import { Btn, Txt } from '../ui/kit';

// 하단 탭 (pill 스타일). 아이콘은 프로토타입처럼 테두리 도형.
const TABS: [Tab, string, number | 'round', boolean][] = [['home', '홈', 4, false], ['dex', '도감', 'round', false], ['donate', '후원', 3, true], ['mail', '우편함', 2, false], ['menu', '메뉴', 7, false]];

export function Nav() {
  const C = useC();
  const tab = useApp(s => s.tab), unread = useApp(s => s.mails.filter(m => !s.mailRead.includes(m.id)).length);
  return (
    <View style={{ height: 72, flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1.5, borderTopColor: C.line }}>
      {TABS.map(([id, label, rad, rot]) => {
        const on = tab === id || (id === 'donate' && tab === 'shelter');
        return (
          <Btn key={id} onPress={() => switchTab({ tab: id, thanks: '', menuPage: null })} accessibilityRole="tab" accessibilityLabel={label + (id === 'mail' && unread ? `, 안 읽은 우편 ${unread}개` : '')} accessibilityState={{ selected: on }} style={{ flex: 1, gap: 4 }}>
            <View style={{ width: 56, height: 30, borderRadius: 15, backgroundColor: on ? C.sage : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 14, height: 14, borderWidth: 2, borderColor: C.ink, borderRadius: rad === 'round' ? 7 : rad, ...(id === 'menu' ? { borderBottomLeftRadius: 2, borderBottomRightRadius: 2 } : null), transform: rot ? [{ rotate: '45deg' }] : [] }} />
              {unread > 0 && id === 'mail' && <View style={{ position: 'absolute', top: 0, right: 8, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: '#D9604E', alignItems: 'center', justifyContent: 'center' }}>
                <Txt style={{ fontSize: 10, lineHeight: 14, fontWeight: '700', color: '#FFFFFF', fontFamily: undefined }}>{String(unread)}</Txt>
              </View>}
            </View>
            <Txt style={{ fontSize: 12, fontWeight: on ? '700' : '400' }}>{label}</Txt>
          </Btn>
        );
      })}
    </View>
  );
}
