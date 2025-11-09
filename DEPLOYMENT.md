# BookHub All-in-One Deployment Guide

This guide explains how to build and deploy the complete BookHub application with monitoring in a **single Docker container**.

## 🚀 Quick Start

### Build the All-in-One Image

```bash
docker build -f Dockerfile.all-in-one -t bookhub:all-in-one .
```

### Run Locally

```bash
docker run -d \
  --name bookhub \
  -p 5000:5000 \
  -p 9090:9090 \
  -p 3001:3001 \
  -e MONGODB_URI="mongodb://your-mongodb-uri" \
  -e JWT_SECRET="your-secret-key" \
  -e GF_SECURITY_ADMIN_PASSWORD="your-grafana-password" \
  bookhub:all-in-one
```

### Access Your Services

- **Application**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (username: `admin`, password: see below)

**Grafana Password:**
- If you set `GF_SECURITY_ADMIN_PASSWORD`, use that value
- If not set, a secure random password is generated on first start
- Check container logs to find the generated password: `docker logs bookhub`
- Look for: "⚠️ WARNING: No Grafana password set. Generated random password: ..."

---

## 📦 What's Included

The all-in-one container includes:

✅ **Frontend** - React application with Vite
✅ **Backend API** - Express.js REST API
✅ **Admin Panel** - Full admin dashboard
✅ **API Documentation** - Interactive Swagger UI
✅ **Prometheus** - Metrics collection and storage
✅ **Grafana** - Pre-configured dashboards
✅ **WebSocket** - Real-time updates
✅ **MongoDB** - Configurable database connection

---

## 🔧 Configuration

### Required Environment Variables

```bash
# Database (Required)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/bookhub

# Security (Required)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Grafana Admin (Optional - generates secure random password if not set)
# If not set, check container logs for the generated password
GF_SECURITY_ADMIN_PASSWORD=your-grafana-password
```

### Optional Environment Variables

```bash
# Application
NODE_ENV=production  # Already set in Dockerfile
PORT=5000           # Already set in Dockerfile

# Grafana
GF_SERVER_HTTP_PORT=3001
GF_USERS_ALLOW_SIGN_UP=false
```

---

## 🌐 Deployment Options

### Option 1: Docker Hub (Recommended)

#### Step 1: Build and Tag

```bash
# Build the image
docker build -f Dockerfile.all-in-one -t your-dockerhub-username/bookhub:latest .

# Tag for Docker Hub
docker tag your-dockerhub-username/bookhub:latest your-dockerhub-username/bookhub:v1.0.0
```

#### Step 2: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push the image
docker push your-dockerhub-username/bookhub:latest
docker push your-dockerhub-username/bookhub:v1.0.0
```

#### Step 3: Deploy Anywhere

Now anyone can pull and run your image:

```bash
docker pull your-dockerhub-username/bookhub:latest

docker run -d \
  --name bookhub \
  -p 5000:5000 \
  -p 9090:9090 \
  -p 3001:3001 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-secret" \
  -e GF_SECURITY_ADMIN_PASSWORD="grafana-password" \
  your-dockerhub-username/bookhub:latest
```

---

### Option 2: Railway

Railway supports Docker deployments with ease.

#### Step 1: Create `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.all-in-one"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Step 2: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables in Railway dashboard:
# - MONGODB_URI
# - JWT_SECRET
# - GF_SECURITY_ADMIN_PASSWORD

# Deploy
railway up
```

#### Step 3: Expose Ports

In Railway dashboard:
- Go to your service
- Click "Settings"
- Add port exposure for 5000 (public), 9090, 3001

---

### Option 3: Render

#### Step 1: Create `render.yaml`

```yaml
services:
  - type: web
    name: bookhub
    env: docker
    dockerfilePath: ./Dockerfile.all-in-one
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: GF_SECURITY_ADMIN_PASSWORD
        generateValue: true
      - key: NODE_ENV
        value: production
    disk:
      name: bookhub-data
      mountPath: /var/lib/grafana
      sizeGB: 10
