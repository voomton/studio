import React, { useEffect, useCallback } from 'react'
import { DockZone, PanelId } from '../../types/workspace'
import { ArrowDown, ArrowLeft, ArrowRight, LayoutGrid, X } from 'lucide-react'

export interface DockingOverlayProps {
  isDragging?: boolean | PanelId | string | null
  activeDropZone?: DockZone | 'center' | null
  activeZone?: DockZone | 'center' | null // backwards compatibility
  onHoverZone?: (zone: DockZone | 'center' | null) => void
  onDrop?: (zone: DockZone | 'center') => void
  onClose?: () => void
}

export const DockingOverlay: React.FC<DockingOverlayProps> = ({
  isDragging,
  activeDropZone,
  activeZone,
  onHoverZone,
  onDrop,
  onClose
}) => {
  const currentActiveZone = activeDropZone ?? activeZone ?? null

  // Safety cleanup callback
  const handleCancel = useCallback(() => {
    onHoverZone?.(null)
    onClose?.()
  }, [onHoverZone, onClose])

  // Safety fallback 1: Global window listeners for mouseup, pointerup, dragend, and Escape key
  // This guarantees that if the mouse is released anywhere on screen or outside the window,
  // or if Escape is pressed, the overlay immediately clears.
  useEffect(() => {
    if (!isDragging) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleCancel()
      }
    }

    const handleGlobalEnd = () => {
      handleCancel()
    }

    // Capture phase listeners on window to ensure we catch every possible release
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('mouseup', handleGlobalEnd, true)
    window.addEventListener('pointerup', handleGlobalEnd, true)
    window.addEventListener('dragend', handleGlobalEnd, true)
    window.addEventListener('blur', handleGlobalEnd)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('mouseup', handleGlobalEnd, true)
      window.removeEventListener('pointerup', handleGlobalEnd, true)
      window.removeEventListener('dragend', handleGlobalEnd, true)
      window.removeEventListener('blur', handleGlobalEnd)
    }
  }, [isDragging, handleCancel])

  // REQUIREMENT 1: Only render when dragging is actively in progress
  if (!isDragging) {
    return null
  }

  const handleZoneSelect = (zone: DockZone | 'center') => {
    onDrop?.(zone)
    handleCancel()
  }

  return (
    <div
      id="docking-overlay-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-[2px] select-none transition-opacity duration-150 animate-in fade-in"
      // Safety fallback 2: Clicking or releasing anywhere on the backdrop immediately clears overlay
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault()
          e.stopPropagation()
          handleCancel()
        }
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          onHoverZone?.(null)
        }
      }}
      onDrop={(e) => {
        e.preventDefault()
        // If dropped outside any explicit button, cancel and clear
        if (e.target === e.currentTarget) {
          handleCancel()
        }
      }}
    >
      {/* Visual edge drop indicator previews when hovering over a zone */}
      {currentActiveZone === 'left' && (
        <div className="fixed left-0 top-11 bottom-0 w-80 bg-[#3B82F6]/20 border-r-2 border-[#3B82F6] pointer-events-none transition-all duration-150 flex items-center justify-center">
          <span className="text-xs font-black uppercase text-[#3B82F6] bg-[#12121D]/90 px-3 py-1.5 rounded-lg border border-[#3B82F6]/50 shadow-lg">
            Dock Left
          </span>
        </div>
      )}

      {currentActiveZone === 'right' && (
        <div className="fixed right-0 top-11 bottom-0 w-80 bg-[#3B82F6]/20 border-l-2 border-[#3B82F6] pointer-events-none transition-all duration-150 flex items-center justify-center">
          <span className="text-xs font-black uppercase text-[#3B82F6] bg-[#12121D]/90 px-3 py-1.5 rounded-lg border border-[#3B82F6]/50 shadow-lg">
            Dock Right
          </span>
        </div>
      )}

      {currentActiveZone === 'bottom' && (
        <div className="fixed left-0 right-0 bottom-0 h-64 bg-[#00E676]/20 border-t-2 border-[#00E676] pointer-events-none transition-all duration-150 flex items-center justify-center">
          <span className="text-xs font-black uppercase text-[#00E676] bg-[#12121D]/90 px-3 py-1.5 rounded-lg border border-[#00E676]/50 shadow-lg">
            Dock Bottom
          </span>
        </div>
      )}

      {/* Screen edge reactive drop zones so dragging toward any viewport edge activates docking */}
      {/* Left Edge Drop Zone */}
      <div
        className="fixed left-0 top-11 bottom-0 w-24 z-10"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onHoverZone?.('left')
        }}
        onDragEnter={() => onHoverZone?.('left')}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleZoneSelect('left')
        }}
      />

      {/* Right Edge Drop Zone */}
      <div
        className="fixed right-0 top-11 bottom-0 w-24 z-10"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onHoverZone?.('right')
        }}
        onDragEnter={() => onHoverZone?.('right')}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleZoneSelect('right')
        }}
      />

      {/* Bottom Edge Drop Zone */}
      <div
        className="fixed left-24 right-24 bottom-0 h-24 z-10"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onHoverZone?.('bottom')
        }}
        onDragEnter={() => onHoverZone?.('bottom')}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleZoneSelect('bottom')
        }}
      />

      {/* Central Visual Docking Compass */}
      <div
        id="docking-compass"
        className="relative z-20 w-80 rounded-2xl bg-[#12121D]/95 border border-[#2B2B3E] shadow-2xl p-4 flex flex-col items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Quick Dismiss Button */}
        <div className="w-full flex items-center justify-between pb-2.5 border-b border-[#222232] mb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5 text-[#00E676]" />
            <span className="text-[11px] font-black uppercase text-white tracking-wider">
              Docking Guide
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleCancel()
            }}
            title="Cancel docking (Esc)"
            className="p-1 rounded-md text-[#707085] hover:text-white hover:bg-[#20202E] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compass Button: TOP (Bottom Dock Quick Target) */}
        <button
          type="button"
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onHoverZone?.('bottom')
          }}
          onDragEnter={() => onHoverZone?.('bottom')}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleZoneSelect('bottom')
          }}
          onMouseEnter={() => onHoverZone?.('bottom')}
          onMouseLeave={() => onHoverZone?.(null)}
          onMouseUp={(e) => {
            e.stopPropagation()
            handleZoneSelect('bottom')
          }}
          onClick={(e) => {
            e.stopPropagation()
            handleZoneSelect('bottom')
          }}
          className={`w-32 py-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
            currentActiveZone === 'bottom'
              ? 'bg-[#00E676]/25 border-[#00E676] text-white shadow-lg shadow-[#00E676]/25 scale-105'
              : 'bg-[#181824] border-[#2A2A38] text-[#808095] hover:border-white hover:text-white'
          }`}
        >
          <ArrowDown className="w-4 h-4 mb-0.5 text-[#00E676]" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Bottom</span>
        </button>

        {/* MIDDLE ROW: LEFT, TAB IN (CENTER), RIGHT */}
        <div className="w-full flex items-center justify-between px-1 my-3">
          {/* LEFT */}
          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onHoverZone?.('left')
            }}
            onDragEnter={() => onHoverZone?.('left')}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleZoneSelect('left')
            }}
            onMouseEnter={() => onHoverZone?.('left')}
            onMouseLeave={() => onHoverZone?.(null)}
            onMouseUp={(e) => {
              e.stopPropagation()
              handleZoneSelect('left')
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleZoneSelect('left')
            }}
            className={`w-22 py-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
              currentActiveZone === 'left'
                ? 'bg-[#3B82F6]/25 border-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/25 scale-105'
                : 'bg-[#181824] border-[#2A2A38] text-[#808095] hover:border-white hover:text-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mb-0.5 text-[#3B82F6]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Left</span>
          </button>

          {/* TAB IN (CENTER) */}
          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onHoverZone?.('center')
            }}
            onDragEnter={() => onHoverZone?.('center')}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleZoneSelect('center')
            }}
            onMouseEnter={() => onHoverZone?.('center')}
            onMouseLeave={() => onHoverZone?.(null)}
            onMouseUp={(e) => {
              e.stopPropagation()
              handleZoneSelect('center')
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleZoneSelect('center')
            }}
            className={`w-22 py-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
              currentActiveZone === 'center'
                ? 'bg-[#10B981]/30 border-[#10B981] text-white shadow-lg shadow-[#10B981]/25 scale-105'
                : 'bg-[#20202E] border-[#343448] text-white hover:border-[#10B981]'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mb-0.5 text-[#10B981]" />
            <span className="text-[9px] font-black uppercase tracking-wider">Tab In</span>
          </button>

          {/* RIGHT */}
          <button
            type="button"
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onHoverZone?.('right')
            }}
            onDragEnter={() => onHoverZone?.('right')}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleZoneSelect('right')
            }}
            onMouseEnter={() => onHoverZone?.('right')}
            onMouseLeave={() => onHoverZone?.(null)}
            onMouseUp={(e) => {
              e.stopPropagation()
              handleZoneSelect('right')
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleZoneSelect('right')
            }}
            className={`w-22 py-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
              currentActiveZone === 'right'
                ? 'bg-[#3B82F6]/25 border-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/25 scale-105'
                : 'bg-[#181824] border-[#2A2A38] text-[#808095] hover:border-white hover:text-white'
            }`}
          >
            <ArrowRight className="w-4 h-4 mb-0.5 text-[#3B82F6]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Right</span>
          </button>
        </div>

        {/* BOTTOM HELPER & ESCAPE FALLBACK TEXT */}
        <div className="text-center pt-2 border-t border-[#1C1C28] w-full flex flex-col items-center gap-1">
          <span className="text-[10px] text-[#A0A0B5] font-mono">
            Release mouse over zone to dock panel
          </span>
          <span className="text-[9px] text-[#606075]">
            Click anywhere or press <kbd className="px-1 py-0.5 bg-[#20202E] border border-[#303042] rounded text-[#808095]">Esc</kbd> to cancel
          </span>
        </div>
      </div>
    </div>
  )
}
