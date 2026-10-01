import { useQuery } from '@tanstack/react-query'
import { racesApi } from './api'
import { Race } from './utils'

/** Carrega todas as provas (todas as páginas, ordenadas por data). Filtros ficam no cliente. */
export function useRaces() {
  return useQuery({
    queryKey: ['races'],
    queryFn: async (): Promise<Race[]> => {
      const params = { sort: 'date' as const, limit: 200 }
      const first = (await racesApi.list({ ...params, page: 1 })).data
      const all = [...first.data]
      for (let p = 2; p <= first.pagination.pages; p++) {
        all.push(...(await racesApi.list({ ...params, page: p })).data.data)
      }
      return all
    },
  })
}

export const SOURCE_HOSTS: Record<string, string> = {
  brasilquecorre: 'brasilquecorre.com',
  corridasderuars: 'corridasderuars.com.br',
  audaxfloripa: 'audaxfloripa.com.br',
  contrarelogio: 'contrarelogio.com.br',
  ticketsports: 'ticketsports.com.br',
  mundotri: 'mundotri.com.br',
  randors: 'randors.com.br',
  ironman: 'ironman.com',
}
