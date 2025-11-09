import { type Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

/**
 * Configure and apply comprehensive security middleware
 * Includes: Helmet, CORS, Rate Limiting, and additional security headers
 */
export function setupSecurityMiddleware(app: Express): void {
  // 1. HELMET - Security Headers
  // Protects against common web vulnerabilities
  // NOTE: CSP is disabled in development to allow Vite HMR and React Fast Refresh
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  app.use(helmet({
    contentSecurityPolicy: isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind CSS
          'https://fonts.googleapis.com'
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com'
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://covers.openlibrary.org', // Open Library book covers
          'https://*.googleusercontent.com' // User avatars (if using Google Auth)
        ],
        scriptSrc: [
          "'self'",
          // Only add 'unsafe-inline' and 'unsafe-eval' if absolutely necessary
          // For production, use nonces or hashes instead
        ],
        connectSrc: [
          "'self'",
          ...(isDevelopment ? ['ws:'] : []), // WebSocket for local development
          'wss:', // Secure WebSocket for production (all platforms)
        ],
        frameSrc: ["'none'"], // Prevent clickjacking
        objectSrc: ["'none'"], // Prevent plugin exploitation
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Set to true for stricter security
    crossOriginResourcePolicy: { policy: "same-site" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: isDevelopment ? false : {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  }));

  // 2. CORS Configuration - Secure same-origin policy with platform flexibility
  // Controls which domains can access the API
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
      if (!origin) {
        console.log('[Security] Allowing request with no origin (mobile/native app)');
        return callback(null, true);
      }

      // Development mode: Allow localhost and development environments
      if (isDevelopment) {
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.includes('.replit.dev') ||
          origin.includes('.repl.co')
        ) {
          console.log(`[Security] ✅ Development mode - allowing origin: ${origin}`);
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
          console.log(`[Security] ✅ Production - allowing origin: ${origin}`);
          return callback(null, true);
        }
        
        // Log rejected origins for debugging
        console.warn(`[Security] ❌ Production - blocked origin: ${origin}`);
        console.warn(`[Security] Allowed origins: ${allowedOrigins.join(', ') || 'none configured'}`);
      }

      // If we get here, block the origin
      console.warn(`[Security] ❌ CORS blocked request from: ${origin}`);
      console.warn(`[Security] Environment: ${process.env.NODE_ENV || 'development'}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 hours
  }));

  // 3. RATE LIMITING
  // Protect against brute force and DDoS attacks

  // General API rate limiter - 100 requests per 15 minutes per IP
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests in count for authenticated users
    skipSuccessfulRequests: false,
    // Use default IP-based key generator (handles IPv6 properly)
  });

  // Strict rate limiter for authentication endpoints - 5 requests per 15 minutes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
  });

  // Moderate rate limiter for book creation/updates - 30 requests per 15 minutes
  const bookMutationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many book modifications, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiters to specific routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/signup', authLimiter);
  app.use('/api', generalLimiter);

  // Apply book mutation limiter (will be applied in routes.ts for specific endpoints)
  app.set('bookMutationLimiter', bookMutationLimiter);

  // 4. ADDITIONAL SECURITY HEADERS
  // Add custom security headers
  app.use((req, res, next) => {
    // Prevent browser from MIME-sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Disable client-side caching for sensitive routes
    if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // Add custom security header
    res.setHeader('X-Powered-By', 'BookHub'); // Override Express header
    
    next();
  });

  // 5. REQUEST LOGGING FOR SECURITY MONITORING
  app.use((req, res, next) => {
    // Log suspicious patterns
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript protocol
      /on\w+\s*=/i,  // Event handler injection
    ];

    const url = req.url.toLowerCase();
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url));

    if (isSuspicious) {
      console.warn(`[Security] Suspicious request detected: ${req.method} ${req.url} from ${req.ip}`);
    }

    next();
  });

  console.log('[Security] ✅ Security middleware configured successfully');
  console.log(`[Security] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Security] CORS Policy: ${isDevelopment ? 'Development (localhost + *.replit.dev)' : 'Production (strict exact-match allow-list)'}`);
}

/**
 * Export the book mutation rate limiter for use in routes
 */
export function getBookMutationLimiter(app: Express) {
  return app.get('bookMutationLimiter');
}
