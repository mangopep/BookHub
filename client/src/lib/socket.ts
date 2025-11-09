import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    console.log('[Socket] Initializing connection to:', SOCKET_URL);
    
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      path: '/socket.io/',
    });

    socket.on('connect', () => {
      console.log('[Socket] ✅ Connected successfully');
      console.log('[Socket] ID:', socket?.id);
      console.log('[Socket] Transport:', socket?.io.engine.transport.name);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Disconnected');
      console.log('[Socket] Reason:', reason);
      
      if (reason === 'io server disconnect') {
        console.warn('[Socket] Server disconnected the socket. Manual reconnection required.');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] ⚠️  Connection error:', error.message);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Socket] 🔄 Reconnection attempt ${attemptNumber}...`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] ✅ Reconnected successfully after ${attemptNumber} attempts`);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] ❌ Reconnection failed after all attempts');
    });

    socket.on('connection:success', (data) => {
      console.log('[Socket] 📡 Connection confirmed by server:', data);
    });

    socket.io.engine.on('upgrade', (transport) => {
      console.log('[Socket] ⬆️  Transport upgraded to:', transport.name);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    console.log('[Socket] Disconnecting...');
    socket.disconnect();
    socket = null;
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
