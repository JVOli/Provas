import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { CalendarDays, Settings, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import Calendar from './pages/Calendar'
import RaceDetail from './pages/RaceDetail'
import Admin from './pages/Admin'

export default function App() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
  }, [dark])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        {/* Top Nav */}
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="font-bold text-sm tracking-tight flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-400" />
                Meu Calendário de Provas
              </span>
              <nav className="flex items-center gap-1">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-sm transition-colors ${
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  Calendário
                </NavLink>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1 ${
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  <Settings className="w-3.5 h-3.5" />
                  Admin
                </NavLink>
              </nav>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title="Toggle theme"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Calendar />} />
            <Route path="/race/:id" element={<RaceDetail />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
