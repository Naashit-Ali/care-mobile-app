import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, ms, radius } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Pill chip. Selected = black with white text; `dashed` for "+ Add" actions. */
export function Chip({
  label,
  selected,
  dashed,
  icon,
  onPress,
}: {
  label: string;
  selected?: boolean;
  dashed?: boolean;
  icon?: IconName;
  onPress?: () => void;
}) {
  const fg = selected ? colors.white : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        dashed && styles.dashed,
        pressed && { opacity: 0.7 },
      ]}
    >
      {icon && <Ionicons name={icon} size={ms(16)} color={fg} />}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    height: ms(40),
    paddingHorizontal: ms(16),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selected: { backgroundColor: colors.black },
  dashed: { backgroundColor: colors.surface, borderColor: colors.border, borderStyle: 'dashed' },
  label: { fontFamily: font.semibold, fontSize: ms(15), fontVariant: ['tabular-nums'] },
});
