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
npm run db:migrate      # prisma migrate dev — use when changing schema.prisma
npm run db:generate     # prisma generate — use after db:migrate or after npm install
npm run db:seed         # seed with sample races
npm run db:studio       # open Prisma Studio GUI at http://localhost:5555
```

No linting or test suite is configured.

## Architecture

Single npm project with a React frontend (`src/`) and an Express backend (`server/`) sharing the same `package.json`. The server compiles to CommonJS (`tsconfig.server.json` → `server-dist/`).

**Frontend** (`src/`) — React 18 + Vite + TanStack Query + Tailwind CSS
- `App.tsx`: router with three routes — `/` (Calendar), `/race/:id` (RaceDetail), `/admin` (Admin)
- `Calendar.tsx`: four display modes (timeline, calendar, grid, list); filters by state/type/tier/status/date range; fetches all pages (max 200/page); toggles past races relative to São Paulo timezone
- `Admin.tsx`: three tabs — **Create** (manual race form), **Scraper** (trigger scrapers + live log), **Stats** (pie charts by tier/type/status/state/month)
- Vite proxies `/api/*` to `http://localhost:3001` in dev

**Backend** (`server/`) — Express 4 + TypeScript
- `routes/races.ts`: full CRUD + `PATCH /:id/tier` and `PATCH /:id/status`
- `routes/scraper.ts`: `GET /sources`, `GET /status`, `POST /run`, `POST /run/:source`
- `routes/stats.ts`: aggregated counts by type/state/tier/status/month

**Scrapers** (`server/scrapers/`)
- `index.ts`: exports the `SCRAPERS` registry — a `Record<ScraperKey, { name, fn }>` map
- `utils.ts`: shared `fetchHtml`, `parseBrazilianDate`, `inferRaceType`, `STATE_MAP`, `sleep`
- Each scraper exports `async function scrapeXxx(log: (m: string) => void): Promise<ScrapedRace[]>`
- The scraper route calls `SCRAPERS[key].fn(log)` — adding a scraper means creating the file, importing it in `index.ts`, and adding it to the `SCRAPERS` object

**Deduplication** (`server/lib/dedup.ts`)
Runs inside `importRaces()` (in `routes/scraper.ts`) before any DB insert. It loads existing races from the past 30 days (limit 2000) and rejects a scraped race if: same `state` + date within ±1 day + Levenshtein distance < 4 on the normalized name. If a duplicate is found and the DB race lacks a `sourceUrl`, only that field is updated.

**Database** — PostgreSQL via Prisma ORM
Single `Race` model with enums:
- `RaceType`: CORRIDA, TRAIL, ULTRA, TRIATHLON, DUATHLON, AQUATHLON, BACKYARD, REVEZAMENTO, OCR, OUTROS
- `RaceTier`: NONE, PRIMARY, SECONDARY, TERTIARY, SUGGESTION
- `RaceStatus`: NOT_REGISTERED, REGISTERED, COMPLETED, DNS, DNF, CANCELLED

Scrapers **never overwrite** `tier`, `notes`, `status`, or `myDistance` — these are user-managed fields. New races are inserted with `tier: SUGGESTION` and `status: NOT_REGISTERED`.

**Deployment** — Railway (see `railway.json`)
Start command: `npx prisma db push && npm run start`. Build uses Nixpacks. Required env var: `DATABASE_URL`.

## Data Flow: Scraper Run

```
POST /api/scraper/run[/:source]
  → runScraper(keys, log)
    → SCRAPERS[key].fn(log)        — scraper fetches + parses HTML, returns ScrapedRace[]
    → importRaces(races, log)
        → load DB races (past 30 days)
        → isDuplicate() per race   — skip if duplicate, update sourceUrl if missing
        → prisma.race.create()     — new races inserted as tier=SUGGESTION
  → status object updated (inserted / updated / skipped counts)

GET /api/scraper/status            — frontend polls every 2s while running
```

## Date Handling

All dates are stored as UTC. Parsing functions in `server/scrapers/utils.ts` return UTC `Date` objects at 12:00 noon to avoid day-boundary shifts across timezones. The frontend filters past races using `America/Sao_Paulo` timezone.

## Key Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Full DB schema and enums |
| `server/lib/dedup.ts` | Duplicate-detection logic |
| `server/scrapers/utils.ts` | Date parsing, state mapping, race type inference, HTTP fetch helpers |
| `server/scrapers/index.ts` | SCRAPERS registry — single place to register new scrapers |
| `tsconfig.server.json` | Server TS config (CommonJS output to `server-dist/`) |
| `vite.config.ts` | API proxy + build output config |
