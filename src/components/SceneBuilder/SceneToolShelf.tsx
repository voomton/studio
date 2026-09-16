import React from 'react'
import { 
  Box, 
  Users, 
  Film, 
  Sun, 
  Camera, 
  Activity, 
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2
} from 'lucide-react'

export type ToolShelfId = 'assets' | 'characters' | 'scenes' | 'lights' | 'camera' | 'animation' | 'effects'

interface SceneToolShelfProps {
  activeTool: ToolShelfId
  isLeftCollapsed: boolean
  onSelectTool: (tool: ToolShelfId) => void
  onToggleLeftCollapse: () => void
  isMaximizedViewport: boolean
  onToggleMaximizeViewport: () => void
}

export const SceneToolShelf: React.FC<SceneToolShelfProps> = ({
  activeTool,
  isLeftCollapsed,
  onSelectTool,
  onToggleLeftCollapse,
  isMaximizedViewport,
  onToggleMaximizeViewport
}) => {
  const tools: Array<{ id: ToolShelfId; label: string; icon: React.ComponentType<{ className?: string }>; shortcut?: string }> = [
    { id: 'assets', label: 'Assets', icon: Box, shortcut: 'A' },
    { id: 'characters', label: 'Characters', icon: Users, shortcut: 'C' },
    { id: 'scenes', label: 'Scenes', icon: Film, shortcut: 'S' },
    { id: 'lights', label: 'Lights', icon: Sun, shortcut: 'L' },
    { id: 'camera', label: 'Camera', icon: Camera, shortcut: '0' },
    { id: 'animation', label: 'Animation', icon: Activity, shortcut: 'Space' },
    { id: 'effects', label: 'Effects', icon: Sparkles, shortcut: 'E' },
  ]

  return (
    <div className="w-13 shrink-0 h-full bg-[#100D18] border-r border-[#241C36] flex flex-col items-center py-2 z-30 select-none justify-between">
      {/* Top tool buttons */}
      <div className="w-full flex flex-col items-center gap-1.5 px-1.5">
        {tools.map(tool => {
          const Icon = tool.icon
          const isActive = !isLeftCollapsed && activeTool === tool.id
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-[#8C7BFF]/25 border border-[#8C7BFF] text-white shadow-sm shadow-[#8C7BFF]/30'
                  : 'text-[#9A94AF] hover:text-white hover:bg-[#1F192F] border border-transparent'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#C4B5FD]' : ''}`} />
              <span className="text-[9px] font-semibold mt-0.5 tracking-tight leading-none truncate max-w-full">
                {tool.label}
              </span>

              {/* Active Indicator Bar on Left */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#8C7BFF]" />
              )}

              {/* Hover Tooltip */}
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#1A1528] border border-[#3A2F5A] text-white text-xs font-semibold rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-2">
                <span>{tool.label}</span>
                {tool.shortcut && (
                  <kbd className="px-1.5 py-0.5 rounded bg-[#2A2242] text-[10px] text-[#A09BB5] font-mono">
                    {tool.shortcut}
                  </kbd>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Bottom utility buttons: Toggle Sidebar Collapse & Maximize Viewport */}
      <div className="w-full flex flex-col items-center gap-1.5 px-1.5 pt-2 border-t border-[#241C36]/80">
        {/* Toggle Left Collapse Button */}
        <button
          onClick={onToggleLeftCollapse}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#9A94AF] hover:text-white hover:bg-[#1F192F] transition-all cursor-pointer group relative"
          title={isLeftCollapsed ? 'Expand Left Panel (Alt+1)' : 'Collapse Left Panel (Alt+1)'}
        >
          {isLeftCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 group-hover:text-[#8C7BFF] transition-colors" />
          ) : (
            <PanelLeftClose className="w-4 h-4 group-hover:text-[#8C7BFF] transition-colors" />
          )}
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1528] border border-[#3A2F5A] text-white text-xs rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            {isLeftCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          </div>
        </button>

        {/* Maximize Viewport Toggle Button */}
        <button
          onClick={onToggleMaximizeViewport}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
            isMaximizedViewport 
              ? 'bg-[#00E676]/20 border border-[#00E676]/60 text-[#00E676]' 
              : 'text-[#9A94AF] hover:text-white hover:bg-[#1F192F] border border-transparent'
          }`}
          title="Toggle Full Viewport Mode (Ctrl+Space)"
        >
          {isMaximizedViewport ? (
            <Minimize2 className="w-4 h-4 text-[#00E676]" />
          ) : (
            <Maximize2 className="w-4 h-4 group-hover:text-[#8C7BFF] transition-colors" />
          )}
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1528] border border-[#3A2F5A] text-white text-xs rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            {isMaximizedViewport ? 'Restore Viewport' : 'Maximize Viewport'}
          </div>
        </button>
      </div>
    </div>
  )
}
