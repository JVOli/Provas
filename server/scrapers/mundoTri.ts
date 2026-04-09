/**
 * Scraper: Mundo Tri (mundotri.com.br/calendar)
 * Prioriza dados de scripts/API e usa Puppeteer como fallback
 * para páginas com conteúdo dinâmico carregado por JavaScript.
 */
import axios from 'axios'
import puppeteer from 'puppeteer'
import { ScrapedRace } from './types'
import { fetchHtml, parseBrazilianDate, inferRaceType } from './utils'

const URL = 'https://www.mundotri.com.br/calendar'

type MundoTriRow = [string, string, string, string?, string?, string?]

function parseModalidade(mod: string): string {
  const m = (mod || '').toLowerCase()
  if (m.includes('triathlon') || m.includes('tri ') || m === 'tri') return 'TRIATHLON'
  if (m.includes('duathlon')) return 'DUATHLON'
  if (m.includes('aquathlon')) return 'AQUATHLON'
  if (m.includes('trail')) return 'TRAIL'
  if (m.includes('corrida') || m.includes('running')) return 'CORRIDA'
  return inferRaceType(mod, '')
}

function buildRaceFromRow(row: MundoTriRow): ScrapedRace | null {
  if (!Array.isArray(row) || row.length < 3) return null

  const [dateStr, name, modality, city = '', state = '', country = 'Brasil'] = row

  // Mantém apenas provas do Brasil
  if (country && country !== 'Brasil') return null

  const date = parseBrazilianDate(dateStr || '')
  if (!date) return null
  if (!name || name.trim().length < 3) return null

  return {
    name: name.trim(),
    date,
    city: city.trim() || 'A confirmar',
    state: state.trim() || 'BR',
    distances: 'A confirmar',
    type: parseModalidade(modality || ''),
    sourceUrl: URL,
    source: 'mundotri',
  }
}

function parseRowsFromScripts(scriptBodies: string[]): MundoTriRow[] {
  const rows: MundoTriRow[] = []

  for (const src of scriptBodies) {
    if (!src || (!src.includes('arData') && !src.includes('data:'))) continue
    const matches = src.match(/data\s*:\s*(\[\s*\[[\s\S]*?\]\s*\])/g)
    if (!matches) continue

    for (const block of matches) {
      const arrStr = block.replace(/^data\s*:\s*/, '')
      try {
        const parsed = JSON.parse(arrStr) as MundoTriRow[]
        rows.push(...parsed)
      } catch {
        // ignora bloco inválido
      }
    }
  }

  return rows
}

async function fetchRowsFromHtml(log: (msg: string) => void): Promise<MundoTriRow[]> {
  log('  Fetching HTML (tentativa sem browser)')
  const $ = await fetchHtml(URL)
  const scripts: string[] = []
  $('script').each((_, el) => {
    scripts.push($(el).html() || '')
  })
  return parseRowsFromScripts(scripts)
}

async function fetchRowsWithPuppeteer(log: (msg: string) => void): Promise<MundoTriRow[]> {
  log('  Renderizando página com Puppeteer')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
    )
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Espera conteúdo dinâmico e scripts finais do calendário
    await page.waitForNetworkIdle({ idleTime: 1200, timeout: 20000 }).catch(() => undefined)
    await page.waitForSelector('script', { timeout: 10000 }).catch(() => undefined)

    const rows = await page.evaluate(() => {
      const doc = (globalThis as any).document as any
      const scripts = Array.from(doc.querySelectorAll('script') as any[])
        .map((s: any) => s.textContent || '')
      const parsed: Array<[string, string, string, string?, string?, string?]> = []

      for (const src of scripts) {
        if (!src || (!src.includes('arData') && !src.includes('data:'))) continue
        const matches = src.match(/data\s*:\s*(\[\s*\[[\s\S]*?\]\s*\])/g)
        if (!matches) continue

        for (const block of matches) {
          const arrStr = block.replace(/^data\s*:\s*/, '')
          try {
            const arr = JSON.parse(arrStr) as Array<[string, string, string, string?, string?, string?]>
            parsed.push(...arr)
          } catch {
            // ignora bloco inválido
          }
        }
      }

      return parsed
    })

    return rows
  } finally {
    await browser.close()
  }
}

async function tryFetchRowsFromApi(log: (msg: string) => void): Promise<MundoTriRow[]> {
  const candidates = [
    'https://www.mundotri.com.br/wp-json/wp/v2/calendar',
    'https://www.mundotri.com.br/wp-json/wp/v2/events',
  ]

  for (const apiUrl of candidates) {
    try {
      log(`  Testando API interna: ${apiUrl}`)
      const { data } = await axios.get(apiUrl, { timeout: 10000 })
      if (!Array.isArray(data)) continue

      const rows: MundoTriRow[] = []
      for (const item of data) {
        const date = item?.date || item?.event_date || item?.data
        const name = item?.title?.rendered || item?.name || item?.title
        const modality = item?.modality || item?.type || 'Triathlon'
        const city = item?.city || item?.cidade || ''
        const state = item?.state || item?.uf || ''
        const country = item?.country || item?.pais || 'Brasil'
        if (date && name) rows.push([String(date), String(name), String(modality), String(city), String(state), String(country)])
      }

      if (rows.length > 0) {
        log(`  API retornou ${rows.length} registros`)
        return rows
      }
    } catch {
      // segue para próximo endpoint
    }
  }

  return []
}

export async function scrapeMundoTri(log: (msg: string) => void): Promise<ScrapedRace[]> {
  const rowsFromApi = await tryFetchRowsFromApi(log)
  const rowsFromHtml = rowsFromApi.length > 0 ? [] : await fetchRowsFromHtml(log)
  const rows =
    rowsFromApi.length > 0
      ? rowsFromApi
      : rowsFromHtml.length > 0
        ? rowsFromHtml
        : await fetchRowsWithPuppeteer(log)

  const races: ScrapedRace[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const race = buildRaceFromRow(row)
    if (!race) continue
    const key = `${race.name}|${race.date.toISOString().slice(0, 10)}|${race.city}|${race.state}`
    if (seen.has(key)) continue
    seen.add(key)
    races.push(race)
  }

  log(`  → ${races.length} eventos válidos do Mundo Tri`)
  return races
}
