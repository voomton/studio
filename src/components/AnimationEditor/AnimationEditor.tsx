/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  AnimationProject, 
  AnimationTrack, 
  AnimationKeyframe, 
  AnimationClip, 
  CameraCut, 
  TimelineMarker, 
  AudioClip,
  ClipType,
  TimelineViewMode
} from '../../types/animation'
import { 
  SceneEntitySelection, 
  SceneCharacterInstance, 
  SceneProp, 
  SceneCameraShot 
} from '../../types/scene'
import { 
  createEmptyAnimationProject, 
  evaluateAnimationAtFrame, 
  EvaluatedSceneState,
  generateLipSyncFromText
} from '../../utils/animationEngine'
import { VRMAvatarState } from '../../utils/vrmManager'
import { AnimationTimeline } from './Timeline/AnimationTimeline'
import { AnimationInspector } from './Inspector/AnimationInspector'
import { AnimationRenderModal } from './AnimationRenderModal'
import { VRMViewportHandle } from '../VRMViewport3D'
import { 
  Film, 
  Clapperboard, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Video, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Download
} from 'lucide-react'

const ANIMATION_PROJECT_STORAGE_KEY = 'voomtoon_animation_project_v2'

interface AnimationEditorProps {
  sceneCharacters: SceneCharacterInstance[]
  sceneProps: SceneProp[]
  cameraShots: SceneCameraShot[]
  activeCameraShotId: string | null
  selectedEntity: SceneEntitySelection
  viewportRef: React.RefObject<VRMViewportHandle | null>
  onSelectEntity: (selection: SceneEntitySelection) => void
  onUpdateCharacterTransform: (id: string, updates: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number] }) => void
  onUpdateCharacterState: (id: string, updater: (prev: VRMAvatarState) => VRMAvatarState) => void
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onUpdateCameraPosition?: (shotId: string, newPosition: [number, number, number]) => void
  onEvaluatedSceneUpdate?: (evaluated: EvaluatedSceneState) => void
}

