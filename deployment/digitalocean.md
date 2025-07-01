# DigitalOcean App Platform Deployment

Deploy your email signature platform on DigitalOcean App Platform for $12-20/month.

## Prerequisites
- DigitalOcean account
- GitHub repository with your code
- Credit card for billing

## Step-by-Step Deployment

### 1. Create App on DigitalOcean
1. Go to DigitalOcean console → Apps
2. Click "Create App"
3. Choose "GitHub" as source
4. Connect your repository
5. Select the main branch

### 2. Configure Build Settings
DigitalOcean will auto-detect Node.js. Verify these settings:
- **Build Command**: `npm run build`
- **Run Command**: `npm run start`
- **Environment**: Node.js 20.x
- **HTTP Port**: 5000

### 3. Add Database Services
In your app dashboard:

**PostgreSQL Database:**
1. Click "Add Component" → "Database"
2. Choose "PostgreSQL" → Basic plan ($7/month)
3. Database name: `signature-app`
4. DigitalOcean auto-creates `DATABASE_URL`

**Redis Database:**
1. Click "Add Component" → "Database"  
2. Choose "Redis" → Basic plan ($5/month)
3. Database name: `signature-redis`
4. DigitalOcean auto-creates `REDIS_URL`

### 4. Set Environment Variables
In App Settings → Environment Variables, add:

```
NODE_ENV=production
JWT_SECRET=your-super-secure-random-string-here
ALLOWED_ORIGINS=https://your-app-name.ondigitalocean.app
```

### 5. Deploy
1. Click "Save" to trigger first deployment
2. Wait 5-10 minutes for build and deployment
3. Your app will be available at: `https://your-app-name.ondigitalocean.app`

## Cost Breakdown
- **App (Basic)**: $5/month
- **PostgreSQL**: $7/month (10GB storage, 1GB RAM)
- **Redis**: $5/month (25MB memory)
- **Total**: $17/month

## Custom Domain (Optional)
1. In App Settings → Domains
2. Add your domain (e.g., signatures.yourdomain.com)
3. Update DNS with provided CNAME
4. DigitalOcean handles SSL automatically

## Scaling Options
- **Professional**: $12/month per app (auto-scaling)
- **Database scaling**: Increase storage/memory as needed
- **Multiple regions**: Deploy in different data centers

## Monitoring & Logs
- Built-in monitoring dashboard
- Real-time logs and metrics
- Automatic health checks
- Email alerts for issues

## Backup & Security
- Automatic database backups
- SSL certificates included
- DDoS protection
- SOC 2 compliance

This setup gives you a production-ready platform with minimal management overhead.