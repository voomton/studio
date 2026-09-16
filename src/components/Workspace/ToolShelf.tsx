import React from 'react'
import { 
  Users, 
  Smile, 
  Sparkles, 
  Shirt, 
  Move, 
  Clapperboard, 
  Camera, 
  Sun, 
  Volume2, 
  TrendingUp, 
  Film, 
  Settings, 
  Box,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'
import { PanelId, PANEL_DEFINITIONS } from '../../types/workspace'

interface ToolShelfProps {
  isOpen: boolean
  onToggleOpen: () => void
  onOpenPanel: (panelId: PanelId) => void
  activePanelIds: PanelId[]
}

const TOOL_SHELF_ITEMS: Array<{ id: PanelId; label: string; icon: any; color: string }> = [
  { id: 'characters', label: 'Characters', icon: Users, color: '#D32F2F' },
  { id: 'assets', label: 'Assets & Props', icon: Box, color: '#3B82F6' },
  { id: 'scene', label: 'Scene Outliner', icon: Layers, color: '#6366F1' },
  { id: 'pose', label: 'Pose Library', icon: Move, color: '#EC4899' },
  { id: 'animation_library', label: 'Animations', icon: Clapperboard, color: '#10B981' },
  { id: 'face', label: 'Facial Expressions', icon: Smile, color: '#F59E0B' },
  { id: 'hair', label: 'Hair & Styling', icon: Sparkles, color: '#A855F7' },
  { id: 'outfit', label: 'Outfit & Clothing', icon: Shirt, color: '#06B6D4' },
  { id: 'camera', label: 'Camera Cuts', icon: Camera, color: '#38BDF8' },
  { id: 'lights', label: 'Studio Lights', icon: Sun, color: '#FBBF24' },
  { id: 'audio', label: 'Audio & Lip Sync', icon: Volume2, color: '#FB7185' },
  { id: 'timeline', label: 'Timeline Sequencer', icon: Film, color: '#10B981' },
  { id: 'graph_editor', label: 'Graph Curves', icon: TrendingUp, color: '#3B82F6' },
  { id: 'project_settings', label: 'Project Settings', icon: Settings, color: '#94A3B8' }
]

export const ToolShelf: React.FC<ToolShelfProps> = ({
  isOpen,
  onToggleOpen,
  onOpenPanel,
  activePanelIds
}) => {
  return (
    <aside 
      className={`h-full bg-[#0A0A0E] border-r border-[#1E1E26] flex flex-col justify-between items-center py-2 select-none z-30 transition-all shrink-0 ${
        isOpen ? 'w-11' : 'w-2'
      }`}
    >
      {isOpen ? (
        <>
          {/* Tool icons list */}
          <div className="flex flex-col items-center gap-1 w-full px-1">
            {TOOL_SHELF_ITEMS.map(item => {
              const Icon = item.icon
              const isOpenNow = activePanelIds.includes(item.id)

              return (
                <button
                  key={item.id}
                  onClick={() => onOpenPanel(item.id)}
                  title={`${item.label} (Click to open)`}
                  className={`group relative w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    isOpenNow
                      ? 'bg-[#1E1E2C] text-white shadow-sm border border-[#2F2F45]'
                      : 'text-[#68687A] hover:text-white hover:bg-[#151520]'
                  }`}
                >
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: isOpenNow ? item.color : undefined }} />

                  {/* Active dot */}
                  {isOpenNow && (
                    <span 
                      className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-2 rounded-r-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}

                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#14141E] border border-[#2B2B3E] rounded-md text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-xl transition-opacity">
                    {item.label}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Toggle button */}
          <button
            onClick={onToggleOpen}
            title="Collapse Tool Shelf"
            className="w-7 h-7 rounded-lg text-[#606070] hover:text-white hover:bg-[#181824] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <button
          onClick={onToggleOpen}
          title="Expand Tool Shelf"
          className="w-full h-full flex items-center justify-center text-[#555565] hover:text-white hover:bg-[#181824] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </aside>
  )
}
