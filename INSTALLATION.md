# 🚀 Installation Guide - All Platforms

This guide provides step-by-step installation instructions for BookHub across different platforms and operating systems.

## 📋 Table of Contents

- [Windows Installation](#windows-installation)
- [macOS Installation](#macos-installation)
- [Linux Installation](#linux-installation)
- [Replit Installation](#replit-installation)
- [Docker Installation](#docker-installation-optional)
- [Production Deployment](#production-deployment)

---

## Windows Installation

### Prerequisites
1. Download and install [Node.js 18+](https://nodejs.org/)
2. Download and install [Git](https://git-scm.com/download/win)

### Installation Steps

1. **Clone the repository**
   ```cmd
   git clone <your-repo-url>
   cd bookhub
   ```

2. **Install dependencies**
   ```cmd
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example file:
   ```cmd
   copy .env.example .env
   ```
   
   Edit `.env` in Notepad and add:
   ```env
   JWT_SECRET=your-secret-key-here
   ```
   
   (MongoDB is optional - app works with in-memory storage)

4. **Start the development server**

   **Option A - PowerShell (Recommended)**:
   ```powershell
   $env:NODE_ENV="development"; npm run dev
   ```

   **Option B - Command Prompt**:
   ```cmd
   set NODE_ENV=development && npm run dev
   ```

   **Option C - Using cross-env (works everywhere)**:
   ```cmd
   npm install -g cross-env
   cross-env NODE_ENV=development tsx server/index.ts
   ```

5. **Access the application**
   
   Open your browser to: `http://localhost:5000`

### Windows Troubleshooting

**Port already in use:**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Permission errors:**
- Run Command Prompt or PowerShell as Administrator

---

## macOS Installation

### Prerequisites
1. Install [Homebrew](https://brew.sh/)
2. Install Node.js:
   ```bash
   brew install node
   ```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bookhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   nano .env  # or use your preferred editor
   ```
   
   Add at minimum:
   ```env
   JWT_SECRET=your-secret-key-here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   
   Open: `http://localhost:5000`

### macOS Troubleshooting

**Port already in use:**
```bash
lsof -i :5000
kill -9 <PID>
```

---

## Linux Installation

### Prerequisites (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bookhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   nano .env  # or vim, emacs, etc.
   ```
   
   Add:
   ```env
   JWT_SECRET=your-secret-key-here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   
   Open: `http://localhost:5000`

### Linux Troubleshooting

**Port already in use:**
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

**Permission issues:**
```bash
sudo chown -R $USER:$USER .
```

---

## Replit Installation

### Quick Start

1. **Import to Replit**
   - Go to [Replit](https://replit.com/)
   - Click "Create Repl"
   - Select "Import from GitHub"
   - Paste your repository URL

2. **Set Environment Variables**
   - Click on "Secrets" (lock icon) in left sidebar
   - Add secret:
     - Key: `JWT_SECRET`
     - Value: `your-secret-key`
   
   - Optionally add for persistence:
     - Key: `MONGODB_URI`
     - Value: `your-mongodb-connection-string`

3. **Run the Application**
   - Click the "Run" button
   - Replit auto-detects everything!

4. **Access the Application**
   - Click the "Open in new tab" button
   - Or use the provided `.replit.dev` URL

### Replit Notes

✅ **Auto-configured**:
- Server URL (via `REPLIT_DEV_DOMAIN`)
- CORS settings
- Port configuration
- Environment detection

❌ **Not required**:
- `NODE_ENV` (auto-set)
- `PORT` (auto-set)
- `API_BASE_URL` (auto-detected)

---

## Docker Installation (Optional)

If you prefer using Docker:

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  bookhub:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
      - MONGODB_URI=mongodb://mongo:27017/bookhub
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### Run with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Production Deployment

### Railway.app

1. **Connect Repository**
   - Go to [Railway.app](https://railway.app/)
   - Click "New Project" → "Deploy from GitHub repo"

2. **Set Environment Variables**
   ```
   NODE_ENV=production
   JWT_SECRET=super-secure-production-key
   MONGODB_URI=mongodb+srv://...
   PRODUCTION_URL=https://your-app.railway.app
   ```

3. **Deploy**
   - Railway auto-builds and deploys
   - Domain is auto-assigned or use custom domain

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables
vercel env add JWT_SECRET production
vercel env add MONGODB_URI production
```

### Render

1. **Create New Web Service**
   - Connect GitHub repository
   - Build Command: `npm run build`
   - Start Command: `npm start`

2. **Add Environment Variables**
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your-secret`
   - `MONGODB_URI`: `your-mongodb-uri`

### Heroku

```bash
# Install Heroku CLI
# Then:

heroku create bookhub-app
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-mongodb-uri
git push heroku main
```

---

## 🧪 Verify Installation

After installation on any platform, verify it works:

1. **Check server is running**
   - You should see: `serving on port 5000`

2. **Access the application**
   - Open browser to the appropriate URL
   - You should see the BookHub homepage

3. **Test authentication**
   - Click "Sign Up"
   - Create a test account
   - You should be able to login

4. **Check API docs**
   - Visit `/api/docs`
   - Interactive Swagger documentation should load

---

## 📞 Need Help?

- Check [README.md](./README.md) for general information
- Review [ENV_SETUP.md](./ENV_SETUP.md) for environment variables
- See [Troubleshooting](#troubleshooting) sections above
- Open an issue on GitHub

---

**Success!** You should now have BookHub running on your chosen platform. 🎉
