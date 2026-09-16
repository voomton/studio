import React, { useState, useEffect, useRef, useCallback } from 'react'
import { VRM } from '@pixiv/three-vrm'
import { 
  VRMAvatarState, 
  SavedCharacterRecord, 
  loadVRMFromArrayBuffer, 
  POSE_PRESETS,
  DEFAULT_PROPORTIONS,
  DEFAULT_MATERIALS,
  DEFAULT_PHYSICS,
  DEFAULT_AVATAR_STATE
} from './utils/vrmManager'
import {
  playMixamoAnimation,
  loadAndPlayMixamoAnimation,
  stopMixamoAnimation,
  isAnimatedPoseKey,
  getMixamoAnimationConfig
} from './utils/mixamoAnimation'
import { 
  idbSaveVrm, 
  idbGetVrm, 
  idbDeleteVrm,
  loadSavedCharactersList,
  recoverCharactersFromIndexedDB,
  saveCharacterRecord,
  deleteCharacterRecord,
  createDefaultCharacterRecord,
  createProceduralAnimeRig,
  purgeDemoCharacters
} from './utils/vrmStorage'
import { EditorMode, SceneProp, SceneCharacterInstance, SceneEntitySelection, GizmoMode, GizmoSpace, SceneCameraShot } from './types/scene'
import { 
  idbSavePropGlb, 
  idbGetPropGlb, 
  idbDeletePropGlb, 
  STARTER_PROP_PRESETS,
  loadGLBPropFromArrayBuffer 
} from './utils/propManager'
import { VRMViewport3D, VRMViewportHandle } from './components/VRMViewport3D'
import { EditorTopBar } from './components/TopBar/EditorTopBar'
import { CharacterLibrarySidebar } from './components/LeftSidebar/CharacterLibrarySidebar'
import { CharacterEditorSidebar } from './components/RightSidebar/CharacterEditorSidebar'
import { BottomPoseLibrary } from './components/PoseLibrary/BottomPoseLibrary'
import { SceneHierarchySidebar } from './components/LeftSidebar/SceneHierarchySidebar'
import { PropTransformSidebar } from './components/RightSidebar/PropTransformSidebar'
import { VRMExportModal } from './components/VRMExportModal'
import { UnsavedChangesModal } from './components/UnsavedChangesModal'
import { AnimationProject, AnimationKeyframe, AnimationClip, ClipType, TimelineMarker } from './types/animation'
import { createEmptyAnimationProject, evaluateAnimationAtFrame, generateLipSyncFromText } from './utils/animationEngine'
import { AnimationTimeline } from './components/AnimationEditor/Timeline/AnimationTimeline'
import { AnimationInspector } from './components/AnimationEditor/Inspector/AnimationInspector'
import { AnimationRenderModal } from './components/AnimationEditor/AnimationRenderModal'
import { Upload, Check, AlertCircle, Minimize2 } from 'lucide-react'
import { WorkspaceProvider, useWorkspace } from './components/Workspace/WorkspaceContext'
import { DockZoneContainer } from './components/Workspace/DockZoneContainer'
import { FloatingPanel } from './components/Workspace/FloatingPanel'
import { ToolShelf } from './components/Workspace/ToolShelf'
import { CommandPalette } from './components/Workspace/CommandPalette'
import { WorkspaceHeaderControls } from './components/Workspace/WorkspaceHeaderControls'
import { DockingOverlay } from './components/Workspace/DockingOverlay'
import { WorkspacePanelRenderer } from './components/Workspace/WorkspacePanelRenderer'
import { PanelId, PANEL_DEFINITIONS } from './types/workspace'
import { VOOM_DRAG_TYPES } from './utils/dragDropAsset'
import { SceneBuilderLayout } from './components/SceneBuilder/SceneBuilderLayout'
import { AnimationCinemaLayout } from './components/AnimationEditor/AnimationCinemaLayout'

const SCENE_PROPS_STORAGE_KEY = 'voomtoon_scene_props_v1'
const SCENE_CHARS_STORAGE_KEY = 'voomtoon_scene_characters_v1'
const SCENE_CAMERA_SHOTS_STORAGE_KEY = 'voomtoon_scene_camera_shots_v1'
const ANIMATION_PROJECT_STORAGE_KEY = 'voomtoon_animation_project_v2'

const DEFAULT_CAMERA_SHOTS: SceneCameraShot[] = [
  {
    id: 'shot_master_wide',
    name: 'Master Wide',
    position: [0, 2.2, 4.8],
    target: [0, 0.9, 0],
    fov: 36,
    description: 'Establishing wide angle view of the entire scene',
    createdAt: Date.now() - 3000
  },
  {
    id: 'shot_medium_two',
    name: 'Medium Shot',
    position: [1.2, 1.4, 2.6],
    target: [0, 1.0, 0],
    fov: 32,
    description: 'Waist-up framing for dialogue and interactions',
    createdAt: Date.now() - 2000
  },
  {
    id: 'shot_hero_closeup',
    name: 'Hero Close-up',
    position: [0.3, 1.35, 1.1],
    target: [0, 1.3, 0],
    fov: 28,
    description: 'Dynamic character close-up for expressions',
    createdAt: Date.now() - 1000
  },
  {
    id: 'shot_low_angle',
    name: 'Low Angle Dramatic',
    position: [-1.4, 0.45, 2.2],
    target: [0, 1.1, 0],
    fov: 34,
    description: 'Dynamic upward angle for dramatic staging',
    createdAt: Date.now() - 500
  },
  {
    id: 'shot_birds_eye',
    name: "Bird's Eye Overlook",
    position: [1.8, 3.2, 2.5],
    target: [0, 0.8, 0],
    fov: 38,
    description: 'Elevated isometric view overlooking the scene',
    createdAt: Date.now() - 250
  }
]

