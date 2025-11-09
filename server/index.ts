import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cookieParser from "cookie-parser";
import compression from "compression";
import { setupSecurityMiddleware } from "./middleware/security";
import { metricsMiddleware } from "./metrics";

const app = express();

// Trust proxy - required for rate limiting and correct client IPs
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ----------------------------------------------------------
// 🛡️ Middleware Setup
// ----------------------------------------------------------

// 1. Security middleware
setupSecurityMiddleware(app);

// 2. Metrics middleware (before routes)
app.use(metricsMiddleware);

// 3. Compression for performance
app.use(compression());

// 4. Body parsers
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ----------------------------------------------------------
// 🧾 Request Logging Middleware
// ----------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  if (path.startsWith("/socket.io")) {
    console.log(`[Socket.io] Incoming request: ${req.method} ${path}`);
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// ----------------------------------------------------------
// 🚀 Application Bootstrap
// ----------------------------------------------------------
(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development, serve static in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // --------------------------------------------------------
  // 🧠 Safe server binding configuration (Render + Local)
  // --------------------------------------------------------
  const port = parseInt(process.env.PORT || "5000", 10);
  const host =
    process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

  server.listen(port, host, () => {
    log(`✅ Server running on http://${host}:${port}`);
    log(`🌐 Environment: ${process.env.NODE_ENV}`);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    log("🛑 Server shutting down...");
    server.close(() => {
      log("✅ Server closed gracefully");
      process.exit(0);
    });
  });
})();
