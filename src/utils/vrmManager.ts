import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { VRMLoaderPlugin, VRMUtils, VRM } from '@pixiv/three-vrm'
import { ANIMATIONS_MANIFEST } from './animationManifest'

export interface VRMAvatarMeta {
  title: string
  author: string
  version: string
  contactInformation: string
  reference: string
  allowedUserName: string
  commercialUsageName: string
  licenseName: string
  vrmVersion: '0.0' | '1.0' | 'unknown' | 'custom' | 'procedural'
  thumbnailUrl?: string
  triangleCount?: number
  meshCount?: number
  boneCount?: number
  materialCount?: number
}

export interface CharacterProportions {
  height: number // 0.8 to 1.25
  headScale: number // 0.8 to 1.3
  shoulderWidth: number // 0.8 to 1.3
  chestScale: number // 0.8 to 1.3
  waistScale: number // 0.75 to 1.25
  hipScale: number // 0.8 to 1.35
  armLength: number // 0.8 to 1.25
  legLength: number // 0.8 to 1.25
}

export interface CharacterMaterials {
  shadingMode: 'toon' | 'matte' | 'glossy' | 'pbr'
  skinTone: string
  skinTint?: string
  outfitTint: string
  hairColor: string
  hairHighlight: string
  hairRoughness: number
  hairMetalness: number
  doubleSidedOpaque: boolean
  outfitStyle?: 'default' | 'uniform' | 'mage' | 'cyber' | 'idol' | 'casual'
  hairStyle?: 'default' | 'ponytail' | 'twintail' | 'bob' | 'long' | 'spiky'
}

export interface CharacterPhysicsSettings {
  enabled: boolean // OFF by default
  stiffness: number // 0 to 1
  drag: number // 0 to 1
  gravity: number // -10 to 0
  windEnabled: boolean // OFF by default
  windStrength: number // 0
  windDirection: [number, number, number]
}

export interface StudioSettings {
  backdropType: 'preset' | 'gradient' | 'scene' | 'solid'
  backdropPreset: 'dark' | 'slate' | 'white' | 'sakura' | 'cyber' | 'chroma' | 'transparent' | 'sunset' | 'animeRoom' | 'skyClouds' | 'fantasyForest' | 'neonCity'
  customBackdropColor: string
  lightingPreset: 'softStudio' | 'dramaticRim' | 'sunset' | 'daylight' | 'cyberNeon' | 'mangaHighKey' | 'custom'
  fov: number // 20 to 80, default 32
  showGrid: boolean
  showFloorShadow: boolean
  shadowOpacity: number // 0 to 1
  exposure: number // 0.5 to 2.0
}

export interface VRMAvatarState {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: number
  meta: VRMAvatarMeta
  
  // Proportions (Stable, manual only)
  proportions: CharacterProportions

  // Facial expressions & morph targets
  expressions: Record<string, number>

  // Materials & Shading
  materials: CharacterMaterials

  // Bone rotations in degrees [x, y, z]
  boneRotations: Record<string, [number, number, number]>
  activePosePreset: string

  // Physics (OFF by default for absolute stability)
  physics: CharacterPhysicsSettings

  // Automations (OFF by default)
  autoBreathing: boolean
  autoBlink: boolean
  autoLipSync: boolean
  eyeTracking: boolean

  // Studio Lighting
  lighting: {
    keyLightIntensity: number
    fillLightIntensity: number
    ambientIntensity: number
    rimLightIntensity: number
    rimLightColor: string
  }

  // Backdrop
  backdrop: 'dark' | 'slate' | 'white' | 'sakura' | 'cyber' | 'chroma' | 'transparent' | 'sunset' | 'animeRoom' | 'skyClouds' | 'fantasyForest' | 'neonCity' | 'custom'

  // Expanded Studio Options
  studio?: StudioSettings

  // Compatibility fields
  templateType?: string
  wind?: { speed?: number; direction?: number }
  keyLightIntensity?: number
  ambientIntensity?: number
  rimLightIntensity?: number
  rimLightColor?: string
  springBonePhysics?: boolean
  windStrength?: number
  windDirection?: [number, number, number]
}

export interface SavedCharacterRecord {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  thumbnail?: string
  vrmStorageKey?: string
  isDefaultTemplate?: boolean
  templateType?: string
  state: VRMAvatarState
}

export const DEFAULT_PROPORTIONS: CharacterProportions = {
  height: 1.0,
  headScale: 1.0,
  shoulderWidth: 1.0,
  chestScale: 1.0,
  waistScale: 1.0,
  hipScale: 1.0,
  armLength: 1.0,
  legLength: 1.0
}

export const DEFAULT_MATERIALS: CharacterMaterials = {
  shadingMode: 'toon',
  skinTone: '#FBD3BD',
  outfitTint: '#FFFFFF',
  hairColor: '#4A2810',
  hairHighlight: '#C68852',
  hairRoughness: 0.6,
  hairMetalness: 0.1,
  doubleSidedOpaque: false,
  outfitStyle: 'default',
  hairStyle: 'default'
}

export const DEFAULT_PHYSICS: CharacterPhysicsSettings = {
  enabled: false, // STABLE & FROZEN AT REST BY DEFAULT
  stiffness: 0.5,
  drag: 0.7,
  gravity: -9.8,
  windEnabled: false,
  windStrength: 0,
  windDirection: [0.5, 0.1, 0.5]
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  backdropType: 'preset',
  backdropPreset: 'dark',
  customBackdropColor: '#121218',
  lightingPreset: 'softStudio',
  fov: 32,
  showGrid: true,
  showFloorShadow: true,
  shadowOpacity: 0.28,
  exposure: 1.05
}

export const DEFAULT_AVATAR_STATE: VRMAvatarState = {
  id: 'char_default_1',
  fileName: 'Seraphina_Anime_Character.vrm',
  fileSize: 0,
  uploadedAt: Date.now(),
  meta: {
    title: 'Seraphina (Noble Anime Mage)',
    author: 'VoomToon Studio',
    version: '1.0.0',
    contactInformation: '',
    reference: '',
    allowedUserName: 'Everyone',
    commercialUsageName: 'Allowed',
    licenseName: 'VRM Standard',
    vrmVersion: '1.0'
  },
  proportions: { ...DEFAULT_PROPORTIONS },
  expressions: {},
  materials: { ...DEFAULT_MATERIALS },
  boneRotations: {
    leftUpperArm: [0, 0, -68],
    rightUpperArm: [0, 0, 68],
    leftLowerArm: [-10, 10, 0],
    rightLowerArm: [-10, -10, 0],
    leftHand: [-5, 0, 0],
    rightHand: [-5, 0, 0],
    spine: [2, 0, 0],
    chest: [-1, 0, 0],
    neck: [2, 0, 0],
    head: [0, 0, 0],
    leftUpperLeg: [0, 0, -2],
    rightUpperLeg: [0, 0, 2]
  },
  activePosePreset: 'naturalStand',
  physics: { ...DEFAULT_PHYSICS },
  autoBreathing: false,
  autoBlink: false,
  autoLipSync: false,
  eyeTracking: false,
  lighting: {
    keyLightIntensity: 1.2,
    fillLightIntensity: 0.6,
    ambientIntensity: 0.85,
    rimLightIntensity: 1.0,
    rimLightColor: '#FF6B8B'
  },
  backdrop: 'dark',
  studio: { ...DEFAULT_STUDIO_SETTINGS }
}

