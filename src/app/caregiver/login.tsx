import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { loginCaregiver } from '@/api/endpoints';
import { Button, TextLink } from '@/components/Button';
import { ErrorText, Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useSession } from '@/storage/SessionContext';
import { colors, space, type } from '@/theme';

export default function Login() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = !!email.trim() && !!password;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const c = await loginCaregiver({ email: email.trim(), password });
      await signIn({ role: 'caregiver', id: c.id, token: c.token, name: c.name });
      router.replace('/caregiver');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen footer={<Button label="Log in" onPress={submit} disabled={!canSubmit} loading={loading} />}>
      <View style={styles.head}>
        <Text style={styles.h1}>Welcome back</Text>
        <Text style={styles.lead}>Log in to see how your family is doing today.</Text>
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
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <ErrorText>{error}</ErrorText>
      <View style={styles.switchRow}>
        <Text style={styles.muted}>New to MediCare?</Text>
        <TextLink label="Create an account" onPress={() => router.replace('/caregiver/register')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.sm, marginBottom: space.md },
  h1: { ...type.h1, color: colors.black },
  lead: { ...type.body, color: colors.textMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm, flexWrap: 'wrap' },
  muted: { ...type.body, color: colors.textMuted },
});
