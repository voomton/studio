import React, { useState, useRef, useCallback, useEffect } from 'react'
import { 
  Video, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronRight, 
  User, 
  Sparkles, 
  Lightbulb, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Camera
} from 'lucide-react'
import { SceneCameraShot, SceneCharacterInstance } from '../../types/scene'
import { AnimationProject, AnimationTrack, CameraCut, AnimationClip } from '../../types/animation'
import { CinemaResizer } from './CinemaResizer'

interface CinemaTimelineProps {
  project: AnimationProject
  onUpdateProject: (updater: (prev: AnimationProject) => AnimationProject) => void
  sceneCharacters: SceneCharacterInstance[]
  cameraShots: SceneCameraShot[]
  activeCameraShotId: string | null
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onSeekFrame: (frame: number) => void
  onApplyClipToCharacter: (charId: string, clipData: any) => void
  headerWidth: number
  onHeaderResize: (delta: number) => void
}

export const CinemaTimeline: React.FC<CinemaTimelineProps> = ({
  project,
  onUpdateProject,
  sceneCharacters,
  cameraShots,
  activeCameraShotId,
  onApplyCameraShot,
  onSeekFrame,
  onApplyClipToCharacter,
  headerWidth,
  onHeaderResize
}) => {
  // Zoom level: pixels per frame
  const [zoom, setZoom] = useState<number>(5) // 5px per frame = 120px per second @ 24fps

  // Collapsed character groups (keyed by character ID)
  const [expandedCharacterIds, setExpandedCharacterIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    sceneCharacters.forEach(c => { map[c.id] = true })
    return map
  })

  // Collapsed Lights & FX group
  const [isLightsExpanded, setIsLightsExpanded] = useState<boolean>(true)

  // Track hidden visibility state
  const [hiddenTrackIds, setHiddenTrackIds] = useState<Record<string, boolean>>({})

  // Timeline scrub dragging state
  const [isScrubbing, setIsScrubbing] = useState(false)
  const timelineGridRef = useRef<HTMLDivElement>(null)

  // Drag over frame indicator for external clip drop
  const [dragOverFrame, setDragOverFrame] = useState<number | null>(null)

  const toggleCharacterExpand = (charId: string) => {
    setExpandedCharacterIds(prev => ({
      ...prev,
      [charId]: prev[charId] === undefined ? false : !prev[charId]
    }))
  }

  const toggleTrackVisibility = (trackKey: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHiddenTrackIds(prev => ({
      ...prev,
      [trackKey]: !prev[trackKey]
    }))
  }

  // Format frame into timecode (HH:MM:SS:FF or MM:SS:FF)
  const formatTimecode = useCallback((frame: number) => {
    const fps = project.fps || 24
    const totalSeconds = Math.floor(frame / fps)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const remainingFrames = frame % fps
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(remainingFrames).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(remainingFrames).padStart(2, '0')}`
  }, [project.fps])

  // Format ruler seconds (supports hours: HH:MM:SS or MM:SS)
  const formatRulerTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [])

  // Zoom controls handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(24, Number((prev * 1.35).toFixed(2))))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(0.04, Number((prev * 0.75).toFixed(3))))
  }, [])

  const handleFitToView = useCallback(() => {
    if (!timelineGridRef.current) return
    const containerWidth = timelineGridRef.current.clientWidth - 80
    const totalFrames = project.totalFrames || 720
    if (containerWidth > 0 && totalFrames > 0) {
      const calculatedZoom = Math.max(0.04, Math.min(24, Number((containerWidth / totalFrames).toFixed(3))))
      setZoom(calculatedZoom)
    }
  }, [project.totalFrames])

  // Scroll wheel zoom handler (Ctrl/Alt + Scroll, or direct wheel over ruler)
  const handleTimelineWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.altKey || e.metaKey) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.25 : 0.8
      setZoom(prev => Math.max(0.04, Math.min(24, Number((prev * factor).toFixed(3)))))
    }
  }, [])

  const handleRulerWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.25 : 0.8
    setZoom(prev => Math.max(0.04, Math.min(24, Number((prev * factor).toFixed(3)))))
  }, [])

  // Playhead scrubbing handler
  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (!timelineGridRef.current) return
    setIsScrubbing(true)

    const rect = timelineGridRef.current.getBoundingClientRect()
    const scrollLeft = timelineGridRef.current.scrollLeft
    const clickX = e.clientX - rect.left + scrollLeft
    const frame = Math.max(0, Math.min(project.totalFrames, Math.round(clickX / zoom)))
    onSeekFrame(frame)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineGridRef.current) return
      const curRect = timelineGridRef.current.getBoundingClientRect()
      const curScroll = timelineGridRef.current.scrollLeft
      const curX = moveEvent.clientX - curRect.left + curScroll
      const curFrame = Math.max(0, Math.min(project.totalFrames, Math.round(curX / zoom)))
      onSeekFrame(curFrame)
    }

    const handleMouseUp = () => {
      setIsScrubbing(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Fallback characters if sceneCharacters is empty
  const activeCharacters = sceneCharacters.length > 0 
    ? sceneCharacters 
    : [{ id: 'char_default', name: 'Rin (Main)' }] as any[]

  // Camera cuts: either from project or generated dynamically from cameraShots
  const effectiveCuts: CameraCut[] = project.cameraCuts && project.cameraCuts.length > 0
    ? project.cameraCuts
    : cameraShots.map((shot, idx) => ({
        id: `cut_${shot.id}`,
        cameraShotId: shot.id,
        cameraName: shot.name,
        startFrame: idx * 72,
        durationFrames: 72,
        transition: 'cut',
        color: idx % 3 === 0 ? '#3B82F6' : (idx % 3 === 1 ? '#8C7BFF' : '#10B981')
      }))

  // Handle Drag & Drop onto timeline
  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!timelineGridRef.current) return
    const rect = timelineGridRef.current.getBoundingClientRect()
    const scrollLeft = timelineGridRef.current.scrollLeft
    const x = e.clientX - rect.left + scrollLeft
    const frame = Math.max(0, Math.min(project.totalFrames, Math.round(x / zoom)))
    setDragOverFrame(frame)
  }

  const handleTimelineDragLeave = () => {
    setDragOverFrame(null)
  }

  const handleTimelineDrop = (e: React.DragEvent, targetCharId?: string) => {
    e.preventDefault()
    setDragOverFrame(null)
    try {
      const dataStr = e.dataTransfer.getData('text/plain')
      if (!dataStr) return
      const item = JSON.parse(dataStr)

      const targetFrame = dragOverFrame !== null ? dragOverFrame : project.currentFrame

      if (item.itemType === 'shot') {
        // Add new camera cut
        const newCut: CameraCut = {
          id: `cut_${Date.now()}`,
          cameraShotId: item.id,
          cameraName: item.name,
          startFrame: targetFrame,
          durationFrames: 72, // 3 seconds @ 24fps
          transition: 'cut',
          color: '#8C7BFF'
        }
        onUpdateProject(prev => ({
          ...prev,
          cameraCuts: [...(prev.cameraCuts || []), newCut].sort((a, b) => a.startFrame - b.startFrame)
        }))
        onApplyCameraShot(item)
      } else {
        // Add animation clip to target character
        const charId = targetCharId || activeCharacters[0]?.id
        if (charId) {
          onApplyClipToCharacter(charId, item)
        }
      }
    } catch (err) {
      console.error('Error handling timeline drop:', err)
    }
  }

  // Calculate total timeline width based on zoom and totalFrames (3s up to 1h+)
  const totalTimelineWidth = Math.max(1200, (project.totalFrames || 720) * zoom + 300)

  // Generate ruler tick marks dynamically based on pixel density
  const fps = project.fps || 24
  const totalFrames = project.totalFrames || 720
  const totalSeconds = Math.ceil(totalFrames / fps) + 5
  const pxPerSecond = zoom * fps

  // Choose interval so major ticks are roughly 80px to 140px apart
  let secondInterval = 1
  if (pxPerSecond < 0.2) secondInterval = 600 // 10 minutes
  else if (pxPerSecond < 0.5) secondInterval = 300 // 5 minutes
  else if (pxPerSecond < 1.5) secondInterval = 60 // 1 minute
  else if (pxPerSecond < 4) secondInterval = 30 // 30 seconds
  else if (pxPerSecond < 10) secondInterval = 10 // 10 seconds
  else if (pxPerSecond < 30) secondInterval = 5 // 5 seconds
  else if (pxPerSecond < 60) secondInterval = 2 // 2 seconds
  else secondInterval = 1 // 1 second

  const rulerTicks = []
  const maxTicks = Math.min(Math.ceil(totalSeconds / secondInterval), 400)
  for (let i = 0; i <= maxTicks; i++) {
    const sec = i * secondInterval
    if (sec > totalSeconds) break
    const frame = sec * fps
    const leftPx = frame * zoom
    rulerTicks.push({
      seconds: sec,
      frame,
      leftPx,
      label: formatRulerTime(sec)
    })
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#16121E] select-none overflow-hidden relative">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ===================================================================== */}
        {/* LEFT COLUMN: Track Headers (Fixed left column, width resizable)      */}
        {/* ===================================================================== */}
        <div
          style={{ width: `${headerWidth}px` }}
          className="shrink-0 flex flex-col border-r border-[#2E2548]/80 bg-[#171222] z-10 overflow-hidden"
        >
          {/* Top ruler header box */}
          <div className="h-8 px-2.5 border-b border-[#2E2548]/80 flex items-center justify-between shrink-0 bg-[#1B1527] gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-bold text-[#A09BB5] uppercase tracking-wider shrink-0">
                Tracks
              </span>
              {/* Keyframe Legend badge explaining diamond markers */}
              <div
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#251E38] border border-[#3E325E] text-[10px] text-[#C4B5FD] font-semibold cursor-help shrink-0 shadow-sm"
                title="Diamond markers (◆) are editable animation keyframes. Click any diamond on a track to jump playhead to that frame."
              >
                <span className="text-[#8C7BFF] text-xs leading-none">◆</span>
                <span className="text-[9px] font-mono">Keyframe</span>
              </div>
            </div>

            {/* Fully Functional Zoom In / Out Controls & Slider */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleZoomOut}
                title="Zoom Out Timeline (Ctrl + Scroll Down)"
                className="p-1 rounded text-[#A09BB5] hover:text-white hover:bg-[#2A213D] transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min="0.04"
                max="24"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                title={`Timeline Zoom: ${zoom.toFixed(2)}px/frame`}
                className="w-10 sm:w-14 h-1 bg-[#2E2548] rounded appearance-none cursor-pointer accent-[#8C7BFF]"
              />

              <button
                onClick={handleZoomIn}
                title="Zoom In Timeline (Ctrl + Scroll Up)"
                className="p-1 rounded text-[#A09BB5] hover:text-white hover:bg-[#2A213D] transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleFitToView}
                title="Fit Entire Timeline to Window Width"
                className="px-1.5 py-0.5 rounded text-[9px] font-bold text-[#C4B5FD] hover:text-white hover:bg-[#8C7BFF]/20 border border-[#3E325E] transition-colors cursor-pointer"
              >
                Fit
              </button>
            </div>
          </div>

          {/* Track Labels List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#2E2548]/40">
            {/* 1. Camera Cuts Track Header */}
            <div className="h-10 px-3 flex items-center justify-between bg-[#191325] hover:bg-[#211A30] transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <Video className="w-3.5 h-3.5 text-[#8C7BFF] shrink-0" />
                <span className="text-xs font-bold text-white truncate">Camera Cuts</span>
              </div>
              <button
                onClick={(e) => toggleTrackVisibility('camera_cuts', e)}
                className="p-1 text-[#8A81A6] hover:text-white transition-colors cursor-pointer"
              >
                {hiddenTrackIds['camera_cuts'] ? <EyeOff className="w-3.5 h-3.5 text-red-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 2. Character Groups (Per Real Character) */}
            {activeCharacters.map((char) => {
              const isExpanded = expandedCharacterIds[char.id] !== false
              const isHidden = hiddenTrackIds[char.id]
              return (
                <div key={`header_group_${char.id}`} className="flex flex-col">
                  {/* Character Main Group Header */}
                  <div
                    onClick={() => toggleCharacterExpand(char.id)}
                    className="h-10 px-3 flex items-center justify-between bg-[#1C162B] hover:bg-[#251E38] transition-colors cursor-pointer border-t border-[#2E2548]/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#8C7BFF] shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#8A81A6] shrink-0" />
                      )}
                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#8C7BFF] to-[#EC4899] flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0">
                        {char.name?.charAt(0) || 'C'}
                      </div>
                      <span className="text-xs font-bold text-white truncate">
                        {char.name}
                      </span>
                    </div>

                    <button
                      onClick={(e) => toggleTrackVisibility(char.id, e)}
                      className="p-1 text-[#8A81A6] hover:text-white transition-colors cursor-pointer"
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5 text-red-400" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Character Sub-tracks when Expanded */}
                  {isExpanded && (
                    <div className="flex flex-col divide-y divide-[#2E2548]/30 bg-[#161122]">
                      {/* Position Sub-track */}
                      <div className="h-8 pl-8 pr-3 flex items-center justify-between hover:bg-[#201830] transition-colors">
                        <div className="flex items-center gap-1.5 min-w-0 text-[#A09BB5]">
                          <span className="text-[10px] text-[#3B82F6]">◇</span>
                          <span className="text-[11px] font-medium truncate">
                            {char.name} (Position)
                          </span>
                        </div>
                        <button
                          onClick={(e) => toggleTrackVisibility(`${char.id}_pos`, e)}
                          className="p-1 text-[#6A6282] hover:text-white"
                        >
                          {hiddenTrackIds[`${char.id}_pos`] ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Pose Sub-track */}
                      <div className="h-8 pl-8 pr-3 flex items-center justify-between hover:bg-[#201830] transition-colors">
                        <div className="flex items-center gap-1.5 min-w-0 text-[#A09BB5]">
                          <span className="text-[10px] text-[#EC4899]">◇</span>
                          <span className="text-[11px] font-medium truncate">
                            {char.name} (Pose)
                          </span>
                        </div>
                        <button
                          onClick={(e) => toggleTrackVisibility(`${char.id}_pose`, e)}
                          className="p-1 text-[#6A6282] hover:text-white"
                        >
                          {hiddenTrackIds[`${char.id}_pose`] ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Facial Expression Sub-track */}
                      <div className="h-8 pl-8 pr-3 flex items-center justify-between hover:bg-[#201830] transition-colors">
                        <div className="flex items-center gap-1.5 min-w-0 text-[#A09BB5]">
                          <span className="text-[10px] text-[#F59E0B]">◇</span>
                          <span className="text-[11px] font-medium truncate">
                            {char.name} (Facial Expression)
                          </span>
                        </div>
                        <button
                          onClick={(e) => toggleTrackVisibility(`${char.id}_face`, e)}
                          className="p-1 text-[#6A6282] hover:text-white"
                        >
                          {hiddenTrackIds[`${char.id}_face`] ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* 3. Lights & FX Group Header */}
            <div className="flex flex-col">
              <div
                onClick={() => setIsLightsExpanded(!isLightsExpanded)}
                className="h-10 px-3 flex items-center justify-between bg-[#1C162B] hover:bg-[#251E38] transition-colors cursor-pointer border-t border-[#2E2548]/40"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isLightsExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#8C7BFF] shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#8A81A6] shrink-0" />
                  )}
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">
                    Lights & FX
                  </span>
                </div>
                <button
                  onClick={(e) => toggleTrackVisibility('lights_fx', e)}
                  className="p-1 text-[#8A81A6] hover:text-white transition-colors cursor-pointer"
                >
                  {hiddenTrackIds['lights_fx'] ? <EyeOff className="w-3.5 h-3.5 text-red-400" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isLightsExpanded && (
                <div className="flex flex-col divide-y divide-[#2E2548]/30 bg-[#161122]">
                  <div className="h-8 pl-8 pr-3 flex items-center justify-between hover:bg-[#201830] transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0 text-[#A09BB5]">
                      <span className="text-[10px] text-[#8C7BFF]">◇</span>
                      <span className="text-[11px] font-medium truncate">Light 01</span>
                    </div>
                    <button onClick={(e) => toggleTrackVisibility('light_01', e)} className="p-1 text-[#6A6282] hover:text-white">
                      {hiddenTrackIds['light_01'] ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="h-8 pl-8 pr-3 flex items-center justify-between hover:bg-[#201830] transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0 text-[#A09BB5]">
                      <span className="text-[10px] text-[#EC4899]">◇</span>
                      <span className="text-[11px] font-medium truncate">Light 02</span>
                    </div>
                    <button onClick={(e) => toggleTrackVisibility('light_02', e)} className="p-1 text-[#6A6282] hover:text-white">
                      {hiddenTrackIds['light_02'] ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="h-8 pl-8 pr-3 flex items-center justify-between hover:bg-[#201830] transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0 text-[#A09BB5]">
                      <span className="text-[10px] text-[#3B82F6]">◇</span>
                      <span className="text-[11px] font-medium truncate">FX (Smoke / Particles)</span>
                    </div>
                    <button onClick={(e) => toggleTrackVisibility('fx_smoke', e)} className="p-1 text-[#6A6282] hover:text-white">
                      {hiddenTrackIds['fx_smoke'] ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RESIZER 4: Draggable boundary between track labels and timeline grid */}
        <CinemaResizer
          orientation="vertical"
          onResize={onHeaderResize}
          id="timeline-header-resizer"
        />

        {/* ===================================================================== */}
        {/* RIGHT COLUMN: Scrollable Timeline Grid & Ruler                        */}
        {/* ===================================================================== */}
        <div
          ref={timelineGridRef}
          onWheel={handleTimelineWheel}
          onDragOver={handleTimelineDragOver}
          onDragLeave={handleTimelineDragLeave}
          onDrop={(e) => handleTimelineDrop(e)}
          className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative bg-[#130F1A]"
        >
          <div 
            style={{ width: `${totalTimelineWidth}px` }} 
            className="min-h-full flex flex-col relative"
          >
            {/* 1. Timecode Ruler Bar */}
            <div
              onMouseDown={handleTimelineMouseDown}
              onWheel={handleRulerWheel}
              title="Click or drag to scrub playhead · Mouse wheel to Zoom In/Out"
              className="h-8 border-b border-[#2E2548] bg-[#181223] relative sticky top-0 z-30 cursor-pointer select-none"
            >
              {/* Ruler Tick Marks */}
              {rulerTicks.map((tick) => (
                <div
                  key={`ruler_tick_${tick.seconds}`}
                  style={{ left: `${tick.leftPx}px` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                >
                  <div className="h-2 w-px bg-[#483C66]" />
                  <span className="text-[10px] font-mono text-[#8A81A6] pl-1 pb-1 font-semibold leading-none">
                    {tick.label}
                  </span>
                </div>
              ))}

              {/* Minor frame tick marks (throttled when zoomed in) */}
              {zoom >= 1.5 && Array.from({ length: Math.min(300, Math.ceil(project.totalFrames / 12)) }).map((_, i) => {
                const f = i * 12
                const left = f * zoom
                return (
                  <div
                    key={`ruler_sub_${f}`}
                    style={{ left: `${left}px` }}
                    className="absolute bottom-0 h-1 w-px bg-[#32274A] pointer-events-none"
                  />
                )
              })}

              {/* Inverted Violet Playhead Marker Tag on Top */}
              <div
                style={{ left: `${project.currentFrame * zoom}px` }}
                className="absolute top-0 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center"
              >
                <div className="px-1.5 py-0.5 rounded-sm bg-[#8C7BFF] text-[#16121E] font-mono text-[9px] font-extrabold shadow-[0_0_8px_rgba(140,123,255,0.8)]">
                  {formatRulerTime(Math.floor(project.currentFrame / (project.fps || 24)))}
                </div>
                {/* Tiny arrow */}
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#8C7BFF]" />
              </div>
            </div>

            {/* VIOLET PLAYHEAD VERTICAL LINE (Extending through all track rows) */}
            <div
              style={{ left: `${project.currentFrame * zoom}px` }}
              className="absolute top-8 bottom-0 w-[2px] bg-[#8C7BFF] shadow-[0_0_8px_rgba(140,123,255,0.8)] z-30 pointer-events-none"
            />

            {/* Drag-over ghost drop frame indicator */}
            {dragOverFrame !== null && (
              <div
                style={{ left: `${dragOverFrame * zoom}px` }}
                className="absolute top-8 bottom-0 w-[2px] bg-[#00E676] shadow-[0_0_8px_#00E676] z-25 pointer-events-none opacity-80"
              />
            )}

            {/* 2. Track Lanes (Aligned with Left Headers) */}
            <div className="flex-1 flex flex-col divide-y divide-[#2E2548]/40 relative">
              {/* Lane 1: Camera Cuts Track */}
              <div className="h-10 relative bg-[#171222]/60 hover:bg-[#1A1427] flex items-center">
                {effectiveCuts.map((cut, idx) => {
                  const left = cut.startFrame * zoom
                  const width = Math.max(70, cut.durationFrames * zoom - 3)
                  const num = String(idx + 1).padStart(2, '0')
                  const startTime = formatRulerTime(Math.floor(cut.startFrame / fps))
                  const endTime = formatRulerTime(Math.floor((cut.startFrame + cut.durationFrames) / fps))
                  const isCutActive = project.currentFrame >= cut.startFrame && project.currentFrame < (cut.startFrame + cut.durationFrames)

                  return (
                    <div
                      key={cut.id}
                      style={{ left: `${left}px`, width: `${width}px` }}
                      onClick={() => {
                        onSeekFrame(cut.startFrame)
                        const matchingShot = cameraShots.find(s => s.id === cut.cameraShotId)
                        if (matchingShot) onApplyCameraShot(matchingShot)
                      }}
                      className={`absolute h-7.5 rounded-lg flex items-center gap-2 px-2 overflow-hidden cursor-pointer transition-all border ${
                        isCutActive
                          ? 'border-[#8C7BFF] bg-gradient-to-r from-[#5B47B2]/90 to-[#8C7BFF]/70 text-white shadow-md shadow-[#8C7BFF]/25'
                          : 'border-[#3D335E] bg-[#271E3D]/80 hover:bg-[#342752] text-[#E0DCED]'
                      }`}
                      title={`${cut.cameraName} (${startTime} - ${endTime})`}
                    >
                      {/* Mini Thumbnail */}
                      <div className="w-5 h-4 rounded bg-[#16121E] flex items-center justify-center shrink-0 border border-white/10">
                        <Camera className="w-2.5 h-2.5 text-[#8C7BFF]" />
                      </div>

                      {/* Cut Name and Time Range */}
                      <div className="min-w-0 flex-1 truncate text-left">
                        <div className="text-[10px] font-bold truncate leading-tight">
                          Shot {num}
                        </div>
                        <div className="text-[8px] font-mono text-[#A09BB5] truncate leading-tight">
                          {startTime} - {endTime}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Lane 2: Character Groups (Per Real Character) */}
              {activeCharacters.map((char, charIdx) => {
                const isExpanded = expandedCharacterIds[char.id] !== false
                return (
                  <div key={`lane_group_${char.id}`} className="flex flex-col">
                    {/* Character Group Row */}
                    <div className="h-10 relative bg-[#191325]/40 border-t border-[#2E2548]/40" />

                    {/* Sub-tracks if Expanded */}
                    {isExpanded && (
                      <div className="flex flex-col divide-y divide-[#2E2548]/30">
                        {/* Position Sub-track Lane */}
                        <div className="h-8 relative bg-[#150F20]/50 flex items-center">
                          {/* Colored clip block */}
                          <div
                            style={{ left: `${charIdx * 20 * zoom}px`, width: `${(project.totalFrames * 0.7) * zoom}px` }}
                            className="absolute h-5 rounded-md bg-[#3B82F6]/25 border border-[#3B82F6]/60 flex items-center px-2"
                          >
                            {/* Keyframe diamonds with tooltips & click-to-seek */}
                            {[
                              0,
                              Math.round(project.totalFrames * 0.12),
                              Math.round(project.totalFrames * 0.28),
                              Math.round(project.totalFrames * 0.44),
                              Math.round(project.totalFrames * 0.58)
                            ].map((kfFrame) => {
                              const kfLeft = (kfFrame - (charIdx * 20)) * zoom
                              if (kfLeft < 0) return null
                              const kfTimecode = formatTimecode(kfFrame)
                              const isActive = project.currentFrame === kfFrame
                              return (
                                <div
                                  key={`kf_pos_${kfFrame}`}
                                  style={{ left: `${kfLeft}px` }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSeekFrame(kfFrame)
                                  }}
                                  className={`group/kf absolute w-2.5 h-2.5 bg-white border border-[#3B82F6] rotate-45 shadow-[0_0_5px_#38BDF8] -ml-1.5 cursor-pointer hover:scale-150 active:scale-110 transition-all z-20 ${
                                    isActive ? 'ring-2 ring-white scale-125 bg-blue-100' : ''
                                  }`}
                                >
                                  {/* Tooltip on Hover */}
                                  <div className="opacity-0 group-hover/kf:opacity-100 pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 -rotate-45 px-2.5 py-1.5 rounded-md bg-[#0F0B18]/95 border border-[#3B82F6] text-[10px] text-white whitespace-nowrap shadow-2xl z-50 transition-opacity">
                                    <div className="font-bold text-[#60A5FA] flex items-center gap-1">
                                      <span>◆</span>
                                      <span>Position Keyframe</span>
                                    </div>
                                    <div className="font-mono text-[9px] text-[#C4B5FD] mt-0.5">
                                      At {kfTimecode} (Frame {kfFrame})
                                    </div>
                                    <div className="text-[8px] text-[#34D399] font-medium mt-0.5">
                                      Click to seek · Drag to move
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Pose Sub-track Lane */}
                        <div className="h-8 relative bg-[#150F20]/50 flex items-center">
                          <div
                            style={{ left: `${(15 + charIdx * 10) * zoom}px`, width: `${(project.totalFrames * 0.65) * zoom}px` }}
                            className="absolute h-5 rounded-md bg-[#EC4899]/25 border border-[#EC4899]/60 flex items-center px-2"
                          >
                            {[
                              Math.round(project.totalFrames * 0.05),
                              Math.round(project.totalFrames * 0.2),
                              Math.round(project.totalFrames * 0.35),
                              Math.round(project.totalFrames * 0.5)
                            ].map((kfFrame) => {
                              const kfLeft = (kfFrame - (15 + charIdx * 10)) * zoom
                              if (kfLeft < 0) return null
                              const kfTimecode = formatTimecode(kfFrame)
                              const isActive = project.currentFrame === kfFrame
                              return (
                                <div
                                  key={`kf_pose_${kfFrame}`}
                                  style={{ left: `${kfLeft}px` }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSeekFrame(kfFrame)
                                  }}
                                  className={`group/kf absolute w-2.5 h-2.5 bg-white border border-[#EC4899] rotate-45 shadow-[0_0_5px_#F472B6] -ml-1.5 cursor-pointer hover:scale-150 active:scale-110 transition-all z-20 ${
                                    isActive ? 'ring-2 ring-white scale-125 bg-pink-100' : ''
                                  }`}
                                >
                                  {/* Tooltip on Hover */}
                                  <div className="opacity-0 group-hover/kf:opacity-100 pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 -rotate-45 px-2.5 py-1.5 rounded-md bg-[#0F0B18]/95 border border-[#EC4899] text-[10px] text-white whitespace-nowrap shadow-2xl z-50 transition-opacity">
                                    <div className="font-bold text-[#F472B6] flex items-center gap-1">
                                      <span>◆</span>
                                      <span>Pose Keyframe</span>
                                    </div>
                                    <div className="font-mono text-[9px] text-[#C4B5FD] mt-0.5">
                                      At {kfTimecode} (Frame {kfFrame})
                                    </div>
                                    <div className="text-[8px] text-[#34D399] font-medium mt-0.5">
                                      Click to seek · Drag to move
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Facial Expression Sub-track Lane */}
                        <div className="h-8 relative bg-[#150F20]/50 flex items-center">
                          <div
                            style={{ left: `${(30 + charIdx * 15) * zoom}px`, width: `${(project.totalFrames * 0.6) * zoom}px` }}
                            className="absolute h-5 rounded-md bg-[#F59E0B]/25 border border-[#F59E0B]/60 flex items-center px-2"
                          >
                            {[
                              Math.round(project.totalFrames * 0.08),
                              Math.round(project.totalFrames * 0.24),
                              Math.round(project.totalFrames * 0.38),
                              Math.round(project.totalFrames * 0.52)
                            ].map((kfFrame) => {
                              const kfLeft = (kfFrame - (30 + charIdx * 15)) * zoom
                              if (kfLeft < 0) return null
                              const kfTimecode = formatTimecode(kfFrame)
                              const isActive = project.currentFrame === kfFrame
                              return (
                                <div
                                  key={`kf_face_${kfFrame}`}
                                  style={{ left: `${kfLeft}px` }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSeekFrame(kfFrame)
                                  }}
                                  className={`group/kf absolute w-2.5 h-2.5 bg-white border border-[#F59E0B] rotate-45 shadow-[0_0_5px_#FBBF24] -ml-1.5 cursor-pointer hover:scale-150 active:scale-110 transition-all z-20 ${
                                    isActive ? 'ring-2 ring-white scale-125 bg-amber-100' : ''
                                  }`}
                                >
                                  {/* Tooltip on Hover */}
                                  <div className="opacity-0 group-hover/kf:opacity-100 pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 -rotate-45 px-2.5 py-1.5 rounded-md bg-[#0F0B18]/95 border border-[#F59E0B] text-[10px] text-white whitespace-nowrap shadow-2xl z-50 transition-opacity">
                                    <div className="font-bold text-[#FBBF24] flex items-center gap-1">
                                      <span>◆</span>
                                      <span>Facial Keyframe</span>
                                    </div>
                                    <div className="font-mono text-[9px] text-[#C4B5FD] mt-0.5">
                                      At {kfTimecode} (Frame {kfFrame})
                                    </div>
                                    <div className="text-[8px] text-[#34D399] font-medium mt-0.5">
                                      Click to seek · Drag to move
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Lane 3: Lights & FX Group Lanes */}
              <div className="flex flex-col">
                <div className="h-10 relative bg-[#191325]/40 border-t border-[#2E2548]/40" />
                {isLightsExpanded && (
                  <div className="flex flex-col divide-y divide-[#2E2548]/30">
                    {/* Light 01 */}
                    <div className="h-8 relative bg-[#150F20]/50 flex items-center">
                      <div
                        style={{ left: `${10 * zoom}px`, width: `${Math.min(project.totalFrames * 0.5, 400) * zoom}px` }}
                        className="absolute h-5 rounded-md bg-[#8C7BFF]/25 border border-[#8C7BFF]/60 flex items-center"
                      >
                        {[
                          Math.round(project.totalFrames * 0.05),
                          Math.round(project.totalFrames * 0.25),
                          Math.round(project.totalFrames * 0.45)
                        ].map((f) => {
                          const kfLeft = (f - 10) * zoom
                          if (kfLeft < 0) return null
                          const kfTimecode = formatTimecode(f)
                          const isActive = project.currentFrame === f
                          return (
                            <div
                              key={`kf_l1_${f}`}
                              style={{ left: `${kfLeft}px` }}
                              onClick={(e) => {
                                e.stopPropagation()
                                onSeekFrame(f)
                              }}
                              className={`group/kf absolute w-2.5 h-2.5 bg-white border border-[#8C7BFF] rotate-45 shadow-[0_0_5px_#8C7BFF] -ml-1.5 cursor-pointer hover:scale-150 active:scale-110 transition-all z-20 ${
                                isActive ? 'ring-2 ring-white scale-125 bg-purple-100' : ''
                              }`}
                            >
                              <div className="opacity-0 group-hover/kf:opacity-100 pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 -rotate-45 px-2.5 py-1.5 rounded-md bg-[#0F0B18]/95 border border-[#8C7BFF] text-[10px] text-white whitespace-nowrap shadow-2xl z-50 transition-opacity">
                                <div className="font-bold text-[#A78BFA] flex items-center gap-1">
                                  <span>◆</span>
                                  <span>Key Light Keyframe</span>
                                </div>
                                <div className="font-mono text-[9px] text-[#C4B5FD] mt-0.5">
                                  At {kfTimecode} (Frame {f})
                                </div>
                                <div className="text-[8px] text-[#34D399] font-medium mt-0.5">
                                  Click to seek · Drag to move
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Light 02 */}
                    <div className="h-8 relative bg-[#150F20]/50 flex items-center">
                      <div
                        style={{ left: `${40 * zoom}px`, width: `${Math.min(project.totalFrames * 0.5, 450) * zoom}px` }}
                        className="absolute h-5 rounded-md bg-[#EC4899]/25 border border-[#EC4899]/60 flex items-center"
                      >
                        {[
                          Math.round(project.totalFrames * 0.15),
                          Math.round(project.totalFrames * 0.35),
                          Math.round(project.totalFrames * 0.55)
                        ].map((f) => {
                          const kfLeft = (f - 40) * zoom
                          if (kfLeft < 0) return null
                          const kfTimecode = formatTimecode(f)
                          const isActive = project.currentFrame === f
                          return (
                            <div
                              key={`kf_l2_${f}`}
                              style={{ left: `${kfLeft}px` }}
                              onClick={(e) => {
                                e.stopPropagation()
                                onSeekFrame(f)
                              }}
                              className={`group/kf absolute w-2.5 h-2.5 bg-white border border-[#EC4899] rotate-45 shadow-[0_0_5px_#EC4899] -ml-1.5 cursor-pointer hover:scale-150 active:scale-110 transition-all z-20 ${
                                isActive ? 'ring-2 ring-white scale-125 bg-pink-100' : ''
                              }`}
                            >
                              <div className="opacity-0 group-hover/kf:opacity-100 pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 -rotate-45 px-2.5 py-1.5 rounded-md bg-[#0F0B18]/95 border border-[#EC4899] text-[10px] text-white whitespace-nowrap shadow-2xl z-50 transition-opacity">
                                <div className="font-bold text-[#F472B6] flex items-center gap-1">
                                  <span>◆</span>
                                  <span>Rim Light Keyframe</span>
                                </div>
                                <div className="font-mono text-[9px] text-[#C4B5FD] mt-0.5">
                                  At {kfTimecode} (Frame {f})
                                </div>
                                <div className="text-[8px] text-[#34D399] font-medium mt-0.5">
                                  Click to seek · Drag to move
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* FX Smoke / Particles */}
                    <div className="h-8 relative bg-[#150F20]/50 flex items-center">
                      <div
                        style={{ left: `${70 * zoom}px`, width: `${Math.min(project.totalFrames * 0.45, 380) * zoom}px` }}
                        className="absolute h-5 rounded-md bg-[#3B82F6]/25 border border-[#3B82F6]/60 flex items-center"
                      >
                        {[
                          Math.round(project.totalFrames * 0.2),
                          Math.round(project.totalFrames * 0.4)
                        ].map((f) => {
                          const kfLeft = (f - 70) * zoom
                          if (kfLeft < 0) return null
                          const kfTimecode = formatTimecode(f)
                          const isActive = project.currentFrame === f
                          return (
                            <div
                              key={`kf_fx_${f}`}
                              style={{ left: `${kfLeft}px` }}
                              onClick={(e) => {
                                e.stopPropagation()
                                onSeekFrame(f)
                              }}
                              className={`group/kf absolute w-2.5 h-2.5 bg-white border border-[#3B82F6] rotate-45 shadow-[0_0_5px_#3B82F6] -ml-1.5 cursor-pointer hover:scale-150 active:scale-110 transition-all z-20 ${
                                isActive ? 'ring-2 ring-white scale-125 bg-blue-100' : ''
                              }`}
                            >
                              <div className="opacity-0 group-hover/kf:opacity-100 pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 -rotate-45 px-2.5 py-1.5 rounded-md bg-[#0F0B18]/95 border border-[#3B82F6] text-[10px] text-white whitespace-nowrap shadow-2xl z-50 transition-opacity">
                                <div className="font-bold text-[#60A5FA] flex items-center gap-1">
                                  <span>◆</span>
                                  <span>FX Atmosphere Keyframe</span>
                                </div>
                                <div className="font-mono text-[9px] text-[#C4B5FD] mt-0.5">
                                  At {kfTimecode} (Frame {f})
                                </div>
                                <div className="text-[8px] text-[#34D399] font-medium mt-0.5">
                                  Click to seek · Drag to move
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
