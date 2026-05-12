import axios from 'axios'
import * as cheerio from 'cheerio'
import { ScrapedRace } from './types'
import { sleep } from './utils'

const BASE = 'https://www.ironman.com'
const TIMEOUT = 30000

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
}

const ENGLISH_MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

function parseEnglishDate(raw: string): Date | null {
  if (!raw) return null
  const s = raw.trim()

  const m = s.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/)
  if (m) {
    const month = ENGLISH_MONTHS[m[1].toLowerCase()]
    if (month !== undefined) {
      return new Date(Date.UTC(parseInt(m[3]), month, parseInt(m[2]), 12, 0, 0))
    }
  }

  const m2 = s.match(/(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})/)
  if (m2) {
    const month = ENGLISH_MONTHS[m2[2].toLowerCase()]
    if (month !== undefined) {
      return new Date(Date.UTC(parseInt(m2[3]), month, parseInt(m2[1]), 12, 0, 0))
    }
  }

  return null
}

function inferDistances(name: string): string {
  const t = name.toLowerCase()
  if (t.includes('70.3')) return '1.9km swim / 90km bike / 21.1km run'
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

interface LeafletFeature {
  entity_id: string
  lat: number
  lon: number
  icon?: { iconUrl?: string }
}

function extractLeafletFeatures(html: string): LeafletFeature[] {
  const match = html.match(/drupalSettings\s*[=,]\s*(\{[\s\S]*?\})\s*[;\n]/)
  if (!match) return []

  try {
    const settings = JSON.parse(match[1])
    const leafletMap = settings?.leaflet
    if (!leafletMap) return []

    const features: LeafletFeature[] = []
    for (const mapKey of Object.keys(leafletMap)) {
      const mapData = leafletMap[mapKey]
      if (mapData?.features && Array.isArray(mapData.features)) {
        for (const f of mapData.features) {
          if (f.entity_id && f.lat && f.lon) {
            features.push({
              entity_id: String(f.entity_id),
              lat: f.lat,
              lon: f.lon,
              icon: f.icon,
            })
          }
        }
      }
    }
    return features
  } catch {
    return []
  }
}

function parsePopupCard(html: string, entityId: string): ScrapedRace | null {
  const $ = cheerio.load(html)

  const name = $('div.heading-area h2, h2').first().text().trim()
    || $('[class*="title"] h2, h2').first().text().trim()
  if (!name || name.length < 4) return null

  const dateRaw = $('span.date').first().text().trim()
  const date = parseEnglishDate(dateRaw)
  if (!date) return null

  const locationText = $('div.country-flag-formatter span.label').first().text().trim()
    || $('div.location span.label').first().text().trim()
    || $('div.location').first().text().trim()
  const { city, country } = parseLocation(locationText)

  const link = $('a[href*="/races/"]').first().attr('href') || ''

  const attrs: string[] = []
  $('div.icon-field-item').each((_, attrEl) => {
    const label = $(attrEl).find('span.icon-field-label').text().trim()
    const value = $(attrEl).find('span.icon-field-value').text().trim()
    if (label && value) attrs.push(`${label}: ${value}`)
  })

  return {
    name,
    date,
    city: city || 'A confirmar',
    state: country || 'INT',
    distances: inferDistances(name),
    type: 'TRIATHLON',
    terrain: attrs.join(' | ') || undefined,
    website: link ? (link.startsWith('http') ? link : `${BASE}${link}`) : `${BASE}/races`,
    sourceUrl: `${BASE}/races`,
    source: 'ironman',
  }
}

function parseCardsFromHtml($: cheerio.CheerioAPI): ScrapedRace[] {
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

      const attrs: string[] = []
      $el.find('div.icon-field-item').each((_, attrEl) => {
        const label = $(attrEl).find('span.icon-field-label').text().trim()
        const value = $(attrEl).find('span.icon-field-value').text().trim()
        if (label && value) attrs.push(`${label}: ${value}`)
      })

      races.push({
        name,
        date,
        city: city || 'A confirmar',
        state: country || 'INT',
        distances: inferDistances(name),
        type: 'TRIATHLON',
        terrain: attrs.join(' | ') || undefined,
        website: link ? `${BASE}${link}` : `${BASE}/races`,
        sourceUrl: `${BASE}/races`,
        source: 'ironman',
      })
    } catch {
      // skip
    }
  })

  return races
}

async function fetchPopupCard(entityId: string): Promise<string | null> {
  try {
    const { data } = await axios.get(
      `${BASE}/leaflet-ajax-popup/node/${entityId}/card/en`,
      { headers: HEADERS, timeout: TIMEOUT }
    )
    return typeof data === 'string' ? data : null
  } catch {
    return null
  }
}

export async function scrapeIronman(
  log: (msg: string) => void
): Promise<ScrapedRace[]> {
  const all: ScrapedRace[] = []
  const seen = new Set<string>()

  function addRace(r: ScrapedRace): boolean {
    const key = `${r.name}|${r.date.toISOString().substring(0, 10)}`
    if (seen.has(key)) return false
    seen.add(key)
    all.push(r)
    return true
  }

  log(`  Fetching ${BASE}/races`)
  const { data: mainHtml } = await axios.get(`${BASE}/races`, {
    headers: HEADERS,
    timeout: TIMEOUT,
  })

  const $main = cheerio.load(mainHtml)
  const initialCards = parseCardsFromHtml($main)
  for (const r of initialCards) addRace(r)
  log(`  → ${initialCards.length} races from initial HTML`)

  const features = extractLeafletFeatures(mainHtml)
  log(`  → ${features.length} race markers found in map data`)

  if (features.length > 0) {
    const existingIds = new Set<string>()

    let fetched = 0
    let errors = 0
    const batchSize = 5

    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(f => fetchPopupCard(f.entity_id))
      )

      for (let j = 0; j < results.length; j++) {
        const html = results[j]
        const feature = batch[j]
        if (!html) { errors++; continue }

        const race = parsePopupCard(html, feature.entity_id)
        if (race) {
          if (addRace(race)) fetched++
        }
      }

      if (i % 25 === 0 && i > 0) {
        log(`  → Progress: ${i}/${features.length} popups fetched (${fetched} new races)`)
      }

      await sleep(500)
    }

    log(`  → Popup fetch complete: ${fetched} new, ${errors} errors out of ${features.length} markers`)
  } else {
    log(`  → No map data found, falling back to HTML pagination`)
    for (let page = 1; page <= 30; page++) {
      const url = `${BASE}/races?page=${page}`
      try {
        log(`  Fetching ${url}`)
        const { data } = await axios.get(url, { headers: HEADERS, timeout: TIMEOUT })
        const $ = cheerio.load(data)
        const races = parseCardsFromHtml($)

        if (races.length === 0) {
          log(`  → No more races, stopping`)
          break
        }

        let added = 0
        for (const r of races) { if (addRace(r)) added++ }
        log(`  → ${races.length} found, ${added} unique from page ${page}`)
      } catch (err: any) {
        log(`  ⚠ Error on page ${page}: ${err.message}`)
      }
      await sleep(2000)
    }
  }

  return all
}
