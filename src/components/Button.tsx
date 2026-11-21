import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, ms, radius, sizes, type, typeLarge } from '../theme';

export type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger' | 'taken';
type IconName = ComponentProps<typeof Ionicons>['name'];

const VARIANTS: Record<ButtonVariant, { bg: string; pressed: string; fg: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.white },
  dark: { bg: colors.black, pressed: colors.text, fg: colors.white },
  secondary: { bg: colors.surfaceAlt, pressed: colors.border, fg: colors.black },
  ghost: { bg: 'transparent', pressed: colors.primarySoft, fg: colors.primary },
  danger: { bg: colors.missedSoft, pressed: colors.missedSoft, fg: colors.missed },
  taken: { bg: colors.taken, pressed: colors.taken, fg: colors.white },
};

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** `sm` 44, `md` 56 (default), `lg` 80 for the parent app, `xl` 120 for the big TAKEN button. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Full width (default) or shrink to the label. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const HEIGHT = { sm: ms(44), md: sizes.buttonHeight, lg: ms(80), xl: sizes.bigButtonHeight };
const LABEL = {
  sm: { fontFamily: font.semibold, fontSize: ms(15) },
  md: { fontFamily: font.semibold, fontSize: ms(16) },
  lg: { fontFamily: font.extrabold, fontSize: ms(24) },
  xl: { fontFamily: typeLarge.button.fontFamily, fontSize: typeLarge.button.fontSize },
};
const ICON = { sm: ms(18), md: ms(20), lg: ms(28), xl: ms(36) };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  block = true,
  style,
  accessibilityLabel,
}: Props) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;
  const handlePress = () => {
    if (Platform.OS !== 'web' && variant !== 'taken') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: pressed ? v.pressed : v.bg,
          borderRadius: size === 'xl' ? radius.xl : radius.md,
          paddingHorizontal: size === 'sm' ? ms(16) : ms(20),
        },
        block ? styles.block : styles.inline,
        inactive && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={ICON[size]} color={v.fg} />}
          <Text style={[LABEL[size], { color: v.fg }]} numberOfLines={1} adjustsFontSizeToFit>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function TextLink({ label, onPress, color = colors.primary }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button">
      {({ pressed }) => <Text style={[type.bodyStrong, { color, opacity: pressed ? 0.6 : 1 }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  block: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  disabled: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.98 }] },
});
