import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Play, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { scraperApi } from '@/lib/api'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

export function ScraperPanel() {
  const qc = useQueryClient()
  const logRef = useRef<HTMLDivElement>(null)
  const [polling, setPolling] = useState(false)

  const { data: sources } = useQuery({
    queryKey: ['scraper-sources'],
    queryFn: () => scraperApi.sources().then((r) => r.data),
  })

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: () => scraperApi.status().then((r) => r.data),
    refetchInterval: polling ? 2000 : false,
  })

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [status?.log])

  // Stop polling when scraper finishes
  useEffect(() => {
    if (polling && status && !status.running) {
      setPolling(false)
      qc.invalidateQueries({ queryKey: ['races'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast.success(
        `Scraping concluído! +${status.stats?.inserted ?? 0} novas provas`
      )
    }
  }, [status?.running, polling])

  const runAll = useMutation({
    mutationFn: () => scraperApi.runAll(),
    onSuccess: () => {
      setPolling(true)
      toast.info('Scraping iniciado...')
      refetchStatus()
    },
    onError: (e: any) => {
      if (e.response?.status === 409) toast.error('Scraper já está rodando')
      else toast.error('Erro ao iniciar scraping')
    },
  })

  const runOne = useMutation({
    mutationFn: (source: string) => scraperApi.runOne(source),
    onSuccess: (_, source) => {
      setPolling(true)
      toast.info(`Scraping de "${source}" iniciado...`)
      refetchStatus()
    },
    onError: (e: any) => {
      if (e.response?.status === 409) toast.error('Scraper já está rodando')
      else toast.error('Erro ao iniciar scraping')
    },
  })

  const isRunning = status?.running || runAll.isPending || runOne.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => runAll.mutate()}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? 'Executando...' : 'Executar todos os scrapers'}
        </Button>

        {status?.lastRun && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Última execução: {new Date(status.lastRun).toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      {/* Individual scrapers */}
      <div className="flex flex-wrap gap-2">
        {sources?.map((s) => (
          <Button
            key={s.key}
            variant="outline"
            size="sm"
            disabled={isRunning}
            onClick={() => runOne.mutate(s.key)}
            className="text-xs"
          >
            {s.name}
          </Button>
        ))}
      </div>

      {/* Stats */}
      {status?.stats && !status.running && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Novas provas"
            value={status.stats.inserted}
            color="text-green-400"
            icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
          />
          <StatCard
            label="Atualizadas"
            value={status.stats.updated}
            color="text-blue-400"
          />
          <StatCard
            label="Ignoradas"
            value={status.stats.skipped}
            color="text-muted-foreground"
          />
        </div>
      )}

      {/* Errors */}
      {status?.stats?.errors && status.stats.errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-3">
          <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Erros durante o scraping:
          </p>
          {status.stats.errors.map((e, i) => (
            <p key={i} className="text-xs text-muted-foreground">{e}</p>
          ))}
        </div>
      )}

      {/* Log */}
      {(status?.log?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
            {isRunning && <RefreshCw className="w-3 h-3 animate-spin" />}
            Log
          </p>
          <div
            ref={logRef}
            className="bg-black/40 border border-border rounded p-3 max-h-64 overflow-y-auto font-mono text-xs text-muted-foreground space-y-0.5"
          >
            {status?.log.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'leading-relaxed',
                  line.includes('✅') && 'text-green-400',
                  line.includes('❌') && 'text-red-400',
                  line.includes('⚠') && 'text-amber-400',
                  line.includes('🚀') && 'text-blue-400',
                  line.includes('✨') && 'text-purple-400',
                )}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label, value, color, icon,
}: {
  label: string
  value: number
  color: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-muted/30 border border-border rounded p-3 text-center">
      <div className={cn('text-2xl font-bold tabular-nums', color)}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
        {icon}
        {label}
      </div>
    </div>
  )
}
