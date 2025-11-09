# BookHub Monitoring with Prometheus & Grafana

Complete monitoring solution for BookHub application using Prometheus and Grafana. This setup works **universally** across all environments: local development (Windows, Mac, Linux) and cloud platforms (Render, Railway, Heroku, etc.).

## 📊 What's Included

### Metrics Collected

**HTTP Metrics:**
- Request rate (requests per second)
- Request duration (P50, P95, P99 percentiles)
- Request count by status code
- Request/response size

**Business Metrics:**
- Book operations (create, update, delete)
- Order tracking
- User operations (signup, login, logout)
- Authentication attempts (success/failure)

**WebSocket Metrics:**
- Active connections
- Messages sent/received
- Message types (book:created, book:updated, book:deleted)

**System Metrics:**
- CPU usage
- Memory usage (heap, external)
- Event loop lag
- Garbage collection stats

### Dashboard Panels

The pre-built Grafana dashboard includes:
1. Request Rate gauge
2. P95 Response Time gauge
3. Active WebSocket Connections gauge
4. Memory Usage percentage gauge
5. HTTP Requests by Status Code (time series)
6. Response Time Percentiles by Route (time series)
7. Book Operations Rate (time series)
8. Authentication Attempts (time series)
9. WebSocket Messages (time series)
10. Node.js Memory Usage (time series)
11. Event Loop Lag (time series)

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Docker Desktop** installed and running
  - **Windows**: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
  - **Mac**: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
  - **Linux**: Install Docker Engine and Docker Compose

### Step 1: Start the Monitoring Stack

```bash
# Start Prometheus, Grafana, and your application
docker-compose -f docker-compose.monitoring.yml up -d

# Check if all services are running
docker-compose -f docker-compose.monitoring.yml ps
```

You should see 3 services running:
- `bookhub-app` (port 5000)
- `bookhub-prometheus` (port 9090)
- `bookhub-grafana` (port 3001)

### Step 2: Access Dashboards

**Application:**
- URL: http://localhost:5000
- Test the /metrics endpoint: http://localhost:5000/metrics

**Prometheus:**
- URL: http://localhost:9090
- Go to Status → Targets to verify the BookHub app is being scraped

**Grafana:**
- URL: http://localhost:3001
- **Username**: `admin`
- **Password**: `admin`
- Dashboard: Click "Dashboards" → "BookHub Application Dashboard"

### Step 3: Generate Metrics

Interact with your application to generate metrics:
1. Create/update/delete books in the admin panel
2. Sign up/login as a user
3. Browse books and add to cart
4. Watch the Grafana dashboard update in real-time!

### Step 4: Stop the Stack

```bash
# Stop all services
docker-compose -f docker-compose.monitoring.yml down

# Stop and remove volumes (clears all data)
docker-compose -f docker-compose.monitoring.yml down -v
```

---

## 💻 Local Development Without Docker

If you prefer to run the application locally and only use Docker for Prometheus/Grafana:

### Step 1: Update Prometheus Configuration

Edit `prometheus.yml` and uncomment the local development section:

```yaml
scrape_configs:
  - job_name: 'bookhub-app'
    static_configs:
      # Comment out the Docker target
      # - targets: ['app:5000']
      
      # Uncomment this for local development
      - targets: ['host.docker.internal:5000']
        labels:
          service: 'bookhub'
          environment: 'local'
```

### Step 2: Start Your Application

```bash
# Start the BookHub application locally
npm run dev
```

### Step 3: Start Prometheus & Grafana Only

```bash
# Start only Prometheus and Grafana
docker-compose -f docker-compose.monitoring.yml up prometheus grafana
```

### Step 4: Access Dashboards

- Application: http://localhost:5000
- Metrics: http://localhost:5000/metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

---

## ☁️ Cloud Deployment

### Deploying to Railway, Render, or Similar Platforms

#### Option 1: All-in-One Deployment (Recommended for Small Apps)

Deploy your application with embedded metrics:

1. **Deploy the BookHub application** as normal
2. **Metrics endpoint** will be available at `https://your-app.railway.app/metrics`
3. **Set up cloud Prometheus** to scrape your metrics endpoint:
   - Use Grafana Cloud (free tier available)
   - Use AWS CloudWatch with Prometheus integration
   - Use DigitalOcean Managed Prometheus

**Example: Using Grafana Cloud**

