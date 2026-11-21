import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { getParentMe } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useSocketEvent } from '@/socket/useSocketEvent';
import { parentSignOut } from '@/storage/parentSignOut';
import { useSession } from '@/storage/SessionContext';
import { colors, ms, space, typeLarge } from '@/theme';
import type { ParentStatus } from '@/types';

function Pulse({ icon, color, soft }: { icon: 'hourglass-outline' | 'close'; color: string; soft: string }) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <View style={styles.pulseWrap}>
      <Animated.View style={[styles.halo, { backgroundColor: soft, transform: [{ scale }] }]} />
      <View style={[styles.core, { backgroundColor: color }]}>
        <Ionicons name={icon} size={ms(56)} color={colors.white} />
      </View>
    </View>
  );
}

export default function Waiting() {
  const { signOut } = useSession();
  const [status, setStatus] = useState<ParentStatus>('pending');

  const apply = useCallback((s: ParentStatus) => {
    setStatus(s);
    if (s === 'active') router.replace('/parent');
  }, []);

  useSocketEvent<{ status: ParentStatus }>('parent:status', (d) => apply(d.status));

  useEffect(() => {
    const check = () =>
      getParentMe()
        .then((me) => apply(me.status))
        .catch(() => {});
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [apply]);

  if (status === 'rejected') {
    return (
      <Screen
        noHeader
        footer={<Button label="Try again" size="lg" onPress={() => parentSignOut(signOut, '/parent/join')} />}
      >
        <View style={styles.center}>
          <Pulse icon="close" color={colors.missed} soft={colors.missedSoft} />
          <Text style={styles.h2}>Your request was not approved</Text>
          <Text style={styles.body}>Please check the code with your family and try again.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      noHeader
      footer={<Button label="Cancel" size="lg" variant="secondary" onPress={() => parentSignOut(signOut)} />}
    >
      <View style={styles.center}>
        <Pulse icon="hourglass-outline" color={colors.primary} soft={colors.primarySoft} />
        <Text style={styles.h2}>Waiting for your family to say yes…</Text>
        <Text style={styles.body}>This usually takes a minute.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: space.lg, marginTop: ms(72) },
  pulseWrap: { width: ms(200), height: ms(200), alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  halo: { position: 'absolute', width: ms(200), height: ms(200), borderRadius: ms(100) },
  core: { width: ms(128), height: ms(128), borderRadius: ms(64), alignItems: 'center', justifyContent: 'center' },
  h2: { ...typeLarge.h2, color: colors.black, textAlign: 'center' },
  body: { ...typeLarge.body, color: colors.textMuted, textAlign: 'center' },
});
