import { PrismaClient, RaceType, RaceTier, RaceStatus } from '@prisma/client'

const prisma = new PrismaClient()

const seedRaces = [
  {
    name: '41ª Maratona Internacional de Porto Alegre',
    date: new Date('2026-05-31T07:00:00-03:00'),
    city: 'Porto Alegre',
    state: 'RS',
    distances: '5km, 10km, 21km, 42km',
    type: RaceType.CORRIDA,
    terrain: 'asfalto',
    tier: RaceTier.SECONDARY,
    status: RaceStatus.REGISTERED,
    source: 'manual',
    website:
      'https://corridasderuars.com.br/evento/41a-maratona-internacional-de-porto-alegre-2/',
  },
  {
    name: 'Maratona Internacional de Florianópolis - 21km',
    date: new Date('2026-06-07T07:00:00-03:00'),
    city: 'Florianópolis',
    state: 'SC',
    distances: '21km',
    type: RaceType.CORRIDA,
    terrain: 'asfalto',
    tier: RaceTier.TERTIARY,
    source: 'manual',
  },
  {
    name: 'Duathlon Gold Lake',
    date: new Date('2026-07-26T07:00:00-03:00'),
    city: 'Porto Alegre',
    state: 'RS',
    distances: '7.5km corrida + 20km bike',
    type: RaceType.DUATHLON,
    terrain: 'misto',
    tier: RaceTier.SECONDARY,
    status: RaceStatus.REGISTERED,
    source: 'manual',
  },
  {
    name: 'Desafio Internacional Rota da Baleia 80K',
    date: new Date('2026-09-12T06:00:00-03:00'),
    city: 'Laguna / Imbituba / Garopaba',
    state: 'SC',
    distances: '8km, 21km, 42km, 80km',
    type: RaceType.ULTRA,
    terrain: 'trail/praia',
    tier: RaceTier.PRIMARY,
    status: RaceStatus.REGISTERED,
    myDistance: '80km',
    notes:
      'Prova A principal! Ultra trail pela Rota da Baleia Franca. 23 praias, costões, dunas. ITRA 3*. Tempo limite: 13h.',
    source: 'manual',
    website: 'https://desafiorotadabaleia.com.br/',
  },
  {
    name: 'Meia Maratona do Mercado Público',
    date: new Date('2026-10-11T07:00:00-03:00'),
    city: 'Porto Alegre',
    state: 'RS',
    distances: '21km',
    type: RaceType.CORRIDA,
    terrain: 'asfalto',
    tier: RaceTier.TERTIARY,
    source: 'manual',
  },
  {
    name: 'TTT - Travessia Torres Tramandaí',
    date: new Date('2027-01-17T05:00:00-03:00'),
    city: 'Torres / Imbé',
    state: 'RS',
    distances: '8.3km, 21km, 42km, 84km',
    type: RaceType.ULTRA,
    terrain: 'praia',
    tier: RaceTier.PRIMARY,
    status: RaceStatus.REGISTERED,
    myDistance: '84km',
    notes:
      'Prova A principal! Ultra de 84km pela praia do Litoral Norte gaúcho. ~4000 atletas. Esgota rápido!',
    source: 'manual',
    website: 'https://www.ticketsports.com.br',
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  for (const race of seedRaces) {
    const existing = await prisma.race.findFirst({
      where: { name: race.name, date: race.date },
    })

    if (existing) {
      console.log(`⏭  Skipping (already exists): ${race.name}`)
      continue
    }

    await prisma.race.create({ data: race as any })
    console.log(`✅ Created: ${race.name}`)
  }

  console.log('✨ Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