export const AnimationEditor: React.FC<AnimationEditorProps> = ({
  sceneCharacters,
  sceneProps,
  cameraShots,
  activeCameraShotId,
  selectedEntity,
  viewportRef,
  onSelectEntity,
  onUpdateCharacterTransform,
  onUpdateCharacterState,
  onApplyCameraShot,
  onUpdateCameraPosition,
  onEvaluatedSceneUpdate
}) => {
  // Central Animation Project state
  const [project, setProject] = useState<AnimationProject>(() => {
    try {
      const saved = localStorage.getItem(ANIMATION_PROJECT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Reset play state on load
        return { ...parsed, isPlaying: false }
      }
    } catch (e) {
      console.warn('Could not restore animation project, creating default:', e)
    }
    return createEmptyAnimationProject()
  })

  // Timeline drawer height & expansion state
  const [timelineHeight, setTimelineHeight] = useState<number>(310)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true)
  const [isRenderModalOpen, setIsRenderModalOpen] = useState<boolean>(false)

  // Animation Playback Timing Ref
  const animationFrameIdRef = useRef<number | null>(null)
  const lastPlaybackTimeRef = useRef<number>(0)
  const frameAccumulatorRef = useRef<number>(0)

  // Persist project changes to local storage
  const persistProject = useCallback((updated: AnimationProject) => {
    try {
      localStorage.setItem(ANIMATION_PROJECT_STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to persist animation project', e)
    }
  }, [])

  const updateProject = useCallback((updates: Partial<AnimationProject> | ((prev: AnimationProject) => AnimationProject)) => {
    setProject(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates }
      persistProject(next)
      return next
    })
  }, [persistProject])

  // Synchronize camera shots with project tracks if new camera shot was added
  useEffect(() => {
    if (cameraShots.length > 0 && project.tracks.length > 0) {
      // Ensure camera cut list references existing camera shots
      const validShotIds = new Set(cameraShots.map(s => s.id))
      const hasInvalidCut = project.cameraCuts.some(c => !validShotIds.has(c.cameraShotId))
      if (hasInvalidCut && cameraShots[0]) {
        updateProject(prev => ({
          ...prev,
          cameraCuts: prev.cameraCuts.map(c => 
            validShotIds.has(c.cameraShotId) ? c : { ...c, cameraShotId: cameraShots[0].id, cameraName: cameraShots[0].name }
          )
        }))
      }
    }
  }, [cameraShots, project.tracks.length, updateProject])

  // Evaluate and apply animation state at current frame
  const applyFrameEvaluation = useCallback((frame: number, currentProject: AnimationProject) => {
    const evaluated = evaluateAnimationAtFrame(currentProject, frame, sceneCharacters)
    
    // Notify parent / viewport of evaluated character poses and transforms
    onEvaluatedSceneUpdate?.(evaluated)

    // Apply Camera Cuts
    if (evaluated.camera.activeShotId) {
      const matchedShot = cameraShots.find(s => s.id === evaluated.camera.activeShotId)
      if (matchedShot) {
        onApplyCameraShot(matchedShot)
      }
    }

    // Apply evaluated transforms & states to characters
    evaluated.characters.forEach((charEval, charId) => {
      onUpdateCharacterTransform(charId, {
        position: charEval.position,
        rotation: charEval.rotation,
        scale: charEval.scale
      })

      if (charEval.boneRotations || charEval.expressions) {
        onUpdateCharacterState(charId, prev => ({
          ...prev,
          boneRotations: {
            ...prev.boneRotations,
            ...(charEval.boneRotations || {})
          },
          expressions: {
            ...prev.expressions,
            ...(charEval.expressions || {})
          }
        }))
      }
    })
  }, [cameraShots, onApplyCameraShot, onEvaluatedSceneUpdate, onUpdateCharacterState, onUpdateCharacterTransform, sceneCharacters])

  // Real-time playback loop
  useEffect(() => {
    if (!project.isPlaying) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
      return
    }

    lastPlaybackTimeRef.current = performance.now()
    frameAccumulatorRef.current = 0

    const targetFrameDurationMs = 1000 / (project.fps || 24)

    const tick = (now: number) => {
      const deltaMs = now - lastPlaybackTimeRef.current
      lastPlaybackTimeRef.current = now
      frameAccumulatorRef.current += deltaMs

      if (frameAccumulatorRef.current >= targetFrameDurationMs) {
        const framesToAdvance = Math.floor(frameAccumulatorRef.current / targetFrameDurationMs)
        frameAccumulatorRef.current %= targetFrameDurationMs

        setProject(prev => {
          if (!prev.isPlaying) return prev

          let nextFrame = prev.currentFrame + framesToAdvance
          const maxFrame = prev.outPoint || prev.totalFrames
          const minFrame = prev.inPoint || 0

          if (nextFrame > maxFrame) {
            if (prev.isLooping) {
              nextFrame = minFrame
            } else {
              nextFrame = maxFrame
              return { ...prev, isPlaying: false, currentFrame: nextFrame }
            }
          }

          // Evaluate state for next frame
          applyFrameEvaluation(nextFrame, prev)

          return { ...prev, currentFrame: nextFrame }
        })
      }

      animationFrameIdRef.current = requestAnimationFrame(tick)
    }

    animationFrameIdRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
    }
  }, [project.isPlaying, project.fps, applyFrameEvaluation])

  // Seek to specific frame
  const handleSeek = useCallback((frame: number) => {
    const clamped = Math.max(0, Math.min(project.totalFrames, Math.round(frame)))
    setProject(prev => {
      const updated = { ...prev, currentFrame: clamped }
      applyFrameEvaluation(clamped, updated)
      return updated
    })
  }, [applyFrameEvaluation, project.totalFrames])

  // Transport Handlers
  const handlePlay = useCallback(() => {
    setProject(prev => {
      // If at end, loop back to start
      let startFrame = prev.currentFrame
      if (startFrame >= (prev.outPoint || prev.totalFrames)) {
        startFrame = prev.inPoint || 0
      }
      const updated = { ...prev, isPlaying: true, currentFrame: startFrame }
      applyFrameEvaluation(startFrame, updated)
      return updated
    })
  }, [applyFrameEvaluation])

  const handlePause = useCallback(() => {
    setProject(prev => ({ ...prev, isPlaying: false }))
  }, [])

  const handleStop = useCallback(() => {
    setProject(prev => {
      const resetFrame = prev.inPoint || 0
      const updated = { ...prev, isPlaying: false, currentFrame: resetFrame }
      applyFrameEvaluation(resetFrame, updated)
      return updated
    })
  }, [applyFrameEvaluation])

  // Keyframing operations
  const handleAddKeyframe = useCallback((trackId: string, frame: number, value: any) => {
    updateProject(prev => {
      const track = prev.tracks.find(t => t.id === trackId)
      if (!track) return prev

      const existingIndex = track.keyframes.findIndex(k => k.frame === frame)
      let newKeyframes: AnimationKeyframe[]

      if (existingIndex >= 0) {
        newKeyframes = [...track.keyframes]
        newKeyframes[existingIndex] = {
          ...newKeyframes[existingIndex],
          value
        }
      } else {
        const newKey: AnimationKeyframe = {
          id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          frame,
          value,
          interpolation: 'easeInOut'
        }
        newKeyframes = [...track.keyframes, newKey].sort((a, b) => a.frame - b.frame)
      }

      return {
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? { ...t, keyframes: newKeyframes } : t)
      }
    })
  }, [updateProject])

  // Quick keyframe current selected entity's transforms
  const handleKeyframeAllTransform = useCallback((charId: string) => {
    const char = sceneCharacters.find(c => c.id === charId)
    if (!char) return

    updateProject(prev => {
      let updatedTracks = [...prev.tracks]

      // Position track
      let posTrack = updatedTracks.find(t => t.targetId === charId && t.property === 'position')
      if (posTrack) {
        const newKeys = [
          ...posTrack.keyframes.filter(k => k.frame !== prev.currentFrame),
          { id: `kf_pos_${Date.now()}`, frame: prev.currentFrame, value: [...char.position], interpolation: 'easeInOut' as const }
        ].sort((a, b) => a.frame - b.frame)
        updatedTracks = updatedTracks.map(t => t.id === posTrack!.id ? { ...t, keyframes: newKeys } : t)
      }

      // Rotation track
      let rotTrack = updatedTracks.find(t => t.targetId === charId && t.property === 'rotation')
      if (rotTrack) {
        const newKeys = [
          ...rotTrack.keyframes.filter(k => k.frame !== prev.currentFrame),
          { id: `kf_rot_${Date.now()}`, frame: prev.currentFrame, value: [...char.rotation], interpolation: 'easeInOut' as const }
        ].sort((a, b) => a.frame - b.frame)
        updatedTracks = updatedTracks.map(t => t.id === rotTrack!.id ? { ...t, keyframes: newKeys } : t)
      }

      return { ...prev, tracks: updatedTracks }
    })
  }, [sceneCharacters, updateProject])

  // Delete selected keyframes
  const handleDeleteSelectedKeyframes = useCallback(() => {
    if (project.selectedKeyframeIds.length === 0) return
    const idsToDelete = new Set(project.selectedKeyframeIds)

    updateProject(prev => ({
      ...prev,
      selectedKeyframeIds: [],
      tracks: prev.tracks.map(t => ({
        ...t,
        keyframes: t.keyframes.filter(k => !idsToDelete.has(k.id))
      }))
    }))
  }, [project.selectedKeyframeIds, updateProject])

  // Apply procedural clip to character track
  const handleApplyClipToCharacter = useCallback((charId: string, clipOrType: any) => {
    const char = sceneCharacters.find(c => c.id === charId)
    const charName = char?.name || 'Character'

    let parsedType: ClipType = 'walk'
    let clipName = 'Action Clip'
    let durationFrames = 60
    let speed = 1.0
    let blendWeight = 1.0
    let loop = true
    let customColor: string | undefined = undefined

    const validTypes: ClipType[] = ['idle', 'walk', 'run', 'jump', 'attack', 'dance', 'talk', 'wave', 'sit', 'custom']

    if (typeof clipOrType === 'string') {
      const lower = clipOrType.toLowerCase().trim()
      if (validTypes.includes(lower as ClipType)) {
        parsedType = lower as ClipType
      } else {
        parsedType = 'custom'
      }
      clipName = `${parsedType.toUpperCase()}_Action`
    } else if (clipOrType && typeof clipOrType === 'object') {
      const rawType = clipOrType.clipType || clipOrType.type || clipOrType.category
      if (typeof rawType === 'string') {
        const lower = rawType.toLowerCase().trim()
        if (validTypes.includes(lower as ClipType)) {
          parsedType = lower as ClipType
        } else {
          parsedType = 'custom'
        }
      }
      clipName = clipOrType.name || `${parsedType.toUpperCase()}_Action`
      durationFrames = clipOrType.durationFrames || clipOrType.frames || clipOrType.duration || 60
      if (typeof clipOrType.speed === 'number') speed = clipOrType.speed
      if (typeof clipOrType.blendWeight === 'number') blendWeight = clipOrType.blendWeight
      if (typeof clipOrType.loop === 'boolean') loop = clipOrType.loop
      if (typeof clipOrType.color === 'string') customColor = clipOrType.color
    }

    const defaultColor = parsedType === 'walk' 
      ? '#3B82F6' 
      : (parsedType === 'talk' 
        ? '#EC4899' 
        : (parsedType === 'wave' 
          ? '#8C7BFF' 
          : (parsedType === 'run' ? '#F59E0B' : '#10B981')))

    updateProject(prev => {
      let tracks = [...prev.tracks]
      let clipTrack = tracks.find(t => t.targetId === charId && t.property === 'clip')

      const newClip: AnimationClip = {
        id: `clip_${Date.now()}_${parsedType}`,
        name: clipName,
        type: parsedType,
        startFrame: prev.currentFrame,
        durationFrames,
        speed,
        blendWeight,
        loop,
        color: customColor || defaultColor
      }

      if (!clipTrack) {
        clipTrack = {
          id: `track_${charId}_clips`,
          name: `${charName} - Action Clips`,
          targetId: charId,
          targetName: charName,
          targetType: 'character',
          property: 'clip',
          color: '#3B82F6',
          expanded: true,
          keyframes: [],
          clips: [newClip]
        }
        tracks.push(clipTrack)
      } else {
        tracks = tracks.map(t => t.id === clipTrack!.id ? {
          ...t,
          clips: [...(t.clips || []), newClip]
        } : t)
      }

      const updated = { ...prev, tracks }
      applyFrameEvaluation(prev.currentFrame, updated)
      return updated
    })
  }, [applyFrameEvaluation, sceneCharacters, updateProject])

  // Generate Lip-Sync keyframes from dialogue text
  const handleGenerateLipSync = useCallback((charId: string, text: string) => {
    const phonemes = generateLipSyncFromText(text, project.fps || 24, project.currentFrame)
    if (phonemes.length === 0) return

    updateProject(prev => {
      let tracks = [...prev.tracks]
      const char = sceneCharacters.find(c => c.id === charId)
      const charName = char?.name || 'Character'

      // Map phonemes into expression tracks
      for (const p of phonemes) {
        let expTrack = tracks.find(t => t.targetId === charId && t.property === 'expression' && t.subProperty === p.viseme)
        if (!expTrack) {
          expTrack = {
            id: `track_${charId}_viseme_${p.viseme}`,
            name: `${charName} - Lip (${p.viseme.toUpperCase()})`,
            targetId: charId,
            targetName: charName,
            targetType: 'character',
            property: 'expression',
            subProperty: p.viseme,
            color: '#EC4899',
            keyframes: []
          }
          tracks.push(expTrack)
        }

        const newKeys = [
          ...expTrack.keyframes.filter(k => k.frame !== p.frame),
          { id: `kf_lip_${Date.now()}_${p.frame}`, frame: p.frame, value: p.weight, interpolation: 'easeInOut' as const }
        ].sort((a, b) => a.frame - b.frame)

        tracks = tracks.map(t => t.id === expTrack!.id ? { ...t, keyframes: newKeys } : t)
      }

      // Add a marker for dialogue
      const newMarker: TimelineMarker = {
        id: `marker_dlg_${Date.now()}`,
        frame: project.currentFrame,
        label: `Speech: "${text.substring(0, 20)}..."`,
        color: '#EC4899',
        category: 'dialogue'
      }

      return {
        ...prev,
        markers: [...prev.markers, newMarker],
        tracks
      }
    })
  }, [project.currentFrame, project.fps, sceneCharacters, updateProject])

  // Get currently selected character/prop/camera for Inspector
  const selectedCharacter = selectedEntity?.type === 'character'
    ? sceneCharacters.find(c => c.id === selectedEntity.id)
    : undefined

  const selectedProp = selectedEntity?.type === 'prop'
    ? sceneProps.find(p => p.id === selectedEntity.id)
    : undefined

  const selectedCamera = selectedEntity?.type === 'camera'
    ? cameraShots.find(c => c.id === selectedEntity.id)
    : undefined

  return (
    <div className="flex flex-col w-full h-full min-w-0 min-h-0 select-none overflow-hidden bg-[#0A0A0E]">
      {/* Top Animation Control Strip */}
      <div className="h-10 bg-[#12121A] border-b border-[#1E1E28] px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-[#10B981]" />
            <span className="text-xs font-black uppercase text-white tracking-wider">
              Sequencer Dashboard
            </span>
          </div>

          <div className="h-4 w-px bg-[#262636]" />

          {/* Project Title */}
          <input
            type="text"
            value={project.name}
            onChange={e => updateProject({ name: e.target.value })}
            className="px-2 py-0.5 bg-[#181824] hover:bg-[#202030] focus:bg-[#202030] border border-[#2B2B3C] rounded text-xs font-bold text-white focus:outline-none w-48"
          />

          <span className="text-[10px] font-mono text-[#707080]">
            {project.tracks.length} Tracks · {project.totalFrames} Frames
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Render / Movie Export Button */}
          <button
            onClick={() => setIsRenderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#10B981]/20 hover:bg-[#10B981] text-[#10B981] hover:text-black border border-[#10B981]/40 text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#10B981]/15 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Render Movie</span>
          </button>

          {/* Inspector Toggle */}
          <button
            onClick={() => setIsInspectorOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              isInspectorOpen
                ? 'bg-[#222232] border-[#3B3B50] text-white'
                : 'bg-[#181822] border-[#222230] text-[#707085] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>
        </div>
      </div>

      {/* Center Layout: Viewport + Right Inspector */}
      <div className="flex-1 flex min-h-0 min-w-0 relative overflow-hidden">
        {/* Viewport Area is hosted in Editor.tsx main canvas, but timeline sits below */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          {/* Timeline Drawer */}
          <div 
            style={{ height: isTimelineExpanded ? '100%' : `${timelineHeight}px` }}
            className="w-full bg-[#0D0D12] border-t border-[#20202C] flex flex-col transition-all duration-200 z-20 shrink-0"
          >
            <AnimationTimeline
              project={project}
              onUpdateProject={updateProject}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onSeek={handleSeek}
              onAddKeyframeCurrent={() => {
                if (selectedEntity?.type === 'character') {
                  handleKeyframeAllTransform(selectedEntity.id)
                }
              }}
              onDeleteSelectedKeyframes={handleDeleteSelectedKeyframes}
              isExpanded={isTimelineExpanded}
              onToggleExpanded={() => setIsTimelineExpanded(prev => !prev)}
            />
          </div>
        </div>

        {/* Right Animation Property Inspector Panel */}
        {isInspectorOpen && (
          <AnimationInspector
            selectedEntity={selectedEntity}
            selectedCharacter={selectedCharacter}
            selectedProp={selectedProp}
            selectedCamera={selectedCamera}
            project={project}
            currentFrame={project.currentFrame}
            onUpdateCharacterTransform={onUpdateCharacterTransform}
            onUpdateCharacterState={onUpdateCharacterState}
            onUpdateCameraShot={onUpdateCameraPosition ? (id, updates) => {
              if (updates.position) onUpdateCameraPosition(id, updates.position)
            } : undefined}
            onAddKeyframe={handleAddKeyframe}
            onKeyframeAllTransform={handleKeyframeAllTransform}
            onApplyClipToCharacter={handleApplyClipToCharacter}
            onGenerateLipSync={handleGenerateLipSync}
          />
        )}
      </div>

      {/* Render Animation Video Modal */}
      <AnimationRenderModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        project={project}
        onSeekFrame={handleSeek}
        getCanvasElement={() => {
          // Canvas element from document
          return document.querySelector('canvas')
        }}
      />
    </div>
  )
}
