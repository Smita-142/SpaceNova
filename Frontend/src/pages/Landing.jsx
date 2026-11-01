import { useNavigate } from 'react-router-dom'
import {
  Zap, ArrowRight, Upload, Cpu, Box,
  Camera, Video, Scan, Navigation, Tag, Search, AlertTriangle,
} from 'lucide-react'

const features = [
  { icon: Camera,       title: 'Photo Capture',      desc: 'Upload smartphone photos for photogrammetry processing' },
  { icon: Video,        title: 'Video Processing',   desc: 'Extract optimal frames from walkthrough videos automatically' },
  { icon: Scan,         title: '3D Reconstruction',  desc: 'COLMAP-powered photogrammetric reconstruction pipeline' },
  { icon: Box,          title: 'Interactive Viewer', desc: 'Explore your digital twin with free-roaming 3D navigation' },
  { icon: Tag,          title: 'POI Tagging',        desc: 'Annotate points of interest with metadata (coming soon)' },
  { icon: Navigation,   title: 'Indoor Navigation',  desc: 'A* pathfinding and obstacle-aware routing (coming soon)' },
  { icon: Search,       title: 'Spatial Search',     desc: 'Search and locate objects within the digital twin (coming soon)' },
  { icon: AlertTriangle,title: 'Emergency Exits',    desc: 'Identify and highlight emergency routes (coming soon)' },
]

const steps = [
  { n: '01', title: 'Capture',     desc: 'Take overlapping photos or record a walkthrough video of your indoor space using any smartphone.', icon: Camera },
  { n: '02', title: 'Upload',      desc: 'Upload your media to SpaceNova. Videos are automatically split into optimal frames for reconstruction.', icon: Upload },
  { n: '03', title: 'Reconstruct', desc: 'Our COLMAP-powered pipeline computes camera positions and generates a dense 3D point cloud.', icon: Cpu },
  { n: '04', title: 'Explore',     desc: 'Navigate your digital twin in the browser with free-roaming controls and future POI annotations.', icon: Box },
]

const techStack = [
  { name: 'React + Vite',    cat: 'Frontend' },
  { name: 'Three.js / R3F',  cat: '3D Rendering' },
  { name: 'FastAPI',         cat: 'Backend' },
  { name: 'OpenCV',          cat: 'Frame Extraction' },
  { name: 'COLMAP',          cat: 'Reconstruction' },
  { name: 'Tailwind CSS',    cat: 'Styling' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">SpaceNova</span>
            <span className="hidden sm:inline text-xs text-slate-500 ml-2">Intelligent Spatial Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Dashboard
          </button>
          <button onClick={() => navigate('/upload')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-medium mb-8">
            <Zap className="w-3 h-3" /> Namma Space Competition · Techfest IIT Bombay
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Transforming Physical Spaces<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              into Intelligent Digital Worlds
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SpaceNova converts smartphone-captured indoor environments into interactive 3D digital twins
            using photogrammetry, enabling spatial exploration, navigation, and annotation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/upload')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-8 py-4 rounded-lg text-base transition-all flex items-center gap-2">
              <Upload className="w-5 h-5" /> Start Capturing
            </button>
            <button onClick={() => navigate('/explorer')} className="bg-white/10 hover:bg-white/20 text-slate-100 font-medium px-8 py-4 rounded-lg text-base border border-white/20 transition-all flex items-center gap-2">
              <Box className="w-5 h-5" /> Explore Digital Twin
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-slate-400">Four steps from physical space to digital twin</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.n} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="text-xs font-mono text-cyan-500/60 mb-3">{step.n}</div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Platform Capabilities</h2>
            <p className="text-slate-400">Current features and the roadmap ahead</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-cyan-500/20 transition-colors">
                <Icon className="w-5 h-5 text-cyan-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-10">Technology Stack</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {techStack.map(({ name, cat }) => (
              <div key={name} className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-left">
                <div className="text-xs text-slate-500">{cat}</div>
                <div className="text-sm font-medium text-slate-200">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to digitize your space?</h2>
          <p className="text-slate-400 mb-8">Upload photos or a video of your indoor environment to begin.</p>
          <button onClick={() => navigate('/upload')} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-10 py-4 rounded-lg text-base transition-all flex items-center gap-2 mx-auto">
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center">
        <div className="text-sm text-slate-600">
          <span className="text-slate-400 font-medium">SpaceNova</span> · Intelligent Spatial Engine
        </div>
        <div className="text-xs text-slate-700 mt-1">Built by Team TechNova for Namma Space · Techfest IIT Bombay</div>
      </footer>
    </div>
  )
}

