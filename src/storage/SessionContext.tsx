import { router } from 'expo-router';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { setOnUnauthorized } from '../api/client';
import { connectSocket } from '../socket/socket';
import type { Session } from '../types';
import { clearSession, getSession, saveSession } from './session';

type Ctx = {
  session: Session | null;
  ready: boolean;
  socket: Socket | null;
  signIn: (s: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    getSession()
      .then(setSession)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!session) return;
    const s = connectSocket(session.token);
    s.on('connect', () => setSocket(s));
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [session]);

  const signIn = useCallback(async (s: Session) => {
    await saveSession(s);
    setSession(s);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      signOut().then(() => router.replace('/'));
    });
    return () => setOnUnauthorized(null);
  }, [signOut]);

  return (
    <SessionContext.Provider value={{ session, ready, socket, signIn, signOut }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
