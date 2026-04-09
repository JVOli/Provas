import express from 'express'
import cors from 'cors'
import path from 'path'
import { racesRouter } from './routes/races'
import { scraperRouter } from './routes/scraper'
import { statsRouter } from './routes/stats'

const app = express()
const PORT = process.env.PORT || 3001

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? true
        : ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  })
)

app.use(express.json())

app.use('/api/races', racesRouter)
app.use('/api/scraper', scraperRouter)
app.use('/api/stats', statsRouter)

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`)
})

export default app