export const STANDARD_EXPRESSIONS = [
  { id: 'happy', name: 'happy', label: 'Joy / Happy', category: 'emotion', icon: 'Smile' },
  { id: 'angry', name: 'angry', label: 'Angry / Fierce', category: 'emotion', icon: 'Flame' },
  { id: 'sad', name: 'sad', label: 'Sorrow / Sad', category: 'emotion', icon: 'Frown' },
  { id: 'relaxed', name: 'relaxed', label: 'Relaxed / Peaceful', category: 'emotion', icon: 'Coffee' },
  { id: 'surprised', name: 'surprised', label: 'Surprised / Shock', category: 'emotion', icon: 'Sparkles' },
  { id: 'blink', name: 'blink', label: 'Blink Both', category: 'eye', icon: 'Eye' },
  { id: 'blinkLeft', name: 'blinkLeft', label: 'Blink Left (Wink)', category: 'eye', icon: 'Eye' },
  { id: 'blinkRight', name: 'blinkRight', label: 'Blink Right (Wink)', category: 'eye', icon: 'Eye' },
  { id: 'lookUp', name: 'lookUp', label: 'Look Up', category: 'eye', icon: 'Eye' },
  { id: 'lookDown', name: 'lookDown', label: 'Look Down', category: 'eye', icon: 'Eye' },
  { id: 'lookLeft', name: 'lookLeft', label: 'Look Left', category: 'eye', icon: 'Eye' },
  { id: 'lookRight', name: 'lookRight', label: 'Look Right', category: 'eye', icon: 'Eye' },
  { id: 'aa', name: 'aa', label: 'Mouth: Aa (Ah)', category: 'mouth', icon: 'Mic' },
  { id: 'ih', name: 'ih', label: 'Mouth: Ih (Ee)', category: 'mouth', icon: 'Mic' },
  { id: 'ou', name: 'ou', label: 'Mouth: Ou (Oo)', category: 'mouth', icon: 'Mic' },
  { id: 'ee', name: 'ee', label: 'Mouth: Ee (Eh)', category: 'mouth', icon: 'Mic' },
  { id: 'oh', name: 'oh', label: 'Mouth: Oh (Oh)', category: 'mouth', icon: 'Mic' }
]

export const STANDARD_HUMANOID_BONES = [
  'hips',
  'spine',
  'chest',
  'neck',
  'head',
  'leftShoulder',
  'rightShoulder',
  'leftUpperArm',
  'leftLowerArm',
  'leftHand',
  'rightUpperArm',
  'rightLowerArm',
  'rightHand',
  'leftUpperLeg',
  'leftLowerLeg',
  'leftFoot',
  'rightUpperLeg',
  'rightLowerLeg',
  'rightFoot'
] as const

export interface PosePreset {
  name: string
  category: string
  description: string
  hipPositionOffset?: [number, number, number]
  bones: Record<string, [number, number, number]>
}

