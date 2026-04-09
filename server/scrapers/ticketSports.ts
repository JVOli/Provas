/**
 * Scraper: Ticket Sports (ticketsports.com.br/Calendario/)
 * Scrapes Triathlon, Trail Run, Corrida de Rua, Duathlon calendars.
 */
import { ScrapedRace } from './types'
import { fetchHtml, parseBrazilianDate, inferRaceType, STATE_MAP, sleep } from './utils'

const BASE = 'https://www.ticketsports.com.br'

const MODALITY_PAGES = [
  { path: '/Calendario/Todos-os-organizadores/Triathlon', type: 'TRIATHLON' },
  { path: '/Calendario/Todos-os-organizadores/Trail-Run', type: 'TRAIL' },
  { path: '/Calendario/Todos-os-organizadores/Corrida-de-Rua', type: 'CORRIDA' },
  { path: '/Calendario/Todos-os-organizadores/Duathlon', type: 'DUATHLON' },
]

function parseEvents(
  $: cheerio.CheerioAPI,
  sourceUrl: string,
  defaultType: string
): ScrapedRace[] {
  const races: ScrapedRace[] = []

  // TicketSports uses card-based layout with Bootstrap-style classes
  $('.event-card, .card, [class*="event"], article, .col-event').each((_, el) => {
    try {
      const $el = $(el)

      const name =
        $el.find('.event-name, .card-title, h2, h3, h4, [class*="title"]').first().text().trim()

      if (!name || name.length < 4) return

      const dateRaw =
        $el.find('.event-date, .date, time, [class*="date"]').first().text().trim()

      const date = parseBrazilianDate(dateRaw)
      if (!date) return

      const locationRaw =
        $el.find('.event-location, .location, .city, [class*="city"], [class*="local"]')
          .first().text().trim() || ''

      let state = 'BR'
      const stateMatch = locationRaw.match(/\b([A-Z]{2})\b/) ||
        locationRaw.match(/[-–,]\s*([A-Z]{2})/)
      if (stateMatch) state = stateMatch[1]

      const cityPart = locationRaw.replace(/[-–,]\s*[A-Z]{2}.*$/, '').trim()

      const distText =
        $el.find('[class*="dist"], .modality, .percurso').first().text().trim() ||
        'A confirmar'

      const link = $el.find('a').first().attr('href') || ''

      const organizer = $el.find('.organizer, [class*="organ"]').first().text().trim()

      races.push({
        name,
        date,
        city: cityPart || 'A confirmar',
        state: state || 'BR',
        distances: distText,
        type: inferRaceType(name, distText) || defaultType,
        organizer: organizer || undefined,
        website: link ? (link.startsWith('http') ? link : `${BASE}${link}`) : undefined,
        sourceUrl,
        source: 'ticketsports',
      })
    } catch {
      // skip
    }
  })

  return races
}

export async function scrapeTicketSports(
  log: (msg: string) => void
): Promise<ScrapedRace[]> {
  const all: ScrapedRace[] = []
  const seen = new Set<string>()

  for (const { path, type } of MODALITY_PAGES) {
    const url = `${BASE}${path}`
    try {
      log(`  Fetching ${url}`)
      const $ = await fetchHtml(url)
      const races = parseEvents($, url, type)
      let added = 0

      for (const r of races) {
        const key = `${r.name}|${r.date.toISOString().substring(0, 10)}|${r.state}`
        if (!seen.has(key)) {
          seen.add(key)
          all.push(r)
          added++
        }
      }

      log(`  → ${races.length} found, ${added} unique from ${path}`)
    } catch (err: any) {
      log(`  ⚠ Error scraping ${url}: ${err.message}`)
    }
    await sleep(1500)
  }

  return all
}
