# Deployment Guide

## Railway Deployment (Current Setup)

Your email signature platform is successfully deployed on Railway at ~$13/month.

### Current Configuration:
- **App**: Running successfully with authentication
- **PostgreSQL**: Add via Railway dashboard → + New → Database → PostgreSQL
- **Redis**: Add via Railway dashboard → + New → Database → Redis

### Environment Variables (Already Set):
```
NODE_ENV=production
JWT_SECRET=[secure-key]
PORT=5000
ALLOWED_ORIGINS=[your-railway-url]
```

### Cost Breakdown:
- App hosting: $5/month
- PostgreSQL: $5/month (after adding)
- Redis: $3/month (after adding)
- **Total: $13/month**

### Next Steps:
1. Add PostgreSQL and Redis databases
2. Test full platform functionality
3. Invite team members
4. Configure custom domain (optional)

The platform is production-ready once databases are connected.