import promClient from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Create a Registry for Prometheus metrics
export const register = new promClient.Registry();

// Add default labels to all metrics
register.setDefaultLabels({
  app: 'bookhub',
  environment: process.env.NODE_ENV || 'development',
});

// Collect default Node.js metrics (CPU, memory, event loop lag, GC, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 10,
});

// ====== HTTP Metrics ======

// HTTP request duration histogram
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// HTTP request counter
export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request size summary
export const httpRequestSize = new promClient.Summary({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register],
});

// HTTP response size summary
export const httpResponseSize = new promClient.Summary({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code'],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register],
});

// ====== Business Metrics ======

// Books counter
export const booksTotal = new promClient.Gauge({
  name: 'books_total',
  help: 'Total number of books in inventory',
  registers: [register],
});

// Book operations counter
export const bookOperations = new promClient.Counter({
  name: 'book_operations_total',
  help: 'Total number of book operations',
  labelNames: ['operation'], // create, update, delete
  registers: [register],
});

// Orders counter
export const ordersTotal = new promClient.Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['status'], // pending, processing, completed, cancelled
  registers: [register],
});

// Order value gauge (tracks current order value)
export const orderValue = new promClient.Gauge({
  name: 'order_value_dollars',
  help: 'Current order value in dollars',
  registers: [register],
});

// User operations counter
export const userOperations = new promClient.Counter({
  name: 'user_operations_total',
  help: 'Total number of user operations',
  labelNames: ['operation'], // signup, login, logout
  registers: [register],
});

// Active users gauge
export const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Total number of active users',
  registers: [register],
});

// ====== WebSocket Metrics ======

// WebSocket connections gauge
export const websocketConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// WebSocket messages counter
export const websocketMessages = new promClient.Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type', 'direction'], // type: book:created, book:updated, etc., direction: sent, received
  registers: [register],
});

// ====== Authentication Metrics ======

// Authentication attempts counter
export const authAttempts = new promClient.Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'role'], // status: success, failure; role: user, admin
  registers: [register],
});

// ====== Error Metrics ======

// Application errors counter
export const appErrors = new promClient.Counter({
  name: 'app_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'route'], // type: validation, database, authentication, etc.
  registers: [register],
});

// ====== Middleware for tracking HTTP metrics ======

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip metrics for the /metrics endpoint itself to avoid self-monitoring
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  const start = Date.now();

  // Track request size
  const requestSize = parseInt(req.get('content-length') || '0', 10);
  if (requestSize > 0 && req.path.startsWith('/api')) {
    const route = getRoutePattern(req);
    httpRequestSize.observe({ method: req.method, route }, requestSize);
  }

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = getRoutePattern(req);
    const statusCode = res.statusCode.toString();

    // Only track API routes to avoid noise from static assets
    if (req.path.startsWith('/api')) {
      // Record duration
      httpRequestDuration.observe(
        { method: req.method, route, status_code: statusCode },
        duration
      );

      // Increment request counter
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: statusCode,
      });

      // Track response size
      const responseSize = parseInt(res.get('content-length') || '0', 10);
      if (responseSize > 0) {
        httpResponseSize.observe(
          { method: req.method, route, status_code: statusCode },
          responseSize
        );
      }
    }
  });

  next();
}

// Helper function to extract route pattern from request
function getRoutePattern(req: Request): string {
  // Try to get the route from Express route
  if (req.route && req.route.path) {
    return req.route.path;
  }

  // Fallback: normalize path by replacing IDs with placeholders
  let path = req.path;

  // Replace numeric IDs with :id
  path = path.replace(/\/\d+/g, '/:id');

  // Replace UUIDs with :id
  path = path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id'
  );

  return path;
}

// ====== Helper functions for business metrics ======

export function incrementBookOperation(operation: 'create' | 'update' | 'delete') {
  bookOperations.inc({ operation });
}

export function setBookTotal(count: number) {
  booksTotal.set(count);
}

export function incrementOrder(status: 'pending' | 'processing' | 'completed' | 'cancelled') {
  ordersTotal.inc({ status });
}

export function setOrderValue(value: number) {
  orderValue.set(value);
}

export function incrementUserOperation(operation: 'signup' | 'login' | 'logout') {
  userOperations.inc({ operation });
}

export function setActiveUsers(count: number) {
  activeUsers.set(count);
}

export function setWebSocketConnections(count: number) {
  websocketConnections.set(count);
}

export function incrementWebSocketMessage(
  type: string,
  direction: 'sent' | 'received'
) {
  websocketMessages.inc({ type, direction });
}

export function incrementAuthAttempt(
  status: 'success' | 'failure',
  role: 'user' | 'admin'
) {
  authAttempts.inc({ status, role });
}

export function incrementAppError(type: string, route: string) {
  appErrors.inc({ type, route });
}

// ====== Metrics endpoint handler ======

export async function metricsHandler(_req: Request, res: Response) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
}
