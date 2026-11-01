import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import {
  FolderOpen, Plus, Trash2, ArrowRight, Image, Video, Upload,
  Box, RefreshCw, AlertCircle,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

export default function Projects() {
  const navigate = useNavigate()
  const { projects, loading, error, refresh, removeProject } = useProjects()
  const [deleting, setDeleting] = useState(null)
  const [deleteErr, setDeleteErr] = useState(null)

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete project "${p.name}"? This cannot be undone.`)) return
    setDeleting(p.id); setDeleteErr(null)
    const ok = await removeProject(p.id)
    if (!ok) setDeleteErr('Failed to delete project')
    setDeleting(null)
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Projects</h1>
          <p className="text-slate-400 text-sm">Manage your spatial digitization projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20 font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => navigate('/upload')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {deleteErr && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm text-red-400">{deleteErr}</p>
        </div>
      )}

      {loading && <div className="flex justify-center py-16"><LoadingSpinner text="Loading projects…" /></div>}

      {error && !loading && (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Could not load projects</p>
            <p className="text-red-400/70 text-sm mt-1">{error}</p>
            <button onClick={refresh} className="mt-3 text-sm text-red-400 underline">Try again</button>
          </div>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project by uploading photos or a video of an indoor space."
          action={
            <button onClick={() => navigate('/upload')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> Create First Project
            </button>
          }
        />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-5 hover:border-white/15 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="font-semibold text-white truncate">{project.name}</h3>
                  <StatusBadge status={project.reconstruction_status} />
                  {project.model_available && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                      <Box className="w-3 h-3" /> 3D Model
                    </span>
                  )}
                </div>
                {project.description && <p className="text-sm text-slate-500 truncate mb-1">{project.description}</p>}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Image className="w-3 h-3" /> {project.image_count || 0}</span>
                  <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {project.video_count || 0}</span>
                  <span>{new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => navigate(`/upload?project=${project.id}`)}
                  className="bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20 font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all">
                  <Upload className="w-3 h-3" /> Add Media
                </button>
                {project.model_available && (
                  <button onClick={() => navigate(`/explorer?project=${project.id}`)}
                    className="bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20 font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all">
                    <Box className="w-3 h-3" /> View 3D
                  </button>
                )}
                <button onClick={() => navigate(`/reconstruction?project=${project.id}`)}
                  className="bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20 font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all">
                  Open <ArrowRight className="w-3 h-3" />
                </button>
                <button onClick={() => handleDelete(project)} disabled={deleting === project.id}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-medium px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all disabled:opacity-50">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
