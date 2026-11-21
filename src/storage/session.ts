import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '../types';

const KEY = 'medicare.session';

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export const saveSession = (s: Session) => AsyncStorage.setItem(KEY, JSON.stringify(s));
export const clearSession = () => AsyncStorage.removeItem(KEY);
