import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { 
  PanelId, 
  DockZone, 
  WorkspacePresetName, 
  WorkspaceLayout, 
  WORKSPACE_PRESETS, 
  BEGINNER_LAYOUT,
  PANEL_DEFINITIONS 
} from '../../types/workspace'

interface WorkspaceContextType {
  layout: WorkspaceLayout
  activePreset: WorkspacePresetName
  isFocusMode: boolean
  isCommandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  selectPreset: (preset: WorkspacePresetName) => void
  resetLayout: () => void
  saveCustomPreset: (name: string) => void
  deleteCustomPreset: (id: string) => void
  toggleFocusMode: () => void
  toggleMode: () => void
  toggleToolShelf: () => void
  openPanel: (panelId: PanelId, targetZone?: DockZone) => void
  closePanel: (panelId: PanelId) => void
  dockPanel: (panelId: PanelId, zone: DockZone, index?: number) => void
  undockPanel: (panelId: PanelId) => void
  toggleMaximizePanel: (panelId: PanelId | 'viewport') => void
  toggleCollapseZone: (zone: 'left' | 'right' | 'bottom') => void
  togglePinPanel: (panelId: PanelId) => void
  updateZoneSize: (zone: 'left' | 'right' | 'bottom', size: number) => void
  selectZoneTab: (zone: 'left' | 'right' | 'bottom', panelId: PanelId) => void
  updateFloatingRect: (panelId: PanelId, rect: { x: number; y: number; width: number; height: number; isMinimized?: boolean }) => void
  isDraggingPanel: PanelId | null
  setIsDraggingPanel: (panelId: PanelId | null) => void
  activeDropZone: DockZone | 'center' | null
  setActiveDropZone: (zone: DockZone | 'center' | null) => void
  resetDragState: () => void
  allPanelIds: PanelId[]
  openPanelIds: PanelId[]
}

