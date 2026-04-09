import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { isDuplicate } from '../lib/dedup'
import { SCRAPERS, ScraperKey, ScrapedRace } from '../scrapers'
import { RaceType, RaceTier, RaceStatus } from '@prisma/client'

export const scraperRouter = Router()

interface ScraperStatus {
  running: boolean
  lastRun: Date | null
  lastSource: string | null
  stats: {
    inserted: number
    updated: number
    skipped: number
    errors: string[]
  } | null
  log: string[]
}

const status: ScraperStatus = {
  running: false,
  lastRun: null,
  lastSource: null,
  stats: null,
  log: [],
}

async function importRaces(races: ScrapedRace[], log: (m: string) => void) {
  let inserted = 0, updated = 0, skipped = 0

  // Load recent races from DB for dedup
  const dbRaces = await prisma.race.findMany({
    select: { id: true, name: true, date: true, state: true, sourceUrl: true },
    where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    take: 2000,
  })

  for (const race of races) {
    try {
      const dup = dbRaces.find((db) =>
        isDuplicate(
          { name: db.name, date: db.date, state: db.state },
          { name: race.name, date: race.date, state: race.state }
        )
      )

      if (dup) {
        // Only update sourceUrl if empty
        if (!dup.sourceUrl && race.sourceUrl) {
          await prisma.race.update({
            where: { id: dup.id },
            data: { sourceUrl: race.sourceUrl },
          })
          updated++
        } else {
          skipped++
        }
        log(`  ⏭  Duplicate: ${race.name}`)
        continue
      }

      const created = await prisma.race.create({
        data: {
          name: race.name,
          date: race.date,
          dateEnd: race.dateEnd,
          city: race.city,
          state: race.state,
          distances: race.distances,
          type: (race.type as RaceType) || RaceType.CORRIDA,
          terrain: race.terrain,
          organizer: race.organizer,
          website: race.website,
          sourceUrl: race.sourceUrl,
          source: race.source,
          elevation: race.elevation,
          tier: RaceTier.SUGGESTION,
          status: RaceStatus.NOT_REGISTERED,
        },
      })

      dbRaces.push({ id: created.id, name: created.name, date: created.date, state: created.state, sourceUrl: created.sourceUrl })
      inserted++
      log(`  ✅ Inserted: ${race.name} (${race.city}/${race.state} - ${race.date.toLocaleDateString('pt-BR')})`)
    } catch (err: any) {
      log(`  ❌ Error inserting ${race.name}: ${err.message}`)
      skipped++
    }
  }

  return { inserted, updated, skipped }
}

async function runScraper(keys: ScraperKey[], log: (m: string) => void) {
  let totalInserted = 0, totalUpdated = 0, totalSkipped = 0
  const errors: string[] = []

  for (const key of keys) {
    const scraper = SCRAPERS[key]
    if (!scraper) continue

    log(`\n🔍 Running scraper: ${scraper.name}`)

    try {
      const races = await scraper.fn(log)
      log(`📦 ${races.length} races found from ${scraper.name}`)

      const { inserted, updated, skipped } = await importRaces(races, log)
      totalInserted += inserted
      totalUpdated += updated
      totalSkipped += skipped

      log(`📊 ${scraper.name}: +${inserted} new, ~${updated} updated, ${skipped} skipped`)
    } catch (err: any) {
      const msg = `Error in ${scraper.name}: ${err.message}`
      errors.push(msg)
      log(`❌ ${msg}`)
    }
  }

  return { inserted: totalInserted, updated: totalUpdated, skipped: totalSkipped, errors }
}

// GET /api/scraper/sources
scraperRouter.get('/sources', (_req: Request, res: Response) => {
  res.json(
    Object.entries(SCRAPERS).map(([key, { name }]) => ({ key, name }))
  )
})

// GET /api/scraper/status
scraperRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    running: status.running,
    lastRun: status.lastRun,
    lastSource: status.lastSource,
    stats: status.stats,
    log: status.log.slice(-200),
  })
})

// POST /api/scraper/run — all scrapers
scraperRouter.post('/run', async (_req: Request, res: Response) => {
  if (status.running) {
    return res.status(409).json({ error: 'Scraper already running' })
  }

  status.running = true
  status.log = ['🚀 Starting all scrapers...']
  status.lastSource = 'all'

  const log = (msg: string) => {
    console.log(msg)
    status.log.push(msg)
  }

  res.json({ message: 'Scraping started' })

  const keys = Object.keys(SCRAPERS) as ScraperKey[]
  const stats = await runScraper(keys, log)

  status.running = false
  status.lastRun = new Date()
  status.stats = stats
  log(`\n✨ All scrapers done. Total: +${stats.inserted} new, ~${stats.updated} updated, ${stats.skipped} skipped.`)
})

// POST /api/scraper/run/:source — specific scraper
scraperRouter.post('/run/:source', async (req: Request, res: Response) => {
  const key = req.params.source as ScraperKey

  if (!SCRAPERS[key]) {
    return res.status(404).json({ error: `Unknown scraper: ${key}` })
  }

  if (status.running) {
    return res.status(409).json({ error: 'Scraper already running' })
  }

  status.running = true
  status.log = [`🚀 Starting scraper: ${SCRAPERS[key].name}...`]
  status.lastSource = key

  const log = (msg: string) => {
    console.log(msg)
    status.log.push(msg)
  }

  res.json({ message: `Scraping ${SCRAPERS[key].name} started` })

  const stats = await runScraper([key], log)

  status.running = false
  status.lastRun = new Date()
  status.stats = stats
  log(`\n✨ Done. +${stats.inserted} new, ~${stats.updated} updated, ${stats.skipped} skipped.`)
})
