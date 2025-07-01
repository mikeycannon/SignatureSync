# Railway CLI Setup (Alternative Method)

If you can't find the "Add Service" option in the Railway dashboard, use the CLI:

## Install Railway CLI

```bash
# On your local machine:
npm install -g @railway/cli

# Or using curl:
curl -fsSL https://railway.app/install.sh | sh
```

## Deploy with CLI

```bash
# Login to Railway
railway login

# Link to your project (if already created)
railway link

# Or create new project
railway init

# Add PostgreSQL
railway add --database postgresql

# Add Redis  
railway add --database redis

# Deploy your app
railway up
```

## Check Services
```bash
# List all services in your project
railway status

# View environment variables
railway variables
```

## Set Environment Variables via CLI
```bash
# Set production variables
railway variables set JWT_SECRET="your-generated-secret-here"
railway variables set NODE_ENV="production"
railway variables set ALLOWED_ORIGINS="https://your-app.up.railway.app"
```

This method gives you more control and works when the dashboard interface is unclear.