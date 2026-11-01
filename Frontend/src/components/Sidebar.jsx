import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Cpu, Box, FolderOpen,
  Settings, Zap, ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload',         icon: Upload,          label: 'Capture & Upload' },
  { to: '/reconstruction', icon: Cpu,             label: 'Reconstruction' },
  { to: '/explorer',       icon: Box,             label: '3D Explorer' },
  { to: '/projects',       icon: FolderOpen,      label: 'Projects' },
  { to: '/settings',       icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900/80 border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">SpaceNova</div>
            <div className="text-xs text-slate-500">Spatial Engine</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
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
      <div className="px-6 py-4 border-t border-white/5">
        <div className="text-xs text-slate-600">Team TechNova</div>
        <div className="text-xs text-slate-700">Namma Space · Techfest IIT Bombay</div>
      </div>
    </aside>
  )
}

