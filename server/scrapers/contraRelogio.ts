/**
 * Scraper: Contra Relógio (contrarelogio.com.br/calendario/)
 * Scrapes the general race calendar with events from all Brazil.
 */
import type { CheerioAPI } from 'cheerio'
import { ScrapedRace } from './types'
import { fetchHtml, parseBrazilianDate, inferRaceType, STATE_MAP, sleep } from './utils'

const BASE = 'https://contrarelogio.com.br'
const PAGES = ['/calendario/', '/calendario/?page=2', '/calendario/?page=3']

function parseEvents($: CheerioAPI, sourceUrl: string): ScrapedRace[] {
  const races: ScrapedRace[] = []

  // contrarelogio.com.br uses a table or list structure per event
  $('table tr, .event-row, .race-item, article, .calendar-item').each((_, el) => {
    try {
      const $el = $(el)
      const cells = $el.find('td')

      let name = '', dateRaw = '', locationRaw = '', distText = '', link = ''

      if (cells.length >= 3) {
        // Table format: date | name | city/state | distances
        dateRaw = $(cells[0]).text().trim()
        name = $(cells[1]).text().trim()
        locationRaw = $(cells[2]).text().trim()
        distText = $(cells[3])?.text().trim() || ''
        link = $(cells[1]).find('a').attr('href') || $(cells[0]).find('a').attr('href') || ''
      } else {
        name = $el.find('h2, h3, .title, .name, a').first().text().trim()
        dateRaw = $el.find('.date, time, [class*="date"]').first().text().trim()
        locationRaw = $el.find('.city, .local, .location, [class*="city"]').first().text().trim()
        distText = $el.find('[class*="dist"]').first().text().trim()
        link = $el.find('a').first().attr('href') || ''
      }

      if (!name || name.length < 4) return

      const date = parseBrazilianDate(dateRaw)
      if (!date) return

      // Extract state from location (e.g. "São Paulo - SP" or "SP")
      let state = 'BR'
      const stateMatch = locationRaw.match(/\b([A-Z]{2})\b$/) ||
        locationRaw.match(/[-–]\s*([A-Z]{2})\s*$/)
      if (stateMatch) {
        state = stateMatch[1]
      } else {
        const normalized = locationRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        for (const [key, uf] of Object.entries(STATE_MAP)) {
          if (normalized.includes(key)) { state = uf; break }
        }
      }

      const cityPart = locationRaw.replace(/[-–]\s*[A-Z]{2}\s*$/, '').trim()

      races.push({
        name,
        date,
        city: cityPart || 'A confirmar',
        state,
        distances: distText || 'A confirmar',
        type: inferRaceType(name, distText),
        website: link ? (link.startsWith('http') ? link : `${BASE}${link}`) : undefined,
        sourceUrl,
        source: 'contrarelogio',
      })
    } catch {
      // skip
    }
  })

  return races
}

export async function scrapeContraRelogio(
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
        const key = `${r.name}|${r.date.toISOString().substring(0, 10)}|${r.state}`
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
