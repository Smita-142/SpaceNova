import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import {
  Cpu, Play, Film, Image, Box, AlertCircle, CheckCircle,
  Loader2, Info, Upload, FolderOpen,
} from 'lucide-react'
import {
  getProject, extractFrames, startReconstruction,
  getProjectStatus, uploadMedia,
} from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'

export default function Reconstruction() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { projects, loading: projLoading } = useProjects()
  const modelFileRef = useRef()

  const [selId, setSelId] = useState(searchParams.get('project') || '')
  const [project, setProject] = useState(null)
  const [loadingProj, setLoadingProj] = useState(false)
  const [step, setStep] = useState('idle')        // idle | extracting | extract_done | reconstructing | done | no_colmap
  const [frameCount, setFrameCount] = useState(0)
  const [statusData, setStatusData] = useState(null)
  const [error, setError] = useState(null)
  const [polling, setPolling] = useState(false)
  const projectIdFromUrl = searchParams.get('project') || ''

  useEffect(() => {
    if (selId !== projectIdFromUrl) setSelId(projectIdFromUrl)
  }, [projectIdFromUrl, selId])

  // Load project when id changes
  useEffect(() => {
    setPolling(false)
    if (!selId) { setProject(null); setStatusData(null); return }
    let active = true
    setLoadingProj(true); setError(null); setStatusData(null)
    getProject(selId)
      .then(r => {
        if (!active) return
        setProject(r.data)
        const s = r.data.reconstruction_status
        if (s === 'completed')  setStep('done')
        else if (s === 'processing') { setStep('reconstructing'); setPolling(true) }
        else if (s === 'no_colmap') setStep('no_colmap')
        else if (r.data.extracted_frames > 0) setStep('extract_done')
        else setStep('idle')
        setFrameCount(r.data.extracted_frames || 0)
        return getProjectStatus(selId)
          .then(statusResponse => {
            if (!active) return
            const status = statusResponse.data
            const colmapRecovered = s === 'no_colmap' && status.colmap_available
            setStatusData(colmapRecovered
              ? {
                  ...status,
                  reconstruction_status: r.data.model_available ? 'completed' : 'pending',
                  error_message: null,
                }
              : status)
            if (colmapRecovered) {
              setStep(r.data.model_available
                ? 'done'
                : r.data.extracted_frames > 0 ? 'extract_done' : 'idle')
            }
          })
          .catch(e => {
            if (active) setError(e.response?.data?.detail || 'Could not load reconstruction status')
          })
      })
      .catch(e => {
        if (active) setError(e.response?.data?.detail || 'Could not load project')
      })
      .finally(() => {
        if (active) setLoadingProj(false)
      })
    return () => { active = false }
  }, [selId])

  // Poll reconstruction status
  useEffect(() => {
    if (!polling || !selId) return
    const iv = setInterval(async () => {
      try {
        const r = await getProjectStatus(selId)
        setStatusData(r.data)
        if (r.data.reconstruction_status === 'completed') {
          setPolling(false); setStep('done')
          setProject(p => ({ ...p, model_available: true }))
        } else if (r.data.reconstruction_status === 'failed') {
          setPolling(false); setStep('idle')
          setError(r.data.error_message || 'Reconstruction failed')
        } else if (r.data.reconstruction_status === 'no_colmap') {
          setPolling(false); setStep('no_colmap')
        }
      } catch {}
    }, 3000)
    return () => clearInterval(iv)
  }, [polling, selId])

  const handleExtract = async () => {
    setStep('extracting'); setError(null)
    try {
      const r = await extractFrames(selId, { fps: 1 })
      setFrameCount(r.data.frame_count)
      setProject(p => ({ ...p, extracted_frames: r.data.frame_count }))
      setStep('extract_done')
    } catch (e) {
      setError(e.response?.data?.detail || 'Frame extraction failed')
      setStep('idle')
    }
  }

  const handleReconstruct = async () => {
    setStep('reconstructing'); setError(null)
    try {
      await startReconstruction(selId, {})
      setPolling(true)
    } catch (e) {
      const detail = e.response?.data?.detail || 'Reconstruction failed to start'
      setError(detail)
      // Check if no_colmap response
      if (e.response?.status === 503) setStep('no_colmap')
      else setStep('extract_done')
    }
  }

  const handleModelImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setError(null)
    try {
      const fd = new FormData(); fd.append('model', file)
      await uploadMedia(selId, fd)
      setStep('done')
      setProject(p => ({ ...p, model_available: true }))
    } catch (e) {
      setError(e.response?.data?.detail || 'Model import failed')
    }
  }

  const totalImages = (project?.image_count || 0) + (frameCount || 0)

  if (projLoading) return <div className="flex justify-center py-16"><LoadingSpinner text="Loading…" /></div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Reconstruction Workspace</h1>
        <p className="text-slate-400 text-sm">Extract frames, preprocess media, and run COLMAP reconstruction</p>
      </div>

      {/* Project selector */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
        <label className="block text-xs text-slate-400 mb-2">Select Project</label>
        <select value={selId} onChange={e => {
          const nextProjectId = e.target.value
          setSelId(nextProjectId)
          setPolling(false)
          setError(null)
          setStatusData(null)
          setSearchParams(nextProjectId ? { project: nextProjectId } : {}, { replace: true })
        }}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500/50 transition-all">
          <option value="" className="bg-white text-slate-950">— Choose a project —</option>
          {projects.map(p => <option key={p.id} value={p.id} className="bg-white text-slate-950">{p.name}</option>)}
        </select>
        {projects.length === 0 && !projLoading && (
          <p className="text-xs text-slate-500 mt-2">No projects found. <button onClick={() => navigate('/upload')} className="text-cyan-400 hover:underline">Upload media first</button></p>
        )}
      </div>

      {loadingProj && <div className="flex justify-center py-8"><LoadingSpinner text="Loading project…" /></div>}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-400/60 hover:text-red-400 mt-1">Dismiss</button>
          </div>
        </div>
      )}

      {project && !loadingProj && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main workflow */}
          <div className="lg:col-span-2 space-y-4">
            {/* Media summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" /> Project Media
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Image, label: 'Images',    value: project.image_count || 0, color: 'text-blue-400' },
                  { icon: Film,  label: 'Videos',    value: project.video_count || 0, color: 'text-purple-400' },
                  { icon: Image, label: 'Frames',    value: frameCount,               color: 'text-green-400' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-white/3 rounded-lg p-3 text-center">
                    <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                    <div className="text-lg font-bold text-white">{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate(`/upload?project=${selId}`)}
                className="mt-4 bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20 font-medium px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" /> Add Photos or Videos
              </button>
            </div>

            {/* Step 1: Extract frames (only if videos exist) */}
            {(project.video_count || 0) > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-purple-400" /> Step 1: Extract Video Frames
                  </h3>
                  {(step === 'extract_done' || frameCount > 0) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20">
                      <CheckCircle className="w-3 h-3" /> Done — {frameCount} frames
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-4">Extract frames at 1 fps from uploaded videos using OpenCV.</p>
                <button onClick={handleExtract} disabled={step === 'extracting' || step === 'reconstructing'}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
                  {step === 'extracting'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</>
                    : <><Play className="w-4 h-4" /> Extract Frames</>}
                </button>
              </div>
            )}

            {/* Step 2: Reconstruct */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" /> Step 2: 3D Reconstruction
                </h3>
                <StatusBadge status={statusData?.reconstruction_status || project.reconstruction_status} />
              </div>

              {/* No COLMAP notice */}
              {step === 'no_colmap' && (
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-400">COLMAP Not Available</p>
                      <p className="text-xs text-orange-400/70 mt-1">
                        COLMAP is not installed on this system. Install it to run reconstruction.
                        You can import an existing GLB/GLTF/PLY model to test the 3D viewer.
                      </p>
                      <a href="https://colmap.github.io/install.html" target="_blank" rel="noopener noreferrer"
                        className="text-xs text-orange-400 underline mt-1 block">Install COLMAP →</a>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2">Or import an existing GLB, GLTF, or PLY model:</p>
                    <input ref={modelFileRef} type="file" accept=".glb,.gltf,.ply" className="hidden" onChange={handleModelImport} />
                    <button onClick={() => modelFileRef.current?.click()}
                      className="bg-white/10 hover:bg-white/20 text-slate-100 font-medium px-4 py-2 rounded-lg border border-white/20 text-sm flex items-center gap-2 transition-all">
                      <Upload className="w-4 h-4" /> Import Model File
                    </button>
                  </div>
                </div>
              )}

              {step !== 'no_colmap' && (
                <p className="text-sm text-slate-400 mb-4">
                  Runs COLMAP feature extraction, exhaustive matching, and sparse reconstruction (SfM).
                </p>
              )}

              {/* Log tail */}
              {statusData?.log_tail && (
                <div className="mb-4 bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {statusData.log_tail}
                </div>
              )}

              {step === 'reconstructing' && (
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  Reconstruction running… polling every 3 s
                </div>
              )}

              {step !== 'no_colmap' && step !== 'reconstructing' && step !== 'done' && (
                <button onClick={handleReconstruct} disabled={totalImages < 3}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
                  <Play className="w-4 h-4" /> Start Reconstruction
                </button>
              )}
              {totalImages < 3 && step !== 'no_colmap' && (
                <p className="text-xs text-orange-400 mt-2">⚠ Minimum 3 images needed (current: {totalImages})</p>
              )}
            </div>

            {/* Done */}
            {step === 'done' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="font-medium text-white">
                    {project.model_available ? 'Model Ready' : 'Reconstruction Complete'}
                  </h3>
                </div>
                {project.model_available
                  ? <p className="text-sm text-slate-400 mb-4">A 3D model is available. Open it in the explorer.</p>
                  : <p className="text-sm text-slate-400 mb-4">Sparse PLY point cloud is ready to roam in the 3D Explorer.</p>}
                <button onClick={() => navigate(`/explorer?project=${selId}`)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
                  <Box className="w-4 h-4" /> Open in 3D Explorer
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-medium text-white mb-3">Project Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="text-slate-200 truncate ml-4">{project.name}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">ID</dt><dd className="text-slate-500 font-mono text-xs">{project.id?.slice(0, 8)}…</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={statusData?.reconstruction_status || project.reconstruction_status} /></dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Model</dt><dd className={project.model_available ? 'text-green-400' : 'text-slate-500'}>{project.model_available ? 'Available' : 'Not yet'}</dd></div>
              </dl>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-medium text-white mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-slate-500" /> Requirements</h3>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${totalImages >= 3 ? 'bg-green-500' : 'bg-orange-500'}`} />Minimum 3 images or frames</li>
                <li className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusData == null ? 'bg-slate-600' : statusData.colmap_available ? 'bg-green-500' : 'bg-orange-500'}`} />
                  {statusData == null
                    ? 'Checking COLMAP availability…'
                    : statusData.colmap_available
                      ? 'COLMAP available on backend'
                      : 'COLMAP unavailable on backend'}
                </li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-600" />Overlapping photos (60–80%)</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-600" />Good, consistent lighting</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
