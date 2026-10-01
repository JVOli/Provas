import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type RaceTier = 'NONE' | 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'SUGGESTION'
export type RaceStatus = 'NOT_REGISTERED' | 'REGISTERED' | 'COMPLETED' | 'DNS' | 'DNF' | 'CANCELLED'
export type RaceType =
  | 'CORRIDA' | 'TRAIL' | 'ULTRA' | 'TRIATHLON' | 'DUATHLON'
  | 'AQUATHLON' | 'BACKYARD' | 'REVEZAMENTO' | 'OCR' | 'OUTROS'

export interface Race {
  id: string
  name: string
  date: string
  dateEnd?: string | null
  city: string
  state: string
  country: string
  distances: string
  type: RaceType
  terrain?: string | null
  organizer?: string | null
  website?: string | null
  tier: RaceTier
  myDistance?: string | null
  notes?: string | null
  status: RaceStatus
  source?: string | null
  sourceUrl?: string | null
  elevation?: string | null
  resultTime?: string | null
  resultOverall?: string | null
  resultCategory?: string | null
  resultCategoryName?: string | null
  resultUrl?: string | null
  createdAt: string
  updatedAt: string
}

export const TIER_LABELS: Record<RaceTier, string> = {
  NONE: 'Sem prioridade',
  PRIMARY: 'Prova A',
  SECONDARY: 'Prova B',
  TERTIARY: 'Prova C',
  SUGGESTION: 'Sugestão',
}

export const TIER_MARK: Record<RaceTier, string> = {
  PRIMARY: 'A',
  SECONDARY: 'B',
  TERTIARY: 'C',
  SUGGESTION: 'S',
  NONE: '·',
}

/** Marcador (quadradinho) por prioridade. */
export const TIER_MARK_STYLE: Record<RaceTier, string> = {
  PRIMARY: 'bg-navy-800 text-white border-navy-800',
  SECONDARY: 'bg-navy-500 text-white border-navy-500',
  TERTIARY: 'bg-navy-100 text-navy-800 border-navy-200',
  SUGGESTION: 'bg-white text-ink-700 border-navy-200',
  NONE: 'bg-white text-ink-300 border-ink-100',
}

/** Peso e cor do nome da prova por prioridade. */
export const TIER_NAME_STYLE: Record<RaceTier, string> = {
  PRIMARY: 'font-semibold text-ink-900',
  SECONDARY: 'font-semibold text-ink-900',
  TERTIARY: 'font-medium text-ink-900',
  SUGGESTION: 'font-normal text-ink-700',
  NONE: 'font-normal text-ink-500',
}

/** Chip da grade mensal por prioridade. */
export const TIER_CHIP_STYLE: Record<RaceTier, string> = {
  PRIMARY: 'bg-navy-800 text-white border-navy-800',
  SECONDARY: 'bg-navy-500 text-white border-navy-500',
  TERTIARY: 'bg-navy-100 text-navy-800 border-navy-200',
  SUGGESTION: 'bg-white text-ink-700 border-navy-200',
  NONE: 'bg-white text-ink-500 border-ink-100',
}

export const SEASON_TIERS: RaceTier[] = ['PRIMARY', 'SECONDARY', 'TERTIARY']

export const STATUS_LABELS: Record<RaceStatus, string> = {
  NOT_REGISTERED: 'Não inscrito',
  REGISTERED: 'Inscrito',
  COMPLETED: 'Concluída',
  DNS: 'Não largou (DNS)',
  DNF: 'Não completou (DNF)',
  CANCELLED: 'Cancelada',
}

export const STATUS_SHORT: Record<RaceStatus, string> = {
  NOT_REGISTERED: 'Não inscrito',
  REGISTERED: 'Inscrito',
  COMPLETED: 'Concluída',
  DNS: 'DNS',
  DNF: 'DNF',
  CANCELLED: 'Cancelada',
}

export const STATUS_BADGE: Record<RaceStatus, string> = {
  NOT_REGISTERED: 'bg-white text-ink-500 border border-ink-100',
  REGISTERED: 'bg-forest-bg text-forest',
  COMPLETED: 'bg-navy-800 text-white',
  DNS: 'bg-mostarda-bg text-mostarda',
  DNF: 'bg-bordeaux-bg text-bordeaux',
  CANCELLED: 'bg-mist text-ink-700',
}

export const TYPE_LABELS: Record<RaceType, string> = {
  CORRIDA: 'Corrida',
  TRAIL: 'Trail',
  ULTRA: 'Ultra',
  TRIATHLON: 'Triathlon',
  DUATHLON: 'Duathlon',
  AQUATHLON: 'Aquathlon',
  BACKYARD: 'Backyard',
  REVEZAMENTO: 'Revezamento',
  OCR: 'OCR',
  OUTROS: 'Outros',
}

export const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const PRIORITY_STATES = ['RS', 'SC', 'MA']

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...opts,
  })
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, { day: '2-digit', month: 'short' })
}

export function getMonthYear(dateStr: string): string {
  return formatDate(dateStr, { month: 'long', year: 'numeric' })
}

export function getDayOfWeek(dateStr: string): string {
  return formatDate(dateStr, { weekday: 'short' })
}

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const MONTHS_LONG = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** YYYY-MM-DD no fuso de São Paulo. */
export function spDay(isoDate: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoDate))
}

export function todaySp(): string {
  return spDay(new Date())
}

/** Diferença em dias entre duas datas YYYY-MM-DD. */
export function diffDays(from: string, to: string): number {
  const f = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10))
  const t = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10))
  return Math.round((t - f) / 86400000)
}

/** 22/nov/2026 */
export function formatDateBr(isoDate: string): string {
  const d = spDay(isoDate)
  return `${d.slice(8, 10)}/${MONTHS_SHORT[+d.slice(5, 7) - 1]}/${d.slice(0, 4)}`
}

export function weekdayLong(isoDate: string): string {
  return formatDate(isoDate, { weekday: 'long' })
}

export function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Tempo h:mm:ss ou m:ss em segundos; null se não parseável. */
export function parseDuration(t?: string | null): number | null {
  if (!t) return null
  const parts = t.trim().split(':').map(Number)
  if (parts.some((n) => Number.isNaN(n)) || parts.length < 2 || parts.length > 3) return null
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}

export function formatPace(seconds: number, km: number): string {
  const pace = Math.round(seconds / km)
  return `${Math.floor(pace / 60)}:${String(pace % 60).padStart(2, '0')}/km`
}

/** Distância em km a partir de "42 km", "21,1km", etc. */
export function parseKm(d?: string | null): number | null {
  if (!d) return null
  const m = d.match(/(\d+(?:[.,]\d+)?)\s*km/i)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

/** Primeiro número de "98º de 610". */
export function parseRank(r?: string | null): number | null {
  if (!r) return null
  const m = r.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}
