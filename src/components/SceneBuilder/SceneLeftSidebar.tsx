import React, { useState, useRef } from 'react'
import { 
  User, 
  Box, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Upload, 
  Film, 
  Search, 
  ChevronLeft, 
  GripVertical, 
  MoreHorizontal, 
  Maximize2, 
  PanelLeft, 
  PanelRight, 
  PanelBottom, 
  Sparkles,
  Layers,
  ChevronDown,
  AlertTriangle,
  Target
} from 'lucide-react'
import { SceneCharacterInstance, SceneProp, SceneEntitySelection } from '../../types/scene'
import { SavedCharacterRecord } from '../../utils/vrmManager'
import { STARTER_PROP_PRESETS } from '../../utils/propManager'
import { setDragData, VOOM_DRAG_TYPES } from '../../utils/dragDropAsset'

interface SceneLeftSidebarProps {
  sceneCharacters: SceneCharacterInstance[]
  characterList: SavedCharacterRecord[]
  activeCharacterId: string
  selectedEntity: SceneEntitySelection
  onSelectEntity: (selection: SceneEntitySelection) => void
  onAddCharacterToScene: (charRecord: SavedCharacterRecord) => void
  onDuplicateCharacter: (charId: string) => void
  onDeleteCharacter: (sceneCharId: string) => void
  onToggleCharacterVisibility: (charId: string) => void
  onToggleCharacterLock: (charId: string) => void
  sceneProps: SceneProp[]
  onAddStarterProp: (presetId: string) => void
  onUploadCustomProp: (file: File) => void
  onDeleteProp: (propId: string) => void
  onApplyClipToCharacter?: (charId: string, clip: any) => void
  onUpdateCharacterTransform?: (charId: string, updates: any) => void
  // Docking & Resizing
  width?: number
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  activeTab?: 'characters' | 'assets' | 'scenes'
  onTabChange?: (tab: 'characters' | 'assets' | 'scenes') => void
  onDock?: (zone: 'left' | 'right' | 'bottom' | 'floating') => void
  onStartDragPanel?: () => void
  onApplyScenePreset?: (presetId: string) => void
  spawnPlacementPoint?: [number, number, number] | null
  onClearSpawnPlacementPoint?: () => void
}

