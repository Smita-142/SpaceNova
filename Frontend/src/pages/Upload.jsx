import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Upload as UploadIcon, Image, Video, X, FolderPlus,
  CheckCircle, AlertCircle, Loader2, FileImage, FileVideo,
} from 'lucide-react'
import { createProject, getProject, uploadMedia } from '../services/api'
import { useProjects } from '../hooks/useProjects'

const MAX_IMAGE_SIZE = 50 * 1024 * 1024   // 50 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024  // 500 MB
const ACCEPTED_IMAGE = ['image/jpeg', 'image/jpg', 'image/png']
const ACCEPTED_VIDEO = ['video/mp4', 'video/quicktime']

function fmtSize(b) {
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Upload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { projects } = useProjects()
  const imgRef = useRef()
  const vidRef = useRef()

  const [projectMode, setProjectMode] = useState(searchParams.get('project') ? 'existing' : 'new')
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('project') || '')
  const [selectedProject, setSelectedProject] = useState(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [submitErr, setSubmitErr] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const projectId = searchParams.get('project')
    if (projectId) {
      setProjectMode('existing')
      setSelectedProjectId(projectId)
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null)
      return
    }

    let active = true
    setSelectedProject(null)
    getProject(selectedProjectId)
      .then(response => {
        if (active) setSelectedProject(response.data)
      })
      .catch(error => {
        if (active) {
          setSelectedProject(null)
          setSubmitErr(error.response?.data?.detail || 'Could not load the selected project')
        }
      })
    return () => { active = false }
  }, [selectedProjectId])

  const validateImage = (f) => {
    if (!ACCEPTED_IMAGE.includes(f.type)) return 'Only JPG / PNG allowed'
    if (f.size > MAX_IMAGE_SIZE) return `Too large (max 50 MB)`
    return null
  }
  const validateVideo = (f) => {
    if (!ACCEPTED_VIDEO.includes(f.type)) return 'Only MP4 / MOV allowed'
    if (f.size > MAX_VIDEO_SIZE) return `Too large (max 500 MB)`
    return null
  }

  const addImages = useCallback((files) => {
    setImages(prev => [...prev, ...Array.from(files).map(f => ({
      id: crypto.randomUUID(), file: f,
      preview: ACCEPTED_IMAGE.includes(f.type) ? URL.createObjectURL(f) : null,
      error: validateImage(f),
    }))])
  }, [])

  const addVideos = useCallback((files) => {
    setVideos(prev => [...prev, ...Array.from(files).map(f => ({
      id: crypto.randomUUID(), file: f, error: validateVideo(f),
    }))])
  }, [])

  const removeImage = (id) => setImages(p => p.filter(i => { if (i.id === id && i.preview) URL.revokeObjectURL(i.preview); return i.id !== id }))
  const removeVideo = (id) => setVideos(p => p.filter(v => v.id !== id))
  const clearAll = () => { images.forEach(i => i.preview && URL.revokeObjectURL(i.preview)); setImages([]); setVideos([]) }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    addImages(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')))
    addVideos(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/')))
  }, [addImages, addVideos])

  const validImages = images.filter(i => !i.error)
  const validVideos = videos.filter(v => !v.error)

  const handleSubmit = async () => {
    if (projectMode === 'new' && !name.trim()) return setSubmitErr('Please enter a project name')
    if (projectMode === 'existing' && !selectedProjectId) return setSubmitErr('Please select a project')
    if (!validImages.length && !validVideos.length) return setSubmitErr('Upload at least one valid image or video')
    setSubmitErr(null); setUploading(true); setProgress(0)
    try {
      const proj = projectMode === 'existing'
        ? selectedProject
        : (await createProject({ name: name.trim(), description: desc.trim() })).data
      if (!proj) throw new Error('The selected project could not be loaded')
      const fd = new FormData()
      validImages.forEach(i => fd.append('images', i.file))
      validVideos.forEach(v => fd.append('videos', v.file))
      await uploadMedia(proj.id, fd, setProgress)
      setDone(true)
      setTimeout(() => navigate(`/reconstruction?project=${proj.id}`), 1500)
    } catch (err) {
      setSubmitErr(err.response?.data?.detail || 'Upload failed — is the backend running?')
      setUploading(false)
    }
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center">
      <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Upload Complete!</h2>
      <p className="text-slate-400">
        {projectMode === 'existing' ? 'Media added to your project. ' : ''}
        Redirecting to reconstruction workspace…
      </p>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Capture & Upload</h1>
        <p className="text-slate-400 text-sm">Upload indoor photos and videos to begin 3D reconstruction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project details */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-cyan-400" /> Project Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Upload destination</label>
                <select
                  value={projectMode}
                  onChange={e => { setProjectMode(e.target.value); setSubmitErr(null) }}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                >
                  <option value="new" className="bg-white text-slate-950">Create a new project</option>
                  <option value="existing" className="bg-white text-slate-950">Add media to an existing project</option>
                </select>
              </div>
              {projectMode === 'existing' ? (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Select Project *</label>
                    <select
                      value={selectedProjectId}
                      onChange={e => { setSelectedProjectId(e.target.value); setSubmitErr(null) }}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                    >
                      <option value="" className="bg-white text-slate-950">— Choose a project —</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id} className="bg-white text-slate-950">{project.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedProject && (
                    <p className="text-xs text-slate-400">
                      Adding to <span className="text-slate-200">{selectedProject.name}</span>
                      {' · '}{selectedProject.image_count || 0} images, {selectedProject.video_count || 0} videos
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Project Name *</label>
                    <input type="text" placeholder="e.g. Office Floor 2 – West Wing"
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                    <textarea placeholder="Describe the captured space (optional)"
                      value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all resize-none" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`bg-white/5 border-2 border-dashed rounded-xl transition-colors ${dragging ? 'border-cyan-500/60 bg-cyan-500/5' : 'border-white/10'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="p-10 text-center">
              <UploadIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium mb-1">Drop files here</p>
              <p className="text-xs text-slate-500 mb-5">or click the buttons below to browse</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => imgRef.current?.click()} className="bg-white/10 hover:bg-white/20 text-slate-100 font-medium px-4 py-2 rounded-lg border border-white/20 text-sm flex items-center gap-2 transition-all">
                  <Image className="w-4 h-4" /> Add Images
                </button>
                <button onClick={() => vidRef.current?.click()} className="bg-white/10 hover:bg-white/20 text-slate-100 font-medium px-4 py-2 rounded-lg border border-white/20 text-sm flex items-center gap-2 transition-all">
                  <Video className="w-4 h-4" /> Add Video
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-3">JPG, PNG up to 50 MB · MP4, MOV up to 500 MB</p>
            </div>
          </div>

          <input ref={imgRef} type="file" multiple accept=".jpg,.jpeg,.png" className="hidden" onChange={e => addImages(e.target.files)} />
          <input ref={vidRef} type="file" accept=".mp4,.mov" className="hidden" onChange={e => addVideos(e.target.files)} />

          {/* Image grid */}
          {images.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white flex items-center gap-2"><FileImage className="w-4 h-4 text-blue-400" /> Images ({images.length})</h3>
                <button onClick={() => setImages([])} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Clear all</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {images.map(img => (
                  <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-800">
                    {img.preview
                      ? <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-400" /></div>}
                    {img.error && <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center p-1"><p className="text-red-200 text-xs text-center leading-tight">{img.error}</p></div>}
                    <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 w-5 h-5 bg-slate-900/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video list */}
          {videos.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-medium text-white flex items-center gap-2 mb-4"><FileVideo className="w-4 h-4 text-purple-400" /> Videos ({videos.length})</h3>
              <div className="space-y-2">
                {videos.map(vid => (
                  <div key={vid.id} className={`flex items-center gap-3 p-3 rounded-lg ${vid.error ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'}`}>
                    <FileVideo className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{vid.file.name}</p>
                      <p className="text-xs text-slate-500">{fmtSize(vid.file.size)}</p>
                      {vid.error && <p className="text-xs text-red-400 mt-0.5">{vid.error}</p>}
                    </div>
                    <button onClick={() => removeVideo(vid.id)} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — summary + submit */}
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="font-medium text-white mb-4">Upload Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Valid Images</span><span className="text-white font-medium">{validImages.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Valid Videos</span><span className="text-white font-medium">{validVideos.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Invalid Files</span><span className="text-red-400 font-medium">{images.filter(i=>i.error).length + videos.filter(v=>v.error).length}</span></div>
              <div className="border-t border-white/5 pt-3 flex justify-between">
                <span className="text-slate-400">Total Size</span>
                <span className="text-white font-medium">{fmtSize([...validImages, ...validVideos].reduce((a, f) => a + f.file.size, 0))}</span>
              </div>
            </div>
          </div>

          {submitErr && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{submitErr}</p>
            </div>
          )}

          {uploading && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-sm text-slate-300">Uploading… {progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={uploading || (!validImages.length && !validVideos.length) || (projectMode === 'new' ? !name.trim() : !selectedProjectId || !selectedProject)}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><UploadIcon className="w-4 h-4" /> {projectMode === 'existing' ? 'Add Media to Project' : 'Upload & Prepare'}</>}
          </button>

          {(images.length > 0 || videos.length > 0) && (
            <button onClick={clearAll} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium px-4 py-2 rounded-lg border border-red-500/30 flex items-center justify-center gap-2 transition-all text-sm">
              <X className="w-4 h-4" /> Clear All Files
            </button>
          )}

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-medium text-slate-400 mb-2">Capture Tips</h4>
            <ul className="text-xs text-slate-500 space-y-1.5">
              <li>• Take overlapping photos (60–80% overlap)</li>
              <li>• Capture from multiple heights and angles</li>
              <li>• Ensure good, even lighting</li>
              <li>• Avoid reflective surfaces and motion blur</li>
              <li>• Walk slowly for video captures</li>
              <li>• Minimum 30 photos recommended</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
