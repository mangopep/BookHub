import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Book } from '@shared/schema';
import { setWebSocketConnections, incrementWebSocketMessage } from './metrics';

let io: SocketIOServer | null = null;

export function setupWebSocket(server: HTTPServer): SocketIOServer {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin) {
          console.log('[WebSocket] Allowing request with no origin (mobile/native app)');
          return callback(null, true);
        }

        // Development mode: Allow localhost and common dev environments
        if (isDevelopment) {
          if (
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.includes('.replit.dev') ||
            origin.includes('.repl.co')
          ) {
            console.log(`[WebSocket] ✅ Development mode - allowing origin: ${origin}`);
            return callback(null, true);
          }
        }

        // Production mode: Strict same-origin policy
        // Only allow explicitly configured origins (no wildcards or patterns)
        if (!isDevelopment) {
          const allowedOrigins: string[] = [];
          
          // Add ALLOWED_ORIGINS if explicitly configured (comma-separated)
          if (process.env.ALLOWED_ORIGINS) {
            const configuredOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
            allowedOrigins.push(...configuredOrigins);
          }
          
          // Add CLIENT_URL if explicitly configured
          if (process.env.CLIENT_URL) {
            allowedOrigins.push(process.env.CLIENT_URL);
          }
          
          // Auto-detect platform-specific environment variables (exact origin only)
          if (process.env.REPLIT_DEV_DOMAIN) {
            allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
          }
          if (process.env.RAILWAY_PUBLIC_DOMAIN) {
            allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
          }
          if (process.env.RENDER_EXTERNAL_URL) {
            allowedOrigins.push(process.env.RENDER_EXTERNAL_URL);
          }
          if (process.env.VERCEL_URL) {
            allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
          }
          
          // Strict origin check - exact match only
          if (allowedOrigins.includes(origin)) {
            console.log(`[WebSocket] ✅ Production - allowing origin: ${origin}`);
            return callback(null, true);
          }
          
          // Log rejected origins for debugging
          console.warn(`[WebSocket] ❌ Production - blocked origin: ${origin}`);
          console.warn(`[WebSocket] Allowed origins: ${allowedOrigins.join(', ') || 'none configured'}`);
        }

        // If we get here, block the origin
        console.warn(`[WebSocket] ❌ CORS blocked connection from: ${origin}`);
        console.warn(`[WebSocket] Environment: ${process.env.NODE_ENV || 'development'}`);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    path: '/socket.io/',
    maxHttpBufferSize: 1e6,
    allowUpgrades: true,
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    const clientCount = io?.engine.clientsCount || 0;
    console.log(`[WebSocket] Total clients: ${clientCount}`);
    setWebSocketConnections(clientCount);

    socket.emit('connection:success', {
      id: socket.id,
      timestamp: new Date().toISOString(),
      message: 'Real-time connection established'
    });
    incrementWebSocketMessage('connection:success', 'sent');

    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      console.log(`[WebSocket] Reason: ${reason}`);
      const remainingClients = io?.engine.clientsCount || 0;
      console.log(`[WebSocket] Remaining clients: ${remainingClients}`);
      setWebSocketConnections(remainingClients);
    });

    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
      incrementWebSocketMessage('ping', 'received');
      incrementWebSocketMessage('pong', 'sent');
    });
  });

  console.log('[WebSocket] ✅ Server initialized and ready');
  return io;
}

export function broadcastBookCreated(book: Book) {
  if (io) {
    // Send full book object to ensure frontend has all data for real-time updates
    io.emit('book:created', book);
    incrementWebSocketMessage('book:created', 'sent');
    console.log(`[WebSocket] 📢 Broadcasted book:created - "${book.title}" by ${book.author}`);
    console.log(`[WebSocket] 👥 Sent to ${io.engine.clientsCount} connected clients`);
  } else {
    console.warn('[WebSocket] ⚠️  Cannot broadcast - WebSocket not initialized');
  }
}

export function broadcastBookUpdated(book: Book) {
  if (io) {
    // Send full book object to ensure frontend has all data for real-time updates
    io.emit('book:updated', book);
    incrementWebSocketMessage('book:updated', 'sent');
    console.log(`[WebSocket] 📢 Broadcasted book:updated - "${book.title}"`);
    console.log(`[WebSocket] 👥 Sent to ${io.engine.clientsCount} connected clients`);
  } else {
    console.warn('[WebSocket] ⚠️  Cannot broadcast - WebSocket not initialized');
  }
}

export function broadcastBookDeleted(bookId: string, bookTitle?: string, bookAuthor?: string) {
  if (io) {
    io.emit('book:deleted', { id: bookId, title: bookTitle, author: bookAuthor });
    incrementWebSocketMessage('book:deleted', 'sent');
    console.log(`[WebSocket] 📢 Broadcasted book:deleted - "${bookTitle}" by ${bookAuthor}`);
    console.log(`[WebSocket] 👥 Sent to ${io.engine.clientsCount} connected clients`);
  } else {
    console.warn('[WebSocket] ⚠️  Cannot broadcast - WebSocket not initialized');
  }
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function closeWebSocket() {
  if (io) {
    io.close(() => {
      console.log('[WebSocket] Server closed');
    });
    io = null;
  }
}