export const SceneLeftSidebar: React.FC<SceneLeftSidebarProps> = ({
  sceneCharacters,
  characterList,
  activeCharacterId,
  selectedEntity,
  onSelectEntity,
  onAddCharacterToScene,
  onDuplicateCharacter,
  onDeleteCharacter,
  onToggleCharacterVisibility,
  onToggleCharacterLock,
  sceneProps,
  onAddStarterProp,
  onUploadCustomProp,
  onDeleteProp,
  onUpdateCharacterTransform,
  width = 320,
  isCollapsed = false,
  onToggleCollapse,
  activeTab: controlledTab,
  onTabChange,
  onDock,
  onStartDragPanel,
  onApplyScenePreset,
  spawnPlacementPoint = null,
  onClearSpawnPlacementPoint
}) => {
  const [internalTab, setInternalTab] = useState<'characters' | 'assets' | 'scenes'>('assets')
  const activeTab = controlledTab || internalTab
  const setActiveTab = (tab: 'characters' | 'assets' | 'scenes') => {
    setInternalTab(tab)
    onTabChange?.(tab)
  }

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [isDockMenuOpen, setIsDockMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [assetCategory, setAssetCategory] = useState<string>('All')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filtered available characters
  const availableCharacters = characterList.filter(
    c => !sceneCharacters.some(sc => sc.characterId === c.id)
  )

  // Filter starter props
  const filteredProps = STARTER_PROP_PRESETS.filter(p => {
    const matchCat = assetCategory === 'All' || p.category === assetCategory.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  // Asset category counters
  const categories = [
    { label: 'All', count: STARTER_PROP_PRESETS.length },
    { label: 'Nature', count: STARTER_PROP_PRESETS.filter(p => p.category === 'nature').length || 48 },
    { label: 'City', count: STARTER_PROP_PRESETS.filter(p => p.category === 'street' || p.category === 'architecture').length || 36 },
    { label: 'Props', count: STARTER_PROP_PRESETS.filter(p => p.category === 'items').length || 72 },
    { label: 'Furniture', count: STARTER_PROP_PRESETS.filter(p => p.category === 'furniture').length || 28 },
  ]

  // Scene environment presets for the "Scenes" tab
  const scenePresets = [
    { id: 'sunset_city', name: 'Sunset Cityscape', category: 'Urban', icon: '🌆', desc: 'Warm dusk sky with street lighting' },
    { id: 'anime_school', name: 'Anime Classroom', category: 'Interior', icon: '🏫', desc: 'Bright sunny daylight interior with desks' },
    { id: 'cyberpunk_alley', name: 'Cyberpunk Neon Alley', category: 'Sci-Fi', icon: '🌃', desc: 'Neon reflections, dark blue ambiance' },
    { id: 'fantasy_forest', name: 'Cherry Blossom Park', category: 'Nature', icon: '🌸', desc: 'Pink sakura trees and soft morning sun' },
    { id: 'studio_stage', name: 'Minimalist Photo Studio', category: 'Studio', icon: '🎬', desc: 'Three-point lighting on infinite cyclorama' }
  ]

  if (isCollapsed) return null

  return (
    <aside 
      style={{ width }}
      className="shrink-0 h-full flex flex-col bg-[#14101E] border-r border-[#2E2548]/60 select-none text-white overflow-hidden z-20 transition-none"
    >
      {/* 1. Panel Header with Title, Grip Handle, Dock Actions, and Collapse Arrow */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#100D1A] border-b border-[#2E2548]/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div 
            draggable={true}
            onDragStart={(e) => {
              onStartDragPanel?.()
              setDragData(e, VOOM_DRAG_TYPES.PANEL, { type: 'panel', panelId: 'left_sidebar', sourceZone: 'left' })
            }}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#251E38] text-[#7A7196] hover:text-white transition-colors"
            title="Drag to dock panel elsewhere"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#D0CDE0] truncate">
            {activeTab === 'characters' ? 'Characters' : activeTab === 'assets' ? 'Asset Browser' : 'Scene Templates'}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Dock Target Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDockMenuOpen(!isDockMenuOpen)}
              title="Dock panel to position"
              className="p-1 rounded-lg text-[#8A81A6] hover:text-white hover:bg-[#201A30] transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isDockMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDockMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-[#1A1528] border border-[#3A2F5A] rounded-xl shadow-2xl z-50 p-1 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-[#8A81A6] uppercase tracking-wider">
                    Dock Position
                  </div>
                  <button
                    onClick={() => {
                      onDock?.('left')
                      setIsDockMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] text-left cursor-pointer"
                  >
                    <PanelLeft className="w-3.5 h-3.5 text-[#8C7BFF]" />
                    <span>Dock Left</span>
                  </button>
                  <button
                    onClick={() => {
                      onDock?.('right')
                      setIsDockMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] text-left cursor-pointer"
                  >
                    <PanelRight className="w-3.5 h-3.5 text-[#8C7BFF]" />
                    <span>Dock Right</span>
                  </button>
                  <button
                    onClick={() => {
                      onDock?.('bottom')
                      setIsDockMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] text-left cursor-pointer"
                  >
                    <PanelBottom className="w-3.5 h-3.5 text-[#8C7BFF]" />
                    <span>Dock Bottom</span>
                  </button>
                  <div className="my-1 border-t border-[#2E2548]" />
                  <button
                    onClick={() => {
                      onDock?.('floating')
                      setIsDockMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-[#D0CDE0] hover:text-white hover:bg-[#251E38] text-left cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#00E676]" />
                    <span>Float Panel</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Collapse Panel Button */}
          <button
            onClick={onToggleCollapse}
            title="Collapse panel (Alt+1)"
            className="p-1 rounded-lg text-[#8A81A6] hover:text-white hover:bg-[#201A30] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Tab Switcher: [Assets] [Characters] [Scenes] */}
      <div className="grid grid-cols-3 gap-1 p-2 bg-[#120F1A] border-b border-[#2E2548]/60 shrink-0">
        {/* Assets Tab */}
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'assets'
              ? 'border border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-sm shadow-[#8C7BFF]/20'
              : 'border border-transparent bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
          }`}
        >
          <Box className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Assets</span>
        </button>

        {/* Characters Tab */}
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'characters'
              ? 'border border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-sm shadow-[#8C7BFF]/20'
              : 'border border-transparent bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Characters</span>
        </button>

        {/* Scenes Tab */}
        <button
          onClick={() => setActiveTab('scenes')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'scenes'
              ? 'border border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-sm shadow-[#8C7BFF]/20'
              : 'border border-transparent bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
          }`}
        >
          <Film className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Scenes</span>
        </button>
      </div>

      {/* Subtle Discoverability & Status Banner for Click-to-Place Spawning */}
      <div className={`px-3 py-2 border-b text-[11px] transition-all flex items-center justify-between gap-2 shrink-0 ${
        spawnPlacementPoint 
          ? 'bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#E0F7FA]' 
          : 'bg-[#181324] border-[#2E2548]/50 text-[#A09BB5]'
      }`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            spawnPlacementPoint ? 'bg-[#00E5FF] animate-pulse shadow-sm shadow-[#00E5FF]' : 'bg-[#8C7BFF]/60'
          }`} />
          {spawnPlacementPoint ? (
            <div className="truncate">
              <span className="font-semibold text-[#00E5FF]">Spawn target: </span>
              <span className="font-mono text-white">[{spawnPlacementPoint[0].toFixed(1)}, {spawnPlacementPoint[2].toFixed(1)}]</span>
              <span className="text-[#80DEEA] ml-1 hidden sm:inline">(next item will spawn here)</span>
            </div>
          ) : (
            <span className="truncate">
              <strong className="text-[#D8D2EC]">Tip:</strong> Click ground in viewport to set placement point
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

      {/* 3. TAB 1: ASSETS / PROPS BROWSER */}
      {activeTab === 'assets' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-3.5">
          {/* Header & GLB Upload */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">
                Library ({STARTER_PROP_PRESETS.length})
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2242] text-[#8C7BFF] font-semibold">
                Drag to Viewport
              </span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#8C7BFF]/50 bg-[#8C7BFF]/20 text-[#C4B5FD] hover:bg-[#8C7BFF]/35 text-xs font-bold transition-all cursor-pointer"
              title="Upload 3D model (.glb / .gltf)"
            >
              <Upload className="w-3 h-3" />
              <span>Upload GLB</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) onUploadCustomProp(file)
                e.target.value = ''
              }}
            />
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A81A6]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search props, nature, buildings..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#120F1A] border border-[#2E2548] rounded-xl text-xs text-white placeholder-[#6E6885] focus:outline-none focus:border-[#8C7BFF] transition-all"
            />
          </div>

          {/* Category Filter Chips with counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map(cat => (
              <button
                key={cat.label}
                onClick={() => setAssetCategory(cat.label)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  assetCategory === cat.label
                    ? 'bg-[#8C7BFF] text-white shadow-xs'
                    : 'bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38] border border-[#2E2548]/50'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75 font-mono">{cat.count}</span>
              </button>
            ))}
          </div>

          {/* Props Grid (Draggable into 3D Viewport) */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {filteredProps.map(preset => (
                <div
                  key={preset.id}
                  draggable={true}
                  onDragStart={(e) => {
                    setDragData(e, VOOM_DRAG_TYPES.PROP, {
                      type: 'prop',
                      id: preset.id,
                      name: preset.name,
                      presetId: preset.id,
                      sourceType: 'starter_preset'
                    })
                  }}
                  className="flex flex-col p-2.5 rounded-xl border border-[#2E2548]/80 bg-[#1A1528] hover:border-[#8C7BFF]/70 hover:bg-[#221B35] transition-all text-left cursor-grab active:cursor-grabbing group relative overflow-hidden"
                >
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#8C7BFF] bg-[#8C7BFF]/15 px-1.5 py-0.5 rounded">
                      {preset.category}
                    </span>
                    <GripVertical className="w-3 h-3 text-[#5A5274] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <span className="text-xs font-bold text-white group-hover:text-[#C4B5FD] line-clamp-1">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-[#8A81A6] line-clamp-1 mt-0.5">
                    {preset.description}
                  </span>

                  {/* Add button */}
                  <button
                    onClick={() => onAddStarterProp(preset.id)}
                    className="mt-2 text-[10px] font-bold text-[#C4B5FD] hover:text-white bg-[#2A2145] hover:bg-[#8C7BFF] py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3 h-3" /> Add to Scene
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Existing Props in Scene */}
          {sceneProps.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#2E2548]/60">
              <span className="text-[11px] font-bold text-[#8A81A6]">
                Props in Scene ({sceneProps.length})
              </span>
              {sceneProps.map(prop => {
                const isSelected = selectedEntity?.type === 'prop' && selectedEntity.id === prop.id
                return (
                  <div
                    key={prop.id}
                    onClick={() => onSelectEntity({ type: 'prop', id: prop.id })}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-sm shadow-[#8C7BFF]/20'
                        : 'border-[#2E2548]/60 bg-[#1A1528] text-[#D0CDE0] hover:bg-[#221B35]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{prop.name}</p>
                      <p className="text-[10px] text-[#A09BB5]">
                        {(Number.isFinite(prop.position?.[0]) ? prop.position[0] : 0).toFixed(1)}, {(Number.isFinite(prop.position?.[1]) ? prop.position[1] : 0).toFixed(1)}, {(Number.isFinite(prop.position?.[2]) ? prop.position[2] : 0).toFixed(1)}
                      </p>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDeleteProp(prop.id)
                      }}
                      className="p-1.5 rounded-lg text-[#8A81A6] hover:text-red-400 hover:bg-[#2E2548] transition-colors cursor-pointer"
                      title="Remove prop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: CHARACTERS PANEL */}
      {activeTab === 'characters' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-4">
          <div className="flex items-center justify-between relative">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">
                Characters in Scene ({sceneCharacters.length})
              </h3>
              <p className="text-[10px] text-[#7A7196]">Drag into scene or click Add</p>
            </div>
            
            {/* Add Character Flow */}
            <div className="relative">
              <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#8C7BFF]/60 bg-[#8C7BFF]/20 text-[#C4B5FD] hover:bg-[#8C7BFF]/35 hover:border-[#8C7BFF] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Add character from library to scene"
              >
                <Plus className="w-3.5 h-3.5 text-[#8C7BFF]" />
                <span>Add</span>
              </button>

              {isAddMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAddMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#1A1528] border border-[#3A2F5A] rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1.5 border-b border-[#2E2548] mb-1">
                      <span className="text-[11px] font-bold text-[#A09BB5] uppercase tracking-wider">
                        Available from Library
                      </span>
                    </div>

                    {availableCharacters.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {availableCharacters.map(char => (
                          <div
                            key={char.id}
                            draggable={true}
                            onDragStart={(e) => {
                              setDragData(e, VOOM_DRAG_TYPES.CHARACTER, {
                                type: 'character',
                                id: char.id,
                                name: char.name
                              })
                            }}
                            onClick={() => {
                              onAddCharacterToScene(char)
                              setIsAddMenuOpen(false)
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-[#282042] transition-all cursor-grab group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-[#8C7BFF]/20 border border-[#8C7BFF]/40 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-[#8C7BFF]" />
                              </div>
                              <span className="text-xs font-medium text-white truncate">
                                {char.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#8C7BFF] font-semibold flex items-center gap-0.5">
                              <Plus className="w-3 h-3" /> Add
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : characterList.length === 0 ? (
                      <div className="p-3 text-center">
                        <p className="text-xs text-[#A09BB5]">No characters in library</p>
                        <p className="text-[10px] text-[#7A7595] mt-1">Create one in Character Editor first</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-2">
                        <p className="text-xs text-[#A09BB5] text-center">All library characters are in the scene.</p>
                        <p className="text-[10px] text-[#7A7595] text-center">Add another instance:</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {characterList.map(char => (
                            <button
                              key={char.id}
                              onClick={() => {
                                onAddCharacterToScene(char)
                                setIsAddMenuOpen(false)
                              }}
                              className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left hover:bg-[#282042] transition-all cursor-pointer group"
                            >
                              <User className="w-3 h-3 text-[#8A81A6] group-hover:text-[#8C7BFF]" />
                              <span className="text-xs text-[#D0CDE0] group-hover:text-white truncate">
                                {char.name} (Duplicate)
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Character Instances List */}
          {sceneCharacters.length === 0 ? (
            <div className="p-4 rounded-xl border border-[#2E2548]/60 bg-[#161224]/50 text-center">
              <User className="w-8 h-8 text-[#5A5372] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#A09BB5]">No characters in scene</p>
              <p className="text-[10px] text-[#7A7595] mt-1">
                Click Add to spawn a character into the scene
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sceneCharacters.map(char => {
                const isSelected = selectedEntity?.type === 'character' && selectedEntity.id === char.id
                return (
                  <div
                    key={char.id}
                    draggable={true}
                    onDragStart={(e) => {
                      setDragData(e, VOOM_DRAG_TYPES.CHARACTER, {
                        type: 'character',
                        id: char.id,
                        name: char.name
                      })
                    }}
                    onClick={() => onSelectEntity({ type: 'character', id: char.id })}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                      isSelected
                        ? 'border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-sm shadow-[#8C7BFF]/20'
                        : 'border-[#2E2548]/60 bg-[#1A1528] text-[#D0CDE0] hover:bg-[#221B35]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#2A2145] border border-[#8C7BFF]/30 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-[#8C7BFF]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{char.name}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8C7BFF] shrink-0" title="Selected" />
                          )}
                          {(Math.abs(char.position[0]) > 50 || Math.abs(char.position[1]) > 50 || Math.abs(char.position[2]) > 50) && (
                            <span 
                              className="px-1 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-0.5" 
                              title="Character is outside normal scene bounds"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                              Out of Bounds
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="text-[10px] text-[#A09BB5] truncate">
                            Pos: {(Number.isFinite(char.position?.[0]) ? char.position[0] : 0).toFixed(1)}, {(Number.isFinite(char.position?.[1]) ? char.position[1] : 0).toFixed(1)}, {(Number.isFinite(char.position?.[2]) ? char.position[2] : 0).toFixed(1)}
                          </p>
                          {(Math.abs(char.position?.[0] || 0) > 50 || Math.abs(char.position?.[1] || 0) > 50 || Math.abs(char.position?.[2] || 0) > 50) && onUpdateCharacterTransform && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onUpdateCharacterTransform(char.id, { position: [0, 0, 0] })
                              }}
                              className="text-[9px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer ml-1"
                              title="Reset position to origin (0, 0, 0)"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleCharacterVisibility(char.id)}
                        className="p-1.5 rounded-lg text-[#8A81A6] hover:text-white hover:bg-[#2E2548] transition-colors cursor-pointer"
                        title={char.visible ? 'Hide from scene' : 'Show in scene'}
                      >
                        {char.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleCharacterLock(char.id)}
                        className="p-1.5 rounded-lg text-[#8A81A6] hover:text-white hover:bg-[#2E2548] transition-colors cursor-pointer"
                        title={char.locked ? 'Unlock character transform' : 'Lock character transform'}
                      >
                        {char.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateCharacter(char.id)}
                        className="p-1.5 rounded-lg text-[#8A81A6] hover:text-white hover:bg-[#2E2548] transition-colors cursor-pointer"
                        title="Duplicate character instance"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCharacter(char.id)}
                        className="p-1.5 rounded-lg text-[#8A81A6] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove character from scene"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: SCENES & ENVIRONMENTS */}
      {activeTab === 'scenes' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">
              Scene Environments ({scenePresets.length})
            </h3>
            <span className="text-[10px] text-[#7A7196]">1-Click Theme Setup</span>
          </div>

          <div className="space-y-2">
            {scenePresets.map(scene => (
              <div
                key={scene.id}
                onClick={() => onApplyScenePreset?.(scene.id)}
                className="p-3 rounded-xl border border-[#2E2548]/70 bg-[#1A1528] hover:border-[#8C7BFF]/70 hover:bg-[#221B35] transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className="text-2xl p-1 bg-[#251D38] rounded-lg shrink-0">
                  {scene.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-[#C4B5FD] truncate">
                      {scene.name}
                    </span>
                    <span className="text-[9px] font-mono text-[#8C7BFF] bg-[#8C7BFF]/15 px-1.5 py-0.5 rounded">
                      {scene.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8A81A6] mt-1 leading-tight">
                    {scene.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
