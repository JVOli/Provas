# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Vite on :5173 and Express on :3001 concurrently)
npm run dev

# Run only the backend (nodemon + ts-node)
npm run dev:server

# Run only the frontend (Vite)
npm run dev:client

# Production build (Vite + tsc for server)
npm run build

# Start production server
npm run start

# Database
npm run db:migrate      # prisma migrate dev
npm run db:generate     # prisma generate
npm run db:seed         # seed with sample races
npm run db:studio       # open Prisma Studio GUI
```

No linting or test suite is configured.

## Architecture

Single npm project with a React frontend (`src/`) and an Express backend (`server/`) sharing the same `package.json`.

**Frontend** (`src/`) — React 18 + Vite + TanStack Query + Tailwind CSS  
- `App.tsx`: router with three routes — `/` (Calendar), `/race/:id` (RaceDetail), `/admin` (Admin)  
- `Calendar.tsx`: main view with four display modes (timeline, calendar, grid, list) and filtering by state/type/tier/status/date range  
- `Admin.tsx`: race CRUD and scraper control panel  
- Vite proxies `/api/*` to `http://localhost:3001` in dev  

**Backend** (`server/`) — Express 4 + TypeScript (compiled to CommonJS in `server-dist/`)  
- `index.ts`: entry point; serves static `dist/` in production  
- `routes/races.ts`: full CRUD + `PATCH /:id/tier` and `PATCH /:id/status`  
- `routes/scraper.ts`: `GET /sources`, `GET /status`, `POST /run`, `POST /run/:source`  
- `routes/stats.ts`: aggregated counts by type/state/tier/status/month  

**Scrapers** (`server/scrapers/`)  
Eight scrapers (brasilquecorre, corridasderuars, audaxfloripa, contraRelogio, ticketSports, mundoTri, randors, etc.). All use Cheerio for static HTML; some use Puppeteer for dynamic content. Each exports a function that returns `Race[]`, registered in the `SCRAPERS` map consumed by the scraper route.

**Deduplication** (`server/lib/dedup.ts`)  
Before inserting scraped races, duplicates are filtered out using: same state + date within ±1 day + Levenshtein distance < 4 on the name.

**Database** — PostgreSQL via Prisma ORM  
Single `Race` model with enums:
- `RaceType`: CORRIDA, TRAIL, ULTRA, TRIATHLON, DUATHLON, AQUATHLON, BACKYARD, REVEZAMENTO, OCR, OUTROS  
- `RaceTier`: NONE, PRIMARY, SECONDARY, TERTIARY, SUGGESTION  
- `RaceStatus`: NOT_REGISTERED, REGISTERED, COMPLETED, DNS, DNF, CANCELLED  

Scrapers **never overwrite** `tier`, `notes`, `status`, or `myDistance` — these are user-managed fields.

**Deployment** — Railway (see `railway.json`)  
Start command: `npx prisma db push && npm run start`. Build uses Nixpacks. Required env var: `DATABASE_URL`.

## Key Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Full DB schema and enums |
| `server/lib/dedup.ts` | Duplicate-detection logic |
| `server/lib/utils.ts` | Date parsing, state mapping, race type inference |
| `tsconfig.server.json` | Server TS config (CommonJS output to `server-dist/`) |
| `vite.config.ts` | API proxy + build output config |
