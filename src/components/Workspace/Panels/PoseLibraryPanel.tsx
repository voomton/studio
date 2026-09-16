import React, { useState } from 'react'
import { Move, Plus, Search, Check, Sparkles, User, Zap } from 'lucide-react'
import { POSE_PRESETS, PosePreset } from '../../../utils/vrmManager'
import { VOOM_DRAG_TYPES, setDragData, DraggedPosePayload } from '../../../utils/dragDropAsset'

interface PoseLibraryPanelProps {
  onApplyPose?: (poseKey: string) => void
  onAddPoseKeyframe?: (poseKey: string) => void
  activePoseKey?: string
}

export const PoseLibraryPanel: React.FC<PoseLibraryPanelProps> = ({
  onApplyPose,
  onAddPoseKeyframe,
  activePoseKey
}) => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'standing' | 'animated' | 'action' | 'sitting' | 'expressive'>('all')

  const poseList = Object.entries(POSE_PRESETS).map(([key, preset]) => ({
    key,
    ...preset
  }))

  const filteredPoses = poseList.filter(pose => {
    const matchesSearch = pose.name.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filter === 'animated') return pose.key === 'walking' || pose.category === 'Animated'
    if (filter === 'standing') return pose.key.includes('Stand') || pose.key === 'tPose' || pose.key === 'idle' || pose.key === 'walking'
    if (filter === 'action') return pose.key.includes('Action') || pose.key.includes('Run') || pose.key.includes('Jump') || pose.key.includes('Walk')
    if (filter === 'sitting') return pose.key.includes('Sit')
    if (filter === 'expressive') return pose.key.includes('Peace') || pose.key.includes('Cute') || pose.key.includes('Point')
    return true
  })

  return (
    <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white">
      {/* Top Controls */}
      <div className="p-3 border-b border-[#1E1E26] space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#707080]" />
          <input
            type="text"
            placeholder="Search poses (e.g. idle, sit, fight)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#14141C] border border-[#22222E] rounded-lg text-xs text-white placeholder-[#505060] focus:outline-none focus:border-[#D32F2F] transition-all"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
          {(['all', 'standing', 'animated', 'action', 'sitting', 'expressive'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                filter === cat
                  ? 'bg-[#D32F2F]/20 text-[#D32F2F] border border-[#D32F2F]/40'
                  : 'bg-[#14141C] text-[#707080] hover:text-white border border-[#1E1E28]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="px-3 py-1.5 bg-[#121218] border-b border-[#1A1A24] flex items-center justify-between text-[10px] text-[#808095]">
        <span>Drag pose onto <b>Viewport Character</b> or <b>Timeline</b></span>
        <span className="font-mono text-[#D32F2F]">{filteredPoses.length} poses</span>
      </div>

      {/* Pose Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 custom-scrollbar">
        {filteredPoses.map(pose => {
          const isActive = activePoseKey === pose.key

          return (
            <div
              key={pose.key}
              draggable
              onDragStart={e => {
                const payload: DraggedPosePayload = {
                  type: 'pose',
                  poseKey: pose.key,
                  name: pose.name,
                  category: filter
                }
                setDragData(e, VOOM_DRAG_TYPES.POSE, payload)
              }}
              onClick={() => onApplyPose?.(pose.key)}
              className={`group relative p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-grab active:cursor-grabbing text-left ${
                isActive
                  ? 'bg-[#1F1418] border-[#D32F2F] shadow-md shadow-[#D32F2F]/20'
                  : 'bg-[#14141C] border-[#222230] hover:bg-[#1A1A26] hover:border-[#353548]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-[#20202E] flex items-center justify-center text-[#A0A0B5] group-hover:text-white group-hover:bg-[#D32F2F]/20 group-hover:text-[#D32F2F] transition-colors">
                  <Move className="w-3.5 h-3.5" />
                </div>
                {onAddPoseKeyframe && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onAddPoseKeyframe(pose.key)
                    }}
                    title="Keyframe this pose at current playhead"
                    className="p-1 rounded bg-[#1C1C28] hover:bg-[#D32F2F] hover:text-white text-[#808095] transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="mt-3">
                <span className="text-xs font-bold text-white block truncate group-hover:text-[#D32F2F] transition-colors">
                  {pose.name}
                </span>
                <span className="text-[9px] text-[#606070] font-mono block mt-0.5">
                  Preset Pose
                </span>
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-[#1C1C26] flex items-center justify-between text-[8px] text-[#555568]">
                <span>DRAG & DROP</span>
                <span className="group-hover:text-white transition-colors">⋮⋮</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
