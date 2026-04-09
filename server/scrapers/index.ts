import { ScrapedRace } from './types'
import { scrapeBrasilQueCorre } from './brasilQueCorre'
import { scrapeCorridasDeRuaRS } from './corridasDeRuaRS'
import { scrapeAudaxFloripa } from './audaxFloripa'
import { scrapeContraRelogio } from './contraRelogio'
import { scrapeTicketSports } from './ticketSports'
import { scrapeMundoTri } from './mundoTri'
import { scrapeRandors } from './randors'

export type ScraperKey =
  | 'brasilquecorre'
  | 'corridasderuars'
  | 'audaxfloripa'
  | 'contrarelogio'
  | 'ticketsports'
  | 'mundotri'
  | 'randors'

export const SCRAPERS: Record<
  ScraperKey,
  { name: string; fn: (log: (m: string) => void) => Promise<ScrapedRace[]> }
> = {
  brasilquecorre: { name: 'Brasil Que Corre', fn: scrapeBrasilQueCorre },
  corridasderuars: { name: 'Corridas de Rua RS', fn: scrapeCorridasDeRuaRS },
  audaxfloripa: { name: 'Audax Floripa', fn: scrapeAudaxFloripa },
  contrarelogio: { name: 'Contra Relógio', fn: scrapeContraRelogio },
  ticketsports: { name: 'Ticket Sports', fn: scrapeTicketSports },
  mundotri: { name: 'Mundo Tri', fn: scrapeMundoTri },
  randors: { name: 'Rando RS (Brevets)', fn: scrapeRandors },
}

export { ScrapedRace }
