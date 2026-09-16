import React, { useRef, useState } from 'react'
import { SceneProp, SceneCharacterInstance, SceneEntitySelection, SceneCameraShot } from '../../types/scene'
import { STARTER_PROP_PRESETS } from '../../utils/propManager'
import { SavedCharacterRecord } from '../../utils/vrmManager'
import { SceneCameraShotsPanel } from '../SceneCameraShotsPanel'
import { 
  Upload, 
  Layers, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  Trash2, 
  Plus, 
  Box, 
  Building, 
  Armchair, 
  BookOpen, 
  Lamp, 
  Trees, 
  Coffee, 
  Package, 
  Sparkles,
  User,
  Users,
  Palette,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Video,
  Camera,
  X,
  Target
} from 'lucide-react'

interface SceneHierarchySidebarProps {
  isOpen?: boolean
  onToggle?: () => void
  defaultTab?: string
  sceneCharacters?: SceneCharacterInstance[]
  sceneProps?: SceneProp[]
  propsList?: SceneProp[]
  selectedEntity?: SceneEntitySelection
  selectedPropId?: string | null
  characterLibrary?: SavedCharacterRecord[]
  cameraShots?: SceneCameraShot[]
  activeCameraShotId?: string | null
  spawnPlacementPoint?: [number, number, number] | null
  onClearSpawnPlacementPoint?: () => void
  onClose?: () => void
  onSaveCurrentCameraView?: (name?: string) => void
  onAddCameraShot?: (name?: string) => void
  onApplyCameraShot?: (shot: SceneCameraShot) => void
  onDeleteCameraShot?: (shotId: string) => void
  onOverwriteCameraShot?: (shotId: string) => void
  onRenameCameraShot?: (shotId: string, newName: string) => void
  onResetToDefaultCameraView?: () => void
  onSelectEntity?: (selection: SceneEntitySelection) => void
  onSelectProp?: (id: string | null) => void
  onAddCharacter?: (templateOrCharId?: string) => void
  onDuplicateCharacter?: (id: string) => void
  onDeleteCharacter?: (id: string) => void
  onToggleCharacterVisibility?: (id: string) => void
  onToggleCharacterLock?: (id: string) => void
  onEditCharacterAppearance?: (sceneCharId: string) => void
  onAddStarterProp?: (presetId: string) => void
  onAddPropFromPreset?: (presetId: string) => void
  onImportGLBProp?: (file: File) => void
  onUploadCustomProp?: (file: File) => void
  onImportGLB?: (file: File) => void
  onToggleVisibility?: (id: string) => void
  onToggleLock?: (id: string) => void
  onDuplicateProp?: (id: string) => void
  onDeleteProp?: (id: string) => void
}

const PRESET_ICONS: Record<string, React.ElementType> = {
  Layers,
  Building,
  Armchair,
  BookOpen,
  Lamp,
  Trees,
  Coffee,
  Package
}

