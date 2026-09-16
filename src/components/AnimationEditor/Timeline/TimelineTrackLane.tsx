/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react'
import { 
  AnimationTrack, 
  AnimationKeyframe, 
  AnimationClip, 
  InterpolationType 
} from '../../../types/animation'
import { 
  Diamond, 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Volume2, 
  VolumeX,
  Sparkles,
  User,
  Camera,
  Layers,
  MoreVertical,
  Trash2,
  Copy,
  Scissors
} from 'lucide-react'

interface TimelineTrackLaneProps {
  track: AnimationTrack
  currentFrame: number
  totalFrames: number
  zoom: number
  scrollX: number
  selectedKeyframeIds: string[]
  isSelected: boolean
  onSelectTrack: (trackId: string) => void
  onToggleExpand?: (trackId: string) => void
  onToggleMute: (trackId: string) => void
  onToggleSolo?: (trackId: string) => void
  onToggleLock: (trackId: string) => void
  onAddKeyframe: (trackId: string, frame: number) => void
  onSelectKeyframe: (keyframeId: string, multiSelect: boolean) => void
  onMoveKeyframe: (trackId: string, keyframeId: string, newFrame: number) => void
  onDeleteKeyframe: (trackId: string, keyframeId: string) => void
  onChangeInterpolation: (trackId: string, keyframeId: string, interpolation: InterpolationType) => void
  onMoveClip?: (trackId: string, clipId: string, newStartFrame: number) => void
}

