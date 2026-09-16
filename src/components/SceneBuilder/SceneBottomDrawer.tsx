import React, { useState, useRef } from 'react'
import { 
  Move, 
  User, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ChevronRight, 
  Play, 
  Clock, 
  Sparkles,
  Check,
  GripVertical
} from 'lucide-react'
import { setDragData, VOOM_DRAG_TYPES } from '../../utils/dragDropAsset'

interface SceneBottomDrawerProps {
  activePosePreset: string
  onApplyPose: (poseKey: string) => void
  onApplyClipToCharacter?: (charId: string, clip: any) => void
  activeCharacterId?: string
  activeCharacterName?: string
  height?: number
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onStartDragPanel?: () => void
}

type BottomSubTab = 'pose' | 'animations'
type PoseCategory = 'All' | 'Standing' | 'Action' | 'Sitting' | 'Expressive'

interface PoseItem {
  key: string
  name: string
  category: 'Standing' | 'Action' | 'Sitting' | 'Expressive'
  description: string
}

// 10 curated poses matching reference target screenshot
const CURATED_POSES: PoseItem[] = [
  {
    key: 'naturalStand',
    name: 'Standing Idle',
    category: 'Standing',
    description: 'Anime natural idle posture'
  },
  {
    key: 'handsOnHips',
    name: 'Confident Pose',
    category: 'Standing',
    description: 'Heroic posture with hands on hips'
  },
  {
    key: 'armsCrossed',
    name: 'Hand on Hip',
    category: 'Standing',
    description: 'Stylized attitude standing gesture'
  },
  {
    key: 'thinking',
    name: 'Crossed Arms',
    category: 'Standing',
    description: 'Pensive arms folded stance'
  },
  {
    key: 'cutePeace',
    name: 'Thinking',
    category: 'Expressive',
    description: 'Hand to chin contemplative pose'
  },
  {
    key: 'heroicBattle',
    name: 'Pointing',
    category: 'Expressive',
    description: 'Expressive dynamic directional gesture'
  },
  {
    key: 'sittingGround',
    name: 'Sitting',
    category: 'Sitting',
    description: 'Seated relaxed floor posture'
  },
  {
    key: 'casualStand',
    name: 'Kneeling',
    category: 'Sitting',
    description: 'Ground kneel dialogue pose'
  }
]

// Stylized visual preview card for anime pose
const PoseVisualPreview: React.FC<{ poseKey: string; isSelected: boolean }> = ({ poseKey, isSelected }) => {
  return (
    <div className={`w-full aspect-square rounded-xl flex items-center justify-center p-2 mb-1.5 transition-all overflow-hidden ${
      isSelected 
        ? 'bg-[#5B47B2]/40 border border-[#8C7BFF]' 
        : 'bg-[#1D172E] border border-[#2E2548]/80 group-hover:border-[#8C7BFF]/40'
    }`}>
      {/* Visual wireframe icon / silhouette */}
      <div className="flex flex-col items-center justify-center opacity-85">
        <div className="w-4 h-4 rounded-full border border-[#C4B5FD] mb-1" />
        <div className="w-6 h-8 border-t-2 border-b-2 border-x border-[#C4B5FD] rounded-xs relative">
          <div className="absolute -left-2 top-0 w-1.5 h-6 border-l border-b border-[#8C7BFF]" />
          <div className="absolute -right-2 top-0 w-1.5 h-6 border-r border-b border-[#8C7BFF]" />
        </div>
      </div>
    </div>
  )
}

