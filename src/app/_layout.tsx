import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { notifyNow, setupNotifications, speak } from '@/notifications';
import { useSocketEvent } from '@/socket/useSocketEvent';
import { SessionProvider, useSession } from '@/storage/SessionContext';
import { colors, font, hhmm, ms } from '@/theme';
import type { MissedDose, ParentReconnected, ParentSignedOut, TakenDose } from '@/types';

SplashScreen.preventAutoHideAsync().catch(() => {});

function GlobalListeners() {
  const { session } = useSession();

  useEffect(() => {
    setupNotifications();
  }, []);

  useEffect(() => {
    if (session?.role !== 'parent' || Platform.OS === 'web') return;
    const read = (n: Notifications.Notification) => speak(n.request.content.body ?? '');
    const received = Notifications.addNotificationReceivedListener(read);
    const tapped = Notifications.addNotificationResponseReceivedListener((r) => read(r.notification));
    return () => {
      received.remove();
      tapped.remove();
    };
  }, [session?.role]);

  useSocketEvent<MissedDose>('dose:missed', (d) => {
    if (session?.role === 'caregiver') {
      notifyNow(`⚠️ ${d.parentName} missed a dose`, `${d.medicineName} (${d.dose}) was not taken`);
    }
  });

  useSocketEvent<ParentSignedOut>('parent:signed-out', (d) => {
    if (session?.role !== 'caregiver') return;
    if (d.withdrawn) notifyNow(`${d.name} cancelled the join request`, 'You can send a new code anytime.');
    else
      notifyNow(
        `📵 ${d.name} signed out of MediCare`,
        'Reminders are off on their phone. Open their page and tap “Reconnect phone” to get a code.',
      );
  });

  useSocketEvent<ParentReconnected>('parent:reconnected', (d) => {
    if (session?.role === 'caregiver') notifyNow(`📱 ${d.name} is back`, 'Their phone is connected again.');
  });

  useSocketEvent<TakenDose>('dose:taken', (d) => {
    if (session?.role === 'caregiver' && d.takenAt) {
      notifyNow(
        `✅ ${d.parentName} took ${d.medicineName}`,
        `${d.dose} at ${hhmm(d.takenAt)}${d.late ? ` (late, was due ${hhmm(d.scheduledAt)})` : ''}`,
      );
    }
  });

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.surface }}>
      <SessionProvider>
        <StatusBar style="dark" />
        <GlobalListeners />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.black,
            headerTitleStyle: { fontFamily: font.semibold, color: colors.black, fontSize: ms(17) },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.surface },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="caregiver/login" options={{ title: '' }} />
          <Stack.Screen name="caregiver/register" options={{ title: '' }} />
          <Stack.Screen name="caregiver/index" options={{ headerShown: false }} />
          <Stack.Screen name="caregiver/add-parent" options={{ title: '' }} />
          <Stack.Screen name="caregiver/parent/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="caregiver/parent/[id]/medicine" options={{ title: '', presentation: 'modal' }} />
          <Stack.Screen name="parent/join" options={{ title: '' }} />
          <Stack.Screen name="parent/waiting" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="parent/index" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
