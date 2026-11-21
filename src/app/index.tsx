import Ionicons from '@expo/vector-icons/Ionicons';
import { AxiosError } from 'axios';
import { Href, Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getParentMe } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { IconCircle } from '@/components/Card';
import { Loading, Screen } from '@/components/Screen';
import { API_URL } from '@/config';
import { useSession } from '@/storage/SessionContext';
import { colors, font, ms, radius, space, type } from '@/theme';

type Role = 'caregiver' | 'parent';

function RoleCard({
  icon,
  title,
  subtitle,
  color,
  soft,
  selected,
  onPress,
}: {
  icon: 'people' | 'person';
  title: string;
  subtitle: string;
  color: string;
  soft: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [styles.role, selected && styles.roleSelected, pressed && { opacity: 0.85 }]}
    >
      <IconCircle icon={icon} size={ms(56)} bg={soft} color={color} />
      <View style={styles.roleText}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={ms(26)}
        color={selected ? colors.black : colors.border}
      />
    </Pressable>
  );
}

export default function Index() {
  const { session, ready, signOut } = useSession();
  const [parentTarget, setParentTarget] = useState<Href | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (session?.role !== 'parent') return;
    getParentMe()
      .then((me) => setParentTarget(me.status === 'active' ? '/parent' : '/parent/waiting'))
      .catch((e) => {
        if (e instanceof AxiosError && e.response?.status === 401) signOut();
        else setParentTarget('/parent/waiting');
      });
  }, [session, signOut]);

  const target: Href | null = !session ? null : session.role === 'caregiver' ? '/caregiver' : parentTarget;

  if (!ready || (session && !target)) return <Loading label="Starting…" />;
  if (target) return <Redirect href={target} />;

  return (
    <Screen
      noHeader
      footer={
        <Button
          label="Continue"
          disabled={!role}
          onPress={() => router.push(role === 'caregiver' ? '/caregiver/login' : '/parent/join')}
        />
      }
    >
      <View style={styles.logoRow}>
        <View style={styles.logoPill}>
          <Ionicons name="medical" size={ms(18)} color={colors.white} />
        </View>
        <Text style={styles.logoText}>MediCare</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.display}>Care that never forgets.</Text>
        <Text style={styles.lead}>Medicine reminders that keep the family in the loop.</Text>
      </View>

      <RoleCard
        icon="people"
        title="I'm a family member"
        subtitle="Manage medicines and get alerts"
        color={colors.primary}
        soft={colors.primarySoft}
        selected={role === 'caregiver'}
        onPress={() => setRole('caregiver')}
      />
      <RoleCard
        icon="person"
        title="I'm the patient"
        subtitle="Get reminders, tap when taken"
        color={colors.accent}
        soft={colors.accentSoft}
        selected={role === 'parent'}
        onPress={() => setRole('parent')}
      />

      {/* <Text style={styles.server}>Server · {API_URL}</Text> */}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  logoPill: {
    width: ms(40),
    height: ms(28),
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontFamily: font.extrabold, fontSize: ms(22), color: colors.black, letterSpacing: -0.3 },
  hero: { gap: space.md, marginTop: space.xxl, marginBottom: space.xl },
  display: { ...type.display, color: colors.black },
  lead: { ...type.body, fontSize: ms(17), lineHeight: ms(24), color: colors.textMuted },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    minHeight: ms(120),
    padding: ms(20),
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleSelected: { borderColor: colors.black, backgroundColor: colors.surface },
  roleText: { flex: 1, gap: space.xs },
  roleTitle: { ...type.h3, color: colors.black },
  roleSubtitle: { ...type.body, color: colors.textMuted },
  server: { ...type.caption, color: colors.textSubtle, textAlign: 'center', marginTop: space.xl },
});
