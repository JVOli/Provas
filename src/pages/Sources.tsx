import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { scraperApi } from '@/lib/api'
import { SOURCE_HOSTS } from '@/lib/useRaces'
import { cn, pluralize } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const GRID =
  'grid grid-cols-[minmax(0,1.4fr)_150px_80px_110px_90px_minmax(0,1.4fr)_100px] items-center gap-3 px-4'

function formatRun(iso: string | null | undefined): string {
  if (!iso) return '·'
  const d = new Date(iso)
  const day = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' }).replace('.', '').replace(' de ', '/')
  const time = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
  return `${day}, ${time}`
}

export default function Sources() {
  const qc = useQueryClient()
  const logRef = useRef<HTMLDivElement>(null)

  const { data: sources = [] } = useQuery({
    queryKey: ['scraper-sources'],
    queryFn: () => scraperApi.sources().then((r) => r.data),
  })

  const { data: status, refetch } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: () => scraperApi.status().then((r) => r.data),
    refetchInterval: (q) => (q.state.data?.running ? 2000 : false),
  })

  const running = !!status?.running

  // Ao terminar uma execução, recarrega o calendário.
  const wasRunning = useRef(false)
  useEffect(() => {
    if (wasRunning.current && !running) {
      qc.invalidateQueries({ queryKey: ['races'] })
      toast(`Importação concluída: ${pluralize(status?.stats?.inserted ?? 0, 'prova nova', 'provas novas')}`)
    }
    wasRunning.current = running
  }, [running])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [status?.log])

  const onError = (e: any) =>
    toast.error(e.response?.status === 409 ? 'Já existe uma importação em andamento' : 'Erro ao iniciar a importação')

  const runAll = useMutation({
    mutationFn: () => scraperApi.runAll(),
    onSuccess: () => { toast('Importação iniciada'); refetch() },
    onError,
  })
  const runOne = useMutation({
    mutationFn: (key: string) => scraperApi.runOne(key),
    onSuccess: () => { toast('Importação iniciada'); refetch() },
    onError,
  })

  const busy = running || runAll.isPending || runOne.isPending
  const by = status?.bySource ?? {}
  const rows = sources.map((s) => ({ ...s, st: by[s.key] }))
  const ran = rows.filter((r) => r.st && !r.st.running)
  const newCount = ran.reduce((n, r) => n + r.st!.inserted, 0)
  const errCount = ran.filter((r) => r.st!.error).length

  const headline = status?.lastRun
    ? `${pluralize(newCount, 'prova nova', 'provas novas')} na última execução` +
      (errCount ? `, ${pluralize(errCount, 'fonte com erro', 'fontes com erro')}` : '')
    : 'Nenhuma importação executada desde que o servidor iniciou'

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 space-y-5 max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="eyebrow text-navy-350">
            Fontes{status?.lastRun ? ` · última execução ${formatRun(status.lastRun)}` : ''}
          </div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">{headline}</h1>
        </div>
        <Button onClick={() => runAll.mutate()} disabled={busy}>
          <RefreshCw className={cn('w-4 h-4', busy && 'animate-spin')} />
          {busy ? 'Executando' : 'Executar todas'}
        </Button>
      </div>

      <p className="text-sm text-ink-700 max-w-[720px]">
        Provas importadas entram direto no calendário, sem prioridade. Prioridade, status, notas e
        minha distância nunca são sobrescritos por uma nova importação.
      </p>

      <div className="rounded-lg border border-ink-100 bg-white overflow-x-auto">
        <div className="min-w-[900px]">
          <div className={cn(GRID, 'h-10 bg-navy-800 text-white eyebrow')}>
            <span>Fonte</span>
            <span>Última execução</span>
            <span className="text-right">Novas</span>
            <span className="text-right">Atualizadas</span>
            <span className="text-right">Ignoradas</span>
            <span>Situação</span>
            <span />
          </div>
          {rows.map(({ key, name, st }) => {
            const isRunning = !!st?.running || (running && status?.lastSource === key)
            return (
              <div key={key} className={cn(GRID, 'min-h-[56px] border-t border-ink-100 text-sm')}>
                <div className="min-w-0">
                  <div className="font-medium truncate">{name}</div>
                  <div className="text-xs text-ink-500 truncate">{SOURCE_HOSTS[key] ?? key}</div>
                </div>
                <span className="text-ink-700 tabular">{formatRun(st?.lastRun)}</span>
                <span className="text-right font-semibold tabular">{st && !isRunning ? st.inserted : '·'}</span>
                <span className="text-right tabular">{st && !isRunning ? st.updated : '·'}</span>
                <span className="text-right tabular">{st && !isRunning ? st.skipped : '·'}</span>
                <div className="min-w-0 flex flex-col items-start gap-1">
                  {isRunning ? (
                    <Badge variant="info">Executando</Badge>
                  ) : st?.error ? (
                    <>
                      <Badge variant="negative">Erro</Badge>
                      <span className="text-xs text-ink-500 line-clamp-2">{st.error}</span>
                    </>
                  ) : st ? (
                    <Badge variant="positive">Ok</Badge>
                  ) : (
                    <Badge variant="outline">Sem execução</Badge>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => runOne.mutate(key)}>
                    Executar
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(status?.log.length ?? 0) > 0 && (
        <details className="rounded-lg border border-ink-100 bg-white" open={running}>
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">Log da execução</summary>
          <div
            ref={logRef}
            className="max-h-64 overflow-y-auto border-t border-ink-100 bg-paper-2 px-4 py-3 font-mono text-xs text-ink-700 space-y-0.5"
          >
            {status!.log.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">{line}</div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
