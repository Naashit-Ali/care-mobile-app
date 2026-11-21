import { useEffect, useEffectEvent } from 'react';
import { useSession } from '../storage/SessionContext';

export function useSocketEvent<T = unknown>(event: string, handler: (data: T) => void) {
  const { socket } = useSession();
  const onEvent = useEffectEvent(handler);

  useEffect(() => {
    if (!socket) return;
    const listener = (data: T) => onEvent(data);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
