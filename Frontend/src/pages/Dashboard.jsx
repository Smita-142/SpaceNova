import { useNavigate } from 'react-router-dom'
import { useProjects, useBackendStatus } from '../hooks/useProjects'
import {
  Plus, ArrowRight, FolderOpen, Image, Video, Cpu, Box,
  Wifi, WifiOff, AlertCircle,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, loading, error } = useProjects()
  const { status: backendStatus } = useBackendStatus()

  const totalImages = projects.reduce((a, p) => a + (p.image_count || 0), 0)
  const totalVideos = projects.reduce((a, p) => a + (p.video_count || 0), 0)
  const totalRecons = projects.filter(p => p.reconstruction_status !== 'pending').length
  const totalModels = projects.filter(p => p.model_available).length
  const recentProjects = projects.slice(0, 5)

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">Overview of your spatial digitization projects</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
            backendStatus === 'online'   ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            backendStatus === 'offline'  ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            {backendStatus === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            Backend {backendStatus}
          </div>
          <button onClick={() => navigate('/upload')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Image,  label: 'Total Images',    value: loading ? '–' : totalImages,  color: 'text-blue-400' },
          { icon: Video,  label: 'Total Videos',    value: loading ? '–' : totalVideos,  color: 'text-purple-400' },
          { icon: Cpu,    label: 'Reconstructions', value: loading ? '–' : totalRecons,  color: 'text-yellow-400' },
          { icon: Box,    label: '3D Models',       value: loading ? '–' : totalModels,  color: 'text-cyan-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-white/5 border border-white/10 rounded-xl mb-6">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-semibold text-white">Recent Projects</h2>
          <button onClick={() => navigate('/projects')} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading && <div className="flex justify-center py-12"><LoadingSpinner text="Loading projects…" /></div>}

        {error && (
          <div className="m-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">Backend Connection Error</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
              <p className="text-xs text-slate-500 mt-1">Start the backend: <code className="font-mono">uvicorn app.main:app --reload</code></p>
            </div>
          </div>
        )}

        {!loading && !error && recentProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm mb-4">No projects yet</p>
            <button onClick={() => navigate('/upload')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create First Project
            </button>
          </div>
        )}

        {!loading && !error && recentProjects.length > 0 && (
          <div className="divide-y divide-white/5">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{project.name}</p>
                  <p className="text-xs text-slate-500">
                    {project.image_count || 0} images · {project.video_count || 0} videos ·{' '}
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={project.reconstruction_status} />
                <button onClick={() => navigate(`/reconstruction?project=${project.id}`)} className="text-slate-400 hover:text-cyan-400 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Image,  title: 'Upload Media',      desc: 'Add photos or videos to a new project',          to: '/upload',         color: 'text-cyan-400' },
          { icon: Cpu,    title: 'Run Reconstruction', desc: 'Process captured media into a 3D model',          to: '/reconstruction', color: 'text-blue-400' },
          { icon: Box,    title: 'Open Explorer',      desc: 'Navigate and explore 3D digital twins',           to: '/explorer',       color: 'text-purple-400' },
        ].map(({ icon: Icon, title, desc, to, color }) => (
          <button key={to} onClick={() => navigate(to)}
            className="bg-white/5 border border-white/10 rounded-xl p-5 text-left hover:border-white/20 transition-all group">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
            <p className="text-xs text-slate-500">{desc}</p>
            <div className="flex items-center gap-1 text-xs text-slate-600 group-hover:text-cyan-400 mt-3 transition-colors">
              Open <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

