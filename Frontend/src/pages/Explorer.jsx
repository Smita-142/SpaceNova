import { Suspense, useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import {
  OrbitControls, PointerLockControls, useGLTF, Grid, GizmoHelper, GizmoViewport,
} from '@react-three/drei'
import {
  Box, Upload, Maximize2, AlertCircle, RotateCcw,
  Move, Eye, Loader2,
} from 'lucide-react'
import * as THREE from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { getProjectModel } from '../services/api'
import { getWASDAxes } from '../components/firstPersonMovement'

/* ─── 3D components ───────────────────────────────────────────────── */

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 5, -10]} intensity={0.3} color="#4488ff" />
      <pointLight position={[0, 10, 0]} intensity={0.4} color="#22d3ee" />
    </>
  )
}

function WireframePlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#22d3ee" wireframe />
    </mesh>
  )
}

function DemoBox({ position, size, color }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

function DemoDesk({ position }) {
  return (
    <group position={position}>
      <DemoBox position={[0, 0.8, 0]} size={[3, 0.12, 1.4]} color="#64748b" />
      {[-1.35, 1.35].flatMap((x) => [-0.55, 0.55].map((z) => (
        <DemoBox key={`${x}-${z}`} position={[x, 0.38, z]} size={[0.12, 0.76, 0.12]} color="#334155" />
      )))}
      <DemoBox position={[0, 1.12, -0.25]} size={[0.9, 0.48, 0.08]} color="#0f172a" />
      <DemoBox position={[0, 0.9, -0.24]} size={[0.16, 0.12, 0.16]} color="#94a3b8" />
    </group>
  )
}

function DemoInterior() {
  return (
    <group>
      <DemoBox position={[0, -0.12, 0]} size={[16, 0.24, 14]} color="#334155" />
      <DemoBox position={[0, 1.5, -7]} size={[16, 3, 0.2]} color="#475569" />
      <DemoBox position={[-8, 1.5, 0]} size={[0.2, 3, 14]} color="#475569" />
      <DemoBox position={[8, 1.5, 0]} size={[0.2, 3, 14]} color="#475569" />
      <DemoBox position={[-5.25, 1.5, 7]} size={[5.5, 3, 0.2]} color="#475569" />
      <DemoBox position={[5.25, 1.5, 7]} size={[5.5, 3, 0.2]} color="#475569" />

      {[-2.2, 2.2].flatMap((x) => [-4, 4].map((z) => (
        <DemoBox key={`${x}-${z}`} position={[x, 1.5, z]} size={[0.16, 3, 6]} color="#64748b" />
      )))}

      <DemoBox position={[-5, 0.02, -3.5]} size={[5, 0.04, 4]} color="#164e63" />
      <DemoBox position={[5, 0.02, -3.5]} size={[5, 0.04, 4]} color="#365314" />

      <DemoDesk position={[-5, 0, -4.5]} />
      <DemoDesk position={[-5, 0, -1.5]} />

      <DemoBox position={[5, 0.4, -4]} size={[3.2, 0.5, 1.2]} color="#0e7490" />
      <DemoBox position={[5, 0.95, -4.45]} size={[3.2, 0.7, 0.28]} color="#155e75" />
      <DemoBox position={[3.45, 0.75, -4]} size={[0.28, 0.7, 1.2]} color="#155e75" />
      <DemoBox position={[6.55, 0.75, -4]} size={[0.28, 0.7, 1.2]} color="#155e75" />
      <DemoBox position={[5, 0.3, -1.6]} size={[2, 0.12, 1]} color="#a16207" />
      <DemoBox position={[4.15, 0.15, -1.95]} size={[0.1, 0.3, 0.1]} color="#713f12" />
      <DemoBox position={[5.85, 0.15, -1.95]} size={[0.1, 0.3, 0.1]} color="#713f12" />
      <DemoBox position={[4.15, 0.15, -1.25]} size={[0.1, 0.3, 0.1]} color="#713f12" />
      <DemoBox position={[5.85, 0.15, -1.25]} size={[0.1, 0.3, 0.1]} color="#713f12" />
    </group>
  )
}

function Model({ url, onLoad }) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    if (!scene) return
    // Normalise size & centre
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 0 ? 5 / maxDim : 1
    scene.scale.setScalar(scale)
    scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    if (onLoad) onLoad({ size, scale })
  }, [scene, onLoad])

  return <primitive object={scene} />
}

