import { VRMAvatarState } from '../utils/vrmManager'

export interface SceneProp {
  id: string
  name: string
  sourceType: 'custom_upload' | 'starter_preset'
  presetId?: string
  fileName?: string
  fileSize?: number
  position: [number, number, number]   // X, Y, Z (meters)
  rotation: [number, number, number]   // Pitch X, Yaw Y, Roll Z (degrees)
  scale: [number, number, number]      // Scale X, Y, Z
  visible: boolean
  locked: boolean
  castShadow: boolean
  category?: 'architecture' | 'furniture' | 'nature' | 'street' | 'items'
  glbBuffer?: ArrayBuffer              // Binary data for custom uploaded GLB
}

export interface SceneCharacterInstance {
  id: string                           // Scene unique instance ID (e.g. 'sc_char_123')
  characterId: string                  // Reference to SavedCharacterRecord or template ID
  name: string
  position: [number, number, number]   // X, Y, Z (meters)
  rotation: [number, number, number]   // Pitch X, Yaw Y, Roll Z (degrees)
  scale: [number, number, number]      // Scale X, Y, Z
  visible: boolean
  locked: boolean
  castShadow: boolean
  state: VRMAvatarState                // State for posing, expressions, hair/outfit materials
  rawVrmBuffer?: ArrayBuffer | null    // Raw VRM binary buffer if uploaded custom
}

export type SceneEntitySelection = {
  type: 'character' | 'prop' | 'camera'
  id: string
} | null

export type GizmoMode = 'translate' | 'rotate' | 'scale'
export type GizmoSpace = 'world' | 'local'

export type EditorMode = 'character' | 'scene' | 'animation'

export interface SceneCameraShot {
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  description?: string
  createdAt: number
}

export interface StarterPropPreset {
  id: string
  name: string
  category: 'architecture' | 'furniture' | 'nature' | 'street' | 'items'
  description: string
  defaultScale: [number, number, number]
  defaultPosition?: [number, number, number]
  defaultRotation?: [number, number, number]
  icon: string
}

