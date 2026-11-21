import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, ms, type } from '../theme';

/** lottie-react-native needs @lottiefiles/dotlottie-react on web; a spinner is enough there. */
export function Loader({ size = 160, label }: { size?: number; label?: string }) {
  return (
    <View style={[styles.wrap, { minHeight: ms(size) }]} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Loading'}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: ms(8) },
  label: { ...type.bodyStrong, color: colors.textMuted },
});
