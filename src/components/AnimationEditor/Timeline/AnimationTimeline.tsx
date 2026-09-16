/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react'
import { 
  AnimationProject, 
  TimelineViewMode, 
  InterpolationType,
  RulerUnit,
  TrackPropertyType
} from '../../../types/animation'
import { TimelineRuler } from './TimelineRuler'
import { TimelineTrackLane } from './TimelineTrackLane'
import { TimelineToolbar } from './TimelineToolbar'
import { PlaybackControls } from './PlaybackControls'
import { GraphEditor } from './GraphEditor'
import { DopeSheet } from './DopeSheet'
import { 
  Camera, 
  Volume2, 
  Layers
} from 'lucide-react'
import { 
  VOOM_DRAG_TYPES, 
  getDragData, 
  DraggedAnimationPayload, 
  DraggedPosePayload, 
  DraggedCameraPayload, 
  DraggedAudioPayload 
} from '../../../utils/dragDropAsset'

interface AnimationTimelineProps {
  project: AnimationProject
  onUpdateProject: (updates: Partial<AnimationProject> | ((prev: AnimationProject) => AnimationProject)) => void
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeek: (frame: number) => void
  onAddKeyframeCurrent: () => void
  onDeleteSelectedKeyframes: () => void
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  project,
  onUpdateProject,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onAddKeyframeCurrent,
  onDeleteSelectedKeyframes,
  isExpanded,
  onToggleExpanded
}) => {
  const lanesScrollRef = useRef<HTMLDivElement>(null)
  const timelineContainerRef = useRef<HTMLDivElement>(null)

  // Synchronize horizontal scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onUpdateProject({ scrollX: e.currentTarget.scrollLeft })
  }

  // Keyframe track operations
  const handleToggleMute = (trackId: string) => {
    onUpdateProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t)
    }))
  }

  const handleToggleSolo = (trackId: string) => {
    onUpdateProject(prev => {
      const isCurrentlySolo = prev.tracks.some(t => t.id === trackId && !t.muted) && prev.tracks.every(t => t.id === trackId || t.muted)
      return {
        ...prev,
        tracks: prev.tracks.map(t => ({
          ...t,
          muted: isCurrentlySolo ? false : t.id !== trackId
        }))
      }
    })
  }

  const handleToggleLock = (trackId: string) => {
    onUpdateProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? { ...t, locked: !t.locked } : t)
    }))
  }

  const handleAddKeyframe = (trackId: string, frame: number) => {
    onUpdateProject(prev => {
      const track = prev.tracks.find(t => t.id === trackId)
      if (!track) return prev

      const existingKf = track.keyframes.find(k => k.frame === frame)
      if (existingKf) return prev

      let defaultValue: any = 0
      if (track.property === 'position') defaultValue = [0, 0, 0]
      else if (track.property === 'rotation') defaultValue = [0, 0, 0]
      else if (track.property === 'scale') defaultValue = [1, 1, 1]
      else if (track.property === 'cameraFov') defaultValue = 32

      const newKeyframe = {
        id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        frame,
        value: defaultValue,
        interpolation: 'easeInOut' as InterpolationType
      }

      return {
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? {
          ...t,
          keyframes: [...t.keyframes, newKeyframe].sort((a, b) => a.frame - b.frame)
        } : t)
      }
    })
  }

  const handleSelectKeyframe = (keyframeId: string, multiSelect: boolean) => {
    onUpdateProject(prev => {
      if (multiSelect) {
        const isAlready = prev.selectedKeyframeIds.includes(keyframeId)
        return {
          ...prev,
          selectedKeyframeIds: isAlready 
            ? (prev.selectedKeyframeIds || []).filter(id => id !== keyframeId)
            : [...(prev.selectedKeyframeIds || []), keyframeId]
        }
      }
      return {
        ...prev,
        selectedKeyframeIds: [keyframeId]
      }
    })
  }

  const handleMoveKeyframe = (trackId: string, keyframeId: string, newFrame: number) => {
    onUpdateProject(prev => ({
      ...prev,
      tracks: (prev.tracks || []).map(t => t.id === trackId ? {
        ...t,
        keyframes: (t.keyframes || []).map(k => k.id === keyframeId ? { ...k, frame: newFrame } : k)
          .sort((a, b) => a.frame - b.frame)
      } : t)
    }))
  }

  const handleDeleteKeyframe = (trackId: string, keyframeId: string) => {
    onUpdateProject(prev => ({
      ...prev,
      tracks: (prev.tracks || []).map(t => t.id === trackId ? {
        ...t,
        keyframes: (t.keyframes || []).filter(k => k.id !== keyframeId)
      } : t),
      selectedKeyframeIds: (prev.selectedKeyframeIds || []).filter(id => id !== keyframeId)
    }))
  }

  const handleChangeInterpolation = (trackId: string, keyframeId: string, interpolation: InterpolationType) => {
    onUpdateProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? {
        ...t,
        keyframes: t.keyframes.map(k => k.id === keyframeId ? { ...k, interpolation } : k)
      } : t)
    }))
  }

  const handleMoveClip = (trackId: string, clipId: string, newStartFrame: number) => {
    onUpdateProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => t.id === trackId ? {
        ...t,
        clips: (t.clips || []).map(c => c.id === clipId ? { ...c, startFrame: newStartFrame } : c)
      } : t)
    }))
  }

  // Prev / Next Keyframe Jump Navigation
  const getAllKeyframeFrames = (): number[] => {
    const tracks = project?.tracks || []
    const activeTracks = project?.selectedTrackId 
      ? tracks.filter(t => t.id === project.selectedTrackId)
      : tracks
    const framesSet = new Set<number>()
    activeTracks.forEach(t => {
      ;(t.keyframes || []).forEach(kf => framesSet.add(kf.frame))
    })
    return Array.from(framesSet).sort((a, b) => a - b)
  }

  const handlePrevKeyframe = () => {
    const frames = getAllKeyframeFrames()
    const prev = frames.filter(f => f < project.currentFrame).pop()
    if (prev !== undefined) {
      onSeek(prev)
    } else {
      onSeek(0)
    }
  }

  const handleNextKeyframe = () => {
    const frames = getAllKeyframeFrames()
    const next = frames.find(f => f > project.currentFrame)
    if (next !== undefined) {
      onSeek(next)
    } else {
      onSeek(project.totalFrames)
    }
  }

  // Toolbar Actions
  const handleAddTrack = (trackType: string) => {
    const trackId = `track_${Date.now()}`
    let name = 'New Track'
    let property: TrackPropertyType = 'position'
    let targetType: 'character' | 'camera' | 'audio' | 'light' | 'prop' = 'character'
    let targetId = 'char_01'

    if (trackType === 'transform') {
      name = 'Character Transform'
      property = 'position'
    } else if (trackType === 'clip') {
      name = 'Action Clip Track'
      property = 'clip'
    } else if (trackType === 'expression') {
      name = 'Face Expression'
      property = 'expression'
    } else if (trackType === 'cameraFov') {
      name = 'Camera Shot Track'
      property = 'cameraFov'
      targetType = 'camera'
      targetId = 'cam_01'
    } else if (trackType === 'audio') {
      name = 'Audio Voiceover'
      property = 'audio'
      targetType = 'audio'
      targetId = 'scene_audio'
    }

    onUpdateProject(prev => ({
      ...prev,
      tracks: [
        ...prev.tracks,
        {
          id: trackId,
          name,
          targetType,
          targetId,
          targetName: name,
          property,
          muted: false,
          locked: false,
          keyframes: [
            {
              id: `kf_${Date.now()}`,
              frame: prev.currentFrame,
              value: property === 'position' ? [0, 0, 0] : property === 'cameraFov' ? 35 : 'neutral',
              interpolation: 'easeInOut'
            }
          ]
        }
      ]
    }))
  }

  const handleAddMarker = () => {
    const markerId = `marker_${Date.now()}`
    const colors = ['#EAB308', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6']
    const color = colors[project.markers.length % colors.length]
    onUpdateProject(prev => ({
      ...prev,
      markers: [
        ...prev.markers,
        {
          id: markerId,
          frame: prev.currentFrame,
          label: `Marker ${prev.markers.length + 1}`,
          color,
          category: 'event' as const
        }
      ].sort((a, b) => a.frame - b.frame)
    }))
  }

  const handleFitTimeline = () => {
    if (!timelineContainerRef.current) return
    const containerWidth = timelineContainerRef.current.clientWidth - 224 // minus track header column
    if (containerWidth > 100 && project.totalFrames > 0) {
      const optimalZoom = Math.max(6, Math.min(45, Math.floor(containerWidth / project.totalFrames)))
      onUpdateProject({ zoom: optimalZoom, scrollX: 0 })
    }
  }

  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault()
    let targetFrame = project.currentFrame
    if (timelineContainerRef.current) {
      const rect = timelineContainerRef.current.getBoundingClientRect()
      const offsetX = e.clientX - rect.left - 224 + project.scrollX
      if (offsetX > 0) {
        targetFrame = Math.max(0, Math.min(project.totalFrames, Math.round(offsetX / project.zoom)))
      }
    }

    // 1. Animation clip dropped
    const animData = getDragData<DraggedAnimationPayload>(e, VOOM_DRAG_TYPES.ANIMATION)
    if (animData) {
      const clipId = `clip_${Date.now()}`
      const newClip = {
        id: clipId,
        name: animData.name,
        type: animData.clipType,
        startFrame: targetFrame,
        durationFrames: animData.durationFrames,
        speed: 1.0,
        blendWeight: 1.0,
        loop: true,
        color: animData.color || '#3B82F6'
      }

      onUpdateProject(prev => {
        let existingClipTrack = prev.tracks.find(t => t.property === 'clip')
        if (existingClipTrack) {
          return {
            ...prev,
            tracks: prev.tracks.map(t => t.id === existingClipTrack!.id ? {
              ...t,
              clips: [...(t.clips || []), newClip]
            } : t)
          }
        } else {
          return {
            ...prev,
            tracks: [
              ...prev.tracks,
              {
                id: `track_clip_${Date.now()}`,
                name: 'Action Clips',
                targetType: 'character' as const,
                targetId: 'char_01',
                targetName: 'Character',
                property: 'clip',
                muted: false,
                locked: false,
                keyframes: [],
                clips: [newClip]
              }
            ]
          }
        }
      })
      onSeek(targetFrame)
      return
    }

    // 2. Pose dropped
    const poseData = getDragData<DraggedPosePayload>(e, VOOM_DRAG_TYPES.POSE)
    if (poseData) {
      onUpdateProject(prev => {
        let poseTrack = prev.tracks.find(t => t.property === 'pose')
        if (poseTrack) {
          const newKf = {
            id: `kf_pose_${Date.now()}`,
            frame: targetFrame,
            value: poseData.poseKey,
            interpolation: 'easeInOut' as const
          }
          return {
            ...prev,
            tracks: prev.tracks.map(t => t.id === poseTrack!.id ? {
              ...t,
              keyframes: [...t.keyframes.filter(k => k.frame !== targetFrame), newKf].sort((a, b) => a.frame - b.frame)
            } : t)
          }
        } else {
          return {
            ...prev,
            tracks: [
              ...prev.tracks,
              {
                id: `track_pose_${Date.now()}`,
                name: 'Character Pose',
                targetType: 'character' as const,
                targetId: 'char_01',
                targetName: 'Character',
                property: 'pose',
                muted: false,
                locked: false,
                keyframes: [
                  {
                    id: `kf_pose_${Date.now()}`,
                    frame: targetFrame,
                    value: poseData.poseKey,
                    interpolation: 'easeInOut' as const
                  }
                ]
              }
            ]
          }
        }
      })
      onSeek(targetFrame)
      return
    }

    // 3. Camera cut dropped
    const camData = getDragData<DraggedCameraPayload>(e, VOOM_DRAG_TYPES.CAMERA)
    if (camData) {
      const cutId = `cut_${Date.now()}`
      onUpdateProject(prev => ({
        ...prev,
        cameraCuts: [
          ...(prev.cameraCuts || []).filter(c => Math.abs(c.startFrame - targetFrame) > 3),
          {
            id: cutId,
            cameraShotId: (camData as any).id || cutId,
            cameraName: camData.name,
            startFrame: targetFrame,
            durationFrames: 48,
            transition: 'cut' as const
          }
        ].sort((a, b) => a.startFrame - b.startFrame)
      }))
      onSeek(targetFrame)
      return
    }

    // 4. Audio dropped
    const audioData = getDragData<DraggedAudioPayload>(e, VOOM_DRAG_TYPES.AUDIO)
    if (audioData) {
      const audioClipId = `audio_${Date.now()}`
      const dummyWaveform = Array.from({ length: 30 }, () => Math.max(0.2, Math.random()))
      onUpdateProject(prev => ({
        ...prev,
        audioClips: [
          ...(prev.audioClips || []),
          {
            id: audioClipId,
            name: audioData.name,
            type: 'voice' as const,
            startFrame: targetFrame,
            durationFrames: audioData.durationFrames,
            volume: 1.0,
            pan: 0,
            fadeInFrames: 0,
            fadeOutFrames: 0,
            muted: false,
            solo: false,
            waveform: dummyWaveform
          }
        ]
      }))
      onSeek(targetFrame)
      return
    }
  }

  // 15. KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs or textareas
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        if (project.isPlaying) {
          onPause()
        } else {
          onPlay()
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        const targetTrack = project.selectedTrackId 
          ? project.tracks.find(t => t.id === project.selectedTrackId)
          : project.tracks[0]
        if (targetTrack) {
          handleAddKeyframe(targetTrack.id, project.currentFrame)
        }
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        onUpdateProject({ inPoint: project.currentFrame })
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        onUpdateProject({ outPoint: project.currentFrame })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (e.shiftKey) {
          handlePrevKeyframe()
        } else {
          onSeek(Math.max(0, project.currentFrame - 1))
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (e.shiftKey) {
          handleNextKeyframe()
        } else {
          onSeek(Math.min(project.totalFrames, project.currentFrame + 1))
        }
      } else if (e.key === 'Home') {
        e.preventDefault()
        onSeek(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        onSeek(project.totalFrames)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (project.selectedKeyframeIds.length > 0) {
          e.preventDefault()
          onUpdateProject(prev => ({
            ...prev,
            tracks: (prev.tracks || []).map(t => ({
              ...t,
              keyframes: (t.keyframes || []).filter(k => !(prev.selectedKeyframeIds || []).includes(k.id))
            })),
            selectedKeyframeIds: []
          }))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [project, onPlay, onPause, onSeek, onUpdateProject, handlePrevKeyframe, handleNextKeyframe, handleAddKeyframe])

  return (
    <div 
      ref={timelineContainerRef}
      className={`flex flex-col border-t border-[#20202C] bg-[#0A0A0E] select-none transition-all duration-200 z-20 shrink-0 ${
        isExpanded ? 'h-[460px]' : 'h-[280px]'
      }`}
    >
      {/* 1. DEDICATED TIMELINE TOOLBAR (Header) */}
      <TimelineToolbar
        onAddTrack={handleAddTrack}
        onAddCharacter={() => handleAddTrack('transform')}
        onAddCamera={() => handleAddTrack('cameraFov')}
        onAddAudio={() => handleAddTrack('audio')}
        onAddMarker={handleAddMarker}
        snapToFrames={project.snapToFrames}
        onToggleSnap={() => onUpdateProject(prev => ({ ...prev, snapToFrames: !prev.snapToFrames }))}
        magnetSnapping={project.magnetSnapping ?? true}
        onToggleMagnet={() => onUpdateProject(prev => ({ ...prev, magnetSnapping: !prev.magnetSnapping }))}
        onAddKeyframeCurrent={onAddKeyframeCurrent}
        autoKeyframe={project.autoKeyframe}
        onToggleAutoKeyframe={() => onUpdateProject(prev => ({ ...prev, autoKeyframe: !prev.autoKeyframe }))}
        isLooping={project.isLooping}
        onToggleLoop={() => onUpdateProject(prev => ({ ...prev, isLooping: !prev.isLooping }))}
        zoom={project.zoom}
        onChangeZoom={newZoom => onUpdateProject({ zoom: newZoom })}
        onFitTimeline={handleFitTimeline}
        fps={project.fps}
        onChangeFPS={fps => onUpdateProject({ fps })}
        rulerUnit={project.rulerUnit || 'frames'}
        onChangeRulerUnit={unit => onUpdateProject({ rulerUnit: unit })}
        mode={project.mode}
        onChangeMode={mode => onUpdateProject({ mode })}
        isExpanded={isExpanded}
        onToggleExpanded={onToggleExpanded}
      />

      {/* 2. MODE CONTENT SWITCHER */}
      {project.mode === 'graph' ? (
        <GraphEditor
          tracks={project.tracks}
          selectedTrackId={project.selectedTrackId}
          currentFrame={project.currentFrame}
          totalFrames={project.totalFrames}
          onSeek={onSeek}
          onUpdateKeyframeValue={(trackId, kfId, val) => {
            onUpdateProject(prev => ({
              ...prev,
              tracks: prev.tracks.map(t => t.id === trackId ? {
                ...t,
                keyframes: t.keyframes.map(k => k.id === kfId ? { ...k, value: val } : k)
              } : t)
            }))
          }}
          onChangeInterpolation={handleChangeInterpolation}
        />
      ) : project.mode === 'dopesheet' ? (
        <DopeSheet
          tracks={project.tracks}
          selectedTrackId={project.selectedTrackId}
          currentFrame={project.currentFrame}
          totalFrames={project.totalFrames}
          zoom={project.zoom}
          scrollX={project.scrollX}
          onSeek={onSeek}
          onSelectTrack={id => onUpdateProject({ selectedTrackId: id })}
          onSelectKeyframe={id => handleSelectKeyframe(id, false)}
        />
      ) : (
        /* Standard Multi-Track Sequencer View */
        <div 
          onDragOver={e => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }}
          onDrop={handleTimelineDrop}
          className="flex-1 flex flex-col min-h-0 relative overflow-hidden"
        >
          {/* Ruler Strip */}
          <div className="flex items-center h-8 bg-[#0F0F14] border-b border-[#1E1E2A]">
            <div className="w-56 shrink-0 h-full px-3 flex items-center justify-between border-r border-[#1E1E2A] bg-[#12121A] text-[10px] font-black uppercase tracking-wider text-[#6D6D82]">
              <span>Tracks ({project.tracks.length})</span>
              <span className="text-[#00E676]">{project.fps} FPS</span>
            </div>
            <div className="flex-1 h-full overflow-hidden">
              <TimelineRuler
                totalFrames={project.totalFrames}
                currentFrame={project.currentFrame}
                fps={project.fps}
                zoom={project.zoom}
                scrollX={project.scrollX}
                rulerUnit={project.rulerUnit || 'frames'}
                markers={project.markers}
                inPoint={project.inPoint}
                outPoint={project.outPoint}
                onSeek={onSeek}
              />
            </div>
          </div>

          {/* Camera Cuts Track Header & Lane */}
          {project.cameraCuts && project.cameraCuts.length > 0 && (
            <div className="flex items-center h-7 bg-[#111118] border-b border-[#1E1E28]">
              <div className="w-56 shrink-0 h-full px-3 flex items-center gap-1.5 border-r border-[#1E1E2A] bg-[#14141C] text-[10px] font-bold text-[#06B6D4]">
                <Camera className="w-3 h-3 text-[#06B6D4]" />
                <span className="uppercase">Camera Cuts</span>
              </div>
              <div className="flex-1 h-full relative overflow-hidden bg-[#0A0A0F]">
                {project.cameraCuts.map(cut => {
                  const cutX = cut.startFrame * project.zoom - project.scrollX
                  const cutW = cut.durationFrames * project.zoom
                  return (
                    <div
                      key={cut.id}
                      style={{
                        left: `${cutX}px`,
                        width: `${cutW}px`,
                        borderColor: cut.color || '#06B6D4'
                      }}
                      className="absolute top-0.5 bottom-0.5 rounded border bg-[#06B6D4]/20 flex items-center px-2 text-[9px] font-black text-white uppercase truncate"
                    >
                      <span>{cut.cameraName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Audio Tracks Header & Lane (Waveform previews) */}
          {project.audioClips && project.audioClips.map(clip => {
            const clipX = clip.startFrame * project.zoom - project.scrollX
            const clipW = clip.durationFrames * project.zoom

            return (
              <div key={clip.id} className="flex items-center h-7 bg-[#111118] border-b border-[#1E1E28]">
                <div className="w-56 shrink-0 h-full px-3 flex items-center justify-between border-r border-[#1E1E2A] bg-[#14141C] text-[10px] font-bold text-[#F59E0B]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Volume2 className="w-3 h-3 text-[#F59E0B]" />
                    <span className="truncate">{clip.name}</span>
                  </div>
                  <span className="text-[9px] text-[#707080] font-mono">{Math.round(clip.volume * 100)}%</span>
                </div>
                <div className="flex-1 h-full relative overflow-hidden bg-[#0A0A0F]">
                  <div
                    style={{
                      left: `${clipX}px`,
                      width: `${clipW}px`
                    }}
                    className="absolute top-0.5 bottom-0.5 rounded border border-[#F59E0B]/60 bg-[#F59E0B]/20 flex items-center px-1 overflow-hidden"
                  >
                    {/* Visual waveform bars */}
                    <div className="flex items-center h-full w-full gap-0.5 opacity-80">
                      {clip.waveform.map((bar, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${Math.round(bar * 100)}%` }}
                          className="w-1 bg-[#FBBF24] rounded-xs"
                        />
                      ))}
                    </div>
                    {clip.dialogueText && (
                      <span className="absolute left-2 text-[9px] font-bold text-white drop-shadow truncate">
                        "{clip.dialogueText}"
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Main Keyframe Tracks Rows (Scrollable vertical & horizontal) */}
          <div 
            ref={lanesScrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden relative"
          >
            {project.tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#6D6D82]">
                <Layers className="w-8 h-8 mb-2 opacity-30 text-[#D32F2F]" />
                <span className="text-xs font-bold text-[#A0A0B2] mb-1">Timeline is Empty</span>
                <span className="text-[11px] text-[#555566]">Click "+ Add Track" or drag animations and poses onto the timeline to begin keyframing</span>
              </div>
            ) : (
              project.tracks.map(track => (
                <TimelineTrackLane
                  key={track.id}
                  track={track}
                  currentFrame={project.currentFrame}
                  totalFrames={project.totalFrames}
                  zoom={project.zoom}
                  scrollX={project.scrollX}
                  selectedKeyframeIds={project.selectedKeyframeIds}
                  isSelected={project.selectedTrackId === track.id}
                  onSelectTrack={id => onUpdateProject({ selectedTrackId: id })}
                  onToggleMute={handleToggleMute}
                  onToggleSolo={handleToggleSolo}
                  onToggleLock={handleToggleLock}
                  onAddKeyframe={handleAddKeyframe}
                  onSelectKeyframe={handleSelectKeyframe}
                  onMoveKeyframe={handleMoveKeyframe}
                  onDeleteKeyframe={handleDeleteKeyframe}
                  onChangeInterpolation={handleChangeInterpolation}
                  onMoveClip={handleMoveClip}
                />
              ))
            )}

            {/* Red Playhead line cutting cleanly through all tracks */}
            <div
              style={{ left: `${224 + (project.currentFrame * project.zoom - project.scrollX)}px` }}
              className="absolute top-0 bottom-0 w-px bg-[#D32F2F] pointer-events-none z-30 shadow-[0_0_8px_rgba(211,47,47,0.9)]"
            />
          </div>
        </div>
      )}

      {/* 3. DEDICATED PLAYBACK CONTROLS (Bottom Transport Bar) */}
      <PlaybackControls
        currentFrame={project.currentFrame}
        totalFrames={project.totalFrames}
        fps={project.fps}
        isPlaying={project.isPlaying}
        isLooping={project.isLooping}
        playbackSpeed={project.playbackSpeed || 1.0}
        inPoint={project.inPoint}
        outPoint={project.outPoint}
        onPlay={onPlay}
        onPause={onPause}
        onStop={onStop}
        onSeek={onSeek}
        onPrevFrame={() => onSeek(Math.max(0, project.currentFrame - 1))}
        onNextFrame={() => onSeek(Math.min(project.totalFrames, project.currentFrame + 1))}
        onGoToStart={() => onSeek(0)}
        onGoToEnd={() => onSeek(project.totalFrames)}
        onPrevKeyframe={handlePrevKeyframe}
        onNextKeyframe={handleNextKeyframe}
        onToggleLoop={() => onUpdateProject(prev => ({ ...prev, isLooping: !prev.isLooping }))}
        onChangeSpeed={speed => onUpdateProject({ playbackSpeed: speed })}
      />
    </div>
  )
}