function PointCloudModel({ url, onLoad }) {
  const sourceGeometry = useLoader(PLYLoader, url)
  const { geometry, size, scale } = useMemo(() => {
    const geometry = sourceGeometry.clone()
    geometry.computeBoundingBox()
    const bounds = geometry.boundingBox
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)
    const scale = maxDimension > 0 ? 5 / maxDimension : 1
    geometry.translate(-center.x, -center.y, -center.z)
    return { geometry, size, scale }
  }, [sourceGeometry])

  useEffect(() => onLoad?.({ size, scale }), [onLoad, size, scale])

  return (
    <points geometry={geometry} scale={scale}>
      <pointsMaterial
        color={geometry.hasAttribute('color') ? '#ffffff' : '#67e8f9'}
        size={0.025}
        sizeAttenuation
        vertexColors={geometry.hasAttribute('color')}
      />
    </points>
  )
}

function FirstPersonMovement({ resetToken }) {
  const { camera } = useThree()
  const pressedKeys = useRef(new Set())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const previousResetToken = useRef(resetToken)

  useEffect(() => {
    const clearKeys = () => pressedKeys.current.clear()
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase()
      if (!['w', 'a', 's', 'd'].includes(key) || !document.pointerLockElement) return
      if (event.target instanceof HTMLElement && event.target.isContentEditable) return
      event.preventDefault()
      pressedKeys.current.add(key)
    }
    const onKeyUp = (event) => pressedKeys.current.delete(event.key.toLowerCase())
    const onPointerLockChange = () => {
      if (!document.pointerLockElement) clearKeys()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearKeys)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearKeys)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [])

  useEffect(() => {
    camera.position.set(0, 1.7, 5)
    camera.lookAt(0, 1.7, 0)
  }, [camera])

  useEffect(() => {
    if (previousResetToken.current === resetToken) return
    previousResetToken.current = resetToken
    camera.position.set(0, 1.7, 5)
    camera.lookAt(0, 1.7, 0)
  }, [camera, resetToken])

  useFrame((_, delta) => {
    if (!document.pointerLockElement) return

    const movement = getWASDAxes(pressedKeys.current)
    if (!movement.x && !movement.z) return

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, camera.up).normalize()

    const distance = Math.min(delta, 0.1) * 4
    camera.position
      .addScaledVector(forward.current, -movement.z * distance)
      .addScaledVector(right.current, movement.x * distance)
  })

  return <PointerLockControls selector="#explorer-viewport canvas" />
}

/* ─── Main component ──────────────────────────────────────────────── */

const CONTROLS_INFO = [
  { key: 'Left Drag',    action: 'Orbit / Rotate' },
  { key: 'Right Drag',   action: 'Pan' },
  { key: 'Scroll',       action: 'Zoom' },
  { key: 'Double Click', action: 'Focus point' },
]

const FIRST_PERSON_CONTROLS_INFO = [
  { key: 'W / A / S / D', action: 'Move' },
  { key: 'Mouse', action: 'Look around' },
  { key: 'Esc', action: 'Release mouse' },
]

const COMING_SOON = [
  'POI Tagging', 'Spatial Search', 'Indoor Mini-map',
  'Distance Measurement', 'A* Navigation', 'Obstacle Detection',
]

