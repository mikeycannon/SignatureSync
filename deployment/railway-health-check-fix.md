# Railway Health Check Fix - App Not Starting

## Problem
Your app builds successfully but health checks fail because the app isn't starting properly.

## Required Environment Variables

In Railway dashboard → Your App → Variables, add these **immediately**:

### Required Variables:
```
NODE_ENV=production
JWT_SECRET=2013713077a8cbeabd3cce1adb5f9e4f5b8d6f735e8cb4414e4a8a50c787f9346335b45a51cdb6ab736d5c096582bbc3fe1dbeafa5a671fd967a695aa0cb7552
PORT=5000
ALLOWED_ORIGINS=https://your-railway-url.up.railway.app
```

### Database Variables (Add Later):
```
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
```

## Immediate Fix Steps

**Step 1: Add Environment Variables**
1. Go to Railway → Your App → Variables tab
2. Add the required variables above
3. Replace "your-railway-url" with your actual Railway URL

**Step 2: Redeploy**
1. Click "Deploy" → "Redeploy"
2. Wait for build to complete
3. Health check should now pass

**Step 3: Check Deployment Logs**
In Railway → Deployments → Latest deployment → View Logs
Look for:
- "serving on port 5000" message
- Any error messages during startup
- Database connection attempts

## Why Health Check Failed

The app couldn't start because:
1. Missing JWT_SECRET (required for authentication)
2. Missing PORT environment variable
3. Missing ALLOWED_ORIGINS (CORS configuration)

## Success Indicators

After adding variables and redeploying:
✅ Health check passes (no more "service unavailable")
✅ App shows "Healthy" status in Railway
✅ URL loads your login page
✅ /api/health endpoint returns {"status":"ok"}

## Next Steps After Health Check Passes

1. Test login page loads
2. Add PostgreSQL database service
3. Add Redis database service
4. Test full functionality

The build is working perfectly - we just needed the runtime environment variables!