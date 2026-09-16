import React, { useEffect, useState, useRef, useCallback } from 'react'
import { VRMViewport3D, VRMViewportHandle } from '../VRMViewport3D'
import { SceneLeftSidebar } from './SceneLeftSidebar'
import { SceneRightSidebar, RightSidebarTab } from './SceneRightSidebar'
import { SceneBottomDrawer } from './SceneBottomDrawer'
import { SceneViewportChrome } from './SceneViewportChrome'
import { SceneToolShelf, ToolShelfId } from './SceneToolShelf'
import { SceneDockingOverlay, DockLocation } from './SceneDockingOverlay'
import { 
  SceneCharacterInstance, 
  SceneProp, 
  SceneCameraShot, 
  SceneEntitySelection,
  GizmoMode,
  GizmoSpace
} from '../../types/scene'
import { SavedCharacterRecord, VRMAvatarState, DEFAULT_AVATAR_STATE } from '../../utils/vrmManager'
import { SceneErrorBoundary } from './SceneErrorBoundary'

interface SceneBuilderLayoutProps {
  viewportRef: React.RefObject<VRMViewportHandle>
  vrm: any | null
  avatarState: VRMAvatarState | null
  onAvatarStateChange: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
  characterList: SavedCharacterRecord[]
  activeCharacterId: string
  sceneCharacters: SceneCharacterInstance[]
  sceneProps: SceneProp[]
  selectedEntity: SceneEntitySelection
  onSelectEntity: (selection: SceneEntitySelection) => void
  selectedPropId: string | null
  onSelectProp: (id: string | null) => void
  gizmoMode: GizmoMode
  gizmoSpace: GizmoSpace
  onGizmoModeChange: (mode: GizmoMode) => void
  onGizmoSpaceChange: (space: GizmoSpace) => void
  cameraShots: SceneCameraShot[]
  activeCameraShotId: string | null
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onSaveCurrentCameraView: (name?: string) => void
  onDeleteCameraShot: (shotId: string) => void
  onOverwriteCameraShot: (shotId: string) => void
  onRenameCameraShot: (shotId: string, newName: string) => void
  onResetToDefaultCameraView: () => void
  onUpdateCameraPosition: (shotId: string, newPosition: [number, number, number]) => void
  onAddCamera?: () => void
  onUpdateCameraShot?: (shotId: string, updates: Partial<SceneCameraShot>) => void
  onAddCharacterToScene: (charRecord: SavedCharacterRecord) => void
  onDuplicateCharacter: (charId: string) => void
  onDeleteCharacter: (sceneCharId: string) => void
  onToggleCharacterVisibility: (charId: string) => void
  onToggleCharacterLock: (charId: string) => void
  onAddStarterProp: (presetId: string) => void
  onUploadCustomProp: (file: File) => void
  onDeleteProp: (propId: string) => void
  onUpdatePropTransform: (id: string, updates: any) => void
  onUpdateCharacterTransform: (id: string, updates: any) => void
  onApplyClipToCharacter: (charId: string, clip: any) => void
  onApplyPosePreset: (presetKey: string) => void
  isLoadingVRM?: boolean
  loadingProgress?: number
  onDropAsset?: (type: string, payload: any, worldPos: [number, number, number]) => void
  onClearScene?: () => void
  spawnPlacementPoint?: [number, number, number] | null
  onSetSpawnPlacementPoint?: (pt: [number, number, number] | null) => void
}

const STORAGE_LEFT_WIDTH = 'voomtoon_scene_left_width'
const STORAGE_RIGHT_WIDTH = 'voomtoon_scene_right_width'
const STORAGE_BOTTOM_HEIGHT = 'voomtoon_scene_bottom_height'
const STORAGE_BOTTOM_COLLAPSED = 'voomtoon_scene_bottom_collapsed'

