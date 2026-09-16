import React, { useState } from 'react'
import { 
  Camera, 
  GitFork, 
  Lightbulb, 
  Activity, 
  MoreHorizontal, 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  RefreshCw, 
  Sliders, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Sun, 
  Wind, 
  Sparkles,
  Layers,
  Settings,
  Search,
  PanelLeft,
  PanelRight,
  PanelBottom,
  User,
  Box,
  Compass,
  AlertTriangle,
  Maximize2,
  Minus,
  RotateCcw
} from 'lucide-react'
import { SceneCameraShot, SceneCharacterInstance, SceneProp, SceneEntitySelection } from '../../types/scene'
import { VRMAvatarState } from '../../utils/vrmManager'
import { setDragData, VOOM_DRAG_TYPES } from '../../utils/dragDropAsset'

interface SceneRightSidebarProps {
  cameraShots: SceneCameraShot[]
  activeShotId: string | null
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onSaveCurrentCameraView: (name?: string) => void
  onDeleteCameraShot: (shotId: string) => void
  onOverwriteCameraShot: (shotId: string) => void
  onRenameCameraShot: (shotId: string, newName: string) => void
  onUpdateCameraPosition: (shotId: string, newPosition: [number, number, number]) => void
  onAddCamera?: () => void
  onUpdateCameraShot?: (shotId: string, updates: Partial<SceneCameraShot>) => void
  sceneCharacters: SceneCharacterInstance[]
  sceneProps: SceneProp[]
  selectedEntity: SceneEntitySelection
  onSelectEntity: (selection: SceneEntitySelection) => void
  avatarState: VRMAvatarState | null
  onAvatarStateChange?: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
  // Entity updates
  onUpdateCharacterTransform?: (id: string, updates: any) => void
  onUpdatePropTransform?: (id: string, updates: any) => void
  onToggleCharacterVisibility?: (id: string) => void
  onToggleCharacterLock?: (id: string) => void
  onDeleteCharacter?: (id: string) => void
  onDeleteProp?: (id: string) => void
  onClearScene?: () => void
  // Docking & Resizing
  width?: number
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  activeTab?: RightSidebarTab
  onTabChange?: (tab: RightSidebarTab) => void
  onDock?: (zone: 'left' | 'right' | 'bottom' | 'floating') => void
  onStartDragPanel?: () => void
}

export type RightSidebarTab = 'scene_tree' | 'properties' | 'camera' | 'lights' | 'effects' | 'physics'

export const DEFAULT_SCENE_SHOTS: SceneCameraShot[] = [
  { id: 'shot_01_master_wide', name: 'Master Wide', position: [0, 1.8, 4.2], target: [0, 0.9, 0], fov: 60, description: 'Master wide establishing angle', createdAt: 1 },
  { id: 'shot_02_hero_closeup', name: 'Hero Close-Up', position: [0.15, 1.45, 1.1], target: [0, 1.35, 0], fov: 35, description: 'Tight character facial emotion angle', createdAt: 2 },
  { id: 'shot_03_over_shoulder', name: 'Over the Shoulder', position: [-0.65, 1.4, 1.6], target: [0.35, 1.2, 0.1], fov: 45, description: 'Classic dialogue over-shoulder angle', createdAt: 3 },
  { id: 'shot_04_side_profile', name: 'Side Profile', position: [2.2, 1.35, 0.2], target: [0, 1.2, 0], fov: 50, description: 'Anime side profile framing', createdAt: 4 },
  { id: 'shot_05_low_angle', name: 'Low Angle Shot', position: [-1.2, 0.45, 2.0], target: [0, 1.2, 0], fov: 55, description: 'Heroic upward tilt perspective', createdAt: 5 },
  { id: 'shot_06_top_down', name: 'Top Down', position: [0.2, 3.8, 1.5], target: [0, 0.5, 0], fov: 70, description: 'High overhead overview angle', createdAt: 6 },
  { id: 'shot_07_dynamic_action', name: 'Dynamic Action', position: [1.8, 0.7, 2.4], target: [-0.2, 1.0, 0], fov: 48, description: 'Three-quarter dynamic perspective', createdAt: 7 },
  { id: 'shot_08_wide_environ', name: 'Wide Environmental', position: [-2.5, 2.2, 4.8], target: [0, 1.0, 0], fov: 65, description: 'Anime establishing environmental depth', createdAt: 8 },
  { id: 'shot_09_low_dutch', name: 'Low Dutch Angle', position: [1.1, 0.3, 1.8], target: [0, 1.1, 0], fov: 42, description: 'Dramatic canted camera tilt', createdAt: 9 },
  { id: 'shot_10_detail_shot', name: 'Detail Shot', position: [0.35, 0.95, 0.9], target: [0.1, 0.9, 0], fov: 50, description: 'Props and outfit detail focal length', createdAt: 10 }
]

