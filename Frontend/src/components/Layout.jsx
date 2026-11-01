import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!sidebarOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [sidebarOpen])

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-slate-950">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-slate-950/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="primary-navigation"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-wide text-white">SpaceNova</div>
            <div className="truncate text-xs text-slate-500">Spatial Engine</div>
          </div>
        </header>
        <div className="min-h-full p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
