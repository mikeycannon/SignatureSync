# Fix Railway - Connect Your Repository

## Current Situation
Railway is showing "alphasec" which is the Node.js template, not your email signature platform.

## Solution: Connect Your GitHub Repository

### Step 1: In Railway Dashboard
1. Click on your **app service** (the one showing the alphasec template)
2. Go to **"Settings"** tab
3. Scroll down to find **"Source"** section

### Step 2: Connect Repository
Look for one of these options:
- **"Connect Repository"** button
- **"Change Source"** link  
- **"Repository"** dropdown with "Connect" option
- **"Source Repo"** section

Click it and:
1. Choose **GitHub**
2. Select your email signature repository
3. Set branch to **main** (or master)
4. Click **"Connect"** or **"Deploy"**

### Alternative Method: Replace Service
If you can't find repository settings:

1. **Note your environment variables** (copy JWT_SECRET, etc.)
2. **Delete the current service** (not the project)
3. **Add new service:**
   - Click **"+ New"** → **"GitHub Repo"**
   - Select your repository
   - Redeploy
4. **Re-add environment variables**

### Step 3: Verify Connection
After connecting, check:
- Deployment logs should show your package.json
- Build should process your client/server folders
- URL should show your login page, not "alphasec"

### What You Should See After Connection
- Your email signature platform login page
- Working health check at `/api/health`
- Ability to login with admin@acme.com / password

The template served its purpose (proving Railway works), now we need to deploy your actual application code.