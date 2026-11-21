import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { colors } from '../theme';
import type { Dose } from '../types';

const CHANNEL_ID = 'reminders';
const enabled = Platform.OS !== 'web';
/** Unset when the channel couldn't be created, so Android falls back to Expo's default channel. */
let channelId: string | undefined;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Notifications are a nice-to-have on top of the live socket updates: a failure here
// (e.g. Expo Go's partial notification support) must never crash the app.
async function safely<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    console.warn(`[notifications] ${label} failed:`, e instanceof Error ? e.message : e);
    return undefined;
  }
}

export async function setupNotifications() {
  if (!enabled) return false;
  if (Platform.OS === 'android') {
    const channel = await safely('create Android channel', () =>
      Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Medicine reminders',
        // eslint-disable-next-line import/namespace -- re-exported via `export *`, which the import plugin can't follow
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.primary,
        sound: 'default',
      }),
    );
    channelId = channel ? CHANNEL_ID : undefined;
  }
  const perm = await safely('request permission', () => Notifications.requestPermissionsAsync());
  return perm?.status === 'granted';
}

/**
 * Parent: one reminder per pending dose still ahead today. Called on load and whenever the
 * schedule changes (the server emits `schedule:updated`, including right after midnight).
 */
export async function scheduleDoseReminders(doses: Dose[]) {
  if (!enabled) return;
  await safely('schedule reminders', async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = Date.now();
    for (const d of doses) {
      const at = new Date(d.scheduledAt);
      if (d.status !== 'pending' || at.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 Time for ${d.medicineName}`,
          body: `Take ${d.dose} of ${d.medicineName} now`,
          data: { doseId: d._id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId },
      });
    }
  });
}

export async function cancelReminders() {
  if (enabled) await safely('cancel reminders', () => Notifications.cancelAllScheduledNotificationsAsync());
}

export async function notifyNow(title: string, body: string) {
  if (enabled) await safely('notify', () => Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null }));
}

export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { rate: 0.9 });
}
