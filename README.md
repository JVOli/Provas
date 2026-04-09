# Meu Calendário de Provas

Sistema web para gerenciar provas de corrida, trail run, ultramaratona, triathlon e duathlon no Brasil.

## Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + Vite + Tailwind CSS
- **Banco:** PostgreSQL via Prisma ORM
- **Deploy:** Railway

## Setup Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env
cp .env.example .env
# Editar DATABASE_URL com sua string de conexão PostgreSQL

# 3. Criar banco e rodar migrations
npx prisma migrate dev --name init

# 4. Popular com provas iniciais
npm run db:seed

# 5. Rodar em modo dev (frontend + backend juntos)
npm run dev
```

O frontend estará em `http://localhost:5173` e o backend em `http://localhost:3001`.

### Comandos úteis

```bash
npm run dev            # Dev: Vite + Express em paralelo
npm run build          # Build: frontend (dist/) + server (server-dist/)
npm run start          # Produção: node server-dist/index.js
npm run db:migrate     # Criar nova migration
npm run db:seed        # Popular banco com provas iniciais
npm run db:studio      # Abrir Prisma Studio
```

## Deploy no Railway

### Passos

1. **Criar projeto no Railway** em [railway.app](https://railway.app)

2. **Adicionar PostgreSQL:**
   - No projeto Railway, clicar em "+ New" → "Database" → "PostgreSQL"
   - O Railway injeta `DATABASE_URL` automaticamente

3. **Deploy via GitHub:**
   - Conectar o repositório ao Railway
   - O build é detectado automaticamente pelo `nixpacks`
   - O comando de start (`railway.json`) roda `prisma migrate deploy && npm run start`

4. **Alternativa via CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway up
   ```

5. **Seed inicial em produção:**
   ```bash
   railway run npm run db:seed
   ```

### Variáveis de Ambiente

| Variável | Descrição | Railway |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | Injetado automaticamente |
| `PORT` | Porta do servidor | Injetado automaticamente |
| `NODE_ENV` | Ambiente | Definir como `production` |

## Estrutura do Projeto

```
race-calendar/
├── prisma/
│   ├── schema.prisma       # Schema do banco
│   └── seed.ts             # Provas iniciais
├── server/
│   ├── index.ts            # Express entry point
│   ├── routes/
│   │   ├── races.ts        # CRUD /api/races
│   │   ├── scraper.ts      # /api/scraper/*
│   │   └── stats.ts        # /api/stats
│   ├── scrapers/
│   │   ├── brasilQueCorre.ts
│   │   ├── corridasDeRuaRS.ts
│   │   ├── audaxFloripa.ts
│   │   ├── contraRelogio.ts
│   │   └── ticketSports.ts
│   └── lib/
│       ├── prisma.ts       # Prisma client singleton
│       └── dedup.ts        # Lógica de deduplicação
└── src/                    # Frontend React
    ├── pages/
    │   ├── Calendar.tsx    # Página principal
    │   ├── RaceDetail.tsx  # Detalhe da prova
    │   └── Admin.tsx       # Admin + scraping
    ├── components/
    │   ├── RaceCard.tsx
    │   ├── Filters.tsx
    │   ├── MonthTimeline.tsx
    │   ├── RaceForm.tsx
    │   └── ScraperPanel.tsx
    └── lib/
        ├── api.ts          # Cliente HTTP
        └── utils.ts        # Tipos e helpers
```

## Scrapers

Os scrapers ficam em `server/scrapers/` e são executados manualmente via painel Admin.

| Scraper | Site | Método |
|---------|------|--------|
| `brasilquecorre` | brasilquecorre.com | Cheerio (HTML estático) |
| `corridasderuars` | corridasderuars.com.br | Cheerio |
| `audaxfloripa` | audaxfloripa.com.br | Cheerio |
| `contrarelogio` | contrarelogio.com.br | Cheerio |
| `ticketsports` | ticketsports.com.br | Cheerio |

> **Nota:** Os seletores CSS dos scrapers são estimativas baseadas em padrões comuns de sites de eventos.
> É provável que precisem de ajuste após inspecionar o HTML real de cada site.
> Consulte os comentários em cada arquivo `server/scrapers/*.ts`.

## Deduplicação

Ao importar provas via scraping, a lógica de deduplicação evita inserções duplicadas:
- Mesmo estado
- Data igual (±1 dia de tolerância)
- Nome normalizado igual OU distância de Levenshtein < 4

Campos editados manualmente (`tier`, `notes`, `status`, `myDistance`) **nunca** são sobrescritos pelo scraper.
