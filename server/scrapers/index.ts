import { ScrapedRace } from './types'
import { scrapeBrasilQueCorre } from './brasilQueCorre'
import { scrapeCorridasDeRuaRS } from './corridasDeRuaRS'
import { scrapeAudaxFloripa } from './audaxFloripa'
import { scrapeContraRelogio } from './contraRelogio'
import { scrapeTicketSports } from './ticketSports'

export type ScraperKey =
  | 'brasilquecorre'
  | 'corridasderuars'
  | 'audaxfloripa'
  | 'contrarelogio'
  | 'ticketsports'

export const SCRAPERS: Record<
  ScraperKey,
  { name: string; fn: (log: (m: string) => void) => Promise<ScrapedRace[]> }
> = {
  brasilquecorre: { name: 'Brasil Que Corre', fn: scrapeBrasilQueCorre },
  corridasderuars: { name: 'Corridas de Rua RS', fn: scrapeCorridasDeRuaRS },
  audaxfloripa: { name: 'Audax Floripa', fn: scrapeAudaxFloripa },
  contrarelogio: { name: 'Contra Relógio', fn: scrapeContraRelogio },
  ticketsports: { name: 'Ticket Sports', fn: scrapeTicketSports },
}

export { ScrapedRace }
