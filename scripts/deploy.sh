#!/bin/bash
# Deployment script for Field Verify Dashboard
# Run on a fresh Ubuntu 22.04+ VPS

set -e

echo "=== Field Verify Dashboard — Server Setup ==="

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs build-essential nginx certbot python3-certbot-nginx

# Install PM2
npm install -g pm2

# Create app directory
mkdir -p /var/www/field-verify-dashboard
cd /var/www/field-verify-dashboard

# Clone repo
git clone https://github.com/anirudhatalmale6-alt/field-verify-dashboard.git .

# Install dependencies
npm install --production=false

# Create data directory
mkdir -p data public/uploads

# Build the app
npm run build

# Seed sample data (optional)
node scripts/seed-sample-data.js 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "=== App running on port 3000 ==="
echo "Now set up Nginx reverse proxy..."
echo ""

# Nginx config
DOMAIN=${1:-kospl.in}
cat > /etc/nginx/sites-available/field-verify << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 50M;
    }
}
EOF

ln -sf /etc/nginx/sites-available/field-verify /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "=== Nginx configured for ${DOMAIN} ==="
echo ""
echo "Next steps:"
echo "1. Point ${DOMAIN} DNS A record to this server's IP"
echo "2. Run: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "3. Visit https://${DOMAIN}"
echo ""
echo "Admin login: admin@koteshwari.com / admin123"
echo "Executive login: avinash@koteshwari.com / exec123"
