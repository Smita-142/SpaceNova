import { useBackendStatus } from '../hooks/useProjects'
import { Info, Users, Cpu, Database, FileType, Wifi, WifiOff } from 'lucide-react'

export default function Settings() {
  const { status, info } = useBackendStatus()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings & Information</h1>
        <p className="text-slate-400 text-sm">Application configuration and system information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-cyan-400" /> Application</h2>
          <dl className="space-y-3">
            {[
              ['Name',        'SpaceNova'],
              ['Version',     '1.0.0-alpha'],
              ['Subtitle',    'Intelligent Spatial Engine'],
              ['Tagline',     'Transforming Physical Spaces into Intelligent Digital Worlds'],
              ['Competition', 'Namma Space – Techfest IIT Bombay'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <dt className="text-sm text-slate-500 w-28 flex-shrink-0">{k}</dt>
                <dd className="text-sm text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Team */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" /> Team TechNova</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Team TechNova built SpaceNova for the Namma Space competition at Techfest IIT Bombay.
            The platform leverages photogrammetry, 3D rendering, and computer vision to convert
            real-world indoor environments into interactive digital twins.
          </p>
        </div>

        {/* Backend */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-cyan-400" /> Backend Connection</h2>
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
            status === 'online'   ? 'bg-green-500/10 border border-green-500/20' :
            status === 'offline'  ? 'bg-red-500/10 border border-red-500/20' :
                                    'bg-slate-500/10 border border-slate-500/20'
          }`}>
            {status === 'online' ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            <div>
              <p className={`text-sm font-medium ${status === 'online' ? 'text-green-400' : status === 'offline' ? 'text-red-400' : 'text-slate-400'}`}>
                Backend is {status}
              </p>
              {info?.message && <p className="text-xs text-slate-500">{info.message}</p>}
              {status === 'offline' && <p className="text-xs text-red-400/70 mt-0.5 font-mono">uvicorn app.main:app --reload</p>}
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-4">
              <dt className="text-slate-500 w-28 flex-shrink-0">API URL</dt>
              <dd className="text-slate-300 font-mono text-xs">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</dd>
            </div>
            {info?.colmap_available !== undefined && (
              <div className="flex gap-4">
                <dt className="text-slate-500 w-28 flex-shrink-0">COLMAP</dt>
                <dd className={`font-medium ${info.colmap_available ? 'text-green-400' : 'text-orange-400'}`}>
                  {info.colmap_available ? 'Available' : 'Not installed'}
                </dd>
              </div>
            )}
            {info?.opencv_available !== undefined && (
              <div className="flex gap-4">
                <dt className="text-slate-500 w-28 flex-shrink-0">OpenCV</dt>
                <dd className={`font-medium ${info.opencv_available ? 'text-green-400' : 'text-orange-400'}`}>
                  {info.opencv_available ? 'Available' : 'Not installed'}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* File formats */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><FileType className="w-4 h-4 text-cyan-400" /> Supported Formats</h2>
          <div className="space-y-4">
            {[
              { label: 'Images',    formats: ['JPG', 'JPEG', 'PNG'],  color: 'text-blue-400   bg-blue-500/10   border-blue-500/20' },
              { label: 'Videos',    formats: ['MP4', 'MOV'],          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
              { label: '3D Models', formats: ['GLB', 'GLTF', 'PLY'],  color: 'text-cyan-400   bg-cyan-500/10   border-cyan-500/20' },
            ].map(({ label, formats, color }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 mb-2">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {formats.map(f => (
                    <span key={f} className={`px-2.5 py-1 text-xs rounded border ${color}`}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 lg:col-span-2">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-cyan-400" /> Storage Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Upload Directory',        'backend/uploads/',        'Uploaded media files'],
              ['Reconstruction Output',   'backend/reconstructions/', 'COLMAP outputs and 3D models'],
              ['Storage Type',            'Local Filesystem',         'Prototype phase'],
              ['Production Storage',      'Cloud Object Storage',     'S3 / GCS recommended'],
            ].map(([k, v, note]) => (
              <div key={k} className="bg-white/3 rounded-lg p-4">
                <p className="text-slate-400 text-xs mb-1">{k}</p>
                <p className="text-slate-200 font-mono text-sm">{v}</p>
                <p className="text-slate-600 text-xs mt-1">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
