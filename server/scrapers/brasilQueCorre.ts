/**
 * Scraper: Brasil Que Corre (brasilquecorre.com)
 * Scrapes race listings for all states and main modalities.
 *
 * NOTE: Selectors are based on common WordPress-style event listing patterns.
 * If the site changes structure, update the selectors in parseEventList().
 */
import type { CheerioAPI } from 'cheerio'
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

function normalizeTextForDedup(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeWebsiteForDedup(url?: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/\/+$/, '')
    return `${host}${path}`.toLowerCase()
  } catch {
    return normalizeTextForDedup(url)
  }
}

function parseEvents($: CheerioAPI, stateSlug: string): ScrapedRace[] {
  const races: ScrapedRace[] = []
  const stateUF = STATE_MAP[stateSlug] ?? stateSlug.toUpperCase().substring(0, 2)

  // Novo layout do site: cada evento fica em ".cs-box" com um ".cs-text-widget .text-editor"
  const newLayoutBoxes = $('.cs-box')
  if (newLayoutBoxes.length > 0) {
    newLayoutBoxes.each((_, el) => {
      try {
        const $box = $(el)
        const $editor = $box.find('.cs-text-widget .text-editor').first()
        if ($editor.length === 0) return

        const name =
          $editor.find('h1 a, h2 a, h3 a, h4 a, h5 a').first().text().trim() ||
          $editor.find('h1, h2, h3, h4, h5').first().text().trim()
        if (!name || name.length < 4) return

        const paragraphLines = $editor
          .find('p')
          .map((__, p) => $(p).text().replace(/\s+/g, ' ').trim())
          .get()
          .filter((line) => !!line && line !== '\u00a0')

        const dateRaw = paragraphLines.find((line) =>
          /\d{1,2}\s+de\s+[a-zçãéíóúâêôà]+\s+de\s+\d{4}/i.test(line) || /\d{1,2}\/\d{1,2}\/\d{4}/.test(line)
        ) || ''
        const date = parseBrazilianDate(dateRaw)
        if (!date) return

        const distText = paragraphLines.find((line) => /\d+\s*km/i.test(line)) || 'A confirmar'

        const cityCandidate = paragraphLines.find((line) => {
          const l = line.toLowerCase()
          if (line === dateRaw || line === distText) return false
          if (/\d+\s*km/i.test(line)) return false
          if (l.includes('corrida') || l.includes('trail') || l.includes('ultra')) return false
          if (line.length > 40) return false
          return true
        }) || ''

        const city = cityCandidate || 'A confirmar'

        const link =
          $editor.find('a').first().attr('href') ||
          $box.find('.cs-image-widget a').first().attr('href') ||
          ''

        races.push({
          name,
          date,
          city,
          state: stateUF,
          distances: distText,
          type: inferRaceType(name, distText),
          website: link ? (link.startsWith('http') ? link : `${BASE}${link}`) : undefined,
          sourceUrl: '',
          source: 'brasilquecorre',
        })
      } catch {
        // skip malformed item
      }
    })

    if (races.length > 0) return races
  }

  // Fallback legado (estrutura antiga)
  $('article.type-post, article.type-evento, .event-item, .entry, article').each((_, el) => {
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
  const seenByIdentity = new Set<string>()
  const seenByWebsite = new Set<string>()

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
        const dateKey = r.date.toISOString().substring(0, 10)
        const nameKey = normalizeTextForDedup(r.name)
        const cityKey = normalizeTextForDedup(r.city || '')
        const identityKey = `${nameKey}|${dateKey}|${r.state}|${cityKey}`
        const websiteKey = normalizeWebsiteForDedup(r.website)

        if (seenByIdentity.has(identityKey)) continue
        if (websiteKey && seenByWebsite.has(websiteKey)) continue

        seenByIdentity.add(identityKey)
        if (websiteKey) seenByWebsite.add(websiteKey)
        r.sourceUrl = url
        all.push(r)
        added++
      }

      log(`  → ${races.length} found, ${added} unique from ${slug}`)
    } catch (err: any) {
      log(`  ⚠ Error scraping ${url}: ${err.message}`)
    }
    await sleep(1500)
  }

  return all
}
