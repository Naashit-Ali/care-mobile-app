import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { registerCaregiver } from '@/api/endpoints';
import { Button, TextLink } from '@/components/Button';
import { ErrorText, Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useSession } from '@/storage/SessionContext';
import { colors, space, type } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { signIn } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filled = !!name.trim() && !!email.trim() && !!password && !!confirm;
  const mismatch = !!confirm && password !== confirm;

  const submit = async () => {
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    try {
      const c = await registerCaregiver({ name: name.trim(), email: email.trim(), password });
      await signIn({ role: 'caregiver', id: c.id, token: c.token, name: c.name });
      router.replace('/caregiver');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen footer={<Button label="Create account" onPress={submit} disabled={!filled} loading={loading} />}>
      <View style={styles.head}>
        <Text style={styles.h1}>Create your account</Text>
        <Text style={styles.lead}>Takes 30 seconds. You can log in on any phone later.</Text>
      </View>
      <View>
        <Field label="Your name" value={name} onChangeText={setName} placeholder="e.g. Ana" maxLength={60} autoComplete="name" />
        <Text style={styles.hint}>Your parent will see this name.</Text>
      </View>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Field
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Type it again"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={mismatch ? 'Passwords do not match' : undefined}
      />
      <ErrorText>{error}</ErrorText>
      <View style={styles.switchRow}>
        <Text style={styles.muted}>Already have an account?</Text>
        <TextLink label="Log in" onPress={() => router.replace('/caregiver/login')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.sm, marginBottom: space.md },
  h1: { ...type.h1, color: colors.black },
  lead: { ...type.body, color: colors.textMuted },
  hint: { ...type.caption, color: colors.textSubtle, marginTop: space.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm, flexWrap: 'wrap' },
  muted: { ...type.body, color: colors.textMuted },
});
