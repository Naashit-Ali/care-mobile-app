import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import {
  deleteMedicine,
  demoDoseInOneMinute,
  demoMissDose,
  demoRunAgent,
  listAgentLogs,
  listMedicines,
  listParents,
  todayDoses,
} from '@/api/endpoints';
import { AlertBanner } from '@/components/AlertBanner';
import { Button, TextLink } from '@/components/Button';
import { Card, IconCircle } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { Loading, Screen } from '@/components/Screen';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { StatusBadge } from '@/components/StatusBadge';
import { useSocketEvent } from '@/socket/useSocketEvent';
import { colors, font, hhmm, ms, radius, space, statusStyle, type } from '@/theme';
import type { AgentLog, Dose, Medicine } from '@/types';

type Tab = 'today' | 'medicines' | 'activity';

function TimelineRow({ dose, last }: { dose: Dose; last: boolean }) {
  const s = statusStyle[dose.status];
  return (
    <View style={styles.tlRow}>
      <Text style={styles.tlTime}>{hhmm(dose.scheduledAt)}</Text>
      <View style={styles.tlRail}>
        <View style={[styles.tlDot, { backgroundColor: s.fg }]} />
        {!last && <View style={styles.tlLine} />}
      </View>
      <Card style={styles.tlCard}>
        <View style={styles.tlCardRow}>
          <View style={styles.flex}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {dose.medicineName}
            </Text>
            <Text style={styles.caption}>
              {dose.dose}
              {dose.critical ? ' · Critical' : ''}
              {dose.status === 'taken' && dose.takenAt ? ` · at ${hhmm(dose.takenAt)}` : ''}
            </Text>
          </View>
          <StatusBadge status={dose.status} />
        </View>
      </Card>
    </View>
  );
}

