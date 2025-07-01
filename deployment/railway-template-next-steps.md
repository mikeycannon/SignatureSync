# Railway Template - Next Steps

## What You Should See Now

After creating the Railway project with Node.js template:
1. Your app should be building/deploying automatically
2. You'll get a URL like: `https://your-project-name.up.railway.app`
3. The build should complete successfully (no more exit code 127)

## Step 1: Configure Environment Variables

In your Railway dashboard → Your App → Variables tab, add:

```
JWT_SECRET=2013713077a8cbeabd3cce1adb5f9e4f5b8d6f735e8cb4414e4a8a50c787f9346335b45a51cdb6ab736d5c096582bbc3fe1dbeafa5a671fd967a695aa0cb7552
NODE_ENV=production
ALLOWED_ORIGINS=https://your-actual-railway-url.up.railway.app
```

**Important**: Replace `your-actual-railway-url` with your real Railway URL.

## Step 2: Add Database Services

Now you should see the "Add Service" or "+" button in Railway:

**Add PostgreSQL:**
1. Click "New" → "Database" → "PostgreSQL"
2. Choose "Hobby" plan ($5/month)
3. Railway auto-creates `DATABASE_URL`

**Add Redis:**
1. Click "New" → "Database" → "Redis"
2. Choose "Hobby" plan ($3/month)  
3. Railway auto-creates `REDIS_URL`

## Step 3: Test Your Deployment

Once everything is deployed:

1. **Visit your app URL**
2. **Test health check**: `https://your-url/api/health`
3. **Try logging in**: admin@acme.com / password

## Step 4: Verify Database Connection

Your app will automatically connect to the databases once Railway provides the environment variables. No additional configuration needed.

## Troubleshooting

**If build still fails:**
- Check the deployment logs in Railway
- Ensure your GitHub repo has the latest code
- Trigger a manual redeploy

**If app starts but databases don't work:**
- Wait a few minutes for PostgreSQL to fully initialize
- Check that DATABASE_URL and REDIS_URL appear in your Variables tab
- Redeploy after databases are ready

**If you can't find "Add Service":**
- Look for "New" button in top-right
- Try clicking "Services" tab
- Contact Railway support via chat widget

## Success Indicators

✅ App builds without errors
✅ Health check returns {"status":"ok"}  
✅ Login page loads properly
✅ Can log in with demo credentials
✅ Dashboard shows stats (even if zero)

Once all databases are connected, your total cost will be ~$13/month and your email signature platform will be fully operational.