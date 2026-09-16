import React, { useState, useEffect, useCallback, useRef } from 'react'
import { SceneCameraShot, SceneCharacterInstance, SceneProp, SceneEntitySelection } from '../../types/scene'
import { SavedCharacterRecord } from '../../utils/vrmManager'
import { AnimationProject, AnimationClip, CameraCut } from '../../types/animation'
import { VRMViewportHandle } from '../VRMViewport3D'
import { CinemaResizer } from './CinemaResizer'
import { CinemaTopRow } from './CinemaTopRow'
import { CinemaTransportBar } from './CinemaTransportBar'
import { CinemaTimeline } from './CinemaTimeline'

interface CinemaLayoutProportions {
  topRowHeight: number
  leftWidth: number
  rightWidth: number
  timelineHeaderWidth: number
}

const STORAGE_KEY = 'voom_cinema_layout_proportions'

const DEFAULT_PROPORTIONS: CinemaLayoutProportions = {
  topRowHeight: 280,
  leftWidth: 220,
  rightWidth: 380,
  timelineHeaderWidth: 240
}

interface AnimationCinemaLayoutProps {
  // Scene and Character data (from Editor.tsx)
  sceneCharacters: SceneCharacterInstance[]
  characterList: SavedCharacterRecord[]
  activeCharacterId: string
  onSelectCharacter: (charId: string) => void
  selectedEntity: SceneEntitySelection
  cameraShots: SceneCameraShot[]
  activeCameraShotId: string | null
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onSaveCurrentCameraView: () => void

  // 3D Viewport props
  viewportRef: React.RefObject<VRMViewportHandle>
  vrm: any | null
  avatarState: any
  sceneProps: SceneProp[]
  isLoadingVRM: boolean
  loadingProgress: number

  // Animation Engine and Project data
  animationProject: AnimationProject
  onUpdateProject: (updater: (prev: AnimationProject) => AnimationProject) => void
  onApplyClipToCharacter: (charId: string, clipData: any) => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onOpenRenderModal?: () => void
}

