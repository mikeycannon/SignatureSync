#!/bin/bash
# VPS Setup Script for Email Signature Platform
# Run this on a fresh Ubuntu 22.04 server

set -e

echo "🚀 Setting up Email Signature Platform on VPS..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
echo "📁 Creating application directory..."
mkdir -p ~/signature-app
cd ~/signature-app

# Clone repository (replace with your repo URL)
echo "📥 Cloning repository..."
echo "Please run: git clone https://github.com/yourusername/your-repo.git ."
echo "Then edit .env.production with your settings"

# Create production environment file
cat > .env.production << 'EOF'
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://postgres:your-secure-password@postgres:5432/signature_app
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secure-jwt-secret-change-this
ALLOWED_ORIGINS=https://yourdomain.com

# Database credentials
POSTGRES_DB=signature_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# SSL and Security
SSL_REDIRECT=true
SECURE_COOKIES=true
EOF

# Create production docker-compose file
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped

  app:
    build: .
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=${NODE_ENV}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(\`yourdomain.com\`)"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"

  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@domain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "letsencrypt:/letsencrypt"
    networks:
      - app-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  letsencrypt:

networks:
  app-network:
    driver: bridge
EOF

# Create startup script
cat > start.sh << 'EOF'
#!/bin/bash
# Start the application
docker-compose -f docker-compose.production.yml --env-file .env.production up -d
EOF

chmod +x start.sh

# Install Nginx (alternative to Traefik)
echo "🌐 Installing Nginx..."
sudo apt install nginx certbot python3-certbot-nginx -y

# Create basic Nginx config
sudo tee /etc/nginx/sites-available/signature-app << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.production with your settings"
echo "2. Replace yourdomain.com with your actual domain"
echo "3. Run: sudo nginx -t && sudo systemctl reload nginx"
echo "4. Setup SSL: sudo certbot --nginx -d yourdomain.com"
echo "5. Start app: ./start.sh"
echo ""
echo "Estimated monthly cost: $6-12 depending on VPS provider"