function EditorInner() {
  const {
    layout,
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
  } = useWorkspace()

  const viewportRef = useRef<VRMViewportHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mode Switcher: Character Editor vs Scene Builder
  const [editorMode, setEditorMode] = useState<EditorMode>('character')

  // Character records list
  const [characterList, setCharacterList] = useState<SavedCharacterRecord[]>([])
  const [activeCharacterId, setActiveCharacterId] = useState<string>('')
  
  // Active Character State for Character Editor
  const [avatarState, setAvatarState] = useState<VRMAvatarState | null>(null)
  const [lastSavedState, setLastSavedState] = useState<VRMAvatarState | null>(null)
  
  // Active 3D VRM Object and raw binary
  const [vrm, setVrm] = useState<VRM | null>(null)
  const [rawVRMBuffer, setRawVRMBuffer] = useState<ArrayBuffer | null>(null)
  const [isLoadingVRM, setIsLoadingVRM] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Scene Entities State (Multiple Characters + Multiple Props)
  const [sceneCharacters, setSceneCharacters] = useState<SceneCharacterInstance[]>([])
  const [sceneProps, setSceneProps] = useState<SceneProp[]>([])
  const [selectedEntity, setSelectedEntity] = useState<SceneEntitySelection>(null)
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null)
  // Scene Outliner visibility (collapsed by default for Zero Clutter layout)
  const [isSceneTreeOpen, setIsSceneTreeOpen] = useState(false)

  // Viewport Transform Gizmo State
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate')
  const [gizmoSpace, setGizmoSpace] = useState<GizmoSpace>('world')

  // Scene Camera Shots State for Cinematography
  const [cameraShots, setCameraShots] = useState<SceneCameraShot[]>([])
  const [activeCameraShotId, setActiveCameraShotId] = useState<string | null>(null)

  // History for Undo / Redo
  const [history, setHistory] = useState<VRMAvatarState[]>([])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Modals & States
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // Pending Switch state for Unsaved Changes dialog
  const [pendingTargetCharacter, setPendingTargetCharacter] = useState<SavedCharacterRecord | null>(null)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)

  // Non-destructive Viewport Visibility tracking for characters
  const [viewportHiddenCharacterIds, setViewportHiddenCharacterIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('manga_engine_hidden_chars')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const handleToggleCharacterViewport = useCallback((charId: string) => {
    setViewportHiddenCharacterIds(prev => {
      const isHidden = prev.includes(charId)
      const next = isHidden ? prev.filter(id => id !== charId) : [...prev, charId]
      try {
        localStorage.setItem('manga_engine_hidden_chars', JSON.stringify(next))
      } catch {}
      showToast(isHidden ? 'Character restored to viewport' : 'Character removed from viewport (saved in library)')
      return next
    })
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Animation Sequencer State
  const [animationProject, setAnimationProject] = useState<AnimationProject>(() => {
    try {
      const saved = localStorage.getItem(ANIMATION_PROJECT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...parsed, isPlaying: false }
      }
    } catch (e) {
      console.warn('Could not restore animation project:', e)
    }
    return createEmptyAnimationProject()
  })

  // Studio Initialization Status & Error Handling
  const [isInitializing, setIsInitializing] = useState<boolean>(true)
  const [initError, setInitError] = useState<string | null>(null)

  const [timelineHeight, setTimelineHeight] = useState<number>(310)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(false)
  const [isRenderModalOpen, setIsRenderModalOpen] = useState<boolean>(false)

  // Animation Playback Timing Ref
  const animationFrameIdRef = useRef<number | null>(null)
  const lastPlaybackTimeRef = useRef<number>(0)
  const frameAccumulatorRef = useRef<number>(0)

  // Stable sync refs to prevent setState inside setState updaters
  const sceneCharactersRef = useRef(sceneCharacters)
  sceneCharactersRef.current = sceneCharacters

  const avatarStateRef = useRef(avatarState)
  avatarStateRef.current = avatarState

  const animationProjectRef = useRef(animationProject)
  animationProjectRef.current = animationProject

  // Click-to-Place Spawning target point [x, y, z] on ground level (null when none selected)
  const [spawnPlacementPoint, setSpawnPlacementPoint] = useState<[number, number, number] | null>(null)
  const spawnPlacementPointRef = useRef<[number, number, number] | null>(null)
  spawnPlacementPointRef.current = spawnPlacementPoint

  // Persist animation project
  const persistAnimationProject = useCallback((updated: AnimationProject) => {
    try {
      localStorage.setItem(ANIMATION_PROJECT_STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to persist animation project', e)
    }
  }, [])

  const handleUpdateAnimationProject = useCallback((updates: Partial<AnimationProject> | ((prev: AnimationProject) => AnimationProject)) => {
    setAnimationProject(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates }
      persistAnimationProject(next)
      return next
    })
  }, [persistAnimationProject])

  // Persist camera shots
  const persistCameraShots = (shots: SceneCameraShot[]) => {
    try {
      localStorage.setItem(SCENE_CAMERA_SHOTS_STORAGE_KEY, JSON.stringify(shots))
    } catch (e) {
      console.warn('Failed to persist camera shots', e)
    }
  }

  // Detect whether current active character has unsaved changes
  const hasUnsavedChanges = Boolean(
    avatarState && 
    lastSavedState && 
    JSON.stringify(avatarState) !== JSON.stringify(lastSavedState)
  )

  // Persist scene characters metadata
  const persistSceneCharacters = (chars: SceneCharacterInstance[]) => {
    try {
      const lightChars = chars.map(c => ({
        ...c,
        rawVrmBuffer: undefined
      }))
      localStorage.setItem(SCENE_CHARS_STORAGE_KEY, JSON.stringify(lightChars))
    } catch (e) {
      console.warn('Failed to persist scene characters metadata', e)
    }
  }

  // Persist scene props metadata
  const persistSceneProps = (props: SceneProp[]) => {
    try {
      const lightProps = props.map(p => ({
        ...p,
        glbBuffer: undefined
      }))
      localStorage.setItem(SCENE_PROPS_STORAGE_KEY, JSON.stringify(lightProps))
    } catch (e) {
      console.warn('Failed to persist scene props metadata', e)
    }
  }

  // Load characters, scene entities & props on initial startup
  useEffect(() => {
    let isMounted = true

    // Timeout safety fallback: If initialization doesn't finish within 15s, report error and allow reset
    const timeoutId = setTimeout(() => {
      if (isMounted && isInitializing) {
        console.warn('Initialization timed out after 15000ms')
        setInitError('Studio workspace initialization timed out while accessing local storage or assets.')
        setIsInitializing(false)
      }
    }, 15000)

    const init = async () => {
      try {
        await purgeDemoCharacters()
        let list = loadSavedCharactersList()
        try {
          const idbRecovered = await recoverCharactersFromIndexedDB()
          if (idbRecovered && idbRecovered.length > list.length) {
            list = idbRecovered
          }
        } catch (e) {
          console.warn('IDB character recovery error on startup:', e)
        }
        if (!isMounted) return
        setCharacterList(list)

        if (list.length > 0) {
          const first = list[0]
          setActiveCharacterId(first.id)
          setAvatarState(first.state)
          setLastSavedState(first.state)
          setHistory([first.state])
          setHistoryIndex(0)

          // Try load VRM binary from IDB if present
          let firstBuffer: ArrayBuffer | null = null
          try {
            const buffer = await idbGetVrm(first.id)
            if (buffer && buffer.byteLength > 0) {
              firstBuffer = buffer
              setRawVRMBuffer(buffer)
              const loaded = await loadVRMFromArrayBuffer(buffer)
              if (isMounted) setVrm(loaded.vrm)
            } else {
              setRawVRMBuffer(null)
              const procedural = createProceduralAnimeRig(first.templateType || 'female_mage', first.name)
              if (isMounted) setVrm(procedural)
            }
          } catch (e) {
            console.warn('Could not load buffer for character, using procedural anime rig:', e)
            const procedural = createProceduralAnimeRig(first.templateType || 'female_mage', first.name)
            if (isMounted) setVrm(procedural)
          }

          // Initialize Scene Characters
          try {
            const savedCharsRaw = localStorage.getItem(SCENE_CHARS_STORAGE_KEY)
            if (savedCharsRaw !== null) {
              const parsedChars: SceneCharacterInstance[] = JSON.parse(savedCharsRaw)
              const validChars = parsedChars.filter(c => list.some(l => l.id === c.characterId))
              const hydratedChars: SceneCharacterInstance[] = []

              for (const c of validChars) {
                const charBuf = await idbGetVrm(c.characterId)
                // Auto-correct any corrupt or out-of-bounds position from prior bugs
                const isOutOfBounds = !c.position || 
                  !Array.isArray(c.position) || 
                  !Number.isFinite(c.position[0]) || 
                  Math.abs(c.position[0]) > 50 || 
                  Math.abs(c.position[1]) > 50 || 
                  Math.abs(c.position[2]) > 50

                const safePosition: [number, number, number] = isOutOfBounds 
                  ? [0, 0, 0] 
                  : [
                      Number(c.position[0].toFixed(2)),
                      Number(Math.max(0, c.position[1] || 0).toFixed(2)),
                      Number(c.position[2].toFixed(2))
                    ]

                hydratedChars.push({
                  ...c,
                  position: safePosition,
                  rawVrmBuffer: charBuf || undefined
                })
              }
              if (isMounted) {
                setSceneCharacters(hydratedChars)
                if (hydratedChars.length > 0) {
                  setSelectedEntity({ type: 'character', id: hydratedChars[0].id })
                } else {
                  setSelectedEntity(null)
                }
              }
            } else if (isMounted) {
              const defaultCharInstance: SceneCharacterInstance = {
                id: `sc_char_${first.id}`,
                characterId: first.id,
                name: first.name,
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
                visible: true,
                locked: false,
                castShadow: true,
                state: first.state,
                rawVrmBuffer: firstBuffer || undefined
              }
              setSceneCharacters([defaultCharInstance])
              setSelectedEntity({ type: 'character', id: defaultCharInstance.id })
            }
          } catch (e) {
            console.warn('Could not load stored scene characters:', e)
          }
        } else {
          // Library is completely empty by default
          setActiveCharacterId('')
          setAvatarState(null)
          setLastSavedState(null)
          setHistory([])
          setHistoryIndex(-1)
          setVrm(null)
          setRawVRMBuffer(null)
          setSceneCharacters([])
          setSelectedEntity(null)
        }

        // Load Saved Scene Props
        try {
          const savedPropsRaw = localStorage.getItem(SCENE_PROPS_STORAGE_KEY)
          if (savedPropsRaw) {
            const parsedProps: SceneProp[] = JSON.parse(savedPropsRaw)
            const hydratedProps: SceneProp[] = []

            for (const p of parsedProps) {
              const groundPos: [number, number, number] = [
                Array.isArray(p.position) && Number.isFinite(p.position[0]) ? p.position[0] : 0,
                0, // Reset Y to 0 (ground level) for all props, including modern_city_block & bumper_car
                Array.isArray(p.position) && Number.isFinite(p.position[2]) ? p.position[2] : 0
              ]
              const cleanProp: SceneProp = {
                ...p,
                position: groundPos
              }
              if (cleanProp.sourceType === 'custom_upload') {
                const buf = await idbGetPropGlb(cleanProp.id)
                if (buf) {
                  hydratedProps.push({ ...cleanProp, glbBuffer: buf })
                }
              } else {
                hydratedProps.push(cleanProp)
              }
            }
            if (isMounted) {
              setSceneProps(hydratedProps)
              persistSceneProps(hydratedProps)
            }
          }
        } catch (e) {
          console.warn('Could not load stored scene props:', e)
        }

        // Load Saved Custom Scene Cameras
        try {
          const savedShotsRaw = localStorage.getItem(SCENE_CAMERA_SHOTS_STORAGE_KEY)
          if (savedShotsRaw) {
            const parsedShots: SceneCameraShot[] = JSON.parse(savedShotsRaw)
            if (Array.isArray(parsedShots)) {
              // Filter out legacy dummy presets that placed cameras floating outside scenes
              const legacyPresetIds = new Set([
                'shot_master_wide', 'shot_medium_two', 'shot_hero_closeup',
                'shot_low_angle', 'shot_birds_eye', 'shot_close_up', 'shot_over_shoulder', 'shot_low_dramatic'
              ])
              const userCustomShots = parsedShots.filter(s => !legacyPresetIds.has(s.id))
              if (isMounted) {
                setCameraShots(userCustomShots)
                persistCameraShots(userCustomShots)
              }
            } else if (isMounted) {
              setCameraShots([])
              persistCameraShots([])
            }
          } else if (isMounted) {
            setCameraShots([])
            persistCameraShots([])
          }
        } catch (e) {
          if (isMounted) setCameraShots([])
        }
      } catch (err: any) {
        console.error('Fatal error during studio initialization:', err)
        if (isMounted) {
          setInitError(err?.message || 'Unexpected initialization error occurred.')
        }
      } finally {
        clearTimeout(timeoutId)
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }
    init()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  // Keep active avatarState synced with sceneCharacters if currently selected character
  useEffect(() => {
    if (!avatarState || !activeCharacterId) return
    setSceneCharacters(prev => {
      const target = prev.find(char => char.characterId === activeCharacterId)
      if (!target) return prev
      // Strict equality check: if state reference and title haven't changed, skip re-render completely
      if (target.state === avatarState && target.name === (avatarState.meta.title || target.name)) {
        return prev
      }
      const updated = prev.map(char => {
        if (char.characterId === activeCharacterId) {
          return {
            ...char,
            name: avatarState.meta.title || char.name,
            state: avatarState
          }
        }
        return char
      })
      persistSceneCharacters(updated)
      return updated
    })
  }, [avatarState, activeCharacterId])

  // Auto-heal existing scene props: strictly ensure all props (modern_city_block, bumper_car, etc.) sit flush on ground plane (Y=0)
  useEffect(() => {
    setSceneProps(prev => {
      let needsFix = false
      const fixed = prev.map(p => {
        if (p.position && p.position[1] !== 0) {
          needsFix = true
          return {
            ...p,
            position: [p.position[0], 0, p.position[2]] as [number, number, number]
          }
        }
        return p
      })
      if (needsFix) {
        persistSceneProps(fixed)
        return fixed
      }
      return prev
    })
  }, [])

  // --- MULTI-CHARACTER SCENE OPERATIONS ---
  const handleAddCharacterToScene = useCallback(async (templateOrCharId?: string | SavedCharacterRecord, worldPos?: [number, number, number]) => {
    let sourceRecord: SavedCharacterRecord | undefined
    if (templateOrCharId && typeof templateOrCharId === 'object') {
      sourceRecord = templateOrCharId
    } else if (typeof templateOrCharId === 'string' && templateOrCharId !== 'new') {
      sourceRecord = characterList.find(c => c.id === templateOrCharId)
    }
    if (!sourceRecord) {
      if (characterList.length === 0) {
        showToast('Please create or upload a character first')
        return
      }
      sourceRecord = characterList[0]
    }

    const charBuffer = (await idbGetVrm(sourceRecord.id)) || (sourceRecord.id === activeCharacterId ? rawVRMBuffer : null)
    setSceneCharacters(prev => {
      const count = prev.length
      const existingSameType = prev.filter(c => c.characterId === sourceRecord!.id).length
      const instanceName = existingSameType === 0 ? sourceRecord!.name : `${sourceRecord!.name} (${existingSameType + 1})`
      
      // Calculate sensible default spawn position near ground origin (0, 0, 0)
      // Slight compact offset between characters to prevent overlapping
      const offsetX = count === 0 ? 0 : Number((((count - 1) % 4 - 1.5) * 1.0).toFixed(2))
      const offsetZ = count === 0 ? 0 : Number((Math.floor((count - 1) / 4) * 1.0).toFixed(2))

      // Check if a target placement point on the ground is active (or passed explicitly)
      const targetPoint = (worldPos && Array.isArray(worldPos)) ? worldPos : spawnPlacementPointRef.current
      const wasClickToPlaced = !worldPos && !!spawnPlacementPointRef.current

      // Auto-validate and clamp spawn position: characters must ALWAYS spawn at safe scene ground level
      let safePosition: [number, number, number] = [offsetX, 0, offsetZ]
      if (targetPoint && Array.isArray(targetPoint)) {
        const [wx, wy, wz] = targetPoint
        // If targetPoint is finite, place there snapped strictly to ground level Y=0
        if (Number.isFinite(wx) && Number.isFinite(wz)) {
          safePosition = [
            Number(Math.max(-50, Math.min(50, wx)).toFixed(2)),
            0, // Snapped strictly to ground level Y=0
            Number(Math.max(-50, Math.min(50, wz)).toFixed(2))
          ]
        } else {
          safePosition = [offsetX, 0, offsetZ]
        }
      }
      const position: [number, number, number] = safePosition

      const newCharInstance: SceneCharacterInstance = {
        id: `sc_char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        characterId: sourceRecord!.id,
        name: instanceName,
        position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
        castShadow: true,
        state: JSON.parse(JSON.stringify(sourceRecord!.state)),
        rawVrmBuffer: charBuffer || undefined
      }

      const updated = [...prev, newCharInstance]
      setSelectedEntity({ type: 'character', id: newCharInstance.id })
      setActiveCharacterId(sourceRecord!.id)
      setAvatarState(JSON.parse(JSON.stringify(sourceRecord!.state)))
      setSelectedPropId(null)
      persistSceneCharacters(updated)
      
      // Clear spawn target point after successful placement
      if (spawnPlacementPointRef.current) {
        setSpawnPlacementPoint(null)
      }

      if (wasClickToPlaced) {
        showToast(`Spawned ${newCharInstance.name} at marked point [${position[0]}, ${position[2]}]`)
      } else {
        showToast(`Added ${newCharInstance.name} to scene`)
      }
      return updated
    })
  }, [characterList])

  const handleDuplicateCharacterInScene = useCallback(async (id: string) => {
    setSceneCharacters(prev => {
      const target = prev.find(c => c.id === id)
      if (!target) return prev

      const newId = `sc_char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const cloned: SceneCharacterInstance = {
        ...target,
        id: newId,
        name: `${target.name} (Copy)`,
        position: [
          Number((target.position[0] + 0.8).toFixed(2)),
          target.position[1],
          Number((target.position[2] + 0.4).toFixed(2))
        ],
        state: JSON.parse(JSON.stringify(target.state))
      }

      const updated = [...prev, cloned]
      setSelectedEntity({ type: 'character', id: newId })
      setSelectedPropId(null)
      persistSceneCharacters(updated)
      showToast(`Duplicated ${target.name}`)
      return updated
    })
  }, [])

  const handleDeleteCharacterFromScene = useCallback((id: string) => {
    setSceneCharacters(prev => {
      const target = prev.find(c => c.id === id)
      const updated = prev.filter(c => c.id !== id)
      persistSceneCharacters(updated)
      setSelectedEntity(sel => (sel?.type === 'character' && sel.id === id ? (updated.length > 0 ? { type: 'character', id: updated[0].id } : null) : sel))
      showToast(target ? `Removed ${target.name} from scene` : 'Removed character from scene')
      return updated
    })
  }, [])

  const handleToggleCharacterVisibility = useCallback((id: string) => {
    setSceneCharacters(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
      persistSceneCharacters(updated)
      return updated
    })
  }, [])

  const handleToggleCharacterLock = useCallback((id: string) => {
    setSceneCharacters(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, locked: !c.locked } : c)
      persistSceneCharacters(updated)
      return updated
    })
  }, [])

  const handleUpdateCharacterTransform = useCallback((id: string, updates: Partial<SceneCharacterInstance>) => {
    setSceneCharacters(prev => {
      const exists = prev.some(c => c.id === id)
      if (!exists) return prev
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      persistSceneCharacters(updated)
      return updated
    })
  }, [])

  const handleSelectEntityInScene = useCallback((selection: SceneEntitySelection) => {
    setSelectedEntity(selection)
    if (selection?.type === 'character') {
      const char = sceneCharactersRef.current.find(c => c.id === selection.id || c.characterId === selection.id)
      if (char) {
        setActiveCharacterId(prevId => prevId !== char.characterId ? char.characterId : prevId)
        setAvatarState(prev => (prev === char.state ? prev : char.state))
      }
      setSelectedPropId(null)
    } else if (selection?.type === 'prop') {
      setSelectedPropId(selection.id)
    } else {
      setSelectedPropId(null)
    }
  }, [])

  // Jump from Scene Builder directly into Character Editor for this character
  const handleEditCharacterAppearance = (sceneCharId: string) => {
    const target = sceneCharacters.find(c => c.id === sceneCharId)
    if (!target) return

    const record = characterList.find(r => r.id === target.characterId)
    if (record) {
      executeSwitchCharacter(record)
    } else {
      setActiveCharacterId(target.characterId)
      setAvatarState(target.state)
      setLastSavedState(target.state)
    }
    setEditorMode('character')
    showToast(`Editing ${target.name}`)
  }

  // --- SCENE PROP OPERATIONS ---
  const handleAddStarterProp = useCallback((presetId: string, worldPos?: [number, number, number]) => {
    const preset = STARTER_PROP_PRESETS.find(p => p.id === presetId)
    if (!preset) return

    setSceneProps(prev => {
      const count = prev.length
      const offsetX = Number(((count % 3 - 1) * 1.5).toFixed(2))
      const offsetZ = Number((Math.floor(count / 3) * 1.5 - 1.0).toFixed(2))
      
      // Use preset's tailored default position or staged offset if multiple instances exist
      let defaultPos: [number, number, number] = [offsetX, 0, offsetZ]
      if (preset.defaultPosition) {
        defaultPos = [
          preset.defaultPosition[0] + (count > 0 ? (count % 3) * 1.2 : 0),
          0, // Ground level Y=0 strictly
          preset.defaultPosition[2] + (count > 0 ? Math.floor(count / 3) * 1.2 : 0)
        ]
      }

      // Check if user clicked a target placement point on ground
      const targetPoint = worldPos || spawnPlacementPointRef.current
      const wasClickToPlaced = !worldPos && !!spawnPlacementPointRef.current

      const position: [number, number, number] = [
        targetPoint ? Number(targetPoint[0].toFixed(2)) : defaultPos[0],
        0, // Ground level Y=0 strictly
        targetPoint ? Number(targetPoint[2].toFixed(2)) : defaultPos[2]
      ]
      const rotation: [number, number, number] = preset.defaultRotation ? [...preset.defaultRotation] : [0, 0, 0]
      const scale: [number, number, number] = preset.defaultScale ? [...preset.defaultScale] : [1, 1, 1]

      const newProp: SceneProp = {
        id: 'prop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: count > 0 ? `${preset.name} ${count + 1}` : preset.name,
        sourceType: 'starter_preset',
        presetId: preset.id,
        position,
        rotation,
        scale,
        visible: true,
        locked: false,
        castShadow: true,
        category: preset.category
      }

      const updated = [...prev, newProp]
      setSelectedEntity({ type: 'prop', id: newProp.id })
      setSelectedPropId(newProp.id)
      persistSceneProps(updated)

      // Clear spawn target point after successful placement
      if (spawnPlacementPointRef.current) {
        setSpawnPlacementPoint(null)
      }

      if (wasClickToPlaced) {
        showToast(`Spawned ${newProp.name} at marked point [${position[0]}, ${position[2]}]`)
      } else {
        showToast(`Added ${newProp.name} to scene`)
      }
      return updated
    })
  }, [])

  const handleImportGLBProp = useCallback(async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const propId = 'custom_glb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      
      await idbSavePropGlb(propId, buffer)

      const cleanName = file.name.replace(/\.(glb|gltf)$/i, '')

      // Measure dimensions and perform sanity check
      let scaleMultiplier = 1.0
      let autoScaled = false
      let width = 1.0
      let height = 1.0
      let depth = 1.0

      try {
        const parsed = await loadGLBPropFromArrayBuffer(buffer)
        width = parsed.dimensions.width
        height = parsed.dimensions.height
        depth = parsed.dimensions.depth
        const maxDim = Math.max(width, height, depth)

        if (maxDim <= 0.0001 || !Number.isFinite(maxDim)) {
          console.warn(`[Asset Import] "${file.name}" has zero or invalid geometry bounds.`)
          showToast(`Warning: "${file.name}" has zero or empty geometry bounds.`)
        } else if (maxDim > 500) {
          // Centimeter scale model (e.g. 1000cm = 10m)
          scaleMultiplier = maxDim > 5000 ? 0.001 : 0.01
          autoScaled = true
          console.info(`[Asset Import] Large asset detected (${maxDim.toFixed(1)} units). Auto-scaled by ${scaleMultiplier} to fit scene.`)
        } else if (maxDim < 0.05 && maxDim > 0) {
          // Millimeter/micro scale model
          scaleMultiplier = Number((1.0 / maxDim).toFixed(2))
          autoScaled = true
          console.info(`[Asset Import] Micro asset detected (${(maxDim * 100).toFixed(1)}cm). Auto-scaled by ${scaleMultiplier}x.`)
        }
      } catch (parseErr) {
        console.warn('[Asset Import] Could not pre-parse dimensions:', parseErr)
      }

      const targetPoint = spawnPlacementPointRef.current
      const propPos: [number, number, number] = targetPoint
        ? [Number(targetPoint[0].toFixed(2)), 0, Number(targetPoint[2].toFixed(2))]
        : [0, 0, 0]

      const newProp: SceneProp = {
        id: propId,
        name: cleanName,
        sourceType: 'custom_upload',
        fileName: file.name,
        glbBuffer: buffer,
        position: propPos,
        rotation: [0, 0, 0],
        scale: [scaleMultiplier, scaleMultiplier, scaleMultiplier],
        visible: true,
        locked: false,
        castShadow: true,
        category: 'architecture'
      }

      setSceneProps(prev => {
        const updated = [...prev, newProp]
        setSelectedEntity({ type: 'prop', id: newProp.id })
        setSelectedPropId(newProp.id)
        persistSceneProps(updated)
        return updated
      })

      // Clear spawn target point after successful placement
      if (spawnPlacementPointRef.current) {
        setSpawnPlacementPoint(null)
      }

      const sizeLabel = `${(width * scaleMultiplier).toFixed(1)}m × ${(height * scaleMultiplier).toFixed(1)}m × ${(depth * scaleMultiplier).toFixed(1)}m`
      if (targetPoint) {
        showToast(`Imported ${cleanName} at marked point [${propPos[0]}, ${propPos[2]}]`)
      } else {
        showToast(`Imported ${cleanName} (${sizeLabel})${autoScaled ? ' (Auto-scaled)' : ''}`)
      }
    } catch (err) {
      console.error('Failed to import .GLB prop:', err)
      showToast('Error loading .GLB file')
    }
  }, [])

  const handleTogglePropVisibility = useCallback((id: string) => {
    setSceneProps(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p)
      persistSceneProps(updated)
      return updated
    })
  }, [])

  const handleTogglePropLock = useCallback((id: string) => {
    setSceneProps(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, locked: !p.locked } : p)
      persistSceneProps(updated)
      return updated
    })
  }, [])

  const handleDuplicateProp = useCallback(async (id: string) => {
    const newId = 'prop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    let clonedName = ''

    setSceneProps(prev => {
      const target = prev.find(p => p.id === id)
      if (!target) return prev

      clonedName = target.name
      const cloned: SceneProp = {
        ...target,
        id: newId,
        name: `${target.name} (Copy)`,
        glbBuffer: target.glbBuffer,
        position: [
          Number((target.position[0] + 0.6).toFixed(2)),
          0, // Ground level Y=0 strictly
          Number((target.position[2] + 0.6).toFixed(2))
        ]
      }

      if (target.sourceType === 'custom_upload' && target.glbBuffer) {
        idbSavePropGlb(newId, target.glbBuffer).catch(console.error)
      }

      const updated = [...prev, cloned]
      setSelectedEntity({ type: 'prop', id: newId })
      setSelectedPropId(newId)
      persistSceneProps(updated)
      return updated
    })

    if (clonedName) {
      showToast(`Duplicated ${clonedName}`)
    }
  }, [])

  const handleDeleteProp = useCallback(async (id: string) => {
    setSceneProps(prev => {
      const target = prev.find(p => p.id === id)
      if (target?.sourceType === 'custom_upload') {
        idbDeletePropGlb(id).catch(console.error)
      }

      const updated = prev.filter(p => p.id !== id)
      persistSceneProps(updated)
      return updated
    })
    setSelectedEntity(prev => (prev?.type === 'prop' && prev.id === id ? null : prev))
    setSelectedPropId(prev => (prev === id ? null : prev))
    showToast(`Removed prop from scene`)
  }, [])

  const handleUpdateProp = useCallback((id: string, updates: Partial<SceneProp>) => {
    setSceneProps(prev => {
      const exists = prev.some(p => p.id === id)
      if (!exists) return prev
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p)
      persistSceneProps(updated)
      return updated
    })
  }, [])

  const handleAutoFitPropScale = useCallback((id: string) => {
    if (!viewportRef.current) return
    const fitScale = viewportRef.current.getPropAutoFitScale(id)
    handleUpdateProp(id, { scale: [fitScale, fitScale, fitScale] })
    showToast(`Prop scaled to Humanoid scale (${fitScale}x)`)
  }, [handleUpdateProp])

  const handleClearScene = useCallback(() => {
    // Forcefully empty 3D Three.js viewport scene graph (props, characters, gizmos)
    viewportRef.current?.clearScene?.()

    // Reset React scene states
    setSceneCharacters([])
    setSceneProps([])
    setSelectedEntity(null)
    setSelectedPropId(null)

    // Persist empty state to storage
    persistSceneCharacters([])
    persistSceneProps([])

    showToast('Scene and 3D viewport completely cleared')
  }, [persistSceneCharacters, persistSceneProps, showToast])

  // Selected Entity references
  const selectedCharacter = selectedEntity?.type === 'character'
    ? sceneCharacters.find(c => c.id === selectedEntity.id) || null
    : null

  const selectedProp = selectedEntity?.type === 'prop'
    ? sceneProps.find(p => p.id === selectedEntity.id) || null
    : (selectedPropId ? sceneProps.find(p => p.id === selectedPropId) || null : null)

  const selectedCameraShot = selectedEntity?.type === 'camera'
    ? cameraShots.find(s => s.id === selectedEntity.id) || null
    : null

  // Process a loaded VRM file buffer
  const processVRMBuffer = useCallback(async (buffer: ArrayBuffer, fileName: string) => {
    setIsLoadingVRM(true)
    setLoadingProgress(25)
    try {
      setLoadingProgress(55)
      const { vrm: loadedVrm, meta } = await loadVRMFromArrayBuffer(buffer)
      setLoadingProgress(85)

      setVrm(loadedVrm)
      setRawVRMBuffer(buffer)

      const charId = `char-${Date.now()}`
      const cleanName = meta.title || fileName.replace(/\.(vrm|glb)$/i, '')

      const newState: VRMAvatarState = {
        id: charId,
        fileName,
        fileSize: buffer.byteLength,
        uploadedAt: Date.now(),
        meta,
        proportions: { ...DEFAULT_PROPORTIONS },
        materials: { ...DEFAULT_MATERIALS },
        physics: { ...DEFAULT_PHYSICS },
        activePosePreset: 'naturalStand',
        expressions: {},
        boneRotations: { ...POSE_PRESETS.naturalStand.bones },
        autoBreathing: false,
        autoBlink: false,
        autoLipSync: false,
        eyeTracking: false,
        lighting: {
          keyLightIntensity: 1.2,
          fillLightIntensity: 0.6,
          ambientIntensity: 0.8,
          rimLightIntensity: 1.0,
          rimLightColor: '#FF6B8B'
        },
        backdrop: 'dark'
      }

      await idbSaveVrm(charId, buffer)

      const updatedList = saveCharacterRecord(charId, cleanName, newState)
      setCharacterList(updatedList)
      setActiveCharacterId(charId)
      setAvatarState(newState)
      setLastSavedState(newState)
      setHistory([newState])
      setHistoryIndex(0)

      // Also update or add to sceneCharacters
      const sceneChar: SceneCharacterInstance = {
        id: `sc_char_${charId}`,
        characterId: charId,
        name: cleanName,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
        castShadow: true,
        state: newState,
        rawVrmBuffer: buffer
      }
      setSceneCharacters(prev => {
        const next = [sceneChar, ...prev.filter(c => c.characterId !== charId)]
        persistSceneCharacters(next)
        return next
      })
      setSelectedEntity({ type: 'character', id: sceneChar.id })

      showToast(`Loaded ${cleanName} successfully!`)
    } catch (err: any) {
      console.error('Failed to load VRM:', err)
      showToast(err.message || 'Failed to parse VRM file')
    } finally {
      setIsLoadingVRM(false)
      setLoadingProgress(0)
    }
  }, [])

  // Execute Character Switch
  const executeSwitchCharacter = async (charRecord: SavedCharacterRecord) => {
    setActiveCharacterId(charRecord.id)
    setAvatarState(charRecord.state)
    setLastSavedState(charRecord.state)
    setHistory([charRecord.state])
    setHistoryIndex(0)

    try {
      const buffer = await idbGetVrm(charRecord.id)
      if (buffer && buffer.byteLength > 0) {
        setRawVRMBuffer(buffer)
        const loaded = await loadVRMFromArrayBuffer(buffer)
        setVrm(loaded.vrm)
      } else {
        setRawVRMBuffer(null)
        const procedural = createProceduralAnimeRig(charRecord.templateType || 'female_mage', charRecord.name)
        setVrm(procedural)
      }
    } catch (e) {
      console.warn('Could not load character VRM, using procedural anime rig:', e)
      const procedural = createProceduralAnimeRig(charRecord.templateType || 'female_mage', charRecord.name)
      setVrm(procedural)
    }
  }

  // Handle Character Selection with Unsaved Guard
  const handleSelectCharacter = (charRecord: SavedCharacterRecord) => {
    if (charRecord.id === activeCharacterId) return
    if (hasUnsavedChanges) {
      setPendingTargetCharacter(charRecord)
      setShowUnsavedModal(true)
    } else {
      executeSwitchCharacter(charRecord)
    }
  }

  // Save current active character state
  const handleSaveCurrentCharacter = async () => {
    if (!avatarState || !activeCharacterId) return
    const currentRecord = characterList.find(c => c.id === activeCharacterId)
    const name = avatarState.meta.title || currentRecord?.name || 'My Character'

    let thumbnail: string | undefined
    if (viewportRef.current) {
      try {
        thumbnail = viewportRef.current.takeScreenshot('1080p')
      } catch (e) {
        // Thumbnail snapshot guard
      }
    }

    const updatedList = saveCharacterRecord(
      activeCharacterId,
      name,
      avatarState,
      thumbnail
    )
    setCharacterList(updatedList)
    setLastSavedState(avatarState)
    showToast(`Saved "${name}"`)
  }

  // Create new character template with selected archetype
  const handleCreateNewCharacterWithTemplate = (templateType: 'female_mage' | 'male_warrior' | 'female_idol' | 'custom_empty') => {
    const templateNames: Record<string, string> = {
      female_mage: 'Noble Anime Mage',
      male_warrior: 'Cyber Blade Hero',
      female_idol: 'Idol Pop Star',
      custom_empty: 'Custom Character'
    }
    const newId = `char-${Date.now()}`
    const baseName = templateNames[templateType] || 'New Character'
    const newName = `${baseName} ${characterList.length + 1}`

    const newRecord: SavedCharacterRecord = {
      id: newId,
      name: newName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefaultTemplate: true,
      templateType: templateType,
      state: {
        ...DEFAULT_AVATAR_STATE,
        id: newId,
        fileName: `${newName.replace(/\s+/g, '_')}.vrm`,
        meta: {
          ...DEFAULT_AVATAR_STATE.meta,
          title: newName
        }
      }
    }

    const updated = saveCharacterRecord(newId, newName, newRecord.state, '')
    setCharacterList(updated)
    executeSwitchCharacter(newRecord)
    showToast(`Created new character: ${newName}`)
  }

  // Apply pose preset immediately to current character
  const handleApplyPosePreset = async (presetKey: string) => {
    if (!avatarState || !vrm) {
      showToast('Please create or select a character first')
      return
    }
    if (isAnimatedPoseKey(presetKey)) {
      const animConfig = getMixamoAnimationConfig(presetKey)
      const preset = POSE_PRESETS[presetKey]
      setAvatarState(prev => ({
        ...prev,
        activePosePreset: presetKey,
        ...(preset?.bones ? { boneRotations: { ...preset.bones } } : {})
      }))

      if (editorMode === 'scene') {
        setSceneCharacters(prevChars => {
          const targetId = selectedEntity?.type === 'character' ? selectedEntity.id : null
          const updated = prevChars.map(c => {
            const isTarget = (targetId && (c.id === targetId || c.characterId === targetId)) ||
                             c.characterId === activeCharacterId
            if (isTarget) {
              return {
                ...c,
                state: {
                  ...c.state,
                  activePosePreset: presetKey,
                  ...(preset?.bones ? { boneRotations: { ...preset.bones } } : {})
                }
              }
            }
            return c
          })
          persistSceneCharacters(updated)
          return updated
        })
      }

      if (vrm && animConfig) {
        showToast(`Loading animation: ${animConfig.name}...`)
        try {
          await playMixamoAnimation(presetKey, vrm, {
            speed: animConfig.speed || 1.0,
            onLoaded: (isMixamoFile) => {
              showToast(isMixamoFile ? `Playing Mixamo animation: ${animConfig.name}` : `Playing locomotion: ${animConfig.name}`)
            }
          })
        } catch (e: any) {
          console.error('[MixamoAnimation] Failed to play animation:', e)
        }
      }
      return
    }

    // Static pose preset
    const preset = POSE_PRESETS[presetKey]
    if (!preset) return

    if (vrm) {
      stopMixamoAnimation(vrm)
    }

    setAvatarState(prev => ({
      ...prev,
      activePosePreset: presetKey,
      boneRotations: {
        ...preset.bones
      }
    }))

    if (editorMode === 'scene') {
      setSceneCharacters(prevChars => {
        const targetId = selectedEntity?.type === 'character' ? selectedEntity.id : null
        const updated = prevChars.map(c => {
          const isTarget = (targetId && (c.id === targetId || c.characterId === targetId)) ||
                           c.characterId === activeCharacterId
          if (isTarget) {
            return {
              ...c,
              state: {
                ...c.state,
                activePosePreset: presetKey,
                boneRotations: { ...preset.bones }
              }
            }
          }
          return c
        })
        persistSceneCharacters(updated)
        return updated
      })
    }

    showToast(`Applied pose: ${preset.name}`)
  }

  // Create new character template
  const handleCreateNewTemplate = () => {
    handleCreateNewCharacterWithTemplate('female_mage')
  }

  // Duplicate character
  const handleDuplicateCharacter = async (charId: string) => {
    const source = characterList.find(c => c.id === charId)
    if (!source) return

    const newId = `char-${Date.now()}`
    const newName = `${source.name} (Copy)`
    const newState = JSON.parse(JSON.stringify(source.state))
    newState.id = newId

    const buffer = await idbGetVrm(charId)
    if (buffer) {
      await idbSaveVrm(newId, buffer)
    }

    const updated = saveCharacterRecord(newId, newName, newState, source.thumbnail)
    setCharacterList(updated)
    const newRecord = updated.find(c => c.id === newId)
    if (newRecord) {
      executeSwitchCharacter(newRecord)
    }
    showToast(`Duplicated "${source.name}" as new character`)
  }

  // Delete character
  const handleDeleteCharacter = async (charId: string) => {
    await idbDeleteVrm(charId)
    const updated = deleteCharacterRecord(charId)
    setCharacterList(updated)

    // Remove deleted character from scene instances
    setSceneCharacters(prev => {
      const filtered = prev.filter(c => c.characterId !== charId)
      persistSceneCharacters(filtered)
      return filtered
    })

    if (activeCharacterId === charId) {
      const nextChar = updated[0]
      if (nextChar) {
        executeSwitchCharacter(nextChar)
      } else {
        // Reset to completely empty state
        setActiveCharacterId('')
        setAvatarState(null)
        setLastSavedState(null)
        setHistory([])
        setHistoryIndex(-1)
        setVrm(null)
        setRawVRMBuffer(null)
        setSelectedEntity(null)
        try {
          localStorage.removeItem(SCENE_CHARS_STORAGE_KEY)
        } catch {}
      }
    }
    showToast('Character deleted')
  }

  // Rename character
  const handleRenameCharacter = (charId: string, newName: string) => {
    const target = characterList.find(c => c.id === charId)
    if (!target) return

    const updatedState = {
      ...target.state,
      meta: {
        ...target.state.meta,
        title: newName
      }
    }

    const updated = saveCharacterRecord(charId, newName, updatedState, target.thumbnail)
    setCharacterList(updated)

    if (activeCharacterId === charId) {
      setAvatarState(updatedState)
      setLastSavedState(updatedState)
    }
    showToast(`Renamed to "${newName}"`)
  }

  // Update Avatar State (Undo/Redo recorded)
  const handleAvatarStateChange = (updater: (prev: VRMAvatarState) => VRMAvatarState) => {
    const prev = avatarStateRef.current
    if (!prev) return
    const next = updater(prev)
    setAvatarState(next)

    setHistory(h => {
      const sliced = h.slice(0, historyIndex + 1)
      return [...sliced, next]
    })
    setHistoryIndex(i => i + 1)

    if (editorMode === 'scene') {
      setSceneCharacters(prevChars => {
        let hasChange = false
        const targetId = selectedEntity?.type === 'character' ? selectedEntity.id : null
        const updated = prevChars.map(c => {
          const isTarget = (targetId && (c.id === targetId || c.characterId === targetId)) ||
                           c.characterId === activeCharacterId
          if (isTarget) {
            hasChange = true
            return {
              ...c,
              name: next.meta?.title || c.name,
              state: next
            }
          }
          return c
        })
        if (hasChange) {
          persistSceneCharacters(updated)
          return updated
        }
        return prevChars
      })
    }
  }

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1
      setHistoryIndex(nextIdx)
      setAvatarState(history[nextIdx])
    }
  }

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1
      setHistoryIndex(nextIdx)
      setAvatarState(history[nextIdx])
    }
  }

  // Reset Character to Default A-Pose
  const handleResetCharacter = () => {
    if (!avatarState) return
    handleAvatarStateChange(prev => ({
      ...prev,
      proportions: { ...DEFAULT_PROPORTIONS },
      materials: { ...DEFAULT_MATERIALS },
      boneRotations: { ...POSE_PRESETS.aPose.bones },
      activePosePreset: 'aPose',
      expressions: {}
    }))
    showToast('Reset character to standard A-pose')
  }

  // Camera Shot Action Handlers
  const handleSaveCurrentCameraView = (customName?: string) => {
    const camState = viewportRef.current?.getCameraState()
    if (!camState) {
      showToast('Camera is not ready yet')
      return
    }

    const shotNumber = cameraShots.length + 1
    const newShotName = customName?.trim() || `Shot ${shotNumber}`
    const newShot: SceneCameraShot = {
      id: `shot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newShotName,
      position: camState.position,
      target: camState.target,
      fov: Math.round(camState.fov),
      createdAt: Date.now()
    }

    const updated = [...cameraShots, newShot]
    setCameraShots(updated)
    setActiveCameraShotId(newShot.id)
    persistCameraShots(updated)
    showToast(`Saved Camera Shot "${newShotName}"`)
  }

  const handleApplyCameraShot = (shot: SceneCameraShot) => {
    if (!viewportRef.current) return
    viewportRef.current.applyCameraShot(shot, 750)
    setActiveCameraShotId(shot.id)
    showToast(`Camera: ${shot.name}`)
  }

  const handleDeleteCameraShot = (shotId: string) => {
    const shot = cameraShots.find(s => s.id === shotId)
    const updated = cameraShots.filter(s => s.id !== shotId)
    setCameraShots(updated)
    if (activeCameraShotId === shotId) {
      setActiveCameraShotId(null)
    }
    persistCameraShots(updated)
    showToast(`Deleted shot "${shot?.name || 'Camera Shot'}"`)
  }

  const handleOverwriteCameraShot = (shotId: string) => {
    const camState = viewportRef.current?.getCameraState()
    if (!camState) return
    const updated = cameraShots.map(s => {
      if (s.id === shotId) {
        return {
          ...s,
          position: camState.position,
          target: camState.target,
          fov: Math.round(camState.fov)
        }
      }
      return s
    })
    setCameraShots(updated)
    setActiveCameraShotId(shotId)
    persistCameraShots(updated)
    showToast('Updated camera shot coordinates')
  }

  const handleRenameCameraShot = (shotId: string, newName: string) => {
    const updated = cameraShots.map(s => (s.id === shotId ? { ...s, name: newName } : s))
    setCameraShots(updated)
    persistCameraShots(updated)
    showToast(`Renamed to "${newName}"`)
  }

  const handleUpdateCameraShotPosition = (shotId: string, newPosition: [number, number, number]) => {
    const updated = cameraShots.map(s => {
      if (s.id === shotId) {
        return { ...s, position: newPosition }
      }
      return s
    })
    setCameraShots(updated)
    persistCameraShots(updated)
  }

  const handleUpdateCameraShot = (shotId: string, updates: Partial<SceneCameraShot>) => {
    const updated = cameraShots.map(s => {
      if (s.id === shotId) {
        return { ...s, ...updates }
      }
      return s
    })
    setCameraShots(updated)
    persistCameraShots(updated)
  }

  const handleAddCustomCamera = () => {
    // Count existing cameras named "Camera N" or total to give an incremental name
    const existingCamNumbers = cameraShots
      .map(s => {
        const match = s.name.match(/^Camera\s+(\d+)$/i)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter(n => n > 0)
    const nextNum = existingCamNumbers.length > 0 ? Math.max(...existingCamNumbers) + 1 : cameraShots.length + 1
    const newCameraName = `Camera ${nextNum}`

    // Position camera sensibly within the current scene framing existing objects/characters
    const camState = viewportRef.current?.getCameraState()

    // 1. Determine sensible target center based on actual scene objects
    let target: [number, number, number] = [0, 1.1, 0]
    if (selectedEntity?.type === 'character') {
      const char = sceneCharacters.find(c => c.id === selectedEntity.id)
      if (char) target = [char.position[0], char.position[1] + 1.25, char.position[2]]
    } else if (selectedEntity?.type === 'prop') {
      const prop = sceneProps.find(p => p.id === selectedEntity.id)
      if (prop) target = [prop.position[0], prop.position[1] + 0.8, prop.position[2]]
    } else if (sceneCharacters.length > 0) {
      const char = sceneCharacters[0]
      target = [char.position[0], char.position[1] + 1.25, char.position[2]]
    } else if (sceneProps.length > 0) {
      const prop = sceneProps[0]
      target = [prop.position[0], prop.position[1] + 0.8, prop.position[2]]
    } else if (camState?.target) {
      target = [
        Number(camState.target[0].toFixed(2)),
        Number(camState.target[1].toFixed(2)),
        Number(camState.target[2].toFixed(2))
      ]
    }

    // 2. Position camera nicely framing this target (not floating far outside)
    let pos: [number, number, number] = [
      Number(target[0].toFixed(2)),
      Number((target[1] + 0.25).toFixed(2)),
      Number((target[2] + 2.3).toFixed(2))
    ]
    let fov = 40

    // If current viewport camera is available, use current viewpoint so what the user is looking at is faithfully captured
    if (camState && camState.position && camState.target) {
      pos = [
        Number(camState.position[0].toFixed(2)),
        Number(camState.position[1].toFixed(2)),
        Number(camState.position[2].toFixed(2))
      ]
      target = [
        Number(camState.target[0].toFixed(2)),
        Number(camState.target[1].toFixed(2)),
        Number(camState.target[2].toFixed(2))
      ]
      fov = Math.round(camState.fov || 40)
    }

    const newShot: SceneCameraShot = {
      id: `cam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newCameraName,
      position: pos,
      target: target,
      fov: fov,
      description: 'Custom adjustable studio camera',
      createdAt: Date.now()
    }

    const updated = [...cameraShots, newShot]
    setCameraShots(updated)
    persistCameraShots(updated)
    setSelectedEntity({ type: 'camera', id: newShot.id })
    setActiveCameraShotId(newShot.id)
    showToast(`Added "${newCameraName}" framing scene`)
  }

  const handleResetToDefaultCameraView = () => {
    if (!viewportRef.current) return
    viewportRef.current.applyCameraShot({
      position: [0, 1.1, 2.5],
      target: [0, 0.9, 0],
      fov: 32
    }, 600)
    setActiveCameraShotId(null)
    showToast('Reset camera to default front view')
  }

  // Synchronize Camera Cuts with saved Camera Shots
  useEffect(() => {
    if (cameraShots.length > 0 && animationProject.cameraCuts.length === 0) {
      const initialCuts = cameraShots.slice(0, 3).map((shot, idx) => ({
        id: `cut_${shot.id}`,
        cameraShotId: shot.id,
        cameraName: shot.name,
        startFrame: idx * 40,
        durationFrames: 40,
        transition: 'cut' as const,
        color: idx === 0 ? '#3B82F6' : (idx === 1 ? '#10B981' : '#F59E0B')
      }))
      handleUpdateAnimationProject(prev => ({
        ...prev,
        cameraCuts: initialCuts
      }))
    }
  }, [cameraShots, animationProject.cameraCuts.length, handleUpdateAnimationProject])

  // Evaluate animation at specified frame and update 3D scene instances
  const applyFrameEvaluation = useCallback((frame: number, currentProject: AnimationProject) => {
    const evaluated = evaluateAnimationAtFrame(currentProject, frame, sceneCharacters)

    // Apply Camera Cuts to Viewport
    if (evaluated.camera.activeShotId) {
      const matchedShot = cameraShots.find(s => s.id === evaluated.camera.activeShotId)
      if (matchedShot && matchedShot.id !== activeCameraShotId) {
        handleApplyCameraShot(matchedShot)
      }
    }

    // Apply evaluated transforms & states to characters
    setSceneCharacters(prevChars => {
      let hasChanges = false
      const updated = prevChars.map(char => {
        const charEval = evaluated.characters.get(char.id)
        if (!charEval) return char

        hasChanges = true
        return {
          ...char,
          position: (charEval.position ? [charEval.position[0], charEval.position[1], charEval.position[2]] : char.position) as [number, number, number],
          rotation: (charEval.rotation ? [charEval.rotation[0], charEval.rotation[1], charEval.rotation[2]] : char.rotation) as [number, number, number],
          scale: (charEval.scale ? [charEval.scale[0], charEval.scale[1], charEval.scale[2]] : char.scale) as [number, number, number],
          state: {
            ...char.state,
            boneRotations: {
              ...char.state.boneRotations,
              ...(charEval.boneRotations || {})
            },
            expressions: {
              ...char.state.expressions,
              ...(charEval.expressions || {})
            }
          }
        }
      })
      return hasChanges ? updated : prevChars
    })
  }, [cameraShots, activeCameraShotId, handleApplyCameraShot, sceneCharacters])

  // Real-time animation playback loop (rAF)
  useEffect(() => {
    if (!animationProject.isPlaying) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
      return
    }

    lastPlaybackTimeRef.current = performance.now()
    frameAccumulatorRef.current = 0

    const targetFrameDurationMs = 1000 / (animationProject.fps || 24)

    const tick = (now: number) => {
      const deltaMs = now - lastPlaybackTimeRef.current
      lastPlaybackTimeRef.current = now
      frameAccumulatorRef.current += deltaMs

      if (frameAccumulatorRef.current >= targetFrameDurationMs) {
        const framesToAdvance = Math.floor(frameAccumulatorRef.current / targetFrameDurationMs)
        frameAccumulatorRef.current %= targetFrameDurationMs

        const currentProj = animationProjectRef.current
        if (currentProj && currentProj.isPlaying) {
          let nextFrame = currentProj.currentFrame + framesToAdvance
          const maxFrame = currentProj.outPoint || currentProj.totalFrames
          const minFrame = currentProj.inPoint || 0
          let shouldStop = false

          if (nextFrame > maxFrame) {
            if (currentProj.isLooping) {
              nextFrame = minFrame
            } else {
              nextFrame = maxFrame
              shouldStop = true
            }
          }

          applyFrameEvaluation(nextFrame, currentProj)
          setAnimationProject(prev => {
            if (!prev.isPlaying) return prev
            return {
              ...prev,
              isPlaying: shouldStop ? false : prev.isPlaying,
              currentFrame: nextFrame
            }
          })
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(tick)
    }

    animationFrameIdRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
    }
  }, [animationProject.isPlaying, animationProject.fps, applyFrameEvaluation])

  // Animation Transport Callbacks
  const handleSeekAnimation = useCallback((frame: number) => {
    const clamped = Math.max(0, Math.min(animationProject.totalFrames, Math.round(frame)))
    setAnimationProject(prev => {
      const updated = { ...prev, currentFrame: clamped }
      applyFrameEvaluation(clamped, updated)
      return updated
    })
  }, [animationProject.totalFrames, applyFrameEvaluation])

  const handlePlayAnimation = useCallback(() => {
    setAnimationProject(prev => {
      let startFrame = prev.currentFrame
      if (startFrame >= (prev.outPoint || prev.totalFrames)) {
        startFrame = prev.inPoint || 0
      }
      const updated = { ...prev, isPlaying: true, currentFrame: startFrame }
      applyFrameEvaluation(startFrame, updated)
      return updated
    })
  }, [applyFrameEvaluation])

  const handlePauseAnimation = useCallback(() => {
    setAnimationProject(prev => ({ ...prev, isPlaying: false }))
  }, [])

  const handleStopAnimation = useCallback(() => {
    setAnimationProject(prev => {
      const resetFrame = prev.inPoint || 0
      const updated = { ...prev, isPlaying: false, currentFrame: resetFrame }
      applyFrameEvaluation(resetFrame, updated)
      return updated
    })
  }, [applyFrameEvaluation])

  // Keyframing Callbacks
  const handleAddKeyframe = useCallback((trackId: string, frame: number, value: any) => {
    handleUpdateAnimationProject(prev => {
      const track = prev.tracks.find(t => t.id === trackId)
      if (!track) return prev

      const existingIndex = track.keyframes.findIndex(k => k.frame === frame)
      let newKeyframes: AnimationKeyframe[]

      if (existingIndex >= 0) {
        newKeyframes = [...track.keyframes]
        newKeyframes[existingIndex] = {
          ...newKeyframes[existingIndex],
          value
        }
      } else {
        const newKey: AnimationKeyframe = {
          id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          frame,
          value,
          interpolation: 'easeInOut'
        }
        newKeyframes = [...track.keyframes, newKey].sort((a, b) => a.frame - b.frame)
      }

      return {
        ...prev,
        tracks: prev.tracks.map(t => t.id === trackId ? { ...t, keyframes: newKeyframes } : t)
      }
    })
  }, [handleUpdateAnimationProject])

  const handleKeyframeAllTransform = useCallback((charId: string) => {
    const char = sceneCharacters.find(c => c.id === charId)
    if (!char) return

    handleUpdateAnimationProject(prev => {
      let updatedTracks = [...prev.tracks]

      // Position track
      let posTrack = updatedTracks.find(t => t.targetId === charId && t.property === 'position')
      if (posTrack) {
        const newKeys = [
          ...posTrack.keyframes.filter(k => k.frame !== prev.currentFrame),
          { id: `kf_pos_${Date.now()}`, frame: prev.currentFrame, value: [...char.position], interpolation: 'easeInOut' as const }
        ].sort((a, b) => a.frame - b.frame)
        updatedTracks = updatedTracks.map(t => t.id === posTrack!.id ? { ...t, keyframes: newKeys } : t)
      }

      // Rotation track
      let rotTrack = updatedTracks.find(t => t.targetId === charId && t.property === 'rotation')
      if (rotTrack) {
        const newKeys = [
          ...rotTrack.keyframes.filter(k => k.frame !== prev.currentFrame),
          { id: `kf_rot_${Date.now()}`, frame: prev.currentFrame, value: [...char.rotation], interpolation: 'easeInOut' as const }
        ].sort((a, b) => a.frame - b.frame)
        updatedTracks = updatedTracks.map(t => t.id === rotTrack!.id ? { ...t, keyframes: newKeys } : t)
      }

      showToast(`Keyframed transform at Frame ${prev.currentFrame}`)
      return { ...prev, tracks: updatedTracks }
    })
  }, [handleUpdateAnimationProject, sceneCharacters])

  const handleDeleteSelectedKeyframes = useCallback(() => {
    if (animationProject.selectedKeyframeIds.length === 0) return
    const idsToDelete = new Set(animationProject.selectedKeyframeIds)

    handleUpdateAnimationProject(prev => ({
      ...prev,
      selectedKeyframeIds: [],
      tracks: prev.tracks.map(t => ({
        ...t,
        keyframes: t.keyframes.filter(k => !idsToDelete.has(k.id))
      }))
    }))
    showToast('Deleted selected keyframes')
  }, [animationProject.selectedKeyframeIds, handleUpdateAnimationProject])

  const handleApplyClipToCharacter = useCallback((charId: string, clipOrType: any) => {
    const char = sceneCharacters.find(c => c.id === charId)
    const charName = char?.name || 'Character'

    // Extract clip properties safely whether passed a string or an object
    let parsedType: ClipType = 'walk'
    let clipName = 'Action Clip'
    let durationFrames = 60
    let speed = 1.0
    let blendWeight = 1.0
    let loop = true
    let customColor: string | undefined = undefined

    const validTypes: ClipType[] = ['idle', 'walk', 'run', 'jump', 'attack', 'dance', 'talk', 'wave', 'sit', 'custom']

    if (typeof clipOrType === 'string') {
      const lower = clipOrType.toLowerCase().trim()
      if (validTypes.includes(lower as ClipType)) {
        parsedType = lower as ClipType
      } else {
        parsedType = 'custom'
      }
      clipName = `${parsedType.toUpperCase()}_Action`
    } else if (clipOrType && typeof clipOrType === 'object') {
      const rawType = clipOrType.clipType || clipOrType.type || clipOrType.category
      if (typeof rawType === 'string') {
        const lower = rawType.toLowerCase().trim()
        if (validTypes.includes(lower as ClipType)) {
          parsedType = lower as ClipType
        } else {
          parsedType = 'custom'
        }
      }
      clipName = clipOrType.name || `${parsedType.toUpperCase()}_Action`
      durationFrames = clipOrType.durationFrames || clipOrType.frames || clipOrType.duration || 60
      if (typeof clipOrType.speed === 'number') speed = clipOrType.speed
      if (typeof clipOrType.blendWeight === 'number') blendWeight = clipOrType.blendWeight
      if (typeof clipOrType.loop === 'boolean') loop = clipOrType.loop
      if (typeof clipOrType.color === 'string') customColor = clipOrType.color
    }

    const defaultColor = parsedType === 'walk' 
      ? '#3B82F6' 
      : (parsedType === 'talk' 
        ? '#EC4899' 
        : (parsedType === 'wave' 
          ? '#8C7BFF' 
          : (parsedType === 'run' ? '#F59E0B' : '#10B981')))

    handleUpdateAnimationProject(prev => {
      let tracks = [...prev.tracks]
      let clipTrack = tracks.find(t => t.targetId === charId && t.property === 'clip')

      const newClip: AnimationClip = {
        id: `clip_${Date.now()}_${parsedType}`,
        name: clipName,
        type: parsedType,
        startFrame: prev.currentFrame,
        durationFrames,
        speed,
        blendWeight,
        loop,
        color: customColor || defaultColor
      }

      if (!clipTrack) {
        clipTrack = {
          id: `track_${charId}_clips`,
          name: `${charName} - Action Clips`,
          targetId: charId,
          targetName: charName,
          targetType: 'character',
          property: 'clip',
          color: '#3B82F6',
          expanded: true,
          keyframes: [],
          clips: [newClip]
        }
        tracks.push(clipTrack)
      } else {
        tracks = tracks.map(t => t.id === clipTrack!.id ? {
          ...t,
          clips: [...(t.clips || []), newClip]
        } : t)
      }

      const updated = { ...prev, tracks }
      applyFrameEvaluation(prev.currentFrame, updated)
      showToast(`Applied ${clipName} clip at frame ${prev.currentFrame}`)
      return updated
    })
  }, [applyFrameEvaluation, handleUpdateAnimationProject, sceneCharacters])

  const handleGenerateLipSync = useCallback((charId: string, text: string) => {
    const phonemes = generateLipSyncFromText(text, animationProject.fps || 24, animationProject.currentFrame)
    if (phonemes.length === 0) return

    handleUpdateAnimationProject(prev => {
      let tracks = [...prev.tracks]
      const char = sceneCharacters.find(c => c.id === charId)
      const charName = char?.name || 'Character'

      for (const p of phonemes) {
        let expTrack = tracks.find(t => t.targetId === charId && t.property === 'expression' && t.subProperty === p.viseme)
        if (!expTrack) {
          expTrack = {
            id: `track_${charId}_viseme_${p.viseme}`,
            name: `${charName} - Lip (${p.viseme.toUpperCase()})`,
            targetId: charId,
            targetName: charName,
            targetType: 'character',
            property: 'expression',
            subProperty: p.viseme,
            color: '#EC4899',
            keyframes: []
          }
          tracks.push(expTrack)
        }

        const newKeys = [
          ...expTrack.keyframes.filter(k => k.frame !== p.frame),
          { id: `kf_lip_${Date.now()}_${p.frame}`, frame: p.frame, value: p.weight, interpolation: 'easeInOut' as const }
        ].sort((a, b) => a.frame - b.frame)

        tracks = tracks.map(t => t.id === expTrack!.id ? { ...t, keyframes: newKeys } : t)
      }

      const newMarker: TimelineMarker = {
        id: `marker_dlg_${Date.now()}`,
        frame: prev.currentFrame,
        label: `Speech: "${text.substring(0, 18)}..."`,
        color: '#EC4899',
        category: 'dialogue'
      }

      showToast(`Generated lip-sync visemes for "${text.substring(0, 18)}..."`)
      return {
        ...prev,
        markers: [...prev.markers, newMarker],
        tracks
      }
    })
  }, [animationProject.currentFrame, animationProject.fps, handleUpdateAnimationProject, sceneCharacters])

  const handleUpdateCharacterStateFromInspector = useCallback((charId: string, updater: (prev: VRMAvatarState) => VRMAvatarState) => {
    setSceneCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        return { ...c, state: updater(c.state) }
      }
      return c
    }))
  }, [])

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (editorMode === 'scene' && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      handleImportGLBProp(file)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async event => {
      const buffer = event.target?.result as ArrayBuffer
      if (buffer) {
        processVRMBuffer(buffer, file.name)
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  // Global Keyboard Shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveCurrentCharacter()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        handleRedo()
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault()
        toggleFocusMode()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setCommandPaletteOpen(!isCommandPaletteOpen)
      } else if (e.key === 'Escape') {
        if (isFocusMode) {
          e.preventDefault()
          toggleFocusMode()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [avatarState, historyIndex, history, toggleFocusMode, setCommandPaletteOpen, isFocusMode])

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (editorMode === 'scene' && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      handleImportGLBProp(file)
    } else if (file.name.endsWith('.vrm') || file.name.endsWith('.glb')) {
      const reader = new FileReader()
      reader.onload = async event => {
        const buffer = event.target?.result as ArrayBuffer
        if (buffer) {
          processVRMBuffer(buffer, file.name)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      showToast('Please drop a valid 3D .vrm, .glb, or .gltf asset')
    }
  }

  // Handle dragging an asset directly onto the 3D Viewport canvas
  const handleDropAssetOnViewport = useCallback((type: string, payload: any, worldPos: [number, number, number]) => {
    const safeWorldPos: [number, number, number] = [
      Array.isArray(worldPos) && Number.isFinite(worldPos[0]) ? worldPos[0] : 0,
      0, // Ground level Y = 0 strictly
      Array.isArray(worldPos) && Number.isFinite(worldPos[2]) ? worldPos[2] : 0
    ]
    if (type === VOOM_DRAG_TYPES.CHARACTER) {
      const charRecord = characterList.find(c => c.id === payload.characterId) || characterList[0]
      if (charRecord) {
        handleAddCharacterToScene(charRecord.id, safeWorldPos)
      }
    } else if (type === VOOM_DRAG_TYPES.PROP) {
      if (payload.presetId) {
        handleAddStarterProp(payload.presetId, safeWorldPos)
      }
    } else if (type === VOOM_DRAG_TYPES.LIGHT) {
      if (payload.preset) {
        handleAvatarStateChange(prev => ({
          ...prev,
          backdrop: payload.preset.backdrop,
          lighting: {
            ...prev.lighting,
            keyLightColor: payload.preset.keyColor,
            fillLightColor: payload.preset.fillColor,
            rimLightColor: payload.preset.rimColor,
            ambientIntensity: payload.preset.ambientIntensity,
            keyLightIntensity: payload.preset.keyIntensity
          }
        }))
        showToast(`Applied ${payload.name} Lighting`)
      }
    } else if (type === VOOM_DRAG_TYPES.CAMERA) {
      const shot = cameraShots.find(s => s.id === payload.shotId)
      if (shot) {
        handleApplyCameraShot(shot)
        showToast(`Switched to ${shot.name}`)
      }
    } else if (type === VOOM_DRAG_TYPES.ANIMATION) {
      const targetCharId = selectedEntity?.type === 'character' ? selectedEntity.id : sceneCharacters[0]?.id
      if (targetCharId) {
        handleApplyClipToCharacter(targetCharId, payload.clipType || 'walk')
        showToast(`Applied ${payload.name} animation`)
      }
    } else if (type === VOOM_DRAG_TYPES.POSE) {
      handleAvatarStateChange(prev => ({
        ...prev,
        activePosePreset: payload.poseKey
      }))
      showToast(`Applied ${payload.name} pose`)
    }
  }, [characterList, handleAddCharacterToScene, handleAddStarterProp, cameraShots, handleApplyCameraShot, selectedEntity, sceneCharacters, handleApplyClipToCharacter, handleAvatarStateChange])

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#0A0A0C] text-white p-6">
        <div className="max-w-md w-full bg-[#16121E] border border-[#2E2548] rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Studio Initialization Issue</h2>
          <p className="text-xs text-[#A09BB5] mb-6 leading-relaxed">
            {initError}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setInitError(null)
                setIsInitializing(true)
                window.location.reload()
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#28203F] hover:bg-[#342A52] text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.clear()
                } catch {}
                window.location.reload()
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D32F2F] to-[#E53935] hover:opacity-90 text-xs font-bold text-white transition-opacity cursor-pointer"
            >
              Reset Workspace
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#0A0A0C] text-white">
        <div className="flex items-center gap-3 text-sm font-bold">
          <div className="w-4 h-4 border-2 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
          <span>Initializing VoomToon Studio...</span>
        </div>
      </div>
    )
  }

  const commonPanelProps = {
    avatarState,
    onAvatarStateChange: handleAvatarStateChange,
    savedCharacters: characterList,
    activeCharacterId,
    onSelectCharacter: handleSelectCharacter,
    onDeleteCharacterRecord: handleDeleteCharacter,
    onCreateNewCharacter: handleCreateNewTemplate,
    onUploadCustomVRM: () => fileInputRef.current?.click(),
    sceneCharacters,
    sceneProps,
    selectedEntity,
    selectedPropId,
    gizmoMode,
    gizmoSpace,
    cameraShots,
    activeCameraShotId,
    onSelectEntity: setSelectedEntity,
    onSelectProp: (id: string | null) => {
      setSelectedPropId(id)
      if (id) setSelectedEntity({ type: 'prop', id })
    },
    onAddPropFromPreset: handleAddStarterProp,
    onUploadCustomProp: handleImportGLBProp,
    onDeleteProp: handleDeleteProp,
    onDeleteCharacterFromScene: handleDeleteCharacterFromScene,
    onApplyCameraShot: handleApplyCameraShot,
    onSaveCurrentCameraView: handleSaveCurrentCameraView,
    onDeleteCameraShot: handleDeleteCameraShot,
    onUpdateCameraPosition: handleUpdateCameraShotPosition,
    onUpdatePropTransform: handleUpdateProp,
    onUpdateCharacterTransform: handleUpdateCharacterTransform,
    onDuplicateProp: handleDuplicateProp,
    onDuplicateCharacter: handleDuplicateCharacterInScene,
    onAutoFitPropScale: handleAutoFitPropScale,
    onFocusEntity: () => viewportRef.current?.focusSelected(),
    animationProject,
    onUpdateAnimationProject: handleUpdateAnimationProject,
    onPlayAnimation: handlePlayAnimation,
    onPauseAnimation: handlePauseAnimation,
    onStopAnimation: handleStopAnimation,
    onSeekAnimation: handleSeekAnimation,
    onAddKeyframeCurrent: () => {
      if (selectedEntity?.type === 'character') {
        handleKeyframeAllTransform(selectedEntity.id)
      }
    },
    onDeleteSelectedKeyframes: handleDeleteSelectedKeyframes,
    onApplyClipToCharacter: handleApplyClipToCharacter,
    onGenerateLipSync: (text: string) => {
      const targetId = selectedEntity?.type === 'character' ? selectedEntity.id : sceneCharacters[0]?.id
      if (targetId) handleGenerateLipSync(targetId, text)
    },
    onApplyLightingPreset: (preset: any) => {
      handleAvatarStateChange(prev => ({
        ...prev,
        backdrop: preset.backdrop,
        lighting: {
          ...prev.lighting,
          keyLightColor: preset.keyColor,
          fillLightColor: preset.fillColor,
          rimLightColor: preset.rimColor,
          ambientIntensity: preset.ambientIntensity,
          keyLightIntensity: preset.keyIntensity
        }
      }))
      showToast(`Applied ${preset.name} Lighting`)
    },
    onTriggerRenderModal: () => setIsRenderModalOpen(true),
    hasUnsavedChanges,
    onRenameCharacterRecord: handleRenameCharacter,
    onDuplicateCharacterRecord: handleDuplicateCharacter,
    editorMode,
    viewportHiddenCharacterIds,
    onToggleCharacterViewportVisibility: handleToggleCharacterViewport
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-[#0A0A0C] text-[#E0E0E5] overflow-hidden font-sans select-none relative"
    >
      {/* Hidden File Input for VRM upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".vrm,.glb"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Full-Screen Drag and Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md border-4 border-dashed border-[#D32F2F] pointer-events-none animate-in fade-in">
          <Upload className="w-16 h-16 text-[#D32F2F] animate-bounce mb-4" />
          <h2 className="text-2xl font-black uppercase text-white tracking-wide">
            {editorMode === 'scene' ? 'Drop .GLB / .GLTF Prop Here' : 'Drop .VRM Avatar File Here'}
          </h2>
          <p className="text-sm text-[#A0A0B0] mt-1">
            {editorMode === 'scene' 
              ? 'Static 3D environment object will be placed into the scene instantly' 
              : 'Exact 1:1 character geometry, textures & bones will be parsed instantly'}
          </p>
        </div>
      )}

      {/* Top Bar with Mode Switcher & Workspace Preset Switcher */}
      <EditorTopBar
        characterName={avatarState ? (avatarState.meta.title || avatarState.fileName || 'Untitled') : 'No Character Selected'}
        hasUnsavedChanges={hasUnsavedChanges}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        editorMode={editorMode}
        onModeChange={setEditorMode}
        onNameChange={newName => {
          if (!avatarState) return
          handleAvatarStateChange(prev => ({
            ...prev,
            meta: {
              ...prev.meta,
              title: newName
            }
          }))
        }}
        onSave={handleSaveCurrentCharacter}
        onExportClick={() => {
          if (editorMode === 'animation') {
            setIsRenderModalOpen(true)
          } else {
            if (!avatarState) {
              showToast('Please create or select a character first to export')
              return
            }
            setIsExportOpen(true)
          }
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleResetCharacter}
        onUploadClick={() => fileInputRef.current?.click()}
        workspaceControls={
          <WorkspaceHeaderControls
            activePreset={layout.activePreset}
            onSelectPreset={selectPreset}
            onResetLayout={resetLayout}
            onSaveCustomPreset={saveCustomPreset}
            customPresets={layout.customPresets}
            onDeleteCustomPreset={deleteCustomPreset}
            onToggleFocusMode={toggleFocusMode}
            isFocusMode={isFocusMode}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onToggleToolShelf={toggleToolShelf}
            showToolShelf={layout.showToolShelf}
            mode={layout.mode}
            onToggleMode={toggleMode}
            allPanels={allPanelIds}
            openPanelIds={openPanelIds}
            onOpenPanel={openPanel}
          />
        }
      />

      {/* Dockable Studio Workstation */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
        {/* If Focus Mode is active: Maximize Viewport with subtle overlay to exit */}
        {isFocusMode ? (
          <div className="flex-1 relative flex flex-col min-w-0 min-h-0 bg-[#0A0A0C]">
            <div className="flex-1 relative min-h-0 min-w-0">
              <VRMViewport3D
                ref={viewportRef}
                vrm={vrm}
                avatarState={avatarState}
                sceneMode={editorMode === 'scene' || editorMode === 'animation'}
                sceneCharacters={sceneCharacters}
                sceneProps={sceneProps}
                selectedEntity={selectedEntity}
                selectedPropId={selectedPropId}
                gizmoMode={gizmoMode}
                gizmoSpace={gizmoSpace}
                cameraShots={cameraShots}
                activeCameraShotId={activeCameraShotId}
                isSceneTreeOpen={false}
                onToggleSceneTree={() => {}}
                onApplyCameraShot={handleApplyCameraShot}
                onSaveCurrentCameraView={handleSaveCurrentCameraView}
                onDeleteCameraShot={handleDeleteCameraShot}
                onOverwriteCameraShot={handleOverwriteCameraShot}
                onRenameCameraShot={handleRenameCameraShot}
                onResetToDefaultCameraView={handleResetToDefaultCameraView}
                onUpdateCameraPosition={handleUpdateCameraShotPosition}
                onGizmoModeChange={setGizmoMode}
                onGizmoSpaceChange={setGizmoSpace}
                onSelectEntity={setSelectedEntity}
                onSelectProp={id => {
                  setSelectedPropId(id)
                  if (id) setSelectedEntity({ type: 'prop', id })
                }}
                onUpdatePropTransform={handleUpdateProp}
                onUpdateCharacterTransform={handleUpdateCharacterTransform}
                onAvatarStateChange={handleAvatarStateChange}
                onUploadClick={() => fileInputRef.current?.click()}
                isLoadingVRM={isLoadingVRM}
                loadingProgress={loadingProgress}
                onDropAsset={handleDropAssetOnViewport}
              />
            </div>
            {/* Floating indicator to exit focus mode */}
            <button
              onClick={toggleFocusMode}
              className="absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14141C]/90 hover:bg-[#20202E] border border-[#2B2B3C] text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-all cursor-pointer group"
              title="Exit Focus Mode (Ctrl+Space or Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-[#00E676] group-hover:scale-110 transition-transform" />
              <span>Exit Focus Mode</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#20202C] text-[10px] text-[#A0A0B5]">Esc</kbd>
            </button>
          </div>
        ) : editorMode === 'character' ? (
          <div className="flex-1 w-full h-full flex flex-row min-w-0 min-h-0 overflow-hidden relative">
            {/* Column (a): Character Library (Left Sidebar) */}
            <div className="w-72 shrink-0 h-full flex flex-col z-20">
              <CharacterLibrarySidebar
                characters={characterList}
                activeCharacterId={activeCharacterId}
                hasUnsavedChanges={hasUnsavedChanges}
                viewportHiddenCharacterIds={viewportHiddenCharacterIds}
                onSelectCharacter={handleSelectCharacter}
                onCreateNew={handleCreateNewCharacterWithTemplate}
                onUploadClick={() => fileInputRef.current?.click()}
                onDuplicateCharacter={handleDuplicateCharacter}
                onDeleteCharacter={handleDeleteCharacter}
                onRenameCharacter={handleRenameCharacter}
                onToggleViewportVisibility={handleToggleCharacterViewport}
              />
            </div>

            {/* Column (b): Center Viewport + Pose Library */}
            <main className="flex-1 relative flex flex-col min-w-[360px] min-h-0 h-full bg-[#16121E] overflow-hidden">
              <div className="flex-1 relative min-h-0 min-w-0 w-full overflow-hidden">
                <VRMViewport3D
                  ref={viewportRef}
                  vrm={vrm}
                  avatarState={avatarState}
                  sceneMode={false}
                  editorMode="character"
                  activeCharacterId={activeCharacterId}
                  activeCharacterName={characterList.find(c => c.id === activeCharacterId)?.name}
                  isCharacterViewportHidden={viewportHiddenCharacterIds.includes(activeCharacterId)}
                  onToggleActiveCharacterViewport={() => handleToggleCharacterViewport(activeCharacterId)}
                  sceneCharacters={sceneCharacters}
                  sceneProps={sceneProps}
                  selectedEntity={selectedEntity}
                  selectedPropId={selectedPropId}
                  gizmoMode={gizmoMode}
                  gizmoSpace={gizmoSpace}
                  cameraShots={cameraShots}
                  activeCameraShotId={activeCameraShotId}
                  isSceneTreeOpen={false}
                  onToggleSceneTree={() => {}}
                  onApplyCameraShot={handleApplyCameraShot}
                  onSaveCurrentCameraView={handleSaveCurrentCameraView}
                  onDeleteCameraShot={handleDeleteCameraShot}
                  onOverwriteCameraShot={handleOverwriteCameraShot}
                  onRenameCameraShot={handleRenameCameraShot}
                  onResetToDefaultCameraView={handleResetToDefaultCameraView}
                  onUpdateCameraPosition={handleUpdateCameraShotPosition}
                  onGizmoModeChange={setGizmoMode}
                  onGizmoSpaceChange={setGizmoSpace}
                  onSelectEntity={setSelectedEntity}
                  onSelectProp={id => {
                    setSelectedPropId(id)
                    if (id) setSelectedEntity({ type: 'prop', id })
                  }}
                  onUpdatePropTransform={handleUpdateProp}
                  onUpdateCharacterTransform={handleUpdateCharacterTransform}
                  onAvatarStateChange={handleAvatarStateChange}
                  onUploadClick={() => fileInputRef.current?.click()}
                  isLoadingVRM={isLoadingVRM}
                  loadingProgress={loadingProgress}
                  onDropAsset={handleDropAssetOnViewport}
                  spawnPlacementPoint={spawnPlacementPoint}
                  onSetSpawnPlacementPoint={setSpawnPlacementPoint}
                />
              </div>

              {/* Bottom Pose Library Bar */}
              <div className="h-52 shrink-0 border-t border-[#2E2548] overflow-hidden">
                <BottomPoseLibrary
                  activePosePreset={avatarState?.activePosePreset || 'naturalStand'}
                  onApplyPose={handleApplyPosePreset}
                  onSelectPosePreset={handleApplyPosePreset}
                />
              </div>
            </main>

            {/* Column (c): Editing tabs/sliders panel (Right Sidebar) */}
            <div className="w-84 shrink-0 h-full flex flex-col z-20 bg-[#16121E] border-l border-[#2E2548]">
              {avatarState ? (
                <CharacterEditorSidebar
                  avatarState={avatarState}
                  onChange={handleAvatarStateChange}
                  onTakeScreenshot={(res, transparent) => {
                    const dataUrl = viewportRef.current?.captureScreenshot(res || '1080p', transparent) || ''
                    if (dataUrl) {
                      const link = document.createElement('a')
                      link.download = `${avatarState.meta.title || 'character'}_render.png`
                      link.href = dataUrl
                      link.click()
                      showToast('Screenshot downloaded')
                    }
                    return dataUrl
                  }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#8A81A6]">
                  <p className="text-xs font-semibold text-[#E2DCF0] mb-1">No Character Selected</p>
                  <p className="text-[11px] text-[#8A81A6] leading-relaxed">
                    Select a character from the library or create a new one to customize expressions, clothing materials, and metadata.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : editorMode === 'scene' ? (
          <SceneBuilderLayout
            viewportRef={viewportRef}
            vrm={vrm}
            avatarState={avatarState}
            onAvatarStateChange={handleAvatarStateChange}
            characterList={characterList}
            activeCharacterId={activeCharacterId}
            sceneCharacters={sceneCharacters}
            sceneProps={sceneProps}
            selectedEntity={selectedEntity}
            onSelectEntity={handleSelectEntityInScene}
            selectedPropId={selectedPropId}
            onSelectProp={id => {
              setSelectedPropId(id)
              if (id) setSelectedEntity({ type: 'prop', id })
            }}
            gizmoMode={gizmoMode}
            gizmoSpace={gizmoSpace}
            onGizmoModeChange={setGizmoMode}
            onGizmoSpaceChange={setGizmoSpace}
            cameraShots={cameraShots}
            activeCameraShotId={activeCameraShotId}
            onApplyCameraShot={handleApplyCameraShot}
            onSaveCurrentCameraView={handleSaveCurrentCameraView}
            onDeleteCameraShot={handleDeleteCameraShot}
            onOverwriteCameraShot={handleOverwriteCameraShot}
            onRenameCameraShot={handleRenameCameraShot}
            onResetToDefaultCameraView={handleResetToDefaultCameraView}
            onUpdateCameraPosition={handleUpdateCameraShotPosition}
            onAddCamera={handleAddCustomCamera}
            onUpdateCameraShot={handleUpdateCameraShot}
            onAddCharacterToScene={handleAddCharacterToScene}
            onDuplicateCharacter={handleDuplicateCharacter}
            onDeleteCharacter={handleDeleteCharacterFromScene}
            onToggleCharacterVisibility={handleToggleCharacterVisibility}
            onToggleCharacterLock={handleToggleCharacterLock}
            onAddStarterProp={handleAddStarterProp}
            onUploadCustomProp={handleImportGLBProp}
            onDeleteProp={handleDeleteProp}
            onUpdatePropTransform={handleUpdateProp}
            onUpdateCharacterTransform={handleUpdateCharacterTransform}
            onApplyClipToCharacter={handleApplyClipToCharacter}
            onApplyPosePreset={handleApplyPosePreset}
            isLoadingVRM={isLoadingVRM}
            loadingProgress={loadingProgress}
            onDropAsset={handleDropAssetOnViewport}
            onClearScene={handleClearScene}
            spawnPlacementPoint={spawnPlacementPoint}
            onSetSpawnPlacementPoint={setSpawnPlacementPoint}
          />
        ) : editorMode === 'animation' ? (
          <AnimationCinemaLayout
            sceneCharacters={sceneCharacters}
            characterList={characterList}
            activeCharacterId={activeCharacterId}
            onSelectCharacter={charId => {
              const record = characterList.find(c => c.id === charId)
              if (record) handleSelectCharacter(record)
            }}
            selectedEntity={selectedEntity}
            cameraShots={cameraShots}
            activeCameraShotId={activeCameraShotId}
            onApplyCameraShot={handleApplyCameraShot}
            onSaveCurrentCameraView={handleSaveCurrentCameraView}
            viewportRef={viewportRef}
            vrm={vrm}
            avatarState={avatarState}
            sceneProps={sceneProps}
            isLoadingVRM={isLoadingVRM}
            loadingProgress={loadingProgress}
            animationProject={animationProject}
            onUpdateProject={setAnimationProject}
            onApplyClipToCharacter={handleApplyClipToCharacter}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onOpenRenderModal={() => setIsRenderModalOpen(true)}
          />
        ) : (
          <>
            {/* Quick Access Tool Shelf (collapsible left strip) */}
            <ToolShelf
              isOpen={layout.showToolShelf}
              onToggleOpen={toggleToolShelf}
              onOpenPanel={openPanel}
              activePanelIds={openPanelIds}
            />

            {/* Left Dock Zone */}
            <DockZoneContainer
              zone="left"
              dockedPanels={layout.dockedPanels.left}
              activeTab={layout.activeTabs.left}
              size={layout.leftWidth}
              isCollapsed={layout.leftCollapsed}
              maximizedPanelId={layout.maximizedPanelId}
              pinnedPanels={layout.pinnedPanels}
              allAvailablePanels={allPanelIds}
              onSelectTab={panelId => selectZoneTab('left', panelId)}
              onClosePanel={closePanel}
              onDockPanel={dockPanel}
              onUndockPanel={undockPanel}
              onToggleMaximize={toggleMaximizePanel}
              onToggleCollapse={() => toggleCollapseZone('left')}
              onTogglePin={togglePinPanel}
              onResize={width => updateZoneSize('left', width)}
              renderPanelContent={panelId => (
                <WorkspacePanelRenderer
                  panelId={panelId}
                  {...commonPanelProps}
                />
              )}
            />

            {/* Center Area: 3D Viewport + Bottom Zone */}
            <main className="flex-1 relative flex flex-col min-w-0 min-h-0 bg-[#0A0A0C] overflow-hidden">
              {/* Viewport Canvas */}
              <div className="flex-1 relative min-h-0 min-w-0">
                <VRMViewport3D
                  ref={viewportRef}
                  vrm={vrm}
                  avatarState={avatarState}
                  sceneMode={editorMode === 'scene' || editorMode === 'animation'}
                  editorMode={editorMode}
                  activeCharacterId={activeCharacterId}
                  activeCharacterName={characterList.find(c => c.id === activeCharacterId)?.name}
                  isCharacterViewportHidden={viewportHiddenCharacterIds.includes(activeCharacterId)}
                  onToggleActiveCharacterViewport={() => handleToggleCharacterViewport(activeCharacterId)}
                  sceneCharacters={sceneCharacters}
                  sceneProps={sceneProps}
                  selectedEntity={selectedEntity}
                  selectedPropId={selectedPropId}
                  gizmoMode={gizmoMode}
                  gizmoSpace={gizmoSpace}
                  cameraShots={cameraShots}
                  activeCameraShotId={activeCameraShotId}
                  isSceneTreeOpen={layout.dockedPanels.left.includes('outliner') || layout.dockedPanels.left.includes('scene')}
                  onToggleSceneTree={() => openPanel('outliner', 'left')}
                  onApplyCameraShot={handleApplyCameraShot}
                  onSaveCurrentCameraView={handleSaveCurrentCameraView}
                  onDeleteCameraShot={handleDeleteCameraShot}
                  onOverwriteCameraShot={handleOverwriteCameraShot}
                  onRenameCameraShot={handleRenameCameraShot}
                  onResetToDefaultCameraView={handleResetToDefaultCameraView}
                  onUpdateCameraPosition={handleUpdateCameraShotPosition}
                  onGizmoModeChange={setGizmoMode}
                  onGizmoSpaceChange={setGizmoSpace}
                  onSelectEntity={setSelectedEntity}
                  onSelectProp={id => {
                    setSelectedPropId(id)
                    if (id) setSelectedEntity({ type: 'prop', id })
                  }}
                  onUpdatePropTransform={handleUpdateProp}
                  onUpdateCharacterTransform={handleUpdateCharacterTransform}
                  onAvatarStateChange={handleAvatarStateChange}
                  onUploadClick={() => fileInputRef.current?.click()}
                  isLoadingVRM={isLoadingVRM}
                  loadingProgress={loadingProgress}
                  onDropAsset={handleDropAssetOnViewport}
                />
              </div>

              {/* Bottom Dock Zone (Timeline, Dope Sheet, Graph Editor, Audio, etc.) */}
              <DockZoneContainer
                zone="bottom"
                dockedPanels={layout.dockedPanels.bottom}
                activeTab={layout.activeTabs.bottom}
                size={layout.bottomHeight}
                isCollapsed={layout.bottomCollapsed}
                maximizedPanelId={layout.maximizedPanelId}
                pinnedPanels={layout.pinnedPanels}
                allAvailablePanels={allPanelIds}
                onSelectTab={panelId => selectZoneTab('bottom', panelId)}
                onClosePanel={closePanel}
                onDockPanel={dockPanel}
                onUndockPanel={undockPanel}
                onToggleMaximize={toggleMaximizePanel}
                onToggleCollapse={() => toggleCollapseZone('bottom')}
                onTogglePin={togglePinPanel}
                onResize={height => updateZoneSize('bottom', height)}
                renderPanelContent={panelId => (
                  <WorkspacePanelRenderer
                    panelId={panelId}
                    {...commonPanelProps}
                  />
                )}
              />
            </main>

            {/* Right Dock Zone */}
            <DockZoneContainer
              zone="right"
              dockedPanels={layout.dockedPanels.right}
              activeTab={layout.activeTabs.right}
              size={layout.rightWidth}
              isCollapsed={layout.rightCollapsed}
              maximizedPanelId={layout.maximizedPanelId}
              pinnedPanels={layout.pinnedPanels}
              allAvailablePanels={allPanelIds}
              onSelectTab={panelId => selectZoneTab('right', panelId)}
              onClosePanel={closePanel}
              onDockPanel={dockPanel}
              onUndockPanel={undockPanel}
              onToggleMaximize={toggleMaximizePanel}
              onToggleCollapse={() => toggleCollapseZone('right')}
              onTogglePin={togglePinPanel}
              onResize={width => updateZoneSize('right', width)}
              renderPanelContent={panelId => (
                <WorkspacePanelRenderer
                  panelId={panelId}
                  {...commonPanelProps}
                />
              )}
            />
          </>
        )}

        {/* Floating Detached Panels */}
        {Object.entries(layout.floatingPanels).map(([pId, rect]) => {
          if (!rect) return null
          const panelId = pId as PanelId
          return (
            <FloatingPanel
              key={panelId}
              panelId={panelId}
              rect={rect}
              isPinned={!!layout.pinnedPanels[panelId]}
              onUpdateRect={newRect => updateFloatingRect(panelId, newRect)}
              onDock={targetZone => dockPanel(panelId, targetZone)}
              onClose={() => closePanel(panelId)}
              onTogglePin={() => togglePinPanel(panelId)}
            >
              <WorkspacePanelRenderer
                panelId={panelId}
                {...commonPanelProps}
              />
            </FloatingPanel>
          )
        })}

        {/* Maximize Single Panel Overlay (if a panel is maximized) */}
        {layout.maximizedPanelId && layout.maximizedPanelId !== 'viewport' && (
          <div className="absolute inset-0 z-40 bg-[#0D0D12] flex flex-col animate-in fade-in duration-150">
            <div className="h-10 bg-[#14141C] border-b border-[#20202C] flex items-center justify-between px-4">
              <span className="font-bold text-sm text-white">
                {PANEL_DEFINITIONS[layout.maximizedPanelId]?.name || layout.maximizedPanelId} (Maximized)
              </span>
              <button
                onClick={() => toggleMaximizePanel(layout.maximizedPanelId!)}
                className="p-1.5 rounded-lg bg-[#20202E] hover:bg-[#2B2B3C] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Restore Panel</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <WorkspacePanelRenderer
                panelId={layout.maximizedPanelId}
                {...commonPanelProps}
              />
            </div>
          </div>
        )}

        {/* Visual Docking Drop Overlay during panel drag */}
        <DockingOverlay
          isDragging={isDraggingPanel}
          activeDropZone={activeDropZone}
          activeZone={activeDropZone}
          onHoverZone={setActiveDropZone}
          onDrop={(zone) => {
            if (isDraggingPanel) {
              if (zone === 'center') {
                // Dock into right panel group or default
                dockPanel(isDraggingPanel, 'right')
              } else {
                dockPanel(isDraggingPanel, zone)
              }
            }
            resetDragState()
          }}
          onClose={resetDragState}
        />
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenPanel={openPanel}
        onLoadPreset={selectPreset}
        onResetLayout={resetLayout}
        onFocusViewport={toggleFocusMode}
        onFocusTimeline={() => openPanel('timeline', 'bottom')}
        onAddCameraShot={handleSaveCurrentCameraView}
        onAddProp={() => openPanel('assets', 'left')}
        onAddCharacter={() => openPanel('characters', 'left')}
        onTriggerRender={() => setIsRenderModalOpen(true)}
        onApplyAnimation={(clip) => {
          const targetId = selectedEntity?.type === 'character' ? selectedEntity.id : sceneCharacters[0]?.id
          if (targetId) handleApplyClipToCharacter(targetId, clip)
        }}
        onApplyPose={(poseKey) => {
          handleAvatarStateChange(prev => ({ ...prev, activePosePreset: poseKey }))
        }}
      />

      {/* Animation Render Movie Modal */}
      <AnimationRenderModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        project={animationProject}
        onSeekFrame={handleSeekAnimation}
        getCanvasElement={() => document.querySelector('canvas')}
      />

      {/* Export Modal */}
      <VRMExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        avatarState={avatarState}
        rawVrmBuffer={rawVRMBuffer}
        getVRMScene={() => viewportRef.current?.getVRMScene() || null}
        takeScreenshot={(resolution, transparent) => {
          return viewportRef.current?.takeScreenshot(resolution, transparent) || ''
        }}
      />

      {/* Unsaved Changes Guard Dialog */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        characterName={avatarState ? (avatarState.meta.title || avatarState.fileName || 'Character') : 'Character'}
        onSaveAndSwitch={async () => {
          await handleSaveCurrentCharacter()
          setShowUnsavedModal(false)
          if (pendingTargetCharacter) {
            await executeSwitchCharacter(pendingTargetCharacter)
            setPendingTargetCharacter(null)
          }
        }}
        onDiscardAndSwitch={async () => {
          setShowUnsavedModal(false)
          if (pendingTargetCharacter) {
            await executeSwitchCharacter(pendingTargetCharacter)
            setPendingTargetCharacter(null)
          }
        }}
        onCancel={() => {
          setShowUnsavedModal(false)
          setPendingTargetCharacter(null)
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14141C] border border-[#00E676] text-[#00E676] font-bold text-xs shadow-2xl animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default function Editor() {
  return (
    <WorkspaceProvider>
      <EditorInner />
    </WorkspaceProvider>
  )
}
