/**
 * Scraper: Randonneurs RS — calendário de brevets
 * https://randors.com.br/calendario-2026
 */
import type { CheerioAPI } from 'cheerio'
import { ScrapedRace } from './types'
import { fetchHtml, parseBrazilianDate, sleep } from './utils'

const URL = 'https://randors.com.br/calendario-2026'

function websiteFromCardOnclick(onclick: string | undefined): string | undefined {
  if (!onclick) return undefined
  const m = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/i)
  if (!m) return undefined
  const href = m[1].trim()
  if (!href.startsWith('http')) return undefined
  if (href.includes('inscricoes_fechadas.php') || href.includes('prova_realizada.php')) return undefined
  return href
}

function parseCard($: CheerioAPI, $card: any): ScrapedRace | null {
  const brmTitle = $card.find('.card-body h2').first().text().replace(/\s+/g, ' ').trim()
  if (!brmTitle || !/^BRM\d+/i.test(brmTitle)) return null

  const kmMatch = brmTitle.match(/^BRM(\d+)$/i)
  const km = kmMatch ? kmMatch[1] : brmTitle.replace(/^BRM/i, '').trim()
  const distances = km ? `${km}km` : 'A confirmar'

  let city = 'A confirmar'
  let director = ''
  $card.find('.card-body .info').each((_: number, el: any) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim()
    const sede = t.match(/^Sede:\s*(.+)$/i)
    if (sede) city = sede[1].trim()
    const dir = t.match(/^Diretor:\s*(.+)$/i)
    if (dir) director = dir[1].trim()
  })

  const dataBox = $card.find('.card-footer .data-box').first()
  const dateClone = dataBox.clone()
  dateClone.find('small').remove()
  const dateLine = dateClone.text().replace(/\s+/g, ' ').trim()

  const date = parseBrazilianDate(dateLine)
  if (!date) return null

  const onclick = $card.attr('onclick')
  const website = websiteFromCardOnclick(onclick)

  const name = `Rando RS – ${brmTitle} – ${city}`

  return {
    name,
    date,
    city,
    state: 'RS',
    distances,
    type: 'OUTROS',
    terrain: 'asfalto/misto',
    organizer: director || undefined,
    website,
    sourceUrl: URL,
    source: 'randors',
  }
}

function parseEvents($: CheerioAPI): ScrapedRace[] {
  const races: ScrapedRace[] = []
  $('.dashboard .card').each((_, el) => {
    try {
      const race = parseCard($, $(el))
      if (race) races.push(race)
    } catch {
      // skip
    }
  })
  return races
}

export async function scrapeRandors(log: (msg: string) => void): Promise<ScrapedRace[]> {
  log(`  Fetching ${URL}`)
  const $ = await fetchHtml(URL)
  const races = parseEvents($)
  const seen = new Set<string>()
  const unique: ScrapedRace[] = []
  for (const r of races) {
    const key = `${r.name}|${r.date.toISOString().substring(0, 10)}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(r)
  }
  log(`  → ${unique.length} eventos Rando RS`)
  await sleep(800)
  return unique
}
