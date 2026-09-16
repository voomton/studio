import React, { useState } from 'react'
import { SceneProp, SceneCharacterInstance, SceneEntitySelection, GizmoMode, GizmoSpace, SceneCameraShot } from '../../types/scene'
import { VRMAvatarState } from '../../utils/vrmManager'
import { 
  Move, 
  RotateCw, 
  Maximize2, 
  Trash2, 
  Copy, 
  Sun, 
  ArrowDownToLine, 
  Sparkles, 
  Box, 
  Check, 
  Lock, 
  Eye, 
  EyeOff, 
  Crosshair, 
  Scaling, 
  RotateCcw,
  User,
  Palette,
  Globe,
  Compass,
  Sliders,
  Layers,
  Image as ImageIcon,
  Camera,
  Video,
  X
} from 'lucide-react'

interface PropTransformSidebarProps {
  selectedEntity?: SceneEntitySelection
  selectedProp?: SceneProp | null
  selectedCharacter?: SceneCharacterInstance | null
  selectedCameraShot?: SceneCameraShot | null
  gizmoMode?: GizmoMode
  gizmoSpace?: GizmoSpace
  avatarState?: VRMAvatarState
  onAvatarStateChange?: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
  onGizmoModeChange?: (mode: GizmoMode) => void
  onGizmoSpaceChange?: (space: GizmoSpace) => void
  onUpdateProp?: (updates: Partial<SceneProp>) => void
  onUpdateCharacter?: (updates: Partial<SceneCharacterInstance>) => void
  onUpdateCameraPosition?: (shotId: string, position: [number, number, number]) => void
  onApplyCameraShot?: (shot: SceneCameraShot) => void
  onDeleteCameraShot?: (shotId: string) => void
  onAutoFitScale?: () => void
  onDuplicateProp?: () => void
  onDuplicateCharacter?: () => void
  onDeleteProp?: () => void
  onDeleteCharacter?: () => void
  onEditCharacterAppearance?: (sceneCharId: string) => void
  onFocusEntity?: () => void
  onDeselect?: () => void
}

