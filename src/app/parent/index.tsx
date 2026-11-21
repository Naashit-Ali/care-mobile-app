import Ionicons from '@expo/vector-icons/Ionicons';
import { AxiosError } from 'axios';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage } from '@/api/client';
import { takeDose, todayDoses } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { Loading, Screen } from '@/components/Screen';
import { TAKE_WINDOW_BEFORE_MINUTES } from '@/config';
import { scheduleDoseReminders, speak } from '@/notifications';
import { useSocketEvent } from '@/socket/useSocketEvent';
import { parentSignOut } from '@/storage/parentSignOut';
import { useSession } from '@/storage/SessionContext';
import { colors, font, greeting, hhmm, ms, radius, shadow, sizes, space, statusStyle, typeLarge } from '@/theme';
import type { Dose } from '@/types';

/** Pending doses unlock this many minutes before the scheduled time. Missed doses stay takeable. */
const TAKE_WINDOW_BEFORE_MS = TAKE_WINDOW_BEFORE_MINUTES * 60_000;

function takeOpensAt(dose: Dose) {
  return new Date(new Date(dose.scheduledAt).getTime() - TAKE_WINDOW_BEFORE_MS);
}

function canTakeDose(dose: Dose, now: number) {
  if (dose.status === 'missed') return true;
  if (dose.status !== 'pending') return false;
  return now >= takeOpensAt(dose).getTime();
}

