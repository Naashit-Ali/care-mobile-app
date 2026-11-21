import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { approveParent, createPairingCode, createReconnectCode, rejectParent } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Card';
import { ErrorText } from '@/components/Field';
import { Loader } from '@/components/Loader';
import { Screen } from '@/components/Screen';
import { useSocketEvent } from '@/socket/useSocketEvent';
import { colors, font, ms, radius, space, type } from '@/theme';
import type { ParentReconnected } from '@/types';

type Request = { parentId: string; name: string };

/** New-parent pairing code, or a reconnect code for an existing parent when `parentId` is passed. */
export default function AddParent() {
  const { parentId, name } = useLocalSearchParams<{ parentId?: string; name?: string }>();
  const makeCode = useCallback(
    () => (parentId ? createReconnectCode(parentId) : createPairingCode()),
    [parentId],
  );
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [request, setRequest] = useState<Request | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(
    () =>
      makeCode()
        .then((c) => {
          setError('');
          setCode(c);
        })
        .catch((e) => setError(errorMessage(e))),
    [makeCode],
  );

  useEffect(() => {
    makeCode()
      .then(setCode)
      .catch((e) => setError(errorMessage(e)));
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [makeCode]);

  useSocketEvent<Request>('parent:join-request', (r) => !parentId && setRequest(r));
  useSocketEvent<ParentReconnected>('parent:reconnected', (r) => {
    if (r.parentId !== parentId) return;
    Alert.alert('Connected', `${r.name}'s phone is connected again.`);
    router.back();
  });

  const decide = async (approve: boolean) => {
    if (!request) return;
    setBusy(true);
    try {
      if (approve) {
        await approveParent(request.parentId);
        router.replace({ pathname: '/caregiver/parent/[id]', params: { id: request.parentId, name: request.name } });
      } else {
        await rejectParent(request.parentId);
        setRequest(null);
        generate();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (request) {
    return (
      <Screen
        footer={
          <View style={styles.footerRow}>
            <Button label="Reject" variant="danger" disabled={busy} style={styles.flex} onPress={() => decide(false)} />
            <Button label="Approve" loading={busy} style={styles.flex} onPress={() => decide(true)} />
          </View>
        }
      >
        <View style={styles.requestHero}>
          <Avatar name={request.name} size={ms(96)} />
          <Text style={styles.h2Center}>{request.name} wants to join</Text>
          <Text style={styles.bodyCenter}>Approve only if this is your family member. They’ll start getting reminders right away.</Text>
        </View>
        <ErrorText>{error}</ErrorText>
      </Screen>
    );
  }

  const left = code ? Math.max(0, new Date(code.expiresAt).getTime() - now) : 0;
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  const expired = !!code && left === 0;
  const urgent = left < 60000;
  const who = name ?? 'your parent';

  return (
    <Screen
      footer={
        <View style={styles.footerRow}>
          <Button
            label={copied ? 'Copied' : 'Copy code'}
            icon={copied ? 'checkmark' : 'copy-outline'}
            variant="secondary"
            disabled={!code || expired}
            style={styles.flex}
            onPress={copy}
          />
          <Button label="New code" icon="refresh" variant="dark" style={styles.flex} onPress={generate} />
        </View>
      }
    >
      <Text style={styles.h2}>{parentId ? `Reconnect ${who}` : 'Share this code'}</Text>
      <Text style={styles.body}>
        Ask {who} to open MediCare, choose <Text style={styles.strong}>I’m the patient</Text> and enter it.
        {parentId ? ' Their medicines and history stay the same.' : ''}
      </Text>

      <View style={styles.codeRow} accessibilityLabel={code ? `Code ${code.code.split('').join(' ')}` : 'Loading code'}>
        {code ? (
          code.code.split('').map((digit, i) => (
            <View key={i} style={[styles.digit, i === 3 && styles.digitGap]}>
              <Text style={[styles.digitText, expired && { color: colors.textSubtle }]}>{digit}</Text>
            </View>
          ))
        ) : (
          <Loader size={84} />
        )}
      </View>

      {code && (
        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={ms(16)} color={urgent ? colors.missed : colors.textMuted} />
          <Text style={[styles.caption, urgent && { color: colors.missed }]}>
            {expired ? 'Code expired · tap New code' : `Expires in ${mm}:${ss}`}
          </Text>
        </View>
      )}
      <ErrorText>{error}</ErrorText>

      <View style={styles.waiting}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.waitingText}>
          {parentId ? `Waiting for ${who} to sign in…` : 'Waiting for your parent to join…'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footerRow: { flexDirection: 'row', gap: space.md },
  h2: { ...type.h1, color: colors.black, marginTop: space.sm },
  body: { ...type.body, color: colors.textMuted },
  strong: { fontFamily: font.semibold, color: colors.black },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: ms(6), marginTop: space.xl, minHeight: ms(76) },
  digit: {
    flex: 1,
    maxWidth: ms(52),
    height: ms(76),
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitGap: { marginLeft: ms(10) },
  digitText: { fontFamily: font.extrabold, fontSize: ms(40), color: colors.black, fontVariant: ['tabular-nums'] },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs },
  caption: { ...type.caption, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.xl,
  },
  waitingText: { ...type.bodyStrong, color: colors.primary, flex: 1 },
  requestHero: { alignItems: 'center', gap: space.md, marginTop: space.xxl },
  h2Center: { ...type.h1, color: colors.black, textAlign: 'center' },
  bodyCenter: { ...type.body, color: colors.textMuted, textAlign: 'center' },
});
