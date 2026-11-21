import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSocketEvent } from '../socket/useSocketEvent';
import { colors, font, hhmm, ms, radius, space } from '../theme';
import type { MissedDose } from '../types';

/** Latest missed dose. On the dashboard, tap opens that parent; the × dismisses. */
export function AlertBanner({ parentId }: { parentId?: string }) {
  const [alert, setAlert] = useState<MissedDose | null>(null);

  useSocketEvent<MissedDose>('dose:missed', (d) => {
    if (!parentId || d.parentId === parentId) setAlert(d);
  });

  if (!alert) return null;
  const open = () => {
    setAlert(null);
    if (!parentId)
      router.push({ pathname: '/caregiver/parent/[id]', params: { id: alert.parentId, name: alert.parentName } });
  };

  return (
    <Pressable style={styles.banner} onPress={open} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={ms(26)} color={colors.white} />
      <View style={styles.body}>
        <Text style={styles.title}>{alert.parentName} missed a dose</Text>
        <Text style={styles.text}>
          {alert.medicineName} · {alert.dose} · {hhmm(alert.scheduledAt)}
        </Text>
      </View>
      <Pressable onPress={() => setAlert(null)} hitSlop={12} accessibilityLabel="Dismiss alert">
        <Ionicons name="close" size={ms(22)} color={colors.white} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.missed,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: font.semibold, fontSize: ms(15), color: colors.white },
  text: { fontFamily: font.medium, fontSize: ms(13), color: colors.white, opacity: 0.9 },
});
