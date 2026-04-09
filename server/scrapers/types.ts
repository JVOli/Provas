export interface ScrapedRace {
  name: string
  date: Date
  dateEnd?: Date
  city: string
  state: string
  distances: string
  type: string
  terrain?: string
  organizer?: string
  website?: string
  sourceUrl?: string
  source: string
  elevation?: string
}
