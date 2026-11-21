import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, initials, ms, radius, shadow, sizes, space } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Rounded card. `white` floats with a soft shadow; `alt`/`soft` are flat tinted panels. */
export function Card({
  children,
  variant = 'white',
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  variant?: 'white' | 'alt' | 'soft';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const content = [styles.card, VARIANT[variant], style];
  if (!onPress) return <View style={content}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [content, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

/** Dark teal card with white text, for the single most important thing on a screen. */
export function HeroCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.hero, style]}>{children}</View>;
}

export function IconCircle({
  icon,
  size = sizes.iconCircle,
  bg = colors.primarySoft,
  color = colors.primary,
}: {
  icon: IconName;
  size?: number;
  bg?: string;
  color?: string;
}) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function Avatar({
  name,
  size = sizes.iconCircle,
  bg = colors.primarySoft,
  color = colors.primary,
}: {
  name: string;
  size?: number;
  bg?: string;
  color?: string;
}) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ fontFamily: font.bold, fontSize: size * 0.38, color }}>{initials(name)}</Text>
    </View>
  );
}

const VARIANT = {
  white: { backgroundColor: colors.surface, ...shadow.card },
  alt: { backgroundColor: colors.surfaceAlt },
  soft: { backgroundColor: colors.primarySoft },
};

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  hero: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: ms(20), gap: space.sm },
  circle: { alignItems: 'center', justifyContent: 'center' },
});
