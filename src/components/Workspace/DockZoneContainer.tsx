import React, { useState, useRef, useEffect } from 'react'
import { PanelId, DockZone, PANEL_DEFINITIONS } from '../../types/workspace'
import { useWorkspace } from './WorkspaceContext'
import { PanelWrapper } from './PanelWrapper'
import { 
  X, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  GripVertical,
  Maximize2,
  Minimize2,
  FolderPlus
} from 'lucide-react'
import { VOOM_DRAG_TYPES, setDragData, getDragData, DraggedPanelPayload } from '../../utils/dragDropAsset'

interface DockZoneContainerProps {
  zone: 'left' | 'right' | 'bottom'
  dockedPanels: PanelId[]
  activeTab: PanelId
  size: number
  isCollapsed: boolean
  maximizedPanelId: PanelId | 'viewport' | null
  pinnedPanels: Partial<Record<PanelId, boolean>>
  allAvailablePanels: PanelId[]
  onSelectTab: (panelId: PanelId) => void
  onClosePanel: (panelId: PanelId) => void
  onDockPanel: (panelId: PanelId, targetZone: DockZone, index?: number) => void
  onUndockPanel: (panelId: PanelId) => void
  onToggleMaximize: (panelId: PanelId) => void
  onToggleCollapse: () => void
  onTogglePin: (panelId: PanelId) => void
  onResize: (newSize: number) => void
  renderPanelContent: (panelId: PanelId) => React.ReactNode
}

