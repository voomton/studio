import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { 
  Move, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  Globe, 
  Focus, 
  User, 
  ChevronDown, 
  Camera, 
  RotateCcw, 
  Grid,
  Box,
  GripVertical,
  Trash2,
  HelpCircle,
  X,
  Sparkles,
  Info,
  ChevronUp,
  MoreHorizontal,
  Target
} from 'lucide-react'
import { GizmoMode, GizmoSpace, SceneCharacterInstance, SceneProp, SceneEntitySelection, SceneCameraShot } from '../../types/scene'
import { OrientationGizmo, AxisDirection } from './OrientationGizmo'

const TOOLBAR_STORAGE_KEY = 'scene_viewport_bottom_toolbar_pos'

interface ToolbarPos {
  x: number
  y: number
}

interface SceneViewportChromeProps {
  gizmoMode: GizmoMode
  gizmoSpace: GizmoSpace
  onGizmoModeChange: (mode: GizmoMode) => void
  onGizmoSpaceChange: (space: GizmoSpace) => void
  onFocusSelected: () => void
  selectedEntity: SceneEntitySelection
  selectedEntityName?: string
  sceneCharacters: SceneCharacterInstance[]
  sceneProps: SceneProp[]
  cameraShots?: SceneCameraShot[]
  onSelectEntity: (selection: SceneEntitySelection) => void
  // Camera view controls
  onResetView?: () => void
  onSetCameraAngle?: (angle: 'front' | 'face' | 'bust' | 'sideLeft' | 'sideRight' | 'back' | 'top' | 'iso' | 'side' | 'isometric') => void
  onSnapCameraDirection?: (dir: AxisDirection) => void
  onOrbitCameraDelta?: (deltaX: number, deltaY: number) => void
  subscribeCameraChange?: (cb: (quaternion: THREE.Quaternion) => void) => () => void
  showGrid?: boolean
  onToggleGrid?: () => void
  isMaximizedViewport?: boolean
  onToggleMaximizeViewport?: () => void
  onClearScene?: () => void
  zoomPercent?: number
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetZoom?: () => void
  spawnPlacementPoint?: [number, number, number] | null
  onClearSpawnPlacementPoint?: () => void
}