export default function Explorer() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')
  const fileRef = useRef()
  const orbitRef = useRef()

  const [modelUrl, setModelUrl]   = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [modelErr, setModelErr]   = useState(null)
  const [showGrid, setShowGrid]   = useState(true)
  const [showPanel, setShowPanel] = useState(true)
  const [modelLoading, setModelLoading] = useState(false)
  const [firstPerson, setFirstPerson] = useState(false)
  const [cameraResetToken, setCameraResetToken] = useState(0)

  // Load model from backend if projectId given
  useEffect(() => {
    if (!projectId) return
    setLoading(true); setModelErr(null)
    getProjectModel(projectId)
      .then(r => {
        if (r.data.model_url) {
          setModelUrl(r.data.model_url)
          setModelInfo({ filename: r.data.model_filename })
        } else {
          setModelErr('No 3D model found for this project. Run reconstruction first or import a GLB, GLTF, or PLY file.')
        }
      })
      .catch(e => setModelErr(e.response?.data?.detail || 'Could not fetch model info'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (modelUrl?.startsWith('blob:')) URL.revokeObjectURL(modelUrl)
    setModelUrl(URL.createObjectURL(file))
    setModelInfo({ filename: file.name, size: file.size })
    setModelErr(null)
  }, [modelUrl])

  const handleModelLoad = useCallback((info) => {
    setModelInfo(prev => ({ ...prev, ...info }))
    setModelLoading(false)
  }, [])

  const isPointCloud = modelInfo?.filename?.toLowerCase().endsWith('.ply')

  const resetCamera = () => {
    if (firstPerson) setCameraResetToken(token => token + 1)
    else orbitRef.current?.reset()
  }

  const fmtSize = (b) => b ? (b / 1024 / 1024).toFixed(2) + ' MB' : 'unknown'

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">3D Explorer</h1>
          <p className="text-slate-400 text-sm">Roam the sample space or load a GLB, GLTF, or PLY reconstruction</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/20 p-0.5">
            <button
              onClick={() => setFirstPerson(false)}
              aria-pressed={!firstPerson}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${!firstPerson ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-white/10'}`}
            >
              Orbit
            </button>
            <button
              onClick={() => setFirstPerson(true)}
              aria-pressed={firstPerson}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${firstPerson ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-white/10'}`}
            >
              First Person
            </button>
          </div>
          <button onClick={() => setShowGrid(v => !v)}
            className={`bg-white/10 hover:bg-white/20 border font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${showGrid ? 'border-cyan-500/30 text-cyan-400' : 'border-white/20 text-slate-100'}`}>
            Grid
          </button>
          <button onClick={resetCamera}
            className="bg-white/10 hover:bg-white/20 text-slate-100 border border-white/20 font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all">
            <Upload className="w-4 h-4" /> Load Model
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".glb,.gltf,.ply" className="hidden" onChange={handleFileImport} />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Viewport */}
        <div id="explorer-viewport" className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden relative">
          {/* Loading overlay */}
          {(loading || modelLoading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-slate-400 text-sm">Loading model…</p>
              </div>
            </div>
          )}

          {/* Sample scene status */}
          {!modelUrl && !loading && (
            <div className="absolute top-4 left-4 z-10 max-w-sm rounded-lg border border-cyan-500/20 bg-slate-900/85 px-3 py-2 pointer-events-none">
              <p className="text-xs font-medium text-cyan-300">Sample indoor space · 3D roaming demo</p>
              {modelErr && <p className="mt-1 text-xs text-amber-300">{modelErr} Showing the sample space instead.</p>}
            </div>
          )}

          <Canvas
            camera={{ position: [5, 5, 5], fov: 60 }}
            shadows
            gl={{ antialias: true }}
            style={{ background: '#030b1a' }}
          >
            <SceneLighting />

            {showGrid && (
              <Grid
                args={[30, 30]}
                cellSize={0.5}
                cellThickness={0.5}
                cellColor="#1e3a5f"
                sectionSize={3}
                sectionThickness={1}
                sectionColor="#1e4d7a"
                fadeDistance={30}
                infiniteGrid
              />
            )}

            {modelUrl ? (
              <Suspense fallback={<WireframePlaceholder />}>
                {isPointCloud
                  ? <PointCloudModel url={modelUrl} onLoad={handleModelLoad} />
                  : <Model url={modelUrl} onLoad={handleModelLoad} />}
              </Suspense>
            ) : <DemoInterior />}

            <OrbitControls
              ref={orbitRef}
              makeDefault
              enabled={!firstPerson}
              enableDamping
              dampingFactor={0.06}
              minDistance={0.1}
              maxDistance={500}
            />
            {firstPerson && <FirstPersonMovement resetToken={cameraResetToken} />}

            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
            </GizmoHelper>
          </Canvas>

          <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.querySelector('canvas')?.parentElement?.requestFullscreen?.()}
            className="absolute bottom-4 right-4 w-8 h-8 bg-slate-900/80 border border-white/10 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors">
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </button>
          {firstPerson && (
            <div className="absolute top-4 left-4 z-10 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 pointer-events-none">
              Click the view to capture the mouse. Use WASD to move; press Esc to release.
            </div>
          )}
        </div>

        {/* Side panel */}
        {showPanel && (
          <div className="w-60 flex-shrink-0 space-y-3 overflow-y-auto">
            {/* Model info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Box className="w-4 h-4 text-cyan-400" /> Model Info</h3>
              {modelInfo ? (
                <dl className="space-y-2 text-xs">
                  {modelInfo.filename && <div><dt className="text-slate-500">File</dt><dd className="text-slate-300 truncate">{modelInfo.filename}</dd></div>}
                  {modelInfo.size    && <div><dt className="text-slate-500">Size</dt><dd className="text-slate-300">{fmtSize(modelInfo.size)}</dd></div>}
                  {modelInfo.scale   && <div><dt className="text-slate-500">Scale</dt><dd className="text-slate-300">{modelInfo.scale.toFixed(4)}</dd></div>}
                </dl>
              ) : <p className="text-xs text-slate-400">Sample indoor space · 3 rooms</p>}
            </div>

            {/* Controls */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Move className="w-4 h-4 text-cyan-400" /> Controls</h3>
              <dl className="space-y-2">
                {(firstPerson ? FIRST_PERSON_CONTROLS_INFO : CONTROLS_INFO).map(({ key, action }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <dt className="text-xs font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400 whitespace-nowrap">{key}</dt>
                    <dd className="text-xs text-slate-500 text-right">{action}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Coming soon */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> Coming Soon</h3>
              <ul className="space-y-1.5">
                {COMING_SOON.map(f => (
                  <li key={f} className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