const ShotThumbnail: React.FC<{ index: number; name: string }> = ({ index }) => {
  const gradients = [
    'from-[#5B47B2] to-[#8C7BFF]',
    'from-[#EC4899] to-[#8C7BFF]',
    'from-[#3B82F6] to-[#8C7BFF]',
    'from-[#10B981] to-[#3B82F6]',
    'from-[#F59E0B] to-[#EC4899]'
  ]
  const grad = gradients[index % gradients.length]
  return (
    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} p-0.5 shrink-0 flex items-center justify-center shadow-xs overflow-hidden`}>
      <div className="w-full h-full bg-[#1A1528]/80 rounded-[6px] flex items-center justify-center">
        <Camera className="w-3.5 h-3.5 text-white/90" />
      </div>
    </div>
  )
}

export const SceneRightSidebar: React.FC<SceneRightSidebarProps> = ({
  cameraShots,
  activeShotId,
  onApplyCameraShot,
  onSaveCurrentCameraView,
  onDeleteCameraShot,
  onOverwriteCameraShot,
  onRenameCameraShot,
  onUpdateCameraPosition,
  onAddCamera,
  onUpdateCameraShot,
  sceneCharacters,
  sceneProps,
  selectedEntity,
  onSelectEntity,
  avatarState,
  onAvatarStateChange,
  onUpdateCharacterTransform,
  onUpdatePropTransform,
  onToggleCharacterVisibility,
  onToggleCharacterLock,
  onDeleteCharacter,
  onDeleteProp,
  onClearScene,
  width = 340,
  isCollapsed = false,
  onToggleCollapse,
  activeTab: controlledTab,
  onTabChange,
  onDock,
  onStartDragPanel
}) => {
  const [internalTab, setInternalTab] = useState<RightSidebarTab>('scene_tree')
  const activeTab = controlledTab || internalTab
  const setActiveTab = (tab: RightSidebarTab) => {
    setInternalTab(tab)
    onTabChange?.(tab)
  }

  const [isExpandedView, setIsExpandedView] = useState(false)
  const [isDockMenuOpen, setIsDockMenuOpen] = useState(false)
  const [treeSearchQuery, setTreeSearchQuery] = useState('')
  const [selectedShotId, setSelectedShotId] = useState<string>('shot_02_hero_closeup')
  const [showIndividualAxes, setShowIndividualAxes] = useState(false)

  // Selected object data
  const selectedCharacter = selectedEntity?.type === 'character' 
    ? sceneCharacters.find(c => c.id === selectedEntity.id)
    : null

  const selectedProp = selectedEntity?.type === 'prop'
    ? sceneProps.find(p => p.id === selectedEntity.id)
    : null

  const selectedCamera = selectedEntity?.type === 'camera'
    ? (cameraShots.find(c => c.id === selectedEntity.id) || null)
    : null

  const allShots = React.useMemo(() => {
    const combined = [...DEFAULT_SCENE_SHOTS]
    cameraShots.forEach(s => {
      if (!combined.some(p => p.id === s.id)) {
        combined.push(s)
      }
    })
    return combined
  }, [cameraShots])

  const effectiveActiveId = activeShotId || selectedShotId

  // Collapsed vertical icon strip
  if (isCollapsed) {
    return (
      <aside className="w-12 shrink-0 h-full bg-[#120F1A] border-l border-[#241C36] flex flex-col items-center py-2 z-20 select-none">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9A94AF] hover:text-white hover:bg-[#1F192F] transition-all cursor-pointer mb-2"
          title="Expand Right Panel (Alt+2)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="w-full flex flex-col items-center gap-2 px-1">
          {[
            { id: 'scene_tree' as const, label: 'Hierarchy', icon: GitFork },
            { id: 'properties' as const, label: 'Properties', icon: Sliders },
            { id: 'camera' as const, label: 'Camera', icon: Camera },
            { id: 'lights' as const, label: 'Lights', icon: Sun },
            { id: 'effects' as const, label: 'Effects', icon: Sparkles },
            { id: 'physics' as const, label: 'Physics', icon: Wind },
          ].map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  onToggleCollapse?.()
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8A81A6] hover:text-white hover:bg-[#201A30] transition-colors cursor-pointer"
                title={`Open ${item.label}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            )
          })}
        </div>
      </aside>
    )
  }

  return (
    <aside 
      style={{ width }}
      className="shrink-0 h-full flex flex-col bg-[#14101E] border-l border-[#2E2548]/60 select-none text-white overflow-hidden z-20 transition-none"
    >
      {/* 1. Panel Header: Title, Grip Handle, Dock Actions, and Collapse Arrow */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#100D1A] border-b border-[#2E2548]/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div 
            draggable={true}
            onDragStart={(e) => {
              onStartDragPanel?.()
              setDragData(e, VOOM_DRAG_TYPES.PANEL, { type: 'panel', panelId: 'right_sidebar', sourceZone: 'right' })
            }}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#251E38] text-[#7A7196] hover:text-white transition-colors"
            title="Drag to dock panel elsewhere"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#D0CDE0] truncate">
            {activeTab === 'scene_tree' ? 'Scene Hierarchy' :
             activeTab === 'properties' ? 'Properties' :
             activeTab === 'camera' ? 'Camera & Framing' :
             activeTab === 'lights' ? 'Lights & Studio' :
             activeTab === 'effects' ? 'Effects & VFX' : 'Physics & Wind'}
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
                </div>
              </>
            )}
          </div>

          {/* Collapse Panel Button */}
          <button
            onClick={onToggleCollapse}
            title="Collapse panel (Alt+2)"
            className="p-1 rounded-lg text-[#8A81A6] hover:text-white hover:bg-[#201A30] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Tab Row: 6 visible tabs */}
      <div className="grid grid-cols-6 gap-1 p-1.5 bg-[#120F1A] border-b border-[#2E2548]/60 shrink-0">
        {[
          { id: 'scene_tree' as const, label: 'Tree', icon: GitFork },
          { id: 'properties' as const, label: 'Props', icon: Sliders },
          { id: 'camera' as const, label: 'Cam', icon: Camera },
          { id: 'lights' as const, label: 'Light', icon: Sun },
          { id: 'effects' as const, label: 'FX', icon: Sparkles },
          { id: 'physics' as const, label: 'Phys', icon: Wind },
        ].map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'border border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-xs shadow-[#8C7BFF]/30'
                  : 'border border-transparent bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
              }`}
              title={item.label}
            >
              <Icon className="w-3.5 h-3.5 mb-0.5" />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: SCENE TREE (HIERARCHY / OUTLINER) */}
      {activeTab === 'scene_tree' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-3.5">
          {/* Search bar & Scene Reset */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A81A6]" />
              <input
                type="text"
                value={treeSearchQuery}
                onChange={e => setTreeSearchQuery(e.target.value)}
                placeholder="Search scene hierarchy..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#120F1A] border border-[#2E2548] rounded-xl text-xs text-white placeholder-[#6E6885] focus:outline-none focus:border-[#8C7BFF] transition-all"
              />
            </div>
            {onClearScene && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear the entire scene? This will forcefully remove all characters and props from both the 3D viewport and scene hierarchy.')) {
                    onClearScene()
                  }
                }}
                title="Force Reset Scene (Empties 3D Viewport & Hierarchy)"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 transition-all cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Characters Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8A81A6]">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#8C7BFF]" />
                Characters ({sceneCharacters.length})
              </span>
            </div>
            {sceneCharacters
              .filter(c => c.name.toLowerCase().includes(treeSearchQuery.toLowerCase()))
              .map(char => {
                const isSelected = selectedEntity?.type === 'character' && selectedEntity.id === char.id
                return (
                  <div
                    key={char.id}
                    onClick={() => onSelectEntity({ type: 'character', id: char.id })}
                    className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-xs'
                        : 'border-[#2E2548]/50 bg-[#1A1528] text-[#D0CDE0] hover:text-white hover:bg-[#221B35]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-3 h-3 text-[#8C7BFF] shrink-0" />
                      <span className="truncate font-medium">{char.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleCharacterVisibility?.(char.id)}
                        className="p-1 rounded text-[#8A81A6] hover:text-white"
                        title={char.visible ? 'Hide' : 'Show'}
                      >
                        {char.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-amber-400" />}
                      </button>
                      <button
                        onClick={() => onToggleCharacterLock?.(char.id)}
                        className="p-1 rounded text-[#8A81A6] hover:text-white"
                        title={char.locked ? 'Unlock' : 'Lock'}
                      >
                        {char.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => onDeleteCharacter?.(char.id)}
                        className="p-1 rounded text-[#8A81A6] hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Props Section */}
          <div className="space-y-1.5 pt-2 border-t border-[#2E2548]/60">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8A81A6]">
              <span className="flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-[#00E676]" />
                Props & Assets ({sceneProps.length})
              </span>
            </div>
            {sceneProps
              .filter(p => p.name.toLowerCase().includes(treeSearchQuery.toLowerCase()))
              .map(prop => {
                const isSelected = selectedEntity?.type === 'prop' && selectedEntity.id === prop.id
                return (
                  <div
                    key={prop.id}
                    onClick={() => onSelectEntity({ type: 'prop', id: prop.id })}
                    className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-xs'
                        : 'border-[#2E2548]/50 bg-[#1A1528] text-[#D0CDE0] hover:text-white hover:bg-[#221B35]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Box className="w-3 h-3 text-[#00E676] shrink-0" />
                      <span className="truncate font-medium">{prop.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onDeleteProp?.(prop.id)}
                        className="p-1 rounded text-[#8A81A6] hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Cameras in Scene Hierarchy */}
          <div className="space-y-1.5 pt-2 border-t border-[#2E2548]/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8A81A6] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3 h-3 text-[#38BDF8]" />
                Cameras ({cameraShots.length})
              </span>
              {onAddCamera && (
                <button
                  type="button"
                  onClick={onAddCamera}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-[#38BDF8] hover:text-white bg-[#38BDF8]/15 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/40 flex items-center gap-1 transition-all cursor-pointer"
                  title="Add new custom camera"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add Camera</span>
                </button>
              )}
            </div>

            {cameraShots
              .filter(shot => !treeSearchQuery || shot.name.toLowerCase().includes(treeSearchQuery.toLowerCase()))
              .map(shot => {
                const isSelected = selectedEntity?.type === 'camera' && selectedEntity.id === shot.id
                const isActiveView = activeShotId === shot.id

                return (
                  <div
                    key={shot.id}
                    onClick={() => onSelectEntity({ type: 'camera', id: shot.id })}
                    className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-[#38BDF8] bg-[#0284C7]/25 text-white shadow-xs'
                        : 'border-[#2E2548]/50 bg-[#1A1528] text-[#D0CDE0] hover:text-white hover:bg-[#221B35]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Camera className={`w-3.5 h-3.5 shrink-0 ${isActiveView ? 'text-emerald-400' : 'text-[#38BDF8]'}`} />
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="truncate font-medium">{shot.name}</span>
                        {isActiveView && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/15 px-1 py-0.2 rounded shrink-0">
                            Active
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-[#8A81A6] bg-[#251E38] px-1 py-0.2 rounded shrink-0">
                          {shot.fov}°
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyCameraShot(shot)
                          onSelectEntity({ type: 'camera', id: shot.id })
                        }}
                        className="p-1 rounded text-[#8A81A6] hover:text-emerald-400 hover:bg-[#251E38]"
                        title="Look through this camera"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      {cameraShots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteCameraShot(shot.id)}
                          className="p-1 rounded text-[#8A81A6] hover:text-red-400 hover:bg-[#251E38]"
                          title="Delete camera"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Scene Utilities */}
          <div className="space-y-1.5 pt-2 border-t border-[#2E2548]/60">
            <span className="text-[11px] font-bold text-[#8A81A6]">Scene Utilities</span>
            <div 
              onClick={() => setActiveTab('camera')}
              className="p-2 rounded-xl text-xs flex items-center gap-2 bg-[#1A1528] border border-[#2E2548]/50 text-[#D0CDE0] hover:text-white hover:bg-[#221B35] cursor-pointer"
            >
              <Camera className="w-3 h-3 text-[#38BDF8]" />
              <span className="font-medium">Camera & Framing ({cameraShots.length} Cameras)</span>
            </div>
            <div 
              onClick={() => setActiveTab('lights')}
              className="p-2 rounded-xl text-xs flex items-center gap-2 bg-[#1A1528] border border-[#2E2548]/50 text-[#D0CDE0] hover:text-white hover:bg-[#221B35] cursor-pointer"
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span className="font-medium">Studio Lighting & Environment</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROPERTIES & SETTINGS (BLENDER TRANSFORM INSPECTOR) */}
      {activeTab === 'properties' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-4">
          {selectedCharacter || selectedProp ? (
            <>
              {/* Selected Entity Card */}
              <div className="p-3 rounded-xl bg-[#1A1528] border border-[#2E2548]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedCharacter ? (
                      <User className="w-4 h-4 text-[#8C7BFF]" />
                    ) : (
                      <Box className="w-4 h-4 text-[#00E676]" />
                    )}
                    <span className="text-xs font-bold text-white truncate">
                      {selectedCharacter?.name || selectedProp?.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C7BFF] bg-[#8C7BFF]/15 px-1.5 py-0.5 rounded">
                    {selectedCharacter ? 'Character' : 'Prop'}
                  </span>
                </div>
              </div>

              {/* Transform XYZ Controls */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">
                  Transform Controls
                </span>

                {/* Position */}
                <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 space-y-2">
                  <span className="text-[11px] font-bold text-[#8A81A6]">Position (Meters)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['X', 'Y', 'Z'].map((axis, i) => {
                      const currentPos = selectedCharacter 
                        ? (selectedCharacter.position || [0, 0, 0]) 
                        : (selectedProp?.position || [0, 0, 0])
                      const colors = ['bg-red-500/20 text-red-400', 'bg-green-500/20 text-green-400', 'bg-blue-500/20 text-blue-400']
                      const axisVal = Number.isFinite(currentPos[i]) ? currentPos[i] : 0
                      return (
                        <div key={axis} className="flex items-center bg-[#120F1A] border border-[#2E2548] rounded-lg overflow-hidden">
                          <span className={`px-2 py-1 text-[10px] font-bold font-mono ${colors[i]}`}>{axis}</span>
                          <input
                            type="number"
                            step="0.1"
                            value={axisVal.toFixed(2)}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0
                              const updated = [...currentPos] as [number, number, number]
                              updated[i] = val
                              if (selectedCharacter) {
                                onUpdateCharacterTransform?.(selectedCharacter.id, { position: updated })
                              } else if (selectedProp) {
                                onUpdatePropTransform?.(selectedProp.id, { position: updated })
                              }
                            }}
                            className="w-full bg-transparent px-1.5 py-1 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Visible Warning & Auto-correction for Out-of-Bounds Character */}
                {selectedCharacter && selectedCharacter.position && (
                  Math.abs(selectedCharacter.position[0] || 0) > 50 ||
                  Math.abs(selectedCharacter.position[1] || 0) > 50 ||
                  Math.abs(selectedCharacter.position[2] || 0) > 50
                ) && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Out of Scene Bounds</span>
                    </div>
                    <p className="text-[10px] text-amber-200/80 leading-relaxed">
                      Position ({(selectedCharacter.position || [0, 0, 0]).map(n => (Number.isFinite(n) ? n : 0).toFixed(1)).join(', ')}) exceeds ±50m and may appear invisible from the camera.
                    </p>
                    <button
                      type="button"
                      onClick={() => onUpdateCharacterTransform?.(selectedCharacter.id, { position: [0, 0, 0] })}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-[#120F1A] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Auto-Correct to Ground Origin (0, 0, 0)
                    </button>
                  </div>
                )}

                {/* Rotation */}
                <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 space-y-2">
                  <span className="text-[11px] font-bold text-[#8A81A6]">Rotation (Degrees)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['X', 'Y', 'Z'].map((axis, i) => {
                      const currentRot = selectedCharacter 
                        ? (selectedCharacter.rotation || [0, 0, 0]) 
                        : (selectedProp?.rotation || [0, 0, 0])
                      const colors = ['bg-red-500/20 text-red-400', 'bg-green-500/20 text-green-400', 'bg-blue-500/20 text-blue-400']
                      const axisRot = Number.isFinite(currentRot[i]) ? currentRot[i] : 0
                      return (
                        <div key={axis} className="flex items-center bg-[#120F1A] border border-[#2E2548] rounded-lg overflow-hidden">
                          <span className={`px-2 py-1 text-[10px] font-bold font-mono ${colors[i]}`}>{axis}</span>
                          <input
                            type="number"
                            step="5"
                            value={Math.round(axisRot)}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0
                              const updated = [...currentRot] as [number, number, number]
                              updated[i] = val
                              if (selectedCharacter) {
                                onUpdateCharacterTransform?.(selectedCharacter.id, { rotation: updated })
                              } else if (selectedProp) {
                                onUpdatePropTransform?.(selectedProp.id, { rotation: updated })
                              }
                            }}
                            className="w-full bg-transparent px-1.5 py-1 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Uniform Scale Tool */}
                <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 space-y-2.5">
                  {(() => {
                    const currentScale = selectedCharacter 
                      ? (selectedCharacter.scale || [1, 1, 1]) 
                      : (selectedProp?.scale || [1, 1, 1])
                    const rawScale = Number.isFinite(currentScale[0]) ? currentScale[0] : 1.0
                    const uniformScaleVal = Number(rawScale.toFixed(2))

                    const handleSetUniformScale = (newVal: number) => {
                      const safeVal = Math.max(0.01, Math.min(100.0, Number(newVal.toFixed(3))))
                      const updated: [number, number, number] = [safeVal, safeVal, safeVal]
                      if (selectedCharacter) {
                        onUpdateCharacterTransform?.(selectedCharacter.id, { scale: updated })
                      } else if (selectedProp) {
                        onUpdatePropTransform?.(selectedProp.id, { scale: updated })
                      }
                    }

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Maximize2 className="w-3.5 h-3.5 text-[#8C7BFF]" />
                            <span className="text-[11px] font-bold text-white">Uniform Scale</span>
                          </div>
                          <span className="text-[10px] font-medium text-[#8C7BFF] bg-[#8C7BFF]/10 px-1.5 py-0.5 rounded">
                            Proportional
                          </span>
                        </div>

                        {/* Numeric Input & Steppers */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center flex-1 bg-[#120F1A] border border-[#2E2548] rounded-lg px-2 py-1 focus-within:border-[#8C7BFF] transition-colors">
                            <span className="text-[10px] font-bold text-[#8A81A6] mr-1.5">Scale:</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0.01"
                              max="50"
                              value={uniformScaleVal}
                              onChange={e => {
                                const val = parseFloat(e.target.value)
                                if (!isNaN(val) && val > 0) {
                                  handleSetUniformScale(val)
                                }
                              }}
                              className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                            />
                            <span className="text-xs font-bold text-[#8C7BFF] ml-0.5">x</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSetUniformScale(Math.max(0.05, uniformScaleVal - 0.1))}
                            className="p-1.5 rounded-lg bg-[#251E3A] hover:bg-[#342A52] text-white transition-colors"
                            title="Scale down by 0.1x"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetUniformScale(uniformScaleVal + 0.1)}
                            className="p-1.5 rounded-lg bg-[#251E3A] hover:bg-[#342A52] text-white transition-colors"
                            title="Scale up by 0.1x"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetUniformScale(1.0)}
                            className="p-1.5 rounded-lg bg-[#2E2548] hover:bg-[#3E3260] text-[#A09BB5] hover:text-white transition-colors"
                            title="Reset to 1.0x"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-6 gap-1">
                          {[0.25, 0.5, 1.0, 1.5, 2.0, 3.0].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleSetUniformScale(p)}
                              className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
                                Math.abs(uniformScaleVal - p) < 0.04
                                  ? 'bg-[#8C7BFF] text-white shadow-xs'
                                  : 'bg-[#120F1A] text-[#8A81A6] hover:bg-[#251E3A] hover:text-white'
                              }`}
                            >
                              {p}x
                            </button>
                          ))}
                        </div>

                        {/* Individual Axes Accordion (Advanced) */}
                        <div className="pt-2 border-t border-[#2E2548]/60">
                          <button
                            type="button"
                            onClick={() => setShowIndividualAxes(!showIndividualAxes)}
                            className="flex items-center justify-between w-full text-[10px] font-bold text-[#8A81A6] hover:text-[#A09BB5] py-0.5"
                          >
                            <span>Individual Axes (X, Y, Z)</span>
                            <span className="text-[9px] font-mono">{showIndividualAxes ? '▲ Hide' : '▼ Edit'}</span>
                          </button>
                          {showIndividualAxes && (
                            <div className="grid grid-cols-3 gap-1.5 mt-2">
                              {['X', 'Y', 'Z'].map((axis, i) => {
                                const colors = ['bg-red-500/20 text-red-400', 'bg-green-500/20 text-green-400', 'bg-blue-500/20 text-blue-400']
                                return (
                                  <div key={axis} className="flex items-center bg-[#120F1A] border border-[#2E2548] rounded-lg overflow-hidden">
                                    <span className={`px-1.5 py-1 text-[9px] font-bold font-mono ${colors[i]}`}>{axis}</span>
                                    <input
                                      type="number"
                                      step="0.05"
                                      min="0.01"
                                      value={currentScale[i].toFixed(2)}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 1
                                        const updated = [...currentScale] as [number, number, number]
                                        updated[i] = val
                                        if (selectedCharacter) {
                                          onUpdateCharacterTransform?.(selectedCharacter.id, { scale: updated })
                                        } else if (selectedProp) {
                                          onUpdatePropTransform?.(selectedProp.id, { scale: updated })
                                        }
                                      }}
                                      className="w-full bg-transparent px-1 py-0.5 text-[11px] text-white font-mono focus:outline-none"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </>
          ) : selectedCamera ? (
            /* CAMERA OBJECT PROPERTIES INSPECTOR */
            <div className="space-y-4">
              {/* Camera Header Card */}
              <div className="p-3 rounded-xl bg-[#1A1528] border border-[#38BDF8]/40 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Camera className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    <input
                      type="text"
                      value={selectedCamera.name}
                      onChange={e => onRenameCameraShot(selectedCamera.id, e.target.value)}
                      className="text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-[#38BDF8]/50 focus:border-[#38BDF8] focus:outline-none transition-colors truncate"
                      title="Click to rename camera"
                    />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] bg-[#38BDF8]/15 px-1.5 py-0.5 rounded shrink-0">
                    Camera
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onApplyCameraShot(selectedCamera)
                      onSelectEntity({ type: 'camera', id: selectedCamera.id })
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/35 text-[#38BDF8] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Look Through Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOverwriteCameraShot(selectedCamera.id)}
                    className="py-1.5 px-2.5 rounded-lg bg-[#251E38] hover:bg-[#2E2548] text-[#C4B5FD] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Align camera to current viewport framing"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync View</span>
                  </button>
                </div>
              </div>

              {/* Transform Controls for Camera */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">
                  Camera Transform
                </span>

                {/* Position (XYZ) */}
                <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8A81A6]">Camera Position (Meters)</span>
                    <span className="text-[9px] font-mono text-[#8A81A6]">Eye</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['X', 'Y', 'Z'].map((axis, i) => {
                      const colors = ['bg-red-500/20 text-red-400', 'bg-green-500/20 text-green-400', 'bg-blue-500/20 text-blue-400']
                      const camPosVal = selectedCamera.position && Number.isFinite(selectedCamera.position[i]) ? selectedCamera.position[i] : 0
                      return (
                        <div key={axis} className="flex items-center bg-[#120F1A] border border-[#2E2548] rounded-lg overflow-hidden">
                          <span className={`px-2 py-1 text-[10px] font-bold font-mono ${colors[i]}`}>{axis}</span>
                          <input
                            type="number"
                            step="0.1"
                            value={camPosVal.toFixed(2)}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0
                              const updated = [...(selectedCamera.position || [0, 1.2, 3])] as [number, number, number]
                              updated[i] = val
                              onUpdateCameraShot?.(selectedCamera.id, { position: updated })
                              onUpdateCameraPosition(selectedCamera.id, updated)
                            }}
                            className="w-full bg-transparent px-1.5 py-1 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Look-At Target (XYZ) */}
                <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8A81A6]">Look-At Target (Meters)</span>
                    <span className="text-[9px] font-mono text-[#8A81A6]">Focal Point</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['X', 'Y', 'Z'].map((axis, i) => {
                      const colors = ['bg-red-500/20 text-red-400', 'bg-green-500/20 text-green-400', 'bg-blue-500/20 text-blue-400']
                      const camTargetVal = selectedCamera.target && Number.isFinite(selectedCamera.target[i]) ? selectedCamera.target[i] : 0
                      return (
                        <div key={axis} className="flex items-center bg-[#120F1A] border border-[#2E2548] rounded-lg overflow-hidden">
                          <span className={`px-2 py-1 text-[10px] font-bold font-mono ${colors[i]}`}>{axis}</span>
                          <input
                            type="number"
                            step="0.1"
                            value={camTargetVal.toFixed(2)}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0
                              const updated = [...(selectedCamera.target || [0, 1, 0])] as [number, number, number]
                              updated[i] = val
                              onUpdateCameraShot?.(selectedCamera.id, { target: updated })
                            }}
                            className="w-full bg-transparent px-1.5 py-1 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Field of View (FOV) / Lens */}
                <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8A81A6]">Field of View (FOV)</span>
                    <span className="text-xs font-mono font-bold text-[#38BDF8]">{selectedCamera.fov}°</span>
                  </div>

                  <input
                    type="range"
                    min="12"
                    max="110"
                    step="1"
                    value={selectedCamera.fov}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10) || 35
                      onUpdateCameraShot?.(selectedCamera.id, { fov: val })
                    }}
                    className="w-full accent-[#38BDF8] cursor-pointer"
                  />

                  {/* Quick Lens Presets */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#8A81A6] font-bold">Lens Presets</span>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { label: '24mm', fov: 75 },
                        { label: '35mm', fov: 55 },
                        { label: '50mm', fov: 40 },
                        { label: '85mm', fov: 24 },
                        { label: '135mm', fov: 15 }
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => onUpdateCameraShot?.(selectedCamera.id, { fov: preset.fov })}
                          className={`py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            Math.abs(selectedCamera.fov - preset.fov) < 3
                              ? 'bg-[#38BDF8] text-[#0B0F19] shadow-xs'
                              : 'bg-[#120F1A] text-[#8A81A6] hover:bg-[#251E3A] hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delete Camera */}
                {cameraShots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCameraShot(selectedCamera.id)
                      onSelectEntity(null)
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Camera</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Scene Environment Settings when nothing selected */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#1A1528] border border-[#2E2548] text-center">
                <Sliders className="w-6 h-6 text-[#8C7BFF] mx-auto mb-1.5" />
                <p className="text-xs font-bold text-white">Global Scene Settings</p>
                <p className="text-[10px] text-[#A09BB5] mt-0.5">Select an object to inspect its transform, or adjust world settings below.</p>
              </div>

              {/* Time of day */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">Time of Day</span>
                <div className="p-2.5 rounded-xl bg-[#1A1528] border border-[#2E2548]">
                  <div className="flex justify-between text-xs text-[#A09BB5] mb-2">
                    <span>Sun Angle</span>
                    <span className="font-mono text-white">17:45 (Sunset)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    defaultValue="17.75"
                    className="w-full accent-[#8C7BFF]"
                  />
                </div>
              </div>

              {/* Sky Presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">Sky & Atmosphere</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sunset', name: 'Sunset Glow', icon: '🌅' },
                    { id: 'daylight', name: 'Anime Sky', icon: '☀️' },
                    { id: 'cyberpunk', name: 'Neon Cyber', icon: '🌆' },
                    { id: 'dark', name: 'Dark Studio', icon: '🎬' }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => onAvatarStateChange?.(prev => ({ ...prev, backdrop: preset.id as any }))}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                        avatarState?.backdrop === preset.id
                          ? 'border-[#8C7BFF] bg-[#5B47B2]/40 text-white'
                          : 'border-[#2E2548]/70 bg-[#1A1528] text-[#A09BB5] hover:text-white'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span className="text-xs font-semibold">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAMERA & FRAMING */}
      {activeTab === 'camera' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header Action Row */}
          <div className="p-3 border-b border-[#2E2548]/60 flex items-center justify-between shrink-0 bg-[#120F1A]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A09BB5] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#38BDF8]" />
                Camera & Framing
              </span>
              <p className="text-[10px] text-[#7A7196]">{cameraShots.length} Custom Cameras · {DEFAULT_SCENE_SHOTS.length} Presets</p>
            </div>
            <div className="flex items-center gap-1.5">
              {onAddCamera && (
                <button
                  type="button"
                  onClick={onAddCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8C7BFF] hover:bg-[#7966F0] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#8C7BFF]/25 active:scale-95"
                  title="Add a new custom camera object to the scene"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Camera</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSaveCurrentCameraView()}
                className="p-1.5 rounded-lg border border-[#2E2548] bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38] transition-all cursor-pointer"
                title="Save current viewport framing as a new shot"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* 1. Active Scene Cameras Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8A81A6] uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-[#38BDF8]" />
                  Scene Cameras ({cameraShots.length})
                </span>
                <span className="text-[10px] text-[#7A7196]">Select to position with gizmo</span>
              </div>

              <div className="space-y-2">
                {cameraShots.map((shot, idx) => {
                  const isSelected = selectedEntity?.type === 'camera' && selectedEntity.id === shot.id
                  const isActiveView = activeShotId === shot.id

                  return (
                    <div
                      key={shot.id}
                      className={`group rounded-xl border transition-all overflow-hidden ${
                        isSelected
                          ? 'border-[#38BDF8] bg-[#0284C7]/20 text-white shadow-md shadow-[#38BDF8]/15'
                          : 'border-[#2E2548]/70 bg-[#1A1528] text-[#D0CDE0] hover:border-[#38BDF8]/40 hover:bg-[#201B30]'
                      }`}
                    >
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        {/* Click to Select Entity and activate Gizmo */}
                        <div
                          onClick={() => onSelectEntity({ type: 'camera', id: shot.id })}
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            isActiveView
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : isSelected
                              ? 'bg-[#38BDF8]/20 border-[#38BDF8]/40 text-[#38BDF8]'
                              : 'bg-[#251E38] border-[#2E2548] text-[#A09BB5]'
                          }`}>
                            <Camera className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate text-white">{shot.name}</span>
                              {isActiveView && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/15 px-1.5 py-0.2 rounded shrink-0">
                                  Viewing
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#8A81A6] font-mono flex items-center gap-2 mt-0.5">
                              <span>FOV {shot.fov}°</span>
                              <span>•</span>
                              <span>Pos ({shot.position.map(n => n.toFixed(1)).join(', ')})</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Look Through View */}
                          <button
                            type="button"
                            onClick={() => {
                              onApplyCameraShot(shot)
                              onSelectEntity({ type: 'camera', id: shot.id })
                            }}
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isActiveView
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'text-[#8A81A6] hover:text-white hover:bg-[#2E2548]'
                            }`}
                            title="Look through this camera"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Gizmo Select Tool */}
                          <button
                            type="button"
                            onClick={() => onSelectEntity({ type: 'camera', id: shot.id })}
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#38BDF8]/30 text-[#38BDF8] border border-[#38BDF8]/50'
                                : 'text-[#8A81A6] hover:text-[#38BDF8] hover:bg-[#2E2548]'
                            }`}
                            title="Select camera to position with Move/Rotate/Scale gizmo"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {cameraShots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteCameraShot(shot.id)}
                              className="p-1.5 rounded-lg text-[#8A81A6] hover:text-red-400 hover:bg-[#2E2548] transition-colors cursor-pointer"
                              title="Delete camera"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded In-Card Quick Controls */}
                      {isSelected && (
                        <div className="px-3 pb-2.5 pt-1.5 border-t border-[#38BDF8]/20 bg-[#120F1A]/60 space-y-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#8A81A6] font-bold">Lens FOV</span>
                            <span className="text-[10px] font-mono text-[#38BDF8] font-bold">{shot.fov}°</span>
                          </div>
                          <input
                            type="range"
                            min="14"
                            max="105"
                            value={shot.fov}
                            onChange={e => onUpdateCameraShot?.(shot.id, { fov: parseInt(e.target.value, 10) || 35 })}
                            className="w-full accent-[#38BDF8] cursor-pointer"
                          />
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => onOverwriteCameraShot(shot.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-[#251E38] text-[10px] text-[#C4B5FD] hover:bg-[#2E2548] cursor-pointer"
                              title="Sync camera to current 3D view"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Align to Current View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('properties')}
                              className="text-[10px] text-[#38BDF8] hover:underline font-bold"
                            >
                              Open Transform Inspector →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Curated Shots Presets Section */}
            <div className="space-y-2 pt-2 border-t border-[#2E2548]/70">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8A81A6] uppercase tracking-wider">
                  Curated Shot Presets ({DEFAULT_SCENE_SHOTS.length})
                </span>
                <span className="text-[10px] text-[#7A7196]">Studio framing</span>
              </div>

              <div className="space-y-1.5">
                {DEFAULT_SCENE_SHOTS.map((preset, idx) => {
                  const numStr = String(idx + 1).padStart(2, '0')

                  return (
                    <div
                      key={preset.id}
                      onClick={() => onApplyCameraShot(preset)}
                      className="group p-2 rounded-xl border border-[#2E2548]/60 bg-[#1A1528] text-[#D0CDE0] hover:border-[#8C7BFF]/40 hover:bg-[#221B35] transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <ShotThumbnail index={idx} name={preset.name} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate text-white">
                            {numStr}. {preset.name}
                          </div>
                          <div className="text-[10px] text-[#8A81A6] truncate">
                            {preset.description || `FOV ${preset.fov}°`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onApplyCameraShot(preset)}
                          title="Look through this preset framing"
                          className="px-2 py-1 rounded-lg text-xs font-bold text-[#8A81A6] hover:text-[#8C7BFF] hover:bg-[#251E38] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[10px]">View</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIGHTS & STUDIO */}
      {activeTab === 'lights' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">
            Studio Lighting Presets
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'sunset', name: 'Golden Sunset', icon: '🌅' },
              { id: 'daylight', name: 'Anime Daylight', icon: '☀️' },
              { id: 'cyberpunk', name: 'Neon Cyberpunk', icon: '🌆' },
              { id: 'dark', name: 'Studio Softbox', icon: '🎬' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => onAvatarStateChange?.(prev => ({ ...prev, backdrop: preset.id as any }))}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  avatarState?.backdrop === preset.id
                    ? 'border-[#8C7BFF] bg-[#5B47B2]/40 text-white shadow-xs'
                    : 'border-[#2E2548]/60 bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
                }`}
              >
                <span className="text-xl">{preset.icon}</span>
                <span className="text-xs font-bold">{preset.name}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-3 border-t border-[#2E2548]/60">
            <span className="text-[11px] font-bold text-[#8A81A6]">Intensity Controls</span>
            <div>
              <div className="flex justify-between text-xs text-[#A09BB5] mb-1">
                <span>Key Light</span>
                <span className="font-mono text-white">{avatarState?.lighting?.keyLightIntensity?.toFixed(1) ?? '1.2'}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={avatarState?.lighting?.keyLightIntensity ?? 1.2}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  onAvatarStateChange?.(prev => ({
                    ...prev,
                    lighting: { ...(prev?.lighting || {} as any), keyLightIntensity: val }
                  }))
                }}
                className="w-full accent-[#8C7BFF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A09BB5] mb-1">
                <span>Fill Light</span>
                <span className="font-mono text-white">{avatarState?.lighting?.fillLightIntensity?.toFixed(1) ?? '0.8'}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.5"
                step="0.1"
                value={avatarState?.lighting?.fillLightIntensity ?? 0.8}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  onAvatarStateChange?.(prev => ({
                    ...prev,
                    lighting: { ...(prev?.lighting || {} as any), fillLightIntensity: val }
                  }))
                }}
                className="w-full accent-[#8C7BFF]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EFFECTS & VFX */}
      {activeTab === 'effects' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">
            Post-Processing & VFX
          </h3>
          <div className="space-y-2.5">
            {[
              { id: 'bloom', label: 'Bloom Glow', desc: 'Adds anime dreamy highlights' },
              { id: 'fog', label: 'Atmospheric Fog', desc: 'Depth haze across the scene' },
              { id: 'vignette', label: 'Cinematic Vignette', desc: 'Darkens frame borders' },
              { id: 'cel', label: 'Toon Cel Outlines', desc: 'Black inked manga line art' }
            ].map(fx => (
              <div key={fx.id} className="p-3 rounded-xl bg-[#1A1528] border border-[#2E2548]/70 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{fx.label}</p>
                  <p className="text-[10px] text-[#8A81A6] mt-0.5">{fx.desc}</p>
                </div>
                <input type="checkbox" defaultChecked={true} className="w-4 h-4 accent-[#8C7BFF] rounded cursor-pointer" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PHYSICS & WIND */}
      {activeTab === 'physics' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A09BB5]">
            Hair & Cloth Wind Physics
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-[#A09BB5] mb-1">
                <span>Wind Speed</span>
                <span className="font-mono text-white">{avatarState?.wind?.speed?.toFixed(1) ?? '1.0'} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.2"
                value={avatarState?.wind?.speed ?? 1.0}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  onAvatarStateChange?.(prev => ({
                    ...prev,
                    wind: { ...(prev?.wind || {} as any), speed: val }
                  }))
                }}
                className="w-full accent-[#8C7BFF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A09BB5] mb-1">
                <span>Wind Direction</span>
                <span className="font-mono text-white">{avatarState?.wind?.direction || 45}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={avatarState?.wind?.direction || 45}
                onChange={e => {
                  const val = parseFloat(e.target.value)
                  onAvatarStateChange?.(prev => ({
                    ...prev,
                    wind: { ...(prev.wind || {} as any), direction: val }
                  }))
                }}
                className="w-full accent-[#8C7BFF]"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
