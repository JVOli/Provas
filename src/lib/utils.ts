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
  createdAt: string
  updatedAt: string
}

export const TIER_LABELS: Record<RaceTier, string> = {
  NONE: 'Sem classificação',
  PRIMARY: 'Prova A',
  SECONDARY: 'Prova B',
  TERTIARY: 'Prova C',
  SUGGESTION: 'Sugestão',
}

export const TIER_COLORS: Record<RaceTier, string> = {
  NONE: 'border-border',
  PRIMARY: 'border-red-500',
  SECONDARY: 'border-amber-500',
  TERTIARY: 'border-blue-500',
  SUGGESTION: 'border-border',
}

export const TIER_BADGE: Record<RaceTier, string> = {
  NONE: 'bg-muted text-muted-foreground',
  PRIMARY: 'bg-red-500/20 text-red-400 border border-red-500/30',
  SECONDARY: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  TERTIARY: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  SUGGESTION: 'bg-muted text-muted-foreground border border-border',
}

export const STATUS_LABELS: Record<RaceStatus, string> = {
  NOT_REGISTERED: 'Não inscrito',
  REGISTERED: 'Inscrito',
  COMPLETED: 'Concluída',
  DNS: 'DNS',
  DNF: 'DNF',
  CANCELLED: 'Cancelada',
}

export const STATUS_BADGE: Record<RaceStatus, string> = {
  NOT_REGISTERED: 'bg-muted text-muted-foreground',
  REGISTERED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  COMPLETED: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  DNS: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  DNF: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
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
