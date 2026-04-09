import axios from 'axios'
import * as cheerio from 'cheerio'
import https from 'https'

const MONTH_MAP: Record<string, number> = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
  janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
}

function makeDateOnlyUtc(year: number, monthZeroBased: number, day: number): Date {
  // Meio-dia UTC evita deslocamento de dia na conversão de fusos.
  return new Date(Date.UTC(year, monthZeroBased, day, 12, 0, 0, 0))
}

export function parseDateInputStable(raw: string): Date | null {
  if (!raw) return null
  const s = raw.trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    return makeDateOnlyUtc(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export function parseBrazilianDate(raw: string): Date | null {
  if (!raw) return null
  const s = raw.trim().toLowerCase()

  // dd/mm/yyyy
  const dmy = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) return makeDateOnlyUtc(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]))

  // dd de mês de yyyy
  const longPt = s.match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/)
  if (longPt) {
    const mo = MONTH_MAP[longPt[2]]
    if (mo !== undefined) return makeDateOnlyUtc(parseInt(longPt[3]), mo, parseInt(longPt[1]))
  }

  // dd mês yyyy
  const shortPt = s.match(/(\d{1,2})\s+([a-zç]+)\s+(\d{4})/)
  if (shortPt) {
    const mo = MONTH_MAP[shortPt[2].toLowerCase().substring(0, 3)]
    if (mo !== undefined) return makeDateOnlyUtc(parseInt(shortPt[3]), mo, parseInt(shortPt[1]))
  }

  // yyyy-mm-dd (ISO)
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return makeDateOnlyUtc(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]))

  // dd/mm (assume current/next year)
  const dm = s.match(/(\d{1,2})\/(\d{1,2})/)
  if (dm) {
    const now = new Date()
    let year = now.getFullYear()
    const d = makeDateOnlyUtc(year, parseInt(dm[2]) - 1, parseInt(dm[1]))
    if (d < now) year++
    return makeDateOnlyUtc(year, parseInt(dm[2]) - 1, parseInt(dm[1]))
  }

  return null
}

export const STATE_MAP: Record<string, string> = {
  riograndedosul: 'RS', santacatarina: 'SC', maranhao: 'MA', saopaulo: 'SP',
  riodejaneiro: 'RJ', minasgerais: 'MG', parana: 'PR', bahia: 'BA',
  ceara: 'CE', pernambuco: 'PE', distritofederal: 'DF', goias: 'GO',
  matogrosso: 'MT', matogrossodosul: 'MS', espiritosanto: 'ES', para: 'PA',
  amazonas: 'AM', acre: 'AC', alagoas: 'AL', amapa: 'AP', paraiba: 'PB',
  piaui: 'PI', riograndedonorte: 'RN', rondonia: 'RO', roraima: 'RR',
  sergipe: 'SE', tocantins: 'TO',
  'rio grande do sul': 'RS', 'santa catarina': 'SC', 'são paulo': 'SP',
  'rio de janeiro': 'RJ', 'minas gerais': 'MG', 'paraná': 'PR',
  'rio grande do norte': 'RN', 'mato grosso do sul': 'MS',
  'mato grosso': 'MT', 'espírito santo': 'ES',
}

export function inferRaceType(name: string, distances: string): string {
  const t = (name + ' ' + distances).toLowerCase()
  if (t.includes('triathlon') || t.includes('tri ')) return 'TRIATHLON'
  if (t.includes('duathlon')) return 'DUATHLON'
  if (t.includes('aquathlon')) return 'AQUATHLON'
  if (t.includes('ultra') || t.includes('100k') || t.includes('80k') || t.includes('84k') || t.includes('50k') || t.includes('60k')) return 'ULTRA'
  if (t.includes('trail') || t.includes('mountain') || t.includes('trilha')) return 'TRAIL'
  if (t.includes('backyard')) return 'BACKYARD'
  if (t.includes('revezamento') || t.includes('relay')) return 'REVEZAMENTO'
  if (t.includes('ocr') || t.includes('obstacle')) return 'OCR'
  return 'CORRIDA'
}

export async function fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
  return fetchHtmlWithOptions(url)
}

export async function fetchHtmlWithOptions(
  url: string,
  opts?: { allowInsecureTLS?: boolean }
): Promise<cheerio.CheerioAPI> {
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    timeout: 15000,
    ...(opts?.allowInsecureTLS
      ? {
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        }
      : {}),
  })
  return cheerio.load(data)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
