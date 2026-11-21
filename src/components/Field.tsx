import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, font, ms, radius, sizes, space, type, typeLarge } from '../theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  /** Parent app: 72 tall, 24 px text. */
  large?: boolean;
};

/** Filled input; teal border on focus, red border + caption on error. Password fields get a show/hide eye. */
export function Field({ label, error, large, style, secureTextEntry, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={styles.wrap}>
      {!!label && <Text style={[styles.label, large && styles.labelLarge]}>{label}</Text>}
      <View>
        <TextInput
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          keyboardAppearance="light"
          {...props}
          secureTextEntry={secureTextEntry && !revealed}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input,
            large && styles.inputLarge,
            secureTextEntry && styles.inputWithEye,
            focused && styles.focused,
            !!error && styles.errored,
            style,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            style={styles.eye}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={ms(22)}
              color={revealed ? colors.primary : colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {right}
    </View>
  );
}

export function ErrorText({ children, large }: { children: string; large?: boolean }) {
  if (!children) return null;
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle" size={large ? ms(26) : ms(18)} color={colors.missed} />
      <Text style={[large ? typeLarge.body : type.bodyStrong, styles.errorMsg]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { ...type.caption, color: colors.textMuted },
  labelLarge: { ...typeLarge.body, fontFamily: font.semibold, color: colors.text },
  input: {
    height: sizes.inputHeight,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    fontFamily: font.regular,
    fontSize: ms(16),
    color: colors.black,
    letterSpacing: 0,
  },
  inputLarge: { height: ms(72), fontSize: ms(24), fontFamily: font.medium },
  inputWithEye: { paddingRight: ms(56) },
  eye: {
    position: 'absolute',
    right: ms(4),
    top: 0,
    bottom: 0,
    width: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  focused: { borderColor: colors.primary, backgroundColor: colors.surface },
  errored: { borderColor: colors.missed },
  errorText: { ...type.caption, color: colors.missed },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg },
  section: { ...type.h3, color: colors.black },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  errorMsg: { flex: 1, color: colors.missed },
});
