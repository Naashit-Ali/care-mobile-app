import { Href, router } from 'expo-router';
import { signOutParent } from '../api/endpoints';
import { cancelReminders } from '../notifications';

/**
 * Tells the server (so the caregiver is notified and the old token stops working), stops this
 * phone's reminders, then clears the local session. Local sign-out happens even if offline.
 */
export async function parentSignOut(signOut: () => Promise<void>, goTo: Href = '/') {
  await signOutParent().catch(() => {});
  await cancelReminders();
  await signOut();
  router.replace(goTo);
}