export const POSE_PRESETS: Record<string, PosePreset> = {
  naturalStand: {
    name: 'Natural Relaxed',
    category: 'Standing',
    description: 'Anime natural idle stance with relaxed arms by sides',
    hipPositionOffset: [0, 0, 0],
    bones: {
      leftUpperArm: [0, 0, -68],
      rightUpperArm: [0, 0, 68],
      leftLowerArm: [-10, 10, 0],
      rightLowerArm: [-10, -10, 0],
      leftHand: [-5, 0, 0],
      rightHand: [-5, 0, 0],
      spine: [2, 0, 0],
      chest: [-1, 0, 0],
      neck: [2, 0, 0],
      head: [0, 0, 0],
      leftUpperLeg: [0, 0, -2],
      rightUpperLeg: [0, 0, 2],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0]
    }
  },
  walking: {
    name: 'Walking',
    category: 'Animated',
    description: 'Fluid Mixamo walk cycle retargeted to character humanoid rig',
    hipPositionOffset: [0, 0, 0],
    bones: {
      leftUpperArm: [15, 0, -35],
      rightUpperArm: [-15, 0, 35],
      leftLowerArm: [15, 0, 0],
      rightLowerArm: [15, 0, 0],
      leftHand: [0, 0, 0],
      rightHand: [0, 0, 0],
      leftUpperLeg: [-20, 0, -2],
      rightUpperLeg: [20, 0, 2],
      leftLowerLeg: [25, 0, 0],
      rightLowerLeg: [5, 0, 0],
      spine: [3, 0, 0],
      chest: [0, 0, 0],
      neck: [2, 0, 0],
      head: [0, 0, 0]
    }
  },
  aPose: {
    name: 'Standard A-Pose',
    category: 'Reference',
    description: '45-degree angled arms for skinning & rigging inspection',
    hipPositionOffset: [0, 0, 0],
    bones: {
      leftUpperArm: [0, 0, -45],
      rightUpperArm: [0, 0, 45],
      leftLowerArm: [0, 0, 0],
      rightLowerArm: [0, 0, 0],
      leftHand: [0, 0, 0],
      rightHand: [0, 0, 0],
      leftUpperLeg: [0, 0, -3],
      rightUpperLeg: [0, 0, 3],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0],
      spine: [0, 0, 0],
      chest: [0, 0, 0],
      neck: [0, 0, 0],
      head: [0, 0, 0]
    }
  },
  tPose: {
    name: 'Standard T-Pose',
    category: 'Reference',
    description: 'Orthographic 90-degree horizontal reference T-pose',
    hipPositionOffset: [0, 0, 0],
    bones: {
      leftUpperArm: [0, 0, 0],
      rightUpperArm: [0, 0, 0],
      leftLowerArm: [0, 0, 0],
      rightLowerArm: [0, 0, 0],
      leftHand: [0, 0, 0],
      rightHand: [0, 0, 0],
      leftUpperLeg: [0, 0, 0],
      rightUpperLeg: [0, 0, 0],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0],
      spine: [0, 0, 0],
      chest: [0, 0, 0],
      neck: [0, 0, 0],
      head: [0, 0, 0]
    }
  },
  confidentCrossed: {
    name: 'Confident Arms Crossed',
    category: 'Standing',
    description: 'Confident standing posture with arms crossed neatly over chest',
    hipPositionOffset: [0, 0, 0],
    bones: {
      head: [-2, 0, 0],
      neck: [1, 0, 0],
      chest: [3, 0, 0],
      spine: [2, 0, 0],
      leftShoulder: [0, 5, -2],
      rightShoulder: [0, -5, 2],
      leftUpperArm: [30, 18, -36],
      rightUpperArm: [34, -16, 36],
      leftLowerArm: [-90, 38, 5],
      rightLowerArm: [-86, -38, -5],
      leftHand: [8, 0, 0],
      rightHand: [8, 0, 0],
      leftUpperLeg: [0, 0, -4],
      rightUpperLeg: [0, 0, 4],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0],
      leftFoot: [0, 0, 0],
      rightFoot: [0, 0, 0]
    }
  },
  casualStand: {
    name: 'Casual Weight Shift',
    category: 'Standing',
    description: 'Natural casual standing stance with relaxed arms by sides',
    hipPositionOffset: [0, 0, 0],
    bones: {
      head: [-1, 2, 1],
      neck: [1, 0, 0],
      chest: [1, 0, 1],
      spine: [2, 0, -2],
      leftUpperArm: [0, 0, -65],
      rightUpperArm: [0, 0, 65],
      leftLowerArm: [-12, 12, 0],
      rightLowerArm: [-12, -12, 0],
      leftHand: [-4, 0, 0],
      rightHand: [-4, 0, 0],
      leftUpperLeg: [2, 2, -5],
      rightUpperLeg: [-1, -1, 3],
      leftLowerLeg: [4, 0, 0],
      rightLowerLeg: [0, 0, 0],
      leftFoot: [0, 2, 0],
      rightFoot: [0, 0, 0]
    }
  },
  armsCrossed: {
    name: 'Arms Folded',
    category: 'Standing',
    description: 'Pensive posture with arms comfortably crossed across chest',
    hipPositionOffset: [0, 0, 0],
    bones: {
      head: [-2, 0, 0],
      neck: [1, 0, 0],
      chest: [2, 0, 0],
      spine: [2, 0, 0],
      leftShoulder: [0, 6, -2],
      rightShoulder: [0, -6, 2],
      leftUpperArm: [28, 16, -36],
      rightUpperArm: [32, -15, 36],
      leftLowerArm: [-88, 36, 5],
      rightLowerArm: [-84, -36, -5],
      leftHand: [6, 0, 0],
      rightHand: [6, 0, 0],
      leftUpperLeg: [0, 0, -4],
      rightUpperLeg: [0, 0, 4],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0],
      leftFoot: [0, 0, 0],
      rightFoot: [0, 0, 0]
    }
  },
  shyKawaii: {
    name: 'Shy / Gentle',
    category: 'Expressive',
    description: 'Gentle posture with hands folded in front and inward legs',
    hipPositionOffset: [0, 0, 0],
    bones: {
      head: [4, -3, -4],
      neck: [2, 0, -2],
      chest: [-2, 0, 0],
      spine: [3, 0, 0],
      leftShoulder: [0, 4, -2],
      rightShoulder: [0, -4, 2],
      leftUpperArm: [18, 12, -50],
      rightUpperArm: [18, -12, 50],
      leftLowerArm: [-55, 28, 0],
      rightLowerArm: [-55, -28, 0],
      leftHand: [12, 18, 0],
      rightHand: [12, -18, 0],
      leftUpperLeg: [0, 5, -2],
      rightUpperLeg: [0, -5, 2],
      leftLowerLeg: [0, -4, 0],
      rightLowerLeg: [0, 4, 0],
      leftFoot: [0, -4, 0],
      rightFoot: [0, 4, 0]
    }
  },
  wavingHand: {
    name: 'Cheerful Wave',
    category: 'Expressive',
    description: 'Friendly hello greeting wave with raised right hand',
    hipPositionOffset: [0, 0, 0],
    bones: {
      head: [-2, 4, 6],
      neck: [1, 2, 2],
      chest: [2, -3, 2],
      spine: [2, 0, 1],
      rightShoulder: [0, 0, 6],
      rightUpperArm: [15, 10, 85],
      rightLowerArm: [-75, -20, 0],
      rightHand: [10, 15, 15],
      leftUpperArm: [0, 0, -68],
      leftLowerArm: [-10, 10, 0],
      leftHand: [-5, 0, 0],
      leftUpperLeg: [0, 0, -3],
      rightUpperLeg: [0, 0, 3],
      leftLowerLeg: [0, 0, 0],
      rightLowerLeg: [0, 0, 0],
      leftFoot: [0, 0, 0],
      rightFoot: [0, 0, 0]
    }
  },
  spellcaster: {
    name: 'Spellcaster Magic',
    category: 'Action',
    description: 'Fantasy mage incantation stance with outstretched magic hand',
    hipPositionOffset: [0, 0, 0],
    bones: {
      head: [-3, -6, 0],
      neck: [2, -4, 0],
      chest: [4, 6, 0],
      spine: [4, 4, 0],
      rightShoulder: [0, 5, 4],
      rightUpperArm: [55, 15, 25],
      rightLowerArm: [-30, 10, 0],
      rightHand: [-15, 12, -8],
      leftShoulder: [0, -4, -2],
      leftUpperArm: [-20, -10, -48],
      leftLowerArm: [-65, 15, 0],
      leftHand: [12, 0, 0],
      leftUpperLeg: [10, 6, -6],
      leftLowerLeg: [12, 0, 0],
      rightUpperLeg: [-8, -6, 6],
      rightLowerLeg: [8, 0, 0],
      leftFoot: [0, 0, 0],
      rightFoot: [0, 0, 0]
    }
  },
  heroicBattle: {
    name: 'Heroic Battle Ready',
    category: 'Action',
    description: 'Dynamic battle combat stance with ready fists and braced legs',
    hipPositionOffset: [0, 0, 0],
    bones: {
      head: [-3, 6, 0],
      neck: [2, 4, 0],
      chest: [4, -8, 0],
      spine: [4, -6, 0],
      leftUpperArm: [22, -12, -42],
      leftLowerArm: [-75, 18, 0],
      leftHand: [-12, 0, -8],
      rightUpperArm: [-16, 16, 46],
      rightLowerArm: [-70, -16, 0],
      rightHand: [10, 0, 10],
      leftUpperLeg: [12, 6, -8],
      leftLowerLeg: [16, 0, 0],
      rightUpperLeg: [-10, -6, 8],
      rightLowerLeg: [12, 0, 0],
      leftFoot: [0, 0, 0],
      rightFoot: [0, 0, 0]
    }
  },
  walkingStride: {
    name: 'Walking Stride',
    category: 'Action',
    description: 'Anime street promenade walking step with natural swinging arms',
    hipPositionOffset: [0, 0, 0],
    bones: {
      head: [0, 0, 0],
      neck: [2, 0, 0],
      chest: [-2, 0, 0],
      spine: [3, 0, 0],
      leftUpperLeg: [-20, 0, -3],
      leftLowerLeg: [10, 0, 0],
      leftFoot: [-4, 0, 0],
      rightUpperLeg: [18, 0, 3],
      rightLowerLeg: [14, 0, 0],
      rightFoot: [10, 0, 0],
      leftUpperArm: [22, 0, -38],
      leftLowerArm: [-22, 10, 0],
      leftHand: [0, 0, 0],
      rightUpperArm: [-18, 0, 38],
      rightLowerArm: [-12, -10, 0],
      rightHand: [0, 0, 0]
    }
  },
  sittingGraceful: {
    name: 'Sitting Graceful',
    category: 'Sitting',
    description: 'Elegant sitting pose with bent knees and hands resting on lap',
    hipPositionOffset: [0, -0.48, 0],
    bones: {
      head: [-2, 0, 0],
      neck: [2, 0, 0],
      chest: [-2, 0, 0],
      spine: [4, 0, 0],
      leftUpperArm: [28, 8, -25],
      rightUpperArm: [28, -8, 25],
      leftLowerArm: [-72, 18, 0],
      rightLowerArm: [-72, -18, 0],
      leftHand: [8, 0, 0],
      rightHand: [8, 0, 0],
      leftUpperLeg: [-82, 3, -3],
      rightUpperLeg: [-82, -3, 3],
      leftLowerLeg: [86, 0, 0],
      rightLowerLeg: [86, 0, 0],
      leftFoot: [-4, 0, 0],
      rightFoot: [-4, 0, 0]
    }
  },
  kneelingSeiza: {
    name: 'Kneeling Seiza',
    category: 'Sitting',
    description: 'Traditional Japanese formal kneeling posture with hands on thighs',
    hipPositionOffset: [0, -0.48, 0],
    bones: {
      head: [-2, 0, 0],
      neck: [2, 0, 0],
      chest: [-2, 0, 0],
      spine: [4, 0, 0],
      leftUpperArm: [26, 6, -22],
      rightUpperArm: [26, -6, 22],
      leftLowerArm: [-58, 14, 0],
      rightLowerArm: [-58, -14, 0],
      leftHand: [6, 0, 0],
      rightHand: [6, 0, 0],
      leftUpperLeg: [-105, 0, -2],
      rightUpperLeg: [-105, 0, 2],
      leftLowerLeg: [135, 0, 0],
      rightLowerLeg: [135, 0, 0],
      leftFoot: [30, 0, 0],
      rightFoot: [30, 0, 0]
    }
  },
  sittingCrossLegged: {
    name: 'Sitting Cross-Legged',
    category: 'Sitting',
    description: 'Relaxed anime floor sitting with crossed legs and hands on knees',
    hipPositionOffset: [0, -0.60, 0],
    bones: {
      head: [-2, 0, 0],
      neck: [2, 0, 0],
      chest: [-2, 0, 0],
      spine: [5, 0, 0],
      leftUpperArm: [30, 10, -26],
      rightUpperArm: [30, -10, 26],
      leftLowerArm: [-68, 18, 0],
      rightLowerArm: [-68, -18, 0],
      leftHand: [10, 0, 0],
      rightHand: [10, 0, 0],
      leftUpperLeg: [-75, 28, -32],
      rightUpperLeg: [-75, -28, 32],
      leftLowerLeg: [115, 0, 0],
      rightLowerLeg: [115, 0, 0],
      leftFoot: [-15, 0, 0],
      rightFoot: [-15, 0, 0]
    }
  }
}

