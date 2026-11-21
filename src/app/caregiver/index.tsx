import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { approveParent, listParents, logoutCaregiver, rejectParent, todayDoses } from '@/api/endpoints';
import { AlertBanner } from '@/components/AlertBanner';
import { Button, TextLink } from '@/components/Button';
import { Avatar, Card, HeroCard } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { SectionTitle } from '@/components/Field';
import { ProgressBar } from '@/components/ProgressBar';
import { Loading, Screen } from '@/components/Screen';
import { useSocketEvent } from '@/socket/useSocketEvent';
import { useSession } from '@/storage/SessionContext';
import { colors, font, hhmm, ms, radius, space, type } from '@/theme';
import type { Dose, Parent } from '@/types';

const minutesUntil = (iso: string, now: number) => Math.round((new Date(iso).getTime() - now) / 60000);
const relative = (mins: number) =>
  mins <= 0 ? 'now' : mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)} h ${mins % 60 ? `${mins % 60} min` : ''}`.trim();

export default function CaregiverHome() {
  const { session, signOut } = useSession();
  const [parents, setParents] = useState<Parent[]>([]);
  const [doses, setDoses] = useState<Record<string, Dose[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    try {
      const list = await listParents();
      setParents(list);
      const active = list.filter((p) => p.status === 'active');
      const entries = await Promise.all(active.map(async (p) => [p._id, await todayDoses(p._id)] as const));
      setDoses(Object.fromEntries(entries));
      setNow(Date.now());
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useSocketEvent('parent:join-request', load);
  useSocketEvent('dose:updated', load);
  useSocketEvent('schedule:updated', load);
  useSocketEvent('parent:signed-out', load);
  useSocketEvent('parent:reconnected', load);

  const decide = async (id: string, approve: boolean) => {
    try {
      await (approve ? approveParent(id) : rejectParent(id));
      load();
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    }
  };

  const openAccount = () =>
    Alert.alert(session?.name ?? 'Account', 'You can log back in anytime with your email and password.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logoutCaregiver().catch(() => {});
          await signOut();
          router.replace('/');
        },
      },
    ]);

  if (!loaded) return <Loading label="Loading your family…" />;

  const requests = parents.filter((p) => p.status === 'pending');
  const active = parents.filter((p) => p.status === 'active');
  const nameOf = (id: string) => parents.find((p) => p._id === id)?.name ?? '';
  const next = Object.values(doses)
    .flat()
    .filter((d) => d.status === 'pending')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  const date = new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
  const openParent = (p: { _id: string; name: string }) =>
    router.push({ pathname: '/caregiver/parent/[id]', params: { id: p._id, name: p.name } });

  return (
    <Screen
      noHeader
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.overline}>{date}</Text>
          <Text style={styles.h1} numberOfLines={1}>
            Hi {session?.name?.split(' ')[0]}
          </Text>
        </View>
        <Pressable onPress={openAccount} accessibilityRole="button" accessibilityLabel="Account and log out" hitSlop={8}>
          <Avatar name={session?.name ?? '?'} size={ms(48)} />
        </Pressable>
      </View>

      <AlertBanner />

      {requests.map((p) => (
        <Card key={p._id} variant="soft" style={styles.request}>
          <View style={styles.row}>
            <Avatar name={p.name} bg={colors.surface} />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{p.name} wants to join</Text>
              <Text style={styles.caption}>Approve only if this is your family member.</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Button label="Approve" size="sm" style={styles.flex} onPress={() => decide(p._id, true)} />
            <Button label="Reject" size="sm" variant="danger" style={styles.flex} onPress={() => decide(p._id, false)} />
          </View>
        </Card>
      ))}

      {next && (
        <Pressable onPress={() => openParent({ _id: next.parentId, name: nameOf(next.parentId) })} accessibilityRole="button">
          <HeroCard>
            <Text style={styles.heroOverline}>Next dose · {hhmm(next.scheduledAt)}</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {next.medicineName}
            </Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroCaption}>
                {nameOf(next.parentId)} · {next.dose}
              </Text>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{relative(minutesUntil(next.scheduledAt, now))}</Text>
              </View>
            </View>
          </HeroCard>
        </Pressable>
      )}

      <SectionTitle right={active.length > 0 ? <TextLink label="+ Add" onPress={() => router.push('/caregiver/add-parent')} /> : undefined}>
        Your family
      </SectionTitle>

      {active.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Add your first family member"
          body="You'll get a code to enter on their phone."
          action={{ label: 'Add family member', onPress: () => router.push('/caregiver/add-parent') }}
        />
      ) : (
        active.map((p) => {
          const list = doses[p._id] ?? [];
          const taken = list.filter((d) => d.status === 'taken').length;
          const pending = list.filter((d) => d.status === 'pending').length;
          const missed = list.filter((d) => d.status === 'missed').length;
          const summary = list.length
            ? [taken && `${taken} taken`, pending && `${pending} pending`, missed && `${missed} missed`].filter(Boolean).join(' · ')
            : 'No doses today';
          return (
            <Card key={p._id} onPress={() => openParent(p)} accessibilityLabel={`Open ${p.name}`}>
              <View style={styles.row}>
                <Avatar name={p.name} />
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  {p.signedOutAt ? (
                    <View style={styles.inline}>
                      <Ionicons name="phone-portrait-outline" size={ms(14)} color={colors.missed} />
                      <Text style={[styles.caption, { color: colors.missed }]}>Signed out · tap to reconnect</Text>
                    </View>
                  ) : (
                    <Text style={[styles.caption, missed > 0 && { color: colors.missed }]}>{summary}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={ms(20)} color={colors.textSubtle} />
              </View>
              {list.length > 0 && <ProgressBar value={taken / list.length} />}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm, marginBottom: space.sm },
  overline: { ...type.overline, color: colors.textMuted },
  h1: { ...type.h1, color: colors.black, marginTop: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  request: { gap: space.md },
  cardTitle: { ...type.h3, color: colors.black },
  caption: { ...type.caption, color: colors.textMuted },
  heroOverline: { ...type.overline, color: colors.white, opacity: 0.75 },
  heroTitle: { ...type.h2, color: colors.white },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  heroCaption: { ...type.caption, color: colors.white, opacity: 0.85, flex: 1 },
  heroPill: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: ms(10), paddingVertical: ms(4) },
  heroPillText: { fontFamily: font.semibold, fontSize: ms(13), color: colors.dark },
});
