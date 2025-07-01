# Docker Development Setup

This setup provides a complete development environment with PostgreSQL, Redis, backend, and frontend services.

## Quick Start

1. **Start the development environment:**
   ```bash
   ./scripts/docker-dev.sh up
   ```

2. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

3. **Stop the environment:**
   ```bash
   ./scripts/docker-dev.sh down
   ```

## Services

### PostgreSQL Database
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Database:** signature_app_dev
- **User:** postgres
- **Password:** postgres

### Redis Session Store
- **Image:** redis:7-alpine
- **Port:** 6379
- **Purpose:** Session storage and caching

### Backend Service
- **Port:** 5000
- **Hot reload:** Enabled via volume mounting
- **Environment:** Development with all services connected

### Frontend Service
- **Port:** 5173
- **Hot reload:** Enabled via Vite dev server
- **Environment:** Development with API proxy

## Development Commands

```bash
# Start all services
./scripts/docker-dev.sh up

# Stop all services
./scripts/docker-dev.sh down

# Clean environment (removes volumes)
./scripts/docker-dev.sh clean

# View logs (all services)
./scripts/docker-dev.sh logs

# View logs for specific service
./scripts/docker-dev.sh logs backend
./scripts/docker-dev.sh logs frontend

# Open shell in backend container
./scripts/docker-dev.sh shell backend

# Connect to PostgreSQL
./scripts/docker-dev.sh db

# Connect to Redis CLI
./scripts/docker-dev.sh redis
```

## Environment Variables

The Docker environment uses variables from `.env.docker`. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `ALLOWED_ORIGINS`: CORS allowed origins
- `VITE_API_URL`: Frontend API endpoint

## Database Initialization

The PostgreSQL container runs initialization scripts from `docker/postgres/init/`:
- `01-init.sql`: Creates extensions and permissions

## Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Vite dev server with file watching
- **Backend**: tsx with file watching via volume mount

## Troubleshooting

1. **Port conflicts**: Stop local services running on ports 5000, 5173, 5432, 6379
2. **Permission issues**: Ensure Docker has permission to mount volumes
3. **Database connection**: Wait for PostgreSQL health check before backend starts
4. **Clean restart**: Use `./scripts/docker-dev.sh clean` to reset everything

## Production Differences

This setup is for development only. Production would include:
- Multi-stage builds for smaller images
- Nginx reverse proxy
- SSL certificates
- Production-grade database configuration
- Environment-specific secrets management