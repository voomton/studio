export interface BoneRotations {
  [boneName: string]: [number, number, number]
}

export interface ExpressionValues {
  eyebrows: 'neutral' | 'angry' | 'sad' | 'raised' | 'furrowed'
  eyes: 'open' | 'blink' | 'squint' | 'wide' | 'winkLeft' | 'winkRight'
  mouth: 'neutral' | 'smile' | 'scream' | 'shock' | 'grimace' | 'frown' | 'open'
  blend: number
}

export interface VisemeFrame {
  time: number
  viseme: 'silence' | 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | 'mbp' | 'fv'
  intensity: number
}

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic'

export interface Keyframe {
  id: string
  time: number
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  bones: BoneRotations
  expressions?: ExpressionValues
  viseme?: 'silence' | 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | 'mbp' | 'fv'
  easing?: EasingType
  label?: string
}

export interface CharacterItem {
  id: number
  projectId: string
  name: string
  gender: 'male' | 'female'
  ageGroup: 'Young' | 'Teen' | 'Adult' | 'Old'
  build: 'Slim' | 'Regular' | 'Athletic' | 'Heavy'
  height: number
  weight: number
  isCustom?: boolean
  thumbnail?: string | null
}

export interface AudioTrackItem {
  id: string
  name: string
  duration: number
  audioUrl?: string
  dialogueText?: string
  visemes?: VisemeFrame[]
  volume: number
  muted: boolean
}

export interface PropItem {
  id: string
  name: string
  type: string
  icon: string
  visible: boolean
  locked: boolean
}

export interface SceneItem {
  id: number
  name: string
}

export interface SceneState {
  selectedId: number | null
  keyframesByCharacter: Record<number, Keyframe[]>
  addedIds: number[]
  lockedIds: number[]
  audioTracks?: AudioTrackItem[]
}

export interface ExportPreset {
  id: string
  name: string
  aspectRatio: string
  width: number
  height: number
  fps: number
  icon: string
  description: string
  category: 'social' | 'manga' | 'video'
}

export interface HistoryEntry {
  description: string
  state: {
    selectedId: number | null
    addedIds: number[]
    lockedIds: number[]
    keyframesByCharacter: Record<number, Keyframe[]>
  }
}
