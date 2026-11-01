import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Cpu, Box, FolderOpen,
  Settings, Zap, ChevronRight, X,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload',         icon: Upload,          label: 'Capture & Upload' },
  { to: '/reconstruction', icon: Cpu,             label: 'Reconstruction' },
  { to: '/explorer',       icon: Box,             label: '3D Explorer' },
  { to: '/projects',       icon: FolderOpen,      label: 'Projects' },
  { to: '/settings',       icon: Settings,        label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      id="primary-navigation"
      aria-label="Primary navigation"
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-shrink-0 flex-col border-r border-white/5 bg-slate-900 shadow-2xl transition-transform duration-200 md:static md:z-auto md:w-64 md:translate-x-0 md:shadow-none md:transition-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">SpaceNova</div>
            <div className="text-xs text-slate-500">Spatial Engine</div>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 md:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 px-5 py-4 sm:px-6">
        <div className="text-xs text-slate-600">Team TechNova</div>
        <div className="text-xs text-slate-700">Namma Space · Techfest IIT Bombay</div>
      </div>
    </aside>
  )
}
