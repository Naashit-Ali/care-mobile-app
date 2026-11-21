import LottieView from 'lottie-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, ms, type } from '../theme';

const animation = require('../../assets/animations/loading.json');

/** Looping pill animation. */
export function Loader({ size = 160, label }: { size?: number; label?: string }) {
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Loading'}>
      <LottieView source={animation} autoPlay loop style={{ width: ms(size), height: ms(size) }} />
      {!!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  label: { ...type.bodyStrong, color: colors.textMuted, marginTop: ms(4) },
});
