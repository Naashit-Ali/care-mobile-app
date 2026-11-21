import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notifyNow, speak } from '../notifications';
import { useSocketEvent } from '../socket/useSocketEvent';
import { useSession } from '../storage/SessionContext';
import { colors, font, ms, radius, shadow, space, typeLarge } from '../theme';
import type { AgentRemind } from '../types';
import { Button } from './Button';

/** Full-screen reminder when the care agent nudges the parent. */
export function AgentRemindBanner() {
  const { session } = useSession();
  const insets = useSafeAreaInsets();
  const [remind, setRemind] = useState<AgentRemind | null>(null);

  useSocketEvent<AgentRemind>('agent:remind', (d) => {
    if (session?.role !== 'parent') return;
    setRemind(d);
    speak(d.message);
    notifyNow('Medicine reminder', d.message);
  });

  if (!remind) return null;

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setRemind(null)}>
      <View style={[styles.screen, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={ms(56)} color={colors.white} />
        </View>
        <Text style={styles.overline}>Reminder</Text>
        <Text style={styles.title}>{remind.medicineName}</Text>
        <Text style={styles.message}>{remind.message}</Text>
        <Button label="OK, got it" size="lg" onPress={() => setRemind(null)} style={styles.btn} />
        <Pressable onPress={() => setRemind(null)} hitSlop={12}>
          <Text style={styles.dismiss}>Dismiss</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  iconWrap: {
    width: ms(112),
    height: ms(112),
    borderRadius: ms(56),
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
    ...shadow.floating,
  },
  overline: { fontFamily: font.bold, fontSize: ms(14), letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent },
  title: { ...typeLarge.h1, color: colors.white, textAlign: 'center' },
  message: { ...typeLarge.body, color: colors.white, textAlign: 'center', opacity: 0.9 },
  btn: { alignSelf: 'stretch', marginTop: space.xl },
  dismiss: { fontFamily: font.semibold, fontSize: ms(18), color: colors.white, opacity: 0.7, marginTop: space.md },
});
