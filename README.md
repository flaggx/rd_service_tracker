# rd_service_tracker
Simple SaaS for submitting and tracking the status of service tickets.

## Overview
- Backend: Node/Express + Prisma (PostgreSQL), session-based auth
- Frontend: React (Vite)
- Prod: Nginx serves the SPA and proxies `/api` to backend
- Dev: hot-reload with Vite (frontend) and nodemon (backend)
- DB: PostgreSQL via Docker

## Prerequisites
- Docker and Docker Compose

## Run (Profiles)

### Development (hot-reload)
Runs:
- db
- backend-dev (nodemon, bind mount)
- frontend-dev (Vite HMR, bind mount)

Start:

bash docker compose --profile dev up
``` 

Open:
- Frontend: http://localhost:5173
- Backend health: http://localhost:3001/health

Seed admin (safe to re-run):
```
bash docker compose --profile dev exec backend-dev npm run seed
``` 

Logs:
```
bash docker compose --profile dev logs -f backend-dev docker compose --profile dev logs -f frontend-dev
``` 

Stop:
```
bash docker compose --profile dev down
``` 

### Production-style
Build once and run:
- db
- frontend-build (builds and exits)
- backend (Express)
- nginx (serves built SPA + proxies `/api`)

Start:
```
bash docker compose --profile prod up -d
``` 

Open:
- http://localhost

Seed admin:
```
bash docker compose --profile prod exec backend npm run seed
``` 

Logs:
```
bash docker compose --profile prod logs -f nginx docker compose --profile prod logs -f backend
``` 

Stop:
```
bash docker compose --profile prod down
``` 

### Full rebuild (any profile)
```
bash docker compose --profile <dev|prod> down docker compose --profile <dev|prod> build --no-cache docker compose --profile <dev|prod> up -d
``` 

## Prisma/DB tasks (dev)
- Create a migration:
```
bash docker compose --profile dev exec backend-dev npx prisma migrate dev --name change
``` 
- Generate Prisma client:
```
bash docker compose --profile dev exec backend-dev npx prisma generate
``` 

## Backups
- Backup:
```
bash bash scripts/pg-backup.sh
``` 
- Restore:
```
bash bash scripts/pg-restore.sh backups/backup_rd_service_tracker_YYYYMMDD_HHMMSS.sql
``` 

## Notes
- Admin seed user: username `admin`, password `changeme` (change ASAP).
- Sessions stored in Postgres (connect-pg-simple).
- Ticket images: URLs only (no uploads yet).
- Validation errors return `{ message, errors: [{ path, message }] }`.
```
How to use
- Dev: docker compose --profile dev up, then [http://localhost:5173](http://localhost:5173)
- Prod: docker compose --profile prod up -d, then [http://localhost](http://localhost)
<br><br>
- If you previously ran the prod profile and can't run dev profile, bring down prod profile:
    
    - docker compose --profile dev down --remove-orphans


