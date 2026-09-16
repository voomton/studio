import React, { useEffect, useRef, useState, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { 
  VRMAvatarState, 
  DEFAULT_AVATAR_STATE,
  DEFAULT_PROPORTIONS,
  DEFAULT_MATERIALS,
  applyBoneRotations, 
  applyExpressionWeights,
  applyProportions,
  applyMaterialSettings,
  loadVRMFromArrayBuffer
} from '../utils/vrmManager'
import {
  playMixamoAnimation,
  loadAndPlayMixamoAnimation,
  stopMixamoAnimation,
  isAnimatedPoseKey,
  getMixamoAnimationConfig
} from '../utils/mixamoAnimation'
import { SceneProp, SceneCharacterInstance, SceneEntitySelection, GizmoMode, GizmoSpace, SceneCameraShot } from '../types/scene'
import { loadGLBPropFromArrayBuffer, createStarterPropMesh, calculateAutoFitScale, cleanAndPrunePropMesh } from '../utils/propManager'
import { createProceduralAnimeRig } from '../utils/vrmStorage'
import { VOOM_DRAG_TYPES, getDragData } from '../utils/dragDropAsset'
import { 
  RotateCw, 
  Grid, 
  Maximize2, 
  Minimize2,
  Upload,
  Camera,
  Compass,
  Sparkles,
  Move,
  Globe,
  ArrowDownToLine,
  Focus,
  User,
  Box,
  X,
  Video,
  Plus,
  ChevronDown,
  Check,
  RotateCcw,
  Layers,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  EyeOff,
  Minus,
  Target,
  MapPin
} from 'lucide-react'
import { OrientationGizmo, AxisDirection } from './SceneBuilder/OrientationGizmo'

export interface VRMViewportHandle {
  takeScreenshot: (resolution?: '1080p' | '2k' | '4k', transparent?: boolean) => string
  captureScreenshot?: (resolution?: '1080p' | '2k' | '4k', transparent?: boolean) => string
  resetCamera: () => void
  resetView: (animate?: boolean) => void
  setCameraShot: (shot: 'front' | 'face' | 'bust' | 'sideLeft' | 'sideRight' | 'back' | 'top' | 'iso') => void
  snapCameraToDirection: (dir: AxisDirection) => void
  orbitByDelta: (deltaX: number, deltaY: number) => void
  subscribeCameraChange: (cb: (quaternion: THREE.Quaternion) => void) => () => void
  getVRMScene: () => THREE.Group | null
  getPropAutoFitScale: (propId: string) => number
  focusSelected: () => void
  frameScene: (animate?: boolean) => void
  frameObject: (targetObj: THREE.Object3D, animate?: boolean) => void
  frameProp: (propId: string, animate?: boolean) => void
  getCameraState: () => { position: [number, number, number]; target: [number, number, number]; fov: number } | null
  applyCameraShot: (shot: { position: [number, number, number]; target: [number, number, number]; fov?: number }, durationMs?: number) => void
  playMixamoAnimation: (fbxUrl: string, characterId?: string) => Promise<THREE.AnimationAction | null>
  stopMixamoAnimation: (characterId?: string) => void
  clearScene?: () => void
  resetScene?: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

interface VRMViewportProps {
  vrm: any | null
  avatarState: VRMAvatarState
  editorMode?: 'character' | 'scene' | 'animation'
  sceneMode?: boolean
  sceneCharacters?: SceneCharacterInstance[]
  sceneProps?: SceneProp[]
  onClearScene?: () => void
  activeCharacterId?: string
  activeCharacterName?: string
  isCharacterViewportHidden?: boolean
  onToggleActiveCharacterViewport?: () => void
  selectedEntity?: SceneEntitySelection
  selectedPropId?: string | null
  gizmoMode?: GizmoMode
  gizmoSpace?: GizmoSpace
  onGizmoModeChange?: (mode: GizmoMode) => void
  onGizmoSpaceChange?: (space: GizmoSpace) => void
  onSelectEntity?: (selection: SceneEntitySelection) => void
  onSelectProp?: (id: string | null) => void
  onUpdatePropTransform?: (id: string, updates: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number] }) => void
  onUpdateCharacterTransform?: (id: string, updates: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number] }) => void
  onAvatarStateChange?: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
  onUploadClick?: () => void
  isLoadingVRM?: boolean
  loadingProgress?: number
  cameraShots?: SceneCameraShot[]
  activeCameraShotId?: string | null
  isSceneTreeOpen?: boolean
  onToggleSceneTree?: () => void
  onApplyCameraShot?: (shot: SceneCameraShot) => void
  onSaveCurrentCameraView?: (name?: string) => void
  onDeleteCameraShot?: (shotId: string) => void
  onOverwriteCameraShot?: (shotId: string) => void
  onRenameCameraShot?: (shotId: string, newName: string) => void
  onResetToDefaultCameraView?: () => void
  onUpdateCameraPosition?: (shotId: string, newPosition: [number, number, number]) => void
  onUpdateCameraShot?: (shotId: string, updates: Partial<SceneCameraShot>) => void
  onDropAsset?: (type: string, payload: any, worldPos: [number, number, number]) => void
  hideInternalGizmoDock?: boolean
  hideOverlays?: boolean
  onZoomChange?: (zoomPercent: number) => void
  spawnPlacementPoint?: [number, number, number] | null
  onSetSpawnPlacementPoint?: (point: [number, number, number] | null) => void
}

function createSpawnTargetMarker(): THREE.Group {
  const markerGroup = new THREE.Group()
  markerGroup.name = 'spawn_target_marker'
  markerGroup.visible = false

  // 1. Outer animated targeting ring (bright cyan)
  const outerRingGeo = new THREE.RingGeometry(0.55, 0.62, 48)
  outerRingGeo.rotateX(-Math.PI / 2)
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0x00E5FF,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  })
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat)
  outerRing.name = 'marker_outer_ring'
  markerGroup.add(outerRing)

  // 2. 4 Crosshair ticks on outer ring
  const tickGeo = new THREE.BoxGeometry(0.14, 0.005, 0.025)
  const tickMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, depthWrite: false })
  for (let i = 0; i < 4; i++) {
    const tick = new THREE.Mesh(tickGeo, tickMat)
    const angle = (i * Math.PI) / 2
    tick.position.set(Math.cos(angle) * 0.58, 0.003, Math.sin(angle) * 0.58)
    tick.rotation.y = -angle
    markerGroup.add(tick)
  }

  // 3. Inner glowing semi-transparent disc
  const innerDiscGeo = new THREE.CircleGeometry(0.35, 32)
  innerDiscGeo.rotateX(-Math.PI / 2)
  const innerDiscMat = new THREE.MeshBasicMaterial({
    color: 0x00E5FF,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  })
  const innerDisc = new THREE.Mesh(innerDiscGeo, innerDiscMat)
  innerDisc.name = 'marker_inner_disc'
  innerDisc.position.y = 0.001
  markerGroup.add(innerDisc)

  // 4. Center bullseye dot (solid bright white)
  const centerDotGeo = new THREE.CircleGeometry(0.08, 24)
  centerDotGeo.rotateX(-Math.PI / 2)
  const centerDotMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  })
  const centerDot = new THREE.Mesh(centerDotGeo, centerDotMat)
  centerDot.position.y = 0.004
  markerGroup.add(centerDot)

  // 5. Vertical holographic light beacon pillar
  const pillarGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.0, 12)
  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0x00E5FF,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  })
  const pillar = new THREE.Mesh(pillarGeo, pillarMat)
  pillar.name = 'marker_pillar'
  pillar.position.y = 0.5
  markerGroup.add(pillar)

  // 6. Inverted diamond / cone pin at the top of the beacon
  const pinGeo = new THREE.ConeGeometry(0.12, 0.22, 4)
  pinGeo.rotateX(Math.PI) // point downwards
  const pinMat = new THREE.MeshBasicMaterial({
    color: 0x00FFFF,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  })
  const pin = new THREE.Mesh(pinGeo, pinMat)
  pin.name = 'marker_pin'
  pin.position.y = 1.05
  markerGroup.add(pin)

  return markerGroup
}

function disposeThreeHierarchy(obj: THREE.Object3D) {
  obj.traverse((child: any) => {
    if (child.geometry) {
      try {
        child.geometry.dispose()
      } catch (e) {
        // ignore
      }
    }
    if (child.material) {
      try {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => {
            if (mat.map) mat.map.dispose()
            if (mat.normalMap) mat.normalMap.dispose()
            if (mat.roughnessMap) mat.roughnessMap.dispose()
            if (mat.metalnessMap) mat.metalnessMap.dispose()
            mat.dispose()
          })
        } else {
          if (child.material.map) child.material.map.dispose()
          if (child.material.normalMap) child.material.normalMap.dispose()
          if (child.material.roughnessMap) child.material.roughnessMap.dispose()
          if (child.material.metalnessMap) child.material.metalnessMap.dispose()
          child.material.dispose()
        }
      } catch (e) {
        // ignore
      }
    }
  })
}

function disposeVRMInstance(vrmInstance: any) {
  if (!vrmInstance) return
  try {
    if (vrmInstance.userData?.isPlayingMixamo) {
      stopMixamoAnimation(vrmInstance)
    }
    const mixer = vrmInstance.mixer || vrmInstance.userData?.currentMixer
    if (mixer) {
      mixer.stopAllAction()
      if (vrmInstance.scene) {
        mixer.uncacheRoot(vrmInstance.scene)
      }
    }
    if (typeof vrmInstance.dispose === 'function') {
      vrmInstance.dispose()
    }
  } catch (e) {
    console.warn('Error disposing vrmInstance:', e)
  }
}