// Dynamically register all manifest animations into POSE_PRESETS under 'Animated' category
ANIMATIONS_MANIFEST.forEach(anim => {
  if (!POSE_PRESETS[anim.id]) {
    POSE_PRESETS[anim.id] = {
      name: anim.displayName,
      category: 'Animated',
      description: anim.description,
      hipPositionOffset: [0, 0, 0],
      bones: {
        leftUpperArm: [15, 0, -35],
        rightUpperArm: [-15, 0, 35],
        leftLowerArm: [15, 0, 0],
        rightLowerArm: [15, 0, 0],
        leftHand: [0, 0, 0],
        rightHand: [0, 0, 0],
        leftUpperLeg: [-20, 0, -2],
        rightUpperLeg: [20, 0, 2],
        leftLowerLeg: [25, 0, 0],
        rightLowerLeg: [5, 0, 0],
        spine: [3, 0, 0],
        chest: [0, 0, 0],
        neck: [2, 0, 0],
        head: [0, 0, 0]
      }
    }
  }
})

/**
 * Standard VRM bone alias map for humanoid mapping (including Mixamo, Blender, and Bip01 conventions)
 */
export const BONE_ALIASES: Record<string, string[]> = {
  head: ['head', 'Head', 'J_Bip_C_Head', 'HEAD', 'mixamorigHead', 'mixamorig:Head', 'Bip01_Head'],
  neck: ['neck', 'Neck', 'J_Bip_C_Neck', 'NECK', 'mixamorigNeck', 'mixamorig:Neck', 'Bip01_Neck'],
  chest: ['chest', 'Chest', 'J_Bip_C_Chest', 'CHEST', 'upperChest', 'UpperChest', 'J_Bip_C_UpperChest', 'mixamorigSpine2', 'mixamorig:Spine2', 'Spine2', 'Bip01_Spine2'],
  spine: ['spine', 'Spine', 'J_Bip_C_Spine', 'SPINE', 'mixamorigSpine', 'mixamorig:Spine', 'mixamorigSpine1', 'mixamorig:Spine1', 'Spine1', 'Bip01_Spine', 'Bip01_Spine1'],
  hips: ['hips', 'Hips', 'J_Bip_C_Hips', 'HIPS', 'pelvis', 'Pelvis', 'root', 'Root', 'mixamorigHips', 'mixamorig:Hips', 'Bip01_Pelvis'],
  leftShoulder: ['leftShoulder', 'LeftShoulder', 'J_Bip_L_Shoulder', 'shoulder.L', 'mixamorigLeftShoulder', 'mixamorig:LeftShoulder', 'Bip01_L_Clavicle'],
  rightShoulder: ['rightShoulder', 'RightShoulder', 'J_Bip_R_Shoulder', 'shoulder.R', 'mixamorigRightShoulder', 'mixamorig:RightShoulder', 'Bip01_R_Clavicle'],
  leftUpperArm: ['leftUpperArm', 'LeftUpperArm', 'J_Bip_L_UpperArm', 'Arm_L', 'upper_arm.L', 'UpperArm_L', 'mixamorigLeftArm', 'mixamorig:LeftArm', 'Bip01_L_UpperArm'],
  rightUpperArm: ['rightUpperArm', 'RightUpperArm', 'J_Bip_R_UpperArm', 'Arm_R', 'upper_arm.R', 'UpperArm_R', 'mixamorigRightArm', 'mixamorig:RightArm', 'Bip01_R_UpperArm'],
  leftLowerArm: ['leftLowerArm', 'LeftLowerArm', 'J_Bip_L_LowerArm', 'Elbow_L', 'forearm.L', 'LowerArm_L', 'mixamorigLeftForeArm', 'mixamorig:LeftForeArm', 'Bip01_L_Forearm'],
  rightLowerArm: ['rightLowerArm', 'RightLowerArm', 'J_Bip_R_LowerArm', 'Elbow_R', 'forearm.R', 'LowerArm_R', 'mixamorigRightForeArm', 'mixamorig:RightForeArm', 'Bip01_R_Forearm'],
  leftHand: ['leftHand', 'LeftHand', 'J_Bip_L_Hand', 'Hand_L', 'hand.L', 'mixamorigLeftHand', 'mixamorig:LeftHand', 'Bip01_L_Hand'],
  rightHand: ['rightHand', 'RightHand', 'J_Bip_R_Hand', 'Hand_R', 'hand.R', 'mixamorigRightHand', 'mixamorig:RightHand', 'Bip01_R_Hand'],
  leftUpperLeg: ['leftUpperLeg', 'LeftUpperLeg', 'J_Bip_L_UpperLeg', 'Leg_L', 'thigh.L', 'UpperLeg_L', 'mixamorigLeftUpLeg', 'mixamorig:LeftUpLeg', 'Bip01_L_Thigh'],
  rightUpperLeg: ['rightUpperLeg', 'RightUpperLeg', 'J_Bip_R_UpperLeg', 'Leg_R', 'thigh.R', 'UpperLeg_R', 'mixamorigRightUpLeg', 'mixamorig:RightUpLeg', 'Bip01_R_Thigh'],
  leftLowerLeg: ['leftLowerLeg', 'LeftLowerLeg', 'J_Bip_L_LowerLeg', 'Knee_L', 'shin.L', 'LowerLeg_L', 'mixamorigLeftLeg', 'mixamorig:LeftLeg', 'Bip01_L_Calf'],
  rightLowerLeg: ['rightLowerLeg', 'RightLowerLeg', 'J_Bip_R_LowerLeg', 'Knee_R', 'shin.R', 'LowerLeg_R', 'mixamorigRightLeg', 'mixamorig:RightLeg', 'Bip01_R_Calf'],
  leftFoot: ['leftFoot', 'LeftFoot', 'J_Bip_L_Foot', 'Foot_L', 'foot.L', 'mixamorigLeftFoot', 'mixamorig:LeftFoot', 'Bip01_L_Foot'],
  rightFoot: ['rightFoot', 'RightFoot', 'J_Bip_R_Foot', 'Foot_R', 'foot.R', 'mixamorigRightFoot', 'mixamorig:RightFoot', 'Bip01_R_Foot']
}

