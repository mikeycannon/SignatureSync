# Add Databases to Railway - Final Step

## Now That Your App Works

Since you can login successfully, your core app is running perfectly. Time to add persistent storage.

## Step 1: Add PostgreSQL Database

In Railway dashboard:
1. Look for **"+ New"** button (usually top-right)
2. Click **"Database"** → **"PostgreSQL"**
3. Choose **"Hobby"** plan ($5/month)
4. Railway automatically creates `DATABASE_URL` environment variable
5. Your app will automatically connect on next restart

## Step 2: Add Redis Cache

1. Click **"+ New"** again
2. Select **"Database"** → **"Redis"**
3. Choose **"Hobby"** plan ($3/month)
4. Railway automatically creates `REDIS_URL` environment variable

## Step 3: Automatic Restart

Railway will automatically restart your app with the new database connections. No manual redeploy needed.

## Step 4: Verify Database Connection

Once databases are added:
1. Check your app still loads
2. Try creating a signature template
3. Add team members
4. Verify data persists between sessions

## Current vs Final State

**Current:** App works with in-memory storage (data lost on restart)
**After databases:** Full persistence, production-ready platform

## Total Monthly Cost
- App hosting: $5/month
- PostgreSQL: $5/month
- Redis: $3/month
- **Total: $13/month**

## What Happens Next

With databases connected:
- All user data persists permanently
- Multiple users can collaborate
- Platform scales with your team
- Ready for production use

The database setup is the final piece to make your email signature platform fully operational!