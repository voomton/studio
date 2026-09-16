import React, { useState } from 'react'
import { 
  Users, 
  Camera, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Film, 
  Sparkles, 
  Activity, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Play, 
  Clock, 
  Check, 
  SlidersHorizontal,
  Video
} from 'lucide-react'
import { SceneCameraShot, SceneCharacterInstance, SceneProp, SceneEntitySelection } from '../../types/scene'
import { SavedCharacterRecord } from '../../utils/vrmManager'
import { VRMViewport3D, VRMViewportHandle } from '../VRMViewport3D'
import { ANIMATION_PRESETS } from '../Workspace/Panels/AnimationLibraryPanel'

interface CinemaTopRowProps {
  // Left Panel Props
  sceneCharacters: SceneCharacterInstance[]
  characterList: SavedCharacterRecord[]
  activeCharacterId: string
  onSelectCharacter: (charId: string) => void
  selectedEntity: SceneEntitySelection
  cameraShots: SceneCameraShot[]
  activeCameraShotId: string | null
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onSaveCurrentCameraView: () => void

  // Center Browser Props
  onAddClipToTimeline?: (clipData: any) => void
  onAddCameraShotToTimeline?: (shot: SceneCameraShot) => void

  // Right Viewport Monitor Props
  viewportRef: React.RefObject<VRMViewportHandle>
  vrm: any | null
  avatarState: any
  sceneProps: SceneProp[]
  isLoadingVRM: boolean
  loadingProgress: number
  currentTimecode: string
  totalTimecode: string
  currentFrame: number
  totalFrames: number

  // Layout Sizing
  leftWidth: number
  rightWidth: number
}

// Preset artwork thumbnails for anime cinematic shots & clips
const SHOT_THUMBNAIL_STYLES = [
  { bg: 'from-[#1a1c3b] via-[#3b2d54] to-[#ff7a93]', iconColor: '#ff7a93', label: 'Sunset Cityscape', tag: 'Wide' },
  { bg: 'from-[#0b1b36] via-[#163c63] to-[#4fc3f7]', iconColor: '#4fc3f7', label: 'Neon Skyline', tag: 'Night' },
  { bg: 'from-[#2b1736] via-[#5c2451] to-[#ec4899]', iconColor: '#ec4899', label: 'Hero Close-Up', tag: 'Close' },
  { bg: 'from-[#261c10] via-[#5c3e1e] to-[#f59e0b]', iconColor: '#f59e0b', label: 'Golden Vantage', tag: 'Medium' },
  { bg: 'from-[#17142b] via-[#342461] to-[#8c7bff]', iconColor: '#8c7bff', label: 'Rooftop Duel', tag: 'Dynamic' }
]

const EFFECT_ITEMS = [
  { id: 'fx_smoke_cinematic', name: 'Volumetric Fog', duration: '00:08', frames: 192, color: '#6366F1', type: 'fx' },
  { id: 'fx_anamorphic_flare', name: 'Lens Bloom Flare', duration: '00:04', frames: 96, color: '#EC4899', type: 'fx' },
  { id: 'fx_rim_glow', name: 'Dramatic Rim Light', duration: '00:06', frames: 144, color: '#8C7BFF', type: 'fx' },
  { id: 'fx_speed_lines', name: 'Anime Action Streak', duration: '00:03', frames: 72, color: '#F59E0B', type: 'fx' }
]

