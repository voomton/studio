import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Command, 
  ArrowRight, 
  Sliders, 
  Move, 
  Clapperboard, 
  Camera, 
  Sun, 
  Film, 
  Maximize2, 
  RotateCcw, 
  User, 
  Box, 
  Video, 
  Volume2,
  Sparkles,
  Layout
} from 'lucide-react'
import { PanelId, WorkspacePresetName } from '../../types/workspace'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  category: 'Actions' | 'Panels' | 'Animations' | 'Poses' | 'Presets' | 'Camera'
  icon: any
  action: () => void
  keywords?: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenPanel: (panelId: PanelId) => void
  onLoadPreset: (preset: WorkspacePresetName) => void
  onResetLayout: () => void
  onFocusViewport: () => void
  onFocusTimeline: () => void
  onAddCameraShot: () => void
  onAddProp: () => void
  onAddCharacter: () => void
  onTriggerRender: () => void
  onApplyAnimation: (clipType: string) => void
  onApplyPose: (poseKey: string) => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenPanel,
  onLoadPreset,
  onResetLayout,
  onFocusViewport,
  onFocusTimeline,
  onAddCameraShot,
  onAddProp,
  onAddCharacter,
  onTriggerRender,
  onApplyAnimation,
  onApplyPose
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands: CommandItem[] = [
    // Panels
    { id: 'p_timeline', title: 'Open Timeline Sequencer', category: 'Panels', icon: Film, action: () => onOpenPanel('timeline'), keywords: ['sequencer', 'tracks', 'keys'] },
    { id: 'p_graph', title: 'Open Graph Curve Editor', category: 'Panels', icon: Sliders, action: () => onOpenPanel('graph_editor'), keywords: ['bezier', 'curves', 'tangents'] },
    { id: 'p_dope', title: 'Open Dope Sheet Matrix', category: 'Panels', icon: Layout, action: () => onOpenPanel('dope_sheet'), keywords: ['matrix', 'timing', 'overview'] },
    { id: 'p_chars', title: 'Open Character Library', category: 'Panels', icon: User, action: () => onOpenPanel('characters'), keywords: ['avatar', 'vrm', 'models'] },
    { id: 'p_assets', title: 'Open Assets & Props Library', category: 'Panels', icon: Box, action: () => onOpenPanel('assets'), keywords: ['furniture', 'starter', 'glb'] },
    { id: 'p_scene', title: 'Open Scene Outliner', category: 'Panels', icon: Layout, action: () => onOpenPanel('scene'), keywords: ['hierarchy', 'tree', 'layers'] },
    { id: 'p_pose', title: 'Open Pose Library', category: 'Panels', icon: Move, action: () => onOpenPanel('pose'), keywords: ['stance', 'posture', 'rig'] },
    { id: 'p_anim', title: 'Open Animation Library', category: 'Panels', icon: Clapperboard, action: () => onOpenPanel('animation_library'), keywords: ['walk', 'run', 'jump', 'clips'] },
    { id: 'p_cam', title: 'Open Camera Shots', category: 'Panels', icon: Camera, action: () => onOpenPanel('camera'), keywords: ['cuts', 'fov', 'framing'] },
    { id: 'p_lights', title: 'Open Lighting Studio', category: 'Panels', icon: Sun, action: () => onOpenPanel('lights'), keywords: ['sun', 'neon', 'sunset'] },
    { id: 'p_audio', title: 'Open Audio & Lip Sync', category: 'Panels', icon: Volume2, action: () => onOpenPanel('audio'), keywords: ['voice', 'sound', 'viseme'] },
    { id: 'p_render', title: 'Open Render Settings', category: 'Panels', icon: Video, action: () => onOpenPanel('render'), keywords: ['export', 'movie', 'mp4', 'webm'] },

    // Actions
    { id: 'a_add_char', title: 'Add New Character to Scene', category: 'Actions', icon: User, action: onAddCharacter, keywords: ['spawn', 'character', 'create'] },
    { id: 'a_add_prop', title: 'Add Scene Prop Object', category: 'Actions', icon: Box, action: onAddProp, keywords: ['chair', 'table', 'lamp'] },
    { id: 'a_add_cam', title: 'Capture Current View as Camera Shot', category: 'Actions', icon: Camera, action: onAddCameraShot, keywords: ['save', 'cut', 'framing'] },
    { id: 'a_render_vid', title: 'Render Video Animation Sequence', category: 'Actions', icon: Video, action: onTriggerRender, keywords: ['export', 'movie', 'record'] },
    { id: 'a_focus_vp', title: 'Focus Mode: Maximize Viewport (Ctrl+Space)', category: 'Actions', icon: Maximize2, action: onFocusViewport, keywords: ['fullscreen', 'canvas'] },
    { id: 'a_focus_tl', title: 'Focus Mode: Maximize Timeline', category: 'Actions', icon: Film, action: onFocusTimeline, keywords: ['fullscreen', 'sequencer'] },
    { id: 'a_reset_layout', title: 'Reset Workspace to Default Layout', category: 'Actions', icon: RotateCcw, action: onResetLayout, keywords: ['restore', 'default', 'arrange'] },

    // Workspace Presets
    { id: 'preset_anim', title: 'Workspace Preset: Animation Layout', category: 'Presets', icon: Clapperboard, action: () => onLoadPreset('animation'), keywords: ['setup', 'workspace'] },
    { id: 'preset_char', title: 'Workspace Preset: Character Design Layout', category: 'Presets', icon: User, action: () => onLoadPreset('character'), keywords: ['body', 'face', 'outfit'] },
    { id: 'preset_cine', title: 'Workspace Preset: Cinematic Layout', category: 'Presets', icon: Camera, action: () => onLoadPreset('cinematic'), keywords: ['camera', 'cuts', 'lighting'] },
    { id: 'preset_audio', title: 'Workspace Preset: Audio & Lip Sync Layout', category: 'Presets', icon: Volume2, action: () => onLoadPreset('audio'), keywords: ['voice', 'sound'] },
    { id: 'preset_render', title: 'Workspace Preset: Movie Render Layout', category: 'Presets', icon: Video, action: () => onLoadPreset('render'), keywords: ['output', 'movie'] },

    // Quick Animations
    { id: 'anim_walk', title: 'Apply Animation: Walk Cycle', category: 'Animations', icon: Clapperboard, action: () => onApplyAnimation('walk'), keywords: ['motion', 'step'] },
    { id: 'anim_run', title: 'Apply Animation: Sprint Run', category: 'Animations', icon: Clapperboard, action: () => onApplyAnimation('run'), keywords: ['fast', 'motion'] },
    { id: 'anim_jump', title: 'Apply Animation: Jump & Land', category: 'Animations', icon: Clapperboard, action: () => onApplyAnimation('jump'), keywords: ['leap', 'air'] },
    { id: 'anim_talk', title: 'Apply Animation: Expressive Talk', category: 'Animations', icon: Clapperboard, action: () => onApplyAnimation('talk'), keywords: ['dialogue', 'gestures'] },

    // Quick Poses
    { id: 'pose_standing', title: 'Apply Pose: Natural Standing', category: 'Poses', icon: Move, action: () => onApplyPose('naturalStanding'), keywords: ['idle', 'default'] },
    { id: 'pose_peace', title: 'Apply Pose: Anime Peace Sign', category: 'Poses', icon: Move, action: () => onApplyPose('peaceSign'), keywords: ['cute', 'hand'] },
    { id: 'pose_hero', title: 'Apply Pose: Heroic Action Stance', category: 'Poses', icon: Move, action: () => onApplyPose('heroicAction'), keywords: ['fight', 'dynamic'] },
    { id: 'pose_sit', title: 'Apply Pose: Casual Sitting', category: 'Poses', icon: Move, action: () => onApplyPose('casualSitting'), keywords: ['chair', 'relax'] }
  ]

  const filtered = commands.filter(cmd => {
    const q = query.toLowerCase().trim()
    if (!q) return true
    const matchTitle = cmd.title.toLowerCase().includes(q)
    const matchCategory = cmd.category.toLowerCase().includes(q)
    const matchKeywords = cmd.keywords?.some(k => k.toLowerCase().includes(q))
    return matchTitle || matchCategory || matchKeywords
  })

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
      return
    }

    inputRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action()
          onClose()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 select-none animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#101018] border border-[#2B2B3E] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="p-3.5 border-b border-[#222234] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#808095]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search tools (e.g. 'camera', 'walk', 'timeline', 'layout')..."
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#555568] focus:outline-none"
          />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C1C28] text-[#808095] border border-[#262638]">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto p-2 custom-scrollbar space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#606070]">
              No matching commands or tools found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3B82F6] text-white shadow-md'
                      : 'text-[#C0C0D0] hover:bg-[#181824]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : 'bg-[#181826] text-[#808095]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-[#181826] text-[#707085]'}`}>
                      {item.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#505060]'}`} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-[#0C0C12] border-t border-[#1C1C28] flex items-center justify-between text-[10px] text-[#606070]">
          <span>Use <b>↑ ↓</b> to navigate, <b>Enter</b> to execute</span>
          <span className="font-mono">VoomToon Workstation</span>
        </div>
      </div>
    </div>
  )
}
