#!/bin/bash
set -e

echo "======================================"
echo "BookHub All-in-One Container Starting"
echo "======================================"

# Display environment information
echo ""
echo "Environment Configuration:"
echo "  NODE_ENV: ${NODE_ENV:-production}"
echo "  PORT: ${PORT:-5000}"
echo "  MONGODB_URI: ${MONGODB_URI:-(not set - will use default)}"
echo ""

# Generate a random password if none is provided
if [ -z "$GF_SECURITY_ADMIN_PASSWORD" ]; then
    export GF_SECURITY_ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-16)
    echo "⚠️  WARNING: No Grafana password set. Generated random password: ${GF_SECURITY_ADMIN_PASSWORD}"
    echo "   Save this password! You won't see it again."
fi

# Create Grafana configuration if it doesn't exist
if [ ! -f /etc/grafana/grafana.ini ]; then
    echo "Creating Grafana configuration..."
    cat > /etc/grafana/grafana.ini <<EOF
[paths]
data = /var/lib/grafana
logs = /var/log/grafana
plugins = /var/lib/grafana/plugins
provisioning = /etc/grafana/provisioning

[server]
http_port = 3001

[security]
admin_user = admin
admin_password = ${GF_SECURITY_ADMIN_PASSWORD}

[users]
allow_sign_up = false

[auth.anonymous]
enabled = false

[dashboards]
versions_to_keep = 20
min_refresh_interval = 5s
default_home_dashboard_path = /var/lib/grafana/dashboards/bookhub-dashboard.json
EOF
fi

# Create directories for Prometheus data
mkdir -p /opt/prometheus/data

# Create directories for Grafana
mkdir -p /var/lib/grafana /var/log/grafana

echo ""
echo "Services will be available at:"
echo "  📚 BookHub Application: http://localhost:5000"
echo "  📊 Prometheus: http://localhost:9090"
echo "  📈 Grafana: http://localhost:3001 (admin/${GF_SECURITY_ADMIN_PASSWORD})"
echo "  📄 API Docs: http://localhost:5000/api/docs"
echo "  ❤️  Health Check: http://localhost:5000/health"
echo "  📊 Metrics: http://localhost:5000/metrics"
echo ""
echo "Starting services with supervisord..."
echo ""

# Execute the command passed to the script
exec "$@"
