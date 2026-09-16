/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InterpolationType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'step'

export interface KeyframeTangent {
  x: number // time delta relative to keyframe frame
  y: number // value delta
}

export interface AnimationKeyframe<T = any> {
  id: string
  frame: number
  value: T
  interpolation: InterpolationType
  inTangent?: KeyframeTangent
  outTangent?: KeyframeTangent
  selected?: boolean
}

export type ClipType = 
  | 'idle' 
  | 'walk' 
  | 'run' 
  | 'jump' 
  | 'attack' 
  | 'dance' 
  | 'talk' 
  | 'wave' 
  | 'sit'
  | 'custom'

export interface AnimationClip {
  id: string
  name: string
  type: ClipType
  startFrame: number
  durationFrames: number
  speed: number
  blendWeight: number
  loop: boolean
  color?: string
}

export type TrackPropertyType = 
  | 'transform'
  | 'position'
  | 'rotation'
  | 'scale'
  | 'pose'
  | 'boneRotation'
  | 'expression'
  | 'clip'
  | 'cameraPosition'
  | 'cameraTarget'
  | 'cameraFov'
  | 'lightIntensity'
  | 'lightColor'
  | 'audioVolume'
  | 'audio'

export interface AnimationTrack {
  id: string
  name: string
  targetId: string // entity ID (character instance, camera shot, prop, light, etc.)
  targetName: string
  targetType: 'character' | 'camera' | 'light' | 'prop' | 'audio'
  property: TrackPropertyType
  subProperty?: string // e.g. bone name ('head', 'leftUpperArm') or expression ('happy', 'aa', 'blink')
  expanded?: boolean
  muted?: boolean
  locked?: boolean
  solo?: boolean
  color?: string
  keyframes: AnimationKeyframe<any>[]
  clips?: AnimationClip[]
  parentId?: string // For track hierarchy
}

export interface CameraCut {
  id: string
  cameraShotId: string
  cameraName: string
  startFrame: number
  durationFrames: number
  transition: 'cut' | 'dissolve'
  color?: string
}

export type MarkerCategory = 'dialogue' | 'action' | 'camera' | 'expression' | 'event'

export interface TimelineMarker {
  id: string
  frame: number
  label: string
  color: string
  category: MarkerCategory
}

export interface AudioClip {
  id: string
  name: string
  type: 'voice' | 'music' | 'sfx' | 'ambient'
  startFrame: number
  durationFrames: number
  volume: number
  pan: number
  fadeInFrames: number
  fadeOutFrames: number
  muted: boolean
  solo: boolean
  waveform: number[]
  audioUrl?: string
  dialogueText?: string
  phonemes?: { frame: number; viseme: string; weight: number }[]
}

export type TimelineViewMode = 'timeline' | 'graph' | 'dopesheet'
export type RulerUnit = 'frames' | 'seconds' | 'timecode'

export interface AnimationProject {
  id: string
  name: string
  sceneName?: string
  fps: number // 24, 30, 60
  totalFrames: number // e.g. 120 or 240
  currentFrame: number
  isPlaying: boolean
  isLooping: boolean
  playbackSpeed?: number // 0.25, 0.5, 1, 1.5, 2
  inPoint: number
  outPoint: number
  selectedTrackId?: string
  selectedKeyframeIds: string[]
  tracks: AnimationTrack[]
  cameraCuts: CameraCut[]
  markers: TimelineMarker[]
  audioClips: AudioClip[]
  zoom: number // pixels per frame (e.g. 8 to 60)
  scrollX: number // scroll offset in pixels
  mode: TimelineViewMode
  autoKeyframe: boolean
  snapToFrames: boolean
  magnetSnapping?: boolean
  rulerUnit?: RulerUnit
  activeViewCameraId?: string | null // Camera used for playback view
}

export interface RenderExportSettings {
  resolution: '1920x1080' | '1080x1920' | '1280x720' | '3840x2160' | 'custom'
  width: number
  height: number
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5'
  fps: 24 | 30 | 60
  format: 'webm' | 'mp4' | 'png_sequence'
  quality: 'draft' | 'preview' | 'high' | 'ultra'
  range: 'all' | 'in_out' | 'custom'
  startFrame: number
  endFrame: number
  includeAudio: boolean
  transparentBg: boolean
  motionBlur: boolean
  antiAliasing: boolean
  shadows: boolean
}
