# Environment Variables Setup Guide

## 🔐 Environment Variables Configuration

Environment variables are essential for configuring your application across different environments (development, staging, production). This guide covers how to set them up properly for **100% reliable operation on any platform**.

---

## 📋 Required Environment Variables

### 1. **MONGODB_URI** (Required for database persistence)
- Your MongoDB connection string
- Get it from [MongoDB Atlas](https://cloud.mongodb.com/)
- Example: `mongodb+srv://user:pass@cluster0.mongodb.net/?appName=BookHub`
- If not set, the app will use in-memory storage (data lost on restart)

### 2. **JWT_SECRET** (Required for authentication)
- A secret key used to sign and verify JWT tokens
- Should be a long, random string
- Example: `your-super-secret-jwt-key-change-this-in-production`
- Generate a secure one using: `openssl rand -base64 32`
- **IMPORTANT:** Never share this secret publicly

---

## ⚙️ Optional Environment Variables

### 3. **PORT** (Optional)
- Default: `5000`
- The port where the server runs
- **Most platforms automatically set this for you**
- Only set manually if running locally or on custom infrastructure

### 4. **NODE_ENV** (Optional)
- Default: `development`
- Set to `production` when deploying
- **Production platforms typically set this automatically**
- Controls CORS policy, security headers, and logging behavior

### 5. **CLIENT_URL** (Optional - Extra Security)
- Your production frontend URL
- Example: `https://my-app.vercel.app` or `https://my-app.railway.app`
- **Not required** - the app automatically detects the origin
- Adds an extra security layer if you want to restrict access to a specific domain

---

## 🌍 How Cross-Environment Compatibility Works

### **Secure CORS Policy** 🔒✨
Your application uses a **secure, platform-agnostic CORS configuration** that works on **any deployment platform**:

#### **Development Mode** (`NODE_ENV=development`)
- ✅ Allows `localhost` and `127.0.0.1` on all ports
- ✅ Allows `*.replit.dev` and `*.repl.co` domains
- ✅ No HTTPS requirement

#### **Production Mode** (`NODE_ENV=production`)
- ✅ **Strict same-origin policy** - only allows exact origin matches
- ✅ **Auto-detects platform environment variables** for the deployed domain:
  - `REPLIT_DEV_DOMAIN` → `https://${REPLIT_DEV_DOMAIN}`
  - `RAILWAY_PUBLIC_DOMAIN` → `https://${RAILWAY_PUBLIC_DOMAIN}`
  - `RENDER_EXTERNAL_URL` → exact value used
  - `VERCEL_URL` → `https://${VERCEL_URL}`
- ✅ **No wildcard or pattern matching** - prevents attacks from other apps on shared platforms
- ✅ **CLIENT_URL override** for custom domains
- ✅ WebSocket connections work when origin matches exactly

### **Why This Is Secure & Works Everywhere**
Since your frontend and backend are served from the **same domain** (monorepo pattern), the origin will always be the platform's auto-detected URL. The CORS policy uses **strict exact-match allow-listing** with **zero pattern matching**, preventing CSRF attacks even from other apps deployed on the same platform (e.g., `evil.railway.app` cannot attack `yourapp.railway.app`).

---

## 🚀 Platform-Specific Deployment Guides

### **Railway.app**
```bash
# Required environment variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key

# Optional (auto-detected):
NODE_ENV=production             # Railway sets this automatically
PORT=3000                       # Railway sets this automatically
RAILWAY_PUBLIC_DOMAIN=...       # Railway sets this automatically (used for CORS)
```

### **Vercel**
```bash
# Required environment variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key

# Optional (auto-detected):
NODE_ENV=production             # Vercel sets this automatically
VERCEL_URL=...                  # Vercel sets this automatically (used for CORS)
```

### **Render**
```bash
# Required environment variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key

# Optional (auto-detected):
NODE_ENV=production             # Render sets this automatically
PORT=10000                      # Render sets this automatically
RENDER_EXTERNAL_URL=...         # Render sets this automatically (used for CORS)
```

### **Heroku**
```bash
# Set environment variables using Heroku CLI:
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-secret-key

# Optional (auto-detected):
NODE_ENV=production             # Heroku sets this automatically
PORT=5000                       # Heroku sets this automatically

# For custom domains, set:
heroku config:set CLIENT_URL=https://yourdomain.com
```

### **DigitalOcean App Platform**
```bash
# Required environment variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key

# Optional (auto-detected):
NODE_ENV=production             # DigitalOcean sets this automatically
PORT=8080                       # DigitalOcean sets this automatically

# For custom domains, set:
CLIENT_URL=https://yourdomain.com
```

### **AWS (Elastic Beanstalk / EC2)**
```bash
# Required environment variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key

# Set manually:
NODE_ENV=production
PORT=5000                       # Or your preferred port

# For custom domains, set:
CLIENT_URL=https://yourdomain.com
```

### **Google Cloud Platform (Cloud Run / App Engine)**
```bash
# Required environment variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key

# Optional (auto-detected):
NODE_ENV=production             # GCP sets this automatically
PORT=8080                       # GCP sets this automatically

# For custom domains, set:
CLIENT_URL=https://yourdomain.com
```

### **Custom Domains**
If you're using a custom domain (e.g., `yourdomain.com`), set the `CLIENT_URL` environment variable:

```bash
CLIENT_URL=https://yourdomain.com
```

This ensures CORS allows requests from your custom domain in addition to the platform's default domain.

---

## 📝 For Local Development

If you're running this project locally on your computer:

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```bash
   MONGODB_URI=your_mongodb_connection_string_here
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run the app:**
   ```bash
   npm run dev
   ```

---

## 🔍 How the App Uses Environment Variables

### In the Backend (`server/storage.ts`):
```typescript
const mongoUri = process.env.MONGODB_URI?.trim();

if (mongoUri) {
  // Connect to MongoDB
} else {
  // Use in-memory storage
}
```

### In the Server (`server/index.ts`):
```typescript
const port = parseInt(process.env.PORT || '5000', 10);
server.listen({ port, host: "0.0.0.0" });
```

### In Routes (`server/routes.ts`):
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}
```

### In WebSocket Configuration (`server/websocket.ts`):
```typescript
// Development: Allows localhost and Replit domains
// Production: Strict exact-match allow-list from platform environment variables
const isDevelopment = process.env.NODE_ENV !== 'production';
```

---

## 🔧 Realtime Features Configuration

### **WebSocket Support** ✨
Your app uses **Socket.io** for realtime updates. The configuration is **100% platform-agnostic**:

#### **Transport Fallback**
- Primary: WebSocket (best performance)
- Fallback: HTTP Long-Polling (universal compatibility)
- Automatically adapts based on network conditions

#### **Automatic Reconnection**
- Reconnection attempts: 5
- Reconnection delay: 1-5 seconds
- Works across network interruptions and server restarts

#### **No Additional Configuration Needed**
The realtime features work **out-of-the-box** on:
- ✅ Local development (localhost)
- ✅ Replit
- ✅ Railway, Vercel, Render, Heroku
- ✅ AWS, GCP, Azure
- ✅ Any custom infrastructure
- ✅ Behind load balancers and reverse proxies

---

## ✅ Current Setup Status

Your BookHub app is already configured with:
- ✅ **MONGODB_URI** - Connected to MongoDB Atlas
- ✅ **JWT_SECRET** - Configured for secure authentication
- ✅ **Strict CORS Policy** - Exact-match allow-list prevents CSRF attacks
- ✅ **Smart Platform Detection** - Auto-detects deployment platform origins
- ✅ **Fallback to in-memory storage** if MongoDB is unavailable
- ✅ **Platform-agnostic security headers**

---

## 🛡️ Security Notes

- ✅ Never commit `.env` files to Git (already in `.gitignore`)
- ✅ Never share your MongoDB connection string publicly
- ✅ Use your platform's secret management system for sensitive data
- ✅ The `.env.example` file is safe to commit (no real credentials)
- ✅ In production, all origins must use HTTPS (enforced automatically)
- ✅ CORS allows same-origin by default (frontend + backend on same domain)

---

## 🐛 Troubleshooting

### **WebSocket Connection Issues**

**Problem:** "WebSocket connection failed" or "CORS blocked"
**Solution:**
1. Check that `NODE_ENV` is set correctly (`development` locally, `production` in prod)
2. In production, ensure your app is served over HTTPS
3. Check browser console for specific error messages
4. Verify server logs show: `[WebSocket] ✅ Development/Production mode - allowing origin: ...`

**Problem:** "Polling transport is being used instead of WebSocket"
**Solution:**
- This is normal and works fine! Socket.io automatically upgrades to WebSocket when possible
- Check logs for: `[Socket] ⬆️  Transport upgraded to: websocket`
- If WebSocket is blocked (corporate firewall, etc.), polling works as fallback

### **CORS Errors**

**Problem:** "Access to fetch at '...' from origin '...' has been blocked by CORS"
**Solution:**
1. In development: Make sure `NODE_ENV` is NOT set to `production`
2. In production: Ensure your frontend is served over HTTPS
3. Check server logs for CORS messages
4. If using a custom `CLIENT_URL`, ensure it matches exactly (including protocol)

### **Environment Variable Not Working**

**Problem:** Environment variables not being read
**Solution:**
1. **Local development:** Make sure `.env` file exists in project root
2. **Production:** Set variables in your platform's dashboard (not `.env` file)
3. Restart the application after changing environment variables
4. Check for typos in variable names (case-sensitive)

---

## 🚀 MongoDB Atlas Setup (If you don't have it)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster (Free M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Add to your `.env` file or platform's environment variables as `MONGODB_URI`

---

## 📊 Environment Detection Logs

When your app starts, you'll see logs indicating the detected environment:

```
[Security] ✅ Security middleware configured successfully
[Security] Environment: development
[Security] CORS Policy: Development (localhost + *.replit.dev)

[WebSocket] ✅ Server initialized and ready
```

Or in production:

```
[Security] ✅ Security middleware configured successfully
[Security] Environment: production
[Security] CORS Policy: Production (strict exact-match allow-list)

[WebSocket] ✅ Server initialized and ready
```

These logs help you verify the correct configuration is active.

---

## 🎯 Summary

Your application is now configured for **universal deployment with enterprise-grade security**:

- ✅ Works on **any** cloud platform without modification
- ✅ Realtime features work **100% reliably** across all environments
- ✅ **Enterprise-grade CORS policy** prevents CSRF and session hijacking attacks
- ✅ **Strict exact-match origin enforcement** - no wildcards, no patterns
- ✅ **Same-origin by default** in production with platform auto-detection
- ✅ Automatic HTTPS detection and enforcement in production
- ✅ Smart CORS policy that adapts to the environment
- ✅ Fallback mechanisms for maximum compatibility
- ✅ Comprehensive logging for easy debugging

**You only need to set 2 variables:** `MONGODB_URI` and `JWT_SECRET`. Everything else is automatic! 🎉

**For custom domains:** Additionally set `CLIENT_URL` to your domain.