```

#### Step 2: Deploy

1. Push code to GitHub
2. Connect repository to Render
3. Render will automatically detect `render.yaml`
4. Add your MONGODB_URI in the environment variables
5. Deploy!

---

### Option 4: DigitalOcean App Platform

#### Step 1: Create `.do/app.yaml`

```yaml
name: bookhub
services:
- name: bookhub
  dockerfile_path: Dockerfile.all-in-one
  github:
    branch: main
    deploy_on_push: true
    repo: your-username/bookhub
  http_port: 5000
  instance_count: 1
  instance_size_slug: basic-xs
  routes:
  - path: /
  envs:
  - key: MONGODB_URI
    scope: RUN_TIME
    type: SECRET
  - key: JWT_SECRET
    scope: RUN_TIME
    type: SECRET
  - key: GF_SECURITY_ADMIN_PASSWORD
    scope: RUN_TIME
    type: SECRET
```

#### Step 2: Deploy

```bash
# Install doctl
brew install doctl  # or download from DigitalOcean

# Authenticate
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml
```

---

### Option 5: AWS ECS/Fargate

#### Step 1: Push to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name bookhub

# Get login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag bookhub:all-in-one your-account-id.dkr.ecr.us-east-1.amazonaws.com/bookhub:latest

# Push
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/bookhub:latest
```

#### Step 2: Create ECS Task Definition

Create `task-definition.json`:

```json
{
  "family": "bookhub",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "bookhub",
      "image": "your-account-id.dkr.ecr.us-east-1.amazonaws.com/bookhub:latest",
      "portMappings": [
        {"containerPort": 5000, "protocol": "tcp"},
        {"containerPort": 9090, "protocol": "tcp"},
        {"containerPort": 3001, "protocol": "tcp"}
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "MONGODB_URI", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "GF_SECURITY_ADMIN_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bookhub",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 3: Create Service

```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name bookhub \
  --task-definition bookhub \
  --desired-count 1 \
  --launch-type FARGATE
```

---

### Option 6: Heroku

**Note**: Heroku doesn't support exposing multiple ports easily. For Heroku, consider using the separate deployment option (app only).

If you still want to try:

```bash
# Login to Heroku
heroku login

# Login to Heroku Container Registry
heroku container:login

# Create app
heroku create your-bookhub-app

# Set environment variables
heroku config:set MONGODB_URI="your-mongodb-uri" -a your-bookhub-app
heroku config:set JWT_SECRET="your-secret" -a your-bookhub-app
heroku config:set GF_SECURITY_ADMIN_PASSWORD="grafana-password" -a your-bookhub-app

# Build and push
heroku container:push web -a your-bookhub-app -f Dockerfile.all-in-one

# Release
heroku container:release web -a your-bookhub-app

# Open
heroku open -a your-bookhub-app
```

---

## 🔒 Security Best Practices

### 1. Use Strong Secrets

```bash
# Generate a strong JWT secret
openssl rand -base64 32

# Generate a strong Grafana password
openssl rand -base64 16
```

### 2. Restrict Access

Use firewall rules or security groups to restrict access to Prometheus and Grafana ports:

```bash
# Only expose application port publicly
# Keep 9090 and 3001 internal or behind VPN
```

### 3. Enable HTTPS

Use a reverse proxy (Nginx/Traefik) or cloud load balancer:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /grafana/ {
        proxy_pass http://localhost:3001/;
    }

    location /prometheus/ {
        proxy_pass http://localhost:9090/;
    }
}
```

### 4. Use Environment-Specific Configurations

```bash
# Production
docker run -e NODE_ENV=production ...

# Staging
docker run -e NODE_ENV=staging -e MONGODB_URI="staging-db-uri" ...
```

---

## 📊 Monitoring Access

After deployment, access your monitoring dashboards:

### Prometheus

- URL: `http://your-domain:9090`
- Use for: Raw metrics, custom queries, debugging

Example queries:
```promql
# Request rate
rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])
```

### Grafana

