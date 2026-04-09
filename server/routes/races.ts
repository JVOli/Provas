import { Router, Request, Response } from 'express'
import { Prisma, RaceType, RaceTier, RaceStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

export const racesRouter = Router()

// GET /api/races
racesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      state,
      type,
      tier,
      status,
      month,
      year,
      from,
      to,
      search,
      sort = 'date',
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>

    const where: Prisma.RaceWhereInput = {}

    if (state) {
      const states = state.split(',').map((s) => s.trim())
      where.state = { in: states }
    }

    if (type) {
      const types = type.split(',').map((t) => t.trim()) as RaceType[]
      where.type = { in: types }
    }

    if (tier) {
      const tiers = tier.split(',').map((t) => t.trim()) as RaceTier[]
      where.tier = { in: tiers }
    }

    if (status) {
      const statuses = status.split(',').map((s) => s.trim()) as RaceStatus[]
      where.status = { in: statuses }
    }

    if (month && year) {
      const y = parseInt(year)
      const m = parseInt(month) - 1
      const start = new Date(y, m, 1)
      const end = new Date(y, m + 1, 0, 23, 59, 59)
      where.date = { gte: start, lte: end }
    } else if (from || to) {
      where.date = {}
      if (from) (where.date as Prisma.DateTimeFilter).gte = new Date(from)
      if (to) (where.date as Prisma.DateTimeFilter).lte = new Date(to)
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const orderBy: Prisma.RaceOrderByWithRelationInput =
      sort === 'name' ? { name: 'asc' } : { date: 'asc' }

    const [races, total] = await Promise.all([
      prisma.race.findMany({ where, orderBy, skip, take: limitNum }),
      prisma.race.count({ where }),
    ])

    res.json({
      data: races,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/races/:id
racesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const race = await prisma.race.findUnique({ where: { id: req.params.id } })
    if (!race) return res.status(404).json({ error: 'Race not found' })
    res.json(race)
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/races
racesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body
    if (data.date) data.date = new Date(data.date)
    if (data.dateEnd) data.dateEnd = new Date(data.dateEnd)
    const race = await prisma.race.create({ data })
    res.status(201).json(race)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: 'Invalid data' })
  }
})

// PUT /api/races/:id
racesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = { ...req.body }
    if (data.date) data.date = new Date(data.date)
    if (data.dateEnd) data.dateEnd = new Date(data.dateEnd)
    delete data.id
    delete data.createdAt
    delete data.updatedAt
    const race = await prisma.race.update({ where: { id: req.params.id }, data })
    res.json(race)
  } catch (err) {
    res.status(400).json({ error: 'Update failed' })
  }
})

// DELETE /api/races/:id
racesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.race.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: 'Race not found' })
  }
})

// PATCH /api/races/:id/tier
racesRouter.patch('/:id/tier', async (req: Request, res: Response) => {
  try {
    const { tier } = req.body as { tier: RaceTier }
    const race = await prisma.race.update({
      where: { id: req.params.id },
      data: { tier },
    })
    res.json(race)
  } catch (err) {
    res.status(400).json({ error: 'Update failed' })
  }
})

// PATCH /api/races/:id/status
racesRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: RaceStatus }
    const race = await prisma.race.update({
      where: { id: req.params.id },
      data: { status },
    })
    res.json(race)
  } catch (err) {
    res.status(400).json({ error: 'Update failed' })
  }
})
