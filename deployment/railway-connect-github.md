# Connect Your GitHub Repo to Railway Template

## Method 1: Through Railway Dashboard (Recommended)

**Step 1: Go to Your Railway Project Settings**
1. In Railway dashboard, click on your app service
2. Go to "Settings" tab
3. Look for "Source" or "Repository" section

**Step 2: Connect GitHub Repository**
1. Click "Connect Repository" or "Change Source"
2. Select "GitHub" as the source
3. Choose your email signature repository
4. Select the main/master branch
5. Click "Deploy"

Railway will immediately redeploy using your GitHub code instead of the template.

## Method 2: Reconnect the Service

**If you don't see repository options:**

1. **Delete the template app service** (keep the project)
2. **Add new service:**
   - Click "New Service"
   - Choose "GitHub Repo"
   - Select your repository
   - Railway deploys your actual code

## Method 3: Push Over Template

**If other methods don't work:**

1. **Clone the Railway template locally:**
   ```bash
   git clone [railway-template-url]
   cd [project-name]
   ```

2. **Add your repo as remote:**
   ```bash
   git remote add myrepo https://github.com/yourusername/your-repo.git
   git fetch myrepo
   ```

3. **Replace template with your code:**
   ```bash
   git reset --hard myrepo/main
   git push origin main --force
   ```

## What Should Happen

After connecting your GitHub repo:
- Railway rebuilds using your actual email signature platform code
- Your environment variables remain (JWT_SECRET, etc.)
- You get your real application instead of the template
- All your deployment fixes (.railwayignore, etc.) take effect

## Verify the Connection

1. **Check deployment logs** - should show your package.json and dependencies
2. **Visit your URL** - should see your login page, not template app
3. **Test health endpoint** - should return your health check response
4. **Check file structure** - Railway logs should show your client/server folders

The key is finding the "Repository" or "Source" settings in your Railway app service to point it at your GitHub repository instead of the template code.