export const CinemaTopRow: React.FC<CinemaTopRowProps> = ({
  sceneCharacters,
  characterList,
  activeCharacterId,
  onSelectCharacter,
  selectedEntity,
  cameraShots,
  activeCameraShotId,
  onApplyCameraShot,
  onSaveCurrentCameraView,
  onAddClipToTimeline,
  onAddCameraShotToTimeline,
  viewportRef,
  vrm,
  avatarState,
  sceneProps,
  isLoadingVRM,
  loadingProgress,
  currentTimecode,
  totalTimecode,
  currentFrame,
  totalFrames,
  leftWidth,
  rightWidth
}) => {
  // Collapsible sections in left panel
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(true)
  const [isCameraFramingExpanded, setIsCameraFramingExpanded] = useState(true)

  // Clips & Shots Browser filter tab
  const [browserFilter, setBrowserFilter] = useState<'all' | 'shots' | 'animations' | 'effects'>('all')

  // Preview Monitor Aspect Ratio
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9')
  const [isFullscreenMonitor, setIsFullscreenMonitor] = useState(false)

  // Determine active character list (fallback if empty)
  const displayCharacters = sceneCharacters.length > 0
    ? sceneCharacters
    : characterList.map((c, i) => ({
        id: c.id,
        characterId: c.id,
        name: c.name,
        position: [i * 1.2, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        visible: true,
        locked: false,
        castShadow: true,
        state: c.state || (c as any).avatarState
      }))

  // Handle dragging card to timeline
  const handleDragStart = (e: React.DragEvent, item: any, itemType: 'shot' | 'anim' | 'effect') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      ...item,
      dragSource: 'cinema_browser',
      itemType
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="w-full flex min-h-0 bg-[#16121E] select-none overflow-hidden relative">
      {/* ========================================================================= */}
      {/* 1. LEFT SLIM PANEL: Characters & Camera Framing                           */}
      {/* ========================================================================= */}
      <div 
        style={{ width: `${leftWidth}px` }}
        className="shrink-0 flex flex-col border-r border-[#2E2548]/70 bg-[#181324] overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-3">
          {/* Section: Characters */}
          <div className="rounded-xl bg-[#1D172A] border border-[#2E2548]/80 overflow-hidden">
            <button
              onClick={() => setIsCharactersExpanded(!isCharactersExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#221B32] text-left hover:bg-[#28203B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#8C7BFF]" />
                <span className="text-xs font-bold text-[#F8F8FC] tracking-wide">Characters</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8C7BFF]/20 text-[#C4B5FD] font-mono font-semibold">
                  {displayCharacters.length}
                </span>
              </div>
              {isCharactersExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#8A81A6]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#8A81A6]" />
              )}
            </button>

            {isCharactersExpanded && (
              <div className="p-1.5 space-y-1">
                {displayCharacters.map((char) => {
                  const isSelected = activeCharacterId === char.id || selectedEntity?.id === char.id
                  return (
                    <button
                      key={char.id}
                      onClick={() => onSelectCharacter(char.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border border-[#8C7BFF] bg-[#8C7BFF]/20 text-white shadow-sm shadow-[#8C7BFF]/15'
                          : 'border border-transparent bg-[#201A30]/60 hover:bg-[#28203B] text-[#D0CCE0]'
                      }`}
                    >
                      {/* Avatar Thumbnail */}
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-[#8C7BFF] to-[#EC4899] p-[1.5px] shrink-0">
                        <div className="w-full h-full rounded-full bg-[#1A1526] flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {char.name.charAt(0) || 'C'}
                        </div>
                      </div>

                      {/* Character Name */}
                      <span className="text-xs font-semibold truncate flex-1">
                        {char.name}
                      </span>

                      {/* Active indicator dot */}
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8C7BFF] shadow-[0_0_6px_#8C7BFF] shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section: Camera & Framing */}
          <div className="rounded-xl bg-[#1D172A] border border-[#2E2548]/80 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[#221B32]">
              <button
                onClick={() => setIsCameraFramingExpanded(!isCameraFramingExpanded)}
                className="flex items-center gap-2 text-left hover:text-white transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#8C7BFF]" />
                <span className="text-xs font-bold text-[#F8F8FC] tracking-wide">Camera & Framing</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8C7BFF]/20 text-[#C4B5FD] font-mono font-semibold">
                  {cameraShots.length}
                </span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={onSaveCurrentCameraView}
                  title="Capture current view as new camera shot"
                  className="p-1 rounded-md bg-[#2D2344] hover:bg-[#8C7BFF] hover:text-white text-[#A09BB5] transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsCameraFramingExpanded(!isCameraFramingExpanded)}
                  className="p-0.5 text-[#8A81A6] hover:text-white"
                >
                  {isCameraFramingExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {isCameraFramingExpanded && (
              <div className="p-1.5 space-y-1">
                {cameraShots.map((shot, idx) => {
                  const isActive = activeCameraShotId === shot.id
                  const numStr = String(idx + 1).padStart(2, '0')
                  return (
                    <div
                      key={shot.id}
                      onClick={() => onApplyCameraShot(shot)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, shot, 'shot')}
                      className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border border-[#8C7BFF] bg-[#8C7BFF]/20 text-white shadow-sm shadow-[#8C7BFF]/15'
                          : 'border border-transparent bg-[#201A30]/60 hover:bg-[#28203B] text-[#D0CCE0]'
                      }`}
                      title="Click to switch active camera view • Drag to add cut to timeline"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Video className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#8C7BFF]' : 'text-[#8A81A6]'}`} />
                        <span className="text-xs font-semibold truncate">
                          {numStr}. {shot.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-[#8A81A6] px-1 py-0.5 rounded bg-black/30">
                          {shot.fov}°
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8C7BFF] shadow-[0_0_6px_#8C7BFF]" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER PANEL: Clips & Shots Browser                                    */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#16121E] overflow-hidden">
        {/* Top Header with Tabs */}
        <div className="h-11 px-3 border-b border-[#2E2548]/70 flex items-center justify-between shrink-0 bg-[#181324]">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#8C7BFF]" />
            <h2 className="text-xs font-bold text-white tracking-wide">Clips & Shots</h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#1E172E] p-1 rounded-lg border border-[#2E2548]/60">
            {(['all', 'shots', 'animations', 'effects'] as const).map(tab => {
              const label = tab === 'all' 
                ? 'All' 
                : tab === 'shots' 
                  ? 'Camera Shots' 
                  : tab === 'animations' 
                    ? 'Animations' 
                    : 'Effects'
              const isActive = browserFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setBrowserFilter(tab)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#8C7BFF] text-white shadow-sm shadow-[#8C7BFF]/30'
                      : 'text-[#A09BB5] hover:text-white hover:bg-[#28203D]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Thumbnail Cards Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {/* Camera Shots Items */}
            {(browserFilter === 'all' || browserFilter === 'shots') && cameraShots.map((shot, idx) => {
              const num = String(idx + 1).padStart(2, '0')
              const style = SHOT_THUMBNAIL_STYLES[idx % SHOT_THUMBNAIL_STYLES.length]
              return (
                <div
                  key={`shot_card_${shot.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, shot, 'shot')}
                  onClick={() => {
                    onApplyCameraShot(shot)
                    if (onAddCameraShotToTimeline) onAddCameraShotToTimeline(shot)
                  }}
                  className="group relative flex flex-col rounded-xl bg-[#1D172A] border border-[#2E2548] hover:border-[#8C7BFF] transition-all cursor-grab active:cursor-grabbing p-1.5 overflow-hidden hover:shadow-lg hover:shadow-[#8C7BFF]/10"
                  title="Drag onto timeline or click to preview/add"
                >
                  {/* Thumbnail Graphic */}
                  <div className={`relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br ${style.bg} flex flex-col justify-between p-1.5`}>
                    {/* Viewfinder brackets inside card */}
                    <div className="flex justify-between w-full opacity-60">
                      <span className="text-[8px] font-mono text-white/90">┌</span>
                      <span className="text-[8px] font-mono text-white/90">┐</span>
                    </div>

                    {/* Center visual emblem */}
                    <div className="flex items-center justify-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      <span className="text-[9px] font-extrabold text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {style.tag}
                      </span>
                    </div>

                    <div className="flex justify-between items-end w-full">
                      <span className="text-[8px] font-mono text-white/90">└</span>
                      {/* Duration Tag */}
                      <span className="text-[9px] font-mono font-bold bg-black/65 px-1.5 py-0.5 rounded text-white backdrop-blur-sm">
                        00:04
                      </span>
                    </div>
                  </div>

                  {/* Card Title and Details */}
                  <div className="mt-1.5 px-0.5 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-white truncate group-hover:text-[#C4B5FD] transition-colors">
                        Shot {num}
                      </p>
                      <p className="text-[9px] text-[#8A81A6] truncate">
                        {shot.name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onAddCameraShotToTimeline) onAddCameraShotToTimeline(shot)
                      }}
                      title="Add to timeline"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded bg-[#8C7BFF] text-white hover:bg-[#7864FF] transition-all cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Animation Presets Items */}
            {(browserFilter === 'all' || browserFilter === 'animations') && ANIMATION_PRESETS.map((preset, idx) => {
              const num = String(idx + 1).padStart(2, '0')
              const durationSec = Math.round((preset.durationFrames / 24) * 10) / 10
              const durationStr = `00:${String(Math.ceil(durationSec)).padStart(2, '0')}`
              return (
                <div
                  key={`anim_card_${preset.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, preset, 'anim')}
                  onClick={() => {
                    if (onAddClipToTimeline) onAddClipToTimeline(preset)
                  }}
                  className="group relative flex flex-col rounded-xl bg-[#1D172A] border border-[#2E2548] hover:border-[#8C7BFF] transition-all cursor-grab active:cursor-grabbing p-1.5 overflow-hidden hover:shadow-lg hover:shadow-[#8C7BFF]/10"
                  title="Drag onto timeline or click to add clip"
                >
                  {/* Thumbnail Graphic */}
                  <div 
                    style={{
                      background: `linear-gradient(135deg, #181424 0%, ${preset.color}33 50%, ${preset.color}77 100%)`
                    }}
                    className="relative w-full aspect-video rounded-lg overflow-hidden flex flex-col justify-between p-1.5 border border-white/5"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[8px] font-mono uppercase px-1 py-0.5 rounded bg-black/50 text-white/80 font-bold">
                        {preset.category}
                      </span>
                      <Activity className="w-3 h-3 text-white/80" />
                    </div>

                    <div className="flex items-center justify-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider drop-shadow-md">
                        {preset.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex justify-end w-full">
                      <span className="text-[9px] font-mono font-bold bg-black/65 px-1.5 py-0.5 rounded text-white backdrop-blur-sm">
                        {durationStr}
                      </span>
                    </div>
                  </div>

                  {/* Card Title & Info */}
                  <div className="mt-1.5 px-0.5 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-white truncate group-hover:text-[#C4B5FD] transition-colors">
                        Anim_{num}
                      </p>
                      <p className="text-[9px] text-[#8A81A6] truncate">
                        {preset.name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onAddClipToTimeline) onAddClipToTimeline(preset)
                      }}
                      title="Add to timeline"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded bg-[#8C7BFF] text-white hover:bg-[#7864FF] transition-all cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Effects Items */}
            {(browserFilter === 'all' || browserFilter === 'effects') && EFFECT_ITEMS.map((fx) => (
              <div
                key={`effect_card_${fx.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, fx, 'effect')}
                onClick={() => {
                  if (onAddClipToTimeline) onAddClipToTimeline(fx)
                }}
                className="group relative flex flex-col rounded-xl bg-[#1D172A] border border-[#2E2548] hover:border-[#8C7BFF] transition-all cursor-grab active:cursor-grabbing p-1.5 overflow-hidden hover:shadow-lg hover:shadow-[#8C7BFF]/10"
                title="Drag onto timeline or click to add effect"
              >
                <div 
                  style={{
                    background: `linear-gradient(135deg, #100C1C 0%, ${fx.color}44 60%, ${fx.color}88 100%)`
                  }}
                  className="relative w-full aspect-video rounded-lg overflow-hidden flex flex-col justify-between p-1.5 border border-white/5"
                >
                  <div className="flex items-center justify-between w-full">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span className="text-[8px] font-mono uppercase px-1 py-0.5 rounded bg-black/50 text-white/80 font-bold">
                      FX
                    </span>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="text-[9px] font-black text-white uppercase tracking-wider text-center drop-shadow-md">
                      {fx.name}
                    </span>
                  </div>

                  <div className="flex justify-end w-full">
                    <span className="text-[9px] font-mono font-bold bg-black/65 px-1.5 py-0.5 rounded text-white backdrop-blur-sm">
                      {fx.duration}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 px-0.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white truncate group-hover:text-[#C4B5FD] transition-colors">
                      {fx.name}
                    </p>
                    <p className="text-[9px] text-[#8A81A6] truncate">
                      {fx.duration} • Track FX
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onAddClipToTimeline) onAddClipToTimeline(fx)
                    }}
                    title="Add to timeline"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded bg-[#8C7BFF] text-white hover:bg-[#7864FF] transition-all cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT PANEL: Compact 16:9 Live 3D Preview Monitor                      */}
      {/* ========================================================================= */}
      <div
        style={{ width: `${rightWidth}px` }}
        className="shrink-0 flex flex-col border-l border-[#2E2548]/70 bg-[#140F1E] overflow-hidden p-2.5 justify-center items-center"
      >
        {/* Aspect Ratio Box Container */}
        <div className={`relative w-full max-w-full flex flex-col items-center justify-center`}>
          {/* Active 3D Monitor Frame */}
          <div
            className={`relative w-full rounded-xl overflow-hidden bg-black border border-[#2E2548] shadow-2xl flex items-center justify-center ${
              aspectRatio === '16:9'
                ? 'aspect-video'
                : aspectRatio === '9:16'
                  ? 'aspect-[9/16] max-h-[260px]'
                  : aspectRatio === '1:1'
                    ? 'aspect-square max-h-[260px]'
                    : 'aspect-[4/3] max-h-[260px]'
            }`}
          >
            {/* Live 3D Viewport Instance (Three.js live scene) */}
            <div className="absolute inset-0 w-full h-full">
              <VRMViewport3D
                ref={viewportRef}
                vrm={vrm}
                avatarState={avatarState}
                sceneMode={true}
                editorMode="animation"
                sceneCharacters={sceneCharacters}
                sceneProps={sceneProps}
                cameraShots={cameraShots}
                activeCameraShotId={activeCameraShotId}
                isLoadingVRM={isLoadingVRM}
                loadingProgress={loadingProgress}
                hideOverlays={true}
              />
            </div>

            {/* THIN VIOLET CORNER-BRACKET FRAME (#8C7BFF) */}
            <div className="pointer-events-none absolute inset-2.5 z-10 flex flex-col justify-between">
              <div className="flex justify-between w-full">
                <span className="text-sm font-mono text-[#8C7BFF] leading-none select-none filter drop-shadow-[0_0_5px_rgba(140,123,255,0.7)]">
                  ┌
                </span>
                <span className="text-sm font-mono text-[#8C7BFF] leading-none select-none filter drop-shadow-[0_0_5px_rgba(140,123,255,0.7)]">
                  ┐
                </span>
              </div>
              <div className="flex justify-between w-full">
                <span className="text-sm font-mono text-[#8C7BFF] leading-none select-none filter drop-shadow-[0_0_5px_rgba(140,123,255,0.7)]">
                  └
                </span>
                <span className="text-sm font-mono text-[#8C7BFF] leading-none select-none filter drop-shadow-[0_0_5px_rgba(140,123,255,0.7)]">
                  ┘
                </span>
              </div>
            </div>

            {/* Camera Name Tag (Top Left) */}
            <div className="absolute top-2 left-2 z-20 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>
                {activeCameraShotId
                  ? (cameraShots.find(s => s.id === activeCameraShotId)?.name || 'Live Lens')
                  : 'Active Camera'}
              </span>
            </div>
          </div>

          {/* Monitor Overlay Controls Row (Below Monitor Frame) */}
          <div className="w-full mt-2 flex items-center justify-between px-1 text-[#A09BB5]">
            {/* Timecode overlay */}
            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-white bg-[#1E172E] px-2 py-1 rounded-lg border border-[#2E2548]/70">
              <Clock className="w-3 h-3 text-[#8C7BFF]" />
              <span>{currentTimecode}</span>
              <span className="text-[#685F80]">/</span>
              <span className="text-[#A09BB5]">{totalTimecode}</span>
            </div>

            {/* Aspect Ratio Selector & Fullscreen */}
            <div className="flex items-center gap-1.5">
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="bg-[#1E172E] text-white border border-[#2E2548]/70 rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer hover:border-[#8C7BFF] transition-colors"
                title="Viewport Aspect Ratio"
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
              </select>

              <button
                onClick={() => {
                  if (viewportRef.current) {
                    viewportRef.current.resetCamera()
                  }
                }}
                title="Reset Camera View"
                className="p-1.5 rounded-lg bg-[#1E172E] hover:bg-[#8C7BFF] hover:text-white border border-[#2E2548]/70 text-[#A09BB5] transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
