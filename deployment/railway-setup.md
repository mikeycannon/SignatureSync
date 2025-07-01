# Railway Deployment - Step by Step

## Quick Setup Guide

### 1. Push Your Code to GitHub
First, make sure your code is in a GitHub repository:

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Login" → "GitHub" 
3. Authorize Railway to access your repositories

### 3. Deploy Your App
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your email signature repository
4. Railway will automatically detect Node.js and start building

### 4. Add Database Services
**Add PostgreSQL:**
1. In your project dashboard, click "New Service"
2. Select "Database" → "Add PostgreSQL"
3. Railway automatically creates `DATABASE_URL` environment variable

**Add Redis:**
1. Click "New Service" again
2. Select "Database" → "Add Redis"  
3. Railway automatically creates `REDIS_URL` environment variable

### 5. Configure Environment Variables
In your app service settings → Variables tab, add:

```
JWT_SECRET=your-super-secure-random-string-here
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app-name.up.railway.app
```

**Generate JWT Secret:**
```bash
# Run this to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. Custom Domain (Optional)
1. In your app service → Settings → Domains
2. Click "Custom Domain"
3. Enter your domain (e.g., signatures.yourdomain.com)
4. Update your DNS with the provided CNAME record
5. Update `ALLOWED_ORIGINS` to include your custom domain

## Your App URLs
- **App**: `https://your-app-name.up.railway.app`
- **Health Check**: `https://your-app-name.up.railway.app/api/health`
- **Login**: Use admin@acme.com / password (demo credentials)

## Cost Monitoring
- View usage in Railway dashboard → Usage tab
- Set up billing alerts in Account Settings
- Estimated monthly cost: $13 (app + PostgreSQL + Redis)

## Troubleshooting

**Build Fails:**
- Check the build logs in Railway dashboard
- Ensure package.json has correct build/start scripts
- Verify Node.js version compatibility

**Database Connection Issues:**
- Wait for PostgreSQL service to be fully provisioned
- Check DATABASE_URL format in environment variables
- Verify network connectivity between services

**Environment Variables:**
- Railway auto-injects database URLs
- Custom variables need to be added manually
- Restart deployment after adding new variables

## Monitoring & Logs
- **Logs**: Railway dashboard → your service → Logs tab
- **Metrics**: View CPU, memory, and network usage
- **Health**: Automatic health checks via `/api/health`
- **Alerts**: Configure in Railway dashboard settings

## Next Steps After Deployment
1. Test all functionality with demo account
2. Set up custom domain if needed
3. Invite team members to test
4. Monitor usage and performance
5. Plan scaling strategy as you grow

Railway handles SSL, backups, and scaling automatically!