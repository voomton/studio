import React from 'react'
import { PanelLeft, PanelRight, PanelBottom, Layers } from 'lucide-react'

export type DockLocation = 'left' | 'right' | 'bottom' | 'floating'

interface SceneDockingOverlayProps {
  isDragging: boolean
  activeZone: DockLocation | null
  onHoverZone: (zone: DockLocation | null) => void
  onDropToZone: (zone: DockLocation) => void
}

export const SceneDockingOverlay: React.FC<SceneDockingOverlayProps> = ({
  isDragging,
  activeZone,
  onHoverZone,
  onDropToZone
}) => {
  if (!isDragging) return null

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-[#0E0A16]/50 backdrop-blur-xs flex items-center justify-center select-none">
      {/* Visual Guide Frame */}
      <div className="relative w-full h-full p-4 pointer-events-none">
        {/* Left Drop Target */}
        <div
          onDragOver={e => {
            e.preventDefault()
            onHoverZone('left')
          }}
          onDragLeave={() => onHoverZone(null)}
          onDrop={e => {
            e.preventDefault()
            onDropToZone('left')
          }}
          className={`absolute left-4 top-4 bottom-4 w-72 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 pointer-events-auto cursor-pointer ${
            activeZone === 'left'
              ? 'border-[#8C7BFF] bg-[#8C7BFF]/25 shadow-2xl shadow-[#8C7BFF]/40 scale-[1.01]'
              : 'border-[#4A3B6E]/70 bg-[#161224]/80 text-[#A09BB5] hover:border-[#8C7BFF]/60 hover:bg-[#1E1833]'
          }`}
        >
          <PanelLeft className={`w-8 h-8 ${activeZone === 'left' ? 'text-[#C4B5FD]' : 'text-[#8A81A6]'}`} />
          <span className="text-sm font-bold text-white">Dock Left</span>
          <span className="text-xs text-[#A09BB5]">Drop to place panel on the left side</span>
        </div>

        {/* Right Drop Target */}
        <div
          onDragOver={e => {
            e.preventDefault()
            onHoverZone('right')
          }}
          onDragLeave={() => onHoverZone(null)}
          onDrop={e => {
            e.preventDefault()
            onDropToZone('right')
          }}
          className={`absolute right-4 top-4 bottom-4 w-72 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 pointer-events-auto cursor-pointer ${
            activeZone === 'right'
              ? 'border-[#8C7BFF] bg-[#8C7BFF]/25 shadow-2xl shadow-[#8C7BFF]/40 scale-[1.01]'
              : 'border-[#4A3B6E]/70 bg-[#161224]/80 text-[#A09BB5] hover:border-[#8C7BFF]/60 hover:bg-[#1E1833]'
          }`}
        >
          <PanelRight className={`w-8 h-8 ${activeZone === 'right' ? 'text-[#C4B5FD]' : 'text-[#8A81A6]'}`} />
          <span className="text-sm font-bold text-white">Dock Right</span>
          <span className="text-xs text-[#A09BB5]">Drop to place panel on the right side</span>
        </div>

        {/* Bottom Drop Target */}
        <div
          onDragOver={e => {
            e.preventDefault()
            onHoverZone('bottom')
          }}
          onDragLeave={() => onHoverZone(null)}
          onDrop={e => {
            e.preventDefault()
            onDropToZone('bottom')
          }}
          className={`absolute left-80 right-80 bottom-4 h-36 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 pointer-events-auto cursor-pointer ${
            activeZone === 'bottom'
              ? 'border-[#8C7BFF] bg-[#8C7BFF]/25 shadow-2xl shadow-[#8C7BFF]/40 scale-[1.01]'
              : 'border-[#4A3B6E]/70 bg-[#161224]/80 text-[#A09BB5] hover:border-[#8C7BFF]/60 hover:bg-[#1E1833]'
          }`}
        >
          <PanelBottom className={`w-7 h-7 ${activeZone === 'bottom' ? 'text-[#C4B5FD]' : 'text-[#8A81A6]'}`} />
          <span className="text-sm font-bold text-white">Dock Bottom</span>
          <span className="text-xs text-[#A09BB5]">Drop to dock as bottom timeline / drawer</span>
        </div>

        {/* Center / Float Target */}
        <div
          onDragOver={e => {
            e.preventDefault()
            onHoverZone('floating')
          }}
          onDragLeave={() => onHoverZone(null)}
          onDrop={e => {
            e.preventDefault()
            onDropToZone('floating')
          }}
          className={`absolute left-80 right-80 top-16 bottom-44 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 pointer-events-auto cursor-pointer ${
            activeZone === 'floating'
              ? 'border-[#00E676] bg-[#00E676]/20 shadow-2xl scale-[1.01]'
              : 'border-[#3D3256]/60 bg-[#120F1A]/60 text-[#8A81A6] hover:border-[#8C7BFF]/50'
          }`}
        >
          <Layers className={`w-8 h-8 ${activeZone === 'floating' ? 'text-[#00E676]' : 'text-[#8A81A6]'}`} />
          <span className="text-sm font-bold text-white">Float Panel</span>
          <span className="text-xs text-[#A09BB5]">Detach and let panel float over the 3D viewport</span>
        </div>
      </div>
    </div>
  )
}
