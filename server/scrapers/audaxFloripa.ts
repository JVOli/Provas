/**
 * Scraper: Audax Floripa (audaxfloripa.com.br)
 * Scrapes cards from temporada page (2026) with race details.
 */
import type { CheerioAPI } from 'cheerio'
import { ScrapedRace } from './types'
import { fetchHtml, parseBrazilianDate, sleep } from './utils'

const BASE = 'https://audaxfloripa.com.br'
const SEASON_PAGE = '/brevets/temporada-2026/'

function inferCityFromTitle(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('urubici')) return 'Urubici'
  if (t.includes('volta à ilha') || t.includes('volta a ilha')) return 'Florianópolis'
  return 'Florianópolis'
}

function normalizeSummaryText(raw: string): string {
  return raw
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseCardEvents($: CheerioAPI, sourceUrl: string): ScrapedRace[] {
  const races: ScrapedRace[] = []

  $('.et_pb_post').each((_, el) => {
    try {
      const $el = $(el)
      const name =
        $el.find('.entry-title a, h2 a, h3 a').first().text().trim() ||
        $el.find('.entry-title, h2, h3').first().text().trim()
      if (!name || name.length < 4) return

      const summaryRaw =
        $el.find('.post-content .post-content-inner, .post-content p, .entry-content p')
          .first().text() ||
        $el.text()
      const summary = normalizeSummaryText(summaryRaw)

      const dateRaw = summary.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1] || ''
      const date = parseBrazilianDate(dateRaw)
      if (!date) return
      const distMatches = Array.from(summary.matchAll(/(\d{2,4})\s*km/gi)).map((m) => `${m[1]}km`)
      const uniqueDistances = Array.from(new Set(distMatches))
      const distances = uniqueDistances.length > 0 ? uniqueDistances.join(', ') : 'A confirmar'

      const elevMatches = Array.from(summary.matchAll(/(?:\+?\s*\d{2,5}\s*m(?:\s*D\+)?)|(?:\+\d{2,5}m)/gi))
        .map((m) => m[0].replace(/\s+/g, ' ').trim())
      const elevation = elevMatches.length > 0 ? Array.from(new Set(elevMatches)).join(' / ') : undefined

      const link =
        $el.find('.entry-title a, .et_pb_image_container a').first().attr('href') ||
        undefined

      races.push({
        name: name.replace(/\s+/g, ' ').trim(),
        date,
        city: inferCityFromTitle(name),
        state: 'SC',
        distances,
        type: 'OUTROS',
        terrain: 'asfalto/misto',
        elevation,
        website: link,
        sourceUrl,
        source: 'audaxfloripa',
      })
    } catch {
      // skip
    }
  })

  return races
}

export async function scrapeAudaxFloripa(
  log: (msg: string) => void
): Promise<ScrapedRace[]> {
  const all: ScrapedRace[] = []
  const seen = new Set<string>()
  const url = `${BASE}${SEASON_PAGE}`
  try {
    log(`  Fetching ${url}`)
    const $ = await fetchHtml(url)
    const races = parseCardEvents($, url)
    let added = 0

    for (const r of races) {
      const key = `${r.name}|${r.date.toISOString().substring(0, 10)}`
      if (!seen.has(key)) {
        seen.add(key)
        all.push(r)
        added++
      }
    }

    log(`  → ${races.length} found, ${added} unique from temporada-2026`)
  } catch (err: any) {
    log(`  ⚠ Error scraping ${url}: ${err.message}`)
  }
  await sleep(1200)

  return all
}
