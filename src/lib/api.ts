import axios from 'axios'
import { Race } from './utils'

const api = axios.create({ baseURL: '/api' })

export interface RacesResponse {
  data: Race[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface RaceFilters {
  state?: string
  type?: string
  tier?: string
  status?: string
  month?: number
  year?: number
  from?: string
  to?: string
  search?: string
  sort?: 'date' | 'name'
  page?: number
  limit?: number
}

export const racesApi = {
  list: (filters: RaceFilters = {}) => {
    const params: Record<string, string | number> = {}
    if (filters.state) params.state = filters.state
    if (filters.type) params.type = filters.type
    if (filters.tier) params.tier = filters.tier
    if (filters.status) params.status = filters.status
    if (filters.month) params.month = filters.month
    if (filters.year) params.year = filters.year
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    if (filters.search) params.search = filters.search
    if (filters.sort) params.sort = filters.sort
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit
    return api.get<RacesResponse>('/races', { params })
  },

  get: (id: string) => api.get<Race>(`/races/${id}`),

  create: (data: Partial<Race>) => api.post<Race>('/races', data),

  update: (id: string, data: Partial<Race>) => api.put<Race>(`/races/${id}`, data),

  delete: (id: string) => api.delete(`/races/${id}`),

  setTier: (id: string, tier: string) =>
    api.patch<Race>(`/races/${id}/tier`, { tier }),

  setStatus: (id: string, status: string) =>
    api.patch<Race>(`/races/${id}/status`, { status }),
}

export const scraperApi = {
  sources: () => api.get<{ key: string; name: string }[]>('/scraper/sources'),
  status: () =>
    api.get<{
      running: boolean
      lastRun: string | null
      lastSource: string | null
      stats: { inserted: number; updated: number; skipped: number; errors: string[] } | null
      log: string[]
    }>('/scraper/status'),
  runAll: () => api.post('/scraper/run'),
  runOne: (source: string) => api.post(`/scraper/run/${source}`),
}

export const statsApi = {
  get: () =>
    api.get<{
      totalRaces: number
      byType: { type: string; count: number }[]
      byState: { state: string; count: number }[]
      byTier: { tier: string; count: number }[]
      byStatus: { status: string; count: number }[]
      byMonth: { month: string; count: number }[]
    }>('/stats'),
}