1. Sign up for [Grafana Cloud](https://grafana.com/auth/sign-up/create-user?pg=prod-cloud&plcmt=cloud) (free tier)
2. Get your Prometheus remote write endpoint
3. Update your `prometheus.yml`:

```yaml
remote_write:
  - url: "https://prometheus-xxx.grafana.net/api/prom/push"
    basic_auth:
      username: "your-username"
      password: "your-api-key"

scrape_configs:
  - job_name: 'bookhub-app'
    static_configs:
      - targets: ['your-app.railway.app:443']
        labels:
          service: 'bookhub'
          environment: 'production'
    scheme: https
```

4. Deploy Prometheus separately or use Grafana Cloud's managed Prometheus

#### Option 2: Self-Hosted Monitoring (Recommended for Production)

Deploy Prometheus and Grafana on a separate server:

**Using Railway:**

1. **Deploy BookHub Application**
   ```bash
   # Your application will be available at:
   # https://your-app.railway.app
   ```

2. **Deploy Prometheus & Grafana on Railway**
   - Create a new Railway project for monitoring
   - Deploy using the `docker-compose.monitoring.yml` file
   - Update `prometheus.yml` to scrape your production app

3. **Update Environment Variables**
   - No special configuration needed for BookHub app
   - Metrics are automatically exposed at `/metrics`

**Using Render:**

1. **Deploy BookHub as a Web Service**
   - Build Command: `npm run build`
   - Start Command: `npm run start`

2. **Deploy Prometheus & Grafana**
   - Use Render's Docker support
   - Deploy each service separately or use Docker Compose

**Using DigitalOcean App Platform:**

1. **Deploy BookHub**
   - Select your GitHub repository
   - App Platform will auto-detect Node.js
   - Metrics endpoint: `https://your-app.ondigitalocean.app/metrics`

2. **Deploy Monitoring Stack**
   - Use DigitalOcean Kubernetes for Prometheus & Grafana
   - Or use managed services (DigitalOcean Managed Prometheus)

---

## 🔧 Configuration

### Environment Variables

**BookHub Application:**
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
```

**Prometheus:**
No environment variables needed. Configure via `prometheus.yml`

**Grafana:**
```bash
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=your-secure-password
GF_USERS_ALLOW_SIGN_UP=false
```

### Prometheus Configuration

Edit `prometheus.yml` to customize:

```yaml
global:
  scrape_interval: 15s      # How often to scrape metrics
  evaluation_interval: 15s  # How often to evaluate rules

scrape_configs:
  - job_name: 'bookhub-app'
    scrape_interval: 10s    # Override for this job
    scrape_timeout: 5s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['app:5000']
```

### Custom Metrics

To add your own custom metrics, edit `server/metrics.ts`:

```typescript
import promClient from 'prom-client';
import { register } from './metrics';

// Add a new counter
export const myCustomCounter = new promClient.Counter({
  name: 'my_custom_metric_total',
  help: 'Description of my custom metric',
  labelNames: ['label1', 'label2'],
  registers: [register],
});

// Use it in your code
import { myCustomCounter } from './metrics';
myCustomCounter.inc({ label1: 'value1', label2: 'value2' });
```

Then use it in your routes:

```typescript
app.post('/api/my-endpoint', (req, res) => {
  myCustomCounter.inc({ label1: 'success', label2: 'payment' });
  res.json({ success: true });
});
```

---

## 📈 Using Grafana

### Accessing the Dashboard

1. Open Grafana: http://localhost:3001 (or your cloud URL)
2. Login with admin/admin
3. Navigate to Dashboards → BookHub Application Dashboard

### Understanding the Panels

**Top Row (Gauges):**
- **Request Rate**: Current requests per second
- **P95 Response Time**: 95th percentile response time (95% of requests are faster than this)
- **Active WebSocket Connections**: Number of real-time connections
- **Memory Usage %**: Percentage of allocated memory being used

**Middle Rows (Time Series):**
- **HTTP Requests by Status Code**: See 2xx, 4xx, 5xx trends
- **Response Time Percentiles**: Track latency improvements/degradations
- **Book Operations Rate**: Monitor book create/update/delete activity
- **Authentication Attempts**: Track successful and failed login attempts
- **WebSocket Messages**: Monitor real-time message traffic

**Bottom Rows (System Metrics):**
- **Node.js Memory Usage**: Heap memory, external memory trends
- **Event Loop Lag**: Detect if Node.js event loop is blocked

### Useful PromQL Queries

**Error Rate:**
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m])) * 100
```

**Average Response Time:**
```promql
rate(http_request_duration_seconds_sum[5m]) 
/ 
rate(http_request_duration_seconds_count[5m])
```

**Top 5 Slowest Routes:**
```promql
topk(5, 
  histogram_quantile(0.95, 
    sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
  )
)
```

**Book Operations per Hour:**
```promql
sum(increase(book_operations_total[1h])) by (operation)
```

---

## 🔍 Troubleshooting

### Metrics Endpoint Returns 404

**Problem**: http://localhost:5000/metrics returns 404

**Solutions:**
1. Check if the application started correctly:
   ```bash
   docker-compose -f docker-compose.monitoring.yml logs app
   ```

2. Verify the metrics module is imported:
   ```typescript
   // server/index.ts should have:
   import { metricsMiddleware } from "./metrics";
   app.use(metricsMiddleware);
   ```

3. Check that the /metrics route is registered:
   ```bash
   curl http://localhost:5000/metrics
   ```

### Prometheus Not Scraping App

**Problem**: Prometheus shows target as "DOWN"

**Solutions:**
1. Check Prometheus targets:
   - Open http://localhost:9090/targets
   - Look for the "bookhub-app" target

2. Verify network connectivity:
   ```bash
   # From inside Prometheus container
   docker exec bookhub-prometheus wget -O- http://app:5000/metrics
   ```

3. Check `prometheus.yml` configuration:
   ```yaml
   scrape_configs:
     - job_name: 'bookhub-app'
       static_configs:
         - targets: ['app:5000']  # Must match service name in docker-compose
   ```

4. Restart Prometheus:
   ```bash
   docker-compose -f docker-compose.monitoring.yml restart prometheus
   ```

### Grafana Dashboard Shows "No Data"

**Problem**: Dashboard panels are empty

**Solutions:**
1. **Check Prometheus datasource**:
   - Grafana → Configuration → Data Sources → Prometheus
   - Click "Test" button, should show "Data source is working"
   - URL should be `http://prometheus:9090`

2. **Verify metrics are being collected**:
   - Open Prometheus: http://localhost:9090
   - Try query: `http_requests_total`
   - Should show data

3. **Generate some traffic**:
   - Visit your application at http://localhost:5000
   - Create/update/delete books
   - Wait 15-30 seconds for metrics to appear

4. **Check time range**:
   - Top-right of Grafana dashboard
   - Set to "Last 1 hour" or "Last 5 minutes"

### High Memory Usage

**Problem**: Application using too much memory

**Solutions:**
1. Check memory metrics in Grafana
2. Look for memory leaks in Event Loop Lag panel
3. Adjust Prometheus retention:
   ```yaml
   # prometheus.yml
   storage:
     tsdb:
       retention:
         time: 15d  # Reduce from 30d to save memory
   ```

### Docker Build Fails

**Problem**: `docker-compose up` fails to build

**Solutions:**
1. **Check Docker is running**:
   ```bash
   docker --version
   docker ps
   ```

2. **Clear Docker cache**:
   ```bash
   docker system prune -a
   docker-compose -f docker-compose.monitoring.yml build --no-cache
   ```

3. **Check build logs**:
   ```bash
   docker-compose -f docker-compose.monitoring.yml build
   ```

---

## 🔐 Security Best Practices

### Production Deployment

1. **Restrict /metrics endpoint** to internal network only:

```typescript
// server/routes.ts
app.get("/metrics", (req, res, next) => {
  // Only allow from internal IPs
  const allowedIPs = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
  const clientIP = req.ip;
  
  if (!isIPAllowed(clientIP, allowedIPs)) {
    return res.status(403).send('Forbidden');
  }
  
  return metricsHandler(req, res);
});
```

2. **Use authentication** for Prometheus scraping:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'bookhub-app'
    basic_auth:
      username: 'prometheus'
      password: 'secure-password'
    static_configs:
      - targets: ['your-app.railway.app:443']
```

3. **Secure Grafana**:
   - Change default admin password
   - Disable sign-up
   - Enable HTTPS
   - Use OAuth for authentication

4. **Use secrets management**:
   - Store Grafana password in environment variable
   - Use cloud secret managers (AWS Secrets Manager, Azure Key Vault)

---

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prom-client GitHub](https://github.com/siimon/prom-client)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

---

## 🎉 Next Steps

1. **Customize the dashboard** - Add panels for your specific business metrics
2. **Set up alerts** - Configure Prometheus alerts for critical metrics
3. **Add more metrics** - Track custom application-specific metrics
4. **Deploy to production** - Use Grafana Cloud or deploy your own monitoring stack
5. **Create SLOs** - Define Service Level Objectives for your application

---

## 📝 Changelog

- **v1.0.0** (2025-01-08): Initial monitoring setup
  - Prometheus metrics collection
  - Grafana dashboards
  - Docker Compose configuration
  - Documentation

---

## 💬 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Prometheus targets at http://localhost:9090/targets
3. Check Grafana data source at http://localhost:3001
4. Verify metrics at http://localhost:5000/metrics

**Common Questions:**

**Q: Do I need to install Prometheus/Grafana on my machine?**
A: No! Docker handles everything. Just install Docker Desktop.

**Q: Can I use this on Windows?**
A: Yes! Docker Desktop works on Windows, Mac, and Linux.

**Q: Will this work on Render/Railway/Heroku?**
A: Yes! The metrics endpoint (`/metrics`) works everywhere. You can use cloud Prometheus services to scrape it.

**Q: How much does this cost?**
A: The solution is free and open-source. Cloud services may have costs.

**Q: Can I customize the dashboard?**
A: Yes! Edit `grafana/provisioning/dashboards/bookhub-dashboard.json` or create new dashboards in the Grafana UI.
