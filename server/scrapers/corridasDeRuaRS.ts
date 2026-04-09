/**
 * Scraper: Corridas de Rua RS (corridasderuars.com.br)
 * Scrapes the events listing page and per-city subpages.
 */
import type { CheerioAPI } from 'cheerio'
import { ScrapedRace } from './types'
import { fetchHtml, parseBrazilianDate, inferRaceType, sleep } from './utils'

const BASE = 'https://corridasderuars.com.br'

const CITY_PAGES = [
  '/eventos/',
  '/local/porto-alegre/',
  '/local/caxias-do-sul/',
  '/local/gramado/',
  '/local/novo-hamburgo/',
  '/local/pelotas/',
  '/local/santa-maria/',
  '/local/canoas/',
  '/local/sao-leopoldo/',
  '/local/lajeado/',
]

function parseEvents($: CheerioAPI, sourceUrl: string): ScrapedRace[] {
  const races: ScrapedRace[] = []

  // Common WordPress event patterns
  $('article, .event-item, .tribe_events_cat, .type-tribe_events').each((_, el) => {
    try {
      const $el = $(el)

      const name =
        $el.find('.tribe-event-url, h2 a, h3 a, .tribe-events-list-event-title a, .entry-title a')
          .first().text().trim() ||
        $el.find('h2, h3, .tribe-events-list-event-title, .entry-title').first().text().trim()

      if (!name || name.length < 4) return

      const dateRaw =
        $el.find('.tribe-event-schedule-details, .tribe-events-schedule, time, .date, .data-evento')
          .first().text().trim() ||
        $el.find('[class*="date"], [class*="data"]').first().text().trim()

      const date = parseBrazilianDate(dateRaw)
      if (!date) return

      const location =
        $el.find('.tribe-venue-location, .tribe-venue, .local, .cidade').first().text().trim() ||
        ''

      // Try to extract city from location
      const cityParts = location.split(/[-–,]/)[0].trim()
      const city = cityParts || 'Porto Alegre'

      const distText =
        $el.find('[class*="dist"], .distancias, .percurso').first().text().trim() ||
        $el.find('p').filter((_, p) => /km/i.test($(p).text())).first().text().trim() ||
        'A confirmar'

      const link =
        $el.find('h2 a, h3 a, .entry-title a, .tribe-event-url').first().attr('href') || ''

      races.push({
        name,
        date,
        city,
        state: 'RS',
        distances: distText,
        type: inferRaceType(name, distText),
        website: link || undefined,
        sourceUrl,
        source: 'corridasderuars',
      })
    } catch {
      // skip
    }
  })

  return races
}

export async function scrapeCorridasDeRuaRS(
  log: (msg: string) => void
): Promise<ScrapedRace[]> {
  const all: ScrapedRace[] = []
  const seen = new Set<string>()

  for (const page of CITY_PAGES) {
    const url = `${BASE}${page}`
    try {
      log(`  Fetching ${url}`)
      const $ = await fetchHtml(url)
      const races = parseEvents($, url)
      let added = 0

      for (const r of races) {
        const key = `${r.name}|${r.date.toISOString().substring(0, 10)}`
        if (!seen.has(key)) {
          seen.add(key)
          all.push(r)
          added++
        }
      }

      log(`  → ${races.length} found, ${added} unique from ${page}`)
    } catch (err: any) {
      log(`  ⚠ Error scraping ${url}: ${err.message}`)
    }
    await sleep(1500)
  }

  return all
}