const STORAGE_KEY = 'voomtoon_workspace_layout_v2'

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial state from storage or default preset
  const [layout, setLayout] = useState<WorkspaceLayout>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (
          parsed?.dockedPanels &&
          Array.isArray(parsed.dockedPanels.left) &&
          Array.isArray(parsed.dockedPanels.right) &&
          Array.isArray(parsed.dockedPanels.bottom) &&
          parsed?.activeTabs &&
          parsed?.floatingPanels &&
          typeof parsed.floatingPanels === 'object' &&
          !Array.isArray(parsed.floatingPanels)
        ) {
          return {
            ...WORKSPACE_PRESETS.animation,
            ...parsed,
            customPresets: Array.isArray(parsed.customPresets) ? parsed.customPresets : [],
            pinnedPanels: parsed.pinnedPanels || {},
            floatingPanels: parsed.floatingPanels || {},
            dockedPanels: {
              left: parsed.dockedPanels.left || [],
              right: parsed.dockedPanels.right || [],
              bottom: parsed.dockedPanels.bottom || []
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return WORKSPACE_PRESETS.animation
  })

  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [isDraggingPanel, setIsDraggingPanel] = useState<PanelId | null>(null)
  const [activeDropZone, setActiveDropZone] = useState<DockZone | 'center' | null>(null)

  // Full clean reset of all dragging state
  const resetDragState = useCallback(() => {
    setIsDraggingPanel(null)
    setActiveDropZone(null)
  }, [])

  // Safety fallback & global listeners:
  // When a panel drag is active, ensure ANY mouseup, pointerup, dragend, drop,
  // Escape keypress, or window blur reliably resets the drag state, even if the cursor
  // leaves the panel/window.
  useEffect(() => {
    if (!isDraggingPanel) return

    const handleGlobalDragEnd = () => {
      resetDragState()
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        resetDragState()
      }
    }

    // Attach to window in capture phase
    window.addEventListener('mouseup', handleGlobalDragEnd, true)
    window.addEventListener('pointerup', handleGlobalDragEnd, true)
    window.addEventListener('dragend', handleGlobalDragEnd, true)
    window.addEventListener('drop', handleGlobalDragEnd, true)
    window.addEventListener('keydown', handleGlobalKeyDown, true)
    window.addEventListener('blur', handleGlobalDragEnd)

    return () => {
      window.removeEventListener('mouseup', handleGlobalDragEnd, true)
      window.removeEventListener('pointerup', handleGlobalDragEnd, true)
      window.removeEventListener('dragend', handleGlobalDragEnd, true)
      window.removeEventListener('drop', handleGlobalDragEnd, true)
      window.removeEventListener('keydown', handleGlobalKeyDown, true)
      window.removeEventListener('blur', handleGlobalDragEnd)
    }
  }, [isDraggingPanel, resetDragState])

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
    } catch {
      // ignore
    }
  }, [layout])

  // Global Keyboard Shortcuts (Ctrl/Cmd + K, Ctrl/Cmd + Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
      // Cmd/Ctrl + Space -> Focus Mode (Toggle Viewport Maximize)
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault()
        toggleFocusMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [layout.maximizedPanelId])

  const selectPreset = (presetName: WorkspacePresetName) => {
    if (presetName === 'custom') return
    const target = WORKSPACE_PRESETS[presetName] || WORKSPACE_PRESETS.animation
    setLayout(prev => ({
      ...target,
      customPresets: prev.customPresets,
      mode: prev.mode
    }))
  }

  const resetLayout = () => {
    setLayout(prev => ({
      ...WORKSPACE_PRESETS.animation,
      customPresets: prev.customPresets,
      mode: prev.mode
    }))
  }

  const saveCustomPreset = (name: string) => {
    const id = `custom_${Date.now()}`
    setLayout(prev => ({
      ...prev,
      activePreset: 'custom',
      customPresets: [...prev.customPresets, { id, name, layout: { ...prev } }]
    }))
  }

  const deleteCustomPreset = (id: string) => {
    setLayout(prev => ({
      ...prev,
      customPresets: (prev.customPresets || []).filter(cp => cp.id !== id)
    }))
  }

  const toggleFocusMode = () => {
    setLayout(prev => ({
      ...prev,
      maximizedPanelId: prev.maximizedPanelId === 'viewport' ? null : 'viewport'
    }))
  }

  const toggleMode = () => {
    setLayout(prev => {
      const nextMode = prev.mode === 'pro' ? 'beginner' : 'pro'
      if (nextMode === 'beginner') {
        return {
          ...BEGINNER_LAYOUT,
          customPresets: prev.customPresets
        }
      } else {
        return {
          ...WORKSPACE_PRESETS.animation,
          customPresets: prev.customPresets,
          mode: 'pro'
        }
      }
    })
  }

  const toggleToolShelf = () => {
    setLayout(prev => ({
      ...prev,
      showToolShelf: !prev.showToolShelf
    }))
  }

  const openPanel = (panelId: PanelId, targetZone?: DockZone) => {
    const def = PANEL_DEFINITIONS[panelId]
    const zone = targetZone || def?.defaultZone || 'right'

    setLayout(prev => {
      // If already docked in left, right or bottom, simply activate that tab
      for (const z of ['left', 'right', 'bottom'] as const) {
        if (prev.dockedPanels[z].includes(panelId)) {
          return {
            ...prev,
            activeTabs: { ...prev.activeTabs, [z]: panelId },
            ...(z === 'left' ? { leftCollapsed: false } : {}),
            ...(z === 'right' ? { rightCollapsed: false } : {}),
            ...(z === 'bottom' ? { bottomCollapsed: false } : {})
          }
        }
      }

      // If already floating, bring to focus
      if (prev.floatingPanels[panelId]) {
        return {
          ...prev,
          floatingPanels: {
            ...prev.floatingPanels,
            [panelId]: { ...prev.floatingPanels[panelId]!, isMinimized: false }
          }
        }
      }

      // Dock into zone
      const updatedZone = [...prev.dockedPanels[zone], panelId]
      return {
        ...prev,
        dockedPanels: { ...prev.dockedPanels, [zone]: updatedZone },
        activeTabs: { ...prev.activeTabs, [zone]: panelId },
        ...(zone === 'left' ? { leftCollapsed: false } : {}),
        ...(zone === 'right' ? { rightCollapsed: false } : {}),
        ...(zone === 'bottom' ? { bottomCollapsed: false } : {})
      }
    })
  }

  const closePanel = (panelId: PanelId) => {
    setLayout(prev => {
      // Remove from docked zones
      const newDocked = {
        left: (prev.dockedPanels?.left || []).filter(p => p !== panelId),
        right: (prev.dockedPanels?.right || []).filter(p => p !== panelId),
        bottom: (prev.dockedPanels?.bottom || []).filter(p => p !== panelId)
      }

      // Remove from floating
      const newFloating = { ...prev.floatingPanels }
      delete newFloating[panelId]

      // Update active tabs if needed
      const newActiveTabs = { ...prev.activeTabs }
      if (prev.activeTabs.left === panelId) {
        newActiveTabs.left = newDocked.left[0] || ('characters' as PanelId)
      }
      if (prev.activeTabs.right === panelId) {
        newActiveTabs.right = newDocked.right[0] || ('inspector' as PanelId)
      }
      if (prev.activeTabs.bottom === panelId) {
        newActiveTabs.bottom = newDocked.bottom[0] || ('timeline' as PanelId)
      }

      return {
        ...prev,
        dockedPanels: newDocked,
        floatingPanels: newFloating,
        activeTabs: newActiveTabs,
        maximizedPanelId: prev.maximizedPanelId === panelId ? null : prev.maximizedPanelId
      }
    })
  }

  const dockPanel = (panelId: PanelId, zone: DockZone, index?: number) => {
    if (zone === 'floating' || zone === 'hidden') return

    setLayout(prev => {
      // Remove from existing docked zones
      const newDocked = {
        left: (prev.dockedPanels?.left || []).filter(p => p !== panelId),
        right: (prev.dockedPanels?.right || []).filter(p => p !== panelId),
        bottom: (prev.dockedPanels?.bottom || []).filter(p => p !== panelId)
      }

      // Remove from floating
      const newFloating = { ...prev.floatingPanels }
      delete newFloating[panelId]

      // Add to target zone
      const targetList = [...newDocked[zone]]
      if (typeof index === 'number' && index >= 0 && index <= targetList.length) {
        targetList.splice(index, 0, panelId)
      } else {
        targetList.push(panelId)
      }
      newDocked[zone] = targetList

      return {
        ...prev,
        dockedPanels: newDocked,
        floatingPanels: newFloating,
        activeTabs: { ...prev.activeTabs, [zone]: panelId },
        ...(zone === 'left' ? { leftCollapsed: false } : {}),
        ...(zone === 'right' ? { rightCollapsed: false } : {}),
        ...(zone === 'bottom' ? { bottomCollapsed: false } : {})
      }
    })
  }

  const undockPanel = (panelId: PanelId) => {
    setLayout(prev => {
      const newDocked = {
        left: (prev.dockedPanels?.left || []).filter(p => p !== panelId),
        right: (prev.dockedPanels?.right || []).filter(p => p !== panelId),
        bottom: (prev.dockedPanels?.bottom || []).filter(p => p !== panelId)
      }

      const defaultRect = {
        x: Math.max(80, window.innerWidth / 2 - 200),
        y: Math.max(100, window.innerHeight / 2 - 180),
        width: 380,
        height: 380,
        isMinimized: false
      }

      return {
        ...prev,
        dockedPanels: newDocked,
        floatingPanels: {
          ...prev.floatingPanels,
          [panelId]: defaultRect
        }
      }
    })
  }

  const toggleMaximizePanel = (panelId: PanelId | 'viewport') => {
    setLayout(prev => ({
      ...prev,
      maximizedPanelId: prev.maximizedPanelId === panelId ? null : panelId
    }))
  }

  const toggleCollapseZone = (zone: 'left' | 'right' | 'bottom') => {
    setLayout(prev => ({
      ...prev,
      ...(zone === 'left' ? { leftCollapsed: !prev.leftCollapsed } : {}),
      ...(zone === 'right' ? { rightCollapsed: !prev.rightCollapsed } : {}),
      ...(zone === 'bottom' ? { bottomCollapsed: !prev.bottomCollapsed } : {})
    }))
  }

  const togglePinPanel = (panelId: PanelId) => {
    setLayout(prev => ({
      ...prev,
      pinnedPanels: {
        ...prev.pinnedPanels,
        [panelId]: !prev.pinnedPanels[panelId]
      }
    }))
  }

  const updateZoneSize = (zone: 'left' | 'right' | 'bottom', size: number) => {
    setLayout(prev => ({
      ...prev,
      ...(zone === 'left' ? { leftWidth: size } : {}),
      ...(zone === 'right' ? { rightWidth: size } : {}),
      ...(zone === 'bottom' ? { bottomHeight: size } : {})
    }))
  }

  const selectZoneTab = (zone: 'left' | 'right' | 'bottom', panelId: PanelId) => {
    setLayout(prev => ({
      ...prev,
      activeTabs: {
        ...prev.activeTabs,
        [zone]: panelId
      }
    }))
  }

  const updateFloatingRect = (panelId: PanelId, rect: { x: number; y: number; width: number; height: number; isMinimized?: boolean }) => {
    setLayout(prev => ({
      ...prev,
      floatingPanels: {
        ...prev.floatingPanels,
        [panelId]: rect
      }
    }))
  }

  const allPanelIds = Object.keys(PANEL_DEFINITIONS) as PanelId[]

  const openPanelIds = [
    ...(layout.dockedPanels?.left || []),
    ...(layout.dockedPanels?.right || []),
    ...(layout.dockedPanels?.bottom || []),
    ...Object.keys(layout.floatingPanels || {}) as PanelId[]
  ]

  const isFocusMode = layout.maximizedPanelId === 'viewport'

  return (
    <WorkspaceContext.Provider
      value={{
        layout,
        activePreset: layout.activePreset,
        isFocusMode,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        selectPreset,
        resetLayout,
        saveCustomPreset,
        deleteCustomPreset,
        toggleFocusMode,
        toggleMode,
        toggleToolShelf,
        openPanel,
        closePanel,
        dockPanel,
        undockPanel,
        toggleMaximizePanel,
        toggleCollapseZone,
        togglePinPanel,
        updateZoneSize,
        selectZoneTab,
        updateFloatingRect,
        isDraggingPanel,
        setIsDraggingPanel,
        activeDropZone,
        setActiveDropZone,
        resetDragState,
        allPanelIds,
        openPanelIds
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return ctx
}
