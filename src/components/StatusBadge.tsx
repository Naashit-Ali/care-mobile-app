import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { font, ms, radius, statusStyle } from '../theme';
import type { DoseStatus } from '../types';

export function StatusBadge({ status, label }: { status: DoseStatus; label?: string }) {
  const s = statusStyle[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]} accessibilityLabel={label ?? s.label}>
      <Ionicons name={s.icon} size={ms(14)} color={s.fg} />
      <Text style={[styles.text, { color: s.fg }]}>{label ?? s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    height: ms(26),
    paddingHorizontal: ms(10),
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { fontFamily: font.semibold, fontSize: ms(13) },
});