export default function ParentHome() {
  const { session, signOut } = useSession();
  const insets = useSafeAreaInsets();
  const [doses, setDoses] = useState<Dose[]>([]);
  const [taking, setTaking] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState<Dose | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const d = await todayDoses(session.id);
      setDoses(d);
      await scheduleDoseReminders(d);
    } catch (e) {
      if (e instanceof AxiosError && e.response?.status === 403) router.replace('/parent/waiting');
      else Alert.alert('Error', errorMessage(e));
    } finally {
      setLoaded(true);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useSocketEvent('schedule:updated', load);
  useSocketEvent('dose:updated', load);

  useEffect(() => {
    if (!celebrated) return;
    const t = setTimeout(() => setCelebrated(null), 3000);
    return () => clearTimeout(t);
  }, [celebrated]);

  // Re-check every 30s so TAKEN unlocks when the take window opens.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const take = async (d: Dose) => {
    if (!canTakeDose(d, Date.now())) {
      Alert.alert('Too early', `You can mark this as taken from ${hhmm(takeOpensAt(d).toISOString())}.`);
      return;
    }
    setTaking(d._id);
    try {
      await takeDose(d._id);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      speak('Well done!');
      setCelebrated(d);
      await load();
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    } finally {
      setTaking(null);
    }
  };

  const missed = doses.find((d) => d.status === 'missed');
  const next = doses.find((d) => d.status === 'pending');
  const focus = missed ?? next;
  const rest = doses.filter((d) => d._id !== focus?._id);
  const takeReady = focus ? canTakeDose(focus, now) : false;
  const unlockAt = focus?.status === 'pending' ? takeOpensAt(focus) : null;

  const confirmSignOut = () =>
    Alert.alert(
      'Sign out?',
      'You will stop getting medicine reminders on this phone. To sign back in, ask your family for a new code.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => parentSignOut(signOut) },
      ],
    );

  const readAloud = () => {
    if (missed) speak(`You missed ${missed.medicineName}, ${missed.dose}, at ${hhmm(missed.scheduledAt)}. Please take it now.`);
    else if (next) speak(`Your next medicine is ${next.medicineName}, ${next.dose}, at ${hhmm(next.scheduledAt)}.`);
    else speak('You are all done for today. Well done!');
  };

  if (!loaded) return <Loading label="Loading your medicines…" />;

  const firstName = session?.name?.split(' ')[0] ?? '';
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.flex}>
      <Screen
        noHeader
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await load();
          setRefreshing(false);
        }}
      >
        <View style={styles.head}>
          <Text style={styles.greeting}>
            {greeting()}, {firstName}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        {celebrated ? (
          <View style={[styles.focus, styles.focusTaken]}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={ms(64)} color={colors.white} />
            </View>
            <Text style={styles.focusTitle}>Well done! 🎉</Text>
            <Text style={styles.focusBody}>{celebrated.medicineName} is marked as taken.</Text>
          </View>
        ) : focus ? (
          <View style={[styles.focus, focus.status === 'missed' && styles.focusMissed]}>
            <Text style={[styles.overline, focus.status === 'missed' && { color: colors.missed }]}>
              {focus.status === 'missed'
                ? `Missed · ${hhmm(focus.scheduledAt)}, take it now`
                : `Next · ${hhmm(focus.scheduledAt)}`}
            </Text>
            <Text style={styles.focusName} numberOfLines={3} adjustsFontSizeToFit>
              {focus.critical ? '❤️ ' : ''}
              {focus.medicineName}
            </Text>
            <Text style={styles.focusBody}>{focus.dose}</Text>
            {!takeReady && unlockAt && (
              <Text style={styles.unlockHint}>Available from {hhmm(unlockAt.toISOString())}</Text>
            )}
            <Button
              label="TAKEN"
              icon="checkmark-circle"
              variant="taken"
              size="md"
              disabled={!takeReady}
              loading={taking === focus._id}
              onPress={() => take(focus)}
              style={styles.takenButton}
              accessibilityLabel={
                takeReady
                  ? `I took ${focus.medicineName}`
                  : `TAKEN unlocks at ${hhmm(unlockAt!.toISOString())}`
              }
            />
          </View>
        ) : (
          <View style={styles.done}>
            <View style={styles.doneCircle}>
              <Ionicons name="checkmark" size={ms(72)} color={colors.taken} />
            </View>
            <Text style={styles.doneTitle}>{doses.length ? 'All done for today' : 'No medicines today'}</Text>
            <Text style={styles.focusBody}>{doses.length ? 'Great job. See you tomorrow!' : 'Enjoy your day.'}</Text>
          </View>
        )}

        {rest.length > 0 && (
          <View style={styles.listBlock}>
            <Text style={styles.section}>{focus ? 'Later today' : 'Today'}</Text>
            <View style={styles.listCard}>
              {rest.map((d, i) => {
                const s = statusStyle[d.status];
                return (
                  <View key={d._id} style={[styles.row, i < rest.length - 1 && styles.rowDivider]}>
                    <Text style={styles.rowTime}>{hhmm(d.scheduledAt)}</Text>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowName} numberOfLines={2}>
                        {d.critical ? '❤️ ' : ''}
                        {d.medicineName}
                      </Text>
                      <Text style={styles.rowDose}>{d.dose}</Text>
                    </View>
                    <View style={[styles.rowStatus, { backgroundColor: s.bg }]} accessibilityLabel={s.label}>
                      <Ionicons name={s.icon} size={ms(22)} color={s.fg} />
                      <Text style={[styles.rowStatusText, { color: s.fg }]}>
                        {d.status === 'pending' ? 'Later' : s.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
         <View style={[styles.signOutBar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <Button label="Sign out" variant="ghost" onPress={confirmSignOut} />
      </View>
      </Screen>

     

      <Pressable
        onPress={readAloud}
        accessibilityRole="button"
        accessibilityLabel="Read aloud"
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + sizes.buttonHeight + space.xxl },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <Ionicons name="volume-high" size={ms(30)} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  head: { gap: space.xs, marginTop: space.sm, marginBottom: space.sm },
  greeting: { ...typeLarge.h2, color: colors.black },
  date: { fontFamily: font.medium, fontSize: ms(20), lineHeight: ms(26), color: colors.textMuted },
  focus: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    padding: space.md,
    gap: space.sm,
    // minHeight: ms(380),
    justifyContent: 'center',
  },
  focusMissed: { backgroundColor: colors.missedSoft },
  focusTaken: { backgroundColor: colors.takenSoft, alignItems: 'center' },
  overline: { fontFamily: font.bold, fontSize: ms(16), letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primary },
  focusName: { ...typeLarge.display, color: colors.black },
  focusTitle: { ...typeLarge.h1, color: colors.taken, textAlign: 'center' },
  focusBody: { ...typeLarge.body, color: colors.textMuted, textAlign: 'auto' },
  unlockHint: {
    fontFamily: font.semibold,
    fontSize: ms(18),
    lineHeight: ms(24),
    color: colors.primary,
    marginTop: space.sm,
  },
  takenButton: { marginTop: space.lg },
  checkCircle: {
    width: ms(120),
    height: ms(120),
    borderRadius: ms(60),
    backgroundColor: colors.taken,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  done: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  doneCircle: {
    width: ms(160),
    height: ms(160),
    borderRadius: ms(80),
    backgroundColor: colors.takenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { ...typeLarge.h1, color: colors.black, textAlign: 'center' },
  listBlock: { gap: space.md, marginTop: space.xl },
  section: { ...typeLarge.h2, color: colors.black },
  listCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTime: { fontFamily: font.bold, fontSize: ms(22), color: colors.black, fontVariant: ['tabular-nums'], minWidth: ms(64) },
  rowMain: { flex: 1, gap: 2 },
  rowName: { ...typeLarge.body, color: colors.text },
  rowDose: { fontFamily: font.medium, fontSize: ms(16), color: colors.textMuted },
  rowStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: ms(72),
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
  },
  rowStatusText: { fontFamily: font.semibold, fontSize: ms(13) },
  signOutBar: {
    paddingHorizontal: sizes.screenPadding,
    paddingTop: space.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  fab: {
    position: 'absolute',
    right: space.xl,
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
});
