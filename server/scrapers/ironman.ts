import { ScrapedRace } from './types'
import { fetchHtml, sleep } from './utils'
import type { CheerioAPI } from 'cheerio'

const BASE = 'https://www.ironman.com'

const ENGLISH_MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

function parseEnglishDate(raw: string): Date | null {
  if (!raw) return null
  const s = raw.trim()

  // "May 10, 2026" or "June 7, 2026"
  const m = s.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/)
  if (m) {
    const month = ENGLISH_MONTHS[m[1].toLowerCase()]
    if (month !== undefined) {
      return new Date(Date.UTC(parseInt(m[3]), month, parseInt(m[2]), 12, 0, 0))
    }
  }

  // "10 May 2026"
  const m2 = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (m2) {
    const month = ENGLISH_MONTHS[m2[2].toLowerCase()]
    if (month !== undefined) {
      return new Date(Date.UTC(parseInt(m2[3]), month, parseInt(m2[1]), 12, 0, 0))
    }
  }

  return null
}

function inferIronmanType(name: string, slug: string): string {
  const t = (name + ' ' + slug).toLowerCase()
  if (t.includes('70.3') || t.includes('im703')) return 'TRIATHLON'
  if (t.includes('5150') || t.includes('short course')) return 'TRIATHLON'
  if (t.includes('ironman')) return 'TRIATHLON'
  return 'TRIATHLON'
}

function inferDistances(name: string, slug: string): string {
  const t = (name + ' ' + slug).toLowerCase()
  if (t.includes('70.3') || t.includes('im703')) return '1.9km swim / 90km bike / 21.1km run'
  if (t.includes('5150')) return '1.5km swim / 40km bike / 10km run'
  return '3.8km swim / 180km bike / 42.2km run'
}

function parseLocation(locationText: string): { city: string; country: string } {
  const parts = locationText.split(',').map(s => s.trim())
  if (parts.length >= 2) {
    return { city: parts.slice(0, -1).join(', '), country: parts[parts.length - 1] }
  }
  return { city: locationText, country: '' }
}

function parseCards($: CheerioAPI, sourceUrl: string): ScrapedRace[] {
  const races: ScrapedRace[] = []

  $('div.races-search-view__cards-row > article, div.races-search-view__cards article').each((_, el) => {
    try {
      const $el = $(el)

      const name = $el.find('div.heading-area h2').first().text().trim()
        || $el.find('h2').first().text().trim()
      if (!name || name.length < 4) return

      const dateRaw = $el.find('span.date').first().text().trim()
      const date = parseEnglishDate(dateRaw)
      if (!date) return

      const locationText = $el.find('div.country-flag-formatter span.label').first().text().trim()
        || $el.find('div.location').first().text().trim()
      const { city, country } = parseLocation(locationText)

      const link = $el.find('a[href*="/races/"]').first().attr('href') || ''
      const slug = link.replace(/^\/races\//, '')

      const attrs: string[] = []
      $el.find('div.icon-field-item').each((_, attrEl) => {
        const label = $(attrEl).find('span.icon-field-label').text().trim()
        const value = $(attrEl).find('span.icon-field-value').text().trim()
        if (label && value) attrs.push(`${label}: ${value}`)
      })
      const terrain = attrs.join(' | ') || undefined

      races.push({
        name,
        date,
        city: city || 'A confirmar',
        state: country || 'INT',
        distances: inferDistances(name, slug),
        type: inferIronmanType(name, slug),
        terrain,
        website: link ? `${BASE}${link}` : `${BASE}/races`,
        sourceUrl,
        source: 'ironman',
      })
    } catch {
      // skip
    }
  })

  return races
}

export async function scrapeIronman(
  log: (msg: string) => void
): Promise<ScrapedRace[]> {
  const all: ScrapedRace[] = []
  const seen = new Set<string>()
  const maxPages = 30

  for (let page = 0; page < maxPages; page++) {
    const url = page === 0
      ? `${BASE}/races`
      : `${BASE}/races?page=${page}`

    try {
      log(`  Fetching ${url}`)
      const $ = await fetchHtml(url)
      const races = parseCards($, url)

      if (races.length === 0) {
        log(`  → No more races found, stopping pagination`)
        break
      }

      let added = 0
      for (const r of races) {
        const key = `${r.name}|${r.date.toISOString().substring(0, 10)}`
        if (!seen.has(key)) {
          seen.add(key)
          all.push(r)
          added++
        }
      }

      log(`  → ${races.length} found, ${added} unique from page ${page}`)
    } catch (err: any) {
      log(`  ⚠ Error scraping ${url}: ${err.message}`)
      break
    }
    await sleep(2000)
  }

  return all
}