export const SceneBottomDrawer: React.FC<SceneBottomDrawerProps> = ({
  activePosePreset,
  onApplyPose,
  onApplyClipToCharacter,
  activeCharacterId,
  activeCharacterName = 'Main Character',
  height = 200,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
  onStartDragPanel
}) => {
  const [subTab, setSubTab] = useState<BottomSubTab>('pose')
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed
  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse()
    } else {
      setInternalIsCollapsed(!internalIsCollapsed)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PoseCategory>('All')
  const [selectedPoseKey, setSelectedPoseKey] = useState<string>(activePosePreset || 'naturalStand')

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleSelectPose = (key: string) => {
    setSelectedPoseKey(key)
    onApplyPose(key)
  }

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 160, behavior: 'smooth' })
    }
  }

  const filteredPoses = CURATED_POSES.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="w-full shrink-0 flex flex-col bg-[#14101E] border-t border-[#2E2548]/60 select-none z-20">
      {/* Sub-Tab Bar: Grip + [Pose] [Animations] [+] and Collapse Toggle */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#120F1A] border-b border-[#2E2548]/60">
        <div className="flex items-center gap-2">
          <div
            draggable={true}
            onDragStart={(e) => {
              onStartDragPanel?.()
              setDragData(e, VOOM_DRAG_TYPES.PANEL, { type: 'panel', panelId: 'bottom_drawer', sourceZone: 'bottom' })
            }}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#251E38] text-[#7A7196] hover:text-white transition-colors"
            title="Drag to dock panel elsewhere"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Pose Sub-Tab */}
          <button
            onClick={() => setSubTab('pose')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'pose'
                ? 'border border-[#8C7BFF] bg-[#8C7BFF]/25 text-white shadow-sm shadow-[#8C7BFF]/20'
                : 'border border-transparent bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Pose</span>
          </button>

          {/* Animations Sub-Tab */}
          <button
            onClick={() => setSubTab('animations')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'animations'
                ? 'border border-[#8C7BFF] bg-[#8C7BFF]/25 text-white shadow-sm shadow-[#8C7BFF]/20'
                : 'border border-transparent bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Animations</span>
          </button>

          {/* + Button */}
          <button
            onClick={() => {
              if (subTab === 'pose') {
                onApplyPose('naturalStand')
              }
            }}
            title="Add Pose or Animation"
            className="p-1 rounded-lg bg-[#1A1528] border border-[#2E2548] text-[#A09BB5] hover:text-white hover:bg-[#251E38] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={handleToggleCollapse}
          title={isCollapsed ? 'Expand Pose Drawer' : 'Collapse Pose Drawer'}
          className="p-1 rounded-lg text-[#8A81A6] hover:text-white hover:bg-[#201A30] transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Drawer Body (Collapsible) */}
      {!isCollapsed && (
        <div style={{ height }} className="flex flex-col p-3 pt-2 overflow-hidden">
          {subTab === 'pose' ? (
            <>
              {/* Header: Title, Search, Filter Chips */}
              <div className="flex items-center justify-between gap-3 mb-2.5 shrink-0">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-3.5 h-3.5 text-[#8A81A6]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Pose Library
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative w-44">
                  <Search className="w-3 h-3 text-[#8A81A6] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search poses..."
                    className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-[#1A1528] border border-[#2E2548] text-xs text-white placeholder-[#8A81A6] focus:outline-none focus:border-[#8C7BFF]"
                  />
                </div>

                {/* Category Filter Chips with Unified Active State */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {(['All', 'Standing', 'Action', 'Sitting', 'Expressive'] as PoseCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'border border-[#8C7BFF] bg-[#8C7BFF]/25 text-white shadow-sm shadow-[#8C7BFF]/20'
                          : 'border border-transparent bg-[#1A1528] text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizontal Scroll Strip of Pose Cards */}
              <div className="flex-1 flex items-center min-w-0 relative">
                <div
                  ref={scrollContainerRef}
                  className="flex-1 flex items-center gap-2.5 overflow-x-auto overflow-y-hidden pb-1 no-scrollbar h-full"
                >
                  {filteredPoses.map(pose => {
                    const isSelected = selectedPoseKey === pose.key

                    return (
                      <button
                        key={pose.key}
                        onClick={() => handleSelectPose(pose.key)}
                        className={`w-28 shrink-0 h-full p-2 rounded-xl flex flex-col items-center justify-between text-center transition-all cursor-pointer group ${
                          isSelected
                            ? 'border border-[#8C7BFF] bg-[#5B47B2]/40 text-white ring-1 ring-[#8C7BFF] shadow-sm shadow-[#8C7BFF]/20'
                            : 'border border-[#2E2548]/60 bg-[#181324] text-[#A09BB5] hover:border-[#8C7BFF]/40 hover:bg-[#201933] hover:text-white'
                        }`}
                      >
                        <PoseVisualPreview poseKey={pose.key} isSelected={isSelected} />
                        <span className="text-[11px] font-bold line-clamp-1">
                          {pose.name}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Right Scroll Arrow Button */}
                <button
                  onClick={handleScrollRight}
                  className="p-1.5 rounded-lg bg-[#1A1528] border border-[#2E2548] text-[#A09BB5] hover:text-white hover:bg-[#251E38] shadow-md ml-1.5 shrink-0 cursor-pointer"
                  title="Scroll poses right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Animations Sub-Tab Content */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Placed Animations for {activeCharacterName}
                </span>
                <span className="text-[11px] text-[#A09BB5]">
                  Select clip to audition or drag to scene
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                {[
                  { name: 'Idle Loop', frames: 60, type: 'idle' },
                  { name: 'Walk Forward', frames: 90, type: 'walk' },
                  { name: 'Run Sprint', frames: 60, type: 'run' },
                  { name: 'Victory Wave', frames: 48, type: 'wave' }
                ].map(clip => (
                  <div
                    key={clip.name}
                    className="w-36 h-full p-2.5 rounded-xl border border-[#2E2548]/60 bg-[#181324] hover:border-[#8C7BFF]/40 flex flex-col justify-between shrink-0"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{clip.name}</span>
                        <Play className="w-3 h-3 text-[#8C7BFF]" />
                      </div>
                      <span className="text-[10px] text-[#A09BB5]">{clip.frames} frames</span>
                    </div>
                    <button
                      onClick={() => {
                        if (activeCharacterId && onApplyClipToCharacter) {
                          onApplyClipToCharacter(activeCharacterId, clip)
                        }
                      }}
                      className="w-full py-1 text-[11px] font-bold rounded-lg border border-[#8C7BFF]/40 bg-[#8C7BFF]/20 text-[#C4B5FD] hover:bg-[#8C7BFF] hover:text-white transition-all cursor-pointer"
                    >
                      Audition Clip
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
