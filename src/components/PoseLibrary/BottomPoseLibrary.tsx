import React, { useState } from 'react'
import { POSE_PRESETS, PosePreset } from '../../utils/vrmManager'
import { ANIMATIONS_MANIFEST } from '../../utils/animationManifest'
import { 
  Search, 
  Sparkles, 
  Check, 
  Move,
  Flame,
  User,
  Coffee,
  Heart
} from 'lucide-react'

interface BottomPoseLibraryProps {
  className?: string
  activePosePreset: string
  onApplyPose?: (presetKey: string) => void
  onSelectPosePreset?: (presetKey: string) => void
}

type PoseCategory = 'All' | 'Standing' | 'Animated' | 'Action' | 'Sitting' | 'Expressive'

interface DisplayPose {
  key: string
  name: string
  category: 'Standing' | 'Action' | 'Sitting' | 'Expressive' | 'Animated'
  description: string
  iconType: 'standing' | 'action' | 'sitting' | 'expressive' | 'walking'
  isAnimated?: boolean
}

export const BottomPoseLibrary: React.FC<BottomPoseLibraryProps> = ({
  className,
  activePosePreset,
  onApplyPose,
  onSelectPosePreset
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PoseCategory>('All')

  const handleSelectPose = (key: string) => {
    onApplyPose?.(key)
    onSelectPosePreset?.(key)
  }

  // Curated static poses
  const staticPoses: DisplayPose[] = [
    {
      key: 'naturalStand',
      name: 'Default Standing',
      category: 'Standing',
      description: 'Anime natural idle posture with relaxed arms by sides',
      iconType: 'standing'
    },
    {
      key: 'handsOnHips',
      name: 'Confident',
      category: 'Standing',
      description: 'Proud anime heroine stance with hands resting on hips',
      iconType: 'standing'
    },
    {
      key: 'armsCrossed',
      name: 'Crossed Arms',
      category: 'Standing',
      description: 'Pensive posture with arms folded across chest',
      iconType: 'standing'
    },
    {
      key: 'thinking',
      name: 'Thinking',
      category: 'Expressive',
      description: 'Curious contemplative gesture with hand to chin',
      iconType: 'expressive'
    },
    {
      key: 'sittingGround',
      name: 'Sitting',
      category: 'Sitting',
      description: 'Relaxed seated pose with grounded hips on floor',
      iconType: 'sitting'
    },
    {
      key: 'heroicBattle',
      name: 'Action Pose',
      category: 'Action',
      description: 'Dynamic battle combat stance with ready fists',
      iconType: 'action'
    },
    {
      key: 'cutePeace',
      name: 'Happy',
      category: 'Expressive',
      description: 'Joyful double victory peace gesture with tilted head',
      iconType: 'expressive'
    },
    {
      key: 'casualStand',
      name: 'Casual Stance',
      category: 'Standing',
      description: 'Weight shift natural standing idle',
      iconType: 'standing'
    },
    {
      key: 'dynamicAction',
      name: 'Battle Stance',
      category: 'Action',
      description: 'Agile martial anime action ready pose',
      iconType: 'action'
    },
    {
      key: 'shyKawaii',
      name: 'Gentle Shy',
      category: 'Expressive',
      description: 'Gentle hands clasped forward stance',
      iconType: 'expressive'
    },
    {
      key: 'sittingChair',
      name: 'Sitting Chair',
      category: 'Sitting',
      description: 'Upright 90-degree chair seated pose',
      iconType: 'sitting'
    },
    {
      key: 'salute',
      name: 'Honor Salute',
      category: 'Standing',
      description: 'Formal military knight salute',
      iconType: 'standing'
    }
  ]

  // Dynamically generate animated poses from the animations manifest
  const manifestAnimatedPoses: DisplayPose[] = ANIMATIONS_MANIFEST.map(item => ({
    key: item.id,
    name: item.displayName,
    category: 'Animated' as const,
    description: item.description,
    iconType: item.category.toLowerCase().includes('run') || item.id.includes('run') ? 'action' : 'walking',
    isAnimated: true
  }))

  const displayPoses: DisplayPose[] = [
    // Manifest animated poses dynamically populated
    ...manifestAnimatedPoses,
    ...staticPoses
  ]

  const categories: PoseCategory[] = ['All', 'Animated', 'Standing', 'Action', 'Sitting', 'Expressive']

  const filteredPoses = displayPoses.filter(pose => {
    const matchesCategory =
      selectedCategory === 'All' ||
      pose.category === selectedCategory ||
      (selectedCategory === 'Animated' && pose.isAnimated) ||
      (selectedCategory === 'Action' && (pose.category === 'Action' || (pose.isAnimated && pose.iconType === 'action')))
    const matchesSearch = pose.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pose.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Stylized Pose Silhouette SVG
  const renderPoseThumbnail = (iconType: string, isSelected: boolean, isAnimated?: boolean) => {
    return (
      <div 
        className={`w-full h-16 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors ${
          isSelected 
            ? 'bg-gradient-to-b from-[#EC4899]/20 to-[#A855F7]/10' 
            : 'bg-[#181324] group-hover:bg-[#221B33]'
        }`}
      >
        {isAnimated && (
          <span className="absolute top-1 left-1.5 px-1 py-0.5 text-[8px] font-bold font-mono tracking-wider uppercase bg-[#EC4899]/20 text-[#EC4899] rounded border border-[#EC4899]/40 leading-none">
            ANIM
          </span>
        )}

        <svg 
          viewBox="0 0 40 50" 
          className={`w-8 h-10 transition-transform group-hover:scale-105 ${
            isSelected ? 'text-[#EC4899]' : 'text-[#8A81A6]'
          }`}
          fill="currentColor"
        >
          {iconType === 'standing' && (
            <g>
              <circle cx="20" cy="8" r="4.5" />
              <path d="M16 14 h8 v14 h-8 z" />
              <path d="M12 15 l3 11 l2 -1 l-3 -10 z" />
              <path d="M28 15 l-3 11 l-2 -1 l3 -10 z" />
              <path d="M17 28 h2.5 v17 h-2.5 z" />
              <path d="M20.5 28 h2.5 v17 h-2.5 z" />
            </g>
          )}
          {iconType === 'walking' && (
            <g>
              <circle cx="21" cy="7" r="4.5" />
              {/* Torso */}
              <path d="M18 13 h6.5 l-1.5 14 h-6.5 z" />
              {/* Forward Left Leg */}
              <path d="M17 26 l-6 9 l5 10 l3 -1 l-4 -9 l5 -9 z" />
              {/* Backward Right Leg */}
              <path d="M21 26 l7 9 l-2 10 l-3 -1 l2 -8 l-6 -10 z" />
              {/* Forward Right Arm */}
              <path d="M23 15 l6 7 l-4 6 l-2.5 -1.5 l3 -4.5 l-4.5 -5 z" />
              {/* Backward Left Arm */}
              <path d="M17 15 l-6 7 l3 6 l2.5 -1.5 l-2 -4.5 l4.5 -5 z" />
            </g>
          )}
          {iconType === 'action' && (
            <g>
              <circle cx="18" cy="8" r="4.5" />
              <path d="M15 14 l7 3 l-3 11 l-6 -4 z" />
              <path d="M12 18 l-6 4 l2 3 l5 -4 z" />
              <path d="M23 16 l8 -3 l2 3 l-7 4 z" />
              <path d="M15 28 l-5 13 l3 2 l6 -12 z" />
              <path d="M20 27 l8 14 l3 -2 l-8 -14 z" />
            </g>
          )}
          {iconType === 'sitting' && (
            <g>
              <circle cx="20" cy="12" r="4.5" />
              <path d="M17 18 h6 v12 h-6 z" />
              <path d="M15 19 l-3 8 l2 2 l3 -7 z" />
              <path d="M25 19 l3 8 l-2 2 l-3 -7 z" />
              <path d="M17 30 h10 v3 h-10 z" />
              <path d="M26 31 v11 h3 v-11 z" />
              <path d="M23 31 v11 h3 v-11 z" />
            </g>
          )}
          {iconType === 'expressive' && (
            <g>
              <circle cx="20" cy="8" r="4.5" />
              <path d="M16 14 h8 v14 h-8 z" />
              <path d="M14 16 l-4 -6 l3 -2 l3 6 z" />
              <path d="M26 16 l4 -6 l-3 -2 l-3 6 z" />
              <path d="M17 28 h2.5 v17 h-2.5 z" />
              <path d="M20.5 28 h2.5 v17 h-2.5 z" />
            </g>
          )}
        </svg>

        {isSelected && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#EC4899] flex items-center justify-center text-white">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      id="bottom-pose-library"
      className={className || "w-full h-full flex flex-col bg-[#1F1930] select-none overflow-hidden"}
    >
      {/* Top Header Bar */}
      <div className="h-11 px-4 border-b border-[#2E2548] flex items-center justify-between shrink-0 bg-[#1A1429]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EC4899]/15 border border-[#EC4899]/30 flex items-center justify-center text-[#EC4899]">
              <Move className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8F8FC]">
              Pose Library
            </h3>
          </div>

          <div className="h-4 w-px bg-[#2E2548]" />

          {/* Category Tabs */}
          <div className="flex items-center gap-1">
            {categories.map(cat => {
              const isActive = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#271F3D] text-[#EC4899] border border-[#EC4899]/40 shadow-sm'
                      : 'text-[#A09BB5] hover:text-white hover:bg-[#271F3D]/50'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Search Poses input */}
        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A81A6]" />
          <input
            type="text"
            placeholder="Search poses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-[#16121E] border border-[#2E2548] focus:border-[#EC4899] rounded-md text-xs text-[#F8F8FC] placeholder-[#706B85] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Horizontal Cards Scroller */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 custom-scrollbar">
        <div className="flex items-center gap-2.5 h-full">
          {filteredPoses.map(pose => {
            const isSelected = activePosePreset === pose.key

            return (
              <button
                key={pose.key}
                id={`pose-card-${pose.key}`}
                onClick={() => handleSelectPose(pose.key)}
                className={`group flex flex-col justify-between w-32 h-[120px] p-2 rounded-xl border shrink-0 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#271F3D] border-[#EC4899] shadow-lg shadow-[#EC4899]/15 ring-1 ring-[#EC4899]'
                    : 'bg-[#191426] border-[#2E2548] hover:bg-[#231C36] hover:border-[#3E325E]'
                }`}
                title={pose.description}
              >
                {renderPoseThumbnail(pose.iconType, isSelected, pose.isAnimated)}

                <div className="mt-1 min-w-0">
                  <div className={`text-[11px] font-bold truncate leading-tight ${
                    isSelected ? 'text-[#EC4899]' : 'text-[#F8F8FC] group-hover:text-white'
                  }`}>
                    {pose.name}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-[#8A81A6] uppercase font-mono">
                      {pose.category}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-[#EC4899] font-mono">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
