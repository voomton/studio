import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CharacterConfig } from '../types/character'
import { createAnimeCharacterRig, CharacterRig } from '../utils/animeMeshGenerator'
import { 
  Camera, 
  RotateCw, 
  Sparkles, 
  Grid, 
  Maximize2, 
  Eye, 
  Sun, 
  Layers
} from 'lucide-react'

export interface Viewport3DHandle {
  takeScreenshot: (transparent?: boolean) => string
  resetCamera: () => void
  setCameraShot: (shot: 'full' | 'bust' | 'face' | 'low') => void
}

interface Viewport3DProps {
  config: CharacterConfig
  onConfigChange?: (newConfig: CharacterConfig) => void
}

export const Viewport3D = forwardRef<Viewport3DHandle, Viewport3DProps>(({ config }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rigRef = useRef<CharacterRig | null>(null)
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null)
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null)
  const gridHelperRef = useRef<THREE.GridHelper | null>(null)
  const shadowPedestalRef = useRef<THREE.Mesh | null>(null)

  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const [showRuleOfThirds, setShowRuleOfThirds] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [activeShot, setActiveShot] = useState<'full' | 'bust' | 'face' | 'low'>('full')

  // Expose handles to parent
  useImperativeHandle(ref, () => ({
    takeScreenshot: (transparent: boolean = false) => {
      const renderer = rendererRef.current
      const scene = sceneRef.current
      const camera = cameraRef.current
      if (!renderer || !scene || !camera) return ''

      const origClearAlpha = renderer.getClearAlpha()
      const origClearColor = new THREE.Color()
      renderer.getClearColor(origClearColor)

      if (transparent) {
        renderer.setClearAlpha(0)
      }

      renderer.render(scene, camera)
      const dataUrl = renderer.domElement.toDataURL('image/png')

      if (transparent) {
        renderer.setClearAlpha(origClearAlpha)
        renderer.setClearColor(origClearColor)
        renderer.render(scene, camera)
      }

      return dataUrl
    },
    resetCamera: () => {
      setCameraShot('full')
    },
    setCameraShot: (shot: 'full' | 'bust' | 'face' | 'low') => {
      setCameraShot(shot)
    }
  }))

  const setCameraShot = (shot: 'full' | 'bust' | 'face' | 'low') => {
    setActiveShot(shot)
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    if (shot === 'full') {
      camera.position.set(0, 1.1, 2.8)
      controls.target.set(0, 0.95, 0)
    } else if (shot === 'bust') {
      camera.position.set(0, 1.35, 1.35)
      controls.target.set(0, 1.25, 0)
    } else if (shot === 'face') {
      camera.position.set(0, 1.48, 0.85)
      controls.target.set(0, 1.45, 0)
    } else if (shot === 'low') {
      camera.position.set(0.4, 0.35, 2.2)
      controls.target.set(0, 1.1, 0)
    }
    controls.update()
  }

  // 1. Setup Three.js Scene, Camera, Renderer, Controls
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 500

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50)
    camera.position.set(0, 1.1, 2.8)
    cameraRef.current = camera

    // Renderer with antialias & high pixel ratio
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    rendererRef.current = renderer

    // OrbitControls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 0.95, 0)
    controls.minDistance = 0.4
    controls.maxDistance = 6.0
    controls.maxPolarAngle = Math.PI / 2 + 0.05
    controlsRef.current = controls

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3)
    keyLight.position.set(2.5, 4, 3)
    scene.add(keyLight)
    dirLightRef.current = keyLight

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.5)
    fillLight.position.set(-2.5, 2, 2)
    scene.add(fillLight)

    // Anime Rim / Edge Light
    const rimLight = new THREE.DirectionalLight(0xd32f2f, 1.2)
    rimLight.position.set(-2, 2.5, -2.5)
    scene.add(rimLight)
    rimLightRef.current = rimLight

    // Studio Ground Pedestal & Grid
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.04, 36)
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x18181f,
      roughness: 0.8,
      metalness: 0.1
    })
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
    pedestal.position.set(0, -0.02, 0)
    scene.add(pedestal)
    shadowPedestalRef.current = pedestal

    const grid = new THREE.GridHelper(6, 24, 0xd32f2f, 0x2d2d35)
    grid.position.set(0, 0.001, 0)
    scene.add(grid)
    gridHelperRef.current = grid

    // Animation Loop
    let animationFrameId: number
    const timer = new THREE.Timer()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      timer.update()
      const elapsedTime = timer.getElapsed()

      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotating
        controlsRef.current.autoRotateSpeed = 2.0
        controlsRef.current.update()
      }

      if (rigRef.current) {
        rigRef.current.updatePose(config.studio.pose, elapsedTime)
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    // Resize Observer for robust responsive canvas
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH
          cameraRef.current.updateProjectionMatrix()
          rendererRef.current.setSize(newW, newH)
        }
      }
    })
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      if (rigRef.current) {
        rigRef.current.dispose()
      }
    }
  }, [])

  // 2. Build or Rebuild Character Mesh when configuration changes
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Clean up old character rig
    if (rigRef.current) {
      scene.remove(rigRef.current.root)
      rigRef.current.dispose()
      rigRef.current = null
    }

    // Generate fresh anime model rig
    const newRig = createAnimeCharacterRig(config)
    scene.add(newRig.root)
    rigRef.current = newRig

    // Update Rim Light color & intensity
    if (rimLightRef.current) {
      rimLightRef.current.color.set(config.studio.rimLightColor || '#d32f2f')
      rimLightRef.current.intensity = config.studio.rimLightIntensity
    }
  }, [config])

  // 3. Update Grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid
    }
  }, [showGrid])

  // 4. Update Backdrop styles
  const getBackdropBackground = () => {
    switch (config.studio.backdrop) {
      case 'sakura_garden':
        return 'radial-gradient(circle at center, #2e1065 0%, #17072b 70%, #090214 100%)'
      case 'cyber_neon':
        return 'radial-gradient(circle at center, #082f49 0%, #031726 60%, #020617 100%)'
      case 'clean_daylight':
        return 'radial-gradient(circle at center, #334155 0%, #1e293b 70%, #0f172a 100%)'
      case 'dark_obsidian':
      default:
        return 'radial-gradient(circle at center, #1e1e24 0%, #141418 60%, #0a0a0c 100%)'
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="relative flex-1 w-full h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden select-none"
      style={{ background: getBackdropBackground() }}
    >
      {/* 3D Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Manga Rule of Thirds Guide Overlay */}
      {showRuleOfThirds && (
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-red-500/20 z-10">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-red-500/15 border-dashed" />
          ))}
        </div>
      )}

      {/* Floating Top Left Camera Framing Toolbar */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 p-1 rounded-md bg-[#121217]/90 backdrop-blur-md border border-[#2D2D35] shadow-2xl z-20">
        <button
          onClick={() => setCameraShot('full')}
          title="Full Body Shot"
          className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors ${
            activeShot === 'full' 
              ? 'bg-[#D32F2F] text-white shadow-sm' 
              : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          Full
        </button>
        <button
          onClick={() => setCameraShot('bust')}
          title="Bust / Medium Shot"
          className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors ${
            activeShot === 'bust' 
              ? 'bg-[#D32F2F] text-white shadow-sm' 
              : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          Bust
        </button>
        <button
          onClick={() => setCameraShot('face')}
          title="Face Close-Up"
          className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors ${
            activeShot === 'face' 
              ? 'bg-[#D32F2F] text-white shadow-sm' 
              : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          Face
        </button>
        <button
          onClick={() => setCameraShot('low')}
          title="Dynamic Low Angle"
          className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors ${
            activeShot === 'low' 
              ? 'bg-[#D32F2F] text-white shadow-sm' 
              : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          Low
        </button>
      </div>

      {/* Floating Top Right Viewport Quick Toggles */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 rounded-md bg-[#121217]/90 backdrop-blur-md border border-[#2D2D35] shadow-2xl z-20">
        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          title={isAutoRotating ? 'Stop Turntable' : 'Auto-Rotate Turntable'}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            isAutoRotating 
              ? 'bg-[#D32F2F] text-white' 
              : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          title={showGrid ? 'Hide Floor Grid' : 'Show Floor Grid'}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            showGrid 
              ? 'bg-[#1E1E24] text-white border border-[#3D3D45]' 
              : 'text-[#50505F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowRuleOfThirds(!showRuleOfThirds)}
          title="Toggle Rule of Thirds Guide"
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            showRuleOfThirds 
              ? 'bg-[#D32F2F] text-white' 
              : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setCameraShot('full')}
          title="Reset Camera View"
          className="w-7 h-7 flex items-center justify-center rounded text-[#80808F] hover:text-white hover:bg-[#1E1E24] transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Bottom Pose Pill Badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121217]/90 backdrop-blur-md border border-[#2D2D35] shadow-xl z-20">
        <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#E0E0E5]">
          {config.name}
        </span>
        <span className="text-[10px] text-[#80808F] font-mono">
          ({config.gender.toUpperCase()} • {config.body.build.toUpperCase()})
        </span>
      </div>
    </div>
  )
})