export const SceneBuilderLayout: React.FC<SceneBuilderLayoutProps> = ({
  viewportRef,
  vrm,
  avatarState,
  onAvatarStateChange,
  characterList,
  activeCharacterId,
  sceneCharacters,
  sceneProps,
  selectedEntity,
  onSelectEntity,
  selectedPropId,
  onSelectProp,
  gizmoMode,
  gizmoSpace,
  onGizmoModeChange,
  onGizmoSpaceChange,
  cameraShots,
  activeCameraShotId,
  onApplyCameraShot,
  onSaveCurrentCameraView,
  onDeleteCameraShot,
  onOverwriteCameraShot,
  onRenameCameraShot,
  onResetToDefaultCameraView,
  onUpdateCameraPosition,
  onAddCamera,
  onUpdateCameraShot,
  onAddCharacterToScene,
  onDuplicateCharacter,
  onDeleteCharacter,
  onToggleCharacterVisibility,
  onToggleCharacterLock,
  onAddStarterProp,
  onUploadCustomProp,
  onDeleteProp,
  onUpdatePropTransform,
  onUpdateCharacterTransform,
  onApplyClipToCharacter,
  onApplyPosePreset,
  isLoadingVRM,
  loadingProgress,
  onDropAsset,
  onClearScene,
  spawnPlacementPoint = null,
  onSetSpawnPlacementPoint
}) => {
  // Panel dimensions (with localStorage persistence)
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_LEFT_WIDTH)
    return saved ? Math.max(220, Math.min(550, parseInt(saved, 10))) : 270
  })

  const [rightWidth, setRightWidth] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_RIGHT_WIDTH)
    return saved ? Math.max(240, Math.min(550, parseInt(saved, 10))) : 290
  })

  const [bottomHeight, setBottomHeight] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_BOTTOM_HEIGHT)
    return saved ? Math.max(120, Math.min(420, parseInt(saved, 10))) : 140
  })

  // Collapsed & Maximized states
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  const [isBottomCollapsed, setIsBottomCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_BOTTOM_COLLAPSED)
    // Default to collapsed (true) so the central 3D Viewport has maximum vertical space
    return saved !== null ? saved === 'true' : true
  })
  const [isMaximizedViewport, setIsMaximizedViewport] = useState(false)

  // Active tab selections
  const [activeLeftTab, setActiveLeftTab] = useState<'characters' | 'assets' | 'scenes'>('assets')
  const [activeRightTab, setActiveRightTab] = useState<RightSidebarTab>('scene_tree')
  const [activeTool, setActiveTool] = useState<ToolShelfId>('assets')

  // Drag and drop panel docking overlay
  const [isDraggingPanel, setIsDraggingPanel] = useState(false)
  const [activeDropZone, setActiveDropZone] = useState<DockLocation | null>(null)

  // Viewport overlays
  const [showGrid, setShowGrid] = useState(true)
  const [zoomPercent, setZoomPercent] = useState<number>(100)

  // Resizing state
  const isResizingLeft = useRef(false)
  const isResizingRight = useRef(false)
  const isResizingBottom = useRef(false)

  // Auto-select first character on mount if none selected
  const hasAutoSelectedRef = useRef(false)
  useEffect(() => {
    if (!hasAutoSelectedRef.current && !selectedEntity && sceneCharacters.length > 0) {
      hasAutoSelectedRef.current = true
      onSelectEntity({ type: 'character', id: sceneCharacters[0].id })
    }
  }, [selectedEntity, sceneCharacters, onSelectEntity])

  const selectedEntityName = React.useMemo(() => {
    if (!selectedEntity) {
      return sceneCharacters[0]?.name || 'Main Character'
    }
    if (selectedEntity.type === 'character') {
      const char = sceneCharacters.find(c => c.id === selectedEntity.id)
      return char?.name || 'Main Character'
    }
    if (selectedEntity.type === 'prop') {
      const prop = sceneProps.find(p => p.id === selectedEntity.id)
      return prop?.name || 'Scene Prop'
    }
    if (selectedEntity.type === 'camera') {
      const cam = cameraShots.find(c => c.id === selectedEntity.id)
      return cam?.name || 'Camera'
    }
    return 'Main Character'
  }, [selectedEntity, sceneCharacters, sceneProps, cameraShots])

  // Save dimensions
  const updateLeftWidth = (w: number) => {
    const clamped = Math.max(220, Math.min(550, w))
    setLeftWidth(clamped)
    localStorage.setItem(STORAGE_LEFT_WIDTH, String(clamped))
  }

  const updateRightWidth = (w: number) => {
    const clamped = Math.max(240, Math.min(550, w))
    setRightWidth(clamped)
    localStorage.setItem(STORAGE_RIGHT_WIDTH, String(clamped))
  }

  const updateBottomHeight = (h: number) => {
    const clamped = Math.max(130, Math.min(420, h))
    setBottomHeight(clamped)
    localStorage.setItem(STORAGE_BOTTOM_HEIGHT, String(clamped))
  }

  // Window drag handlers for smooth resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft.current) {
        // Offset by tool shelf width (52px)
        updateLeftWidth(e.clientX - 52)
      } else if (isResizingRight.current) {
        updateRightWidth(window.innerWidth - e.clientX)
      } else if (isResizingBottom.current) {
        updateBottomHeight(window.innerHeight - e.clientY)
      }
    }

    const handleMouseUp = () => {
      if (isResizingLeft.current || isResizingRight.current || isResizingBottom.current) {
        isResizingLeft.current = false
        isResizingRight.current = false
        isResizingBottom.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
      setIsDraggingPanel(false)
      setActiveDropZone(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Blender-style Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      // Ctrl+Space: Toggle Maximize Viewport
      if (e.code === 'Space' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setIsMaximizedViewport(prev => !prev)
        return
      }

      // Escape: Exit Maximize Viewport
      if (e.key === 'Escape' && isMaximizedViewport) {
        setIsMaximizedViewport(false)
        return
      }

      // Alt+1: Toggle Left Panel
      if (e.altKey && (e.key === '1' || e.code === 'Digit1')) {
        e.preventDefault()
        setIsLeftCollapsed(prev => !prev)
        return
      }

      // Alt+2: Toggle Right Panel
      if (e.altKey && (e.key === '2' || e.code === 'Digit2')) {
        e.preventDefault()
        setIsRightCollapsed(prev => !prev)
        return
      }

      // Alt+3: Toggle Bottom Drawer
      if (e.altKey && (e.key === '3' || e.code === 'Digit3')) {
        e.preventDefault()
        setIsBottomCollapsed(prev => !prev)
        return
      }

      // Industry Standard Transform Hotkeys: W (Move/Translate), E (Rotate), R (Scale)
      // (Also supports Blender G/S as alternate aliases)
      if (e.key === 'w' || e.key === 'W' || e.key === 'g' || e.key === 'G') {
        onGizmoModeChange('translate')
      } else if (e.key === 'e' || e.key === 'E') {
        onGizmoModeChange('rotate')
      } else if (e.key === 'r' || e.key === 'R' || e.key === 's' || e.key === 'S') {
        // If 'r' or 'R', set gizmo to rotate or scale based on convention:
        // By user requirement: W (Move), E (Rotate), R (Scale)
        if (e.key === 'r' || e.key === 'R') {
          onGizmoModeChange('scale')
        } else {
          onGizmoModeChange('scale')
        }
      }

      // Number keys 1, 2, 3: Gizmo modes
      if (e.key === '1') onGizmoModeChange('translate')
      if (e.key === '2') onGizmoModeChange('rotate')
      if (e.key === '3') onGizmoModeChange('scale')

      // F or Period: Focus selected object; Home: Reset View
      if (e.key === 'f' || e.key === 'F' || e.key === '.') {
        viewportRef.current?.focusSelected()
      } else if (e.key === 'Home') {
        viewportRef.current?.resetView?.()
      }

      // Delete / Backspace: Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEntity) {
        if (selectedEntity.type === 'character') {
          onDeleteCharacter(selectedEntity.id)
        } else if (selectedEntity.type === 'prop') {
          onDeleteProp(selectedEntity.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMaximizedViewport, onGizmoModeChange, selectedEntity, onDeleteCharacter, onDeleteProp, viewportRef])

  // Tool shelf interaction
  const handleSelectTool = (tool: ToolShelfId) => {
    setActiveTool(tool)
    if (tool === 'assets' || tool === 'characters' || tool === 'scenes') {
      setActiveLeftTab(tool)
      if (isLeftCollapsed) setIsLeftCollapsed(false)
    } else if (tool === 'lights') {
      setActiveRightTab('lights')
      if (isRightCollapsed) setIsRightCollapsed(false)
    } else if (tool === 'camera') {
      setActiveRightTab('camera')
      if (isRightCollapsed) setIsRightCollapsed(false)
    } else if (tool === 'effects') {
      setActiveRightTab('effects')
      if (isRightCollapsed) setIsRightCollapsed(false)
    } else if (tool === 'animation') {
      setIsBottomCollapsed(prev => !prev)
    }
  }

  // Resizing starter handlers
  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizingLeft.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRight.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const startResizeBottom = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizingBottom.current = true
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }

  // Camera angles
  const handleSetCameraAngle = (angle: 'front' | 'face' | 'bust' | 'sideLeft' | 'sideRight' | 'back' | 'top' | 'iso' | 'side' | 'isometric') => {
    if (!viewportRef.current) return
    const shot = angle === 'side' ? 'sideRight' : angle === 'isometric' ? 'iso' : angle
    viewportRef.current.setCameraShot(shot)
  }

  // Preset environments
  const handleApplyScenePreset = (presetId: string) => {
    if (presetId === 'sunset_city') {
      onAvatarStateChange(prev => ({
        ...prev,
        backdrop: 'sunset',
        lighting: { ...(prev.lighting || {} as any), keyLightIntensity: 1.6, fillLightIntensity: 0.9 }
      }))
    } else if (presetId === 'anime_school') {
      onAvatarStateChange(prev => ({
        ...prev,
        backdrop: 'skyClouds',
        lighting: { ...(prev.lighting || {} as any), keyLightIntensity: 1.4, fillLightIntensity: 1.1 }
      }))
    } else if (presetId === 'cyberpunk_alley') {
      onAvatarStateChange(prev => ({
        ...prev,
        backdrop: 'cyber',
        lighting: { ...(prev.lighting || {} as any), keyLightIntensity: 1.8, fillLightIntensity: 0.6 }
      }))
    } else if (presetId === 'studio_stage') {
      onAvatarStateChange(prev => ({
        ...prev,
        backdrop: 'dark',
        lighting: { ...(prev.lighting || {} as any), keyLightIntensity: 1.2, fillLightIntensity: 0.8 }
      }))
    }
  }

  return (
    <SceneErrorBoundary fallbackTitle="Scene Builder Viewport Intercept">
      <div className="flex-1 w-full h-full flex flex-row min-w-0 min-h-0 overflow-hidden relative select-none bg-[#0D0A14]">
        {/* 1. Blender-style Vertical Tool Shelf (Far Left) */}
        {!isMaximizedViewport && (
          <SceneToolShelf
            activeTool={activeTool}
            isLeftCollapsed={isLeftCollapsed}
            onSelectTool={handleSelectTool}
            onToggleLeftCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
            isMaximizedViewport={isMaximizedViewport}
            onToggleMaximizeViewport={() => setIsMaximizedViewport(!isMaximizedViewport)}
          />
        )}

      {/* 2. Left Dockable Sidebar (Assets, Characters, Scenes) */}
      {!isMaximizedViewport && (
        <SceneLeftSidebar
          width={leftWidth}
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          activeTab={activeLeftTab}
          onTabChange={setActiveLeftTab}
          sceneCharacters={sceneCharacters}
          characterList={characterList}
          activeCharacterId={activeCharacterId}
          selectedEntity={selectedEntity}
          onSelectEntity={onSelectEntity}
          onAddCharacterToScene={onAddCharacterToScene}
          onDuplicateCharacter={onDuplicateCharacter}
          onDeleteCharacter={onDeleteCharacter}
          onToggleCharacterVisibility={onToggleCharacterVisibility}
          onToggleCharacterLock={onToggleCharacterLock}
          sceneProps={sceneProps}
          onAddStarterProp={onAddStarterProp}
          onUploadCustomProp={onUploadCustomProp}
          onDeleteProp={onDeleteProp}
          onUpdateCharacterTransform={onUpdateCharacterTransform}
          onApplyClipToCharacter={onApplyClipToCharacter}
          onApplyScenePreset={handleApplyScenePreset}
          spawnPlacementPoint={spawnPlacementPoint}
          onClearSpawnPlacementPoint={() => onSetSpawnPlacementPoint?.(null)}
          onStartDragPanel={() => setIsDraggingPanel(true)}
          onDock={(zone) => {
            if (zone === 'right') {
              setIsRightCollapsed(false)
            } else if (zone === 'bottom') {
              setIsBottomCollapsed(false)
            }
          }}
        />
      )}

      {/* Left Resizer Handle */}
      {!isMaximizedViewport && !isLeftCollapsed && (
        <div
          onMouseDown={startResizeLeft}
          className="w-1.5 h-full cursor-col-resize hover:bg-[#8C7BFF]/70 active:bg-[#8C7BFF] transition-colors z-30 shrink-0 relative group"
          title="Drag to resize panel (Double-click to reset)"
          onDoubleClick={() => updateLeftWidth(320)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* 3. Center Column: 3D Viewport + Bottom Resizer + Bottom Pose Drawer */}
      <main className="flex-1 relative flex flex-col min-w-[320px] min-h-0 h-full bg-[#14101E] overflow-hidden">
        {/* Viewport Canvas Container */}
        <div className="flex-1 relative min-h-0 min-w-0 w-full overflow-hidden">
          <VRMViewport3D
            ref={viewportRef}
            vrm={vrm}
            avatarState={avatarState || DEFAULT_AVATAR_STATE}
            sceneMode={true}
            editorMode="scene"
            activeCharacterId={activeCharacterId}
            activeCharacterName={selectedEntityName}
            sceneCharacters={sceneCharacters}
            sceneProps={sceneProps}
            selectedEntity={selectedEntity}
            selectedPropId={selectedPropId}
            gizmoMode={gizmoMode}
            gizmoSpace={gizmoSpace}
            hideInternalGizmoDock={true}
            cameraShots={cameraShots}
            activeCameraShotId={activeCameraShotId}
            onApplyCameraShot={onApplyCameraShot}
            onSaveCurrentCameraView={onSaveCurrentCameraView}
            onDeleteCameraShot={onDeleteCameraShot}
            onOverwriteCameraShot={onOverwriteCameraShot}
            onRenameCameraShot={onRenameCameraShot}
            onResetToDefaultCameraView={onResetToDefaultCameraView}
            onUpdateCameraPosition={onUpdateCameraPosition}
            onUpdateCameraShot={onUpdateCameraShot}
            onGizmoModeChange={onGizmoModeChange}
            onGizmoSpaceChange={onGizmoSpaceChange}
            onSelectEntity={onSelectEntity}
            onSelectProp={onSelectProp}
            onUpdatePropTransform={onUpdatePropTransform}
            onUpdateCharacterTransform={onUpdateCharacterTransform}
            onAvatarStateChange={onAvatarStateChange}
            isLoadingVRM={isLoadingVRM}
            loadingProgress={loadingProgress}
            onDropAsset={onDropAsset}
            onClearScene={onClearScene}
            hideOverlays={true}
            onZoomChange={setZoomPercent}
            spawnPlacementPoint={spawnPlacementPoint}
            onSetSpawnPlacementPoint={onSetSpawnPlacementPoint}
          />

          {/* Viewport Chrome Overlays (Angles, Reset, Grid, Transform Gizmos, Maximize Mode) */}
          <SceneViewportChrome
            gizmoMode={gizmoMode}
            gizmoSpace={gizmoSpace}
            onGizmoModeChange={onGizmoModeChange}
            onGizmoSpaceChange={onGizmoSpaceChange}
            onFocusSelected={() => viewportRef.current?.focusSelected()}
            selectedEntity={selectedEntity}
            selectedEntityName={selectedEntityName}
            sceneCharacters={sceneCharacters}
            sceneProps={sceneProps}
            cameraShots={cameraShots}
            spawnPlacementPoint={spawnPlacementPoint}
            onClearSpawnPlacementPoint={() => onSetSpawnPlacementPoint?.(null)}
            onSelectEntity={onSelectEntity}
            onResetView={() => {
              if (viewportRef.current?.resetView) {
                viewportRef.current.resetView(true)
              } else {
                viewportRef.current?.setCameraShot('front')
              }
              onResetToDefaultCameraView?.()
            }}
            onSetCameraAngle={handleSetCameraAngle}
            onSnapCameraDirection={(dir) => viewportRef.current?.snapCameraToDirection?.(dir)}
            onOrbitCameraDelta={(dx, dy) => viewportRef.current?.orbitByDelta?.(dx, dy)}
            subscribeCameraChange={(cb) => viewportRef.current?.subscribeCameraChange?.(cb) || (() => {})}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            isMaximizedViewport={isMaximizedViewport}
            onToggleMaximizeViewport={() => setIsMaximizedViewport(!isMaximizedViewport)}
            onClearScene={onClearScene}
            zoomPercent={zoomPercent}
            onZoomIn={() => viewportRef.current?.zoomIn()}
            onZoomOut={() => viewportRef.current?.zoomOut()}
            onResetZoom={() => viewportRef.current?.resetZoom()}
          />
        </div>

        {/* Bottom Resizer Handle (Between Viewport and Bottom Drawer) */}
        {!isMaximizedViewport && !isBottomCollapsed && (
          <div
            onMouseDown={startResizeBottom}
            className="h-1.5 w-full cursor-row-resize hover:bg-[#8C7BFF]/70 active:bg-[#8C7BFF] transition-colors z-30 shrink-0 relative group"
            title="Drag to resize timeline / drawer"
            onDoubleClick={() => updateBottomHeight(140)}
          >
            <div className="absolute inset-x-0 -top-1 -bottom-1" />
          </div>
        )}

        {/* Bottom Drawer: Poses & Animation Timeline */}
        {!isMaximizedViewport && (
          <SceneBottomDrawer
            height={bottomHeight}
            isCollapsed={isBottomCollapsed}
            onToggleCollapse={() => {
              setIsBottomCollapsed(prev => {
                const next = !prev
                try {
                  localStorage.setItem(STORAGE_BOTTOM_COLLAPSED, String(next))
                } catch {}
                return next
              })
            }}
            activePosePreset={avatarState?.activePosePreset || 'naturalStand'}
            onApplyPose={onApplyPosePreset}
            onApplyClipToCharacter={onApplyClipToCharacter}
            activeCharacterId={activeCharacterId}
            activeCharacterName={selectedEntityName}
            onStartDragPanel={() => setIsDraggingPanel(true)}
          />
        )}
      </main>

      {/* Right Resizer Handle */}
      {!isMaximizedViewport && !isRightCollapsed && (
        <div
          onMouseDown={startResizeRight}
          className="w-1.5 h-full cursor-col-resize hover:bg-[#8C7BFF]/70 active:bg-[#8C7BFF] transition-colors z-30 shrink-0 relative group"
          title="Drag to resize panel (Double-click to reset)"
          onDoubleClick={() => updateRightWidth(330)}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* 4. Right Dockable Sidebar (Scene Tree, Properties, Camera, Lights, Effects, Physics) */}
      {!isMaximizedViewport && (
        <SceneRightSidebar
          width={rightWidth}
          isCollapsed={isRightCollapsed}
          onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
          activeTab={activeRightTab}
          onTabChange={setActiveRightTab}
          cameraShots={cameraShots}
          activeShotId={activeCameraShotId}
          onApplyCameraShot={onApplyCameraShot}
          onSaveCurrentCameraView={onSaveCurrentCameraView}
          onDeleteCameraShot={onDeleteCameraShot}
          onOverwriteCameraShot={onOverwriteCameraShot}
          onRenameCameraShot={onRenameCameraShot}
          onUpdateCameraPosition={onUpdateCameraPosition}
          onAddCamera={onAddCamera}
          onUpdateCameraShot={onUpdateCameraShot}
          sceneCharacters={sceneCharacters}
          sceneProps={sceneProps}
          selectedEntity={selectedEntity}
          onSelectEntity={onSelectEntity}
          avatarState={avatarState}
          onAvatarStateChange={onAvatarStateChange}
          onUpdateCharacterTransform={onUpdateCharacterTransform}
          onUpdatePropTransform={onUpdatePropTransform}
          onToggleCharacterVisibility={onToggleCharacterVisibility}
          onToggleCharacterLock={onToggleCharacterLock}
          onDeleteCharacter={onDeleteCharacter}
          onDeleteProp={onDeleteProp}
          onClearScene={onClearScene}
          onStartDragPanel={() => setIsDraggingPanel(true)}
          onDock={(zone) => {
            if (zone === 'left') {
              setIsLeftCollapsed(false)
            } else if (zone === 'bottom') {
              setIsBottomCollapsed(false)
            }
          }}
        />
      )}

      {/* 5. Drag-and-Drop Docking Overlay */}
      <SceneDockingOverlay
        isDragging={isDraggingPanel}
        activeZone={activeDropZone}
        onHoverZone={setActiveDropZone}
        onDropToZone={(zone) => {
          if (zone === 'left') {
            setIsLeftCollapsed(false)
          } else if (zone === 'right') {
            setIsRightCollapsed(false)
          } else if (zone === 'bottom') {
            setIsBottomCollapsed(false)
          }
          setIsDraggingPanel(false)
          setActiveDropZone(null)
        }}
      />
    </div>
    </SceneErrorBoundary>
  )
}
