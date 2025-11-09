# BookHub - Enterprise Book Management System

Complete full-stack book management platform with real-time updates, built-in monitoring, API documentation, and admin panel.

---

## Access Everything

All services and their access information:

| Service | URL | Login Credentials |
|---------|-----|-------------------|
| Your App | http://localhost:5000 | Create account |
| Prometheus | http://localhost:9090 | No login needed |
| Grafana | http://localhost:3001 | login needed  |

---

## Table of Contents

- [Features](#features)
- [Real-time Updates Implementation](#real-time-updates-implementation)
- [Quick Start](#quick-start)
- [All Commands Reference](#all-commands-reference)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Monitoring & Metrics](#monitoring--metrics)
- [Deployment](#deployment)
- [Security Features](#security-features)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Features

### For Customers
- Browse and search books with real-time inventory updates
- Shopping cart and checkout functionality
- User accounts and authentication
- Responsive design (mobile, tablet, desktop)
- Dark/Light theme support
- Real-time notifications for book updates

### For Administrators
- Comprehensive admin dashboard
- Book inventory management with instant updates
- User management
- Order tracking and management
- Business analytics and metrics
- Advanced search and filtering

### Technical Features
- RESTful API with Swagger documentation
- Real-time monitoring with Prometheus & Grafana
- Enterprise-grade security (CORS, CSRF, rate limiting)
- WebSocket support for real-time updates
- MongoDB integration with auto-schema
- Docker deployment (single container or compose)

---

## Real-time Updates Implementation

### Overview

BookHub implements WebSocket-based real-time updates to provide instant synchronization across all connected clients when books are added, updated, or deleted. This ensures users always see the latest book inventory without manual page refreshes.

### Technology Stack

**WebSocket Server**: Socket.IO
- Reliable WebSocket connections with automatic fallback
- Room-based broadcasting for efficient updates
- Built-in reconnection handling

### Architecture

#### Backend Implementation

The backend WebSocket server is implemented in `server/websocket.ts`:

```
WebSocket Server Features:
- Connection management and authentication
- Event broadcasting to all connected clients
- Room-based updates for scalability
- Error handling and disconnection management
```

**Events Emitted by Server:**
- `book:created` - When a new book is added
- `book:updated` - When a book is modified
- `book:deleted` - When a book is removed
- `inventory:changed` - When book inventory is updated

#### Frontend Integration

The frontend connects to the WebSocket server and listens for real-time events:

**Implementation Details:**
- Automatic connection establishment on app load
- Event listeners for book updates
- Cache invalidation via TanStack Query
- Graceful handling of disconnections and errors
- Reconnection with exponential backoff

**Client-Side Flow:**
1. User loads the application
2. WebSocket connection established to server
3. Client subscribes to book-related events
4. When server broadcasts updates, client receives events
5. TanStack Query cache is invalidated
6. UI automatically re-renders with latest data

### How It Works

**1. Book Creation:**
```
Admin adds book → Backend creates in DB → WebSocket broadcasts 'book:created' 
→ All clients receive event → Clients refresh book list → Users see new book
```

**2. Book Updates:**
```
Admin updates book → Backend updates DB → WebSocket broadcasts 'book:updated' 
→ All clients receive event → Clients update cache → Users see changes
```

**3. Book Deletion:**
```
Admin deletes book → Backend removes from DB → WebSocket broadcasts 'book:deleted' 
→ All clients receive event → Clients remove from cache → Users see updated list
```

### Connection Management

**Automatic Reconnection:**
- Detects disconnections automatically
- Reconnects with exponential backoff
- Resynchronizes data after reconnection

**Error Handling:**
- Connection failures logged to console
- Fallback to polling if WebSocket unavailable
- User notifications for connection status

### Testing Real-time Updates

**Test Scenario 1: Multiple Clients**
1. Open application in two browser windows
2. Login to both windows
3. In window 1, add a new book (as admin)
4. Observe window 2 automatically shows the new book

**Test Scenario 2: Book Updates**
1. Open application in two browser windows
2. In window 1, edit a book's price
3. Observe window 2 immediately reflects the price change

**Test Scenario 3: Connection Recovery**
1. Open application
2. Stop the server
3. Make changes (they will queue)
4. Restart server
5. Observe automatic reconnection and data sync

### Performance Considerations

**Scalability:**
- Room-based broadcasting reduces unnecessary traffic
- Only relevant updates sent to subscribed clients
- Efficient message serialization

**Resource Usage:**
- WebSocket connections are lightweight
- Minimal overhead compared to polling
- Automatic cleanup of disconnected clients

### Monitoring WebSocket Connections

Real-time metrics available in Prometheus:

```
websocket_connections_total - Active WebSocket connections
websocket_messages_total - Total messages sent/received
websocket_errors_total - Connection errors
```

View in Grafana dashboard at http://localhost:3001

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
npm run start

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

### Troubleshooting Commands

```bash
# Find process using port 5000 (Mac/Linux)
lsof -i :5000

# Kill process on port 5000 (Mac/Linux)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Find process using port 5000 (Windows)
netstat -ano | findstr :5000

# Kill process on port 5000 (Windows)
taskkill /PID <PID> /F

# View application logs
npm run dev 2>&1 | tee app.log

# Check MongoDB connection
mongosh "your_connection_string" --eval "db.adminCommand('ping')"
```

### Monitoring Commands

```bash
# Query Prometheus metrics directly
curl http://localhost:9090/api/v1/query?query=up

# Export Grafana dashboard
curl http://admin:admin123@localhost:3001/api/dashboards/uid/<dashboard-uid>

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets
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
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and helpers
│   │   └── hooks/         # Custom React hooks
│   └── dist/              # Built frontend (after npm run build)
│
├── server/                # Backend Express application
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database abstraction layer
│   ├── metrics.ts        # Prometheus metrics collection
│   ├── websocket.ts      # WebSocket server for real-time updates
│   ├── security.ts       # Security middleware
│   └── swagger.ts        # API documentation configuration
│
├── shared/               # Shared TypeScript types
│   └── schema.ts        # Database schemas and validation
│
├── grafana/             # Grafana configuration
│   └── provisioning/
│       ├── datasources/ # Prometheus datasource config
│       └── dashboards/  # Pre-built dashboard definitions
│
├── tests/               # Test files
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
  -v mongodb_data:/data/db \
  mongo:latest
```

Connection string: `mongodb://admin:password@localhost:27017/bookhub?authSource=admin`

### Auto-Schema Initialization

The application automatically creates:
- **Users collection** with unique indexes on username and email
- **Books collection** with indexes for search optimization
- **Orders collection** with user and date indexes

No manual database setup required.

---

## API Documentation

Interactive API documentation is available via Swagger UI when the application is running.

**Access:** http://localhost:5000/api/docs

**Features:**
- Complete endpoint documentation
- Test API calls directly in browser
- Request/Response schema validation
- Authentication testing interface

### Main API Endpoints

#### Authentication
```
POST   /api/auth/signup       - Create new user account
POST   /api/auth/login        - User login
POST   /api/auth/logout       - User logout
GET    /api/auth/profile      - Get current user profile
```

#### Books
```
GET    /api/books            - List all books
GET    /api/books/:id        - Get single book details
POST   /api/books            - Create new book (admin only)
PUT    /api/books/:id        - Update book (admin only)
DELETE /api/books/:id        - Delete book (admin only)
```

#### Orders
```
GET    /api/orders           - List user orders
POST   /api/orders           - Create new order
GET    /api/orders/:id       - Get order details
```

#### Admin
```
GET    /api/admin/stats      - Dashboard statistics
GET    /api/admin/users      - List all users
PUT    /api/admin/users/:id  - Update user role
```

#### System
```
GET    /health               - Application health check
GET    /metrics              - Prometheus metrics endpoint
```

---

## Monitoring & Metrics

BookHub includes comprehensive monitoring with Prometheus for metrics collection and Grafana for visualization.

### Metrics Collected

**HTTP Metrics:**
- Request rate and throughput
- Response latency (P50, P95, P99 percentiles)
- Status code distribution
- Error rates

**Business Metrics:**
- Book operations (create, update, delete)
- User signups and authentication
- Order creation and processing
- Real-time user activity

**WebSocket Metrics:**
- Active connection count
- Message send/receive rates
- Connection errors and reconnections
- Room subscription counts

**System Metrics:**
- CPU usage
- Memory consumption
- Event loop lag
- Process uptime

### Accessing Monitoring Tools

**Prometheus** (http://localhost:9090)
- View raw metrics data
- Execute custom PromQL queries
- Monitor target health status
- Create custom alerts

**Grafana** (http://localhost:3001)
- Pre-configured BookHub dashboard
- Real-time metric visualization
- Historical trend analysis
- Custom dashboard creation

**Default Login:** admin / admin123

### Custom Metrics in Code

```typescript
import { bookOperations, wsConnections } from './server/metrics';

// Track business events
bookOperations.inc({ operation: 'create' });
bookOperations.inc({ operation: 'update' });
bookOperations.inc({ operation: 'delete' });

// Track WebSocket connections
wsConnections.inc(); // New connection
wsConnections.dec(); // Disconnection
```

For detailed monitoring setup, see [MONITORING_SETUP.md](./MONITORING_SETUP.md)

---

## Deployment

### Cloud Platform Deployment

BookHub can be deployed to any Node.js hosting platform:

**Deployment Requirements:**
- Node.js 20+ runtime support
- MongoDB database (recommend MongoDB Atlas)
- Environment variable configuration
- Minimum 512MB RAM

**Standard Deployment Steps:**
1. Push code to GitHub repository
2. Connect repository to your chosen platform
3. Configure environment variables (JWT_SECRET, MONGODB_URI)
4. Platform automatically builds and deploys
5. Access your live application

For platform-specific guides, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Docker Deployment

**Build Docker image:**
```bash
docker build -t bookhub:latest .
```

**Run container:**
```bash
docker run -d \
  -p 5000:5000 \
  -e JWT_SECRET=your-secret-key \
  -e MONGODB_URI=your-mongodb-uri \
  --name bookhub \
  bookhub:latest
```

---

## Security Features

BookHub implements enterprise-grade security practices:

- **Authentication:** JWT-based authentication with secure sessions
- **Password Security:** bcrypt hashing with salt rounds
- **CORS Protection:** Configured whitelist for allowed origins
- **Security Headers:** Helmet.js for HTTP header security
- **Rate Limiting:** 100 requests per 15 minutes per IP address
- **CSRF Protection:** Token-based CSRF prevention
- **Input Validation:** Zod schema validation on all inputs
- **XSS Protection:** Content Security Policy headers
- **Injection Prevention:** Parameterized queries (MongoDB)
- **Session Security:** HTTP-only cookies, secure flags in production

---

## Development

### Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite (build tool)
- TanStack Query (data fetching)
- Wouter (routing)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Socket.IO Client (WebSocket)

**Backend:**
- Node.js 20
- Express.js
- TypeScript
- MongoDB (database)
- Socket.IO (WebSocket server)
- JWT (authentication)
- Zod (validation)

**Monitoring:**
- Prometheus (metrics collection)
- Grafana (visualization)
- prom-client (Node.js metrics)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD ready)

### Development Workflow

1. **Make changes** to code
2. **Hot reload** automatically updates browser
3. **Check types** with `npm run check`
4. **Test API** via Swagger UI at http://localhost:5000/api/docs
5. **Monitor metrics** at http://localhost:9090 (Prometheus)
6. **View dashboards** at http://localhost:3001 (Grafana)

---

## Testing

### Manual Testing

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Metrics Endpoint:**
```bash
curl http://localhost:5000/metrics
```

**API Endpoints:**
```bash
# Get all books
curl http://localhost:5000/api/books

# Create user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Testing Real-time Updates

1. Open application in two browser tabs
2. Login as admin in one tab
3. Add/edit/delete a book
4. Verify changes appear instantly in the second tab

### Load Testing

```bash
# Install Apache Bench
brew install httpd  # Mac
apt-get install apache2-utils  # Linux

# Test with 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:5000/api/books
```

---

## Troubleshooting

### Missing JWT_SECRET Error

**Problem:** Application fails to start with JWT_SECRET error

**Solution:**
```bash
echo 'JWT_SECRET=my-super-secret-jwt-key-minimum-32-characters-long-12345' > .env
```

### Port Already in Use

**Problem:** Error: Port 5000 is already in use

**Solution (Mac/Linux):**
```bash
lsof -i :5000
kill -9 <PID>
```

**Solution (Windows):**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Issues

**Problem:** Cannot connect to MongoDB

**Solutions:**
- Verify `MONGODB_URI` in `.env` file
- Check MongoDB Atlas IP whitelist settings
- Test connection: `mongosh "your_connection_string"`
- Application falls back to in-memory storage if connection fails

### WebSocket Connection Failures

**Problem:** Real-time updates not working

**Solutions:**
- Check browser console for WebSocket errors
- Verify firewall allows WebSocket connections
- Ensure server is running: `curl http://localhost:5000/health`
- Check server logs for WebSocket errors

### Monitoring Not Working

**Problem:** Prometheus/Grafana not accessible

**Solutions:**
- Ensure Docker is running: `docker ps`
- Restart services: `docker-compose restart`
- Check logs: `docker-compose logs -f`
- See [MONITORING_SETUP.md](./MONITORING_SETUP.md) for detailed troubleshooting

---

## Default Admin Account

The first user to sign up automatically becomes an administrator.

**Manual Admin Creation via MongoDB:**

```javascript
db.users.updateOne(
  { username: "yourusername" },
  { $set: { role: "admin" } }
)
```

---

## Quick Reference Table

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| Application | 5000 | http://localhost:5000 | Sign up to create |
| API Documentation | 5000 | http://localhost:5000/api/docs | None required |
| Health Check | 5000 | http://localhost:5000/health | None required |
| Prometheus | 9090 | http://localhost:9090 | None required |
| Grafana | 3001 | http://localhost:3001 | admin / admin123 |

---

## Key Advantages

**Production-Ready:**
- Enterprise-grade security built-in
- Comprehensive API documentation
- Built-in monitoring and metrics
- Real-time updates via WebSocket

**Developer-Friendly:**
- Fast development with hot reload
- Type-safe with TypeScript
- Clear project structure
- Extensive documentation

**Flexible:**
- Works with any MongoDB instance
- Deploy to any Node.js platform
- Optional monitoring stack
- In-memory storage fallback

**Scalable:**
- Efficient WebSocket implementation
- Room-based broadcasting
- Prometheus metrics for monitoring
- Docker deployment ready

---

## Contributing

This is an enterprise template. Contributions welcome:
- Fork and customize for your needs
- Add new features
- Improve documentation
- Report issues and bugs

---

## License

MIT License - Free to use for any purpose, commercial or personal.

---

## Support & Documentation

**Documentation:**
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Complete monitoring setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Cloud deployment guides
- [TESTING.md](./TESTING.md) - Testing documentation

**Quick Health Check:**
```bash
curl http://localhost:5000/health
```

**Get Help:**
- Check documentation files in project root
- Review API docs at http://localhost:5000/api/docs
- Inspect server logs when running `npm run dev`

---

**Built for production. Optimized for developers. Ready to deploy.**