- URL: `http://your-domain:3001`
- Username: `admin`
- Password: Value of `GF_SECURITY_ADMIN_PASSWORD`

Pre-installed dashboard: "BookHub Application Dashboard"

---

## 🗄️ Database Setup

The application works with **any MongoDB instance**. Users can connect to:

### MongoDB Atlas (Cloud)

```bash
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/bookhub?retryWrites=true&w=majority"
```

### Self-Hosted MongoDB

```bash
MONGODB_URI="mongodb://localhost:27017/bookhub"
```

### MongoDB Docker Container

```bash
# Start MongoDB
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Connect BookHub
MONGODB_URI="mongodb://admin:password@host.docker.internal:27017/bookhub?authSource=admin"
```

### Schema Auto-Initialization

The application automatically creates all necessary collections and indexes on first run:

- ✅ Users collection (with unique username index)
- ✅ Books collection (with title and author indexes)
- ✅ Orders collection (with user reference index)
- ✅ All required indexes for performance

**No manual database setup required!**

---

## 🧪 Testing the Deployment

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "database": "connected"
}
```

### Metrics Check

```bash
curl http://localhost:5000/metrics
```

Expected: Prometheus metrics in text format

### API Documentation

Visit: http://localhost:5000/api/docs

### Monitoring Check

- Prometheus: http://localhost:9090/targets (should show "UP")
- Grafana: http://localhost:3001 (login and check dashboard)

---

## 📈 Scaling Considerations

### When to Use All-in-One Container

✅ **Good for:**
- Development environments
- Small deployments (<1000 users)
- Quick prototypes
- Single-server deployments
- Learning/testing

❌ **Not recommended for:**
- Production at scale
- High-traffic applications
- Microservices architecture
- Multi-region deployments

### Alternative: Separate Containers

For production, consider using `docker-compose.monitoring.yml`:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

This provides:
- Better resource isolation
- Independent scaling
- Easier troubleshooting
- Standard Docker practices

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs bookhub

# Check if all processes started
docker exec bookhub ps aux
```

### Can't connect to MongoDB

```bash
# Test MongoDB connection from container
docker exec bookhub sh -c 'echo "MONGODB_URI=$MONGODB_URI"'

# Test DNS resolution
docker exec bookhub ping -c 3 cluster.mongodb.net
```

### Grafana dashboard not showing data

1. Check Prometheus targets: http://localhost:9090/targets
2. Ensure application is receiving traffic
3. Wait 15-30 seconds for metrics to appear
4. Check Grafana datasource: Configuration → Data Sources → Prometheus → Test

### High memory usage

The all-in-one container uses approximately:
- Node.js app: 200-400 MB
- Prometheus: 100-300 MB
- Grafana: 100-200 MB
- **Total**: ~500-900 MB

Adjust container resources:
```bash
docker run --memory="1g" --cpus="1.0" ...
```

---

## 📝 Image Size

The all-in-one image is approximately **800 MB - 1.2 GB** due to:
- Node.js runtime
- Prometheus binary
- Grafana binary
- Application code

To reduce size (trade-off: need separate containers):
- Use the standard `Dockerfile` (~200 MB)
- Deploy Prometheus/Grafana separately

---

## 🎯 Summary

You now have a **complete, production-ready BookHub deployment** in a single Docker container!

### One Command to Rule Them All

```bash
docker run -d \
  --name bookhub \
  -p 5000:5000 \
  -p 9090:9090 \
  -p 3001:3001 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-secret" \
  -e GF_SECURITY_ADMIN_PASSWORD="admin123" \
  --restart unless-stopped \
  your-dockerhub-username/bookhub:latest
```

That's it! Your entire application with monitoring is running. 🚀

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [MONITORING.md](./MONITORING.md) - Detailed monitoring guide

---

## 🆘 Need Help?

If you encounter issues:

1. Check the logs: `docker logs bookhub`
2. Verify environment variables: `docker exec bookhub env`
3. Test health endpoint: `curl http://localhost:5000/health`
4. Review this documentation
5. Check individual service logs in supervisord output
