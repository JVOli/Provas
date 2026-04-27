/**
 * Scraper: Corridas de Rua RS (corridasderuars.com.br)
 * Primary: REST API do The Events Calendar (/wp-json/tribe/events/v1/events)
 * Fallback: HTML scraping de /eventos/
 */
import axios from 'axios'
import https from 'https'
import type { CheerioAPI } from 'cheerio'
import { ScrapedRace } from './types'
import { fetchHtmlWithOptions, parseBrazilianDate, inferRaceType } from './utils'

const BASE = 'https://corridasderuars.com.br'

const AXIOS_OPTS = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Referer': BASE + '/',
  },
  timeout: 30000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
}

// ─── REST API ───────────────────────────────────────────────────────────────

interface TribeEvent {
  id: number
  title: string
  start_date: string        // "2026-04-11 06:00:00"
  end_date?: string
  url: string
  venue?: { city?: string; stateprovince?: string }
  categories?: Array<{ name: string }>
}

interface TribeResponse {
  events: TribeEvent[]
  total: number
  total_pages: number
}

async function scrapeViaApi(log: (msg: string) => void): Promise<ScrapedRace[]> {
  const races: ScrapedRace[] = []
  let page = 1

  while (true) {
    const url = `${BASE}/wp-json/tribe/events/v1/events?per_page=100&page=${page}&status=publish`
    log(`  [API] page ${page}: ${url}`)
    const { data } = await axios.get<TribeResponse>(url, AXIOS_OPTS)

    if (!data?.events?.length) break

    for (const ev of data.events) {
      const name = ev.title?.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c)).trim()
      if (!name || name.length < 4) continue

      const dateRaw = ev.start_date?.substring(0, 10) // "2026-04-11"
      if (!dateRaw) continue
      const [y, m, d] = dateRaw.split('-').map(Number)
      const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))

      const city = ev.venue?.city?.trim() || 'A confirmar'
      const state = ev.venue?.stateprovince?.trim() || 'RS'

      const distCategories = (ev.categories ?? [])
        .map((c) => c.name)
        .filter((n) => /\d+\s*km/i.test(n))
        .join(', ')

      races.push({
        name,
        date,
        city,
        state,
        distances: distCategories || 'A confirmar',
        type: inferRaceType(name, distCategories),
        website: ev.url || undefined,
        sourceUrl: `${BASE}/eventos/`,
        source: 'corridasderuars',
      })
    }

    if (page >= data.total_pages) break
    page++
  }

  return races
}

// ─── HTML fallback ───────────────────────────────────────────────────────────

function normalizeCityFromText(raw: string): string {
  const clean = raw.replace(/\s+/g, ' ').trim()
  const firstPart = clean.split(/[-–,/|]/)[0].trim()
  const lower = firstPart.toLowerCase()
  if (!lower || lower.includes('rio grande do sul') || lower === 'rs' || lower.includes('brasil'))
    return ''
  return firstPart
}

function parseDateFromCard($el: any): Date | null {
  const dd = $el.find('.tribe-events-event-date .dd').first().text().trim()
  const mm = $el.find('.tribe-events-event-date .mm').first().text().trim()
  const yy = $el.find('.tribe-events-event-date .yy').first().text().trim()
  if (dd && mm && yy) {
    const d = parseBrazilianDate(`${dd} ${mm} ${yy}`)
    if (d) return d
  }
  const dateRaw =
    $el.find('.tribe-event-schedule-details, .tribe-events-schedule, time, .date, .data-evento')
      .first().text().trim() ||
    $el.find('[class*="date"], [class*="data"]').first().text().trim()
  return parseBrazilianDate(dateRaw)
}

function parseHtmlEvents($: CheerioAPI, sourceUrl: string): ScrapedRace[] {
  const races: ScrapedRace[] = []

  $('article, .event-item, .tribe_events_cat, .type-tribe_events').each((_, el) => {
    try {
      const $el = $(el)
      const name =
        $el.find('.tribe-event-url, h2 a, h3 a, .tribe-events-list-event-title a, .entry-title a')
          .first().text().trim() ||
        $el.find('h2, h3, .tribe-events-list-event-title, .entry-title').first().text().trim()

      if (!name || name.length < 4) return

      const date = parseDateFromCard($el)
      if (!date) return

      const location =
        $el.find('.tribe-events-venue-details, .tribe-city, .tribe-venue-location, .tribe-venue, .tribe-address, .local, .cidade')
          .first().text().trim() || ''

      const city = normalizeCityFromText(location) || 'A confirmar'

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

async function scrapeViaHtml(log: (msg: string) => void): Promise<ScrapedRace[]> {
  const url = `${BASE}/eventos/`
  log(`  [HTML] ${url}`)
  const $ = await fetchHtmlWithOptions(url, { allowInsecureTLS: true })
  return parseHtmlEvents($, url)
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function scrapeCorridasDeRuaRS(
  log: (msg: string) => void
): Promise<ScrapedRace[]> {
  try {
    const races = await scrapeViaApi(log)
    log(`  → ${races.length} races via REST API`)
    return races
  } catch (err: any) {
    log(`  ⚠ REST API falhou (${err.message}), tentando HTML...`)
  }

  try {
    const races = await scrapeViaHtml(log)
    log(`  → ${races.length} races via HTML`)
    return races
  } catch (err: any) {
    log(`  ⚠ HTML também falhou: ${err.message}`)
    return []
  }
}