/**
 * Adapts a standard GLTF/GLB or non-VRM 3D model into a fully compatible VRM structure
 * so that any 3D asset (.glb, .gltf, custom VRM) renders, poses, and customizes seamlessly.
 */
function createCompatibleVRMFromGLTF(gltf: any): { vrm: any; meta: VRMAvatarMeta } {
  const scene: THREE.Group = gltf.scene || new THREE.Group()

  // 1. Discover all nodes, bones and morph target meshes
  const allNodes: THREE.Object3D[] = []
  const boneMap = new Map<string, THREE.Object3D>()
  const morphMeshes: THREE.Mesh[] = []

  scene.traverse((node: any) => {
    allNodes.push(node)
    if (node.isMesh && node.morphTargetDictionary && node.morphTargetInfluences) {
      morphMeshes.push(node)
    }
  })

  // 2. Map standard humanoid bones with resilient fuzzy matching
  for (const [standardBone, aliases] of Object.entries(BONE_ALIASES)) {
    const candidates = [standardBone, ...aliases]
    for (const cand of candidates) {
      const lowerCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '')
      const match = allNodes.find(n => {
        const cleanName = (n.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        return cleanName === lowerCand || cleanName.endsWith(lowerCand) || lowerCand.endsWith(cleanName)
      })
      if (match) {
        boneMap.set(standardBone, match)
        break
      }
    }
  }

  // Ensure root/hips node exists for transform & positioning
  let hipsNode = boneMap.get('hips')
  if (!hipsNode) {
    const rootBone = allNodes.find((n: any) => n.isBone && (!n.parent || !(n.parent as any).isBone))
    if (rootBone) {
      hipsNode = rootBone
      boneMap.set('hips', rootBone)
    } else {
      hipsNode = scene
      boneMap.set('hips', scene)
    }
  }

  // 3. Expression Manager for morph targets
  const expressionManager = {
    setValue: (expressionName: string, value: number) => {
      const clamped = Math.max(0, Math.min(1, value))
      const aliases = EXPR_MAPPINGS[expressionName] || [expressionName]
      morphMeshes.forEach(mesh => {
        const dict = mesh.morphTargetDictionary
        const influences = mesh.morphTargetInfluences
        if (!dict || !influences) return
        for (const alias of aliases) {
          const lowerAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '')
          for (const [key, idx] of Object.entries(dict)) {
            const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
            if (lowerKey === lowerAlias || lowerKey.includes(lowerAlias) || lowerAlias.includes(lowerKey)) {
              influences[idx as number] = clamped
            }
          }
        }
      })
    },
    getValue: () => 0,
    update: () => {}
  }

  // 4. Cache original material states
  scene.traverse((obj: any) => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m: any) => {
        if (!m.userData) m.userData = {}
        if (!m.userData.initialColor && m.color) {
          m.userData.initialColor = m.color.clone()
        }
        if (!m.userData.initialShadeColorFactor && m.shadeColorFactor) {
          m.userData.initialShadeColorFactor = m.shadeColorFactor.clone()
        }
        if (m.userData.initialSide === undefined) {
          m.userData.initialSide = m.side
        }
        if (m.userData.initialDepthWrite === undefined) {
          m.userData.initialDepthWrite = m.depthWrite
        }
      })
    }
  })

  // 5. Bounds & Ground Positioning
  try {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    if (Number.isFinite(box.min.y) && Math.abs(box.min.y) > 0.05) {
      scene.position.y -= box.min.y
    }
    if (Number.isFinite(size.y) && size.y > 0.01) {
      if (size.y < 0.35 || size.y > 6.0) {
        const targetHeight = 1.65 // standard humanoid height in meters
        const scaleFactor = targetHeight / size.y
        scene.scale.multiplyScalar(scaleFactor)
      }
    }
  } catch (e) {
    console.warn('Bounding box adjustment notice:', e)
  }

  // 6. Calculate statistics
  let triangleCount = 0
  let meshCount = 0
  const materialSet = new Set<string>()

  scene.traverse((obj: any) => {
    if (obj.isMesh && obj.geometry) {
      meshCount++
      const geom = obj.geometry
      if (geom.index) {
        triangleCount += geom.index.count / 3
      } else if (geom.attributes?.position) {
        triangleCount += geom.attributes.position.count / 3
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: any) => materialSet.add(m.uuid || m.name))
        } else {
          materialSet.add(obj.material.uuid || obj.material.name)
        }
      }
    }
  })

  // 7. Metadata
  const meta: VRMAvatarMeta = {
    title: gltf.asset?.extras?.title || 'Imported 3D Model',
    author: gltf.asset?.generator || 'Custom 3D Model',
    version: '1.0.0',
    contactInformation: '',
    reference: '',
    allowedUserName: 'Everyone',
    commercialUsageName: 'Allowed',
    licenseName: 'Standard 3D License',
    vrmVersion: 'custom',
    thumbnailUrl: undefined,
    triangleCount: Math.round(triangleCount),
    meshCount,
    materialCount: materialSet.size
  }

  // 8. Assemble Compatible VRM Instance
  const vrm: any = {
    scene,
    humanoid: {
      getNormalizedBoneNode: (boneName: string) => boneMap.get(boneName) || null,
      getRawBoneNode: (boneName: string) => boneMap.get(boneName) || null,
      update: () => {}
    },
    expressionManager,
    blendShapeProxy: expressionManager,
    lookAt: {
      target: null as THREE.Object3D | null
    },
    meta,
    isGLTFCompatible: true,
    update: (delta: number) => {
      if ((vrm as any).mixer) {
        (vrm as any).mixer.update(delta)
      }
    }
  }

  return { vrm, meta }
}

/**
 * Loads a .VRM model from ArrayBuffer using @pixiv/three-vrm
 * Gracefully adapts any valid 3D file (.glb, .gltf, custom VRM) into a humanoid VRM avatar.
 */
