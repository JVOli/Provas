/**
 * Scraper: Brasil Que Corre (brasilquecorre.com)
 * Scrapes race listings for all states and main modalities.
 *
 * NOTE: Selectors are based on common WordPress-style event listing patterns.
 * If the site changes structure, update the selectors in parseEventList().
 */
import { ScrapedRace } from './types'
import { fetchHtml, parseBrazilianDate, inferRaceType, STATE_MAP, sleep } from './utils'

const BASE = 'https://brasilquecorre.com'

const STATE_PAGES = [
  'riograndedosul', 'santacatarina', 'maranhao', 'saopaulo', 'riodejaneiro',
  'minasgerais', 'parana', 'bahia', 'ceara', 'pernambuco', 'distritofederal',
  'goias', 'matogrosso', 'matogrossodosul', 'espiritosanto', 'para',
  'amazonas', 'acre', 'alagoas', 'amapa', 'paraiba', 'piaui',
  'riograndedonorte', 'rondonia', 'roraima', 'sergipe', 'tocantins',
]

const MODALITY_PAGES = [
  'ultramaratona', 'meiamaratona', 'maratona', 'trailrun',
  'multiesportes', 'backyard', 'revezamento',
]

function parseEvents($: cheerio.CheerioAPI, stateSlug: string): ScrapedRace[] {
  const races: ScrapedRace[] = []
  const stateUF = STATE_MAP[stateSlug] ?? stateSlug.toUpperCase().substring(0, 2)

  // BQC uses article elements or .event-item / .post type elements
  // Try multiple selector patterns for robustness
  const selectors = [
    'article.type-post',
    'article.type-evento',
    '.event-item',
    '.entry',
    'article',
  ]

  let itemSelector = 'article'
  for (const sel of selectors) {
    if ($(sel).length > 0) {
      itemSelector = sel
      break
    }
  }

  $(itemSelector).each((_, el) => {
    try {
      const $el = $(el)

      const name =
        $el.find('h2 a, h3 a, .entry-title a, .event-title a').first().text().trim() ||
        $el.find('h2, h3, .entry-title, .event-title').first().text().trim()

      if (!name || name.length < 5) return

      const dateText =
        $el.find('.event-date, .date, time, .data, .quando').first().text().trim() ||
        $el.find('[class*="date"], [class*="data"]').first().text().trim()

      const date = parseBrazilianDate(dateText)
      if (!date) return

      const cityText =
        $el.find('.event-location, .city, .local, .cidade, .onde').first().text().trim() ||
        $el.find('[class*="local"], [class*="city"], [class*="cidade"]').first().text().trim()

      const distText =
        $el.find('.distances, .distancias, .percurso, [class*="dist"]').first().text().trim() ||
        $el.find('p').filter((_, p) => /km/i.test($(p).text())).first().text().trim()

      const link =
        $el.find('h2 a, h3 a, .entry-title a, a.more-link').first().attr('href') || ''

      const organizer = $el.find('.organizer, .organizador').first().text().trim()

      races.push({
        name,
        date,
        city: cityText || 'A confirmar',
        state: stateUF,
        distances: distText || 'A confirmar',
        type: inferRaceType(name, distText),
        organizer: organizer || undefined,
        website: link ? (link.startsWith('http') ? link : `${BASE}${link}`) : undefined,
        sourceUrl: '',
        source: 'brasilquecorre',
      })
    } catch {
      // skip malformed item
    }
  })

  return races
}

export async function scrapeBrasilQueCorre(
  log: (msg: string) => void
): Promise<ScrapedRace[]> {
  const all: ScrapedRace[] = []
  const seen = new Set<string>()

  const pages = [
    ...STATE_PAGES.map((s) => ({ slug: s, url: `${BASE}/${s}` })),
    ...MODALITY_PAGES.map((m) => ({ slug: m, url: `${BASE}/${m}` })),
  ]

  for (const { slug, url } of pages) {
    try {
      log(`  Fetching ${url}`)
      const $ = await fetchHtml(url)
      const races = parseEvents($, slug)
      let added = 0

      for (const r of races) {
        const key = `${r.name}|${r.date.toISOString().substring(0, 10)}|${r.state}`
        if (!seen.has(key)) {
          seen.add(key)
          r.sourceUrl = url
          all.push(r)
          added++
        }
      }

      log(`  → ${races.length} found, ${added} unique from ${slug}`)
    } catch (err: any) {
      log(`  ⚠ Error scraping ${url}: ${err.message}`)
    }
    await sleep(1500)
  }

  return all
}
