import React from 'react'
import { 
  GripVertical, 
  Maximize2, 
  Minimize2, 
  X, 
  Pin, 
  PinOff, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Minus,
  Square
} from 'lucide-react'
import { PanelId, PANEL_DEFINITIONS } from '../../types/workspace'
import { VOOM_DRAG_TYPES, setDragData, DraggedPanelPayload } from '../../utils/dragDropAsset'
import { useWorkspace } from './WorkspaceContext'

interface PanelWrapperProps {
  panelId: PanelId
  title?: string
  icon?: React.ReactNode
  badge?: string | number
  isMaximized?: boolean
  isPinned?: boolean
  isCollapsed?: boolean
  canFloat?: boolean
  canClose?: boolean
  onToggleMaximize?: () => void
  onTogglePin?: () => void
  onToggleCollapse?: () => void
  onFloat?: () => void
  onClose?: () => void
  sourceZone?: 'left' | 'right' | 'bottom' | 'floating'
  children: React.ReactNode
  headerActions?: React.ReactNode
}

export const PanelWrapper: React.FC<PanelWrapperProps> = ({
  panelId,
  title,
  icon,
  badge,
  isMaximized = false,
  isPinned = false,
  isCollapsed = false,
  canFloat = true,
  canClose = true,
  onToggleMaximize,
  onTogglePin,
  onToggleCollapse,
  onFloat,
  onClose,
  sourceZone,
  children,
  headerActions
}) => {
  const { setIsDraggingPanel, resetDragState } = useWorkspace()
  const panelDef = PANEL_DEFINITIONS[panelId]
  const displayTitle = title || panelDef?.name || panelId

  return (
    <div className={`flex flex-col h-full w-full bg-[#0D0D12] select-none min-h-0 min-w-0 ${isCollapsed ? 'h-auto' : ''}`}>
      {/* Panel Header */}
      <div 
        draggable
        onDragStart={e => {
          const payload: DraggedPanelPayload = {
            type: 'panel',
            panelId,
            sourceZone
          }
          setDragData(e, VOOM_DRAG_TYPES.PANEL, payload)
          setIsDraggingPanel(panelId)
        }}
        onDragEnd={() => {
          resetDragState()
        }}
        onDoubleClick={onToggleMaximize}
        className="h-9 px-2.5 bg-[#12121A] border-b border-[#1E1E28] flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing hover:bg-[#151522] transition-colors"
        title="Double-click to Maximize/Restore, or drag header to relocate panel"
      >
        {/* Left: Drag Handle & Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="text-[#555568] hover:text-[#A0A0B5] transition-colors cursor-grab active:cursor-grabbing">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {icon && (
            <div className="text-[#A0A0B5] flex items-center">
              {icon}
            </div>
          )}

          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D0D0DC] truncate">
            {displayTitle}
          </span>

          {badge !== undefined && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#20202E] text-[#808095] border border-[#2B2B3C]">
              {badge}
            </span>
          )}
        </div>

        {/* Right: Header Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          {headerActions}

          {/* Pin/Unpin */}
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              title={isPinned ? 'Unpin Panel (Make Temporary)' : 'Pin Panel (Keep Open)'}
              className={`p-1 rounded text-[#707085] hover:text-white transition-colors cursor-pointer ${
                isPinned ? 'text-[#00E676] bg-[#00E676]/10' : 'hover:bg-[#20202C]'
              }`}
            >
              {isPinned ? <Pin className="w-3 h-3 text-[#00E676]" /> : <PinOff className="w-3 h-3" />}
            </button>
          )}

          {/* Undock to Floating */}
          {canFloat && onFloat && (
            <button
              onClick={onFloat}
              title="Undock into Floating Window"
              className="p-1 rounded text-[#707085] hover:text-white hover:bg-[#20202C] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {/* Collapse/Expand */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
              className="p-1 rounded text-[#707085] hover:text-white hover:bg-[#20202C] transition-colors cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
          )}

          {/* Maximize/Restore */}
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              title={isMaximized ? 'Restore Original Layout (Double-click)' : 'Maximize Panel (Double-click)'}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isMaximized 
                  ? 'text-[#00E676] bg-[#00E676]/15 hover:bg-[#00E676]/25' 
                  : 'text-[#707085] hover:text-white hover:bg-[#20202C]'
              }`}
            >
              {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}

          {/* Close */}
          {canClose && onClose && (
            <button
              onClick={onClose}
              title="Close Panel"
              className="p-1 rounded text-[#707085] hover:text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">
          {children}
        </div>
      )}
    </div>
  )
}