export async function loadVRMFromArrayBuffer(
  buffer: ArrayBuffer,
  onProgress?: (percent: number) => void
): Promise<{ vrm: VRM; meta: VRMAvatarMeta }> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.register(parser => new VRMLoaderPlugin(parser))

    loader.parse(
      buffer,
      '',
      gltf => {
        const vrm = gltf.userData.vrm as VRM
        if (vrm) {
          if (!(vrm as any).userData) {
            (vrm as any).userData = {}
          }
          try {
            VRMUtils.removeUnnecessaryVertices(gltf.scene)
            VRMUtils.removeUnnecessaryJoints(gltf.scene)
            VRMUtils.rotateVRM0(vrm)
          } catch (e) {
            console.warn('VRMUtils optimization notice:', e)
          }

          // Cache original material states without corrupting outlines or transparency!
          gltf.scene.traverse((obj: any) => {
            if (obj.isMesh && obj.material) {
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
              mats.forEach((m: any) => {
                // Store initial properties for non-destructive edits
                if (!m.userData) m.userData = {}
                if (!m.userData.initialColor && m.color) {
                  m.userData.initialColor = m.color.clone()
                }
                if (!m.userData.initialShadeColorFactor && m.shadeColorFactor) {
                  m.userData.initialShadeColorFactor = m.shadeColorFactor.clone()
                }
                if (m.userData.initialSide === undefined) {
                  m.userData.initialSide = m.side
                }
                if (m.userData.initialDepthWrite === undefined) {
                  m.userData.initialDepthWrite = m.depthWrite
                }
              })
            }
          })

          // Extract VRM Metadata
          const metaObj = (vrm.meta as any) || {}
          let vrmVersion: '0.0' | '1.0' | 'unknown' = 'unknown'
          if (metaObj.metaVersion === '1' || metaObj.vrmVersion === '1.0' || metaObj.specVersion?.startsWith('1.')) {
            vrmVersion = '1.0'
          } else if (metaObj.metaVersion === '0' || metaObj.vrmVersion?.startsWith('0.') || metaObj.specVersion?.startsWith('0.')) {
            vrmVersion = '0.0'
          }

          let triangleCount = 0
          let meshCount = 0
          let materialCount = 0
          const materialSet = new Set<string>()

          gltf.scene.traverse((obj: any) => {
            if (obj.isMesh && obj.geometry) {
              meshCount++
              const geom = obj.geometry
              if (geom.index) {
                triangleCount += geom.index.count / 3
              } else if (geom.attributes.position) {
                triangleCount += geom.attributes.position.count / 3
              }
              if (obj.material) {
                if (Array.isArray(obj.material)) {
                  obj.material.forEach((m: any) => materialSet.add(m.uuid || m.name))
                } else {
                  materialSet.add(obj.material.uuid || obj.material.name)
                }
              }
            }
          })
          materialCount = materialSet.size

          const meta: VRMAvatarMeta = {
            title: metaObj.title || metaObj.name || 'Custom VRM Avatar',
            author: metaObj.author || metaObj.authors?.[0] || 'Unknown Creator',
            version: metaObj.version || '1.0.0',
            contactInformation: metaObj.contactInformation || '',
            reference: metaObj.reference || '',
            allowedUserName: metaObj.allowedUserName || metaObj.avatarPermission || 'Everyone',
            commercialUsageName: metaObj.commercialUsageName || metaObj.commercialUsage || 'Allowed',
            licenseName: metaObj.licenseName || metaObj.licenseUrl || 'VRM Standard License',
            vrmVersion,
            thumbnailUrl: metaObj.thumbnailImage ? metaObj.thumbnailImage.src : undefined,
            triangleCount: Math.round(triangleCount),
            meshCount,
            materialCount
          }

          resolve({ vrm, meta })
          return
        }

        // If gltf.userData.vrm is not present (standard GLB/GLTF or non-VRM humanoid),
        // adapt it seamlessly rather than failing with an error!
        if (gltf.scene) {
          const adapted = createCompatibleVRMFromGLTF(gltf)
          resolve(adapted as any)
          return
        }

        reject(new Error('Uploaded 3D file does not contain valid 3D scene data.'))
      },
      error => {
        reject(new Error(error?.message || 'Failed to parse 3D file (.vrm / .glb). Please ensure the file is a valid 3D model.'))
      }
    )
  })
}

/**
 * Finds a bone node in VRM by standardized humanoid bone name
 */
export function findBoneNode(vrm: any, standardBoneName: string): THREE.Object3D | null {
  if (!vrm) return null

  // 1. Try VRM humanoid normalized bone node
  if (vrm.humanoid?.getNormalizedBoneNode) {
    const node = vrm.humanoid.getNormalizedBoneNode(standardBoneName as any)
    if (node) return node
  }

  // 2. Try VRM humanoid raw bone node
  if (vrm.humanoid?.getRawBoneNode) {
    const rawNode = vrm.humanoid.getRawBoneNode(standardBoneName as any)
    if (rawNode) return rawNode
  }

  // 3. Try searching vrm.scene hierarchy by aliases
  const aliases = BONE_ALIASES[standardBoneName] || [standardBoneName]
  let found: THREE.Object3D | null = null

  if (vrm.scene) {
    vrm.scene.traverse((child: THREE.Object3D) => {
      if (found) return
      if (aliases.some(alias => child.name === alias || child.name.toLowerCase() === alias.toLowerCase())) {
        found = child
      }
    })
  }

  return found
}

/**
 * Apply bone rotations (in degrees) and grounded hip positioning to VRM humanoid rig
 */
export function applyBoneRotations(
  vrm: any,
  rotations: Record<string, [number, number, number]>,
  presetNameOrOffset?: string | [number, number, number]
) {
  if (!vrm) return

  const safeRotations = rotations || {}
  const DEG2RAD = Math.PI / 180

  // 1. Reset standard humanoid bones not present in this pose to clean [0, 0, 0] to eliminate residual bone twists
  STANDARD_HUMANOID_BONES.forEach(boneName => {
    if (!safeRotations[boneName]) {
      if (vrm.humanoid?.getNormalizedBoneNode) {
        const normNode = vrm.humanoid.getNormalizedBoneNode(boneName as any)
        if (normNode) {
          normNode.rotation.set(0, 0, 0, 'XYZ')
          return
        }
      }
      if (vrm.humanoid?.getRawBoneNode) {
        const rawNode = vrm.humanoid.getRawBoneNode(boneName as any)
        if (rawNode) {
          rawNode.rotation.set(0, 0, 0, 'XYZ')
          return
        }
      }
      const fallback = findBoneNode(vrm, boneName)
      if (fallback) {
        fallback.rotation.set(0, 0, 0, 'XYZ')
      }
    }
  })

  // 2. Apply target rotations ONLY via normalized bone node (preferred standard) or fallback without double-rotation
  Object.entries(rotations).forEach(([boneName, [degX, degY, degZ]]) => {
    const radX = degX * DEG2RAD
    const radY = degY * DEG2RAD
    const radZ = degZ * DEG2RAD

    // 1. Normalized bone node (Standard VRM humanoid coordinate system)
    if (vrm.humanoid?.getNormalizedBoneNode) {
      const normNode = vrm.humanoid.getNormalizedBoneNode(boneName as any)
      if (normNode) {
        normNode.rotation.set(radX, radY, radZ, 'XYZ')
        return
      }
    }

    // 2. Raw bone node (Fallback ONLY if normalized node is not available)
    if (vrm.humanoid?.getRawBoneNode) {
      const rawNode = vrm.humanoid.getRawBoneNode(boneName as any)
      if (rawNode) {
        rawNode.rotation.set(radX, radY, radZ, 'XYZ')
        return
      }
    }

    // 3. Fallback search by alias in scene hierarchy
    const fallbackNode = findBoneNode(vrm, boneName)
    if (fallbackNode) {
      fallbackNode.rotation.set(radX, radY, radZ, 'XYZ')
    }
  })

  // 3. Apply hip / root grounding vertical offset (so sitting and kneeling poses sit firmly on floor)
  let hipOffset: [number, number, number] = [0, 0, 0]
  if (Array.isArray(presetNameOrOffset)) {
    hipOffset = presetNameOrOffset
  } else if (typeof presetNameOrOffset === 'string' && POSE_PRESETS[presetNameOrOffset]?.hipPositionOffset) {
    hipOffset = POSE_PRESETS[presetNameOrOffset].hipPositionOffset!
  }

  if (vrm.scene) {
    vrm.scene.position.set(hipOffset[0], hipOffset[1], hipOffset[2])
  }

  // Trigger humanoid internal update if present
  try {
    if (vrm.humanoid?.update) {
      vrm.humanoid.update()
    }
  } catch (e) {
    // safe guard
  }
}