export const SceneViewportChrome: React.FC<SceneViewportChromeProps> = ({
  gizmoMode,
  gizmoSpace,
  onGizmoModeChange,
  onGizmoSpaceChange,
  onFocusSelected,
  selectedEntity,
  selectedEntityName = 'Main Character',
  sceneCharacters,
  sceneProps,
  cameraShots = [],
  onSelectEntity,
  onResetView,
  onSetCameraAngle,
  onSnapCameraDirection,
  onOrbitCameraDelta,
  subscribeCameraChange,
  showGrid = true,
  onToggleGrid,
  isMaximizedViewport = false,
  onToggleMaximizeViewport,
  onClearScene,
  zoomPercent = 100,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  spawnPlacementPoint = null,
  onClearSpawnPlacementPoint
}) => {
  const [isAngleMenuOpen, setIsAngleMenuOpen] = useState(false)
  const [currentAngle, setCurrentAngle] = useState('Front')
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isEntityMenuOpen, setIsEntityMenuOpen] = useState(false)
  const [isHintsExpanded, setIsHintsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scene_viewport_hints_expanded')
      return saved !== null ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })
  const [isHintsHovered, setIsHintsHovered] = useState<boolean>(false)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    try {
      localStorage.setItem('vrm_scene_onboarding_dismissed', 'true')
    } catch {}
  }, [])

  // Draggable Toolbar State
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [toolbarPos, setToolbarPos] = useState<ToolbarPos | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number }>({
    startMouseX: 0,
    startMouseY: 0,
    startPosX: 0,
    startPosY: 0
  })

  // Bounds Clamping helper
  const getClampedPos = useCallback((rawX: number, rawY: number): ToolbarPos => {
    if (!containerRef.current || !toolbarRef.current) return { x: rawX, y: rawY }
    const containerW = containerRef.current.clientWidth
    const containerH = containerRef.current.clientHeight
    const toolbarW = toolbarRef.current.offsetWidth
    const toolbarH = toolbarRef.current.offsetHeight

    const minX = 12
    const maxX = Math.max(minX, containerW - toolbarW - 12)
    const minY = 12
    const maxY = Math.max(minY, containerH - toolbarH - 12)

    return {
      x: Math.min(Math.max(minX, rawX), maxX),
      y: Math.min(Math.max(minY, rawY), maxY)
    }
  }, [])

  // Initialize position and restore from sessionStorage if within viewport bounds
  useEffect(() => {
    const updateInitialPosition = () => {
      if (!containerRef.current || !toolbarRef.current) return
      const containerW = containerRef.current.clientWidth
      const containerH = containerRef.current.clientHeight
      const toolbarW = toolbarRef.current.offsetWidth
      const toolbarH = toolbarRef.current.offsetHeight

      if (containerW <= 0 || containerH <= 0) return

      const defaultX = Math.max(12, Math.round((containerW - toolbarW) / 2))
      const defaultY = Math.max(12, containerH - toolbarH - 16)

      let loadedPos: ToolbarPos | null = null
      try {
        const saved = sessionStorage.getItem(TOOLBAR_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            const minX = 12
            const maxX = Math.max(minX, containerW - toolbarW - 12)
            const minY = 12
            const maxY = Math.max(minY, containerH - toolbarH - 12)

            // If the saved position is still within visible viewport bounds, restore it
            if (parsed.x >= minX - 20 && parsed.x <= maxX + 20 && parsed.y >= minY - 20 && parsed.y <= maxY + 20) {
              loadedPos = {
                x: Math.min(Math.max(minX, parsed.x), maxX),
                y: Math.min(Math.max(minY, parsed.y), maxY)
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse toolbar position from sessionStorage', e)
      }

      setToolbarPos(loadedPos || { x: defaultX, y: defaultY })
    }

    updateInitialPosition()
    const raf = requestAnimationFrame(updateInitialPosition)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Auto-clamp when container or window resizes
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      setToolbarPos(prev => {
        if (!prev || !containerRef.current || !toolbarRef.current) return prev
        const containerW = containerRef.current.clientWidth
        const containerH = containerRef.current.clientHeight
        const toolbarW = toolbarRef.current.offsetWidth
        const toolbarH = toolbarRef.current.offsetHeight

        if (containerW <= 0 || containerH <= 0) return prev

        const minX = 12
        const maxX = Math.max(minX, containerW - toolbarW - 12)
        const minY = 12
        const maxY = Math.max(minY, containerH - toolbarH - 12)

        const clampedX = Math.min(Math.max(minX, prev.x), maxX)
        const clampedY = Math.min(Math.max(minY, prev.y), maxY)

        if (clampedX !== prev.x || clampedY !== prev.y) {
          const next = { x: clampedX, y: clampedY }
          try {
            sessionStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(next))
          } catch {}
          return next
        }
        return prev
      })
    })

    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Drag start handler
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    let currentX = 0
    let currentY = 0

    if (toolbarPos) {
      currentX = toolbarPos.x
      currentY = toolbarPos.y
    } else if (containerRef.current && toolbarRef.current) {
      const containerW = containerRef.current.clientWidth
      const containerH = containerRef.current.clientHeight
      const toolbarW = toolbarRef.current.offsetWidth
      const toolbarH = toolbarRef.current.offsetHeight
      currentX = Math.max(12, Math.round((containerW - toolbarW) / 2))
      currentY = Math.max(12, containerH - toolbarH - 16)
    }

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: currentX,
      startPosY: currentY
    }
    setIsDragging(true)

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startMouseX
      const deltaY = moveEvent.clientY - dragStartRef.current.startMouseY
      const newPos = getClampedPos(
        dragStartRef.current.startPosX + deltaX,
        dragStartRef.current.startPosY + deltaY
      )
      setToolbarPos(newPos)
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)

      const deltaX = upEvent.clientX - dragStartRef.current.startMouseX
      const deltaY = upEvent.clientY - dragStartRef.current.startMouseY
      const finalPos = getClampedPos(
        dragStartRef.current.startPosX + deltaX,
        dragStartRef.current.startPosY + deltaY
      )
      setToolbarPos(finalPos)
      try {
        sessionStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(finalPos))
      } catch {}
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
      {/* Top-Left Essential Viewport Controls */}
      <div className="absolute top-4 left-14 pointer-events-auto flex items-center gap-1.5 p-1 bg-[#120F1A]/90 backdrop-blur-md border border-[#2E2548] rounded-xl shadow-xl">
        {/* Quick View Presets: Clean Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsAngleMenuOpen(!isAngleMenuOpen)
              setIsMoreMenuOpen(false)
            }}
            title="Camera View Angle Presets"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1528] hover:bg-[#251E38] border border-[#2E2548]/80 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <span>{currentAngle} View</span>
            <ChevronDown className="w-3 h-3 text-[#8A81A6]" />
          </button>

          {isAngleMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-40 bg-[#1A1528] border border-[#2E2548] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in">
              <span className="text-[10px] font-bold text-[#8A81A6] px-2 py-1 block uppercase tracking-wider">
                Camera Angle
              </span>
              {[
                { label: 'Front', angle: 'front' as const },
                { label: 'Side Left', angle: 'sideLeft' as const },
                { label: 'Side Right', angle: 'sideRight' as const },
                { label: 'Top', angle: 'top' as const },
                { label: 'Isometric', angle: 'iso' as const },
                { label: 'Back', angle: 'back' as const },
                { label: 'Face Close-up', angle: 'face' as const },
                { label: 'Bust Portrait', angle: 'bust' as const }
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    setCurrentAngle(item.label)
                    onSetCameraAngle?.(item.angle)
                    setIsAngleMenuOpen(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                    currentAngle === item.label
                      ? 'bg-[#8C7BFF]/25 text-white font-bold'
                      : 'text-[#D0CDE0] hover:text-white hover:bg-[#251E38]'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-3.5 bg-[#2E2548]" />

        {/* Essential: Reset View Button (Safety Net) */}
        <button
          onClick={onResetView}
          title="Reset View [Home] — Centers and frames scene with default perspective"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#8C7BFF] hover:from-[#6D28D9] hover:to-[#7C3AED] border border-[#A78BFA]/50 shadow-sm shadow-[#7C3AED]/20 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-white" />
          <span>Reset</span>
          <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/30 text-white/90 font-mono border border-white/20">Home</kbd>
        </button>

        {/* Essential: Fit Button */}
        <button
          onClick={onFocusSelected}
          title="Fit Selected [F] — Focuses camera directly on active selection"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#FFA000] hover:text-white bg-[#FFA000]/15 hover:bg-[#FFA000]/30 border border-[#FFA000]/40 transition-all cursor-pointer"
        >
          <Focus className="w-3.5 h-3.5 text-[#FFA000]" />
          <span>Fit</span>
          <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-[#FFA000] font-mono border border-[#FFA000]/30">F</kbd>
        </button>

        <div className="w-px h-3.5 bg-[#2E2548]" />

        {/* Secondary Options Menu: Tucked behind clean more button */}
        <div className="relative">
          <button
            onClick={() => {
              setIsMoreMenuOpen(!isMoreMenuOpen)
              setIsAngleMenuOpen(false)
            }}
            title="More Viewport Options"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isMoreMenuOpen ? 'text-white bg-[#2E2548]' : 'text-[#A09BB5] hover:text-white hover:bg-[#201A30]'
            }`}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {isMoreMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#1A1528] border border-[#2E2548] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in">
              {/* Floor Grid Toggle */}
              <button
                onClick={() => {
                  onToggleGrid?.()
                  setIsMoreMenuOpen(false)
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5 text-[#8C7BFF]" />
                  <span>Floor Grid</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${showGrid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-[#706B85]'}`}>
                  {showGrid ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Maximize Viewport */}
              <button
                onClick={() => {
                  onToggleMaximizeViewport?.()
                  setIsMoreMenuOpen(false)
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isMaximizedViewport ? <Minimize2 className="w-3.5 h-3.5 text-[#00E676]" /> : <Maximize2 className="w-3.5 h-3.5 text-[#8C7BFF]" />}
                  <span>{isMaximizedViewport ? 'Restore Viewport' : 'Maximize Viewport'}</span>
                </div>
                <kbd className="text-[9px] px-1 py-0.5 rounded bg-black/40 text-[#706B85] font-mono">Ctrl+Space</kbd>
              </button>

              {/* Shortcuts & Guide */}
              <button
                onClick={() => {
                  setShowOnboarding(true)
                  setIsMoreMenuOpen(false)
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] flex items-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#8C7BFF]" />
                <span>Shortcuts & Guide</span>
              </button>

              {/* Clear Scene */}
              {onClearScene && (
                <>
                  <div className="h-px bg-[#2E2548] my-1" />
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false)
                      if (window.confirm('Are you sure you want to clear the entire scene? This will remove all placed characters and props.')) {
                        onClearScene()
                      }
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Scene</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2b. Persistent Axis / Orientation Gizmo (Blender-style top-right interactive 3D orientation indicator) */}
      {onSnapCameraDirection && (
        <div className="absolute top-4 right-14 pointer-events-auto z-40">
          <OrientationGizmo
            onSnapDirection={onSnapCameraDirection}
            onOrbitDelta={onOrbitCameraDelta}
            subscribeCamera={subscribeCameraChange}
          />
        </div>
      )}

      {/* Full Viewport Mode Overlay Indicator */}
      {isMaximizedViewport && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 bg-[#120F1A]/95 backdrop-blur-md border border-[#00E676]/60 rounded-full shadow-2xl z-40 text-xs font-bold text-white animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
          <span>Full Viewport Mode</span>
          <span className="text-[#8A81A6] font-normal text-[11px]">·</span>
          <button
            onClick={onToggleMaximizeViewport}
            className="flex items-center gap-1 text-[#00E676] hover:text-white px-2 py-0.5 rounded-full hover:bg-[#00E676]/20 transition-all cursor-pointer"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Restore (Esc)</span>
          </button>
        </div>
      )}

      {/* Click-to-Place Target Spawning Indicator */}
      {!isMaximizedViewport && spawnPlacementPoint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 bg-[#120F1A]/95 backdrop-blur-md border border-[#00E5FF]/70 rounded-full shadow-2xl shadow-[#00E5FF]/20 z-40 text-xs font-bold text-white animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="flex items-center gap-1 text-[#00E5FF]">
            <Target className="w-3.5 h-3.5" />
            <span>Target:</span>
          </span>
          <span className="font-mono text-white/95 font-medium">[{spawnPlacementPoint[0].toFixed(2)}, 0.00, {spawnPlacementPoint[2].toFixed(2)}]</span>
          <span className="text-[#8A81A6] font-normal text-[11px] hidden sm:inline">• Characters & assets spawn here</span>
          {onClearSpawnPlacementPoint && (
            <button
              onClick={onClearSpawnPlacementPoint}
              title="Clear Target Spawn Point (Esc)"
              className="p-1 -mr-1 rounded-full text-white/60 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 3. Bottom-Right Viewport Control Hint & Zoom Indicator (Two-Tier Layout: Renders on Row 2 above transform bar when entity is selected to prevent overlap) */}
      {(() => {
        const isToolbarNearBottom = Boolean(
          selectedEntity && (
            !toolbarPos ||
            (containerRef.current ? toolbarPos.y >= containerRef.current.clientHeight - 90 : true)
          )
        )

        return (
          <div 
            onMouseEnter={() => setIsHintsHovered(true)}
            onMouseLeave={() => setIsHintsHovered(false)}
            className={`absolute pointer-events-auto z-40 transition-all duration-200 ease-out right-4 ${
              isToolbarNearBottom ? 'bottom-[68px]' : 'bottom-3.5'
            } flex items-center gap-2 max-w-[calc(100vw-32px)]`}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#120F1A]/95 backdrop-blur-md border border-[#4C3F75] text-xs text-white font-medium shadow-2xl shadow-black/60">
              <button
                onClick={onResetZoom}
                className="flex items-center gap-1 font-mono font-bold bg-[#8C7BFF]/30 hover:bg-[#8C7BFF]/45 text-[#EDE9FE] px-2 py-0.5 rounded-md border border-[#8C7BFF]/60 transition-all cursor-pointer text-xs"
                title="Zoom percentage (click to reset to 100%)"
              >
                {zoomPercent || 100}%
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onZoomIn}
                  className="w-5 h-5 rounded flex items-center justify-center bg-[#251E38] hover:bg-[#3D3260] text-white hover:text-[#C4B5FD] transition-colors cursor-pointer text-xs font-bold border border-[#4C3F75]"
                  title="Zoom In (Ctrl +)"
                >
                  +
                </button>
                <button
                  onClick={onZoomOut}
                  className="w-5 h-5 rounded flex items-center justify-center bg-[#251E38] hover:bg-[#3D3260] text-white hover:text-[#C4B5FD] transition-colors cursor-pointer text-xs font-bold border border-[#4C3F75]"
                  title="Zoom Out (Ctrl -)"
                >
                  -
                </button>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C7BFF]" />

              {/* Navigation Control Badges (Collapsible / Expandable with hover tooltip) */}
              {isHintsExpanded || isHintsHovered ? (
                <div className="flex items-center gap-2 text-[#F1EDFF] font-medium tracking-normal text-xs whitespace-nowrap animate-in fade-in duration-150">
                  <span className="flex items-center gap-1">
                    <strong className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded text-[11px]">Orbit</strong>
                    <span className="text-[#D8D2EC]">Left-drag</span>
                  </span>
                  <span className="text-[#8C7BFF]">·</span>
                  <span className="flex items-center gap-1">
                    <strong className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded text-[11px]">Pan</strong>
                    <span className="text-[#D8D2EC]">Shift+drag</span>
                  </span>
                  <span className="text-[#8C7BFF]">·</span>
                  <span className="flex items-center gap-1">
                    <strong className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded text-[11px]">Zoom</strong>
                    <span className="text-[#D8D2EC]">Scroll</span>
                  </span>
                </div>
              ) : (
                <div 
                  onClick={() => setIsHintsExpanded(true)}
                  className="flex items-center gap-1.5 text-xs text-[#C4B5FD] hover:text-white cursor-pointer group px-1"
                  title="Click to expand viewport controls"
                >
                  <Info className="w-3.5 h-3.5 text-[#8C7BFF] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[11px] uppercase tracking-wider">Controls</span>
                </div>
              )}

              {/* Quick toggle chevron */}
              <button
                onClick={() => {
                  setIsHintsExpanded(prev => {
                    const next = !prev
                    try {
                      localStorage.setItem('scene_viewport_hints_expanded', JSON.stringify(next))
                    } catch {}
                    return next
                  })
                }}
                className="p-1 rounded text-[#8A81A6] hover:text-white hover:bg-[#251E38] transition-colors cursor-pointer"
                title={isHintsExpanded ? "Collapse navigation hints to compact mode" : "Expand full navigation hints"}
              >
                {isHintsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )
      })()}

      {/* 4. First-Time Onboarding Tooltip / Viewport Cheat Sheet (Requirement 6) */}
      {showOnboarding && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[92%] max-w-lg pointer-events-auto bg-[#130F1E]/95 backdrop-blur-xl border border-[#8C7BFF]/50 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#2E2548]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8C7BFF]" />
              <h3 className="text-sm font-bold text-white tracking-wide">3D Viewport Controls & Shortcuts</h3>
            </div>
            <button
              onClick={dismissOnboarding}
              className="text-[#8A81A6] hover:text-white p-1 rounded-lg hover:bg-[#201A30] transition-colors cursor-pointer"
              title="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
            <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 flex flex-col gap-1">
              <span className="font-bold text-[#C4B5FD] flex items-center gap-1">
                <span>Camera Navigation</span>
              </span>
              <span className="text-[#A09BB5] text-[11px] leading-relaxed">
                <strong className="text-white">Left-drag:</strong> Orbit around<br/>
                <strong className="text-white">Shift+drag:</strong> Pan viewport<br/>
                <strong className="text-white">Scroll / +/-:</strong> Smooth Zoom
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 flex flex-col gap-1">
              <span className="font-bold text-[#C4B5FD] flex items-center gap-1">
                <span>Transform Gizmo</span>
              </span>
              <span className="text-[#A09BB5] text-[11px] leading-relaxed">
                <kbd className="px-1.5 py-0.5 rounded bg-[#251E38] text-white border border-[#3D335A] font-mono">W</kbd> Move/Translate<br/>
                <kbd className="px-1.5 py-0.5 rounded bg-[#251E38] text-white border border-[#3D335A] font-mono">E</kbd> Rotate<br/>
                <kbd className="px-1.5 py-0.5 rounded bg-[#251E38] text-white border border-[#3D335A] font-mono">R</kbd> Scale · <kbd className="px-1.5 py-0.5 rounded bg-[#251E38] text-white border border-[#3D335A] font-mono">Q</kbd> Space
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 flex flex-col gap-1">
              <span className="font-bold text-[#FFA000] flex items-center gap-1">
                <span>Smart Auto-Framing</span>
              </span>
              <span className="text-[#A09BB5] text-[11px] leading-relaxed">
                <kbd className="px-1.5 py-0.5 rounded bg-[#251E38] text-white border border-[#3D335A] font-mono">F</kbd> Fit Selected Object<br/>
                Auto-centers on add/select<br/>
                <strong className="text-white">Reset View [Home]:</strong> Default
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 flex flex-col gap-1 col-span-2">
              <span className="font-bold text-[#00E5FF] flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Click-to-Place Spawning</span>
              </span>
              <span className="text-[#A09BB5] text-[11px] leading-relaxed">
                Click anywhere on the ground or terrain to place a <strong className="text-[#00E5FF]">3D target marker</strong>. When you add a character or prop, it spawns precisely at that marked coordinate. Press <kbd className="px-1.5 py-0.5 rounded bg-[#251E38] text-white border border-[#3D335A] font-mono">Esc</kbd> to clear.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#2E2548]/70">
            <span className="text-[11px] text-[#8A81A6]">Reopen anytime via the <HelpCircle className="w-3 h-3 inline text-[#8C7BFF]" /> button in the top bar.</span>
            <button
              onClick={dismissOnboarding}
              className="px-4 py-1.5 rounded-xl bg-[#8C7BFF] hover:bg-[#7864FF] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* 5. Draggable Bottom Viewport Toolbar: Move/Rotate/Scale/World/Focus AND Entity Tag (Renders on row 1 at bottom center when entity is selected) */}
      {selectedEntity && (
        <div 
          ref={toolbarRef}
          style={toolbarPos ? {
            position: 'absolute',
            left: `${toolbarPos.x}px`,
            top: `${toolbarPos.y}px`
          } : {
            position: 'absolute',
            bottom: '14px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
          className={`pointer-events-auto flex items-center justify-center gap-2.5 z-50 max-w-[calc(100vw-32px)] ${isDragging ? 'select-none transition-none cursor-grabbing' : 'transition-[left,top] duration-75 ease-out'}`}
        >
        {/* Transform Tool Capsule */}
        <div className="flex items-center gap-1 p-1 bg-[#120F1A]/95 backdrop-blur-md border border-[#2E2548] rounded-xl shadow-2xl shrink-0">
          {/* Draggable Grip Handle */}
          <div
            onMouseDown={handleDragStart}
            title="Click and drag to reposition toolbar anywhere within the viewport"
            className={`flex items-center justify-center px-1.5 py-1.5 rounded-lg text-[#8A81A6] hover:text-white hover:bg-[#201A30] active:text-[#8C7BFF] transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'cursor-grabbing text-[#8C7BFF] bg-[#201A30]' : ''}`}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <div className="w-px h-4 bg-[#2E2548] mr-0.5" />

          {/* Move */}
          <button
            onClick={() => onGizmoModeChange('translate')}
            title="Translate / Move [W]"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gizmoMode === 'translate'
                ? 'border border-[#8C7BFF] bg-[#8C7BFF]/25 text-white shadow-sm shadow-[#8C7BFF]/20'
                : 'text-[#A09BB5] hover:text-white hover:bg-[#201A30]'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Move</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-[#8C7BFF] font-mono border border-white/10">W</kbd>
          </button>

          {/* Rotate */}
          <button
            onClick={() => onGizmoModeChange('rotate')}
            title="Rotate [E]"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gizmoMode === 'rotate'
                ? 'border border-[#8C7BFF] bg-[#8C7BFF]/25 text-white shadow-sm shadow-[#8C7BFF]/20'
                : 'text-[#A09BB5] hover:text-white hover:bg-[#201A30]'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-[#8C7BFF] font-mono border border-white/10">E</kbd>
          </button>

          {/* Scale */}
          <button
            onClick={() => onGizmoModeChange('scale')}
            title="Scale [R]"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gizmoMode === 'scale'
                ? 'border border-[#8C7BFF] bg-[#8C7BFF]/25 text-white shadow-sm shadow-[#8C7BFF]/20'
                : 'text-[#A09BB5] hover:text-white hover:bg-[#201A30]'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Scale</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-[#8C7BFF] font-mono border border-white/10">R</kbd>
          </button>

          <div className="w-px h-4 bg-[#2E2548] mx-0.5" />

          {/* Coordinate Space Toggle */}
          <button
            onClick={() => onGizmoSpaceChange(gizmoSpace === 'world' ? 'local' : 'world')}
            title={`Coordinate Space: ${gizmoSpace} [Q]`}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-[#A09BB5] hover:text-white hover:bg-[#201A30] transition-all cursor-pointer capitalize"
          >
            <Globe className="w-3.5 h-3.5 text-[#8C7BFF]" />
            <span>{gizmoSpace}</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-[#8A81A6] font-mono border border-white/10">Q</kbd>
          </button>

          <div className="w-px h-4 bg-[#2E2548] mx-0.5" />

          {/* Focus on Selected Entity */}
          <button
            onClick={onFocusSelected}
            title="Focus Camera on Selected Entity [F]"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#FFA000] hover:bg-[#FFA000]/20 transition-all cursor-pointer"
          >
            <Focus className="w-3.5 h-3.5" />
            <span>Fit</span>
            <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-[#FFA000] font-mono border border-[#FFA000]/30">F</kbd>
          </button>
        </div>

        {/* Selected Entity Name Tag with Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsEntityMenuOpen(!isEntityMenuOpen)}
            title="Selected Scene Entity"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#120F1A]/95 backdrop-blur-md border border-[#2E2548] hover:border-[#8C7BFF]/50 text-xs font-bold text-white shadow-2xl transition-all cursor-pointer"
          >
            {selectedEntity?.type === 'character' ? (
              <User className="w-3.5 h-3.5 text-[#8C7BFF]" />
            ) : selectedEntity?.type === 'prop' ? (
              <Box className="w-3.5 h-3.5 text-[#3B82F6]" />
            ) : selectedEntity?.type === 'camera' ? (
              <Camera className="w-3.5 h-3.5 text-[#38BDF8]" />
            ) : (
              <User className="w-3.5 h-3.5 text-[#8C7BFF]" />
            )}
            <span className="max-w-[130px] truncate">{selectedEntityName}</span>
            <ChevronDown className="w-3 h-3 text-[#8A81A6]" />
          </button>

          {isEntityMenuOpen && (
            <div className={`absolute ${toolbarPos && toolbarPos.y < 220 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'} right-0 sm:left-0 w-48 bg-[#1A1528] border border-[#2E2548] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in`}>
              <span className="text-[10px] font-bold text-[#8A81A6] px-2 py-0.5 block uppercase tracking-wider">
                Select Entity
              </span>
              {sceneCharacters.map(char => (
                <button
                  key={char.id}
                  onClick={() => {
                    onSelectEntity({ type: 'character', id: char.id })
                    setIsEntityMenuOpen(false)
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-3 h-3 text-[#8C7BFF]" />
                  <span className="truncate">{char.name}</span>
                </button>
              ))}
              {sceneProps.map(prop => (
                <button
                  key={prop.id}
                  onClick={() => {
                    onSelectEntity({ type: 'prop', id: prop.id })
                    setIsEntityMenuOpen(false)
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] flex items-center gap-2 cursor-pointer"
                >
                  <Box className="w-3 h-3 text-[#3B82F6]" />
                  <span className="truncate">{prop.name}</span>
                </button>
              ))}
              {cameraShots && cameraShots.length > 0 && (
                <>
                  <span className="text-[10px] font-bold text-[#8A81A6] px-2 pt-1.5 pb-0.5 block uppercase tracking-wider border-t border-[#2E2548]/60 mt-1">
                    Cameras
                  </span>
                  {cameraShots.map(cam => (
                    <button
                      key={cam.id}
                      onClick={() => {
                        onSelectEntity({ type: 'camera', id: cam.id })
                        setIsEntityMenuOpen(false)
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-3 h-3 text-[#38BDF8]" />
                      <span className="truncate">{cam.name}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
