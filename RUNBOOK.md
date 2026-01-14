# RUNBOOK - Gelir-Gider App Operations Guide

This document provides operational guidance for running, testing, deploying, and troubleshooting the Gelir-Gider application.

## Table of Contents

- [Local Development](#local-development)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Common Tasks](#common-tasks)

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.11+ (for PDF parser)
- Docker & Docker Compose (recommended)
- npm 10+

### Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/EmreUludasdemir/Gelir-Gider-App.git
cd Gelir-Gider-App

# 2. Start databases with Docker
docker-compose up -d postgres redis

# 3. Install dependencies
npm install

# 4. Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 5. Run migrations and seed
npm run db:migrate
npm run db:seed

# 6. Start development servers
npm run dev
```

### Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Next.js frontend |
| API | http://localhost:3001 | NestJS backend |
| PDF Parser | http://localhost:8001 | FastAPI service |
| Prisma Studio | http://localhost:5555 | Database UI |

### Demo Account

After seeding, you can login with:
- Email: `demo@example.com`
- Password: `demo1234`

### Development Commands

```bash
# Start all services
npm run dev

# Start individual services
npm run dev:api      # Backend only
npm run dev:web      # Frontend only
npm run dev:parser   # PDF parser only

# Database operations
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:reset     # Reset database
npm run db:studio    # Open Prisma Studio

# Code quality
npm run lint         # Run linters
npm run build        # Build all services
npm run verify       # Run verification script
```

---

## Testing

### Running Tests

```bash
# Run all backend tests
npm test

# Run with coverage
npm run test:cov

# Run specific test file
cd apps/api
npm test -- --testPathPattern="auth"

# Run frontend tests
npm run test:web

# Run E2E tests (when available)
npm run test:e2e
```

### Test Environment Variables

Tests require these environment variables (set automatically in CI):

```env
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=test-jwt-secret-that-is-at-least-32-chars
NODE_ENV=test
```

### Test Coverage Thresholds

- Backend: 20% (target: 60%)
- Frontend: 70%

---

## Production Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

1. **Build the applications:**

```bash
npm run build
```

2. **Run migrations:**

```bash
cd apps/api
npm run db:migrate
```

3. **Start services:**

```bash
# Backend
cd apps/api
npm start

# Frontend
cd apps/web
npm start

# PDF Parser
cd services/pdf-parser
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Required Environment Variables (Production)

```env
# Required
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<secure-random-string-min-32-chars>

# Recommended
REDIS_HOST=redis-host
REDIS_PORT=6379
GEMINI_API_KEY=<your-key>

# For billing
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# For notifications
SMTP_HOST=smtp.example.com
SMTP_USER=user
SMTP_PASS=pass
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
```

### Health Checks

```bash
# Overall health
curl http://localhost:3001/health

# Database check
curl http://localhost:3001/health/ready

# Uptime check
curl http://localhost:3001/health/live

# Performance metrics
curl http://localhost:3001/performance/metrics
```

---

## Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - Target: < 200ms for most endpoints
   - Alert: > 1000ms

2. **Database Connections**
   - Monitor pool usage
   - Alert on connection exhaustion

3. **Redis Memory**
   - Current limit: 256MB
   - Alert at 80% usage

4. **PDF Parser Queue**
   - Monitor pending jobs
   - Alert if queue depth > 100

### Log Locations

| Service | Location |
|---------|----------|
| API | `apps/api/logs/combined.log` |
| API Errors | `apps/api/logs/error.log` |
| Exceptions | `apps/api/logs/exceptions.log` |

### Log Analysis

```bash
# View recent errors
tail -100 apps/api/logs/error.log

# Search for specific error
grep "DATABASE" apps/api/logs/error.log

# Monitor in real-time
tail -f apps/api/logs/combined.log
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms:** `Error: P1001: Can't reach database server`

**Solutions:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection string
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

#### 2. Redis Connection Failed

**Symptoms:** `ECONNREFUSED` or cache errors

**Solutions:**
```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
redis-cli -h localhost -p 6379 ping

# Restart Redis
docker-compose restart redis
```

#### 3. PDF Parser Not Responding

**Symptoms:** Uploads hang or timeout

**Solutions:**
```bash
# Check parser status
curl http://localhost:8001/health

# Restart parser
docker-compose restart pdf-parser

# Check logs
docker-compose logs pdf-parser

# Verify Python dependencies
cd services/pdf-parser
pip install -r requirements.txt
```

#### 4. Environment Validation Failed

**Symptoms:** App fails to start with env errors

**Solutions:**
```bash
# Check required variables
cat apps/api/.env

# Verify against example
diff apps/api/.env apps/api/.env.example

# Common missing variables:
# - DATABASE_URL
# - JWT_SECRET (must be 32+ chars)
```

#### 5. Build Failures

**Symptoms:** TypeScript or build errors

**Solutions:**
```bash
# Clean and rebuild
npm run clean
npm install
npm run build

# Check for type errors
cd apps/api
npx tsc --noEmit

# Regenerate Prisma client
npx prisma generate
```

#### 6. Migration Issues

**Symptoms:** Schema mismatch or migration errors

**Solutions:**
```bash
# Reset database (dev only)
npm run db:reset

# Force push schema
cd apps/api
npx prisma db push --force-reset

# Generate new migration
npx prisma migrate dev --name fix_schema
```

### Debug Mode

```bash
# Run API in debug mode
cd apps/api
npm run start:debug

# Enable verbose logging
LOG_LEVEL=debug npm run dev:api
```

---

## Common Tasks

### Adding a New User

```sql
-- Via Prisma Studio
npm run db:studio
-- Navigate to User table, click Add record

-- Via SQL
INSERT INTO "User" (id, email, password, name)
VALUES (gen_random_uuid(), 'user@example.com', '$2b$10$...', 'User Name');
```

### Resetting Demo Data

```bash
# Full reset with fresh seed
npm run db:reset

# Or re-run seed only
npm run db:seed
```

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update all (minor/patch)
npm update

# Update specific package
npm install package@latest -w @app/api
```

### Backing Up Database

```bash
# Export database
docker exec finance-postgres pg_dump -U finance_user finance_db > backup.sql

# Import database
cat backup.sql | docker exec -i finance-postgres psql -U finance_user finance_db
```

### Clearing Cache

```bash
# Clear Redis cache
redis-cli -h localhost FLUSHALL

# Or via API (if endpoint exists)
curl -X POST http://localhost:3001/cache/clear
```

---

## Support

- **Issues:** https://github.com/EmreUludasdemir/Gelir-Gider-App/issues
- **Documentation:** See CLAUDE.md for architecture details
- **Quick Start:** See QUICK_START.md

---

*Last updated: 2026-01-14*