/**
 * Apply body proportions scaling (Height, Head, Shoulders, Waist, Hips, Limbs)
 */
export function applyProportions(vrm: any, proportions: CharacterProportions) {
  if (!vrm) return

  const safeProportions: CharacterProportions = { ...DEFAULT_PROPORTIONS, ...(proportions || {}) }
  const height = Number.isFinite(safeProportions.height) && safeProportions.height > 0.05 ? safeProportions.height : 1.0

  // Overall Height Scale
  if (vrm.scene) {
    vrm.scene.scale.set(height, height, height)
  }

  // Head Scale
  const headNode = findBoneNode(vrm, 'head')
  if (headNode) {
    const headScale = Number.isFinite(safeProportions.headScale) && safeProportions.headScale > 0.05 ? safeProportions.headScale : 1.0
    headNode.scale.set(headScale, headScale, headScale)
  }

  // Chest / Torso / Shoulder Width
  const chestNode = findBoneNode(vrm, 'chest')
  if (chestNode) {
    const sWidth = Number.isFinite(safeProportions.shoulderWidth) && safeProportions.shoulderWidth > 0.05 ? safeProportions.shoulderWidth : 1.0
    const cScale = Number.isFinite(safeProportions.chestScale) && safeProportions.chestScale > 0.05 ? safeProportions.chestScale : 1.0
    chestNode.scale.set(sWidth, cScale, sWidth)
  }

  // Spine / Waist Definition
  const spineNode = findBoneNode(vrm, 'spine')
  if (spineNode) {
    const wScale = Number.isFinite(safeProportions.waistScale) && safeProportions.waistScale > 0.05 ? safeProportions.waistScale : 1.0
    spineNode.scale.set(wScale, 1.0, wScale)
  }

  // Hips / Pelvis Width
  const hipsNode = findBoneNode(vrm, 'hips')
  if (hipsNode) {
    const hScale = Number.isFinite(safeProportions.hipScale) && safeProportions.hipScale > 0.05 ? safeProportions.hipScale : 1.0
    hipsNode.scale.set(hScale, 1.0, hScale)
  }

  // Arms Length
  const leftUpperArm = findBoneNode(vrm, 'leftUpperArm')
  const rightUpperArm = findBoneNode(vrm, 'rightUpperArm')
  if (leftUpperArm) leftUpperArm.scale.set(1.0, proportions.armLength, 1.0)
  if (rightUpperArm) rightUpperArm.scale.set(1.0, proportions.armLength, 1.0)

  // Legs Length
  const leftUpperLeg = findBoneNode(vrm, 'leftUpperLeg')
  const rightUpperLeg = findBoneNode(vrm, 'rightUpperLeg')
  if (leftUpperLeg) leftUpperLeg.scale.set(1.0, proportions.legLength, 1.0)
  if (rightUpperLeg) rightUpperLeg.scale.set(1.0, proportions.legLength, 1.0)
}

/**
 * VRM Expression name mapping between VRM 1.0, VRM 0.0 and Blendshape morph targets
 */
const EXPR_MAPPINGS: Record<string, string[]> = {
  happy: ['happy', 'joy', 'Joy', 'Fcl_EYE_Joy', 'Fcl_MTH_Joy', 'Face_Joy', 'Joy_L', 'Joy_R'],
  angry: ['angry', 'Angry', 'Fcl_EYE_Angry', 'Fcl_BRW_Angry', 'Fcl_MTH_Angry', 'Face_Angry'],
  sad: ['sad', 'sorrow', 'Sorrow', 'Fcl_EYE_Sorrow', 'Fcl_BRW_Sorrow', 'Face_Sorrow'],
  relaxed: ['relaxed', 'fun', 'Fun', 'Fcl_EYE_Relaxed', 'Fcl_BRW_Relaxed', 'Face_Fun'],
  surprised: ['surprised', 'Surprised', 'Fcl_EYE_Surprised', 'Fcl_BRW_Surprised', 'Face_Surprised'],
  blink: ['blink', 'Blink', 'Fcl_EYE_Close', 'Eye_Close', 'EYE_DEF_L_C', 'EYE_DEF_R_C'],
  blinkLeft: ['blinkLeft', 'blink_l', 'Blink_L', 'Fcl_EYE_Close_L', 'Eye_Close_L'],
  blinkRight: ['blinkRight', 'blink_r', 'Blink_R', 'Fcl_EYE_Close_R', 'Eye_Close_R'],
  lookUp: ['lookUp', 'lookup', 'LookUp', 'Fcl_EYE_Up'],
  lookDown: ['lookDown', 'lookdown', 'LookDown', 'Fcl_EYE_Down'],
  lookLeft: ['lookLeft', 'lookleft', 'LookLeft', 'Fcl_EYE_Left'],
  lookRight: ['lookRight', 'lookright', 'LookRight', 'Fcl_EYE_Right'],
  aa: ['aa', 'a', 'A', 'Fcl_MTH_A', 'Mouth_A', 'mouth_a', 'MTH_A'],
  ih: ['ih', 'i', 'I', 'Fcl_MTH_I', 'Mouth_I', 'mouth_i', 'MTH_I'],
  ou: ['ou', 'u', 'U', 'Fcl_MTH_U', 'Mouth_U', 'mouth_u', 'MTH_U'],
  ee: ['ee', 'e', 'E', 'Fcl_MTH_E', 'Mouth_E', 'mouth_e', 'MTH_E'],
  oh: ['oh', 'o', 'O', 'Fcl_MTH_O', 'Mouth_O', 'mouth_o', 'MTH_O']
}

/**
 * Apply expression weights to VRM expression manager, blendshape proxy, and morph targets
 */