export const PropTransformSidebar: React.FC<PropTransformSidebarProps> = ({
  selectedEntity,
  selectedProp,
  selectedCharacter,
  selectedCameraShot,
  gizmoMode = 'translate',
  gizmoSpace = 'world',
  avatarState,
  onAvatarStateChange,
  onGizmoModeChange,
  onGizmoSpaceChange,
  onUpdateProp,
  onUpdateCharacter,
  onUpdateCameraPosition,
  onApplyCameraShot,
  onDeleteCameraShot,
  onAutoFitScale,
  onDuplicateProp,
  onDuplicateCharacter,
  onDeleteProp,
  onDeleteCharacter,
  onEditCharacterAppearance,
  onFocusEntity,
  onDeselect
}) => {
  const [uniformScale, setUniformScale] = useState(true)

  const isCamera = selectedEntity?.type === 'camera' || Boolean(selectedCameraShot)
  const isCharacter = !isCamera && (selectedEntity?.type === 'character' || Boolean(selectedCharacter))
  const isProp = !isCamera && (selectedEntity?.type === 'prop' || (Boolean(selectedProp) && !selectedCharacter))

  const entity = isCamera ? selectedCameraShot : (isCharacter ? selectedCharacter : selectedProp)

  if (isCamera && selectedCameraShot) {
    const cam = selectedCameraShot
    return (
      <aside className="w-full bg-[#121218] border-l border-[#1E1E26] flex flex-col h-full select-none z-20 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-[#1E1E26] bg-[#14141C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#E53935]/20 border border-[#E53935]/40 flex items-center justify-center text-[#E53935]">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                Camera Shot Inspector
              </h2>
              <span className="text-[10px] text-[#A0A0B0] truncate max-w-[140px] block">
                {cam.name}
              </span>
            </div>
          </div>
          {onDeselect && (
            <button
              onClick={onDeselect}
              title="Deselect (Esc)"
              className="p-1 rounded-lg text-[#808090] hover:text-white hover:bg-[#1E1E28] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
          {/* Quick Info */}
          <div className="p-3 rounded-xl bg-[#181824] border border-[#262638] flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E53935]/15 border border-[#E53935]/30 flex items-center justify-center text-[#E53935] shrink-0 mt-0.5">
              <Video className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                3D Physical Camera
              </span>
              <p className="text-[10px] text-[#808095] mt-0.5 leading-relaxed">
                Drag the red camera gizmo in the 3D viewport to reposition this shot. The live PiP monitor previews the exact viewpoint in real time.
              </p>
            </div>
          </div>

          {/* Position Coordinates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-[#E53935]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  Camera Position
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#707080]">Meters</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                <div key={axis} className="bg-[#161620] border border-[#22222E] rounded-xl p-2 focus-within:border-[#E53935]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[#EF5350]">{axis}</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={cam.position[i]}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      const newPos: [number, number, number] = [cam.position[0], cam.position[1], cam.position[2]]
                      newPos[i] = Number(val.toFixed(2))
                      onUpdateCameraPosition?.(cam.id, newPos)
                    }}
                    className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Target LookAt Coordinates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  Look-At Target
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#707080]">Meters</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                <div key={axis} className="bg-[#161620] border border-[#22222E] rounded-xl p-2 opacity-80">
                  <span className="text-[10px] font-bold text-[#60A5FA] block mb-1">{axis}</span>
                  <span className="text-white font-mono text-xs block">{cam.target[i].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lens FOV */}
          <div className="space-y-2 pt-2 border-t border-[#1E1E26]">
            <div className="flex justify-between text-xs font-bold text-[#A0A0B0]">
              <span>Field of View (FOV)</span>
              <span className="font-mono text-white">{cam.fov}°</span>
            </div>
            <div className="h-1.5 bg-[#252535] rounded-lg overflow-hidden">
              <div 
                className="h-full bg-[#E53935]" 
                style={{ width: `${Math.min(100, Math.max(10, ((cam.fov - 15) / 75) * 100))}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-[#1E1E26] space-y-2">
            <button
              onClick={() => onApplyCameraShot?.(cam)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs font-bold shadow-lg shadow-[#E53935]/25 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Switch View to this Camera</span>
            </button>

            {onDeleteCameraShot && (
              <button
                onClick={() => onDeleteCameraShot(cam.id)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935] text-[#EF5350] hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Shot</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    )
  }

  if (!entity) {
    return (
      <aside className="w-full bg-[#121218] border-l border-[#1E1E26] flex flex-col h-full select-none z-20 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-[#1E1E26] bg-[#14141C]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#3B82F6]" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                Scene Environment & Lighting
              </h2>
              <p className="text-[10px] text-[#707080]">
                Global studio backdrop, lights & shadows
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
          {/* Quick Selection Prompt Card */}
          <div className="p-3 rounded-xl bg-[#161620] border border-[#22222E] flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0 mt-0.5">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                No Object Selected
              </span>
              <p className="text-[11px] text-[#808095] mt-0.5 leading-relaxed">
                Click any character or prop in the 3D viewport or the left hierarchy to inspect, move, rotate, and scale.
              </p>
            </div>
          </div>

          {/* Backdrop Presets */}
          {avatarState && onAvatarStateChange && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  Studio Backdrop
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'dark', label: 'Dark Studio', color: '#0A0A0C' },
                  { id: 'studio', label: 'Studio Grey', color: '#1E1E24' },
                  { id: 'manga', label: 'Manga White', color: '#FFFFFF', textDark: true },
                  { id: 'cyberpunk', label: 'Cyber Magenta', color: '#1A0B2E' }
                ].map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => onAvatarStateChange(prev => ({ ...prev, backdrop: bg.id as any }))}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer text-left ${
                      avatarState.backdrop === bg.id
                        ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-white shadow-sm'
                        : 'border-[#22222E] bg-[#161620] text-[#A0A0B0] hover:bg-[#1C1C28]'
                    }`}
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: bg.color }}
                    />
                    <span className="text-xs font-bold truncate">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Studio Lighting */}
          {avatarState && onAvatarStateChange && (
            <div className="space-y-3 pt-2 border-t border-[#1E1E26]">
              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#FFA000]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  Stage Lighting Intensities
                </span>
              </div>

              {/* Key Light */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#A0A0B0]">
                  <span>Key Light</span>
                  <span className="font-mono text-white">{avatarState.lighting.keyLightIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3.0}
                  step={0.1}
                  value={avatarState.lighting.keyLightIntensity}
                  onChange={e => {
                    const val = parseFloat(e.target.value)
                    onAvatarStateChange(prev => ({
                      ...prev,
                      lighting: { ...prev.lighting, keyLightIntensity: val }
                    }))
                  }}
                  className="w-full accent-[#FFA000] h-1.5 bg-[#252535] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Fill Light */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#A0A0B0]">
                  <span>Fill Light</span>
                  <span className="font-mono text-white">{avatarState.lighting.fillLightIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2.0}
                  step={0.1}
                  value={avatarState.lighting.fillLightIntensity}
                  onChange={e => {
                    const val = parseFloat(e.target.value)
                    onAvatarStateChange(prev => ({
                      ...prev,
                      lighting: { ...prev.lighting, fillLightIntensity: val }
                    }))
                  }}
                  className="w-full accent-[#3B82F6] h-1.5 bg-[#252535] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Ambient Light */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#A0A0B0]">
                  <span>Ambient Glow</span>
                  <span className="font-mono text-white">{avatarState.lighting.ambientIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2.0}
                  step={0.1}
                  value={avatarState.lighting.ambientIntensity}
                  onChange={e => {
                    const val = parseFloat(e.target.value)
                    onAvatarStateChange(prev => ({
                      ...prev,
                      lighting: { ...prev.lighting, ambientIntensity: val }
                    }))
                  }}
                  className="w-full accent-[#00E676] h-1.5 bg-[#252535] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Rim Light */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#A0A0B0]">
                  <span>Rim Outline Light</span>
                  <span className="font-mono text-white">{avatarState.lighting.rimLightIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3.0}
                  step={0.1}
                  value={avatarState.lighting.rimLightIntensity}
                  onChange={e => {
                    const val = parseFloat(e.target.value)
                    onAvatarStateChange(prev => ({
                      ...prev,
                      lighting: { ...prev.lighting, rimLightIntensity: val }
                    }))
                  }}
                  className="w-full accent-[#FF4081] h-1.5 bg-[#252535] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    )
  }

  const position: [number, number, number] = (entity as any).position || [0, 0, 0]
  const rotation: [number, number, number] = (entity as any).rotation || [0, 0, 0]
  const scale: [number, number, number] = (entity as any).scale || [1, 1, 1]
  const locked = (entity as any).locked || false
  const visible = (entity as any).visible !== false
  const castShadow = (entity as any).castShadow !== false

  const handlePosChange = (axis: 0 | 1 | 2, val: number) => {
    if (locked) return
    const newPos: [number, number, number] = [position[0], position[1], position[2]]
    newPos[axis] = Number(val.toFixed(2))
    if (isCharacter) {
      onUpdateCharacter?.({ position: newPos })
    } else {
      onUpdateProp?.({ position: newPos })
    }
  }

  const handleRotChange = (axis: 0 | 1 | 2, val: number) => {
    if (locked) return
    const newRot: [number, number, number] = [rotation[0], rotation[1], rotation[2]]
    newRot[axis] = Math.round(val)
    if (isCharacter) {
      onUpdateCharacter?.({ rotation: newRot })
    } else {
      onUpdateProp?.({ rotation: newRot })
    }
  }

  const handleScaleChange = (axis: 0 | 1 | 2, val: number) => {
    if (locked) return
    const clampedVal = Math.max(0.01, Number(val.toFixed(2)))
    if (uniformScale) {
      const newScale: [number, number, number] = [clampedVal, clampedVal, clampedVal]
      if (isCharacter) {
        onUpdateCharacter?.({ scale: newScale })
      } else {
        onUpdateProp?.({ scale: newScale })
      }
    } else {
      const newScale: [number, number, number] = [scale[0], scale[1], scale[2]]
      newScale[axis] = clampedVal
      if (isCharacter) {
        onUpdateCharacter?.({ scale: newScale })
      } else {
        onUpdateProp?.({ scale: newScale })
      }
    }
  }

  const handleSnapToFloor = () => {
    if (locked) return
    handlePosChange(1, 0)
  }

  const handleCenterOrigin = () => {
    if (locked) return
    if (isCharacter) {
      onUpdateCharacter?.({ position: [0, 0, 0] })
    } else {
      onUpdateProp?.({ position: [0, 0, 0] })
    }
  }

  const handleResetRotation = () => {
    if (locked) return
    if (isCharacter) {
      onUpdateCharacter?.({ rotation: [0, 0, 0] })
    } else {
      onUpdateProp?.({ rotation: [0, 0, 0] })
    }
  }

  const handleResetScale = () => {
    if (locked) return
    if (isCharacter) {
      onUpdateCharacter?.({ scale: [1, 1, 1] })
    } else {
      onUpdateProp?.({ scale: [1, 1, 1] })
    }
  }

  return (
    <aside className="w-full bg-[#121218] border-l border-[#1E1E26] flex flex-col h-full select-none z-20 overflow-hidden">
      {/* Header & Entity Tag */}
      <div className="p-3.5 border-b border-[#1E1E26] bg-[#14141C]">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
            isCharacter 
              ? 'bg-[#D32F2F]/20 text-[#FF5252] border-[#D32F2F]/30' 
              : 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30'
          }`}>
            {isCharacter ? '👤 Character Entity' : (selectedProp?.sourceType === 'custom_upload' ? '📦 .GLB Model' : '🏛️ Starter Prop')}
          </span>

          <div className="flex items-center gap-1">
            {isCharacter && (
              <button
                onClick={() => onEditCharacterAppearance?.(entity.id)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[10px] font-bold transition-all cursor-pointer shadow-sm"
              >
                <Palette className="w-3 h-3" />
                <span>Style / Pose</span>
              </button>
            )}

            <button
              onClick={() => {
                if (isCharacter) {
                  onUpdateCharacter?.({ visible: !visible })
                } else {
                  onUpdateProp?.({ visible: !visible })
                }
              }}
              title={visible ? 'Hide Object' : 'Show Object'}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                visible ? 'text-[#808090] hover:text-white hover:bg-[#20202C]' : 'text-[#E53935] bg-[#E53935]/15'
              }`}
            >
              {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                if (isCharacter) {
                  onUpdateCharacter?.({ locked: !locked })
                } else {
                  onUpdateProp?.({ locked: !locked })
                }
              }}
              title={locked ? 'Unlock Transform' : 'Lock Transform'}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                locked ? 'text-[#FFA000] bg-[#FFA000]/15' : 'text-[#808090] hover:text-white hover:bg-[#20202C]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

            {onDeselect && (
              <button
                onClick={onDeselect}
                title="Deselect Entity (Esc)"
                className="p-1.5 rounded text-[#808090] hover:text-white hover:bg-[#20202C] transition-all cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Entity Display Name */}
        <input
          type="text"
          value={entity.name}
          onChange={(e) => {
            if (isCharacter) {
              onUpdateCharacter?.({ name: e.target.value })
            } else {
              onUpdateProp?.({ name: e.target.value })
            }
          }}
          className="w-full bg-[#181822] border border-[#252535] focus:border-[#3B82F6] rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none transition-colors"
        />
      </div>

      {/* Viewport Gizmo Mode Switcher Toolbar */}
      <div className="p-3 border-b border-[#1E1E26] bg-[#101016]">
        <div className="text-[10px] font-black uppercase tracking-wider text-[#707080] mb-2 flex items-center justify-between">
          <span>Viewport Transform Gizmo</span>
          <span className="text-[9px] text-[#505060] font-mono">Keys: W, E, R</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onGizmoModeChange?.('translate')}
            title="Translate / Move Handle (Shortcut: W)"
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
              gizmoMode === 'translate'
                ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-[#3B82F6]/30'
                : 'bg-[#181824] hover:bg-[#202030] text-[#A0A0B0] border-[#222230]'
            }`}
          >
            <Move className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-bold">Move [W]</span>
          </button>

          <button
            onClick={() => onGizmoModeChange?.('rotate')}
            title="Rotate Handle (Shortcut: E)"
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
              gizmoMode === 'rotate'
                ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-[#3B82F6]/30'
                : 'bg-[#181824] hover:bg-[#202030] text-[#A0A0B0] border-[#222230]'
            }`}
          >
            <RotateCw className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-bold">Rotate [E]</span>
          </button>

          <button
            onClick={() => onGizmoModeChange?.('scale')}
            title="Scale Handle (Shortcut: R)"
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
              gizmoMode === 'scale'
                ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-md shadow-[#3B82F6]/30'
                : 'bg-[#181824] hover:bg-[#202030] text-[#A0A0B0] border-[#222230]'
            }`}
          >
            <Maximize2 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-bold">Scale [R]</span>
          </button>

          <button
            onClick={() => onGizmoSpaceChange?.(gizmoSpace === 'world' ? 'local' : 'world')}
            title="Toggle Coordinate Space (Shortcut: Q)"
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#181824] hover:bg-[#202030] text-[#A0A0B0] hover:text-white border border-[#222230] transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 mb-0.5 text-[#3B82F6]" />
            <span className="text-[10px] font-bold capitalize">{gizmoSpace}</span>
          </button>
        </div>
      </div>

      {/* Precision Sliders & Number Inputs */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
        {locked && (
          <div className="p-2.5 rounded-xl bg-[#FFA000]/10 border border-[#FFA000]/30 flex items-center gap-2 text-[#FFA000] text-xs">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Transform is locked. Unlock to modify in viewport.</span>
          </div>
        )}

        {/* 1. POSITION CONTROLS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                Position (Meters)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleSnapToFloor}
                disabled={locked}
                title="Snap object directly to ground floor (Y = 0)"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#20202E] hover:bg-[#2B2B3E] text-[#3B82F6] text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <ArrowDownToLine className="w-3 h-3" />
                <span>Snap Floor</span>
              </button>
              <button
                onClick={handleCenterOrigin}
                disabled={locked}
                title="Center at Scene Origin (0, Y, 0)"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#20202E] hover:bg-[#2B2B3E] text-[#A0A0B0] text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Crosshair className="w-3 h-3" />
                <span>Center</span>
              </button>
            </div>
          </div>

          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <div key={axis} className="flex items-center gap-2">
              <span className={`w-4 text-xs font-black ${
                axis === 'X' ? 'text-[#EF5350]' : axis === 'Y' ? 'text-[#66BB6A]' : 'text-[#42A5F5]'
              }`}>
                {axis}
              </span>
              <input
                type="range"
                min={axis === 'Y' ? -2 : -10}
                max={axis === 'Y' ? 8 : 10}
                step={0.05}
                value={position[i]}
                disabled={locked}
                onChange={(e) => handlePosChange(i as 0 | 1 | 2, parseFloat(e.target.value))}
                className="flex-1 accent-[#3B82F6] h-1.5 bg-[#252535] rounded-lg appearance-none cursor-pointer disabled:opacity-40"
              />
              <input
                type="number"
                step={0.05}
                value={position[i]}
                disabled={locked}
                onChange={(e) => handlePosChange(i as 0 | 1 | 2, parseFloat(e.target.value) || 0)}
                className="w-16 bg-[#181822] border border-[#252535] rounded px-1.5 py-0.5 text-right text-xs font-mono text-white focus:outline-none focus:border-[#3B82F6] disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        {/* 2. ROTATION CONTROLS */}
        <div className="space-y-2 pt-2 border-t border-[#1E1E26]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                Rotation (Degrees)
              </span>
            </div>
            <button
              onClick={handleResetRotation}
              disabled={locked}
              title="Reset Rotation to 0"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#20202E] hover:bg-[#2B2B3E] text-[#A0A0B0] text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {(['Pitch X', 'Yaw Y', 'Roll Z'] as const).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-14 text-[11px] font-bold text-[#A0A0B0] truncate">
                {label}
              </span>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation[i]}
                disabled={locked}
                onChange={(e) => handleRotChange(i as 0 | 1 | 2, parseFloat(e.target.value))}
                className="flex-1 accent-[#3B82F6] h-1.5 bg-[#252535] rounded-lg appearance-none cursor-pointer disabled:opacity-40"
              />
              <input
                type="number"
                step={1}
                value={rotation[i]}
                disabled={locked}
                onChange={(e) => handleRotChange(i as 0 | 1 | 2, parseFloat(e.target.value) || 0)}
                className="w-16 bg-[#181822] border border-[#252535] rounded px-1.5 py-0.5 text-right text-xs font-mono text-white focus:outline-none focus:border-[#3B82F6] disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        {/* 3. SCALE CONTROLS */}
        <div className="space-y-2 pt-2 border-t border-[#1E1E26]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                Scale
              </span>
            </div>

            <div className="flex items-center gap-1">
              {!isCharacter && onAutoFitScale && (
                <button
                  onClick={onAutoFitScale}
                  disabled={locked}
                  title="Auto-calculate proportional scale matching humanoid character height"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#3B82F6]/20 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Fit</span>
                </button>
              )}
              <button
                onClick={handleResetScale}
                disabled={locked}
                title="Reset Scale to 1.0"
                className="px-1.5 py-0.5 rounded bg-[#20202E] hover:bg-[#2B2B3E] text-[#A0A0B0] text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                1.0x
              </button>
              <button
                onClick={() => setUniformScale(!uniformScale)}
                title={uniformScale ? 'Uniform Scale Locked' : 'Independent Axis Scale'}
                className={`p-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  uniformScale ? 'bg-[#3B82F6] text-white' : 'bg-[#20202E] text-[#A0A0B0]'
                }`}
              >
                <Scaling className="w-3 h-3" />
              </button>
            </div>
          </div>

          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <div key={axis} className="flex items-center gap-2">
              <span className={`w-4 text-xs font-black ${
                axis === 'X' ? 'text-[#EF5350]' : axis === 'Y' ? 'text-[#66BB6A]' : 'text-[#42A5F5]'
              }`}>
                {axis}
              </span>
              <input
                type="range"
                min={0.05}
                max={5.0}
                step={0.05}
                value={scale[i]}
                disabled={locked}
                onChange={(e) => handleScaleChange(i as 0 | 1 | 2, parseFloat(e.target.value))}
                className="flex-1 accent-[#3B82F6] h-1.5 bg-[#252535] rounded-lg appearance-none cursor-pointer disabled:opacity-40"
              />
              <input
                type="number"
                step={0.05}
                min={0.01}
                value={scale[i]}
                disabled={locked}
                onChange={(e) => handleScaleChange(i as 0 | 1 | 2, parseFloat(e.target.value) || 1)}
                className="w-16 bg-[#181822] border border-[#252535] rounded px-1.5 py-0.5 text-right text-xs font-mono text-white focus:outline-none focus:border-[#3B82F6] disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        {/* 4. LIGHTING & SHADOWS */}
        <div className="pt-2 border-t border-[#1E1E26]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#161620] border border-[#22222E]">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#FFA000]" />
              <span className="text-xs font-bold text-white">
                Cast Ground Shadow
              </span>
            </div>
            <button
              onClick={() => {
                if (isCharacter) {
                  onUpdateCharacter?.({ castShadow: !castShadow })
                } else {
                  onUpdateProp?.({ castShadow: !castShadow })
                }
              }}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                castShadow ? 'bg-[#3B82F6]' : 'bg-[#2B2B38]'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                  castShadow ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 5. ACTION BUTTONS (Duplicate, Delete) */}
        <div className="pt-2 border-t border-[#1E1E26] space-y-2">
          <button
            onClick={() => {
              if (isCharacter) {
                onDuplicateCharacter?.()
              } else {
                onDuplicateProp?.()
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#20202E] hover:bg-[#2A2A3E] text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate {isCharacter ? 'Character' : 'Prop'}</span>
          </button>

          <button
            onClick={() => {
              if (isCharacter) {
                onDeleteCharacter?.()
              } else {
                onDeleteProp?.()
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935] text-[#EF5350] hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete {isCharacter ? 'Character' : 'Prop'}</span>
          </button>
        </div>

      </div>
    </aside>
  )
}
