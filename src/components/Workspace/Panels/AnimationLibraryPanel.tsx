import React, { useState } from 'react'
import { Clapperboard, Play, Plus, Search, Sparkles, Move, Zap, Music } from 'lucide-react'
import { VOOM_DRAG_TYPES, setDragData, DraggedAnimationPayload } from '../../../utils/dragDropAsset'
import { ClipType } from '../../../types/animation'

interface AnimationPresetItem {
  id: string
  name: string
  type: ClipType
  category: 'locomotion' | 'action' | 'social' | 'emotion'
  durationFrames: number
  description: string
  color: string
}

export const ANIMATION_PRESETS: AnimationPresetItem[] = [
  {
    id: 'anim_walk_cycle',
    name: 'Walk Cycle',
    type: 'walk',
    category: 'locomotion',
    durationFrames: 24,
    description: 'Smooth rhythmic forward walking loop',
    color: '#3B82F6'
  },
  {
    id: 'anim_run_sprint',
    name: 'Run Sprint',
    type: 'run',
    category: 'locomotion',
    durationFrames: 16,
    description: 'Energetic forward sprint with arm swings',
    color: '#10B981'
  },
  {
    id: 'anim_idle_breathe',
    name: 'Idle Breathing',
    type: 'idle',
    category: 'locomotion',
    durationFrames: 48,
    description: 'Natural chest rise and gentle hip sway',
    color: '#6366F1'
  },
  {
    id: 'anim_jump_leap',
    name: 'Jump & Land',
    type: 'jump',
    category: 'action',
    durationFrames: 32,
    description: 'Crouch anticipation, airborne leap and landing shock',
    color: '#F59E0B'
  },
  {
    id: 'anim_talk_gesture',
    name: 'Animated Talking',
    type: 'talk',
    category: 'social',
    durationFrames: 36,
    description: 'Expressive hand gestures and head emphasis',
    color: '#EC4899'
  },
  {
    id: 'anim_wave_hello',
    name: 'Friendly Wave',
    type: 'wave',
    category: 'social',
    durationFrames: 30,
    description: 'Raise right hand and cheerful side-to-side wave',
    color: '#8B5CF6'
  },
  {
    id: 'anim_attack_slash',
    name: 'Sword Slash Attack',
    type: 'attack',
    category: 'action',
    durationFrames: 28,
    description: 'Dynamic forward strike with dramatic follow-through',
    color: '#EF4444'
  },
  {
    id: 'anim_dance_pop',
    name: 'K-Pop Idol Dance',
    type: 'dance',
    category: 'action',
    durationFrames: 48,
    description: 'Upbeat rhythmic choreography loop',
    color: '#14B8A6'
  }
]

interface AnimationLibraryPanelProps {
  onApplyClip?: (preset: AnimationPresetItem) => void
  selectedCharacterName?: string
}

export const AnimationLibraryPanel: React.FC<AnimationLibraryPanelProps> = ({
  onApplyClip,
  selectedCharacterName
}) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'locomotion' | 'action' | 'social'>('all')

  const filtered = ANIMATION_PRESETS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white">
      {/* Top Search & Filter */}
      <div className="p-3 border-b border-[#1E1E26] space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#707080]" />
          <input
            type="text"
            placeholder="Search animations (e.g. walk, jump)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#14141C] border border-[#22222E] rounded-lg text-xs text-white placeholder-[#505060] focus:outline-none focus:border-[#10B981] transition-all"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'locomotion', 'action', 'social'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                  : 'bg-[#14141C] text-[#707080] hover:text-white border border-[#1E1E28]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Helper Banner */}
      <div className="px-3 py-2 bg-[#12121A] border-b border-[#1A1A24] flex items-center justify-between text-[10px] text-[#808095]">
        <span>Drag clip onto <b>Timeline Track</b> or <b>Character</b></span>
        <span className="font-mono text-[#10B981]">{filtered.length} clips</span>
      </div>

      {/* Animation Cards Grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {filtered.map(anim => (
          <div
            key={anim.id}
            draggable
            onDragStart={e => {
              const payload: DraggedAnimationPayload = {
                type: 'animation',
                clipId: anim.id,
                name: anim.name,
                clipType: anim.type,
                durationFrames: anim.durationFrames,
                color: anim.color
              }
              setDragData(e, VOOM_DRAG_TYPES.ANIMATION, payload)
            }}
            className="group relative p-2.5 rounded-xl border border-[#1E1E28] bg-[#14141C] hover:bg-[#181824] hover:border-[#353548] transition-all cursor-grab active:cursor-grabbing shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-inner"
                  style={{ backgroundColor: `${anim.color}25`, border: `1px solid ${anim.color}60`, color: anim.color }}
                >
                  <Clapperboard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#10B981] transition-colors flex items-center gap-1.5">
                    {anim.name}
                  </h4>
                  <p className="text-[10px] text-[#707080] leading-tight line-clamp-1 mt-0.5">
                    {anim.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1C1C28] text-[#9090A5] border border-[#252535]">
                  {anim.durationFrames}f
                </span>
                {onApplyClip && (
                  <button
                    onClick={() => onApplyClip(anim)}
                    title="Apply to character or current track"
                    className="p-1 rounded bg-[#1C1C28] hover:bg-[#10B981] hover:text-black text-[#A0A0B5] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-[#1C1C26] flex items-center justify-between text-[9px] text-[#606070]">
              <span className="uppercase tracking-wider font-semibold">{anim.category}</span>
              <span className="opacity-0 group-hover:opacity-100 text-[#10B981] font-mono transition-opacity">
                ⋮⋮ Drag to Timeline
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
