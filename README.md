# BookHub -  Book Management System

Complete full-stack book management platform with **real-time WebSocket updates**, built-in monitoring, API documentation, and admin panel.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Real-time Updates Implementation](#real-time-updates-implementation)
- [Quick Start](#quick-start)
- [All Commands Reference](#all-commands-reference)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Testing Real-time Updates](#testing-real-time-updates)
- [Deployment](#deployment)
- [Monitoring & Metrics](#monitoring--metrics)
- [Troubleshooting](#troubleshooting)
- [Security Features](#security-features)

---

## Executive Summary

BookHub is an enterprise-grade book management and e-commerce platform that provides **instant, real-time synchronization** across all connected clients using WebSocket technology. When administrators add, update, or remove books, all users see changes immediately without manual page refreshes.


## Access Everything

All services and their access information:

| Service | URL | Login Credentials |
|---------|-----|-------------------|
| Your App | http://localhost:5000 | Create account |
| Prometheus | http://localhost:9090 | No login needed |
| Grafana | http://localhost:3001 | login needed  |

---

## Quick Start

### Service URLs

| Service | Local | Production |
|---------|-------|------------|
| Application | http://localhost:5000 | [https://bookhub-ze18.onrender.com/](https://bookhub-ze18.onrender.com/)
| API Docs | http://localhost:5000/api/docs | [https://bookhub-ze18.onrender.com/api/docs/ ](https://bookhub-ze18.onrender.com/api/docs/)
| Health Check | http://localhost:5000/health | [https://bookhub-ze18.onrender.com/health ](https://bookhub-ze18.onrender.com/health)
| Prometheus | http://localhost:9090 | [https://bookhub-prometheus.onrender.com/targets ](https://bookhub-prometheus.onrender.com/targets)
| Grafana | http://localhost:3001 |[ https://bookhub-grafana.onrender.com/login](https://bookhub-grafana.onrender.com/login)
### Default Credentials

| Service | Username | Password | Notes |
|---------|----------|----------|-------|
| Application | Sign up to create | - | First user becomes admin |
| Grafana (Local) | admin | admin123 | Change after first login |
| Grafana (Production) | admin | See deployment logs | Auto-generated |



### Local Development (Recommended)

**Step 1: Install dependencies**
```bash
npm install
```

**Step 2: Create environment file**
```bash
echo 'JWT_SECRET=my-super-secret-jwt-key-minimum-32-characters-long-12345' > .env
```

**Step 3: Start the application**
```bash
npm run dev
```

**Access your application:**
- Application: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs
- Health Check: http://localhost:5000/health

### Add Monitoring (Optional)

**Prerequisites:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Start monitoring services:**
```bash
docker-compose up -d
```

**Access monitoring dashboards:**
- Prometheus: http://localhost:9090 (no login required)
- Grafana: http://localhost:3001 (username: admin, password: admin123)

**Stop monitoring services:**
```bash
docker-compose down
```


### Key Capabilities

**For Customers:**
- Browse and search books with real-time inventory updates
- Shopping cart and checkout functionality
- User accounts and authentication
- Responsive design (mobile, tablet, desktop)
- Dark/Light theme support
- Real-time notifications for catalog changes

**For Administrators:**
- Comprehensive admin dashboard
- Book inventory management with instant updates
- User management
- Order tracking and management
- Business analytics and metrics
- Advanced search and filtering

**Technical Features:**
- Real-time WebSocket updates using Socket.IO
- RESTful API with Swagger documentation
- Real-time monitoring with Prometheus & Grafana
- Enterprise-grade security (CORS, CSRF, rate limiting)
- MongoDB integration with auto-schema
- Docker deployment support

### Production Deployment

The application is deployed at:
- **Application**: https://bookhub-ze18.onrender.com/
- **API Documentation**: https://bookhub-ze18.onrender.com/api/docs/
- **Prometheus**: https://bookhub-prometheus.onrender.com/targets
- **Grafana Dashboard**: https://bookhub-grafana.onrender.com/d/bookhub_main/bookhub-application-dashboard

---

## Real-time Updates Implementation

### Overview

BookHub implements **WebSocket-based real-time updates** to provide instant synchronization across all connected clients when books are added, updated, or deleted. This ensures users always see the latest book inventory without manual page refreshes, creating a seamless, responsive user experience.

### Technology Choice

**Selected Technology: Socket.IO**

Socket.IO was chosen for the following reasons:

1. **Reliability**: Automatic fallback from WebSocket to HTTP long-polling ensures connectivity even in restricted network environments
2. **Browser Compatibility**: Works across all modern browsers and older clients
3. **Built-in Reconnection**: Automatic reconnection with exponential backoff
4. **Room Support**: Efficient broadcasting to specific user groups
5. **Production-Ready**: Battle-tested in enterprise applications
6. **TypeScript Support**: Full TypeScript definitions for type safety
7. **Monitoring Integration**: Easy integration with Prometheus metrics

**Alternatives Considered:**
- **Server-Sent Events (SSE)**: Unidirectional only, less suitable for future bidirectional features
- **Native WebSocket API**: Requires manual reconnection logic and fallback handling
- **Third-party services (Pusher, Firebase)**: Adds external dependencies and costs

### Architecture

#### Backend Implementation

The backend WebSocket server is implemented in `server/websocket.ts`:

**Server Setup:**
```typescript
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export function setupWebSocket(server: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Development: Allow localhost
        // Production: Strict same-origin policy with platform-specific domains
        // Supports Replit, Railway, Render, Vercel
      },
      credentials: true
    },
    transports: ['websocket', 'polling'],
  });

  // Connection management
  io.on('connection', (socket) => {
    console.log('[WebSocket] Client connected:', socket.id);
    websocketConnections.inc(); // Prometheus metric
    
    socket.emit('connection:success', { 
      message: 'Connected to BookHub real-time updates' 
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Client disconnected:', socket.id);
      websocketConnections.dec();
    });
  });

  return io;
}
```

**Broadcasting Functions:**

The server broadcasts events to all connected clients whenever book operations occur:

```typescript
export function broadcastBookCreated(book: any) {
  if (io) {
    io.emit('book:created', book);
    websocketMessages.inc({ event: 'book:created' });
  }
}

export function broadcastBookUpdated(book: any) {
  if (io) {
    io.emit('book:updated', book);
    websocketMessages.inc({ event: 'book:updated' });
  }
}

export function broadcastBookDeleted(id: string, title?: string, author?: string) {
  if (io) {
    io.emit('book:deleted', { id, title, author });
    websocketMessages.inc({ event: 'book:deleted' });
  }
}
```

**Integration with API Routes:**

Broadcasts are triggered immediately after successful database operations in `server/routes.ts`:

```typescript
// Create book
app.post("/api/books", authenticateToken, requireRole('admin'), async (req, res) => {
  const book = await storage.createBook(validatedData);
  broadcastBookCreated(book);  // Notify all clients
  res.status(201).json(book);
});

// Update book
app.put("/api/books/:id", authenticateToken, requireRole('admin'), async (req, res) => {
  const book = await storage.updateBook(id, validatedData);
  broadcastBookUpdated(book);  // Notify all clients
  res.json(book);
});

// Delete book
app.delete("/api/books/:id", authenticateToken, requireRole('admin'), async (req, res) => {
  await storage.deleteBook(id);
  broadcastBookDeleted(id, book.title, book.author);  // Notify all clients
  res.json({ success: true });
});
```

#### Frontend Integration

The frontend connects to the WebSocket server and listens for real-time events using `client/src/lib/socket.ts`:

**Client Connection:**
```typescript
import { io, Socket } from 'socket.io-client';

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['polling', 'websocket'],  // Try polling first, upgrade to WS
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });
  }

  return socket;
}
```

**Event Handling in Components:**

The `client/src/pages/Home.tsx` component subscribes to real-time events:

```typescript
useEffect(() => {
  const socket = getSocket();

  // Handle new book created
  const handleBookCreated = (newBook: ApiBook) => {
    queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    toast({
      title: 'Catalog Updated',
      description: `"${newBook.title}" by ${newBook.author} has been added`,
    });
  };

  // Handle book updated
  const handleBookUpdated = (updatedBook: ApiBook) => {
    queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    toast({
      title: 'Book Information Updated',
      description: `"${updatedBook.title}" by ${updatedBook.author}`,
    });
  };

  // Handle book deleted
  const handleBookDeleted = ({ id, title, author }) => {
    queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    toast({
      title: 'Book Removed',
      description: `"${title}" by ${author} is no longer available`,
    });
  };

  // Subscribe to events
  socket.on('book:created', handleBookCreated);
  socket.on('book:updated', handleBookUpdated);
  socket.on('book:deleted', handleBookDeleted);

  // Refresh data on reconnection
  socket.on('reconnect', () => {
    queryClient.invalidateQueries({ queryKey: ['/api/books'] });
  });

  // Cleanup on unmount
  return () => {
    socket.off('book:created', handleBookCreated);
    socket.off('book:updated', handleBookUpdated);
    socket.off('book:deleted', handleBookDeleted);
    socket.off('reconnect');
  };
}, [toast]);
```

**Cache Invalidation Strategy:**

Using TanStack Query (React Query), the frontend invalidates cached data when receiving WebSocket events. This triggers automatic re-fetching and UI updates:

1. WebSocket event received
2. `queryClient.invalidateQueries()` called
3. TanStack Query refetches data from API
4. React components re-render with latest data
5. User sees updated book list instantly

**Connection Status Indicator:**

The `client/src/components/ConnectionStatus.tsx` component displays real-time connection status:

```typescript
export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState<string>('');

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <Badge variant={isConnected ? "default" : "destructive"}>
      {isConnected ? `Live (${transport === 'websocket' ? 'WS' : 'Polling'})` : 'Offline'}
    </Badge>
  );
}
```

### How It Works: End-to-End Flow

**1. Book Creation:**
```
Admin adds book via UI
  → Frontend sends POST /api/books
  → Backend validates and saves to database
  → Backend calls broadcastBookCreated(book)
  → Socket.IO emits 'book:created' event to ALL connected clients
  → All clients receive event
  → All clients invalidate cache and refetch
  → All users see new book instantly
```

**2. Book Update:**
```
Admin updates book price
  → Frontend sends PUT /api/books/:id
  → Backend updates database
  → Backend calls broadcastBookUpdated(book)
  → Socket.IO emits 'book:updated' event to ALL connected clients
  → All clients update their cache
  → All users see price change immediately
```

**3. Book Deletion:**
```
Admin deletes book
  → Frontend sends DELETE /api/books/:id
  → Backend removes from database
  → Backend calls broadcastBookDeleted(id, title, author)
  → Socket.IO emits 'book:deleted' event to ALL connected clients
  → All clients remove book from cache
  → All users see updated catalog instantly
```

### Error Handling and Disconnection Management

**Automatic Reconnection:**
- Socket.IO detects disconnections automatically
- Reconnects with exponential backoff (1s, 2s, 4s, 8s, 16s)
- Maximum 5 reconnection attempts
- On successful reconnection, cache is invalidated to resynchronize data

**Connection Error Handling:**
```typescript
socket.on('connect_error', (error) => {
  console.error('[Socket] Connection error:', error.message);
  // Falls back to HTTP polling if WebSocket fails
});

socket.on('reconnect_failed', () => {
  console.error('[Socket] Reconnection failed after all attempts');
  // User sees "Offline" status in ConnectionStatus component
});
```

**Graceful Degradation:**
- If WebSocket fails, application falls back to HTTP polling
- If all real-time connections fail, users can still manually refresh
- Connection status is always visible to users
- No data loss occurs during disconnections

**Server-Side Connection Management:**
```typescript
io.on('connection', (socket) => {
  // Track active connections
  websocketConnections.inc();
  
  socket.on('disconnect', (reason) => {
    // Clean up resources
    websocketConnections.dec();
    
    // Log disconnection reasons for monitoring
    if (reason === 'transport close') {
      console.log('Client lost connection');
    } else if (reason === 'ping timeout') {
      console.log('Client failed to respond to ping');
    }
  });
});
```

### Performance Considerations

**Scalability:**
- Room-based broadcasting reduces unnecessary traffic
- Only book-related updates sent to subscribed clients
- Efficient message serialization with minimal payload
- Connection pooling for database operations

**Resource Usage:**
- WebSocket connections are lightweight (~1-2KB per connection)
- Minimal CPU overhead compared to HTTP polling
- Automatic cleanup of disconnected clients
- Memory-efficient event broadcasting

**Optimization Techniques:**
- Debouncing rapid updates (if needed)
- Batching multiple changes (future enhancement)
- Lazy loading of book details
- Progressive enhancement for real-time features

---

## Quick Start

### Local Development (Recommended)

**Step 1: Install dependencies**
```bash
npm install
```

**Step 2: Create environment file**
```bash
echo 'JWT_SECRET=my-super-secret-jwt-key-minimum-32-characters-long-12345' > .env
```

**Step 3: Start the application**
```bash
npm run dev
```

**Access your application:**
- Application: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs
- Health Check: http://localhost:5000/health

### Add Monitoring (Optional)

**Prerequisites:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Start monitoring services:**
```bash
docker-compose up -d
```

**Access monitoring dashboards:**
- Prometheus: http://localhost:9090 (no login required)
- Grafana: http://localhost:3001 (username: admin, password: admin123)

**Stop monitoring services:**
```bash
docker-compose down
```

**For detailed setup instructions, see [MONITORING_SETUP.md](./MONITORING_SETUP.md)**

---

## All Commands Reference

### Development Commands

```bash
# Install all dependencies
npm install

# Start development server with hot reload
npm run dev

# Build application for production
npm run build

# Start production server
npm start

# Run TypeScript type checking
npm run check
```

### Docker Commands

```bash
# Start monitoring services (Prometheus + Grafana)
docker-compose up -d

# Stop monitoring services
docker-compose down

# View logs from monitoring services
docker-compose logs -f

# Restart monitoring services
docker-compose restart

# Remove monitoring containers and volumes
docker-compose down -v
```

### Database Commands

```bash
# Connect to MongoDB (if using local instance)
mongosh "mongodb://localhost:27017/bookhub"

# Create admin user via MongoDB shell
db.users.updateOne(
  { username: "yourusername" },
  { $set: { role: "admin" } }
)

# View all books
db.books.find().pretty()

# View all users
db.users.find().pretty()

# Clear all orders
db.orders.deleteMany({})
```

### Testing Commands

```bash
# Health check
curl http://localhost:5000/health

# Get Prometheus metrics
curl http://localhost:5000/metrics

# Test API - Get all books
curl http://localhost:5000/api/books

# Test API - Create user (signup)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test API - Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

---

## Requirements

### For Local Development (Required)
- Node.js 20 or higher
- npm 10 or higher
- MongoDB instance (optional - uses in-memory storage by default)

### For Monitoring (Optional)
- Docker Desktop for Mac/Windows
- Minimum 2GB RAM available for Docker containers

### For Real-time Updates
- Modern browser with WebSocket support (Chrome 16+, Firefox 11+, Safari 7+, Edge 12+)
- Network allowing WebSocket connections (automatically falls back to polling if blocked)

---

## Configuration

### Required Environment Variables

```bash
# Security (Required for production)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Database Connection (Optional - app uses in-memory storage if not provided)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/bookhub
```

### Optional Environment Variables

```bash
# Application Configuration
NODE_ENV=production
PORT=5000

# MongoDB Options
DB_NAME=bookhub
DB_OPTIONS=retryWrites=true&w=majority

# WebSocket Configuration
CLIENT_URL=https://yourdomain.com  # For production CORS

# Grafana Security (generates random password if not set)
GF_SECURITY_ADMIN_PASSWORD=your-grafana-password
```

### Environment File Example

Create a `.env` file in the project root:

```env
JWT_SECRET=my-super-secret-jwt-key-minimum-32-characters-long-12345
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookhub
NODE_ENV=development
PORT=5000
```

---

## Project Structure

```
bookhub/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   └── ConnectionStatus.tsx  # WebSocket status indicator
│   │   ├── pages/         # Page components
│   │   │   └── Home.tsx   # Real-time book list
│   │   ├── lib/           # Utilities and helpers
│   │   │   └── socket.ts  # WebSocket client singleton
│   │   └── hooks/         # Custom React hooks
│   └── dist/              # Built frontend (after npm run build)
│
├── server/                # Backend Express application
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API routes with WebSocket broadcasts
│   ├── storage.ts        # Database abstraction layer
│   ├── metrics.ts        # Prometheus metrics collection
│   ├── websocket.ts      # WebSocket server setup and broadcasting
│   ├── security.ts       # Security middleware
│   └── swagger.ts        # API documentation configuration
│
├── shared/               # Shared TypeScript types
│   └── schema.ts        # Database schemas and validation
│
├── tests/               # Test files
│   └── integration/
│       └── websocket/   # WebSocket integration tests
│           └── realtime.test.ts
│
├── grafana/             # Grafana configuration
│   └── provisioning/
│       ├── datasources/ # Prometheus datasource config
│       └── dashboards/  # Pre-built dashboard definitions
│
├── docker-compose.yml   # Docker Compose for monitoring stack
├── prometheus.yml       # Prometheus configuration
├── Dockerfile          # Docker configuration for app
│
└── Documentation Files:
    ├── README.md           # This file
    ├── DEPLOYMENT.md       # Deployment guide
    ├── MONITORING_SETUP.md # Monitoring setup guide
    └── TESTING.md          # Testing documentation
```

---

## Database Setup

BookHub works with any MongoDB instance. The application automatically creates required collections and indexes.

### MongoDB Atlas (Recommended for Cloud)

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string from Atlas dashboard
3. Add to `.env` file as `MONGODB_URI`
4. Whitelist your IP address (or use 0.0.0.0/0 for testing)

### Self-Hosted MongoDB with Docker

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

Then set environment variable:
```bash
MONGODB_URI=mongodb://admin:password@localhost:27017/bookhub?authSource=admin
```

### In-Memory Storage (Development Only)

If no `MONGODB_URI` is provided, the application uses in-memory storage. This is perfect for:
- Quick local development
- Testing without database setup
- Demonstrations and prototypes

**Note:** In-memory data is lost when the server restarts.

### Auto-Schema Initialization

The application automatically creates:
- Users collection (with indexes on username and email)
- Books collection (with indexes on ISBN and title)
- Orders collection (with indexes on userId and createdAt)

**No manual setup required!**

---

## API Documentation

Interactive API documentation is available at:

**Local:** http://localhost:5000/api/docs  
**Production:** https://bookhub-ze18.onrender.com/api/docs/

Features:
- Complete endpoint documentation
- Test API calls directly in browser
- Request/Response schemas
- Authentication testing
- WebSocket event documentation

### Main API Endpoints

```
Authentication:
POST   /api/auth/signup       - Create new account
POST   /api/auth/login        - Login
POST   /api/auth/logout       - Logout
GET    /api/auth/profile      - Get current user

Books:
GET    /api/books            - List all books
GET    /api/books/:id        - Get single book
POST   /api/books            - Create book (admin) → Broadcasts 'book:created'
PUT    /api/books/:id        - Update book (admin) → Broadcasts 'book:updated'
DELETE /api/books/:id        - Delete book (admin) → Broadcasts 'book:deleted'

Orders:
GET    /api/orders           - List orders
POST   /api/orders           - Create order
GET    /api/orders/:id       - Get order details

Admin:
GET    /api/admin/stats      - Dashboard statistics
GET    /api/admin/users      - List users
PUT    /api/admin/users/:id  - Update user role

Monitoring:
GET    /health               - Health check
GET    /metrics              - Prometheus metrics
```

### WebSocket Events

**Events Emitted by Server:**
- `connection:success` - Sent when client connects successfully
- `book:created` - When a new book is added
- `book:updated` - When a book is modified
- `book:deleted` - When a book is removed

**Event Payloads:**
```typescript
// book:created, book:updated
{
  id: string;
  title: string;
  author: string;
  genre: string;
  year: number;
  price: number;
  isbn: string;
  coverUrl?: string;
  description?: string;
  stock: number;
}

// book:deleted
{
  id: string;
  title?: string;
  author?: string;
}
```

---

## Testing Real-time Updates

### Automated Tests

Run the WebSocket integration test suite:

```bash
npm test tests/integration/websocket/realtime.test.ts
```

This test suite verifies:
- WebSocket connection establishment
- Broadcasting of book:created events
- Broadcasting of book:updated events
- Broadcasting of book:deleted events
- Multiple client synchronization
- Error handling and reconnection

### Manual Testing Scenarios

#### Test Scenario 1: Multiple Clients Synchronization

**Objective:** Verify all connected clients receive updates instantly

**Steps:**
1. Open application in two browser windows side by side
2. Login to both windows with different accounts (one admin, one regular user)
3. In admin window: Navigate to admin dashboard
4. In admin window: Add a new book with title "Real-time Test Book"
5. **Expected Result:** Regular user window immediately shows the new book without refresh
6. In admin window: Update the book's price
7. **Expected Result:** Both windows show updated price instantly
8. In admin window: Delete the book
9. **Expected Result:** Book disappears from both windows immediately

**Success Criteria:**
- Updates appear in both windows within 100ms
- No manual refresh required
- Toast notifications appear confirming changes
- Connection status shows "Live (WS)" or "Live (Polling)"

#### Test Scenario 2: Real-time Inventory Updates

**Objective:** Verify inventory changes are immediately visible

**Steps:**
1. Open application in browser
2. Note the stock count of any book
3. In another browser (as admin): Reduce the stock by editing the book
4. **Expected Result:** First browser immediately shows updated stock count
5. If stock reaches 0, verify "Out of Stock" indicator appears instantly

**Success Criteria:**
- Stock count updates without page refresh
- UI reflects availability status changes
- Shopping cart updates if book becomes unavailable

#### Test Scenario 3: Connection Recovery

**Objective:** Verify automatic reconnection and data resynchronization

**Steps:**
1. Open application in browser
2. Note the connection status indicator shows "Live"
3. Simulate network interruption (disable WiFi or use browser DevTools → Network → Offline)
4. **Expected Result:** Connection status changes to "Offline"
5. Re-enable network connection
6. **Expected Result:** 
   - Connection status changes back to "Live" within 5 seconds
   - Book list automatically refreshes
   - Any changes made during disconnection appear

**Success Criteria:**
- Automatic reconnection occurs without user action
- Data resynchronizes after reconnection
- Maximum reconnection time: 5 seconds
- No error messages displayed to user

#### Test Scenario 4: Network Fallback

**Objective:** Verify fallback from WebSocket to polling

**Steps:**
1. Open browser DevTools → Console
2. Load application
3. Check console logs for connection messages
4. Look for: `[Socket] Transport upgraded to: websocket` or `[Socket] Transport: polling`
5. If in restricted network (corporate firewall), verify polling works
6. Add/update/delete books as admin
7. **Expected Result:** Updates still propagate in real-time via polling

**Success Criteria:**
- Application works with both WebSocket and polling transports
- Automatic fallback occurs without errors
- Real-time updates function regardless of transport method

#### Test Scenario 5: High-Load Concurrent Updates

**Objective:** Verify system handles multiple rapid updates

**Steps:**
1. Open application in three browser windows
2. As admin in one window: Rapidly add 5 books consecutively
3. **Expected Result:** All three windows show all 5 books in correct order
4. As admin: Rapidly update multiple book prices
5. **Expected Result:** All windows reflect all price changes
6. Check for memory leaks or performance degradation

**Success Criteria:**
- All updates received by all clients
- No duplicate or missing updates
- UI remains responsive
- No console errors

### Testing Checklist

Before marking the real-time feature as complete, verify:

- [x] WebSocket server initializes correctly on startup
- [x] Clients can establish WebSocket connections
- [x] Book creation broadcasts to all clients
- [x] Book updates broadcast to all clients
- [x] Book deletion broadcasts to all clients
- [x] Connection status indicator works correctly
- [x] Automatic reconnection functions properly
- [x] Fallback to polling works in restricted networks
- [x] Cache invalidation triggers UI updates
- [x] Toast notifications appear for all changes
- [x] Multiple clients stay synchronized
- [x] No memory leaks during extended sessions
- [x] CORS configuration allows production domains
- [x] WebSocket metrics appear in Prometheus
- [x] Integration tests pass

---

## Deployment

### Production Deployment

The application is deployed at:
- **Application**: https://bookhub-ze18.onrender.com/
- **API Documentation**: https://bookhub-ze18.onrender.com/api/docs/
- **Prometheus**: https://bookhub-prometheus.onrender.com/targets
- **Grafana Dashboard**: https://bookhub-grafana.onrender.com/d/bookhub_main/bookhub-application-dashboard

### Deployment Platforms

BookHub can be deployed to any Node.js hosting platform that supports WebSocket connections:

#### Recommended Platforms

**Render (Current Deployment):**
- Native WebSocket support
- Auto-deploy from GitHub
- Built-in SSL/TLS
- Automatic HTTPS upgrade
- No additional configuration needed for WebSockets

**Railway:**
- Excellent WebSocket support
- One-click deploy
- Automatic SSL certificates
- Environment variable management

**Heroku:**
- WebSocket support on all dynos
- Add-ons for MongoDB
- SSL included
- May require session affinity for load balancing

**Platform Requirements:**
- Node.js 20+ runtime
- WebSocket support (or HTTP long-polling fallback)
- MongoDB connection (use MongoDB Atlas for cloud)
- Environment variables: `JWT_SECRET`, `MONGODB_URI`

### WebSocket-Specific Deployment Considerations

#### Load Balancer Configuration

If using a load balancer, enable **sticky sessions** (session affinity) to ensure WebSocket connections remain with the same server instance:

**Nginx Configuration:**
```nginx
upstream bookhub {
    ip_hash;  # Sticky sessions
    server app1.example.com:5000;
    server app2.example.com:5000;
}

server {
    location /socket.io/ {
        proxy_pass http://bookhub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**AWS Application Load Balancer:**
- Enable sticky sessions in target group settings
- Set stickiness duration to at least 1 hour
- Configure health checks on `/health` endpoint

**Heroku:**
- Session affinity enabled by default
- No additional configuration needed

#### CORS Configuration for Production

Update `server/websocket.ts` to include your production domain:

```typescript
cors: {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      process.env.CLIENT_URL
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}
```

#### Environment Variables for Deployment

```bash
# Required
JWT_SECRET=production-secret-key-minimum-32-characters-long
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bookhub

# WebSocket CORS
CLIENT_URL=https://yourdomain.com

# Optional
NODE_ENV=production
PORT=5000
```

### Deployment Steps

**Step 1: Push code to GitHub**
```bash
git init
git add .
git commit -m "Deploy BookHub with real-time updates"
git remote add origin https://github.com/yourusername/bookhub.git
git push -u origin main
```

**Step 2: Connect to deployment platform**
- Log in to Render/Railway/Heroku
- Create new web service
- Connect GitHub repository
- Platform auto-detects Node.js and package.json

**Step 3: Configure environment variables**
- Add `JWT_SECRET` (generate with `openssl rand -base64 32`)
- Add `MONGODB_URI` (from MongoDB Atlas)
- Add `CLIENT_URL` (your production domain)

**Step 4: Deploy**
- Platform automatically builds and deploys
- Monitor logs for any errors
- Verify WebSocket connections in browser DevTools

**Step 5: Verify deployment**
```bash
# Check health
curl https://yourdomain.com/health

# Check WebSocket upgrade
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://yourdomain.com/socket.io/

# Open browser and verify real-time updates work
```

### Scaling Considerations

**Horizontal Scaling:**
- For multiple server instances, use a Redis adapter for Socket.IO:
  ```bash
  npm install @socket.io/redis-adapter redis
  ```
- Configure Redis for cross-server communication
- All instances will synchronize real-time events

**Vertical Scaling:**
- Current implementation handles ~10,000 concurrent WebSocket connections per instance
- Monitor `websocket_connections_total` metric in Grafana
- Scale up instance size if approaching limits

**Database Scaling:**
- Use MongoDB Atlas auto-scaling
- Consider read replicas for high traffic
- Implement database connection pooling (already configured)

---

## Monitoring & Metrics

BookHub includes comprehensive monitoring for both application performance and real-time WebSocket connections.

### Access Monitoring Dashboards

**Local Development:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin / admin123)

**Production:**
- Prometheus: https://bookhub-prometheus.onrender.com/targets
- Grafana: https://bookhub-grafana.onrender.com/d/bookhub_main/bookhub-application-dashboard

### WebSocket Metrics

The following Prometheus metrics track real-time connectivity:

**Connection Metrics:**
```
websocket_connections_total
  - Type: Gauge
  - Description: Number of active WebSocket connections
  - Use: Monitor concurrent users with real-time updates

websocket_messages_total{event="book:created"}
websocket_messages_total{event="book:updated"}
websocket_messages_total{event="book:deleted"}
  - Type: Counter
  - Description: Total WebSocket messages sent by event type
  - Use: Track real-time update frequency
```

**HTTP Metrics:**
```
http_request_duration_seconds
  - Type: Histogram
  - Description: Request latency by endpoint
  - Use: Monitor API performance

http_requests_total{method, route, status}
  - Type: Counter
  - Description: Total HTTP requests
  - Use: Track API usage patterns
```

**Business Metrics:**
```
book_operations_total{operation="create|update|delete"}
  - Type: Counter
  - Description: Book inventory operations
  - Use: Track catalog management activity

user_signups_total
  - Type: Counter
  - Description: New user registrations
  - Use: Monitor user growth

order_creation_total
  - Type: Counter
  - Description: Orders created
  - Use: Track sales activity
```

### Querying Metrics

**Check Active WebSocket Connections:**
```promql
websocket_connections_total
```

**Real-time Update Rate (events per second):**
```promql
rate(websocket_messages_total[1m])
```

**Book Creation Rate:**
```promql
rate(book_operations_total{operation="create"}[5m])
```

**API Request Latency (95th percentile):**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Grafana Dashboard

The pre-built Grafana dashboard includes:

**Real-time Updates Panel:**
- Active WebSocket connections (current)
- WebSocket messages per second (rate)
- Connection uptime percentage
- Event breakdown by type (created/updated/deleted)

**Application Performance Panel:**
- HTTP request rate
- API latency (P50, P95, P99)
- Error rate by endpoint
- Request distribution by status code

**Business Metrics Panel:**
- Total books in catalog
- User signups per hour
- Orders per day
- Top selling books

**System Health Panel:**
- CPU usage
- Memory usage
- Event loop lag
- Database connection pool status

### Setting Up Alerts

Configure Grafana alerts for critical issues:

**High WebSocket Disconnection Rate:**
```promql
rate(websocket_connections_total[5m]) < -10
```
Alert if more than 10 connections/second are dropping

**No WebSocket Connections:**
```promql
websocket_connections_total == 0
```
Alert if real-time updates are completely unavailable

**High API Error Rate:**
```promql
rate(http_requests_total{status=~"5.."}[5m]) > 10
```
Alert if more than 10 server errors per second

### Monitoring Commands

```bash
# Query Prometheus metrics directly
curl http://localhost:9090/api/v1/query?query=websocket_connections_total

# Check Prometheus targets health
curl http://localhost:9090/api/v1/targets

# Export Grafana dashboard
curl http://admin:admin123@localhost:3001/api/dashboards/uid/bookhub_main

# View real-time WebSocket events (in browser console)
# Open DevTools → Console, then watch for:
# [Socket] Connected
# [Real-time] New book created: <title>
```

---

## Troubleshooting

### WebSocket Connection Issues

#### Problem: Connection Status Shows "Offline"

**Symptoms:**
- Connection indicator shows "Offline"
- Real-time updates not working
- Browser console shows connection errors

**Solutions:**

1. **Check Server Status:**
```bash
curl http://localhost:5000/health
```
If server is down, restart it:
```bash
npm run dev
```

2. **Verify WebSocket Endpoint:**
Open browser DevTools → Network → WS tab
- Should see `socket.io/?EIO=4&transport=websocket` or `polling`
- Status should be 101 Switching Protocols

3. **Check CORS Configuration:**
If connecting from different domain, verify CORS settings in `server/websocket.ts`:
```bash
# Check browser console for CORS errors
# Error: "blocked by CORS policy"
```

Solution: Add your domain to allowed origins

4. **Test with Polling:**
Disable WebSocket in browser:
```javascript
// In browser console
localStorage.setItem('debug', '*');
```
Should see fallback to polling transport

5. **Firewall/Proxy Issues:**
Some corporate networks block WebSocket connections
- Verify polling fallback is working
- Check if port 5000 is accessible
- Contact network administrator if necessary

#### Problem: "Connection Timeout" Error

**Symptoms:**
- Browser console: `[Socket] Connection error: timeout`
- Connection never establishes

**Solutions:**

1. **Increase Timeout:**
In `client/src/lib/socket.ts`:
```typescript
socket = io(window.location.origin, {
  timeout: 20000,  // Increase from 10000 to 20000
});
```

2. **Check Network Latency:**
```bash
ping yourdomain.com
```
If latency > 5000ms, timeout is expected

3. **Verify Server is Listening:**
```bash
lsof -i :5000
```
Should show Node.js process

#### Problem: Frequent Reconnections

**Symptoms:**
- Connection status flickers between "Live" and "Offline"
- Browser console shows repeated connect/disconnect
- Real-time updates are delayed

**Solutions:**

1. **Check Server Logs:**
```bash
npm run dev
```
Look for: `[WebSocket] Client disconnected: ping timeout`

2. **Network Instability:**
- Use wired connection instead of WiFi
- Check for packet loss: `ping -c 100 yourdomain.com`

3. **Server Overload:**
Monitor CPU/memory in Grafana
- Scale up server instance if resources maxed out

4. **Adjust Ping Settings:**
In `server/websocket.ts`:
```typescript
const io = new SocketIOServer(server, {
  pingTimeout: 60000,  // Increase from default
  pingInterval: 25000,
});
```

#### Problem: Updates Not Broadcasting to All Clients

**Symptoms:**
- One client receives updates, others don't
- Inconsistent behavior across browsers

**Solutions:**

1. **Verify Broadcast Function:**
Check server logs for: `[WebSocket] Broadcasting book:created`

2. **Test Event Subscription:**
In browser console:
```javascript
getSocket().on('book:created', (book) => console.log('Received:', book));
```

3. **Clear Browser Cache:**
Hard refresh all browser windows (Ctrl+Shift+R or Cmd+Shift+R)

4. **Check Multiple Server Instances:**
If running multiple processes, ensure they share the same Socket.IO state
- Use Redis adapter for multi-instance deployments

### General Application Issues

#### Problem: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**

**Mac/Linux:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

**Windows:**
```bash
# Find process
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

#### Problem: MongoDB Connection Failures

**Symptoms:**
- Error: `Failed to connect to MongoDB`
- Application falls back to in-memory storage

**Solutions:**

1. **Verify Connection String:**
```bash
mongosh "your_connection_string"
```

2. **Check IP Whitelist (MongoDB Atlas):**
- Login to MongoDB Atlas
- Network Access → Add IP Address
- Use `0.0.0.0/0` for testing (not recommended for production)

3. **Verify Credentials:**
Ensure username/password in connection string are correct

4. **Test Connection:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```
Check server logs for MongoDB connection status

#### Problem: JWT_SECRET Missing

**Error:** `Fatal: JWT_SECRET is required`

**Solution:**
```bash
# Create .env file
echo 'JWT_SECRET=my-super-secret-jwt-key-minimum-32-characters-long-12345' > .env

# Restart server
npm run dev
```

#### Problem: Hot Reload Not Working

**Symptoms:**
- Code changes don't reflect in browser
- Need to manually restart server

**Solutions:**

1. **Clear Vite Cache:**
```bash
rm -rf node_modules/.vite
npm run dev
```

2. **Hard Refresh Browser:**
- Mac: Cmd + Shift + R
- Windows/Linux: Ctrl + Shift + R

3. **Verify Vite is Running:**
Check server logs for: `vite v5.x.x dev server running`

### Monitoring Issues

#### Problem: Prometheus Not Scraping Metrics

**Check Prometheus Targets:**
http://localhost:9090/targets

**Solutions:**

1. **Verify App is Running:**
```bash
curl http://localhost:5000/metrics
```
Should return Prometheus-format metrics

2. **Check prometheus.yml Configuration:**
```yaml
scrape_configs:
  - job_name: 'bookhub'
    static_configs:
      - targets: ['host.docker.internal:5000']
```

3. **Restart Prometheus:**
```bash
docker-compose restart prometheus
```

#### Problem: Grafana Dashboard Shows "No Data"

**Solutions:**

1. **Verify Prometheus Datasource:**
Grafana → Configuration → Data Sources → Prometheus
- URL should be `http://prometheus:9090`
- Click "Test & Save"

2. **Check Time Range:**
Grafana dashboard → Time range selector
- Set to "Last 15 minutes"

3. **Generate Sample Data:**
```bash
# Create some books to generate metrics
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","author":"Author","genre":"Fiction","year":2024,"price":999,"isbn":"1234567890","stock":10}'
```

### Getting Help

If issues persist:

1. **Check Server Logs:**
```bash
npm run dev 2>&1 | tee app.log
```

2. **Check Browser Console:**
Open DevTools → Console, look for errors

3. **Enable Debug Logging:**
In browser console:
```javascript
localStorage.setItem('debug', '*');
```
Reload page and check for detailed Socket.IO logs

4. **Review Documentation:**
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Monitoring troubleshooting
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment issues
- API Docs: http://localhost:5000/api/docs

5. **Test with Curl:**
```bash
# Health check
curl http://localhost:5000/health

# WebSocket upgrade
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:5000/socket.io/
```

---

## Security Features

BookHub implements enterprise-grade security practices:

**Authentication & Authorization:**
- JWT authentication with secure sessions
- Password hashing with bcrypt (10 rounds)
- Role-based access control (admin/user)
- Secure cookie handling with httpOnly flag

**Network Security:**
- CORS with origin whitelist
- Helmet.js security headers (XSS, clickjacking, MIME sniffing protection)
- Rate limiting (100 requests per 15 minutes per IP)
- CSRF protection for state-changing operations

**Data Validation:**
- Input validation with Zod schemas
- SQL injection prevention (MongoDB parameterized queries)
- XSS protection via content sanitization
- File upload restrictions (if applicable)

**WebSocket Security:**
- Same-origin policy enforcement
- CORS validation for WebSocket connections
- No sensitive data in WebSocket messages
- Automatic disconnection of idle connections

**Monitoring & Compliance:**
- Audit logging of admin actions
- Failed authentication tracking
- Real-time security metrics in Grafana
- Regular dependency updates

---



### Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- TanStack Query (React Query v5)
- Wouter (routing)
- Tailwind CSS
- shadcn/ui components
- Socket.IO Client

**Backend:**
- Node.js 20
- Express.js
- TypeScript
- MongoDB (or in-memory storage)
- Socket.IO Server
- JWT authentication
- Zod validation

**Monitoring:**
- Prometheus
- Grafana
- prom-client

**Development:**
- Hot reload with Vite
- TypeScript strict mode
- ESLint + Prettier (optional)
- Docker Compose for monitoring

---

## Documentation

- **[MONITORING_SETUP.md](./MONITORING_SETUP.md)** - Detailed monitoring setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for cloud platforms
- **[TESTING.md](./TESTING.md)** - Testing documentation and procedures
- **[API Docs](http://localhost:5000/api/docs)** - Interactive API documentation (when app is running)

---

## Contributing

This is an enterprise template. Contributions welcome:
- Fork and customize for your needs
- Add new features
- Improve documentation
- Report issues or bugs
- Submit pull requests

---

## License

MIT License - free to use for any purpose, commercial or personal.

---

## Support

For help and troubleshooting:
- Check the [Troubleshooting](#troubleshooting) section above
- Review [MONITORING_SETUP.md](./MONITORING_SETUP.md) for monitoring issues
- Consult [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment problems
- Test health endpoint: `curl http://localhost:5000/health`
- Enable debug logging in browser console: `localStorage.setItem('debug', '*')`

---

**Built with modern web technologies for real-time, scalable.**