function AgentLogRow({ log }: { log: AgentLog }) {
  const isTool = log.type === 'tool_call';
  const isResult = log.type === 'result';
  const time = new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return (
    <Card variant={isTool ? 'soft' : 'white'} style={isTool ? styles.agentCard : undefined}>
      <View style={styles.row}>
        <IconCircle
          icon={isTool ? 'hardware-chip' : isResult ? 'checkmark-circle' : 'sparkles'}
          bg={isTool ? colors.accentSoft : colors.primarySoft}
          color={isTool ? colors.accent : colors.primary}
        />
        <View style={styles.flex}>
          <Text style={styles.agentMeta}>
            {time}
            {log.tool ? ` · ${log.tool}` : ''}
            {` · ${log.type}`}
          </Text>
          <Text style={styles.agentMsg}>{log.message}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function ParentDetail() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [tab, setTab] = useState<Tab>('today');
  const [doses, setDoses] = useState<Dose[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [signedOut, setSignedOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, m, parents, agentLogs] = await Promise.all([
        todayDoses(id),
        listMedicines(id),
        listParents(),
        listAgentLogs(id),
      ]);
      setDoses(d);
      setMedicines(m);
      setLogs(agentLogs);
      setSignedOut(!!parents.find((p) => p._id === id)?.signedOutAt);
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useSocketEvent<Dose>('dose:updated', (d) => d.parentId === id && load());
  useSocketEvent<{ parentId: string }>('schedule:updated', (d) => d.parentId === id && load());
  useSocketEvent<{ parentId: string }>('parent:signed-out', (d) => d.parentId === id && load());
  useSocketEvent<{ parentId: string }>('parent:reconnected', (d) => d.parentId === id && load());
  useSocketEvent<AgentLog>('agent:log', (log) => {
    if (log.parentId !== id) return;
    setLogs((cur) => [log, ...cur.filter((l) => l._id !== log._id)]);
  });

  const reconnect = () => router.push({ pathname: '/caregiver/add-parent', params: { parentId: id, name } });
  const addMedicine = () => router.push({ pathname: '/caregiver/parent/[id]/medicine', params: { id } });
  const editMedicine = (m: Medicine) =>
    router.push({ pathname: '/caregiver/parent/[id]/medicine', params: { id, medicineId: m._id } });

  const run = (fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
      load();
    } catch (e) {
      Alert.alert('Error', errorMessage(e));
    }
  };

  const confirmDelete = (m: Medicine) =>
    Alert.alert('Remove medicine?', `${m.name} and its remaining doses for today will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: run(() => deleteMedicine(m._id)) },
    ]);

  if (!loaded) return <Loading label="Loading medicines…" />;

  const title = name ?? 'Parent';
  const taken = doses.filter((d) => d.status === 'taken').length;
  const firstPending = doses.find((d) => d.status === 'pending');
  const firstMissed = doses.find((d) => d.status === 'missed');

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      header={
        <View style={styles.head}>
          <Text style={styles.h1} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.caption}>
            {doses.length ? `Today · ${taken} of ${doses.length} taken` : 'Today · nothing scheduled'}
          </Text>
          {doses.length > 0 && <ProgressBar value={taken / doses.length} />}
          <SegmentedTabs<Tab>
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'today', label: 'Today', badge: doses.length ? String(doses.length) : undefined },
              { key: 'medicines', label: 'Meds', badge: String(medicines.length) },
              { key: 'activity', label: 'Agent', badge: logs.length ? String(Math.min(logs.length, 99)) : undefined },
            ]}
          />
        </View>
      }
      footer={tab === 'medicines' ? <Button label="Add medicine" icon="add" onPress={addMedicine} /> : undefined}
    >
      <AlertBanner parentId={id} />
      {signedOut && (
        <Card variant="alt" style={styles.signedOut}>
          <View style={styles.row}>
            <Ionicons name="phone-portrait-outline" size={ms(22)} color={colors.missed} />
            <Text style={[styles.cardTitle, { color: colors.missed }]}>{title} signed out</Text>
          </View>
          <Text style={styles.body}>Reminders are off on their phone until they sign back in.</Text>
          <Button label="Reconnect phone" size="sm" variant="dark" onPress={reconnect} />
        </Card>
      )}

      {tab === 'today' &&
        (doses.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No doses today"
            body={medicines.length ? 'Nothing else is scheduled for today.' : 'Add a medicine to start the schedule.'}
          />
        ) : (
          <View>
            {doses.map((d, i) => (
              <TimelineRow key={d._id} dose={d} last={i === doses.length - 1} />
            ))}
          </View>
        ))}

      {tab === 'medicines' && (
        <>
          {medicines.length === 0 && (
            <EmptyState icon="medkit-outline" title="No medicines yet" body="Add the first one with the button below." />
          )}
          {medicines.map((m) => (
            <Card key={m._id}>
              <View style={styles.row}>
                <View style={[styles.medIcon, m.critical && { backgroundColor: colors.missedSoft }]}>
                  <Ionicons name={m.critical ? 'heart' : 'medical'} size={ms(20)} color={m.critical ? colors.missed : colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{m.name}</Text>
                  <Text style={styles.caption}>
                    {m.dose}
                    {m.critical ? ' · Critical' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.chips}>
                {m.times.map((t) => (
                  <Chip key={t} label={t} icon="time-outline" />
                ))}
              </View>
              <View style={styles.actions}>
                <Button label="Edit" size="sm" variant="secondary" style={styles.flex} onPress={() => editMedicine(m)} />
                <Button label="Remove" size="sm" variant="danger" style={styles.flex} onPress={() => confirmDelete(m)} />
              </View>
            </Card>
          ))}
          {!signedOut && (
            <View style={styles.phoneRow}>
              <Text style={styles.caption}>New phone?</Text>
              <TextLink label="Connect a new phone" onPress={reconnect} />
            </View>
          )}
          <View style={styles.demoBlock}>
            <Text style={styles.demoTitle}>Demo</Text>
            {medicines[0] && (
              <TextLink label="Dose in 1 min" color={colors.textSubtle} onPress={run(() => demoDoseInOneMinute(medicines[0]._id))} />
            )}
            {firstPending && (
              <TextLink label="Simulate missed" color={colors.textSubtle} onPress={run(() => demoMissDose(firstPending._id))} />
            )}
            {firstMissed && (
              <TextLink label="Run agent now" color={colors.textSubtle} onPress={run(() => demoRunAgent(firstMissed._id))} />
            )}
          </View>
        </>
      )}

      {tab === 'activity' &&
        (logs.length === 0 ? (
          <EmptyState
            icon="sparkles-outline"
            title="No agent activity yet"
            body="When a dose is missed, the care agent reminds the parent and reports here."
          />
        ) : (
          logs.map((log) => <AgentLogRow key={log._id} log={log} />)
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: space.sm },
  h1: { ...type.h1, color: colors.black },
  caption: { ...type.caption, color: colors.textMuted },
  body: { ...type.body, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cardTitle: { ...type.h3, color: colors.black },
  signedOut: { backgroundColor: colors.missedSoft, gap: space.md },
  tlRow: { flexDirection: 'row', alignItems: 'stretch' },
  tlTime: {
    width: ms(52),
    fontFamily: font.bold,
    fontSize: ms(16),
    color: colors.black,
    fontVariant: ['tabular-nums'],
    paddingTop: ms(18),
  },
  tlRail: { width: ms(20), alignItems: 'center' },
  tlDot: { width: ms(12), height: ms(12), borderRadius: ms(6), marginTop: ms(22) },
  tlLine: { flex: 1, width: 2, backgroundColor: colors.divider, marginTop: ms(4) },
  tlCard: { flex: 1, marginLeft: space.sm, marginBottom: space.md },
  tlCardRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  medIcon: {
    width: ms(44),
    height: ms(44),
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.xs },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    marginTop: space.md,
    flexWrap: 'wrap',
  },
  demoBlock: { marginTop: space.xl, gap: space.sm, alignItems: 'flex-start' },
  demoTitle: { ...type.overline, color: colors.textSubtle },
  agentCard: { backgroundColor: colors.accentSoft },
  agentMeta: { ...type.caption, color: colors.textMuted, textTransform: 'uppercase' },
  agentMsg: { ...type.body, color: colors.text, marginTop: 2 },
});