export const SceneHierarchySidebar: React.FC<SceneHierarchySidebarProps> = ({
  sceneCharacters = [],
  sceneProps = [],
  propsList,
  selectedEntity,
  selectedPropId,
  characterLibrary = [],
  cameraShots = [],
  activeCameraShotId = null,
  spawnPlacementPoint = null,
  onClearSpawnPlacementPoint,
  onClose,
  onSaveCurrentCameraView,
  onApplyCameraShot,
  onDeleteCameraShot,
  onOverwriteCameraShot,
  onRenameCameraShot,
  onResetToDefaultCameraView,
  onSelectEntity,
  onSelectProp,
  onAddCharacter,
  onDuplicateCharacter,
  onDeleteCharacter,
  onToggleCharacterVisibility,
  onToggleCharacterLock,
  onEditCharacterAppearance,
  onAddStarterProp,
  onImportGLBProp,
  onImportGLB,
  onToggleVisibility,
  onToggleLock,
  onDuplicateProp,
  onDeleteProp
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'cameras'>('hierarchy')
  const [isDragOver, setIsDragOver] = useState(false)
  const [showAddCharDropdown, setShowAddCharDropdown] = useState(false)

  const activePropsList = sceneProps.length > 0 ? sceneProps : (propsList || [])
  const handleImport = onImportGLBProp || onImportGLB || (() => {})

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImport(file)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      handleImport(file)
    }
  }

  const handleSelect = (type: 'character' | 'prop', id: string) => {
    if (onSelectEntity) {
      onSelectEntity({ type, id })
    }
    if (type === 'prop' && onSelectProp) {
      onSelectProp(id)
    } else if (type === 'character' && onSelectProp) {
      onSelectProp(null)
    }
  }

  const isCharSelected = (id: string) => {
    return selectedEntity?.type === 'character' && selectedEntity.id === id
  }

  const isPropSelected = (id: string) => {
    if (selectedEntity?.type === 'prop' && selectedEntity.id === id) return true
    if (!selectedEntity && selectedPropId === id) return true
    return false
  }

  return (
    <aside className="w-76 bg-[#121218] border-r border-[#1E1E26] flex flex-col h-full select-none shrink-0 z-20 overflow-hidden">
      {/* Hidden File Input for .GLB prop import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="p-3.5 border-b border-[#1E1E26] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              Scene Tree
            </h2>
            <span className="text-[10px] text-[#707080] font-mono">
              {sceneCharacters.length} Characters • {activePropsList.length} Props
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import .GLB or .GLTF Model"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[11px] font-bold shadow-md shadow-[#3B82F6]/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>.GLB</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close Scene Tree"
              className="p-1.5 rounded-lg text-[#808090] hover:text-white hover:bg-[#1E1E28] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Tabs: Scene Objects vs Camera Shots */}
      <div className="flex items-center p-1.5 bg-[#161622] border-b border-[#1E1E26] gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'hierarchy'
              ? 'bg-[#3B82F6] text-white shadow-sm'
              : 'text-[#808090] hover:text-white hover:bg-[#1E1E2C]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Scene Tree</span>
        </button>

        <button
          onClick={() => setActiveTab('cameras')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            activeTab === 'cameras'
              ? 'bg-[#E53935] text-white shadow-sm'
              : 'text-[#808090] hover:text-white hover:bg-[#1E1E2C]'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Camera Shots ({cameraShots.length})</span>
        </button>
      </div>

      {/* Subtle Discoverability & Status Banner for Click-to-Place Spawning */}
      <div className={`px-3 py-2 border-b text-[11px] transition-all flex items-center justify-between gap-2 shrink-0 ${
        spawnPlacementPoint 
          ? 'bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#E0F7FA]' 
          : 'bg-[#15151F] border-[#1E1E26] text-[#808090]'
      }`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            spawnPlacementPoint ? 'bg-[#00E5FF] animate-pulse shadow-sm shadow-[#00E5FF]' : 'bg-[#3B82F6]/60'
          }`} />
          {spawnPlacementPoint ? (
            <div className="truncate">
              <span className="font-semibold text-[#00E5FF]">Spawn target: </span>
              <span className="font-mono text-white">[{spawnPlacementPoint[0].toFixed(1)}, {spawnPlacementPoint[2].toFixed(1)}]</span>
              <span className="text-[#80DEEA] ml-1 hidden sm:inline">(next item will spawn here)</span>
            </div>
          ) : (
            <span className="truncate">
              <strong className="text-[#B0B0C0]">Tip:</strong> Click ground in viewport to set spawn point
            </span>
          )}
        </div>
        {spawnPlacementPoint && onClearSpawnPlacementPoint && (
          <button
            onClick={onClearSpawnPlacementPoint}
            title="Clear target point (Esc)"
            className="text-[#00E5FF] hover:text-white text-[10px] font-bold underline shrink-0 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tab 1: Camera Shots Panel */}
      {activeTab === 'cameras' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <SceneCameraShotsPanel
            cameraShots={cameraShots}
            activeShotId={activeCameraShotId}
            onSaveCurrentView={onSaveCurrentCameraView || (() => {})}
            onApplyCameraShot={onApplyCameraShot || (() => {})}
            onDeleteCameraShot={onDeleteCameraShot || (() => {})}
            onOverwriteCameraShot={onOverwriteCameraShot || (() => {})}
            onRenameCameraShot={onRenameCameraShot || (() => {})}
            onResetToDefaultView={onResetToDefaultCameraView || (() => {})}
          />
        </div>
      ) : (
        /* Tab 2: Scene Objects Tree & Library */
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        
        {/* ================= CHARACTERS IN SCENE ================= */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#D32F2F]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-[#A0A0B0]">
                Characters ({sceneCharacters.length})
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowAddCharDropdown(!showAddCharDropdown)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#D32F2F]/20 hover:bg-[#D32F2F] text-[#FF5252] hover:text-white text-[10px] font-bold transition-all cursor-pointer border border-[#D32F2F]/30"
              >
                <Plus className="w-3 h-3" />
                <span>Add Character</span>
              </button>

              {/* Add Character Dropdown Menu */}
              {showAddCharDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-60 p-2 rounded-xl bg-[#181824] border border-[#2D2D3E] shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#808090] px-2 py-1 mb-1">
                    Spawn into Scene:
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {characterLibrary.map(char => (
                      <button
                        key={char.id}
                        onClick={() => {
                          onAddCharacter?.(char.id)
                          setShowAddCharDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#222232] text-left transition-all cursor-pointer group"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#D32F2F]/20 flex items-center justify-center text-[#D32F2F] text-xs font-bold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate group-hover:text-[#FF5252]">
                            {char.name}
                          </div>
                        </div>
                        <Plus className="w-3 h-3 text-[#707080] group-hover:text-white" />
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 mt-1 border-t border-[#252535]">
                    <button
                      onClick={() => {
                        onAddCharacter?.('new')
                        setShowAddCharDropdown(false)
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Character Instance</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {sceneCharacters.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[#161620] border border-[#20202C] text-center">
              <User className="w-5 h-5 text-[#505060] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#808090]">
                No Characters in Scene
              </p>
              <button
                onClick={() => onAddCharacter?.('new')}
                className="mt-2 text-[10px] text-[#D32F2F] hover:underline font-bold"
              >
                + Add Character
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sceneCharacters.map((char) => {
                const isSelected = isCharSelected(char.id)
                return (
                  <div
                    key={char.id}
                    onClick={() => handleSelect('character', char.id)}
                    className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D32F2F]/15 border-[#D32F2F] shadow-sm'
                        : 'bg-[#161620] hover:bg-[#1A1A26] border-[#22222E]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-[#D32F2F] text-white' 
                          : 'bg-[#222230] text-[#A0A0B0] group-hover:text-white'
                      }`}>
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-[#D0D0E0]'
                          }`}>
                            {char.name}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#707080] font-mono">
                          X:{char.position[0]} Y:{char.position[1]} Z:{char.position[2]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit Character Visuals / Posing Shortcut */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditCharacterAppearance?.(char.id)
                        }}
                        title="Edit Character Hair, Outfit & Pose"
                        className="p-1 rounded text-[#707080] hover:text-[#FF5252] hover:bg-[#D32F2F]/20 transition-all cursor-pointer"
                      >
                        <Palette className="w-3 h-3" />
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleCharacterVisibility?.(char.id)
                        }}
                        title={char.visible ? 'Hide Character' : 'Show Character'}
                        className={`p-1 rounded transition-all cursor-pointer ${
                          char.visible 
                            ? 'text-[#707080] hover:text-white' 
                            : 'text-[#E53935] bg-[#E53935]/15'
                        }`}
                      >
                        {char.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>

                      {/* Lock Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleCharacterLock?.(char.id)
                        }}
                        title={char.locked ? 'Unlock Transform' : 'Lock Transform'}
                        className={`p-1 rounded transition-all cursor-pointer ${
                          char.locked 
                            ? 'text-[#FFA000] bg-[#FFA000]/15' 
                            : 'text-[#707080] hover:text-white'
                        }`}
                      >
                        {char.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>

                      {/* Duplicate Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicateCharacter?.(char.id)
                        }}
                        title="Duplicate Character in Scene"
                        className="p-1 rounded text-[#707080] hover:text-white hover:bg-[#252535] transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      {/* Delete Button (Allowed if more than 1 character) */}
                      {sceneCharacters.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteCharacter?.(char.id)
                          }}
                          title="Remove Character from Scene"
                          className="p-1 rounded text-[#707080] hover:text-[#E53935] hover:bg-[#E53935]/15 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ================= PROPS IN SCENE ================= */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span className="text-[11px] font-black uppercase tracking-wider text-[#A0A0B0]">
                Props & Scenery ({activePropsList.length})
              </span>
            </div>
            {activePropsList.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00E676]/10 text-[#00E676] font-bold">
                Active
              </span>
            )}
          </div>

          {activePropsList.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#161620] border border-[#20202C] text-center">
              <Box className="w-6 h-6 text-[#505060] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#808090]">
                No Props in Scene
              </p>
              <p className="text-[10px] text-[#606070] mt-1">
                Pick a Starter Prop below or drop your own .GLB asset.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activePropsList.map((prop) => {
                const isSelected = isPropSelected(prop.id)
                return (
                  <div
                    key={prop.id}
                    onClick={() => handleSelect('prop', prop.id)}
                    className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#3B82F6]/15 border-[#3B82F6] shadow-sm'
                        : 'bg-[#161620] hover:bg-[#1A1A26] border-[#22222E]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-[#3B82F6] text-white' 
                          : 'bg-[#222230] text-[#A0A0B0] group-hover:text-white'
                      }`}>
                        <Box className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-[#D0D0E0]'
                          }`}>
                            {prop.name}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#707080] font-mono">
                          X:{prop.position[0]} Y:{prop.position[1]} Z:{prop.position[2]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Visibility Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleVisibility?.(prop.id)
                        }}
                        title={prop.visible ? 'Hide Prop' : 'Show Prop'}
                        className={`p-1 rounded transition-all cursor-pointer ${
                          prop.visible 
                            ? 'text-[#707080] hover:text-white' 
                            : 'text-[#E53935] bg-[#E53935]/15'
                        }`}
                      >
                        {prop.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>

                      {/* Lock Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleLock?.(prop.id)
                        }}
                        title={prop.locked ? 'Unlock Transform' : 'Lock Transform'}
                        className={`p-1 rounded transition-all cursor-pointer ${
                          prop.locked 
                            ? 'text-[#FFA000] bg-[#FFA000]/15' 
                            : 'text-[#707080] hover:text-white'
                        }`}
                      >
                        {prop.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>

                      {/* Duplicate Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicateProp?.(prop.id)
                        }}
                        title="Duplicate Prop"
                        className="p-1 rounded text-[#707080] hover:text-white hover:bg-[#252535] transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteProp?.(prop.id)
                        }}
                        title="Delete Prop"
                        className="p-1 rounded text-[#707080] hover:text-[#E53935] hover:bg-[#E53935]/15 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ================= IMPORT DROP ZONE ================= */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-[#3B82F6] bg-[#3B82F6]/15'
              : 'border-[#252532] hover:border-[#3B82F6]/50 bg-[#161620] hover:bg-[#1A1A26]'
          }`}
        >
          <Upload className="w-4 h-4 text-[#3B82F6] mb-1" />
          <span className="text-xs font-bold text-white">
            Upload .GLB Prop
          </span>
          <span className="text-[10px] text-[#707080] mt-0.5">
            Drag & drop static 3D mesh
          </span>
        </div>

        {/* ================= STARTER ASSET LIBRARY ================= */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FFA000]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#A0A0B0]">
              Starter Prop Library
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STARTER_PROP_PRESETS.map((preset) => {
              const IconComp = PRESET_ICONS[preset.icon] || Box
              return (
                <button
                  key={preset.id}
                  onClick={() => onAddStarterProp(preset.id)}
                  title={preset.description}
                  className="flex flex-col items-center text-center p-2.5 rounded-xl bg-[#161620] hover:bg-[#20202E] border border-[#22222E] hover:border-[#3B82F6]/50 transition-all cursor-pointer group hover:scale-[1.02] active:scale-95"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#222230] group-hover:bg-[#3B82F6]/20 flex items-center justify-center text-[#A0A0B0] group-hover:text-[#3B82F6] mb-1.5 transition-colors">
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-white leading-tight">
                    {preset.name}
                  </span>
                  <span className="text-[9px] text-[#707080] capitalize mt-0.5">
                    {preset.category}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

      </div>
      )}
    </aside>
  )
}
