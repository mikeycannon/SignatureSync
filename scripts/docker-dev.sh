#!/bin/bash
# Docker development helper scripts

case "$1" in
  "up")
    echo "Starting Docker development environment..."
    docker-compose up --build
    ;;
  "down")
    echo "Stopping Docker development environment..."
    docker-compose down
    ;;
  "clean")
    echo "Cleaning Docker environment (removing volumes and containers)..."
    docker-compose down -v
    docker system prune -f
    ;;
  "logs")
    service=${2:-}
    if [ -n "$service" ]; then
      docker-compose logs -f "$service"
    else
      docker-compose logs -f
    fi
    ;;
  "shell")
    service=${2:-backend}
    echo "Opening shell in $service container..."
    docker-compose exec "$service" sh
    ;;
  "db")
    echo "Connecting to PostgreSQL database..."
    docker-compose exec postgres psql -U postgres -d signature_app_dev
    ;;
  "redis")
    echo "Connecting to Redis CLI..."
    docker-compose exec redis redis-cli
    ;;
  *)
    echo "Docker Development Helper"
    echo "Usage: $0 {up|down|clean|logs [service]|shell [service]|db|redis}"
    echo ""
    echo "Commands:"
    echo "  up         - Start all services with build"
    echo "  down       - Stop all services"
    echo "  clean      - Stop services and remove volumes"
    echo "  logs       - Show logs (optionally for specific service)"
    echo "  shell      - Open shell in service (default: backend)"
    echo "  db         - Connect to PostgreSQL database"
    echo "  redis      - Connect to Redis CLI"
    ;;
esac