export const DockZoneContainer: React.FC<DockZoneContainerProps> = ({
  zone,
  dockedPanels = [],
  activeTab,
  size,
  isCollapsed,
  maximizedPanelId,
  pinnedPanels = {},
  allAvailablePanels = [],
  onSelectTab,
  onClosePanel,
  onDockPanel,
  onUndockPanel,
  onToggleMaximize,
  onToggleCollapse,
  onTogglePin,
  onResize,
  renderPanelContent
}) => {
  const { setIsDraggingPanel, resetDragState } = useWorkspace()
  const [isDraggingDivider, setIsDraggingDivider] = useState(false)
  const [isDragOverTabGroup, setIsDragOverTabGroup] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // Resizing logic
  const handleMouseDownDivider = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingDivider(true)

    const startX = e.clientX
    const startY = e.clientY
    const startSize = size

    const handleMouseMove = (moveEvent: MouseEvent) => {
      let delta = 0
      if (zone === 'left') {
        delta = moveEvent.clientX - startX
        const newSize = Math.max(220, Math.min(650, startSize + delta))
        onResize(newSize)
      } else if (zone === 'right') {
        delta = startX - moveEvent.clientX
        const newSize = Math.max(240, Math.min(680, startSize + delta))
        onResize(newSize)
      } else if (zone === 'bottom') {
        delta = startY - moveEvent.clientY
        const newSize = Math.max(160, Math.min(600, startSize + delta))
        onResize(newSize)
      }
    }

    const cleanupDivider = () => {
      setIsDraggingDivider(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', cleanupDivider)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', cleanupDivider)
    }

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        cleanupDivider()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', cleanupDivider)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', cleanupDivider)
  }

  // Handle double-click on resize divider to reset default
  const handleDoubleClickDivider = () => {
    if (zone === 'left') onResize(280)
    if (zone === 'right') onResize(340)
    if (zone === 'bottom') onResize(260)
  }

  // Close add menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false)
      }
    }
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddMenu])

  if (!dockedPanels || dockedPanels.length === 0) {
    return null
  }

  const effectiveActiveTab = dockedPanels.includes(activeTab) ? activeTab : dockedPanels[0]
  const isMaximized = maximizedPanelId === effectiveActiveTab

  const undockedPanels = (allAvailablePanels || []).filter(p => !(dockedPanels || []).includes(p))

  return (
    <div 
      style={{
        width: zone === 'bottom' ? '100%' : isCollapsed ? '36px' : `${size}px`,
        height: zone === 'bottom' ? (isCollapsed ? '36px' : `${size}px`) : '100%'
      }}
      className={`relative flex flex-col bg-[#0D0D12] select-none transition-all shrink-0 z-20 ${
        zone === 'left' ? 'border-r border-[#1E1E26]' :
        zone === 'right' ? 'border-l border-[#1E1E26]' :
        'border-t border-[#1E1E26]'
      }`}
    >
      {/* Tab Group Bar */}
      <div 
        onDragOver={e => {
          e.preventDefault()
          setIsDragOverTabGroup(true)
        }}
        onDragLeave={e => {
          if (e.currentTarget === e.target) {
            setIsDragOverTabGroup(false)
          }
        }}
        onDrop={e => {
          e.preventDefault()
          setIsDragOverTabGroup(false)
          const payload = getDragData<DraggedPanelPayload>(e, VOOM_DRAG_TYPES.PANEL)
          if (payload?.panelId) {
            onDockPanel(payload.panelId as PanelId, zone)
          }
          resetDragState()
        }}
        className={`h-9 px-1.5 bg-[#0A0A0E] border-b border-[#1E1E26] flex items-center justify-between overflow-x-auto custom-scrollbar shrink-0 transition-colors ${
          isDragOverTabGroup ? 'bg-[#10B981]/15 border-[#10B981]' : ''
        }`}
      >
        {/* Tabs List */}
        <div className="flex items-center gap-1 min-w-0">
          {dockedPanels.map((pid, idx) => {
            const def = PANEL_DEFINITIONS[pid]
            const isActive = pid === effectiveActiveTab

            return (
              <div
                key={pid}
                draggable
                onDragStart={e => {
                  const payload: DraggedPanelPayload = {
                    type: 'panel',
                    panelId: pid,
                    sourceZone: zone
                  }
                  setDragData(e, VOOM_DRAG_TYPES.PANEL, payload)
                  setIsDraggingPanel(pid)
                }}
                onDragEnd={() => {
                  resetDragState()
                }}
                onClick={() => onSelectTab(pid)}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                  isActive
                    ? 'bg-[#181824] text-white border border-[#2B2B3C] shadow-sm'
                    : 'text-[#707085] hover:text-[#C0C0D0] hover:bg-[#12121A]'
                }`}
              >
                <span className="truncate max-w-[120px]">{def?.shortLabel || pid}</span>

                {/* Close Tab Button */}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onClosePanel(pid)
                  }}
                  title="Close tab (Hide panel)"
                  className="p-0.5 rounded hover:bg-[#EF4444]/20 hover:text-[#EF4444] text-[#606070] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )
          })}

          {/* Add Tab Button Dropdown */}
          {undockedPanels.length > 0 && (
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setShowAddMenu(prev => !prev)}
                title="Dock another panel into this group"
                className="p-1 rounded text-[#606070] hover:text-white hover:bg-[#1A1A26] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {showAddMenu && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-[#14141E] border border-[#2B2B3E] rounded-xl shadow-2xl p-1 z-50 max-h-64 overflow-y-auto custom-scrollbar">
                  <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#707080]">
                    Dock to {zone}
                  </div>
                  {undockedPanels.map(p => {
                    const def = PANEL_DEFINITIONS[p]
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          onDockPanel(p, zone)
                          setShowAddMenu(false)
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#C0C0D0] hover:bg-[#20202E] hover:text-white flex items-center justify-between cursor-pointer"
                      >
                        <span>{def?.name || p}</span>
                        <Plus className="w-3 h-3 text-[#10B981]" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Corner: Collapse Zone Button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            className="p-1 rounded text-[#707080] hover:text-white hover:bg-[#1A1A26] transition-colors cursor-pointer"
          >
            {zone === 'left' ? (
              isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />
            ) : zone === 'right' ? (
              isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 min-w-0 relative">
          <PanelWrapper
            panelId={effectiveActiveTab}
            isMaximized={isMaximized}
            isPinned={Boolean(pinnedPanels[effectiveActiveTab])}
            sourceZone={zone}
            onToggleMaximize={() => onToggleMaximize(effectiveActiveTab)}
            onTogglePin={() => onTogglePin(effectiveActiveTab)}
            onFloat={() => onUndockPanel(effectiveActiveTab)}
            onClose={() => onClosePanel(effectiveActiveTab)}
          >
            {renderPanelContent(effectiveActiveTab)}
          </PanelWrapper>
        </div>
      )}

      {/* Resize Handle Divider */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDownDivider}
          onDoubleClick={handleDoubleClickDivider}
          title="Drag to resize, double-click to reset"
          className={`absolute z-30 transition-colors ${
            zone === 'left'
              ? 'top-0 right-[-3px] w-[6px] h-full cursor-col-resize hover:bg-[#3B82F6]'
              : zone === 'right'
              ? 'top-0 left-[-3px] w-[6px] h-full cursor-col-resize hover:bg-[#3B82F6]'
              : 'top-[-3px] left-0 w-full h-[6px] cursor-row-resize hover:bg-[#10B981]'
          } ${isDraggingDivider ? (zone === 'bottom' ? 'bg-[#10B981]' : 'bg-[#3B82F6]') : 'bg-transparent'}`}
        />
      )}
    </div>
  )
}