export const AnimationCinemaLayout: React.FC<AnimationCinemaLayoutProps> = ({
  sceneCharacters,
  characterList,
  activeCharacterId,
  onSelectCharacter,
  selectedEntity,
  cameraShots,
  activeCameraShotId,
  onApplyCameraShot,
  onSaveCurrentCameraView,
  viewportRef,
  vrm,
  avatarState,
  sceneProps,
  isLoadingVRM,
  loadingProgress,
  animationProject,
  onUpdateProject,
  onApplyClipToCharacter,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenRenderModal
}) => {
  // Load persisted layout proportions
  const [proportions, setProportions] = useState<CinemaLayoutProportions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...DEFAULT_PROPORTIONS, ...JSON.parse(saved) }
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROPORTIONS
  })

  // Save proportions to localStorage on change
  const saveProportions = useCallback((newProps: CinemaLayoutProportions) => {
    setProportions(newProps)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProps))
    } catch {
      // ignore
    }
  }, [])

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [fps, setFps] = useState(animationProject.fps || 24)
  const [isSnapping, setIsSnapping] = useState(true)
  const [isLooping, setIsLooping] = useState(true)

  const animFrameIdRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  // Current frame and total frames (flexible from 3s up to 1h+, default 720 frames / 30s)
  const currentFrame = animationProject.currentFrame || 0
  const rawTotalFrames = animationProject.totalFrames || 720
  const totalFrames = rawTotalFrames < 150 ? 720 : rawTotalFrames

  // Format timecode (HH:MM:SS:FF or MM:SS:FF)
  const formatTimecode = useCallback((frame: number, projectFps: number) => {
    const totalSeconds = Math.floor(frame / projectFps)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const remainingFrames = frame % projectFps
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(remainingFrames).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(remainingFrames).padStart(2, '0')}`
  }, [])

  const currentTimecode = formatTimecode(currentFrame, fps)
  const totalTimecode = formatTimecode(totalFrames, fps)

  // Handle total timeline duration change
  const handleTotalFramesChange = useCallback((newFrames: number) => {
    const bounded = Math.max(72, Math.min(86400 * 2, newFrames))
    onUpdateProject(prev => ({
      ...prev,
      totalFrames: bounded,
      outPoint: Math.min(prev.outPoint || bounded, bounded),
      currentFrame: Math.min(prev.currentFrame || 0, bounded)
    }))
  }, [onUpdateProject])

  // Seek to specific frame
  const handleSeekFrame = useCallback((frame: number) => {
    const bounded = Math.max(0, Math.min(totalFrames, frame))
    onUpdateProject(prev => ({ ...prev, currentFrame: bounded }))

    // If there is an active camera cut at this frame, automatically apply it to viewport
    if (animationProject.cameraCuts && animationProject.cameraCuts.length > 0) {
      const activeCut = animationProject.cameraCuts.find(
        c => bounded >= c.startFrame && bounded < (c.startFrame + c.durationFrames)
      )
      if (activeCut) {
        const matchingShot = cameraShots.find(s => s.id === activeCut.cameraShotId)
        if (matchingShot && matchingShot.id !== activeCameraShotId) {
          onApplyCameraShot(matchingShot)
        }
      }
    }
  }, [totalFrames, onUpdateProject, animationProject.cameraCuts, cameraShots, activeCameraShotId, onApplyCameraShot])

  // Play/pause toggle
  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  // Navigation steps
  const handleJumpToStart = useCallback(() => {
    handleSeekFrame(0)
  }, [handleSeekFrame])

  const handleJumpToEnd = useCallback(() => {
    handleSeekFrame(totalFrames)
  }, [handleSeekFrame, totalFrames])

  const handlePreviousFrame = useCallback(() => {
    handleSeekFrame(currentFrame - 1)
  }, [handleSeekFrame, currentFrame])

  const handleNextFrame = useCallback(() => {
    handleSeekFrame(currentFrame + 1)
  }, [handleSeekFrame, currentFrame])

  // Animation playback loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
        animFrameIdRef.current = null
      }
      lastTimeRef.current = null
      return
    }

    const frameDuration = (1000 / fps) / playbackSpeed
    let accumulated = 0

    const loop = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = time - lastTimeRef.current
        accumulated += delta

        if (accumulated >= frameDuration) {
          const framesToAdvance = Math.floor(accumulated / frameDuration)
          accumulated = accumulated % frameDuration

          onUpdateProject(prev => {
            let nextFrame = prev.currentFrame + framesToAdvance
            if (nextFrame > prev.totalFrames) {
              if (isLooping) {
                nextFrame = 0
              } else {
                setIsPlaying(false)
                return { ...prev, currentFrame: prev.totalFrames }
              }
            }
            return { ...prev, currentFrame: nextFrame }
          })
        }
      }
      lastTimeRef.current = time
      animFrameIdRef.current = requestAnimationFrame(loop)
    }

    animFrameIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [isPlaying, fps, playbackSpeed, isLooping, onUpdateProject])

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        handleTogglePlay()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handlePreviousFrame()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleNextFrame()
      } else if (e.code === 'Home') {
        e.preventDefault()
        handleJumpToStart()
      } else if (e.code === 'End') {
        e.preventDefault()
        handleJumpToEnd()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTogglePlay, handlePreviousFrame, handleNextFrame, handleJumpToStart, handleJumpToEnd])

  // Resizing handlers for each boundary:
  // 1. Top row height (vertical drag)
  const handleTopRowResize = (delta: number) => {
    const newHeight = Math.max(180, Math.min(window.innerHeight - 260, proportions.topRowHeight + delta))
    saveProportions({ ...proportions, topRowHeight: newHeight })
  }

  // 2. Left panel width (horizontal drag)
  const handleLeftWidthResize = (delta: number) => {
    const newWidth = Math.max(160, Math.min(420, proportions.leftWidth + delta))
    saveProportions({ ...proportions, leftWidth: newWidth })
  }

  // 3. Right preview monitor width (horizontal drag)
  const handleRightWidthResize = (delta: number) => {
    // dragging left increases right width, dragging right decreases right width
    const newWidth = Math.max(260, Math.min(650, proportions.rightWidth - delta))
    saveProportions({ ...proportions, rightWidth: newWidth })
  }

  // 4. Timeline track header width (horizontal drag)
  const handleTimelineHeaderResize = (delta: number) => {
    const newWidth = Math.max(160, Math.min(400, proportions.timelineHeaderWidth + delta))
    saveProportions({ ...proportions, timelineHeaderWidth: newWidth })
  }

  // Add camera cut or animation clip from center browser
  const handleAddCameraShotToTimeline = (shot: SceneCameraShot) => {
    const newCut: CameraCut = {
      id: `cut_${Date.now()}`,
      cameraShotId: shot.id,
      cameraName: shot.name,
      startFrame: currentFrame,
      durationFrames: 72,
      transition: 'cut',
      color: '#8C7BFF'
    }
    onUpdateProject(prev => ({
      ...prev,
      cameraCuts: [...(prev.cameraCuts || []), newCut].sort((a, b) => a.startFrame - b.startFrame)
    }))
    onApplyCameraShot(shot)
  }

  const handleAddClipToTimeline = (clipData: any) => {
    const targetCharId = activeCharacterId || sceneCharacters[0]?.id || characterList[0]?.id
    if (targetCharId) {
      onApplyClipToCharacter(targetCharId, clipData)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#16121E] select-none overflow-hidden relative font-sans">
      {/* ======================================================================= */}
      {/* ROW 1: Three-Column Compact Row (Characters | Clips & Shots | Preview)   */}
      {/* ======================================================================= */}
      <div
        style={{ height: `${proportions.topRowHeight}px` }}
        className="w-full shrink-0 flex relative min-h-0 bg-[#16121E]"
      >
        {/* Left Column + Resizer 2 + Center Column + Resizer 3 + Right Column */}
        <div className="w-full h-full flex min-h-0 overflow-hidden">
          {/* Main Top Row Component */}
          <CinemaTopRow
            sceneCharacters={sceneCharacters}
            characterList={characterList}
            activeCharacterId={activeCharacterId}
            onSelectCharacter={onSelectCharacter}
            selectedEntity={selectedEntity}
            cameraShots={cameraShots}
            activeCameraShotId={activeCameraShotId}
            onApplyCameraShot={onApplyCameraShot}
            onSaveCurrentCameraView={onSaveCurrentCameraView}
            onAddClipToTimeline={handleAddClipToTimeline}
            onAddCameraShotToTimeline={handleAddCameraShotToTimeline}
            viewportRef={viewportRef}
            vrm={vrm}
            avatarState={avatarState}
            sceneProps={sceneProps}
            isLoadingVRM={isLoadingVRM}
            loadingProgress={loadingProgress}
            currentTimecode={currentTimecode}
            totalTimecode={totalTimecode}
            currentFrame={currentFrame}
            totalFrames={totalFrames}
            leftWidth={proportions.leftWidth}
            rightWidth={proportions.rightWidth}
          />
        </div>

        {/* RESIZER 2: Draggable boundary between Left and Center */}
        <div
          style={{ left: `${proportions.leftWidth}px` }}
          className="absolute top-0 bottom-0 z-30"
        >
          <CinemaResizer
            orientation="vertical"
            onResize={handleLeftWidthResize}
            id="cinema-left-resizer"
          />
        </div>

        {/* RESIZER 3: Draggable boundary between Center and Right Preview Monitor */}
        <div
          style={{ right: `${proportions.rightWidth}px` }}
          className="absolute top-0 bottom-0 z-30"
        >
          <CinemaResizer
            orientation="vertical"
            onResize={handleRightWidthResize}
            id="cinema-right-resizer"
          />
        </div>
      </div>

      {/* RESIZER 1: Draggable boundary between Row 1 and Row 2/3 (Timeline Area) */}
      <CinemaResizer
        orientation="horizontal"
        onResize={handleTopRowResize}
        id="cinema-toprow-resizer"
      />

      {/* ======================================================================= */}
      {/* ROW 2: Thin Playback Transport Bar                                      */}
      {/* ======================================================================= */}
      <CinemaTransportBar
        isPlaying={isPlaying}
        onPlayPause={handleTogglePlay}
        currentFrame={currentFrame}
        totalFrames={totalFrames}
        fps={fps}
        onFpsChange={(newFps) => {
          setFps(newFps)
          onUpdateProject(prev => ({ ...prev, fps: newFps }))
        }}
        speed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        currentTimecode={currentTimecode}
        totalTimecode={totalTimecode}
        onJumpToStart={handleJumpToStart}
        onJumpToEnd={handleJumpToEnd}
        onPreviousFrame={handlePreviousFrame}
        onNextFrame={handleNextFrame}
        onSeekFrame={handleSeekFrame}
        onTotalFramesChange={handleTotalFramesChange}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        isSnapping={isSnapping}
        onToggleSnapping={() => setIsSnapping(prev => !prev)}
        isLooping={isLooping}
        onToggleLooping={() => setIsLooping(prev => !prev)}
        onOpenRenderModal={onOpenRenderModal}
      />

      {/* ======================================================================= */}
      {/* ROW 3: Main Timeline (Dominant Area taking remaining vertical height)   */}
      {/* ======================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#16121E] overflow-hidden">
        <CinemaTimeline
          project={animationProject}
          onUpdateProject={onUpdateProject}
          sceneCharacters={sceneCharacters}
          cameraShots={cameraShots}
          activeCameraShotId={activeCameraShotId}
          onApplyCameraShot={onApplyCameraShot}
          onSeekFrame={handleSeekFrame}
          onApplyClipToCharacter={onApplyClipToCharacter}
          headerWidth={proportions.timelineHeaderWidth}
          onHeaderResize={handleTimelineHeaderResize}
        />
      </div>
    </div>
  )
}
