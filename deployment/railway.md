# Railway Deployment Guide

Railway provides the easiest deployment with managed services.

## Prerequisites
- GitHub account with your code repository
- Railway account (free signup)

## Step-by-Step Setup

### 1. Prepare Your Repository
```bash
# Ensure these files are in your repo root:
- package.json
- Dockerfile (production)
- railway.toml (configuration)
```

### 2. Deploy to Railway
1. Go to railway.app and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and starts building

### 3. Add Database Services
1. In your Railway project dashboard
2. Click "Add Service" → "Database" → "PostgreSQL"
3. Click "Add Service" → "Database" → "Redis"
4. Railway automatically provides connection URLs

### 4. Configure Environment Variables
Railway auto-sets these variables:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection

Add these manually in Railway dashboard:
- `JWT_SECRET` - Random secure string
- `NODE_ENV` - "production"
- `ALLOWED_ORIGINS` - Your domain (e.g., "https://yourapp.up.railway.app")

### 5. Custom Domain (Optional)
1. In Railway dashboard → Settings → Domains
2. Add your custom domain
3. Railway provides SSL automatically

## Estimated Costs
- **Starter Plan**: $5/month per service
- **PostgreSQL**: $5/month (1GB storage)
- **Redis**: $3/month (25MB)
- **Total**: ~$13/month

## Scaling
Railway automatically handles:
- SSL certificates
- Health checks
- Auto-restarts
- Traffic routing
- Backup management

## Support
- Railway Discord community
- Excellent documentation
- Built-in monitoring tools