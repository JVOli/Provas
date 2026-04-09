/**
 * Scraper: Corridas de Rua RS (corridasderuars.com.br)
 * Scrapes the events listing page and per-city subpages.
 */
import type { CheerioAPI } from 'cheerio'
import { ScrapedRace } from './types'
import { fetchHtmlWithOptions, parseBrazilianDate, inferRaceType, sleep } from './utils'

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

const CITY_FROM_SLUG: Record<string, string> = {
  'porto-alegre': 'Porto Alegre',
  'caxias-do-sul': 'Caxias do Sul',
  'gramado': 'Gramado',
  'novo-hamburgo': 'Novo Hamburgo',
  'pelotas': 'Pelotas',
  'santa-maria': 'Santa Maria',
  'canoas': 'Canoas',
  'sao-leopoldo': 'São Leopoldo',
  'lajeado': 'Lajeado',
}

function cityFromUrl(url: string): string | null {
  const match = url.match(/\/local\/([^/]+)/)
  return match ? (CITY_FROM_SLUG[match[1]] ?? null) : null
}

function prettifySlugCity(slug: string): string {
  return slug
    .split('-')
    .map((part) => {
      if (!part) return part
      return part[0].toUpperCase() + part.slice(1)
    })
    .join(' ')
}

function cityFromElementLinks($: CheerioAPI, $el: any): string | null {
  const hrefs = $el
    .find('a[href*="/local/"]')
    .map((_: any, a: any) => $(a).attr('href') || '')
    .get()

  for (const href of hrefs) {
    const m = href.match(/\/local\/([^/]+)/)
    if (!m) continue
    const slug = m[1]
    return CITY_FROM_SLUG[slug] ?? prettifySlugCity(slug)
  }

  return null
}

function normalizeCityFromText(raw: string): string {
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (!clean) return ''

  // Normalmente: "Cidade - RS", "Cidade, RS", "Cidade / RS"
  const firstPart = clean.split(/[-–,/|]/)[0].trim()
  if (!firstPart) return ''

  // Evita textos genéricos que não são cidade
  const lower = firstPart.toLowerCase()
  if (lower.includes('rio grande do sul') || lower === 'rs') return ''
  if (lower.includes('brasil')) return ''

  return firstPart
}

function parseEvents($: CheerioAPI, sourceUrl: string): ScrapedRace[] {
  const races: ScrapedRace[] = []
  const pageCity = cityFromUrl(sourceUrl)

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
        $el.find('.tribe-city, .tribe-venue-location, .tribe-venue, .tribe-address, .local, .cidade')
          .first().text().trim() ||
        ''

      // Prioriza cidade específica do item; URL da página é fallback.
      const cityFromLink = cityFromElementLinks($, $el as any)
      const cityFromHtml = normalizeCityFromText(location)
      const city = cityFromHtml || cityFromLink || pageCity || 'A confirmar'

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
    const fallbackHttpUrl = url.replace(/^https:\/\//, 'http://')
    try {
      log(`  Fetching ${url}`)
      let $: CheerioAPI
      try {
        // Este site está com certificado expirado em alguns períodos.
        $ = await fetchHtmlWithOptions(url, { allowInsecureTLS: true })
      } catch (err: any) {
        if (!/certificate|ssl|tls/i.test(String(err?.message || ''))) throw err
        log(`  ⚠ TLS inválido em HTTPS, tentando HTTP: ${fallbackHttpUrl}`)
        $ = await fetchHtmlWithOptions(fallbackHttpUrl)
      }
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
