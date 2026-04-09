/**
 * Scraper: Audax Floripa (audaxfloripa.com.br)
 * Scrapes BRM 200/300/400/600km brevet events.
 */
import type { CheerioAPI } from 'cheerio'
import { ScrapedRace } from './types'
import { fetchHtml, parseBrazilianDate, sleep } from './utils'

const BASE = 'https://audaxfloripa.com.br'
const PAGES = ['/brevets/temporada-2026/', '/brevets/', '/']

function parseEvents($: CheerioAPI, sourceUrl: string): ScrapedRace[] {
  const races: ScrapedRace[] = []

  // Audax sites often use tables or simple list structures
  $('table tr, .brevet-item, article, .event, li').each((_, el) => {
    try {
      const $el = $(el)
      const text = $el.text()

      const distMatch = text.match(/BRM\s*(\d{3,4})\s*km/i) ||
        text.match(/(\d{3,4})\s*km/)

      if (!distMatch) return

      const distKm = distMatch[1]
      const nameMatch = text.match(/BRM[^,\n]*/i)
      const name = nameMatch ? nameMatch[0].trim() : `Audax BRM ${distKm}km`

      const dateRaw = $el.find('td, .date, time').first().text().trim() || text
      const date = parseBrazilianDate(dateRaw)
      if (!date) return

      const elevText = $el.find('[class*="altim"], [class*="elev"]').first().text().trim() ||
        (text.match(/(\d+\.?\d*)\s*m/i)?.[0] ?? undefined)

      races.push({
        name,
        date,
        city: 'Florianópolis',
        state: 'SC',
        distances: `${distKm}km`,
        type: 'OUTROS',
        terrain: 'asfalto/misto',
        elevation: elevText || undefined,
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

  for (const page of PAGES) {
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
      if (races.length > 0) break // Found events, stop trying fallback pages
    } catch (err: any) {
      log(`  ⚠ Error scraping ${url}: ${err.message}`)
    }
    await sleep(1500)
  }

  return all
}
