import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, TUNNEL_HEADERS } from '../config';

export function connectSocket(token: string): Socket {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    extraHeaders: TUNNEL_HEADERS,
    reconnection: true,
  });
}
