import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Plus, RefreshCw, Trophy } from 'lucide-react'
import Calendar from './pages/Calendar'
import Results from './pages/Results'
import Sources from './pages/Sources'
import { Button } from './components/ui/button'
import { cn } from './lib/utils'

function RedirectRace() {
  const { id } = useParams()
  return <Navigate to={`/?p=${id}`} replace />
}

const NAV = [
  { to: '/', label: 'Calendário', icon: CalendarDays, end: true },
  { to: '/resultados', label: 'Resultados', icon: Trophy },
  { to: '/fontes', label: 'Fontes', icon: RefreshCw },
]

function TopBar() {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-ink-100 bg-white">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-6 min-w-0">
          <span className="text-base font-semibold tracking-tight truncate">Meu calendário de provas</span>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-[120ms]',
                    isActive
                      ? 'bg-signal-100 !text-signal-700'
                      : '!text-ink-700 hover:bg-hover'
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Button className="max-md:hidden" onClick={() => navigate('/?nova=1')}>
          <Plus className="w-4 h-4" />
          Nova prova
        </Button>
      </div>
    </header>
  )
}

function BottomNav() {
  const navigate = useNavigate()
  const base =
    'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors duration-[120ms]'
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[76px] items-start border-t border-ink-100 bg-white px-2 pt-2 pb-4 md:hidden">
      {NAV.slice(0, 2).map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) => cn(base, isActive ? '!text-signal' : '!text-ink-500')}
        >
          <n.icon className="h-5 w-5" />
          {n.label}
        </NavLink>
      ))}
      <button type="button" onClick={() => navigate('/?nova=1')} className={cn(base, 'text-ink-500')}>
        <Plus className="h-5 w-5" />
        Nova
      </button>
      <NavLink
        to="/fontes"
        className={({ isActive }) => cn(base, isActive ? '!text-signal' : '!text-ink-500')}
      >
        <RefreshCw className="h-5 w-5" />
        Fontes
      </NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <TopBar />
        <main className="pb-[76px] md:pb-0">
          <Routes>
            <Route path="/" element={<Calendar />} />
            <Route path="/resultados" element={<Results />} />
            <Route path="/fontes" element={<Sources />} />
            <Route path="/race/:id" element={<RedirectRace />} />
            <Route path="/admin" element={<Navigate to="/fontes" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