export function applyExpressionWeights(vrm: any, weights: Record<string, number>) {
  if (!vrm) return

  const safeWeights = weights || {}

  // 1. VRM 1.0 Expression Manager
  if (vrm.expressionManager?.setValue) {
    Object.entries(safeWeights).forEach(([exprName, value]) => {
      const clamped = Math.max(0, Math.min(1, value))
      const aliases = EXPR_MAPPINGS[exprName] || [exprName]
      for (const alias of aliases) {
        try {
          vrm.expressionManager.setValue(alias, clamped)
        } catch (e) {
          // ignore
        }
      }
    })
    try {
      vrm.expressionManager.update()
    } catch (e) {
      // ignore
    }
  }

  // 2. VRM 0.0 BlendShapeProxy
  if (vrm.blendShapeProxy?.setValue) {
    Object.entries(weights).forEach(([exprName, value]) => {
      const clamped = Math.max(0, Math.min(1, value))
      const aliases = EXPR_MAPPINGS[exprName] || [exprName]
      for (const alias of aliases) {
        try {
          vrm.blendShapeProxy.setValue(alias, clamped)
        } catch (e) {
          // ignore
        }
      }
    })
    try {
      vrm.blendShapeProxy.update()
    } catch (e) {
      // ignore
    }
  }

  // 3. Direct Morph Targets traversal on SkinnedMeshes / Meshes in scene
  if (vrm.scene) {
    vrm.scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const dict = child.morphTargetDictionary
        const influences = child.morphTargetInfluences

        Object.entries(weights).forEach(([exprName, value]) => {
          const clamped = Math.max(0, Math.min(1, value))
          const aliases = EXPR_MAPPINGS[exprName] || [exprName]

          for (const alias of aliases) {
            if (dict[alias] !== undefined) {
              influences[dict[alias]] = clamped
            }
          }
        })
      }
    })
  }
}

/**
 * Determine material category (skin, hair, outfit, eyes, eyebrows) by name / structure
 */
function getMaterialCategory(matName: string, meshName: string = ''): 'hair' | 'skin' | 'outfit' | 'eyes' | 'eyebrows' | 'outline' | 'other' {
  const name = `${matName} ${meshName}`.toLowerCase()

  if (name.includes('outline') || name.includes('backface') || name.includes('rim')) {
    return 'outline'
  }
  if (name.includes('hair') || name.includes('bangs') || name.includes('pigtail') || name.includes('ponytail') || name.includes('ahoge')) {
    return 'hair'
  }
  if (name.includes('eyebrow') || name.includes('mayu') || name.includes('brow')) {
    return 'eyebrows'
  }
  if (name.includes('eye') || name.includes('iris') || name.includes('hitomi') || name.includes('pupil') || name.includes('highlight')) {
    return 'eyes'
  }
  if (name.includes('skin') || name.includes('face') || name.includes('body') || name.includes('head') || name.includes('neck') || name.includes('arm') || name.includes('leg') || name.includes('hand') || name.includes('mouth') || name.includes('ear')) {
    return 'skin'
  }
  if (name.includes('cloth') || name.includes('top') || name.includes('bottom') || name.includes('dress') || name.includes('skirt') || name.includes('pants') || name.includes('shirt') || name.includes('coat') || name.includes('jacket') || name.includes('shoe') || name.includes('sock') || name.includes('uniform') || name.includes('suit') || name.includes('accessory') || name.includes('ribbon') || name.includes('costume')) {
    return 'outfit'
  }

  return 'other'
}

/**
 * Apply material shading styles (Toon, Matte, Glossy, PBR) and color customization
 * without corrupting backface outlines or alpha textures!
 */
export function applyMaterialSettings(vrm: any, materials?: CharacterMaterials) {
  if (!vrm || !vrm.scene) return

  const safeMaterials: CharacterMaterials = { ...DEFAULT_MATERIALS, ...(materials || {}) }
  const targetSkinColor = new THREE.Color(safeMaterials.skinTone)
  const targetHairColor = new THREE.Color(safeMaterials.hairColor)
  const targetHighlightColor = new THREE.Color(safeMaterials.hairHighlight)
  const targetOutfitColor = new THREE.Color(safeMaterials.outfitTint)

  vrm.scene.traverse((obj: any) => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m: any) => {
        const matName = m.name || ''
        const meshName = obj.name || ''
        const category = getMaterialCategory(matName, meshName)

        // NEVER corrupt outline materials! Outline must remain BackSide!
        if (category === 'outline' || m.side === THREE.BackSide) {
          m.side = THREE.BackSide
          return
        }

        // Apply doubleSided ONLY to standard non-transparent front meshes if user requested
        if (safeMaterials.doubleSidedOpaque && !m.transparent) {
          m.side = THREE.DoubleSide
        } else if (!safeMaterials.doubleSidedOpaque && m.userData?.initialSide !== undefined) {
          m.side = m.userData.initialSide
        }

        // 1. Hair materials color & highlight
        if (category === 'hair') {
          if (m.color) {
            m.color.copy(targetHairColor)
          }
          if (m.shadeColorFactor) {
            const shadeColor = targetHairColor.clone().multiplyScalar(0.72)
            m.shadeColorFactor.copy(shadeColor)
          }
          if (m.emissive) {
            m.emissive.copy(targetHighlightColor).multiplyScalar(0.12)
          }
          if (m.roughness !== undefined) m.roughness = safeMaterials.hairRoughness
          if (m.metalness !== undefined) m.metalness = safeMaterials.hairMetalness
        }

        // 2. Skin materials color (Face, Body, Arms, Legs)
        if (category === 'skin') {
          if (m.color) {
            m.color.copy(targetSkinColor)
          }
          if (m.shadeColorFactor) {
            const shadeSkin = targetSkinColor.clone().multiplyScalar(0.82)
            m.shadeColorFactor.copy(shadeSkin)
          }
        }

        // 3. Outfit materials color
        if (category === 'outfit') {
          if (safeMaterials.outfitTint !== '#FFFFFF' && safeMaterials.outfitTint !== '#ffffff') {
            if (m.color) {
              m.color.copy(targetOutfitColor)
            }
            if (m.shadeColorFactor) {
              const shadeOutfit = targetOutfitColor.clone().multiplyScalar(0.75)
              m.shadeColorFactor.copy(shadeOutfit)
            }
          } else if (m.userData?.initialColor && m.color) {
            m.color.copy(m.userData.initialColor)
            if (m.userData?.initialShadeColorFactor && m.shadeColorFactor) {
              m.shadeColorFactor.copy(m.userData.initialShadeColorFactor)
            }
          }
        }

        // 4. Eyebrows (sync with hair base color for aesthetic cohesion)
        if (category === 'eyebrows') {
          if (m.color) {
            m.color.copy(targetHairColor)
          }
        }

        // 5. Shading style adjustments (Matte, Glossy, PBR, Toon)
        if (category !== 'hair') {
          if (safeMaterials.shadingMode === 'matte') {
            if (m.roughness !== undefined) m.roughness = 0.88
            if (m.metalness !== undefined) m.metalness = 0.02
          } else if (safeMaterials.shadingMode === 'glossy') {
            if (m.roughness !== undefined) m.roughness = 0.22
            if (m.metalness !== undefined) m.metalness = 0.32
          } else if (safeMaterials.shadingMode === 'pbr') {
            if (m.roughness !== undefined) m.roughness = 0.5
            if (m.metalness !== undefined) m.metalness = 0.15
          }
        }

        m.needsUpdate = true
      })
    }
  })
}

/**
 * Export current 3D Scene / VRM as GLB
 */
export async function exportSceneAsGLB(scene: THREE.Object3D, fileName: string = 'vrm_avatar.glb'): Promise<void> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter()
    exporter.parse(
      scene,
      gltf => {
        const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        resolve()
      },
      error => {
        reject(error)
      },
      { binary: true }
    )
  })
}

/**
 * Download raw VRM array buffer directly
 */
export function downloadRawVRM(buffer: ArrayBuffer, fileName: string = 'avatar.vrm') {
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.vrm') ? fileName : `${fileName}.vrm`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