export const TimelineTrackLane: React.FC<TimelineTrackLaneProps> = ({
  track,
  currentFrame,
  totalFrames,
  zoom,
  scrollX,
  selectedKeyframeIds,
  isSelected,
  onSelectTrack,
  onToggleExpand,
  onToggleMute,
  onToggleSolo,
  onToggleLock,
  onAddKeyframe,
  onSelectKeyframe,
  onMoveKeyframe,
  onDeleteKeyframe,
  onChangeInterpolation,
  onMoveClip
}) => {
  const [contextMenu, setContextMenu] = useState<{
    type: 'keyframe' | 'lane'
    x: number
    y: number
    keyframeId?: string
    frame?: number
  } | null>(null)

  const [draggingFramePreview, setDraggingFramePreview] = useState<number | null>(null)
  const draggingKeyframeRef = useRef<{ id: string; startFrame: number; startX: number } | null>(null)
  const draggingClipRef = useRef<{ id: string; startFrame: number; startX: number } | null>(null)

  const getTrackIcon = () => {
    switch (track.targetType) {
      case 'character':
        return <User className="w-3.5 h-3.5 text-[#D32F2F]" />
      case 'camera':
        return <Camera className="w-3.5 h-3.5 text-[#06B6D4]" />
      default:
        return <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
    }
  }

  // Keyframe Color based on property
  const getKeyframeColor = (isSelectedKey: boolean) => {
    if (isSelectedKey) return 'bg-[#00E676] shadow-lg shadow-[#00E676]/40 border-white'
    if (track.property === 'position' || track.property === 'transform') {
      return 'bg-[#3B82F6] hover:bg-[#60A5FA] border-[#93C5FD]'
    }
    if (track.property === 'rotation') {
      return 'bg-[#F59E0B] hover:bg-[#FBBF24] border-[#FDE68A]'
    }
    if (track.property === 'scale') {
      return 'bg-[#8B5CF6] hover:bg-[#A78BFA] border-[#DDD6FE]'
    }
    if (track.property === 'expression') {
      return 'bg-[#EC4899] hover:bg-[#F472B6] border-[#FBCFE8]'
    }
    if (track.property === 'cameraFov' || track.property === 'cameraPosition') {
      return 'bg-[#06B6D4] hover:bg-[#22D3EE] border-[#A5F3FC]'
    }
    return 'bg-[#D32F2F] hover:bg-[#FF5252] border-[#FF8A80]'
  }

  // Keyframe Drag Handlers
  const handleKeyframePointerDown = (e: React.PointerEvent, kf: AnimationKeyframe) => {
    e.stopPropagation()
    onSelectKeyframe(kf.id, e.shiftKey || e.ctrlKey)
    draggingKeyframeRef.current = {
      id: kf.id,
      startFrame: kf.frame,
      startX: e.clientX
    }
    setDraggingFramePreview(kf.frame)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handleKeyframePointerMove = (e: React.PointerEvent) => {
    if (!draggingKeyframeRef.current) return
    const deltaX = e.clientX - draggingKeyframeRef.current.startX
    const deltaFrames = Math.round(deltaX / zoom)
    const newFrame = Math.max(0, Math.min(totalFrames, draggingKeyframeRef.current.startFrame + deltaFrames))
    setDraggingFramePreview(newFrame)
    onMoveKeyframe(track.id, draggingKeyframeRef.current.id, newFrame)
  }

  const handleKeyframePointerUp = (e: React.PointerEvent) => {
    draggingKeyframeRef.current = null
    setDraggingFramePreview(null)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  // Clip Drag Handlers
  const handleClipPointerDown = (e: React.PointerEvent, clip: AnimationClip) => {
    e.stopPropagation()
    onSelectTrack(track.id)
    if (onMoveClip) {
      draggingClipRef.current = {
        id: clip.id,
        startFrame: clip.startFrame,
        startX: e.clientX
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
  }

  const handleClipPointerMove = (e: React.PointerEvent) => {
    if (!draggingClipRef.current || !onMoveClip) return
    const deltaX = e.clientX - draggingClipRef.current.startX
    const deltaFrames = Math.round(deltaX / zoom)
    const newFrame = Math.max(0, Math.min(totalFrames - 5, draggingClipRef.current.startFrame + deltaFrames))
    onMoveClip(track.id, draggingClipRef.current.id, newFrame)
  }

  const handleClipPointerUp = (e: React.PointerEvent) => {
    draggingClipRef.current = null
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  return (
    <div 
      onClick={() => onSelectTrack(track.id)}
      className={`flex items-center h-8 border-b border-[#1A1A24] transition-colors group ${
        isSelected ? 'bg-[#181822]' : 'hover:bg-[#12121A] bg-[#0E0E14]'
      }`}
    >
      {/* Track Header (Fixed Left) */}
      <div className="w-56 shrink-0 h-full flex items-center justify-between px-2.5 bg-[#12121A] border-r border-[#22222E] select-none z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          {onToggleExpand && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(track.id)
              }}
              className="p-0.5 text-[#707080] hover:text-white cursor-pointer"
            >
              {track.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}

          <div className="shrink-0">{getTrackIcon()}</div>

          <span 
            title={track.name}
            className={`text-xs font-bold truncate ${
              isSelected ? 'text-white' : 'text-[#A0A0B0]'
            }`}
          >
            {track.name}
          </span>
        </div>

        {/* Track Controls: Add Keyframe, Mute, Lock */}
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddKeyframe(track.id, currentFrame)
            }}
            title="Add Keyframe at current frame (K)"
            className="p-1 rounded text-[#707080] hover:text-[#00E676] hover:bg-[#1E1E2C] cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleMute(track.id)
            }}
            title={track.muted ? 'Unmute Track' : 'Mute Track'}
            className={`p-1 rounded cursor-pointer ${
              track.muted ? 'text-[#D32F2F]' : 'text-[#707080] hover:text-white'
            }`}
          >
            {track.muted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleLock(track.id)
            }}
            title={track.locked ? 'Unlock Track' : 'Lock Track'}
            className={`p-1 rounded cursor-pointer ${
              track.locked ? 'text-[#EAB308]' : 'text-[#707080] hover:text-white'
            }`}
          >
            {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Track Timeline Lane (Horizontally Scrollable) */}
      <div 
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const clickX = e.clientX - rect.left
          const frame = Math.max(0, Math.min(totalFrames, Math.round((clickX + scrollX) / zoom)))
          onAddKeyframe(track.id, frame)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          const rect = e.currentTarget.getBoundingClientRect()
          const clickX = e.clientX - rect.left
          const frame = Math.max(0, Math.min(totalFrames, Math.round((clickX + scrollX) / zoom)))
          setContextMenu({
            type: 'lane',
            x: e.clientX,
            y: e.clientY,
            frame
          })
        }}
        className="flex-1 h-full relative overflow-hidden bg-[#0A0A0F] cursor-crosshair"
      >
        {/* Subtle frame grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {Array.from({ length: Math.ceil(totalFrames / 10) }, (_, i) => {
            const gx = (i * 10) * zoom - scrollX
            if (gx < -50 || gx > 2500) return null
            return (
              <div 
                key={i} 
                style={{ left: `${gx}px` }} 
                className="absolute top-0 bottom-0 w-px bg-white" 
              />
            )
          })}
        </div>

        {/* Animation Clips (e.g. Walk, Wave, Talk) */}
        {track.clips && track.clips.map(clip => {
          const clipX = clip.startFrame * zoom - scrollX
          const clipWidth = clip.durationFrames * zoom
          if (clipX + clipWidth < -50 || clipX > 2500) return null

          return (
            <div
              key={clip.id}
              style={{
                left: `${clipX}px`,
                width: `${clipWidth}px`,
                backgroundColor: clip.color ? `${clip.color}33` : '#3B82F633',
                borderColor: clip.color || '#3B82F6'
              }}
              onPointerDown={(e) => handleClipPointerDown(e, clip)}
              onPointerMove={handleClipPointerMove}
              onPointerUp={handleClipPointerUp}
              className="absolute top-1 bottom-1 rounded border flex items-center px-2 select-none cursor-grab active:cursor-grabbing shadow-sm overflow-hidden z-5"
            >
              <span className="text-[10px] font-black tracking-wide text-white uppercase truncate drop-shadow-sm">
                {clip.name}
              </span>
              {clip.loop && (
                <span className="ml-1 text-[8px] font-bold px-1 rounded bg-black/40 text-white/80">
                  LOOP
                </span>
              )}
            </div>
          )
        })}

        {/* Clean Diamond-Shaped Keyframe Indicators ◆ */}
        {track.keyframes.map(kf => {
          const kfX = kf.frame * zoom - scrollX
          if (kfX < -30 || kfX > 2500) return null
          const isKeySelected = selectedKeyframeIds.includes(kf.id)

          return (
            <div
              key={kf.id}
              style={{ left: `${kfX}px` }}
              title={`Frame ${kf.frame} • Value: ${JSON.stringify(kf.value)} • ${kf.interpolation}`}
              onPointerDown={(e) => handleKeyframePointerDown(e, kf)}
              onPointerMove={handleKeyframePointerMove}
              onPointerUp={handleKeyframePointerUp}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setContextMenu({
                  type: 'keyframe',
                  x: e.clientX,
                  y: e.clientY,
                  keyframeId: kf.id
                })
              }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-ew-resize z-10 p-1 group/kf"
            >
              <div 
                className={`w-3.5 h-3.5 rotate-45 transition-transform group-hover/kf:scale-130 border shadow-md ${getKeyframeColor(isKeySelected)}`}
              />
              {/* Floating Drag Frame Tooltip */}
              {draggingKeyframeRef.current?.id === kf.id && draggingFramePreview !== null && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-[#00E676] text-[#00E676] text-[9px] font-mono font-bold whitespace-nowrap shadow-xl z-30 pointer-events-none">
                  F{draggingFramePreview}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <div 
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-48 bg-[#181824] border border-[#2D2D3E] rounded-xl shadow-2xl p-1.5 flex flex-col text-xs text-[#C0C0D0]"
        >
          {contextMenu?.type === 'keyframe' && contextMenu.keyframeId && (
            <>
              <div className="px-2 py-1 text-[10px] font-black uppercase text-[#707080] border-b border-[#252536] mb-1">
                Keyframe Easing
              </div>
              <button
                onClick={() => {
                  onChangeInterpolation(track.id, contextMenu.keyframeId!, 'easeInOut')
                  setContextMenu(null)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#252538] hover:text-white cursor-pointer"
              >
                <span>Ease In / Out</span>
              </button>
              <button
                onClick={() => {
                  onChangeInterpolation(track.id, contextMenu.keyframeId!, 'easeIn')
                  setContextMenu(null)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#252538] hover:text-white cursor-pointer"
              >
                <span>Ease In</span>
              </button>
              <button
                onClick={() => {
                  onChangeInterpolation(track.id, contextMenu.keyframeId!, 'easeOut')
                  setContextMenu(null)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#252538] hover:text-white cursor-pointer"
              >
                <span>Ease Out</span>
              </button>
              <button
                onClick={() => {
                  onChangeInterpolation(track.id, contextMenu.keyframeId!, 'linear')
                  setContextMenu(null)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#252538] hover:text-white cursor-pointer"
              >
                <span>Linear</span>
              </button>
              <button
                onClick={() => {
                  onChangeInterpolation(track.id, contextMenu.keyframeId!, 'step')
                  setContextMenu(null)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#252538] hover:text-white cursor-pointer"
              >
                <span>Step (Hold)</span>
              </button>

              <div className="h-px bg-[#252536] my-1" />

              <button
                onClick={() => {
                  onDeleteKeyframe(track.id, contextMenu.keyframeId!)
                  setContextMenu(null)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded text-[#D32F2F] hover:bg-[#D32F2F]/20 cursor-pointer font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Keyframe</span>
              </button>
            </>
          )}

          {contextMenu?.type === 'lane' && contextMenu.frame !== undefined && (
            <>
              <button
                onClick={() => {
                  onAddKeyframe(track.id, contextMenu.frame!)
                  setContextMenu(null)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#252538] hover:text-white cursor-pointer font-bold"
              >
                <Plus className="w-3.5 h-3.5 text-[#00E676]" />
                <span>Add Keyframe at frame {contextMenu.frame}</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Close context menu on outside click overlay */}
      {contextMenu && (
        <div 
          onClick={() => setContextMenu(null)}
          className="fixed inset-0 z-40" 
        />
      )}
    </div>
  )
}
