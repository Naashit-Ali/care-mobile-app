import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, ms, radius } from '../theme';

/** Six digit boxes backed by one invisible input (numeric keyboard, paste and SMS autofill work). */
export function CodeInput({
  value,
  onChange,
  length = 6,
  large,
  autoFocus,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  large?: boolean;
  autoFocus?: boolean;
  onComplete?: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);
  const box = large ? { width: ms(52), height: ms(72) } : { width: ms(48), height: ms(60) };

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => (
        <View key={i} style={[styles.box, box, focused && i === active && styles.boxActive]}>
          <Text style={[styles.digit, { fontSize: large ? ms(34) : ms(28) }]}>{value[i] ?? ''}</Text>
        </View>
      ))}
      <TextInput
        value={value}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, '').slice(0, length);
          onChange(v);
          if (v.length === length) onComplete?.(v);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hidden}
        accessibilityLabel={`Code, ${value.length} of ${length} digits entered`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: ms(8) },
  box: {
    flex: 1,
    maxWidth: ms(60),
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  digit: { fontFamily: font.bold, color: colors.black, fontVariant: ['tabular-nums'] },
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, color: 'transparent' },
});
