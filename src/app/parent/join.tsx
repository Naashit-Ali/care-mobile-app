import { AxiosError } from 'axios';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '@/api/client';
import { joinAsParent } from '@/api/endpoints';
import { Button } from '@/components/Button';
import { CodeInput } from '@/components/CodeInput';
import { ErrorText, Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useSession } from '@/storage/SessionContext';
import { colors, space, typeLarge } from '@/theme';

const friendlyError = (e: unknown) => {
  if (e instanceof AxiosError) {
    const status = e.response?.status;
    if (status === 429) return 'Too many tries. Please wait one minute and try again.';
    if (status && status >= 400 && status < 500) return 'This code is not right. Please ask your family for a new one.';
  }
  return errorMessage(e);
};

export default function Join() {
  const { signIn } = useSession();
  const [step, setStep] = useState<'name' | 'code'>('name');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (value = code) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError('');
    try {
      const p = await joinAsParent(name.trim(), value);
      await signIn({ role: 'parent', id: p.id, token: p.token, name: p.name });
      router.replace('/parent/waiting');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'name') {
    return (
      <Screen
        footer={
          <Button label="Next" size="lg" icon="arrow-forward" disabled={!name.trim()} onPress={() => setStep('code')} />
        }
      >
        <Text style={styles.step}>Step 1 of 2</Text>
        <Text style={styles.h1}>Hello! What is your name?</Text>
        <Field
          large
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          maxLength={60}
          autoFocus
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => name.trim() && setStep('code')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button label="Join" size="lg" disabled={code.length !== 6} loading={loading} onPress={() => submit()} />
          <Button label="Back" variant="ghost" onPress={() => setStep('name')} />
        </View>
      }
    >
      <Text style={styles.step}>Step 2 of 2</Text>
      <Text style={styles.h1}>Enter the code from your family</Text>
      <Text style={styles.body}>It has 6 numbers.</Text>
      <View style={styles.code}>
        <CodeInput
          large
          autoFocus
          value={code}
          onChange={(v) => {
            setCode(v);
            setError('');
          }}
          onComplete={submit}
        />
      </View>
      <ErrorText large>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { ...typeLarge.body, fontSize: typeLarge.body.fontSize * 0.8, color: colors.primary },
  h1: { ...typeLarge.h1, color: colors.black, marginBottom: space.md },
  body: { ...typeLarge.body, color: colors.textMuted },
  code: { marginVertical: space.lg },
  footer: { gap: space.xs },
});
