# Railway Deployment Troubleshooting

## Fix for "npm: command not found" Error (Exit Code 127)

This error occurs when Railway doesn't detect Node.js properly. Here are the fixes:

### Solution 1: Push Updated Configuration Files

I've added these files to fix the Node.js detection:
- `.nvmrc` - Specifies Node.js version 20
- `nixpacks.toml` - Explicit build configuration
- Updated `railway.toml` - Added Node.js version specification

**Steps:**
1. Push these new files to your GitHub repository
2. In Railway, trigger a new deployment:
   - Go to your app service
   - Click "Deploy" → "Redeploy"
   - Or push a new commit to trigger auto-deploy

### Solution 2: Manual Railway Configuration

In your Railway dashboard:

1. **Go to your app service → Settings → Environment**
2. **Add these variables:**
   ```
   NIXPACKS_NODE_VERSION = 20
   NODE_ENV = production
   ```

3. **Go to Settings → Build**
4. **Set Build Command:** `npm ci && npm run build`
5. **Set Start Command:** `npm run start`

### Solution 3: Alternative Dockerfile Method

If nixpacks still fails, force Railway to use Docker:

1. **Rename the production Dockerfile:**
   ```bash
   # In your repo, rename Dockerfile to Dockerfile.railway
   mv Dockerfile Dockerfile.railway
   ```

2. **Create a simpler Dockerfile for Railway:**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 5000
   CMD ["npm", "run", "start"]
   ```

3. **Push to GitHub and redeploy**

### Solution 4: Check Build Logs

In Railway dashboard:
1. Go to your app service
2. Click on "Deployments" tab
3. Click on the failed deployment
4. Check the full build log for specific errors

Common issues:
- Missing dependencies in package.json
- TypeScript compilation errors
- Environment variable issues

### Solution 5: Start Fresh (If Nothing Works)

1. **Delete the current Railway service**
2. **Create new project with these settings:**
   - Choose "Deploy from GitHub repo"
   - Select your repository
   - In advanced settings, set:
     - Build Command: `npm run build`
     - Start Command: `npm run start`
     - Node.js Version: 20

## Verification Steps

Once deployment succeeds:
1. Check your app URL: `https://your-app.up.railway.app`
2. Test health endpoint: `https://your-app.up.railway.app/api/health`
3. Try logging in with: admin@acme.com / password

## Adding Database Services

After your app deploys successfully:
1. In Railway dashboard, look for "Add Service" or "+" button
2. Add PostgreSQL (Hobby plan - $5/month)
3. Add Redis (Hobby plan - $3/month)
4. Railway will automatically inject DATABASE_URL and REDIS_URL
5. Redeploy your app to pick up the new environment variables

## Contact Railway Support

If you're still having issues:
- Use the chat widget on railway.app
- Email: support@railway.app
- Railway Discord: https://discord.gg/railway

They're very responsive and can help debug deployment issues.