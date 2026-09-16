import React, { useState, useRef, useEffect } from 'react'
import { PanelId, PANEL_DEFINITIONS, DockZone } from '../../types/workspace'
import { 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  GripHorizontal, 
  Pin, 
  PinOff,
  CornerDownLeft
} from 'lucide-react'

interface FloatingPanelProps {
  panelId: PanelId
  rect: { x: number; y: number; width: number; height: number; isMinimized?: boolean }
  isPinned?: boolean
  onUpdateRect: (rect: { x: number; y: number; width: number; height: number; isMinimized?: boolean }) => void
  onDock: (zone: DockZone) => void
  onClose: () => void
  onTogglePin?: () => void
  children: React.ReactNode
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  panelId,
  rect,
  isPinned = false,
  onUpdateRect,
  onDock,
  onClose,
  onTogglePin,
  children
}) => {
  const panelDef = PANEL_DEFINITIONS[panelId]
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dockSnapGuide, setDockSnapGuide] = useState<DockZone | null>(null)

  // Dragging logic
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startPosX = rect.x
    const startPosY = rect.y

    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startMouseX
      const deltaY = ev.clientY - startMouseY
      const newX = Math.max(10, Math.min(window.innerWidth - 100, startPosX + deltaX))
      const newY = Math.max(50, Math.min(window.innerHeight - 80, startPosY + deltaY))

      // Check snap zones
      if (newX < 60) {
        setDockSnapGuide('left')
      } else if (newX + rect.width > window.innerWidth - 60) {
        setDockSnapGuide('right')
      } else if (newY + rect.height > window.innerHeight - 60) {
        setDockSnapGuide('bottom')
      } else {
        setDockSnapGuide(null)
      }

      onUpdateRect({
        ...rect,
        x: newX,
        y: newY
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleMouseUp)

      if (dockSnapGuide) {
        onDock(dockSnapGuide)
        setDockSnapGuide(null)
      }
    }

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsDragging(false)
        setDockSnapGuide(null)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('blur', handleMouseUp)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleMouseUp)
  }

  // Resizing logic from bottom-right corner
  const handleMouseDownCorner = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startW = rect.width
    const startH = rect.height

    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startMouseX
      const deltaY = ev.clientY - startMouseY
      const newW = Math.max(220, Math.min(800, startW + deltaX))
      const newH = Math.max(160, Math.min(600, startH + deltaY))

      onUpdateRect({
        ...rect,
        width: newW,
        height: newH
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleMouseUp)
    }

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsResizing(false)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('blur', handleMouseUp)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleMouseUp)
  }

  return (
    <>
      {/* Snap guide preview border */}
      {dockSnapGuide && (
        <div 
          className={`fixed pointer-events-none z-40 bg-[#00E676]/10 border-2 border-dashed border-[#00E676] animate-pulse rounded-xl ${
            dockSnapGuide === 'left' ? 'left-0 top-14 w-72 h-[calc(100vh-56px)]' :
            dockSnapGuide === 'right' ? 'right-0 top-14 w-80 h-[calc(100vh-56px)]' :
            'bottom-0 left-0 w-full h-64'
          }`}
        />
      )}

      <div
        style={{
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: rect.isMinimized ? '38px' : `${rect.height}px`
        }}
        className={`fixed z-40 rounded-xl bg-[#0D0D14] border border-[#2B2B3E] shadow-2xl flex flex-col overflow-hidden select-none transition-shadow ${
          isDragging ? 'shadow-[#00E676]/20 border-[#00E676]/50' : 'shadow-black/70'
        }`}
      >
        {/* Titlebar */}
        <div
          onMouseDown={handleMouseDownHeader}
          className="h-9 px-3 bg-[#151522] border-b border-[#252538] flex items-center justify-between cursor-move shrink-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <GripHorizontal className="w-3.5 h-3.5 text-[#606075]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
              {panelDef?.name || panelId}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0" onMouseDown={e => e.stopPropagation()}>
            {onTogglePin && (
              <button
                onClick={onTogglePin}
                title={isPinned ? 'Unpin' : 'Pin'}
                className="p-1 rounded text-[#707085] hover:text-white cursor-pointer"
              >
                {isPinned ? <Pin className="w-3 h-3 text-[#00E676]" /> : <PinOff className="w-3 h-3 text-[#707085]" />}
              </button>
            )}

            {/* Dock back to default zone */}
            <button
              onClick={() => onDock(panelDef?.defaultZone || 'right')}
              title={`Dock back to ${panelDef?.defaultZone || 'panel'}`}
              className="p-1 rounded text-[#707085] hover:text-white hover:bg-[#222234] cursor-pointer"
            >
              <CornerDownLeft className="w-3 h-3" />
            </button>

            {/* Minimize */}
            <button
              onClick={() => onUpdateRect({ ...rect, isMinimized: !rect.isMinimized })}
              title={rect.isMinimized ? 'Expand' : 'Minimize'}
              className="p-1 rounded text-[#707085] hover:text-white hover:bg-[#222234] cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close window"
              className="p-1 rounded text-[#707085] hover:text-[#EF4444] hover:bg-[#EF4444]/15 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Window Content */}
        {!rect.isMinimized && (
          <div className="flex-1 relative overflow-hidden min-h-0">
            {children}

            {/* Resize Grip Corner */}
            <div
              onMouseDown={handleMouseDownCorner}
              title="Resize window"
              className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize z-50 flex items-center justify-center text-[#555568] hover:text-white"
            >
              <svg viewBox="0 0 6 6" className="w-2.5 h-2.5 fill-current">
                <path d="M6 6H4V4H6V6ZM6 2H4V0H6V2ZM2 6H0V4H2V6Z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
