import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const statsRouter = Router()

statsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const [
      totalRaces,
      byType,
      byState,
      byTier,
      byStatus,
      byMonth,
    ] = await Promise.all([
      prisma.race.count(),
      prisma.race.groupBy({ by: ['type'], _count: { _all: true } }),
      prisma.race.groupBy({ by: ['state'], _count: { _all: true }, orderBy: { _count: { state: 'desc' } } }),
      prisma.race.groupBy({ by: ['tier'], _count: { _all: true } }),
      prisma.race.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR(date, 'YYYY-MM') as month, COUNT(*) as count
        FROM "Race"
        WHERE date >= NOW()
        GROUP BY month
        ORDER BY month ASC
        LIMIT 24
      `,
    ])

    res.json({
      totalRaces,
      byType: byType.map((r) => ({ type: r.type, count: r._count._all })),
      byState: byState.map((r) => ({ state: r.state, count: r._count._all })),
      byTier: byTier.map((r) => ({ tier: r.tier, count: r._count._all })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byMonth: byMonth.map((r) => ({ month: r.month, count: Number(r.count) })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