export const VRMViewport3D = forwardRef<VRMViewportHandle, VRMViewportProps>(({
  vrm,
  avatarState,
  editorMode = 'character',
  sceneMode = false,
  sceneCharacters = [],
  sceneProps = [],
  activeCharacterId = '',
  activeCharacterName = '',
  isCharacterViewportHidden = false,
  onToggleActiveCharacterViewport,
  selectedEntity = null,
  selectedPropId = null,
  gizmoMode = 'translate',
  gizmoSpace = 'world',
  hideInternalGizmoDock = false,
  hideOverlays = false,
  cameraShots = [],
  activeCameraShotId = null,
  isSceneTreeOpen = false,
  onToggleSceneTree,
  onApplyCameraShot,
  onSaveCurrentCameraView,
  onDeleteCameraShot,
  onOverwriteCameraShot,
  onRenameCameraShot,
  onResetToDefaultCameraView,
  onUpdateCameraPosition,
  onUpdateCameraShot,
  onDropAsset,
  onGizmoModeChange,
  onGizmoSpaceChange,
  onSelectEntity,
  onSelectProp,
  onUpdatePropTransform,
  onUpdateCharacterTransform,
  onAvatarStateChange,
  onUploadClick,
  onClearScene,
  isLoadingVRM = false,
  loadingProgress = 0,
  onZoomChange,
  spawnPlacementPoint = null,
  onSetSpawnPlacementPoint
}, ref) => {
  const spawnMarkerGroupRef = useRef<THREE.Group | null>(null)
  const spawnPlacementPointRef = useRef(spawnPlacementPoint)
  spawnPlacementPointRef.current = spawnPlacementPoint
  const onSetSpawnPlacementPointRef = useRef(onSetSpawnPlacementPoint)
  onSetSpawnPlacementPointRef.current = onSetSpawnPlacementPoint

  // Sync 3D Spawn Marker position and visibility with current spawnPlacementPoint state
  useEffect(() => {
    if (spawnMarkerGroupRef.current) {
      if (spawnPlacementPoint && Array.isArray(spawnPlacementPoint)) {
        spawnMarkerGroupRef.current.position.set(
          spawnPlacementPoint[0],
          Math.max(0, spawnPlacementPoint[1] || 0) + 0.015,
          spawnPlacementPoint[2]
        )
        spawnMarkerGroupRef.current.visible = true
      } else {
        spawnMarkerGroupRef.current.visible = false
      }
    }
  }, [spawnPlacementPoint])
  const effectiveAvatarState = useMemo(() => {
    if (!avatarState || typeof avatarState !== 'object') return DEFAULT_AVATAR_STATE
    return {
      ...DEFAULT_AVATAR_STATE,
      ...avatarState,
      lighting: {
        ...DEFAULT_AVATAR_STATE.lighting,
        ...(avatarState.lighting || {})
      },
      studio: {
        ...DEFAULT_AVATAR_STATE.studio,
        ...((avatarState as any)?.studio || {})
      }
    }
  }, [avatarState])
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onZoomChangeRef = useRef(onZoomChange)
  onZoomChangeRef.current = onZoomChange
  const referenceDistanceRef = useRef<number>(2.5)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const transformControlsRef = useRef<TransformControls | null>(null)
  const timerRef = useRef<THREE.Timer | null>(null)
  if (!timerRef.current) {
    timerRef.current = new THREE.Timer()
  }

  // Dedicated Scene Groups
  const charactersGroupRef = useRef<THREE.Group | null>(null)
  if (!charactersGroupRef.current) {
    charactersGroupRef.current = new THREE.Group()
  }
  const propsGroupRef = useRef<THREE.Group | null>(null)
  if (!propsGroupRef.current) {
    propsGroupRef.current = new THREE.Group()
  }
  const camerasGroupRef = useRef<THREE.Group | null>(null)
  if (!camerasGroupRef.current) {
    camerasGroupRef.current = new THREE.Group()
  }
  
  // Cache maps for meshes & VRM instances
  const loadedPropsMeshMap = useRef<Map<string, THREE.Group>>(new Map())
  const loadedCharactersMap = useRef<Map<string, { group: THREE.Group; vrmInstance?: any; state: VRMAvatarState }>>(new Map())
  const loadedCamerasMeshMap = useRef<Map<string, THREE.Group>>(new Map())
  const selectionBoxHelperRef = useRef<THREE.BoxHelper | null>(null)
  const loadingCharacterIdsRef = useRef<Set<string>>(new Set())
  const loadingPropIdsRef = useRef<Set<string>>(new Set())
  const sceneCharactersRef = useRef(sceneCharacters)
  sceneCharactersRef.current = sceneCharacters

  // Raycaster & pointer interaction
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const pointerDownPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDraggingGizmoRef = useRef(false)

  // Lighting refs
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null)
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null)
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null)
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null)
  const gridHelperRef = useRef<THREE.Object3D | null>(null)
  const shadowGroundRef = useRef<THREE.Mesh | null>(null)

  // Camera orientation subscribers & stability tracking
  const cameraListenersRef = useRef<Set<(quaternion: THREE.Quaternion) => void>>(new Set())
  const isUserInteractingRef = useRef<boolean>(false)
  const lostSceneTimerRef = useRef<number>(0)
  const frustumRef = useRef<THREE.Frustum>(new THREE.Frustum())
  const frustumMatrixRef = useRef<THREE.Matrix4>(new THREE.Matrix4())

  // Cursor tracking target
  const mouseTargetRef = useRef<THREE.Object3D>(new THREE.Object3D())
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const [showRuleOfThirds, setShowRuleOfThirds] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [activeShot, setActiveShot] = useState<string>('front')
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [showAngleDropdown, setShowAngleDropdown] = useState(false)
  const [isShotsPopoverOpen, setIsShotsPopoverOpen] = useState(false)
  const [editingShotId, setEditingShotId] = useState<string | null>(null)
  const [editingShotName, setEditingShotName] = useState('')
  const [newShotInput, setNewShotInput] = useState('')
  const [showNewShotField, setShowNewShotField] = useState(false)
  const [isPipOpen, setIsPipOpen] = useState(true)
  const [pipWidth, setPipWidth] = useState(260)
  const [isPipMinimized, setIsPipMinimized] = useState(false)
  const [isPipMaximized, setIsPipMaximized] = useState(false)
  const pipPreMaximizedWidthRef = useRef(260)

  // Secondary perspective camera for PiP rendering
  const pipCameraRef = useRef<THREE.PerspectiveCamera>(new THREE.PerspectiveCamera(34, 16 / 9, 0.05, 100))
  const pipActiveShotRef = useRef<SceneCameraShot | null>(null)
  const pipDimensionsRef = useRef({ width: 260, height: 146 })
  const pipPreviewRef = useRef<HTMLDivElement | null>(null)
  const isPipOpenRef = useRef(true)
  const isPipMinimizedRef = useRef(false)
  const cameraShotsRef = useRef<SceneCameraShot[]>(cameraShots)

  useEffect(() => {
    cameraShotsRef.current = cameraShots
  }, [cameraShots])

  useEffect(() => {
    isPipOpenRef.current = isPipOpen
  }, [isPipOpen])

  useEffect(() => {
    isPipMinimizedRef.current = isPipMinimized
  }, [isPipMinimized])

  useEffect(() => {
    pipDimensionsRef.current = {
      width: pipWidth,
      height: Math.round((pipWidth * 9) / 16)
    }
  }, [pipWidth])

  // Automatically show & expand live camera preview whenever a camera is selected or added
  useEffect(() => {
    if (selectedEntity?.type === 'camera') {
      setIsPipOpen(true)
      setIsPipMinimized(false)
    }
  }, [selectedEntity?.id, selectedEntity?.type])

  // Drag-to-resize handle for PiP window (anchored to bottom-right of viewport)
  const handlePipResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = pipWidth

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Anchored at bottom-right, dragging left increases width
      const deltaX = startX - moveEvent.clientX
      const newWidth = Math.max(180, Math.min(680, Math.round(startWidth + deltaX)))
      setPipWidth(newWidth)
      setIsPipMaximized(false)
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Camera transition animation state
  const cameraTransitionRef = useRef<{
    startPos: THREE.Vector3
    targetPos: THREE.Vector3
    startLookAt: THREE.Vector3
    targetLookAt: THREE.Vector3
    startFov: number
    targetFov: number
    startTime: number
    duration: number
    active: boolean
  }>({
    startPos: new THREE.Vector3(),
    targetPos: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
    startFov: 32,
    targetFov: 32,
    startTime: 0,
    duration: 800,
    active: false
  })

  // Keep latest callback references so event listeners attached on mount never use stale closures
  const onUpdatePropTransformRef = useRef(onUpdatePropTransform)
  onUpdatePropTransformRef.current = onUpdatePropTransform

  const onUpdateCharacterTransformRef = useRef(onUpdateCharacterTransform)
  onUpdateCharacterTransformRef.current = onUpdateCharacterTransform

  const onSelectEntityRef = useRef(onSelectEntity)
  onSelectEntityRef.current = onSelectEntity

  const onSelectPropRef = useRef(onSelectProp)
  onSelectPropRef.current = onSelectProp

  const selectedPropIdRef = useRef(selectedPropId)
  selectedPropIdRef.current = selectedPropId

  const selectedEntityRef = useRef(selectedEntity)
  selectedEntityRef.current = selectedEntity

  const framedPropsSetRef = useRef<Set<string>>(new Set())

  const onGizmoModeChangeRef = useRef(onGizmoModeChange)
  onGizmoModeChangeRef.current = onGizmoModeChange

  const onGizmoSpaceChangeRef = useRef(onGizmoSpaceChange)
  onGizmoSpaceChangeRef.current = onGizmoSpaceChange

  const onUpdateCameraPositionRef = useRef(onUpdateCameraPosition)
  onUpdateCameraPositionRef.current = onUpdateCameraPosition

  const onUpdateCameraShotRef = useRef(onUpdateCameraShot)
  onUpdateCameraShotRef.current = onUpdateCameraShot

  // Track if a view preset is currently active (Front, Face Close-up, Bust Portrait, Isometric, Side Left, Side Right, Back View)
  const isViewPresetActiveRef = useRef(true)
  const prevSelectedCharIdRef = useRef<string | null>(null)
  const isShiftOrCtrlPressedRef = useRef(false)

  // Calculate full scene bounding box combining all visible characters and props
  const getSceneBoundingBox = useCallback((): THREE.Box3 => {
    const combinedBox = new THREE.Box3()

    // 1. Include all visible characters in scene
    if (charactersGroupRef.current) {
      charactersGroupRef.current.updateMatrixWorld(true)
      charactersGroupRef.current.children.forEach(child => {
        if (child.visible) {
          const childBox = new THREE.Box3().setFromObject(child)
          if (!childBox.isEmpty() && Number.isFinite(childBox.min.x)) {
            combinedBox.union(childBox)
          }
        }
      })
    }

    // 2. Include all visible props in scene
    if (propsGroupRef.current) {
      propsGroupRef.current.updateMatrixWorld(true)
      propsGroupRef.current.children.forEach(child => {
        if (child.visible) {
          const propBox = new THREE.Box3().setFromObject(child)
          if (!propBox.isEmpty() && Number.isFinite(propBox.min.x)) {
            combinedBox.union(propBox)
          }
        }
      })
    }

    // 3. Fallback if scene is completely empty
    if (combinedBox.isEmpty() || !Number.isFinite(combinedBox.min.x)) {
      combinedBox.set(
        new THREE.Vector3(-1.0, 0, -1.0),
        new THREE.Vector3(1.0, 1.8, 1.0)
      )
    }

    return combinedBox
  }, [])

  // Calculate camera position and target dynamically from selected prop, character, or scene bounding box
  const getCameraShotFraming = useCallback((
    shot: 'front' | 'face' | 'bust' | 'sideLeft' | 'sideRight' | 'back' | 'top' | 'iso' | 'side' | 'isometric',
    targetCharId?: string
  ): { position: THREE.Vector3; target: THREE.Vector3; maxDim: number } => {
    // Normalize aliases
    const shotKey = (shot === 'side' ? 'sideRight' : shot === 'isometric' ? 'iso' : shot)

    let targetBox = new THREE.Box3()
    let isCharacter = false
    let charYaw = 0

    // 1. If a prop is selected, frame directly on the prop
    if (selectedEntity?.type === 'prop' && selectedEntity.id) {
      const propMesh = loadedPropsMeshMap.current.get(selectedEntity.id)
      if (propMesh) {
        propMesh.updateMatrixWorld(true)
        const b = new THREE.Box3().setFromObject(propMesh)
        if (!b.isEmpty() && Number.isFinite(b.min.x)) {
          targetBox.copy(b)
        }
      }
    }

    // 2. If a character is selected or targeted
    if (targetBox.isEmpty()) {
      const chars = sceneCharactersRef.current || sceneCharacters
      let targetChar: SceneCharacterInstance | undefined

      if (targetCharId) {
        targetChar = chars.find(c => c.id === targetCharId || c.characterId === targetCharId)
      } else if (selectedEntity?.type === 'character' && selectedEntity.id) {
        targetChar = chars.find(c => c.id === selectedEntity.id || c.characterId === selectedEntity.id)
      } else if (activeCharacterId) {
        targetChar = chars.find(c => c.id === activeCharacterId || c.characterId === activeCharacterId)
      }

      if (targetChar) {
        const charEntry = loadedCharactersMap.current.get(targetChar.id)
        if (charEntry?.group) {
          charEntry.group.updateMatrixWorld(true)
          const b = new THREE.Box3().setFromObject(charEntry.group)
          if (!b.isEmpty() && Number.isFinite(b.min.x)) {
            targetBox.copy(b)
            charYaw = charEntry.group.rotation.y || 0
            isCharacter = true
          }
        }
      }
    }

    // 3. If still empty, frame the full scene bounding box
    if (targetBox.isEmpty() || !Number.isFinite(targetBox.min.x)) {
      targetBox = getSceneBoundingBox()
    }

    // 4. Ultimate fallback if scene is completely empty
    if (targetBox.isEmpty() || !Number.isFinite(targetBox.min.x)) {
      targetBox.set(
        new THREE.Vector3(-1.0, 0, -1.0),
        new THREE.Vector3(1.0, 1.8, 1.0)
      )
    }

    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    targetBox.getCenter(center)
    targetBox.getSize(size)

    const maxDim = Math.max(size.x, size.y, size.z, 0.5)
    const height = Math.max(size.y, 0.5)

    const container = containerRef.current
    const camera = cameraRef.current
    const fov = camera?.fov || 32
    const fovRad = (fov * Math.PI) / 360
    const aspect = Math.max(
      0.2,
      container?.clientWidth && container?.clientHeight
        ? container.clientWidth / container.clientHeight
        : 1.6
    )

    const distY = (size.y * 0.5) / Math.tan(fovRad)
    const distX = (size.x * 0.5) / (Math.tan(fovRad) * aspect)
    const distZ = size.z * 0.5
    // Generous fitting distance: no arbitrary 4.8m clamp!
    const baseFitDist = Math.max(0.8, Math.max(distY, distX) * 1.35 + distZ)

    const target = center.clone()
    const offset = new THREE.Vector3()

    if (isCharacter) {
      // Character-tuned framing
      const baseY = targetBox.min.y
      const torsoY = baseY + height * 0.55
      const bustY = baseY + height * 0.78
      const faceY = baseY + height * 0.90

      switch (shotKey) {
        case 'front':
          target.set(center.x, torsoY, center.z)
          offset.set(0, 0.2, baseFitDist)
          break
        case 'face':
          target.set(center.x, faceY, center.z)
          offset.set(0, 0.05, Math.max(0.65, height * 0.45))
          break
        case 'bust':
          target.set(center.x, bustY, center.z)
          offset.set(0, 0.1, Math.max(1.0, height * 0.85))
          break
        case 'sideLeft':
          target.set(center.x, torsoY, center.z)
          offset.set(-baseFitDist, 0.2, 0)
          break
        case 'sideRight':
          target.set(center.x, torsoY, center.z)
          offset.set(baseFitDist, 0.2, 0)
          break
        case 'back':
          target.set(center.x, torsoY, center.z)
          offset.set(0, 0.2, -baseFitDist)
          break
        case 'top':
          target.set(center.x, torsoY, center.z)
          offset.set(0, baseFitDist * 1.15, baseFitDist * 0.001)
          break
        case 'iso':
          target.set(center.x, torsoY, center.z)
          offset.set(baseFitDist * 0.7, baseFitDist * 0.55, baseFitDist * 0.7)
          break
      }
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), charYaw)
    } else {
      // Prop / Environment / Scene dynamic framing
      switch (shotKey) {
        case 'front':
          offset.set(0, baseFitDist * 0.15, baseFitDist)
          break
        case 'back':
          offset.set(0, baseFitDist * 0.15, -baseFitDist)
          break
        case 'sideLeft':
          offset.set(-baseFitDist, baseFitDist * 0.15, 0)
          break
        case 'sideRight':
          offset.set(baseFitDist, baseFitDist * 0.15, 0)
          break
        case 'top':
          offset.set(0, baseFitDist * 1.25, baseFitDist * 0.001)
          break
        case 'iso':
          offset.set(baseFitDist * 0.75, baseFitDist * 0.6, baseFitDist * 0.75)
          break
        case 'face':
          // Close-up detail inspection
          target.set(center.x, center.y + size.y * 0.2, center.z)
          offset.set(0, baseFitDist * 0.08, Math.max(0.6, baseFitDist * 0.4))
          break
        case 'bust':
          // Medium-range inspection
          offset.set(0, baseFitDist * 0.1, Math.max(1.0, baseFitDist * 0.7))
          break
      }
    }

    const position = target.clone().add(offset)
    return { position, target, maxDim }
  }, [selectedEntity, activeCharacterId, getSceneBoundingBox])

  const setCameraShot = useCallback((
    shot: 'front' | 'face' | 'bust' | 'sideLeft' | 'sideRight' | 'back' | 'top' | 'iso' | 'side' | 'isometric',
    targetCharId?: string,
    smooth: boolean = true
  ) => {
    setActiveShot(shot as any)
    isViewPresetActiveRef.current = true
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    const framing = getCameraShotFraming(shot, targetCharId)
    const presetDist = framing.position.distanceTo(framing.target)
    referenceDistanceRef.current = Math.max(0.5, presetDist)
    setZoomLevel(100)
    onZoomChangeRef.current?.(100)

    // Dynamically adjust camera clipping and OrbitControls range
    camera.near = Math.min(0.01, framing.maxDim * 0.001)
    camera.far = Math.max(15000.0, framing.maxDim * 20.0)
    camera.updateProjectionMatrix()

    controls.minDistance = Math.max(0.05, framing.maxDim * 0.01)
    controls.maxDistance = Math.max(500.0, framing.maxDim * 10.0)

    if (smooth) {
      const startPos = new THREE.Vector3(
        Number.isFinite(camera.position.x) ? camera.position.x : 0,
        Number.isFinite(camera.position.y) ? camera.position.y : 1.1,
        Number.isFinite(camera.position.z) ? camera.position.z : 2.5
      )
      const startLookAt = new THREE.Vector3(
        Number.isFinite(controls.target.x) ? controls.target.x : 0,
        Number.isFinite(controls.target.y) ? controls.target.y : 0.9,
        Number.isFinite(controls.target.z) ? controls.target.z : 0
      )
      cameraTransitionRef.current = {
        startPos,
        targetPos: framing.position,
        startLookAt,
        targetLookAt: framing.target,
        startFov: camera.fov,
        targetFov: camera.fov,
        startTime: performance.now(),
        duration: 450,
        active: true
      }
    } else {
      camera.position.copy(framing.position)
      controls.target.copy(framing.target)
      controls.update()
    }
  }, [getCameraShotFraming])

  // Automatically re-frame if user selects a different character while a view preset is active
  useEffect(() => {
    if (editorMode !== 'scene') return
    if (selectedEntity?.type === 'character' && selectedEntity.id) {
      const isDifferentChar = prevSelectedCharIdRef.current !== selectedEntity.id
      prevSelectedCharIdRef.current = selectedEntity.id
      if (isDifferentChar && isViewPresetActiveRef.current && activeShot && activeShot !== 'custom') {
        setCameraShot(activeShot as any, selectedEntity.id, true)
      }
    } else if (!selectedEntity) {
      prevSelectedCharIdRef.current = null
    }
  }, [selectedEntity, activeShot, editorMode, setCameraShot])

  // Mathematically precise bounding box auto-framing (fits single objects or entire combined scenes cleanly in viewport)
  const frameBoundingBox = useCallback((box: THREE.Box3, animate = true) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    const container = containerRef.current
    if (!camera || !controls || !container) return

    if (box.isEmpty() || !Number.isFinite(box.min.x) || !Number.isFinite(box.max.x)) {
      return
    }

    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)

    if (size.x === 0 && size.y === 0 && size.z === 0) {
      return
    }

    const maxDim = Math.max(size.x, size.y, size.z, 0.5)

    // Camera vertical field of view half-angle in radians
    const fovRad = (camera.fov * Math.PI) / 360
    const aspect = Math.max(
      0.2,
      container.clientWidth && container.clientHeight
        ? container.clientWidth / container.clientHeight
        : (camera.aspect || 1.6)
    )

    // Fit distance calculation:
    // Required distance to fit object/scene height vertically:
    const distY = (size.y * 0.5) / Math.tan(fovRad)
    // Required distance to fit object/scene width horizontally:
    const distX = (size.x * 0.5) / (Math.tan(fovRad) * aspect)
    // Depth dimension buffer when viewed from an angle:
    const distZ = size.z * 0.5

    // Add a comfortable 35% margin (1.35) plus depth offset
    const requiredDistance = Math.max(distY, distX) * 1.35 + distZ
    // Dynamic distance with comfortable lower bound and NO upper clamp
    const finalDistance = Math.max(0.8, requiredDistance)

    // Dynamic clip & zoom bounds: dynamically scaled to actual object dimensions
    camera.near = Math.min(0.01, maxDim * 0.001)
    camera.far = Math.max(15000.0, maxDim * 20.0)
    camera.updateProjectionMatrix()

    // Safe dynamic zoom bounds for OrbitControls
    controls.minDistance = Math.max(0.05, maxDim * 0.01)
    controls.maxDistance = Math.max(500.0, maxDim * 10.0)

    // Determine camera direction relative to target:
    const currentDir = new THREE.Vector3().subVectors(camera.position, controls.target)
    let dir = new THREE.Vector3()
    if (currentDir.lengthSq() < 0.001) {
      dir.set(0, 0.32, 0.95).normalize()
    } else {
      dir.copy(currentDir).normalize()
      // Ensure camera is positioned at an elevated angle above ground
      if (dir.y < 0.18) {
        dir.y = 0.28
        dir.normalize()
      }
    }

    const newTarget = new THREE.Vector3(center.x, size.y > 1.3 ? center.y * 0.92 : center.y, center.z)
    const newPos = newTarget.clone().addScaledVector(dir, finalDistance)

    if (animate) {
      const startPos = new THREE.Vector3(
        Number.isFinite(camera.position.x) ? camera.position.x : 0,
        Number.isFinite(camera.position.y) ? camera.position.y : 1.1,
        Number.isFinite(camera.position.z) ? camera.position.z : 2.5
      )
      cameraTransitionRef.current = {
        startPos,
        targetPos: newPos,
        startLookAt: controls.target.clone(),
        targetLookAt: newTarget,
        startFov: camera.fov,
        targetFov: camera.fov,
        startTime: performance.now(),
        duration: 500,
        active: true
      }
    } else {
      camera.position.copy(newPos)
      controls.target.copy(newTarget)
      controls.update()
    }
    referenceDistanceRef.current = finalDistance
    setZoomLevel(100)
    onZoomChangeRef.current?.(100)
  }, [])

  // Dynamically update camera near/far and controls min/max zoom distance from scene bounding box
  const updateDynamicCameraLimits = useCallback(() => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    const box = getSceneBoundingBox()
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 2.0)

    controls.minDistance = Math.max(0.05, maxDim * 0.01)
    controls.maxDistance = Math.max(500.0, maxDim * 10.0)

    camera.near = Math.min(0.01, maxDim * 0.001)
    camera.far = Math.max(15000.0, maxDim * 20.0)
    camera.updateProjectionMatrix()
  }, [getSceneBoundingBox])

  // 100% Guaranteed Safe Reset View: returns to default clean 3D perspective framing of scene/character
  const resetView = useCallback((animate = true) => {
    cameraTransitionRef.current.active = false
    lostSceneTimerRef.current = 0

    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    // 1. Clear any NaN or Infinity values in camera or controls
    if (!Number.isFinite(camera.position.x) || !Number.isFinite(camera.position.y) || !Number.isFinite(camera.position.z)) {
      camera.position.set(0, 1.1, 2.5)
    }
    if (!Number.isFinite(controls.target.x) || !Number.isFinite(controls.target.y) || !Number.isFinite(controls.target.z)) {
      controls.target.set(0, 0.9, 0)
    }

    // 2. Restore camera projection and orientation
    camera.up.set(0, 1, 0)
    camera.fov = 32

    // 3. Frame full scene bounding box
    const box = getSceneBoundingBox()
    frameBoundingBox(box, animate)
  }, [getSceneBoundingBox, frameBoundingBox])

  // Snap 3D camera to cardinal and orthographic axes (Blender-style)
  const snapCameraToDirection = useCallback((dir: AxisDirection) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    const target = new THREE.Vector3(
      Number.isFinite(controls.target.x) ? controls.target.x : 0,
      Number.isFinite(controls.target.y) ? controls.target.y : 0.9,
      Number.isFinite(controls.target.z) ? controls.target.z : 0
    )

    const currentDist = Math.max(1.5, Math.min(30.0, camera.position.distanceTo(target) || 2.5))
    const offset = new THREE.Vector3()

    switch (dir) {
      case 'pz': // Front View (+Z)
        offset.set(0, 0, currentDist)
        break
      case 'nz': // Back View (-Z)
        offset.set(0, 0, -currentDist)
        break
      case 'px': // Right View (+X)
        offset.set(currentDist, 0, 0)
        break
      case 'nx': // Left View (-X)
        offset.set(-currentDist, 0, 0)
        break
      case 'py': // Top View (+Y) - slight Z offset prevents gimbal lock
        offset.set(0, currentDist, 0.001 * currentDist)
        break
      case 'ny': // Bottom View (-Y) - slight Z offset prevents gimbal lock
        offset.set(0, -currentDist, 0.001 * currentDist)
        break
    }

    const newPos = target.clone().add(offset)
    const startPos = new THREE.Vector3(
      Number.isFinite(camera.position.x) ? camera.position.x : 0,
      Number.isFinite(camera.position.y) ? camera.position.y : 1.1,
      Number.isFinite(camera.position.z) ? camera.position.z : 2.5
    )

    cameraTransitionRef.current = {
      startPos,
      targetPos: newPos,
      startLookAt: target.clone(),
      targetLookAt: target.clone(),
      startFov: camera.fov,
      targetFov: camera.fov,
      startTime: performance.now(),
      duration: 350,
      active: true
    }
  }, [])

  // Interactive Drag-to-Orbit support for orientation gizmo
  const orbitByDelta = useCallback((deltaX: number, deltaY: number) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    const target = controls.target
    const offset = new THREE.Vector3().subVectors(camera.position, target)
    const spherical = new THREE.Spherical().setFromVector3(offset)

    spherical.theta -= (deltaX / 100) * 1.5
    spherical.phi -= (deltaY / 100) * 1.5
    spherical.phi = Math.max(0.04, Math.min(Math.PI - 0.04, spherical.phi))
    spherical.makeSafe()

    offset.setFromSpherical(spherical)
    camera.position.copy(target).add(offset)
    camera.lookAt(target)
    controls.update()

    if (cameraListenersRef.current.size > 0) {
      cameraListenersRef.current.forEach(cb => cb(camera.quaternion))
    }
  }, [])

  useEffect(() => {
    if (editorMode === 'scene') {
      updateDynamicCameraLimits()
    }
  }, [sceneCharacters, sceneProps, editorMode, updateDynamicCameraLimits])

  const frameScene = useCallback((animate = true) => {
    const box = getSceneBoundingBox()
    frameBoundingBox(box, animate)
  }, [getSceneBoundingBox, frameBoundingBox])

  const frameObject = useCallback((targetObj: THREE.Object3D, animate = true) => {
    targetObj.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(targetObj)
    frameBoundingBox(box, animate)
  }, [frameBoundingBox])

  const focusObject = useCallback((targetObj: THREE.Object3D) => {
    frameObject(targetObj, true)
  }, [frameObject])

  const handleZoomIn = useCallback(() => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target)
    if (dir.length() > (controls.minDistance || 0.02) * 1.05) {
      camera.position.copy(controls.target).addScaledVector(dir, 0.85)
      controls.update()
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target)
    if (dir.length() < (controls.maxDistance || 15000.0) * 0.95) {
      camera.position.copy(controls.target).addScaledVector(dir, 1.18)
      controls.update()
    }
  }, [])

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    takeScreenshot: (resolution: '1080p' | '2k' | '4k' = '1080p', transparent: boolean = false) => {
      const renderer = rendererRef.current
      const scene = sceneRef.current
      const camera = cameraRef.current
      const transformControls = transformControlsRef.current
      if (!renderer || !scene || !camera) return ''

      // Temporarily hide helpers
      const gizmoHelper = (transformControls as any)?.getHelper?.() || transformControls
      const gizmoVisible = gizmoHelper ? gizmoHelper.visible : false
      if (gizmoHelper) gizmoHelper.visible = false
      if (selectionBoxHelperRef.current) selectionBoxHelperRef.current.visible = false

      const origClearAlpha = renderer.getClearAlpha()
      const origClearColor = new THREE.Color()
      renderer.getClearColor(origClearColor)

      let scale = 1
      if (resolution === '2k') scale = 1.5
      if (resolution === '4k') scale = 2.5

      const originalPixelRatio = renderer.getPixelRatio()
      renderer.setPixelRatio(window.devicePixelRatio * scale)

      const isTransparent = transparent || effectiveAvatarState.backdrop === 'transparent' || effectiveAvatarState.studio?.backdropPreset === 'transparent'
      if (isTransparent) {
        renderer.setClearAlpha(0)
      }

      renderer.render(scene, camera)
      const dataUrl = renderer.domElement.toDataURL('image/png')

      // Restore
      renderer.setPixelRatio(originalPixelRatio)
      if (isTransparent) {
        renderer.setClearAlpha(origClearAlpha)
        renderer.setClearColor(origClearColor)
      }
      if (gizmoHelper) gizmoHelper.visible = gizmoVisible
      if (selectionBoxHelperRef.current) selectionBoxHelperRef.current.visible = true
      renderer.render(scene, camera)

      return dataUrl
    },
    resetCamera: () => {
      resetView(true)
    },
    resetView: (animate = true) => {
      resetView(animate)
    },
    setCameraShot: (shot) => {
      setCameraShot(shot)
    },
    snapCameraToDirection: (dir: AxisDirection) => {
      snapCameraToDirection(dir)
    },
    orbitByDelta: (deltaX: number, deltaY: number) => {
      orbitByDelta(deltaX, deltaY)
    },
    subscribeCameraChange: (cb: (quaternion: THREE.Quaternion) => void) => {
      cameraListenersRef.current.add(cb)
      if (cameraRef.current) {
        cb(cameraRef.current.quaternion)
      }
      return () => {
        cameraListenersRef.current.delete(cb)
      }
    },
    getVRMScene: () => {
      return vrm ? vrm.scene : null
    },
    getPropAutoFitScale: (propId: string) => {
      const group = loadedPropsMeshMap.current.get(propId)
      if (!group) return 1.0
      return calculateAutoFitScale(group, 1.6)
    },
    focusSelected: () => {
      if (transformControlsRef.current?.object) {
        frameObject(transformControlsRef.current.object, true)
      } else if (selectedEntity?.type === 'prop' && (selectedEntity.id || selectedPropId)) {
        const propId = selectedEntity.id || selectedPropId
        const propMesh = loadedPropsMeshMap.current.get(propId!)
        if (propMesh) frameObject(propMesh, true)
      } else if (selectedEntity?.type === 'character' && selectedEntity.id) {
        const char = sceneCharacters.find(c => c.id === selectedEntity.id || c.characterId === selectedEntity.id)
        const targetId = char ? char.id : selectedEntity.id
        const entry = loadedCharactersMap.current.get(targetId)
        const charObj = entry?.group || entry?.vrmInstance?.scene || vrm?.scene
        if (charObj) {
          frameObject(charObj, true)
        }
      } else {
        frameScene(true)
      }
    },
    frameScene: (animate: boolean = true) => {
      frameScene(animate)
    },
    frameObject: (targetObj: THREE.Object3D, animate: boolean = true) => {
      frameObject(targetObj, animate)
    },
    frameProp: (propId: string, animate: boolean = true) => {
      const group = loadedPropsMeshMap.current.get(propId)
      if (group) {
        frameObject(group, animate)
      }
    },
    captureScreenshot: (resolution: '1080p' | '2k' | '4k' = '1080p', transparent: boolean = false) => {
      const renderer = rendererRef.current
      const scene = sceneRef.current
      const camera = cameraRef.current
      if (!renderer || !scene || !camera) return ''
      return renderer.domElement.toDataURL('image/png')
    },
    getCameraState: () => {
      const camera = cameraRef.current
      const controls = controlsRef.current
      if (!camera || !controls) return null
      return {
        position: [camera.position.x, camera.position.y, camera.position.z] as [number, number, number],
        target: [controls.target.x, controls.target.y, controls.target.z] as [number, number, number],
        fov: camera.fov
      }
    },
    applyCameraShot: (shot, durationMs = 800) => {
      const camera = cameraRef.current
      const controls = controlsRef.current
      if (!camera || !controls) return

      if (durationMs <= 0) {
        camera.position.set(shot.position[0], shot.position[1], shot.position[2])
        controls.target.set(shot.target[0], shot.target[1], shot.target[2])
        if (shot.fov) {
          camera.fov = shot.fov
          camera.updateProjectionMatrix()
        }
        controls.update()
        return
      }

      // Smooth Tween Transition
      cameraTransitionRef.current = {
        startPos: camera.position.clone(),
        targetPos: new THREE.Vector3(shot.position[0], shot.position[1], shot.position[2]),
        startLookAt: controls.target.clone(),
        targetLookAt: new THREE.Vector3(shot.target[0], shot.target[1], shot.target[2]),
        startFov: camera.fov,
        targetFov: shot.fov || camera.fov,
        startTime: performance.now(),
        duration: durationMs,
        active: true
      }
    },

    playMixamoAnimation: async (fbxUrl: string, characterId?: string) => {
      const targetId = characterId || activeCharacterId || 'default_char'
      const entry = loadedCharactersMap.current.get(targetId)
      const targetVrm = entry?.vrmInstance || vrm
      if (targetVrm) {
        return await loadAndPlayMixamoAnimation(fbxUrl, targetVrm)
      }
      return null
    },

    stopMixamoAnimation: (characterId?: string) => {
      const targetId = characterId || activeCharacterId || 'default_char'
      const entry = loadedCharactersMap.current.get(targetId)
      const targetVrm = entry?.vrmInstance || vrm
      if (targetVrm) {
        stopMixamoAnimation(targetVrm)
      }
    },

    clearScene: () => {
      const scene = sceneRef.current
      const propsGroup = propsGroupRef.current
      const charsGroup = charactersGroupRef.current
      const transformControls = transformControlsRef.current

      // 1. Detach gizmo and outline helper
      if (transformControls?.object) {
        transformControls.detach()
      }
      if (selectionBoxHelperRef.current) {
        if (scene) scene.remove(selectionBoxHelperRef.current)
        selectionBoxHelperRef.current.dispose?.()
        selectionBoxHelperRef.current = null
      }

      // 2. Forcefully sweep and dispose all children in propsGroup
      if (propsGroup) {
        loadedPropsMeshMap.current.forEach((mesh) => {
          disposeThreeHierarchy(mesh)
          if (mesh.parent) mesh.parent.remove(mesh)
        })
        loadedPropsMeshMap.current.clear()
        while (propsGroup.children.length > 0) {
          const child = propsGroup.children[0]
          propsGroup.remove(child)
          disposeThreeHierarchy(child)
        }
      }
      loadingPropIdsRef.current.clear()
      framedPropsSetRef.current.clear()

      // 3. Forcefully sweep and dispose all children in charactersGroup
      if (charsGroup) {
        loadedCharactersMap.current.forEach((item) => {
          disposeVRMInstance(item.vrmInstance)
          disposeThreeHierarchy(item.group)
          if (item.group.parent) item.group.parent.remove(item.group)
        })
        loadedCharactersMap.current.clear()
        while (charsGroup.children.length > 0) {
          const child = charsGroup.children[0]
          charsGroup.remove(child)
          disposeThreeHierarchy(child)
        }
      }
      loadingCharacterIdsRef.current.clear()

      // 4. Reset camera target if needed
      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.target.set(0, 0.9, 0)
        cameraRef.current.position.set(0, 1.1, 2.5)
        cameraRef.current.near = 0.02
        cameraRef.current.far = 25000.0
        cameraRef.current.updateProjectionMatrix()
        controlsRef.current.update()
      }
    },

    resetScene: () => {
      // Alias to clearScene
      const api = ref && typeof ref === 'object' && 'current' in ref ? (ref as any).current : null
      api?.clearScene?.()
    },

    zoomIn: () => {
      handleZoomIn()
    },
    zoomOut: () => {
      handleZoomOut()
    },
    resetZoom: () => {
      const camera = cameraRef.current
      const controls = controlsRef.current
      if (!camera || !controls) return
      const refDist = referenceDistanceRef.current || 2.5
      const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize()
      if (dir.lengthSq() < 0.001) dir.set(0, 0.32, 0.95).normalize()
      camera.position.copy(controls.target).addScaledVector(dir, refDist)
      controls.update()
      setZoomLevel(100)
      onZoomChangeRef.current?.(100)
    }
  }))

  // Initialize Three.js Scene, Camera, Controls, Lights, TransformControls
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Mount Scene Groups
    scene.add(charactersGroupRef.current)
    scene.add(propsGroupRef.current)
    scene.add(camerasGroupRef.current)

    // Camera setup
    const initialFov = effectiveAvatarState.studio?.fov || 32
    const camera = new THREE.PerspectiveCamera(
      initialFov,
      container.clientWidth / container.clientHeight,
      0.05,
      3000.0
    )
    camera.position.set(0, 1.1, 2.5)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = effectiveAvatarState.studio?.exposure || 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // OrbitControls - Free 3D Camera Navigation (Orbit, Pan, Dolly / Zoom)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.screenSpacePanning = true // Standard 3D software screen-space panning
    controls.minDistance = 0.25 // Bounded to prevent zero distance inversion or clipping inside geometry
    controls.maxDistance = 85.0 // Bounded max distance so scene is never lost in outer space
    controls.zoomSpeed = 0.75 // Smooth, controlled scroll steps without jumpiness
    // In Scene mode, permit full spherical cinematography angles
    controls.maxPolarAngle = sceneMode ? Math.PI - 0.04 : Math.PI / 2 + 0.05
    controls.minPolarAngle = 0.03
    controls.target.set(0, 0.9, 0)
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    }
    controls.addEventListener('start', () => {
      isUserInteractingRef.current = true
      isViewPresetActiveRef.current = false
      lostSceneTimerRef.current = 0
    })
    controls.addEventListener('end', () => {
      isUserInteractingRef.current = false
      lostSceneTimerRef.current = 0
    })
    controls.addEventListener('change', () => {
      const cam = cameraRef.current
      const ctrl = controlsRef.current
      if (cam && ctrl) {
        // Enforce pan boundaries so target cannot be lost in outer space
        const sceneBox = getSceneBoundingBox()
        const sceneCenter = sceneBox.getCenter(new THREE.Vector3())
        const sceneSize = sceneBox.getSize(new THREE.Vector3())
        const maxDim = Math.max(sceneSize.x, sceneSize.y, sceneSize.z, 2.5)
        const maxPanDist = Math.max(22.0, maxDim * 2.5)

        const distFromCenter = ctrl.target.distanceTo(sceneCenter)
        if (distFromCenter > maxPanDist) {
          const clampedOffset = new THREE.Vector3().subVectors(ctrl.target, sceneCenter).clampLength(0, maxPanDist)
          const clampedTarget = sceneCenter.clone().add(clampedOffset)
          const delta = new THREE.Vector3().subVectors(clampedTarget, ctrl.target)
          ctrl.target.copy(clampedTarget)
          cam.position.add(delta)
        }

        const dist = cam.position.distanceTo(ctrl.target)
        const refDist = referenceDistanceRef.current || 2.5
        const pct = Math.max(1, Math.min(9999, Math.round((refDist / Math.max(0.001, dist)) * 100)))
        setZoomLevel(pct)
        onZoomChangeRef.current?.(pct)

        // Dynamic near plane adaptation to prevent inside-mesh clipping when zoomed in
        const desiredNear = Math.max(0.02, Math.min(0.08, dist * 0.015))
        if (Math.abs(cam.near - desiredNear) > 0.005) {
          cam.near = desiredNear
          cam.updateProjectionMatrix()
        }

        // Broadcast quaternion to orientation gizmo subscribers
        if (cameraListenersRef.current.size > 0) {
          cameraListenersRef.current.forEach(cb => cb(cam.quaternion))
        }
      }
    })
    controlsRef.current = controls

    // TransformControls (Gizmo Engine)
    const transformControls = new TransformControls(camera, renderer.domElement)
    // Screen-space constant gizmo size: 1.15 gives comfortable, easily clickable handles at any zoom
    transformControls.size = 1.15
    transformControls.setMode(gizmoMode as any)
    transformControls.setSpace(gizmoSpace as any)
    
    // Custom drag tracker to guarantee smooth, 1:1 proportional mouse drag without grazing plane spikes
    let dragStartPointerNDC = { x: 0, y: 0 }
    const dragStartObjPos = new THREE.Vector3()
    const dragStartObjQuat = new THREE.Quaternion()
    const dragStartObjScale = new THREE.Vector3(1, 1, 1)
    let dragStartCamDist = 2.5
    const dragStartParentQuatInv = new THREE.Quaternion()
    const dragStartParentScale = new THREE.Vector3(1, 1, 1)

    // Intercept pointerDown to record initial state cleanly
    const originalPointerDown = transformControls.pointerDown.bind(transformControls)
    transformControls.pointerDown = function (pointer: any) {
      originalPointerDown(pointer)

      if (this.object && this.axis && pointer) {
        dragStartPointerNDC = { x: pointer.x, y: pointer.y }
        dragStartObjPos.copy(this.object.position)
        dragStartObjQuat.copy(this.object.quaternion)
        dragStartObjScale.copy(this.object.scale)

        const worldPos = new THREE.Vector3()
        this.object.getWorldPosition(worldPos)
        dragStartCamDist = Math.max(0.2, camera.position.distanceTo(worldPos))

        if (this.object.parent) {
          const parentPos = new THREE.Vector3()
          const parentQuat = new THREE.Quaternion()
          this.object.parent.matrixWorld.decompose(parentPos, parentQuat, dragStartParentScale)
          dragStartParentQuatInv.copy(parentQuat).invert()
        } else {
          dragStartParentQuatInv.identity()
          dragStartParentScale.set(1, 1, 1)
        }
      }
    }

    // Intercept pointerMove for translate, rotate, and scale with 1:1 screen-space mapping
    transformControls.pointerMove = function (pointer: any) {
      const axis = this.axis
      const mode = this.mode
      const object = this.object
      const space = this.space

      if (!object || !axis || !this.dragging || !pointer) return

      if (mode === 'translate') {
        const deltaX_NDC = pointer.x - dragStartPointerNDC.x
        const deltaY_NDC = pointer.y - dragStartPointerNDC.y

        // Compute visible world dimensions at exact object distance
        const fovRad = (camera.fov * Math.PI) / 360
        const halfHeightWorld = dragStartCamDist * Math.tan(fovRad)
        const halfWidthWorld = halfHeightWorld * camera.aspect

        const deltaX_Cam = deltaX_NDC * halfWidthWorld
        const deltaY_Cam = deltaY_NDC * halfHeightWorld

        // Camera basis vectors in world space
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize()
        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize()

        // 3D delta in camera-aligned world space
        const worldDelta = new THREE.Vector3()
          .addScaledVector(camRight, deltaX_Cam)
          .addScaledVector(camUp, deltaY_Cam)

        // Axis vectors
        const isLocal = space === 'local' && axis !== 'XYZ'
        const quat = isLocal ? dragStartObjQuat : new THREE.Quaternion()
        const axisX = new THREE.Vector3(1, 0, 0).applyQuaternion(quat).normalize()
        const axisY = new THREE.Vector3(0, 1, 0).applyQuaternion(quat).normalize()
        const axisZ = new THREE.Vector3(0, 0, 1).applyQuaternion(quat).normalize()

        // Screen projections of axes
        const projX = new THREE.Vector3()
          .addScaledVector(camRight, axisX.dot(camRight))
          .addScaledVector(camUp, axisX.dot(camUp))
        const projY = new THREE.Vector3()
          .addScaledVector(camRight, axisY.dot(camRight))
          .addScaledVector(camUp, axisY.dot(camUp))
        const projZ = new THREE.Vector3()
          .addScaledVector(camRight, axisZ.dot(camRight))
          .addScaledVector(camUp, axisZ.dot(camUp))

        const worldOffset = new THREE.Vector3()

        if (axis === 'X') {
          const lenSq = projX.lengthSq()
          const scalar = lenSq > 0.04 ? worldDelta.dot(projX) / lenSq : deltaX_Cam
          worldOffset.addScaledVector(axisX, scalar)
        } else if (axis === 'Y') {
          const lenSq = projY.lengthSq()
          const scalar = lenSq > 0.04 ? worldDelta.dot(projY) / lenSq : deltaY_Cam
          worldOffset.addScaledVector(axisY, scalar)
        } else if (axis === 'Z') {
          const lenSq = projZ.lengthSq()
          const scalar = lenSq > 0.04 ? worldDelta.dot(projZ) / lenSq : -deltaY_Cam
          worldOffset.addScaledVector(axisZ, scalar)
        } else if (axis === 'XY') {
          const lenX = projX.lengthSq()
          const lenY = projY.lengthSq()
          const sX = lenX > 0.04 ? worldDelta.dot(projX) / lenX : deltaX_Cam
          const sY = lenY > 0.04 ? worldDelta.dot(projY) / lenY : deltaY_Cam
          worldOffset.addScaledVector(axisX, sX).addScaledVector(axisY, sY)
        } else if (axis === 'XZ') {
          const lenX = projX.lengthSq()
          const lenZ = projZ.lengthSq()
          const sX = lenX > 0.04 ? worldDelta.dot(projX) / lenX : deltaX_Cam
          const sZ = lenZ > 0.04 ? worldDelta.dot(projZ) / lenZ : -deltaY_Cam
          worldOffset.addScaledVector(axisX, sX).addScaledVector(axisZ, sZ)
        } else if (axis === 'YZ') {
          const lenY = projY.lengthSq()
          const lenZ = projZ.lengthSq()
          const sY = lenY > 0.04 ? worldDelta.dot(projY) / lenY : deltaY_Cam
          const sZ = lenZ > 0.04 ? worldDelta.dot(projZ) / lenZ : -deltaY_Cam
          worldOffset.addScaledVector(axisY, sY).addScaledVector(axisZ, sZ)
        } else {
          // 'XYZ' or center free drag
          worldOffset.copy(worldDelta)
        }

        // Snap-to-Grid & Rotation Snap (Shift or Ctrl key held down)
        const isSnapping = isShiftOrCtrlPressedRef.current || Boolean(pointer?.shiftKey || pointer?.ctrlKey)
        const effectiveTranslationSnap = isSnapping ? 0.5 : this.translationSnap
        if (effectiveTranslationSnap) {
          worldOffset.x = Math.round(worldOffset.x / effectiveTranslationSnap) * effectiveTranslationSnap
          worldOffset.y = Math.round(worldOffset.y / effectiveTranslationSnap) * effectiveTranslationSnap
          worldOffset.z = Math.round(worldOffset.z / effectiveTranslationSnap) * effectiveTranslationSnap
        }

        // Convert worldOffset into parent space
        const parentLocalOffset = worldOffset.clone()
          .applyQuaternion(dragStartParentQuatInv)
          .divide(dragStartParentScale)

        object.position.copy(dragStartObjPos).add(parentLocalOffset)
        
        ;(this as any).dispatchEvent({ type: 'change' })
        ;(this as any).dispatchEvent({ type: 'objectChange' })
      } else if (mode === 'rotate') {
        const deltaX_NDC = pointer.x - dragStartPointerNDC.x
        const deltaY_NDC = pointer.y - dragStartPointerNDC.y
        const rotSensitivity = Math.PI * 1.5
        let angleDelta = 0

        if (axis === 'X') {
          angleDelta = deltaY_NDC * rotSensitivity
          const rotQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angleDelta)
          object.quaternion.copy(dragStartObjQuat).multiply(rotQuat)
        } else if (axis === 'Y') {
          angleDelta = -deltaX_NDC * rotSensitivity
          const rotQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleDelta)
          object.quaternion.copy(dragStartObjQuat).multiply(rotQuat)
        } else if (axis === 'Z') {
          angleDelta = deltaX_NDC * rotSensitivity
          const rotQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angleDelta)
          object.quaternion.copy(dragStartObjQuat).multiply(rotQuat)
        } else {
          const rotQuatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX_NDC * rotSensitivity)
          const rotQuatX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY_NDC * rotSensitivity)
          object.quaternion.copy(dragStartObjQuat).multiply(rotQuatY).multiply(rotQuatX)
        }

        // Snap rotation: 15° (Math.PI / 12) when Shift/Ctrl is held, or custom rotationSnap
        const isSnapping = isShiftOrCtrlPressedRef.current || Boolean(pointer?.shiftKey || pointer?.ctrlKey)
        const effectiveRotationSnap = isSnapping ? (Math.PI / 12) : this.rotationSnap
        if (effectiveRotationSnap) {
          const euler = new THREE.Euler().setFromQuaternion(object.quaternion)
          euler.x = Math.round(euler.x / effectiveRotationSnap) * effectiveRotationSnap
          euler.y = Math.round(euler.y / effectiveRotationSnap) * effectiveRotationSnap
          euler.z = Math.round(euler.z / effectiveRotationSnap) * effectiveRotationSnap
          object.quaternion.setFromEuler(euler)
        }

        ;(this as any).dispatchEvent({ type: 'change' })
        ;(this as any).dispatchEvent({ type: 'objectChange' })
      } else if (mode === 'scale') {
        const deltaX_NDC = pointer.x - dragStartPointerNDC.x
        const deltaY_NDC = pointer.y - dragStartPointerNDC.y

        // Exponential uniform scale mapping:
        // Moving mouse right/up smoothly scales up; moving left/down smoothly scales down.
        // Works proportionally and predictably from the object's own pivot/center without distortion
        const uniformRatio = Math.max(0.02, Math.min(50.0, Math.exp((deltaX_NDC + deltaY_NDC) * 2.0)))

        // Uniform scale: all X/Y/Z axes scale together proportionally from the object's pivot
        object.scale.set(
          Math.max(0.01, dragStartObjScale.x * uniformRatio),
          Math.max(0.01, dragStartObjScale.y * uniformRatio),
          Math.max(0.01, dragStartObjScale.z * uniformRatio)
        )

        ;(this as any).dispatchEvent({ type: 'change' })
        ;(this as any).dispatchEvent({ type: 'objectChange' })
      }
    }

    // Disable OrbitControls while user is actively dragging the Transform Gizmo
    transformControls.addEventListener('dragging-changed', (event: any) => {
      const isDragging = Boolean(event.value)
      isDraggingGizmoRef.current = isDragging
      if (controlsRef.current) {
        controlsRef.current.enabled = !isDragging
      }

      // When drag ends, commit the clean final values
      if (!isDragging && transformControls.object) {
        const target = transformControls.object
        const isProp = target.userData?.isProp
        const isChar = target.userData?.isCharacter
        const isCamera = target.userData?.isCamera
        const propId = target.userData?.propId
        const charId = target.userData?.characterId
        const shotId = target.userData?.shotId

        // AIRTIGHT SAFEGUARD: Prevent accidental prop modification if a character was selected
        const currentSelected = selectedEntityRef.current
        if (currentSelected?.type === 'character' && (!isChar || charId !== currentSelected.id)) {
          console.warn('[Gizmo Guard] Drag ended on non-selected object while character is selected. Detaching.')
          transformControls.detach()
          updateSelectionGizmoRef.current?.()
          return
        }
        if (currentSelected?.type === 'prop' && (!isProp || propId !== currentSelected.id)) {
          console.warn('[Gizmo Guard] Drag ended on non-selected object while prop is selected. Detaching.')
          transformControls.detach()
          updateSelectionGizmoRef.current?.()
          return
        }

        if (Number.isFinite(target.position.x) && Number.isFinite(target.position.y) && Number.isFinite(target.position.z)) {
          const pos: [number, number, number] = [
            Number(target.position.x.toFixed(2)),
            Number(target.position.y.toFixed(2)),
            Number(target.position.z.toFixed(2))
          ]
          const rot: [number, number, number] = [
            Math.round(target.rotation.x * (180 / Math.PI)),
            Math.round(target.rotation.y * (180 / Math.PI)),
            Math.round(target.rotation.z * (180 / Math.PI))
          ]
          const sc: [number, number, number] = [
            Math.max(0.01, Number(target.scale.x.toFixed(2))),
            Math.max(0.01, Number(target.scale.y.toFixed(2))),
            Math.max(0.01, Number(target.scale.z.toFixed(2)))
          ]

          if (isProp && propId && onUpdatePropTransformRef.current) {
            onUpdatePropTransformRef.current(propId, { position: pos, rotation: rot, scale: sc })
          } else if (isChar && charId && onUpdateCharacterTransformRef.current) {
            onUpdateCharacterTransformRef.current(charId, { position: pos, rotation: rot, scale: sc })
          } else if (isCamera && shotId) {
            const currentMode = transformControls.getMode()
            if (currentMode === 'scale') {
              target.scale.set(1, 1, 1)
            }
            if (onUpdateCameraShotRef.current) {
              onUpdateCameraShotRef.current(shotId, { position: pos })
            } else if (onUpdateCameraPositionRef.current) {
              onUpdateCameraPositionRef.current(shotId, pos)
            }
          }
        }
      }
    })

    // Listen to gizmo updates and sync back to React state in real-time
    transformControls.addEventListener('objectChange', () => {
      const target = transformControls.object
      if (!target) return

      // Sanity checks: protect against NaN / Infinity
      if (
        !Number.isFinite(target.position.x) ||
        !Number.isFinite(target.position.y) ||
        !Number.isFinite(target.position.z)
      ) {
        return
      }

      const isProp = target.userData?.isProp
      const isChar = target.userData?.isCharacter
      const isCamera = target.userData?.isCamera
      const propId = target.userData?.propId
      const charId = target.userData?.characterId
      const shotId = target.userData?.shotId

      // AIRTIGHT SAFEGUARD: Prevent accidental prop movement when a character is selected
      const currentSelected = selectedEntityRef.current
      if (currentSelected?.type === 'character' && (!isChar || charId !== currentSelected.id)) {
        console.warn('[Gizmo Guard] Gizmo target does not match selected character! Detaching from prop.')
        transformControls.detach()
        updateSelectionGizmoRef.current?.()
        return
      }
      if (currentSelected?.type === 'prop' && (!isProp || propId !== currentSelected.id)) {
        console.warn('[Gizmo Guard] Gizmo target does not match selected prop! Detaching.')
        transformControls.detach()
        updateSelectionGizmoRef.current?.()
        return
      }

      // Clamp coordinates to practical studio bounds
      if (isChar) {
        // Characters are bounded to safe studio ground area
        target.position.x = Math.max(-50, Math.min(50, target.position.x))
        target.position.y = Math.max(0, Math.min(30, target.position.y))
        target.position.z = Math.max(-50, Math.min(50, target.position.z))
      } else {
        // Props / environments can be larger studio scenery
        target.position.x = Math.max(-150, Math.min(150, target.position.x))
        target.position.y = Math.max(-50, Math.min(50, target.position.y))
        target.position.z = Math.max(-150, Math.min(150, target.position.z))
      }

      const pos: [number, number, number] = [
        Number(target.position.x.toFixed(2)),
        Number(target.position.y.toFixed(2)),
        Number(target.position.z.toFixed(2))
      ]
      const rot: [number, number, number] = [
        Math.round(target.rotation.x * (180 / Math.PI)),
        Math.round(target.rotation.y * (180 / Math.PI)),
        Math.round(target.rotation.z * (180 / Math.PI))
      ]
      const sc: [number, number, number] = [
        Math.max(0.01, Number(target.scale.x.toFixed(2))),
        Math.max(0.01, Number(target.scale.y.toFixed(2))),
        Math.max(0.01, Number(target.scale.z.toFixed(2)))
      ]

      if (isProp && propId && onUpdatePropTransformRef.current) {
        onUpdatePropTransformRef.current(propId, { position: pos, rotation: rot, scale: sc })
      } else if (isChar && charId && onUpdateCharacterTransformRef.current) {
        onUpdateCharacterTransformRef.current(charId, { position: pos, rotation: rot, scale: sc })
      } else if (isCamera && shotId) {
        const shot = cameraShotsRef.current?.find(s => s.id === shotId)
        const currentMode = transformControls.getMode()
        if (currentMode === 'rotate') {
          // Camera is being rotated: update target along new forward line of sight
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(target.quaternion).normalize()
          const currentTargetVec = shot ? new THREE.Vector3(...shot.target) : new THREE.Vector3(0, 1, 0)
          const currentPosVec = shot ? new THREE.Vector3(...shot.position) : new THREE.Vector3(0, 1.4, 2.5)
          const dist = Math.max(0.5, currentPosVec.distanceTo(currentTargetVec))
          const newTarget: [number, number, number] = [
            Number((target.position.x + forward.x * dist).toFixed(2)),
            Number((target.position.y + forward.y * dist).toFixed(2)),
            Number((target.position.z + forward.z * dist).toFixed(2))
          ]
          if (onUpdateCameraShotRef.current) {
            onUpdateCameraShotRef.current(shotId, { target: newTarget })
          }
        } else if (currentMode === 'scale') {
          // Camera is being scaled: adjust FOV
          if (shot) {
            const uniformScale = (target.scale.x + target.scale.y + target.scale.z) / 3
            if (uniformScale > 0.05 && uniformScale < 20) {
              const newFov = Math.max(10, Math.min(120, Math.round(shot.fov / uniformScale)))
              if (onUpdateCameraShotRef.current) {
                onUpdateCameraShotRef.current(shotId, { fov: newFov })
              }
            }
          }
        } else {
          // Move / Translate: update position and orient towards target
          if (shot) {
            const targetVec = new THREE.Vector3(shot.target[0], shot.target[1], shot.target[2])
            target.lookAt(targetVec)
          }
          if (onUpdateCameraShotRef.current) {
            onUpdateCameraShotRef.current(shotId, { position: pos })
          } else if (onUpdateCameraPositionRef.current) {
            onUpdateCameraPositionRef.current(shotId, pos)
          }
        }
      }

      if (selectionBoxHelperRef.current) {
        selectionBoxHelperRef.current.update()
      }
    })

    const gizmoNode = (transformControls as any).getHelper ? (transformControls as any).getHelper() : transformControls
    scene.add(gizmoNode)
    transformControlsRef.current = transformControls

    scene.add(mouseTargetRef.current)

    // Studio Environment map so PBR metallic/roughness materials never render completely black
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      pmremGenerator.compileEquirectangularShader()
      const roomEnv = new RoomEnvironment()
      scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture
      pmremGenerator.dispose()
    } catch (e) {
      console.warn('Could not initialize RoomEnvironment:', e)
    }

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, Math.max(0.6, effectiveAvatarState?.lighting?.ambientIntensity ?? 0.85))
    scene.add(ambientLight)
    ambientLightRef.current = ambientLight

    const hemiLight = new THREE.HemisphereLight(0xedf2ff, 0x252538, 0.65)
    hemiLight.position.set(0, 50, 0)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, Math.max(0.8, effectiveAvatarState?.lighting?.keyLightIntensity ?? 1.2))
    keyLight.position.set(20.0, 45.0, 30.0)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 250
    keyLight.shadow.camera.left = -60
    keyLight.shadow.camera.right = 60
    keyLight.shadow.camera.top = 60
    keyLight.shadow.camera.bottom = -60
    keyLight.shadow.bias = -0.0005
    scene.add(keyLight)
    keyLightRef.current = keyLight

    const fillLight = new THREE.DirectionalLight(0xcfd8dc, Math.max(0.4, effectiveAvatarState?.lighting?.fillLightIntensity ?? 0.6))
    fillLight.position.set(-25.0, 20.0, 15.0)
    scene.add(fillLight)
    fillLightRef.current = fillLight

    const rimLight = new THREE.DirectionalLight(
      effectiveAvatarState?.lighting?.rimLightColor || '#FF6B8B',
      Math.max(0.5, effectiveAvatarState?.lighting?.rimLightIntensity ?? 1.0)
    )
    rimLight.position.set(0, 25.0, -30.0)
    scene.add(rimLight)
    rimLightRef.current = rimLight

    // Studio Dual-Tier Ground Grid (Expansive 3D perspective ground plane with persistent horizon cues)
    const gridGroup = new THREE.Group()

    // 1. Primary Inner Grid (40m x 40m with 1.0m grid intervals)
    const innerGrid = new THREE.GridHelper(40, 40, 0x8C7BFF, 0x3D3260)
    if (innerGrid.material instanceof THREE.Material) {
      innerGrid.material.transparent = true
      innerGrid.material.opacity = 0.55
      innerGrid.material.depthWrite = false
    }
    innerGrid.renderOrder = -1
    gridGroup.add(innerGrid)

    // 2. Macro Outer Grid (400m x 400m with 10m grid intervals)
    const outerGrid = new THREE.GridHelper(400, 40, 0x5B4E8C, 0x221B36)
    if (outerGrid.material instanceof THREE.Material) {
      outerGrid.material.transparent = true
      outerGrid.material.opacity = 0.28
      outerGrid.material.depthWrite = false
    }
    outerGrid.position.y = -0.0005
    outerGrid.renderOrder = -2
    gridGroup.add(outerGrid)

    scene.add(gridGroup)
    gridHelperRef.current = gridGroup

    // Shadow Ground Pedestal (Transparent, non-occluding shadow receiver)
    const shadowGeo = new THREE.PlaneGeometry(400, 400)
    const shadowMat = new THREE.ShadowMaterial({
      opacity: effectiveAvatarState.studio?.shadowOpacity || 0.28,
      transparent: true,
      depthWrite: false
    })
    const shadowGround = new THREE.Mesh(shadowGeo, shadowMat)
    shadowGround.rotation.x = -Math.PI / 2
    shadowGround.position.y = -0.0001
    shadowGround.renderOrder = -1
    shadowGround.receiveShadow = true
    scene.add(shadowGround)
    shadowGroundRef.current = shadowGround

    // 3D Click-to-Place Target Spawning Marker
    const spawnMarker = createSpawnTargetMarker()
    scene.add(spawnMarker)
    spawnMarkerGroupRef.current = spawnMarker
    if (spawnPlacementPointRef.current && Array.isArray(spawnPlacementPointRef.current)) {
      spawnMarker.position.set(
        spawnPlacementPointRef.current[0],
        Math.max(0, spawnPlacementPointRef.current[1] || 0) + 0.015,
        spawnPlacementPointRef.current[2]
      )
      spawnMarker.visible = true
    }

    // Mouse movement listener for LookAt tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      mousePosRef.current = { x, y }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Raycast click-to-select (Characters and Props) & Ground Click-to-Place
    let isGizmoActiveOnDown = false
    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos.current = { x: e.clientX, y: e.clientY }
      // Record if the pointer is touching or hovering any gizmo axis when clicked
      isGizmoActiveOnDown = Boolean(transformControls.axis)
    }

    const handlePointerUp = (e: PointerEvent) => {
      // If the user was interacting with or releasing the transform gizmo, NEVER trigger raycast selection or placement
      if (isDraggingGizmoRef.current || isGizmoActiveOnDown || transformControls.axis) {
        isGizmoActiveOnDown = false
        return
      }
      isGizmoActiveOnDown = false

      const dx = Math.abs(e.clientX - pointerDownPos.current.x)
      const dy = Math.abs(e.clientY - pointerDownPos.current.y)
      
      // Only act on click (not orbiting/dragging camera)
      if (dx < 5 && dy < 5) {
        const rect = canvas.getBoundingClientRect()
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1

        raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera)

        // PRIORITY ORDER: Characters first, then cameras, then props/scenery, then ground plane
        const candidateRoots = [
          ...charactersGroupRef.current.children,
          ...camerasGroupRef.current.children,
          ...propsGroupRef.current.children
        ]
        const allIntersects = raycasterRef.current.intersectObjects(candidateRoots, true)

        if (allIntersects.length > 0) {
          // PASS 1: Prioritize character hits first!
          // If a character mesh was clicked anywhere along the ray, ALWAYS select the character
          for (const hit of allIntersects) {
            let cur: THREE.Object3D | null = hit.object
            while (cur) {
              if (cur.userData?.characterId) {
                const foundChar = sceneCharactersRef.current.find(
                  c => c.id === cur.userData.characterId || c.characterId === cur.userData.characterId
                )
                if (foundChar) {
                  onSelectEntityRef.current?.({ type: 'character', id: foundChar.id })
                  onSelectPropRef.current?.(null)
                  return
                }
              }
              cur = cur.parent
            }
          }

          // PASS 2: Camera shots
          for (const hit of allIntersects) {
            let cur: THREE.Object3D | null = hit.object
            while (cur) {
              if (cur.userData?.shotId) {
                onSelectEntityRef.current?.({ type: 'camera', id: cur.userData.shotId })
                onSelectPropRef.current?.(null)
                return
              }
              cur = cur.parent
            }
          }

          // PASS 3: Props / environment scenery
          for (const hit of allIntersects) {
            let cur: THREE.Object3D | null = hit.object
            while (cur) {
              if (cur.userData?.propId) {
                // If the user clicked on a road or terrain/ground surface prop, allow setting spawn placement point
                const propPresetId = cur.userData?.presetId || ''
                const propName = (cur.name || '').toLowerCase()
                const isGroundSurfaceProp = (
                  propPresetId === 'road_tile' ||
                  propName.includes('road') ||
                  propName.includes('ground') ||
                  propName.includes('floor') ||
                  propName.includes('sidewalk') ||
                  propName.includes('terrain')
                )

                if (isGroundSurfaceProp && onSetSpawnPlacementPointRef.current) {
                  const clampedX = Math.max(-80, Math.min(80, hit.point.x))
                  const clampedZ = Math.max(-80, Math.min(80, hit.point.z))
                  const pt: [number, number, number] = [
                    Number(clampedX.toFixed(2)),
                    0,
                    Number(clampedZ.toFixed(2))
                  ]
                  onSetSpawnPlacementPointRef.current(pt)
                  onSelectEntityRef.current?.(null)
                  onSelectPropRef.current?.(null)
                  return
                }

                onSelectEntityRef.current?.({ type: 'prop', id: cur.userData.propId })
                onSelectPropRef.current?.(cur.userData.propId)
                return
              }
              cur = cur.parent
            }
          }
        }

        // PASS 4: Ground plane intersection for Click-to-Place Target Spawning
        // When clicking anywhere on empty ground/terrain/grid in the viewport
        if (onSetSpawnPlacementPointRef.current) {
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
          const groundIntersection = new THREE.Vector3()
          if (raycasterRef.current.ray.intersectPlane(groundPlane, groundIntersection)) {
            if (Number.isFinite(groundIntersection.x) && Number.isFinite(groundIntersection.z)) {
              const clampedX = Math.max(-80, Math.min(80, groundIntersection.x))
              const clampedZ = Math.max(-80, Math.min(80, groundIntersection.z))
              const pt: [number, number, number] = [
                Number(clampedX.toFixed(2)),
                0,
                Number(clampedZ.toFixed(2))
              ]
              onSetSpawnPlacementPointRef.current(pt)
              onSelectEntityRef.current?.(null)
              onSelectPropRef.current?.(null)
              return
            }
          }
        }
      }
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerup', handlePointerUp)

    // Handle Window Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    const resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(container)

    // Keyboard Shortcuts (W, E, R, Q, F, Shift/Ctrl snap)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey || e.ctrlKey || e.key === 'Shift' || e.key === 'Control') {
        isShiftOrCtrlPressedRef.current = true
      }

      const activeTag = (document.activeElement?.tagName || '').toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (e.key === 'w' || e.key === 'W') {
        onGizmoModeChangeRef.current?.('translate')
      } else if (e.key === 'e' || e.key === 'E') {
        onGizmoModeChangeRef.current?.('rotate')
      } else if (e.key === 'r' || e.key === 'R') {
        onGizmoModeChangeRef.current?.('scale')
      } else if (e.key === 'q' || e.key === 'Q') {
        onGizmoSpaceChangeRef.current?.(gizmoSpace === 'world' ? 'local' : 'world')
      } else if (e.key === 'f' || e.key === 'F') {
        if (transformControls.object) {
          focusObject(transformControls.object)
        }
      } else if (e.key === 'Escape') {
        onSelectEntityRef.current?.(null)
        onSelectPropRef.current?.(null)
        onSetSpawnPlacementPointRef.current?.(null)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey && !e.ctrlKey) {
        isShiftOrCtrlPressedRef.current = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Animation & Render Loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const timer = timerRef.current
      if (timer) {
        timer.update()
      }
      const rawDelta = timer ? timer.getDelta() : 1 / 60
      const delta = Math.min(rawDelta, 1 / 30) // Avoid physics explosion
      const elapsedTime = timer ? timer.getElapsed() : 0

      // Camera Smooth Transition Interpolation
      const transition = cameraTransitionRef.current
      if (transition.active) {
        const now = performance.now()
        const progress = Math.min(1, (now - transition.startTime) / transition.duration)
        // Smooth ease-in-out cubic
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2

        camera.position.lerpVectors(transition.startPos, transition.targetPos, ease)
        controls.target.lerpVectors(transition.startLookAt, transition.targetLookAt, ease)

        if (Math.abs(transition.startFov - transition.targetFov) > 0.1) {
          camera.fov = THREE.MathUtils.lerp(transition.startFov, transition.targetFov, ease)
          camera.updateProjectionMatrix()
        }

        if (progress >= 1) {
          transition.active = false
        }
      }

      // Sanitize camera & controls against NaN/Infinity
      if (
        !Number.isFinite(camera.position.x) || !Number.isFinite(camera.position.y) || !Number.isFinite(camera.position.z) ||
        !Number.isFinite(controls.target.x) || !Number.isFinite(controls.target.y) || !Number.isFinite(controls.target.z)
      ) {
        camera.position.set(0, 1.1, 2.5)
        controls.target.set(0, 0.9, 0)
        camera.up.set(0, 1, 0)
        camera.near = 0.05
        camera.far = 3000.0
        camera.updateProjectionMatrix()
        controls.update()
        cameraTransitionRef.current.active = false
      }

      controls.update()

      // Keep lost scene timer reset (ground/floor plane and camera stay fixed, auto-framing only on explicit user request)
      lostSceneTimerRef.current = 0

      // Broadcast camera orientation to gizmo subscribers
      if (cameraListenersRef.current.size > 0) {
        cameraListenersRef.current.forEach(cb => cb(camera.quaternion))
      }

      // Update Selection Box Helper if active
      if (selectionBoxHelperRef.current) {
        selectionBoxHelperRef.current.update()
      }

      // Animate 3D Spawn Target Marker if visible
      if (spawnMarkerGroupRef.current && spawnMarkerGroupRef.current.visible) {
        const outerRing = spawnMarkerGroupRef.current.getObjectByName('marker_outer_ring')
        if (outerRing) {
          outerRing.rotation.z += delta * 1.2
        }
        const innerDisc = spawnMarkerGroupRef.current.getObjectByName('marker_inner_disc')
        if (innerDisc) {
          const discMat = (innerDisc as THREE.Mesh).material as THREE.MeshBasicMaterial
          if (discMat) {
            discMat.opacity = 0.18 + Math.sin(elapsedTime * 4) * 0.08
          }
        }
        const pin = spawnMarkerGroupRef.current.getObjectByName('marker_pin')
        if (pin) {
          pin.position.y = 1.05 + Math.sin(elapsedTime * 3.5) * 0.08
          pin.rotation.y += delta * 2.0
        }
      }

      // Update all active characters' VRM instances in scene
      loadedCharactersMap.current.forEach(({ vrmInstance, state }) => {
        if (!vrmInstance) return

        // Auto Eye Tracking
        if (state.eyeTracking && vrmInstance.lookAt) {
          const target = mouseTargetRef.current
          target.position.set(
            mousePosRef.current.x * 2.0,
            1.4 + mousePosRef.current.y * 1.5,
            1.5
          )
          vrmInstance.lookAt.target = target
        }

        // Auto Blink
        if (state.autoBlink && vrmInstance.expressionManager) {
          const blinkCycle = elapsedTime % 3.5
          if (blinkCycle < 0.18) {
            const blinkWeight = Math.sin((blinkCycle / 0.18) * Math.PI)
            vrmInstance.expressionManager.setValue('blink', blinkWeight)
          } else {
            vrmInstance.expressionManager.setValue('blink', state.expressions['blink'] || 0)
          }
        }

        // Auto LipSync
        if (state.autoLipSync && vrmInstance.expressionManager) {
          const talkWeight = Math.max(0, Math.sin(elapsedTime * 9) * 0.7 + Math.sin(elapsedTime * 14) * 0.3)
          vrmInstance.expressionManager.setValue('aa', talkWeight)
        }

        const isAnimActive = isAnimatedPoseKey(state.activePosePreset) ||
                             Boolean(vrmInstance.userData?.isPlayingMixamo) ||
                             Boolean(vrmInstance.userData?.currentAction?.isRunning())

        // Auto Breathing (paused when an animated walk/Mixamo cycle is active to prevent chest/spine rotation conflicts)
        if (state.autoBreathing && !isAnimActive && vrmInstance.humanoid) {
          const breathSpine = vrmInstance.humanoid.getNormalizedBoneNode?.('spine' as any) || vrmInstance.humanoid.getRawBoneNode?.('spine' as any)
          const breathChest = vrmInstance.humanoid.getNormalizedBoneNode?.('chest' as any) || vrmInstance.humanoid.getRawBoneNode?.('chest' as any)
          const breathAngle = Math.sin(elapsedTime * 2.2) * 0.015
          if (breathChest) {
            breathChest.rotation.x = (state.boneRotations['chest']?.[0] || 0) * (Math.PI / 180) + breathAngle
          }
          if (breathSpine) {
            breathSpine.rotation.x = (state.boneRotations['spine']?.[0] || 0) * (Math.PI / 180) + breathAngle * 0.5
          }
        }

        // SpringBone Physics update / VRM internal update
        try {
          vrmInstance.update(delta)
        } catch (e) {
          // safe guard
        }

        // Animation Mixer update (Mixamo / retargeted animations)
        // MUST run LAST in the frame after vrmInstance.update so that the animated walk cycle has
        // 100% authoritative final control over all bone rotations (arms, shoulders, spine, chest, legs)
        const charMixer = (vrmInstance as any).mixer || (vrmInstance as any).userData?.currentMixer
        if (charMixer) {
          try {
            charMixer.update(delta)
          } catch (e) {
            // safe guard
          }
        }
      })

      try {
        // 1. Primary Full Viewport Render
        const containerW = container.clientWidth
        const containerH = container.clientHeight

        renderer.setViewport(0, 0, containerW, containerH)
        renderer.setScissorTest(false)
        renderer.setClearColor(0x000000, 0)
        renderer.render(scene, camera)

        // 2. Secondary PiP Pass (Clean "through-the-lens" live camera preview)
        const pipShot = pipActiveShotRef.current
        const previewEl = pipPreviewRef.current

        if (editorMode !== 'character' && pipShot && isPipOpenRef.current && !isPipMinimizedRef.current && previewEl && containerW > 240 && containerH > 180) {
          const canvasRect = canvas.getBoundingClientRect()
          const boxRect = previewEl.getBoundingClientRect()

          if (boxRect.width > 20 && boxRect.height > 20) {
            // Find corresponding camera mesh to sync position in real-time while dragging
            const camMesh = loadedCamerasMeshMap.current.get(pipShot.id)
            if (camMesh) {
              pipCameraRef.current.position.copy(camMesh.position)
            } else {
              pipCameraRef.current.position.set(pipShot.position[0], pipShot.position[1], pipShot.position[2])
            }

            const targetVec = new THREE.Vector3(pipShot.target[0], pipShot.target[1], pipShot.target[2])
            pipCameraRef.current.lookAt(targetVec)

            const shotFov = Number(pipShot.fov) || 32
            if (pipCameraRef.current.fov !== shotFov) {
              pipCameraRef.current.fov = shotFov
            }

            // Exact pixel coordinate mapping for WebGL scissor & viewport
            // In WebGL, (0, 0) is the bottom-left corner of the canvas
            const pipX = Math.round(boxRect.left - canvasRect.left)
            const pipY = Math.round(canvasRect.bottom - boxRect.bottom)
            const pipW = Math.round(boxRect.width)
            const pipH = Math.round(boxRect.height)

            pipCameraRef.current.aspect = pipW / pipH
            pipCameraRef.current.updateProjectionMatrix()

            // Hide editor overlays for the clean shot
            const gizmoHelper = (transformControls as any)?.getHelper?.() || transformControls
            const origGizmoVis = gizmoHelper ? gizmoHelper.visible : false
            const origBoxVis = selectionBoxHelperRef.current ? selectionBoxHelperRef.current.visible : false
            const origGridVis = gridHelperRef.current ? gridHelperRef.current.visible : false
            const origCamGroupVis = camerasGroupRef.current.visible
            const origMarkerVis = spawnMarkerGroupRef.current ? spawnMarkerGroupRef.current.visible : false

            if (gizmoHelper) gizmoHelper.visible = false
            if (selectionBoxHelperRef.current) selectionBoxHelperRef.current.visible = false
            if (gridHelperRef.current) gridHelperRef.current.visible = false
            if (spawnMarkerGroupRef.current) spawnMarkerGroupRef.current.visible = false
            camerasGroupRef.current.visible = false

            // Enable scissor test specifically for this preview rectangle
            // NOTE: Three.js's setScissor and setViewport automatically multiply by pixelRatio internally!
            renderer.setScissorTest(true)
            renderer.setScissor(pipX, pipY, pipW, pipH)
            renderer.setViewport(pipX, pipY, pipW, pipH)

            // Clear color & depth buffer for this region with solid studio dark tone
            renderer.setClearColor(0x15151e, 1)
            renderer.clear(true, true, true)

            // Render clean scene from this camera
            renderer.render(scene, pipCameraRef.current)

            // Restore visibility & viewport state
            renderer.setScissorTest(false)
            renderer.setViewport(0, 0, containerW, containerH)
            renderer.setClearColor(0x000000, 0)

            if (gizmoHelper) gizmoHelper.visible = origGizmoVis
            if (selectionBoxHelperRef.current) selectionBoxHelperRef.current.visible = origBoxVis
            if (gridHelperRef.current) gridHelperRef.current.visible = origGridVis
            if (spawnMarkerGroupRef.current) spawnMarkerGroupRef.current.visible = origMarkerVis
            camerasGroupRef.current.visible = origCamGroupVis
          }
        }
      } catch (renderError) {
        console.warn('[VRMViewport3D render exception]:', renderError)
      } finally {
        renderer.setScissorTest(false)
      }
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
      resizeObserver.disconnect()
      transformControls.dispose()
      if (spawnMarkerGroupRef.current) {
        scene.remove(spawnMarkerGroupRef.current)
        disposeThreeHierarchy(spawnMarkerGroupRef.current)
      }
      renderer.dispose()
    }
  }, [])

  // Sync TransformControls Mode and Space
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(gizmoMode as any)
      transformControlsRef.current.setSpace(gizmoSpace as any)
    }
  }, [gizmoMode, gizmoSpace])

  // Synchronize Characters Hierarchy with Three.js
  useEffect(() => {
    const charsGroup = charactersGroupRef.current
    const scene = sceneRef.current
    if (!charsGroup) return
    if (editorMode === 'character') return

    let isEffectCancelled = false

    const currentCharIds = new Set(sceneCharacters.map(c => c.id))

    // 1. PURGE ON EMPTY: If no characters in scene, completely clear and dispose all models
    if (sceneCharacters.length === 0) {
      loadedCharactersMap.current.forEach((item) => {
        if (transformControlsRef.current?.object === item.group) {
          transformControlsRef.current.detach()
        }
        disposeVRMInstance(item.vrmInstance)
        disposeThreeHierarchy(item.group)
        if (item.group.parent) {
          item.group.parent.remove(item.group)
        }
      })
      loadedCharactersMap.current.clear()

      // Thoroughly sweep charsGroup.children to eliminate any ghost/orphaned meshes
      while (charsGroup.children.length > 0) {
        const child = charsGroup.children[0]
        charsGroup.remove(child)
        disposeThreeHierarchy(child)
      }

      if (selectionBoxHelperRef.current) {
        if (scene) scene.remove(selectionBoxHelperRef.current)
        selectionBoxHelperRef.current.dispose?.()
        selectionBoxHelperRef.current = null
      }
      if (transformControlsRef.current?.object) {
        transformControlsRef.current.detach()
      }
      return
    }

    // 2. Remove any characters from loadedCharactersMap that are no longer in sceneCharacters
    loadedCharactersMap.current.forEach((item, id) => {
      if (!currentCharIds.has(id)) {
        if (transformControlsRef.current?.object === item.group) {
          transformControlsRef.current.detach()
        }
        if (selectionBoxHelperRef.current) {
          if (scene) scene.remove(selectionBoxHelperRef.current)
          selectionBoxHelperRef.current.dispose?.()
          selectionBoxHelperRef.current = null
        }
        disposeVRMInstance(item.vrmInstance)
        disposeThreeHierarchy(item.group)
        if (item.group.parent) {
          item.group.parent.remove(item.group)
        }
        charsGroup.remove(item.group)
        loadedCharactersMap.current.delete(id)
      }
    })

    // 3. Scan charsGroup.children directly to ensure NO untracked/stale meshes remain in the scene graph
    for (let i = charsGroup.children.length - 1; i >= 0; i--) {
      const child = charsGroup.children[i]
      const charId = child.userData?.characterId
      if (!charId || !currentCharIds.has(charId)) {
        if (transformControlsRef.current?.object === child) {
          transformControlsRef.current.detach()
        }
        charsGroup.remove(child)
        disposeThreeHierarchy(child)
      }
    }

    // 4. Add or Update characters
    const syncSceneCharacters = async () => {
      for (const char of sceneCharacters) {
        if (isEffectCancelled) break
        let charEntry = loadedCharactersMap.current.get(char.id)

        if (!charEntry) {
          // Prevent race conditions: if this character is currently loading, don't start duplicate load
          if (loadingCharacterIdsRef.current.has(char.id)) {
            continue
          }
          loadingCharacterIdsRef.current.add(char.id)

          try {
            const group = new THREE.Group()
            group.name = `CHAR_GROUP_${char.id}`
            group.userData = { characterId: char.id, isCharacter: true }

            let vrmInstance: any = null

            if (char.rawVrmBuffer) {
              try {
                const loaded = await loadVRMFromArrayBuffer(char.rawVrmBuffer)
                vrmInstance = loaded.vrm
              } catch (e) {
                console.warn('Failed to parse VRM buffer for character instance, using procedural rig fallback:', char.name, e)
                vrmInstance = createProceduralAnimeRig(char.state?.templateType || 'female_mage', char.name)
              }
            } else {
              // Independent procedural rig for each instance
              vrmInstance = createProceduralAnimeRig(char.state?.templateType || 'female_mage', char.name)
            }

            // Only discard if the character was completely removed from scene while loading
            if (!sceneCharactersRef.current.some(c => c.id === char.id)) {
              if (vrmInstance) {
                disposeVRMInstance(vrmInstance)
                if (vrmInstance.scene) disposeThreeHierarchy(vrmInstance.scene)
              }
              disposeThreeHierarchy(group)
              return
            }

            if (vrmInstance && vrmInstance.scene) {
              vrmInstance.scene.userData = { characterId: char.id, isCharacter: true }
              // Tag all descendent meshes so raycasting reliably identifies the character instance
              vrmInstance.scene.traverse((child: any) => {
                if (child.isMesh) {
                  child.userData = child.userData || {}
                  child.userData.characterId = char.id
                  child.userData.isCharacter = true
                }
              })
              group.add(vrmInstance.scene)
            }

            // Ensure no duplicate group already exists in charsGroup for this character ID
            for (let i = charsGroup.children.length - 1; i >= 0; i--) {
              if (charsGroup.children[i].userData?.characterId === char.id) {
                const oldChild = charsGroup.children[i]
                charsGroup.remove(oldChild)
                disposeThreeHierarchy(oldChild)
              }
            }

            charEntry = { group, vrmInstance, state: char.state }
            loadedCharactersMap.current.set(char.id, charEntry)
            charsGroup.add(group)

            // Trigger selection/gizmo update now that mesh is fully loaded
            updateSelectionGizmoRef.current?.()

            // Auto-frame newly loaded or selected character into viewport
            if (selectedEntityRef.current?.type === 'character' && (selectedEntityRef.current.id === char.id || selectedEntityRef.current.id === char.characterId)) {
              frameObject(group, true)
            }
          } catch (err) {
            console.error('Error loading character into scene:', err)
          } finally {
            loadingCharacterIdsRef.current.delete(char.id)
          }
        }

        // Update transform on character root group
        if (charEntry) {
          charEntry.state = char.state

          if ((editorMode as string) === 'character') {
            // SINGLE CHARACTER FOCUS:
            const isCurrentActive = Boolean(
              (activeCharacterId && (char.characterId === activeCharacterId || char.id === activeCharacterId)) ||
              (!activeCharacterId && sceneCharacters[0]?.id === char.id)
            )

            if (isCurrentActive) {
              charEntry.group.visible = !isCharacterViewportHidden
              charEntry.group.position.set(0, 0, 0)
              charEntry.group.rotation.set(0, 0, 0)
              charEntry.group.scale.set(1, 1, 1)
            } else {
              charEntry.group.visible = false
            }
          } else {
            // Scene Builder / Animation mode: render according to scene transform and visibility
            const isBeingDragged = isDraggingGizmoRef.current && transformControlsRef.current?.object === charEntry.group
            if (!isBeingDragged) {
              if (Number.isFinite(char.position[0]) && Number.isFinite(char.position[1]) && Number.isFinite(char.position[2])) {
                charEntry.group.position.set(char.position[0], char.position[1], char.position[2])
              }
              if (Number.isFinite(char.rotation[0]) && Number.isFinite(char.rotation[1]) && Number.isFinite(char.rotation[2])) {
                charEntry.group.rotation.set(
                  char.rotation[0] * (Math.PI / 180),
                  char.rotation[1] * (Math.PI / 180),
                  char.rotation[2] * (Math.PI / 180)
                )
              }
              if (Number.isFinite(char.scale[0]) && Number.isFinite(char.scale[1]) && Number.isFinite(char.scale[2])) {
                charEntry.group.scale.set(char.scale[0], char.scale[1], char.scale[2])
              }
            }
            charEntry.group.visible = char.visible
          }

          // Apply avatar poses, materials, proportions
          if (charEntry.vrmInstance) {
            if (!charEntry.vrmInstance.userData) {
              charEntry.vrmInstance.userData = {}
            }
            const safeState = char.state || DEFAULT_AVATAR_STATE
            if (isAnimatedPoseKey(safeState.activePosePreset)) {
              const animConfig = getMixamoAnimationConfig(safeState.activePosePreset)
              if (animConfig && (!charEntry.vrmInstance.userData.isPlayingMixamo || charEntry.vrmInstance.userData.currentPoseKey !== safeState.activePosePreset)) {
                charEntry.vrmInstance.userData.currentPoseKey = safeState.activePosePreset
                playMixamoAnimation(safeState.activePosePreset, charEntry.vrmInstance, { speed: animConfig.speed || 1.0 })
              }
            } else {
              if (charEntry.vrmInstance.userData.isPlayingMixamo) {
                stopMixamoAnimation(charEntry.vrmInstance)
                charEntry.vrmInstance.userData.currentPoseKey = null
              }
              applyBoneRotations(charEntry.vrmInstance, safeState.boneRotations || {}, safeState.activePosePreset)
            }
            applyExpressionWeights(charEntry.vrmInstance, safeState.expressions || {})
            applyProportions(charEntry.vrmInstance, safeState.proportions || DEFAULT_PROPORTIONS)
            applyMaterialSettings(charEntry.vrmInstance, safeState.materials || DEFAULT_MATERIALS)
          }
        }
      }
    }

    syncSceneCharacters().then(() => {
      if (!isEffectCancelled) {
        updateSelectionGizmoRef.current?.()
      }
    }).catch(e => {
      console.error('Error syncing scene characters:', e)
    })

    return () => {
      isEffectCancelled = true
    }
  }, [sceneCharacters, editorMode, activeCharacterId, isCharacterViewportHidden])

  // Single Character Editor sync (when editing single character in Character mode)
  useEffect(() => {
    if (editorMode === 'character' && vrm) {
      const charsGroup = charactersGroupRef.current
      if (charsGroup) {
        // Clear all previous children to prevent stale or duplicate models
        while (charsGroup.children.length > 0) {
          charsGroup.remove(charsGroup.children[0])
        }

        const singleGroup = new THREE.Group()
        singleGroup.userData = { characterId: activeCharacterId || 'default_char', isCharacter: true }
        singleGroup.add(vrm.scene)
        charsGroup.add(singleGroup)
        loadedCharactersMap.current.clear()
        loadedCharactersMap.current.set(activeCharacterId || 'default_char', { group: singleGroup, vrmInstance: vrm, state: avatarState })

        singleGroup.position.set(0, 0, 0)
        singleGroup.rotation.set(0, 0, 0)
        singleGroup.scale.set(1, 1, 1)
        // In Character Editor mode, the active character is ALWAYS visible
        singleGroup.visible = true

        if (!vrm.userData) {
          vrm.userData = {}
        }

        if (avatarState) {
          if (isAnimatedPoseKey(avatarState.activePosePreset)) {
            const animConfig = getMixamoAnimationConfig(avatarState.activePosePreset)
            if (animConfig && (!vrm.userData.isPlayingMixamo || vrm.userData.currentPoseKey !== avatarState.activePosePreset)) {
              vrm.userData.currentPoseKey = avatarState.activePosePreset
              playMixamoAnimation(avatarState.activePosePreset, vrm, { speed: animConfig.speed || 1.0 })
            }
          } else {
            if (vrm.userData.isPlayingMixamo) {
              stopMixamoAnimation(vrm)
              vrm.userData.currentPoseKey = null
            }
            applyBoneRotations(vrm, avatarState.boneRotations, avatarState.activePosePreset)
          }
          applyExpressionWeights(vrm, avatarState.expressions)
          applyProportions(vrm, avatarState.proportions)
          applyMaterialSettings(vrm, avatarState.materials)
        }
      }
    }
  }, [editorMode, activeCharacterId, isCharacterViewportHidden, vrm, avatarState])

  // Automatic "Frame Selected Character" camera behavior:
  // After loading or switching any character, compute its exact 3D bounding box and position
  // the camera so the entire full body from head to feet is cleanly framed and centered.
  const autoFramedCharIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (editorMode === 'character' && vrm && activeCharacterId !== autoFramedCharIdRef.current) {
      autoFramedCharIdRef.current = activeCharacterId
      const camera = cameraRef.current
      const controls = controlsRef.current
      if (camera && controls) {
        const charMesh = vrm.scene
        if (charMesh) {
          charMesh.updateMatrixWorld(true)
          const box = new THREE.Box3().setFromObject(charMesh)
          if (!box.isEmpty() && Number.isFinite(box.min.y) && Number.isFinite(box.max.y)) {
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const fovRad = (camera.fov * Math.PI) / 360
            const aspect = Math.max(0.5, camera.aspect || 1.6)
            const maxDim = Math.max(size.y, size.x / aspect)
            const distance = Math.max(1.8, (maxDim * 0.5) / Math.tan(fovRad) * 1.32)
            
            camera.position.set(center.x, center.y + 0.05, center.z + distance)
            camera.near = 0.05
            camera.far = 100.0
            camera.updateProjectionMatrix()
            controls.target.set(center.x, center.y, center.z)
            controls.update()
            setZoomLevel(100)
          } else {
            camera.position.set(0, 1.05, 2.7)
            controls.target.set(0, 0.9, 0)
            controls.update()
          }
        }
      }
    }
  }, [editorMode, vrm, activeCharacterId])

  // Auto-frame scene once upon entering Scene Builder mode
  const autoFramedSceneModeRef = useRef(false)
  useEffect(() => {
    if (editorMode === 'scene') {
      if (!autoFramedSceneModeRef.current) {
        autoFramedSceneModeRef.current = true
        const timer = setTimeout(() => {
          resetView(false)
        }, 120)
        return () => clearTimeout(timer)
      }
    } else {
      autoFramedSceneModeRef.current = false
    }
  }, [editorMode, resetView])

  // Synchronize Scene Props with Three.js Hierarchy
  useEffect(() => {
    const scene = sceneRef.current
    const propsGroup = propsGroupRef.current
    if (!scene || !propsGroup) return

    // In Character Editor mode, props are strictly hidden!
    propsGroup.visible = (editorMode !== 'character')
    if (editorMode === 'character') return

    const currentPropIds = new Set(sceneProps.map(p => p.id))

    // 1. PURGE ON EMPTY: If sceneProps is empty, forcefully sweep and dispose all children in propsGroup
    if (sceneProps.length === 0) {
      loadedPropsMeshMap.current.forEach((meshGroup) => {
        disposeThreeHierarchy(meshGroup)
        if (meshGroup.parent) meshGroup.parent.remove(meshGroup)
      })
      loadedPropsMeshMap.current.clear()

      while (propsGroup.children.length > 0) {
        const child = propsGroup.children[0]
        propsGroup.remove(child)
        disposeThreeHierarchy(child)
      }

      if (transformControlsRef.current?.object && (transformControlsRef.current.object as any).userData?.isProp) {
        transformControlsRef.current.detach()
      }
      return
    }

    // 2. Remove deleted props from map
    loadedPropsMeshMap.current.forEach((meshGroup, id) => {
      if (!currentPropIds.has(id)) {
        if (transformControlsRef.current?.object === meshGroup) {
          transformControlsRef.current.detach()
        }
        disposeThreeHierarchy(meshGroup)
        if (meshGroup.parent) meshGroup.parent.remove(meshGroup)
        propsGroup.remove(meshGroup)
        loadedPropsMeshMap.current.delete(id)
      }
    })

    // 3. Scan propsGroup.children directly to ensure NO untracked/stale/orphaned meshes remain
    for (let i = propsGroup.children.length - 1; i >= 0; i--) {
      const child = propsGroup.children[i]
      const propId = child.userData?.propId
      if (!propId || !currentPropIds.has(propId)) {
        if (transformControlsRef.current?.object === child) {
          transformControlsRef.current.detach()
        }
        propsGroup.remove(child)
        disposeThreeHierarchy(child)
      }
    }

    // 4. Add or Update props
    sceneProps.forEach(async (prop) => {
      let propMeshGroup = loadedPropsMeshMap.current.get(prop.id)

      if (!propMeshGroup) {
        if (loadingPropIdsRef.current.has(prop.id)) {
          return
        }
        loadingPropIdsRef.current.add(prop.id)

        try {
          if (prop.sourceType === 'custom_upload' && prop.glbBuffer) {
            try {
              const { group } = await loadGLBPropFromArrayBuffer(prop.glbBuffer)
              group.userData = { propId: prop.id, isProp: true }
              propMeshGroup = group
            } catch (err) {
              console.error('Failed to load custom GLB prop:', err)
              return
            }
          } else if (prop.presetId) {
            const group = createStarterPropMesh(prop.presetId)
            group.userData = { propId: prop.id, isProp: true }
            propMeshGroup = group
          }

          if (propMeshGroup) {
            cleanAndPrunePropMesh(propMeshGroup)
            // Deduplicate: ensure no duplicate child exists in propsGroup for this prop ID
            for (let i = propsGroup.children.length - 1; i >= 0; i--) {
              if (propsGroup.children[i].userData?.propId === prop.id) {
                const oldChild = propsGroup.children[i]
                propsGroup.remove(oldChild)
                disposeThreeHierarchy(oldChild)
              }
            }

            loadedPropsMeshMap.current.set(prop.id, propMeshGroup)
            propsGroup.add(propMeshGroup)

            // Immediately apply initial transforms so world matrix & bounding box are accurate
            if (Number.isFinite(prop.position[0]) && Number.isFinite(prop.position[1]) && Number.isFinite(prop.position[2])) {
              propMeshGroup.position.set(prop.position[0], prop.position[1], prop.position[2])
            }
            if (Number.isFinite(prop.rotation[0]) && Number.isFinite(prop.rotation[1]) && Number.isFinite(prop.rotation[2])) {
              propMeshGroup.rotation.set(
                prop.rotation[0] * (Math.PI / 180),
                prop.rotation[1] * (Math.PI / 180),
                prop.rotation[2] * (Math.PI / 180)
              )
            }
            if (Number.isFinite(prop.scale[0]) && Number.isFinite(prop.scale[1]) && Number.isFinite(prop.scale[2])) {
              propMeshGroup.scale.set(prop.scale[0], prop.scale[1], prop.scale[2])
            }
            propMeshGroup.updateMatrixWorld(true)

            if (!framedPropsSetRef.current.has(prop.id)) {
              framedPropsSetRef.current.add(prop.id)
              // Automatically frame newly added or imported prop immediately
              if (selectedEntity?.id === prop.id || !selectedEntity || selectedEntity.type === 'prop') {
                frameObject(propMeshGroup, true)
              }
            }
          }
        } finally {
          loadingPropIdsRef.current.delete(prop.id)
        }
      }

      if (propMeshGroup) {
        // Only overwrite Three.js transforms if not actively dragging this object with gizmo
        const isBeingDragged = isDraggingGizmoRef.current && transformControlsRef.current?.object === propMeshGroup
        if (!isBeingDragged) {
          if (Number.isFinite(prop.position[0]) && Number.isFinite(prop.position[1]) && Number.isFinite(prop.position[2])) {
            propMeshGroup.position.set(prop.position[0], prop.position[1], prop.position[2])
          }
          if (Number.isFinite(prop.rotation[0]) && Number.isFinite(prop.rotation[1]) && Number.isFinite(prop.rotation[2])) {
            propMeshGroup.rotation.set(
              prop.rotation[0] * (Math.PI / 180),
              prop.rotation[1] * (Math.PI / 180),
              prop.rotation[2] * (Math.PI / 180)
            )
          }
          if (Number.isFinite(prop.scale[0]) && Number.isFinite(prop.scale[1]) && Number.isFinite(prop.scale[2])) {
            propMeshGroup.scale.set(prop.scale[0], prop.scale[1], prop.scale[2])
          }
        }

        // Visibility
        propMeshGroup.visible = prop.visible
        // Shadows
        propMeshGroup.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = prop.castShadow
          }
        })
      }
    })
  }, [sceneProps, editorMode])

  // Helper to create a stylized, compact 3D camera gizmo mesh (scaled for clean readability even with 8+ cameras)
  const createCameraGizmoMesh = (shot: SceneCameraShot) => {
    const group = new THREE.Group()

    // Camera Body (Compact, modern studio camera block)
    const bodyGeo = new THREE.BoxGeometry(0.15, 0.10, 0.16)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      metalness: 0.6,
      roughness: 0.35,
      emissive: 0x000000,
      emissiveIntensity: 0
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.set(0, 0, 0)
    group.add(body)

    // Camera Lens (Cylinder pointing along negative Z)
    const lensGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.09, 16)
    lensGeo.rotateX(Math.PI / 2)
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x000000,
      emissiveIntensity: 0
    })
    const lens = new THREE.Mesh(lensGeo, lensMat)
    lens.position.set(0, 0, -0.12)
    group.add(lens)

    // Viewfinder / Top accessory
    const vfGeo = new THREE.BoxGeometry(0.06, 0.035, 0.07)
    const vfMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.5,
      roughness: 0.4
    })
    const vf = new THREE.Mesh(vfGeo, vfMat)
    vf.position.set(0, 0.065, -0.01)
    group.add(vf)

    // Directional Pointer Cone (visual indicator of view frustum orientation)
    const coneGeo = new THREE.ConeGeometry(0.07, 0.20, 4)
    coneGeo.rotateX(-Math.PI / 2)
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    })
    const cone = new THREE.Mesh(coneGeo, coneMat)
    cone.position.set(0, 0, -0.26)
    group.add(cone)

    // Ground / Anchor Ring Indicator (Subtle halo showing camera ground anchor and orientation)
    const ringGeo = new THREE.RingGeometry(0.09, 0.11, 24)
    ringGeo.rotateX(-Math.PI / 2)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      visible: false
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.set(0, -0.06, 0)
    group.add(ring)

    group.userData = { 
      shotId: shot.id, 
      isCamera: true,
      bodyMat,
      lensMat,
      coneMat,
      ringMat
    }
    return group
  }

  // Synchronize 3D Camera Shot Gizmos in Scene with Dynamic Highlights
  useEffect(() => {
    const camerasGroup = camerasGroupRef.current
    if (!camerasGroup) return

    camerasGroup.visible = (editorMode === 'scene' || editorMode === 'animation')
    if (editorMode !== 'scene' && editorMode !== 'animation') return

    // Clean up removed camera shots
    const currentShotIds = new Set(cameraShots.map(s => s.id))
    loadedCamerasMeshMap.current.forEach((mesh, shotId) => {
      if (!currentShotIds.has(shotId)) {
        camerasGroup.remove(mesh)
        loadedCamerasMeshMap.current.delete(shotId)
      }
    })

    // Create or update camera meshes
    cameraShots.forEach(shot => {
      let camMesh = loadedCamerasMeshMap.current.get(shot.id)
      if (!camMesh) {
        camMesh = createCameraGizmoMesh(shot)
        loadedCamerasMeshMap.current.set(shot.id, camMesh)
        camerasGroup.add(camMesh)
      }

      // If user is actively dragging this camera, don't overwrite position
      const isBeingDragged = isDraggingGizmoRef.current && transformControlsRef.current?.object === camMesh
      if (!isBeingDragged) {
        camMesh.position.set(shot.position[0], shot.position[1], shot.position[2])
        // Orient camera towards target
        const targetVec = new THREE.Vector3(shot.target[0], shot.target[1], shot.target[2])
        camMesh.lookAt(targetVec)
      }

      // Dynamic Highlight: Selected vs Active Lens vs Idle
      const isSelected = selectedEntity?.type === 'camera' && selectedEntity.id === shot.id
      const isActiveView = activeCameraShotId === shot.id
      // When actively viewing through this camera, hide its gizmo mesh so the camera doesn't render inside its own body
      camMesh.visible = !isActiveView
      const { bodyMat, lensMat, coneMat, ringMat } = camMesh.userData || {}

      if (bodyMat && lensMat && coneMat && ringMat) {
        if (isSelected) {
          // Selected Camera: Glowing Vibrant Indigo
          bodyMat.color.setHex(0x28283c)
          bodyMat.emissive.setHex(0x6366f1)
          bodyMat.emissiveIntensity = 0.5

          lensMat.color.setHex(0x818cf8)
          lensMat.emissive.setHex(0x4f46e5)
          lensMat.emissiveIntensity = 0.8

          coneMat.color.setHex(0x818cf8)
          coneMat.opacity = 0.95

          ringMat.color.setHex(0x818cf8)
          ringMat.visible = true
        } else if (isActiveView) {
          // Active Scene Viewport Camera: Emerald Green
          bodyMat.color.setHex(0x182620)
          bodyMat.emissive.setHex(0x10b981)
          bodyMat.emissiveIntensity = 0.35

          lensMat.color.setHex(0x34d399)
          lensMat.emissive.setHex(0x059669)
          lensMat.emissiveIntensity = 0.6

          coneMat.color.setHex(0x34d399)
          coneMat.opacity = 0.75

          ringMat.color.setHex(0x34d399)
          ringMat.visible = true
        } else {
          // Idle Camera: Clean, muted slate
          bodyMat.color.setHex(0x1e1e24)
          bodyMat.emissive.setHex(0x000000)
          bodyMat.emissiveIntensity = 0

          lensMat.color.setHex(0x3b82f6)
          lensMat.emissive.setHex(0x000000)
          lensMat.emissiveIntensity = 0

          coneMat.color.setHex(0x64748b)
          coneMat.opacity = 0.3

          ringMat.visible = false
        }
      }
    })
  }, [cameraShots, selectedEntity, activeCameraShotId, editorMode])

  // Attach Transform Gizmo and Selection Bounding Box to Selected Entity
  const updateSelectionGizmo = useCallback(() => {
    const scene = sceneRef.current
    const transformControls = transformControlsRef.current
    if (!scene || !transformControls) return

    // In Character Editor mode, scene transform gizmos are not used (single character inspection)
    if (editorMode === 'character') {
      transformControls.detach()
      if (selectionBoxHelperRef.current) {
        scene.remove(selectionBoxHelperRef.current)
        selectionBoxHelperRef.current.dispose?.()
        selectionBoxHelperRef.current = null
      }
      return
    }

    // CRITICAL: If the user is actively dragging the gizmo, never detach or re-attach mid-drag!
    if (isDraggingGizmoRef.current) return

    // Clean up old selection box helper
    if (selectionBoxHelperRef.current) {
      scene.remove(selectionBoxHelperRef.current)
      selectionBoxHelperRef.current.dispose?.()
      selectionBoxHelperRef.current = null
    }

    let targetObject: THREE.Object3D | null = null
    let isLocked = false
    let isVisible = true

    if (selectedEntity?.type === 'character') {
      const char = sceneCharacters.find(c => c.id === selectedEntity.id || c.characterId === selectedEntity.id)
      const targetId = char ? char.id : selectedEntity.id
      const entry = loadedCharactersMap.current.get(targetId)
      if (entry && char) {
        targetObject = entry.group
        isLocked = char.locked
        isVisible = char.visible
      }
    } else if (selectedEntity?.type === 'prop') {
      const propId = selectedEntity.id
      const prop = sceneProps.find(p => p.id === propId)
      const meshGroup = loadedPropsMeshMap.current.get(propId)
      if (meshGroup && prop) {
        targetObject = meshGroup
        isLocked = prop.locked
        isVisible = prop.visible
      }
    } else if (selectedEntity?.type === 'camera') {
      const camMesh = loadedCamerasMeshMap.current.get(selectedEntity.id)
      if (camMesh) {
        targetObject = camMesh
        isLocked = false
        isVisible = true
      }
    } else if (!selectedEntity && selectedPropId) {
      const prop = sceneProps.find(p => p.id === selectedPropId)
      const meshGroup = loadedPropsMeshMap.current.get(selectedPropId)
      if (meshGroup && prop) {
        targetObject = meshGroup
        isLocked = prop.locked
        isVisible = prop.visible
      }
    }

    if (targetObject && isVisible) {
      // Create visual highlight outline box (unified violet #8C7BFF)
      const boxColor = selectedEntity?.type === 'character' 
        ? 0x8c7bff 
        : (selectedEntity?.type === 'camera' ? 0x6366f1 : 0x8c7bff)
      const boxHelper = new THREE.BoxHelper(targetObject, boxColor)
      ;(boxHelper.material as THREE.LineBasicMaterial).depthTest = false
      ;(boxHelper.material as THREE.LineBasicMaterial).transparent = true
      ;(boxHelper.material as THREE.LineBasicMaterial).opacity = 0.85

      // Enforce that bounding box measures strictly visible geometry, completely ignoring oversized planes
      const updateBoxVertices = () => {
        if (!targetObject) return
        const visibleBox = new THREE.Box3()
        targetObject.updateMatrixWorld(true)
        targetObject.traverse((node: any) => {
          if (node.isMesh && node.visible && node.geometry) {
            const mat = Array.isArray(node.material) ? node.material[0] : node.material
            if (mat && mat.transparent && mat.opacity !== undefined && mat.opacity < 0.05) return
            const nodeName = (node.name || '').toLowerCase()
            if (nodeName.includes('collision') || nodeName.includes('dummy') || nodeName.includes('hitbox')) return
            node.geometry.computeBoundingBox()
            if (node.geometry.boundingBox) {
              const meshBox = node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld)
              if (!meshBox.isEmpty() && Number.isFinite(meshBox.min.x)) {
                visibleBox.union(meshBox)
              }
            }
          }
        })

        if (!visibleBox.isEmpty() && Number.isFinite(visibleBox.min.x)) {
          const min = visibleBox.min
          const max = visibleBox.max
          const position = boxHelper.geometry.attributes.position
          if (position) {
            const array = position.array as Float32Array
            array[0] = max.x; array[1] = max.y; array[2] = max.z
            array[3] = min.x; array[4] = max.y; array[5] = max.z
            array[6] = min.x; array[7] = min.y; array[8] = max.z
            array[9] = max.x; array[10] = min.y; array[11] = max.z
            array[12] = max.x; array[13] = max.y; array[14] = min.z
            array[15] = min.x; array[16] = max.y; array[17] = min.z
            array[18] = min.x; array[19] = min.y; array[20] = min.z
            array[21] = max.x; array[22] = min.y; array[23] = min.z
            position.needsUpdate = true
            boxHelper.geometry.computeBoundingSphere()
          }
        }
      }

      boxHelper.update = updateBoxVertices
      updateBoxVertices()

      scene.add(boxHelper)
      selectionBoxHelperRef.current = boxHelper

      // Attach TransformControls only if not locked and not already attached to this target
      if (!isLocked) {
        if (transformControls.object !== targetObject) {
          transformControls.attach(targetObject)
        }
      } else {
        if (transformControls.object) {
          transformControls.detach()
        }
      }
    } else {
      if (transformControls.object) {
        transformControls.detach()
      }
    }
  }, [selectedEntity, selectedPropId, sceneCharacters, sceneProps, cameraShots, editorMode])

  const updateSelectionGizmoRef = useRef(updateSelectionGizmo)
  updateSelectionGizmoRef.current = updateSelectionGizmo

  useEffect(() => {
    updateSelectionGizmo()
  }, [updateSelectionGizmo])

  // Selection tracking - deliberate framing available via Fit [F] button
  useEffect(() => {
    // Camera selection should never unexpectedly hijack or pitch the main viewport down
  }, [selectedEntity])

  // Studio Lighting Updates
  useEffect(() => {
    const lighting = effectiveAvatarState?.lighting
    if (!lighting) return
    if (keyLightRef.current && lighting.keyLightIntensity !== undefined) keyLightRef.current.intensity = lighting.keyLightIntensity
    if (ambientLightRef.current && lighting.ambientIntensity !== undefined) ambientLightRef.current.intensity = lighting.ambientIntensity
    if (fillLightRef.current && lighting.fillLightIntensity !== undefined) fillLightRef.current.intensity = lighting.fillLightIntensity
    if (rimLightRef.current && lighting.rimLightIntensity !== undefined) {
      rimLightRef.current.intensity = lighting.rimLightIntensity
      if (lighting.rimLightColor) {
        rimLightRef.current.color.set(lighting.rimLightColor)
      }
    }
  }, [effectiveAvatarState?.lighting])

  // Camera FOV, Studio Exposure, Shadows
  useEffect(() => {
    if (cameraRef.current && effectiveAvatarState.studio?.fov) {
      cameraRef.current.fov = effectiveAvatarState.studio.fov
      cameraRef.current.updateProjectionMatrix()
    }
    if (rendererRef.current && effectiveAvatarState.studio?.exposure) {
      rendererRef.current.toneMappingExposure = effectiveAvatarState.studio.exposure
    }
    if (shadowGroundRef.current && effectiveAvatarState.studio) {
      shadowGroundRef.current.visible = effectiveAvatarState.studio.showFloorShadow ?? true
      if ((shadowGroundRef.current.material as THREE.ShadowMaterial).opacity !== undefined) {
        (shadowGroundRef.current.material as THREE.ShadowMaterial).opacity = effectiveAvatarState.studio.shadowOpacity ?? 0.28
      }
    }
  }, [effectiveAvatarState.studio])

  // Grid Helper visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      const isGridOn = effectiveAvatarState.studio?.showGrid !== undefined ? effectiveAvatarState.studio.showGrid : showGrid
      const isChroma = effectiveAvatarState.backdrop === 'chroma' || effectiveAvatarState.studio?.backdropPreset === 'chroma'
      gridHelperRef.current.visible = isGridOn && !isChroma
    }
  }, [showGrid, effectiveAvatarState.studio?.showGrid, effectiveAvatarState.backdrop, effectiveAvatarState.studio?.backdropPreset])

  // Auto rotate toggle
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating
      controlsRef.current.autoRotateSpeed = 1.8
    }
  }, [isAutoRotating])

  // Backdrop styling helper
  const getBackdropStyle = (): React.CSSProperties => {
    const preset = effectiveAvatarState.studio?.backdropPreset || effectiveAvatarState.backdrop || 'dark'
    const customColor = effectiveAvatarState.studio?.customBackdropColor

    if (preset === 'custom' && customColor) {
      return { backgroundColor: customColor }
    }
    return {}
  }

  const getBackdropClass = () => {
    if (editorMode === 'character') {
      const preset = effectiveAvatarState.studio?.backdropPreset || effectiveAvatarState.backdrop
      if (!preset || preset === 'dark') {
        return 'bg-[#16121E]'
      }
    }

    const preset = effectiveAvatarState.studio?.backdropPreset || effectiveAvatarState.backdrop || 'dark'

    switch (preset) {
      case 'dark':
        return 'bg-gradient-to-b from-[#14141A] via-[#0A0A0E] to-[#050507]'
      case 'slate':
        return 'bg-gradient-to-b from-[#2B2D42] via-[#1E202E] to-[#12131C]'
      case 'white':
        return 'bg-gradient-to-b from-[#F1F5F9] via-[#CBD5E1] to-[#94A3B8]'
      case 'sakura':
        return 'bg-gradient-to-b from-[#3D142E] via-[#240D1C] to-[#12060E]'
      case 'cyber':
        return 'bg-gradient-to-b from-[#08203E] via-[#0A1128] to-[#000411]'
      case 'sunset':
        return 'bg-gradient-to-b from-[#591C2B] via-[#2B101E] to-[#0F050A]'
      case 'skyClouds':
        return 'bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] to-[#BAE6FD]'
      case 'animeRoom':
        return 'bg-gradient-to-b from-[#1E1B4B] via-[#111827] to-[#030712]'
      case 'fantasyForest':
        return 'bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#02140F]'
      case 'neonCity':
        return 'bg-gradient-to-b from-[#4C0519] via-[#1E1035] to-[#050515]'
      case 'chroma':
        return 'bg-[#00FF00]'
      case 'transparent':
        return 'bg-[radial-gradient(#2D2D35_1px,transparent_1px)] [background-size:16px_16px] bg-[#0A0A0C]'
      case 'custom':
        return ''
      default:
        return 'bg-[#0A0A0C]'
    }
  }

  const selectedTargetName = selectedEntity?.type === 'character'
    ? sceneCharacters.find(c => c.id === selectedEntity.id)?.name || 'Character'
    : (selectedEntity?.type === 'camera'
      ? cameraShots.find(s => s.id === selectedEntity.id)?.name || 'Camera Shot'
      : (sceneProps.find(p => p.id === (selectedEntity?.id || selectedPropId))?.name || 'Prop'))

  // Keep pipActiveShotRef synced with active selection or active shot (strictly in non-character mode)
  const activePipShot = editorMode !== 'character' ? ((selectedEntity?.type === 'camera' 
    ? cameraShots.find(s => s.id === selectedEntity.id) 
    : (activeCameraShotId ? cameraShots.find(s => s.id === activeCameraShotId) : (cameraShots[0] || null))) || null) : null
  
  useEffect(() => {
    pipActiveShotRef.current = isPipOpen ? activePipShot : null
  }, [activePipShot, isPipOpen])

  const [isDragOverViewport, setIsDragOverViewport] = useState(false)

  const handleViewportDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOverViewport(false)

    let worldPos: [number, number, number] = [0, 0, 0]
    if (containerRef.current && cameraRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycasterRef.current.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current)
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const targetPoint = new THREE.Vector3()
      if (raycasterRef.current.ray.intersectPlane(groundPlane, targetPoint)) {
        // Clamp dropped coordinate strictly within safe studio bounds [-25, 25] near origin
        const clampedX = Math.max(-25, Math.min(25, targetPoint.x))
        const clampedZ = Math.max(-25, Math.min(25, targetPoint.z))
        worldPos = [Number(clampedX.toFixed(2)), 0, Number(clampedZ.toFixed(2))]
      } else {
        worldPos = [0, 0, 0]
      }
    }

    const charData = getDragData(e, VOOM_DRAG_TYPES.CHARACTER)
    if (charData) {
      onDropAsset?.(VOOM_DRAG_TYPES.CHARACTER, charData, worldPos)
      return
    }

    const propData = getDragData(e, VOOM_DRAG_TYPES.PROP)
    if (propData) {
      onDropAsset?.(VOOM_DRAG_TYPES.PROP, propData, worldPos)
      return
    }

    const animData = getDragData(e, VOOM_DRAG_TYPES.ANIMATION)
    if (animData) {
      onDropAsset?.(VOOM_DRAG_TYPES.ANIMATION, animData, worldPos)
      return
    }

    const poseData = getDragData(e, VOOM_DRAG_TYPES.POSE)
    if (poseData) {
      onDropAsset?.(VOOM_DRAG_TYPES.POSE, poseData, worldPos)
      return
    }

    const camData = getDragData(e, VOOM_DRAG_TYPES.CAMERA)
    if (camData) {
      onDropAsset?.(VOOM_DRAG_TYPES.CAMERA, camData, worldPos)
      return
    }

    const lightData = getDragData(e, VOOM_DRAG_TYPES.LIGHT)
    if (lightData) {
      onDropAsset?.(VOOM_DRAG_TYPES.LIGHT, lightData, worldPos)
      return
    }
  }

  return (
    <div 
      ref={containerRef} 
      style={getBackdropStyle()}
      onDragOver={e => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setIsDragOverViewport(true)
      }}
      onDragLeave={e => {
        if (e.currentTarget === e.target) {
          setIsDragOverViewport(false)
        }
      }}
      onDrop={handleViewportDrop}
      className={`relative w-full h-full select-none overflow-hidden transition-all duration-300 ${getBackdropClass()}`}
    >
      {/* Visual Drop Target Highlight */}
      {isDragOverViewport && (
        <div className="absolute inset-0 z-30 pointer-events-none bg-[#10B981]/10 border-2 border-dashed border-[#10B981] flex items-center justify-center animate-pulse">
          <div className="px-4 py-2 rounded-xl bg-[#12121A]/90 border border-[#10B981] text-white text-xs font-bold shadow-2xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <span>Drop Asset to Place in 3D Scene</span>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Manga Composition Grid Overlay */}
      {showRuleOfThirds && (
        <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-white/10">
          <div className="border-r border-b border-white/15" />
          <div className="border-r border-b border-white/15" />
          <div className="border-b border-white/15" />
          <div className="border-r border-b border-white/15" />
          <div className="border-r border-b border-white/15" />
          <div className="border-b border-white/15" />
          <div className="border-r border-b border-white/15" />
          <div className="border-r border-b border-white/15" />
          <div />
        </div>
      )}

      {/* Empty State / Upload Prompt Overlay when no VRM is loaded */}
      {!vrm && sceneCharacters.length === 0 && !isLoadingVRM && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col items-center text-center max-w-md p-8 rounded-2xl bg-[#121217] border border-[#2D2D35] shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#D32F2F]/20 border border-[#D32F2F]/40 flex items-center justify-center text-[#D32F2F] mb-4 shadow-lg">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>
            
            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">
              Upload Your <span className="text-[#D32F2F]">.VRM</span> Avatar
            </h2>
            
            <p className="text-xs text-[#A0A0B0] leading-relaxed mb-6">
              Drag & drop your real <span className="text-white font-bold">.VRM 0.0 / 1.0</span> or <span className="text-white font-bold">.GLB</span> character file or choose a preset from the left library.
            </p>

            <button
              onClick={onUploadClick}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Select .VRM / .GLB File</span>
            </button>
            
            <div className="mt-4 text-[10px] text-[#707080] font-mono">
              Supports VRoid Studio, Booth, Blender VRM • Up to 250MB
            </div>
          </div>
        </div>
      )}

      {/* Loading Progress Bar Overlay */}
      {isLoadingVRM && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="flex flex-col items-center max-w-xs w-full p-6 rounded-xl bg-[#121217] border border-[#2D2D35] shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-[#D32F2F]/20 border border-[#D32F2F]/40 flex items-center justify-center text-[#D32F2F] mb-4 animate-spin">
              <RotateCw className="w-6 h-6" />
            </div>
            
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">
              Loading Character...
            </h3>
            <p className="text-xs text-[#80808F] mb-4 text-center">
              Parsing meshes, skeleton bones & textures
            </p>

            <div className="w-full h-2 rounded-full bg-[#1E1E24] overflow-hidden border border-[#2D2D35]">
              <div 
                className="h-full bg-[#D32F2F] transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(15, loadingProgress)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no character is loaded in Character Mode */}
      {editorMode === 'character' && !vrm && !isLoadingVRM && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-6 text-center">
          <div className="p-6 rounded-2xl bg-[#16121E]/85 backdrop-blur-md border border-[#2E2548] max-w-sm flex flex-col items-center pointer-events-auto shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#28203F] border border-[#3E325E] flex items-center justify-center text-[#EC4899] mb-3">
              <User className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No Character Selected</h4>
            <p className="text-xs text-[#8A81A6] mb-4 leading-relaxed">
              Choose a character from the library or upload a VRM avatar to customize and pose in 3D.
            </p>
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#A855F7] hover:from-[#F43F5E] hover:to-[#9333EA] text-white text-xs font-bold shadow-lg shadow-[#EC4899]/20 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload VRM File</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Backdrop to dismiss dropdowns when clicking outside */}
      {(showAngleDropdown || isShotsPopoverOpen) && (
        <div 
          className="absolute inset-0 z-15"
          onClick={() => {
            setShowAngleDropdown(false)
            setIsShotsPopoverOpen(false)
          }}
        />
      )}

      {/* Corner Framing Guides (Image 1 Viewfinder Brackets) */}
      {!hideOverlays && (
        <div className="pointer-events-none absolute inset-5 z-10 flex flex-col justify-between">
          <div className="flex justify-between w-full">
            <svg className="w-5 h-5 text-[#EC4899]/70 filter drop-shadow-[0_0_4px_rgba(236,72,153,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 10V4h6" />
            </svg>
            <svg className="w-5 h-5 text-[#EC4899]/70 filter drop-shadow-[0_0_4px_rgba(236,72,153,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 10V4h-6" />
            </svg>
          </div>
          <div className="flex justify-between w-full">
            <svg className="w-5 h-5 text-[#EC4899]/70 filter drop-shadow-[0_0_4px_rgba(236,72,153,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 14v6h6" />
            </svg>
            <svg className="w-5 h-5 text-[#EC4899]/70 filter drop-shadow-[0_0_4px_rgba(236,72,153,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 14v6h-6" />
            </svg>
          </div>
        </div>
      )}

      {/* Viewport Top Header */}
      {!hideOverlays && (
      <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
        {editorMode === 'character' ? (
          <>
            {/* Left Section: Remove from Viewport */}
            <div className="pointer-events-auto">
              {onToggleActiveCharacterViewport && (
                <button
                  onClick={onToggleActiveCharacterViewport}
                  title={isCharacterViewportHidden ? "Show character in viewport" : "Remove character from current viewport"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xl transition-all cursor-pointer ${
                    isCharacterViewportHidden
                      ? 'bg-[#EAB308]/20 text-[#EAB308] border-[#EAB308]/40 hover:bg-[#EAB308]/30'
                      : 'bg-[#1F1930]/90 border-[#2E2548] text-[#D0D0E0] hover:text-white hover:bg-[#271F3D]'
                  }`}
                >
                  {isCharacterViewportHidden ? <Eye className="w-3.5 h-3.5 text-[#EC4899]" /> : <EyeOff className="w-3.5 h-3.5 text-[#EC4899]" />}
                  <span>{isCharacterViewportHidden ? 'Show in Viewport' : 'Remove from Viewport'}</span>
                </button>
              )}
            </div>

            {/* Right Section: Editing: [character name] */}
            <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F1930]/90 border border-[#2E2548] text-xs font-semibold text-white shadow-xl">
              <span className={`w-2 h-2 rounded-full ${activeCharacterId ? 'bg-[#EC4899] animate-pulse' : 'bg-[#6B7280]'}`} />
              <span className="text-[#A09BB5] text-[11px]">{activeCharacterId ? 'Editing:' : 'Status:'}</span>
              <span className="truncate max-w-[180px] font-bold text-white">
                {activeCharacterId ? (activeCharacterName || 'Active Character') : 'No Character Selected'}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Left Section: Scene Outliner Toggle + View Angle Dropdown + Camera Reset + Grid */}
            <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-[#121217]/95 backdrop-blur-md border border-[#2D2D35] rounded-xl shadow-xl">
              {sceneMode && onToggleSceneTree && (
                <>
                  <button
                    onClick={onToggleSceneTree}
                    title={isSceneTreeOpen ? 'Close Scene Outliner' : 'Open Scene Outliner (Characters & Props)'}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSceneTreeOpen
                        ? 'bg-[#3B82F6] text-white shadow-md'
                        : 'text-[#A0A0B0] hover:text-white hover:bg-[#1E1E28]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Scene</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white font-mono">
                      {sceneCharacters.length + sceneProps.length}
                    </span>
                  </button>
                  <div className="w-px h-4 bg-[#2D2D35]" />
                </>
              )}

              {/* Camera View Angle Presets Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAngleDropdown(!showAngleDropdown)}
                  title="Camera View Angle Presets"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1A1A24] hover:bg-[#222230] border border-[#2D2D35] transition-all cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="capitalize">{!isViewPresetActiveRef.current ? 'Free Orbit' : activeShot === 'sideLeft' ? 'Side L' : activeShot === 'sideRight' ? 'Side R' : activeShot === 'iso' ? 'Isometric' : activeShot}</span>
                  <ChevronDown className="w-3 h-3 text-[#808090]" />
                </button>

                {showAngleDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 w-40 p-1 bg-[#121217] border border-[#2D2D35] rounded-xl shadow-2xl z-30 animate-in fade-in">
                    {[
                      { id: 'front', label: 'Front View' },
                      { id: 'face', label: 'Face Close-up' },
                      { id: 'bust', label: 'Bust Portrait' },
                      { id: 'iso', label: 'Isometric 3D' },
                      { id: 'sideLeft', label: 'Side Left' },
                      { id: 'sideRight', label: 'Side Right' },
                      { id: 'back', label: 'Back View' }
                    ].map((angle) => (
                      <button
                        key={angle.id}
                        onClick={() => {
                          setCameraShot(angle.id as any)
                          setShowAngleDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                          isViewPresetActiveRef.current && activeShot === angle.id
                            ? 'bg-[#3B82F6] text-white font-bold'
                            : 'text-[#A0A0B0] hover:text-white hover:bg-[#1E1E28]'
                        }`}
                      >
                        <span>{angle.label}</span>
                        {isViewPresetActiveRef.current && activeShot === angle.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-4 bg-[#2D2D35]" />

              {/* Quick Camera Reset icon */}
              <button
                onClick={() => {
                  setCameraShot('front')
                  onResetToDefaultCameraView?.()
                }}
                title="Reset Camera to Front View"
                className="p-1.5 rounded-lg text-[#808090] hover:text-white hover:bg-[#1E1E28] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Floor Grid Toggle icon */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                title={showGrid ? 'Hide 3D Floor Grid' : 'Show 3D Floor Grid'}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  showGrid ? 'text-[#3B82F6] bg-[#3B82F6]/15' : 'text-[#808090] hover:text-white hover:bg-[#1E1E28]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {editorMode === 'animation' && (
          <div className="pointer-events-auto relative">
            <button
              onClick={() => setIsShotsPopoverOpen(!isShotsPopoverOpen)}
              title="Toggle Camera Shots Panel"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-xl transition-all cursor-pointer ${
                isShotsPopoverOpen || activeCameraShotId
                  ? 'bg-[#E53935] border-[#E53935] text-white shadow-[#E53935]/25'
                  : 'bg-[#121217]/95 border-[#2D2D35] text-[#D0D0E0] hover:text-white hover:bg-[#1E1E28]'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-white" />
              <span>
                {activeCameraShotId 
                  ? (cameraShots.find(s => s.id === activeCameraShotId)?.name || 'Camera Shot')
                  : `Camera Shots (${cameraShots.length})`}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isShotsPopoverOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Flyout Popover for Camera Shots */}
            {isShotsPopoverOpen && (
              <div className="absolute top-full right-0 mt-2 w-84 bg-[#121217] border border-[#2D2D35] rounded-2xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {/* Header */}
                <div className="p-3 border-b border-[#22222E] flex items-center justify-between bg-[#161620]">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#E53935]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Saved Camera Shots
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                      {cameraShots.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsShotsPopoverOpen(false)}
                    className="p-1 rounded-lg text-[#808090] hover:text-white hover:bg-[#20202A] transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Shot List */}
                <div className="p-2 max-h-[320px] overflow-y-auto custom-scrollbar space-y-1">
                  {cameraShots.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#707080]">
                      No saved camera shots yet. Save your current angle below!
                    </div>
                  ) : (
                    cameraShots.map((shot) => {
                      const isActive = activeCameraShotId === shot.id
                      const isEditing = editingShotId === shot.id

                      return (
                        <div
                          key={shot.id}
                          className={`group flex items-center justify-between p-2 rounded-xl border transition-all ${
                            isActive
                              ? 'border-[#E53935] bg-[#E53935]/15 text-white shadow-sm'
                              : 'border-[#22222E] bg-[#161620] text-[#B0B0C0] hover:border-[#353545] hover:bg-[#1A1A26]'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1 pr-1">
                              <input
                                type="text"
                                value={editingShotName}
                                onChange={(e) => setEditingShotName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editingShotName.trim()) {
                                      onRenameCameraShot?.(shot.id, editingShotName.trim())
                                    }
                                    setEditingShotId(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingShotId(null)
                                  }
                                }}
                                autoFocus
                                className="w-full bg-[#0D0D12] border border-[#E53935] text-xs font-bold text-white rounded px-2 py-1 focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  if (editingShotName.trim()) {
                                    onRenameCameraShot?.(shot.id, editingShotName.trim())
                                  }
                                  setEditingShotId(null)
                                }}
                                className="p-1 text-[#00E676] hover:bg-white/10 rounded cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => onApplyCameraShot?.(shot)}
                                className="flex items-center gap-2 flex-1 text-left cursor-pointer min-w-0"
                              >
                                <Camera className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#FF5252]' : 'text-[#808090] group-hover:text-white'}`} />
                                <span className="text-xs font-bold truncate">
                                  {shot.name}
                                </span>
                                <span className="text-[10px] text-[#707080] font-mono px-1.5 py-0.5 rounded bg-black/30 shrink-0">
                                  {shot.fov}°
                                </span>
                              </button>

                              <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                                {onOverwriteCameraShot && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onOverwriteCameraShot(shot.id)
                                    }}
                                    title="Overwrite Shot with Current View"
                                    className="p-1 rounded text-[#808090] hover:text-[#FFA000] hover:bg-[#FFA000]/15 transition-all cursor-pointer"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                )}

                                {onRenameCameraShot && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingShotId(shot.id)
                                      setEditingShotName(shot.name)
                                    }}
                                    title="Rename Shot"
                                    className="p-1 rounded text-[#808090] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}

                                {onDeleteCameraShot && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDeleteCameraShot(shot.id)
                                    }}
                                    title="Delete Shot"
                                    className="p-1 rounded text-[#808090] hover:text-[#FF5252] hover:bg-[#FF5252]/15 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* New Shot Section */}
                <div className="p-2.5 border-t border-[#22222E] bg-[#14141C] space-y-2">
                  {showNewShotField ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newShotInput}
                        onChange={(e) => setNewShotInput(e.target.value)}
                        placeholder="Shot Name (e.g. Hero Close)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onSaveCurrentCameraView?.(newShotInput.trim() || undefined)
                            setNewShotInput('')
                            setShowNewShotField(false)
                          } else if (e.key === 'Escape') {
                            setShowNewShotField(false)
                          }
                        }}
                        autoFocus
                        className="flex-1 bg-[#0D0D12] border border-[#353545] focus:border-[#E53935] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          onSaveCurrentCameraView?.(newShotInput.trim() || undefined)
                          setNewShotInput('')
                          setShowNewShotField(false)
                        }}
                        className="px-2.5 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowNewShotField(false)}
                        className="p-1.5 text-[#808090] hover:text-white rounded-lg cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewShotField(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-bold shadow-md shadow-[#E53935]/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Current View as Shot</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Active Spawn Placement Target Top Bar */}
      {!hideOverlays && spawnPlacementPoint && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 bg-[#0D1527]/95 backdrop-blur-md border border-[#00E5FF]/60 rounded-full shadow-xl shadow-[#00E5FF]/15 text-white animate-in fade-in slide-in-from-top-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse shadow-sm shadow-[#00E5FF]" />
          <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Target Spawn:</span>
            <span className="font-mono text-[#00E5FF]">[{spawnPlacementPoint[0].toFixed(2)}, 0.00, {spawnPlacementPoint[2].toFixed(2)}]</span>
          </span>
          <span className="text-[10px] text-[#A0E6EE] hidden sm:inline">
            • Characters & assets spawn here
          </span>
          {onSetSpawnPlacementPoint && (
            <button
              onClick={() => onSetSpawnPlacementPoint(null)}
              title="Clear target spawn point (Esc)"
              className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Floating Bottom Viewport Controls (Image 1 Character Editor dock) */}
      {!hideOverlays && editorMode === 'character' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2 p-1.5 bg-[#1F1930]/90 backdrop-blur-md border border-[#2E2548] rounded-xl shadow-2xl">
          {/* Front Angle Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAngleDropdown(!showAngleDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#271F3D] hover:bg-[#32284F] border border-[#3E325E] transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#EC4899]" />
              <span className="capitalize">{activeShot === 'sideLeft' ? 'Side L' : activeShot === 'sideRight' ? 'Side R' : activeShot}</span>
              <ChevronDown className="w-3 h-3 text-[#8A81A6]" />
            </button>

            {showAngleDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-40 p-1 bg-[#1A1429] border border-[#3E325E] rounded-xl shadow-2xl z-30 animate-in fade-in">
                {[
                  { id: 'front', label: 'Front' },
                  { id: 'face', label: 'Face' },
                  { id: 'bust', label: 'Bust' },
                  { id: 'sideLeft', label: 'Side L' },
                  { id: 'sideRight', label: 'Side R' },
                  { id: 'back', label: 'Back' },
                  { id: 'top', label: 'Top' },
                  { id: 'iso', label: 'Isometric' }
                ].map(angle => (
                  <button
                    key={angle.id}
                    onClick={() => {
                      setCameraShot(angle.id as any)
                      setShowAngleDropdown(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      activeShot === angle.id
                        ? 'bg-[#271F3D] text-[#EC4899] font-bold'
                        : 'text-[#A09BB5] hover:text-white hover:bg-[#201A30]'
                    }`}
                  >
                    <span>{angle.label}</span>
                    {activeShot === angle.id && <Check className="w-3.5 h-3.5 text-[#EC4899]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-[#2E2548]" />

          {/* Reset View Button */}
          <button
            onClick={() => {
              setCameraShot('front')
              onResetToDefaultCameraView?.()
            }}
            title="Reset View"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#A09BB5] hover:text-white hover:bg-[#271F3D] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>Reset View</span>
          </button>

          <div className="w-px h-4 bg-[#2E2548]" />

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title={showGrid ? 'Hide 3D Floor Grid' : 'Show 3D Floor Grid'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              showGrid ? 'text-[#EC4899] bg-[#271F3D] border border-[#EC4899]/30' : 'text-[#8A81A6] hover:text-white hover:bg-[#271F3D]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          <div className="w-px h-4 bg-[#2E2548]" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#271F3D] text-[#A09BB5] hover:text-white hover:bg-[#32284F] border border-[#3E325E] transition-all cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-[#A09BB5] w-10 text-center select-none font-semibold">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#271F3D] text-[#A09BB5] hover:text-white hover:bg-[#32284F] border border-[#3E325E] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating 3D Transform Gizmo Dock (Bottom-Center - Only visible when an entity is selected in Scene Mode) */}
      {editorMode !== 'character' && sceneMode && selectedEntity && !hideInternalGizmoDock && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-[#121217]/95 backdrop-blur-md border border-[#2D2D35] rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => onGizmoModeChange?.('translate')}
            title="Translate / Move [W]"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              gizmoMode === 'translate'
                ? 'bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30'
                : 'text-[#A0A0B0] hover:text-white hover:bg-[#1E1E28]'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>

          <button
            onClick={() => onGizmoModeChange?.('rotate')}
            title="Rotate [E]"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              gizmoMode === 'rotate'
                ? 'bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30'
                : 'text-[#A0A0B0] hover:text-white hover:bg-[#1E1E28]'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </button>

          <button
            onClick={() => onGizmoModeChange?.('scale')}
            title="Scale [R]"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              gizmoMode === 'scale'
                ? 'bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30'
                : 'text-[#A0A0B0] hover:text-white hover:bg-[#1E1E28]'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Scale</span>
          </button>

          <div className="w-px h-4 bg-[#2D2D35] mx-0.5" />

          <button
            onClick={() => onGizmoSpaceChange?.(gizmoSpace === 'world' ? 'local' : 'world')}
            title={`Coordinate Space: ${gizmoSpace} [Q]`}
            className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold text-[#A0A0B0] hover:text-white hover:bg-[#1E1E28] transition-all cursor-pointer capitalize"
          >
            <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>{gizmoSpace}</span>
          </button>

          <div className="w-px h-4 bg-[#2D2D35] mx-0.5" />

          <button
            onClick={() => {
              if (transformControlsRef.current?.object) {
                focusObject(transformControlsRef.current.object)
              }
            }}
            title="Focus Camera on Selected Entity [F]"
            className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold text-[#FFA000] hover:bg-[#FFA000]/20 transition-all cursor-pointer"
          >
            <Focus className="w-3.5 h-3.5" />
            <span>Focus</span>
          </button>

          <div className="w-px h-4 bg-[#2D2D35] mx-0.5" />

          {/* Selected Object Name & Deselect button */}
          <div className="flex items-center gap-1.5 pl-1">
            {selectedEntity?.type === 'character' ? (
              <User className="w-3.5 h-3.5 text-[#EF5350]" />
            ) : selectedEntity?.type === 'camera' ? (
              <Camera className="w-3.5 h-3.5 text-[#818CF8]" />
            ) : (
              <Box className="w-3.5 h-3.5 text-[#3B82F6]" />
            )}
            <span className="font-bold text-white text-xs max-w-[120px] truncate">
              {selectedTargetName}
            </span>
            <button
              onClick={() => {
                onSelectEntity?.(null as any)
                onSelectProp?.(null)
              }}
              title="Deselect (Esc)"
              className="p-1 rounded-lg text-[#808090] hover:text-white hover:bg-[#20202A] transition-all cursor-pointer ml-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Picture-in-Picture (PiP) Real-Time Camera Shot Viewfinder (Available in Scene and Animation Modes) */}
      {!hideOverlays && editorMode !== 'character' && activePipShot && isPipOpen && (
        <div 
          style={{ width: isPipMinimized ? 230 : pipWidth }}
          className="absolute bottom-14 right-3 z-25 pointer-events-auto flex flex-col rounded-xl overflow-hidden border border-[#38BDF8]/40 bg-[#121218]/95 shadow-2xl backdrop-blur-md transition-[width] duration-75 select-none"
        >
          {/* Resize Handle at Top-Left Corner (Draggable) */}
          {!isPipMinimized && (
            <div
              onMouseDown={handlePipResizeMouseDown}
              title="Drag to resize camera preview window"
              className="absolute top-0 left-0 w-4 h-4 z-30 cursor-nwse-resize flex items-center justify-center opacity-70 hover:opacity-100 group"
            >
              <div className="w-2 h-2 border-t-2 border-l-2 border-[#38BDF8] rounded-tl group-hover:border-white transition-colors" />
            </div>
          )}

          {/* PiP Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#181824] border-b border-[#2D2D3E] pl-3.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <Camera className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span className="text-[11px] font-bold text-white truncate max-w-[105px]" title={activePipShot.name}>
                {activePipShot.name}
              </span>
              <span className="text-[9px] font-mono text-[#7DD3FC] bg-[#0284C7]/25 px-1 py-0.2 rounded shrink-0">
                {activePipShot.fov}°
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Look Through Viewport Button */}
              <button
                type="button"
                onClick={() => onApplyCameraShot?.(activePipShot)}
                title="Align main 3D viewport to this camera's angle"
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#242436] text-[#A0A0C0] hover:text-white hover:bg-[#34344E] transition-all cursor-pointer"
              >
                View
              </button>

              {/* Minimize / Expand Toggle */}
              <button
                type="button"
                onClick={() => setIsPipMinimized(prev => !prev)}
                title={isPipMinimized ? 'Expand preview window' : 'Minimize preview window'}
                className="p-1 rounded text-[#8080A0] hover:text-white hover:bg-[#28283C] transition-all cursor-pointer"
              >
                {isPipMinimized ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </button>

              {/* Maximize / Restore Toggle (when not minimized) */}
              {!isPipMinimized && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isPipMaximized) {
                      pipPreMaximizedWidthRef.current = pipWidth
                      setIsPipMaximized(true)
                      setPipWidth(480)
                    } else {
                      setIsPipMaximized(false)
                      setPipWidth(pipPreMaximizedWidthRef.current || 260)
                    }
                  }}
                  title={isPipMaximized ? 'Restore normal preview size' : 'Maximize preview window'}
                  className="p-1 rounded text-[#8080A0] hover:text-white hover:bg-[#28283C] transition-all cursor-pointer"
                >
                  {isPipMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsPipOpen(false)}
                title="Close camera preview window"
                className="p-1 rounded text-[#8080A0] hover:text-white hover:bg-[#28283C] transition-all cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Viewport placeholder height matches 16:9 aspect ratio rendered by WebGL scissor */}
          {!isPipMinimized && (
            <div 
              ref={pipPreviewRef}
              style={{ 
                width: pipWidth, 
                height: Math.round((pipWidth * 9) / 16)
              }}
              className="relative pointer-events-none flex flex-col justify-between p-2 bg-transparent"
            >
              {/* Corner guide brackets */}
              <div className="flex justify-between w-full opacity-60">
                <span className="text-[9px] font-mono text-cyan-300/80 leading-none">┌</span>
                <span className="text-[9px] font-mono text-cyan-300/80 leading-none">┐</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[9px] font-medium tracking-wider text-white/70 uppercase bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                  LIVE CAMERA VIEW {isPipMaximized ? '• EXPANDED' : ''}
                </span>
              </div>
              <div className="flex justify-between w-full opacity-60">
                <span className="text-[9px] font-mono text-cyan-300/80 leading-none">└</span>
                <span className="text-[9px] font-mono text-cyan-300/80 leading-none">┘</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Viewport Display Toggles (Bottom Right) */}
      {!hideOverlays && (
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 p-1 bg-[#121217]/90 backdrop-blur-md border border-[#2D2D35] rounded-xl shadow-xl">
        {editorMode !== 'character' && activePipShot && !isPipOpen && (
          <button
            onClick={() => {
              setIsPipOpen(true)
              setIsPipMinimized(false)
            }}
            title="Open Live Camera Preview Window"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-[#38BDF8] hover:bg-[#38BDF8]/20 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cam View</span>
          </button>
        )}
        <button
          onClick={() => setShowGrid(!showGrid)}
          title={showGrid ? 'Hide Floor Grid' : 'Show Floor Grid'}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            showGrid ? 'text-white bg-[#D32F2F]' : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowRuleOfThirds(!showRuleOfThirds)}
          title={showRuleOfThirds ? 'Hide Manga Composition Grid' : 'Show Manga Composition Grid'}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            showRuleOfThirds ? 'text-white bg-[#D32F2F]' : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          title={isAutoRotating ? 'Stop Turntable' : 'Start Turntable Rotation'}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isAutoRotating ? 'text-white bg-[#D32F2F]' : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
      )}

      {/* Hidden Character Notice in Character Mode */}
      {editorMode === 'character' && isCharacterViewportHidden && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/45 backdrop-blur-xs p-6 text-center pointer-events-auto">
          <div className="p-6 rounded-2xl bg-[#14141C]/95 border border-[#2B2B3C] shadow-2xl max-w-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-[#EAB308]/15 border border-[#EAB308]/30 flex items-center justify-center text-[#EAB308] mb-3">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Character Removed from Viewport</h3>
            <p className="text-xs text-[#9E9EB0] mb-5 leading-relaxed">
              <span className="font-semibold text-white">{activeCharacterName || 'This character'}</span> is still stored in your Character Library.
            </p>
            {onToggleActiveCharacterViewport && (
              <button
                onClick={onToggleActiveCharacterViewport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E676] hover:bg-[#00C853] text-[#0A0A0C] text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#00E676]/20"
              >
                <Eye className="w-4 h-4" />
                <span>Show in Viewport</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
