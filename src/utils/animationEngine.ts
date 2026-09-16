/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AnimationKeyframe, 
  InterpolationType, 
  AnimationTrack, 
  AnimationClip,
  AnimationProject,
  CameraCut,
  TimelineMarker,
  AudioClip
} from '../types/animation'
import { POSE_PRESETS, VRMAvatarState } from './vrmManager'
import { SceneCharacterInstance } from '../types/scene'

// ==========================================
// 1. Interpolation & Easing Math
// ==========================================

export function easeInQuad(t: number): number {
  return t * t
}

export function easeOutQuad(t: number): number {
  return t * (2 - t)
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function easeInCubic(t: number): number {
  return t * t * t
}

export function easeOutCubic(t: number): number {
  return (--t) * t * t + 1
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}

export function evaluateEasing(t: number, interpolation: InterpolationType): number {
  const clamped = Math.max(0, Math.min(1, t))
  switch (interpolation) {
    case 'linear':
      return clamped
    case 'easeIn':
      return easeInCubic(clamped)
    case 'easeOut':
      return easeOutCubic(clamped)
    case 'easeInOut':
      return easeInOutCubic(clamped)
    case 'step':
      return clamped >= 1 ? 1 : 0
    default:
      return clamped
  }
}

// Linear number interpolation
export function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Vector3 interpolation [x, y, z]
export function lerpVec3(
  a: [number, number, number], 
  b: [number, number, number], 
  t: number
): [number, number, number] {
  return [
    lerpNumber(a[0], b[0], t),
    lerpNumber(a[1], b[1], t),
    lerpNumber(a[2], b[2], t)
  ]
}

// Bone Rotations dictionary interpolation
export function lerpBoneRotations(
  a: Record<string, [number, number, number]>,
  b: Record<string, [number, number, number]>,
  t: number
): Record<string, [number, number, number]> {
  const result: Record<string, [number, number, number]> = { ...a }
  const allKeys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
  
  for (const key of allKeys) {
    const rotA = a?.[key] || [0, 0, 0]
    const rotB = b?.[key] || [0, 0, 0]
    result[key] = lerpVec3(rotA, rotB, t)
  }
  return result
}

// Expression dictionary interpolation
export function lerpExpressions(
  a: Record<string, number>,
  b: Record<string, number>,
  t: number
): Record<string, number> {
  const result: Record<string, number> = { ...a }
  const allKeys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
  
  for (const key of allKeys) {
    const valA = a?.[key] ?? 0
    const valB = b?.[key] ?? 0
    result[key] = Math.max(0, Math.min(1, lerpNumber(valA, valB, t)))
  }
  return result
}

// ==========================================
// 2. Keyframe Track Sampling
// ==========================================

export function sampleTrackValue<T = any>(
  keyframes: AnimationKeyframe<T>[],
  frame: number,
  defaultValue: T,
  interpolator: (a: T, b: T, t: number) => T = (a, b, t) => (t >= 1 ? b : a)
): T {
  if (!keyframes || keyframes.length === 0) return defaultValue
  if (keyframes.length === 1) return keyframes[0].value

  // Sort by frame
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame)

  // Before first keyframe
  if (frame <= sorted[0].frame) {
    return sorted[0].value
  }

  // After last keyframe
  if (frame >= sorted[sorted.length - 1].frame) {
    return sorted[sorted.length - 1].value
  }

  // Find surrounding keyframe bracket
  for (let i = 0; i < sorted.length - 1; i++) {
    const k0 = sorted[i]
    const k1 = sorted[i + 1]

    if (frame >= k0.frame && frame <= k1.frame) {
      if (k1.frame === k0.frame) return k0.value
      const rawT = (frame - k0.frame) / (k1.frame - k0.frame)
      const easedT = evaluateEasing(rawT, k0.interpolation || 'easeInOut')
      return interpolator(k0.value, k1.value, easedT)
    }
  }

  return defaultValue
}

// ==========================================
// 3. Procedural Animation Clips for VRM
// ==========================================

export interface ProceduralPoseResult {
  boneRotations: Record<string, [number, number, number]>
  expressions: Record<string, number>
  rootOffset: [number, number, number] // [x, y, z] relative offset
}

export function sampleAnimationClip(
  clip: AnimationClip,
  frame: number,
  baseState?: VRMAvatarState
): ProceduralPoseResult | null {
  if (!clip || !clip.type || frame < clip.startFrame || frame > clip.startFrame + clip.durationFrames) {
    return null
  }

  const localFrame = frame - clip.startFrame
  const progress = localFrame / Math.max(1, clip.durationFrames)
  const timeSec = (localFrame / 30) * (clip.speed || 1.0)
  const w = clip.blendWeight ?? 1.0

  const boneRotations: Record<string, [number, number, number]> = {}
  const expressions: Record<string, number> = {}
  let rootOffset: [number, number, number] = [0, 0, 0]

  switch (clip.type) {
    case 'idle': {
      // Natural subtle breathing and balance shift
      const breath = Math.sin(timeSec * 2.2) * 1.5 * w
      const sway = Math.sin(timeSec * 1.1) * 1.0 * w
      boneRotations.spine = [2 + breath, sway * 0.5, 0]
      boneRotations.chest = [-1 + breath * 0.7, 0, 0]
      boneRotations.neck = [1, -sway * 0.4, 0]
      boneRotations.head = [breath * -0.5, sway * 0.6, 0]
      boneRotations.leftUpperArm = [0, 0, -68 - breath * 0.5]
      boneRotations.rightUpperArm = [0, 0, 68 + breath * 0.5]
      rootOffset = [0, Math.sin(timeSec * 2.2) * 0.006 * w, 0]
      break
    }

    case 'walk': {
      // Natural walking cycle: legs swinging, pelvis bouncing, arms counter-swinging
      const walkFreq = 5.2
      const phase = timeSec * walkFreq
      const legSwing = Math.sin(phase) * 28 * w
      const kneeBendLeft = Math.max(0, Math.sin(phase + Math.PI) * 38 * w)
      const kneeBendRight = Math.max(0, Math.sin(phase) * 38 * w)
      const armSwing = Math.sin(phase) * 22 * w
      const bob = Math.abs(Math.sin(phase)) * 0.04 * w

      boneRotations.hips = [0, Math.sin(phase) * 3 * w, Math.sin(phase) * 2 * w]
      boneRotations.spine = [4, -Math.sin(phase) * 2 * w, 0]
      boneRotations.leftUpperLeg = [legSwing, 0, -2]
      boneRotations.rightUpperLeg = [-legSwing, 0, 2]
      boneRotations.leftLowerLeg = [kneeBendLeft, 0, 0]
      boneRotations.rightLowerLeg = [kneeBendRight, 0, 0]
      boneRotations.leftUpperArm = [-armSwing, 0, -65]
      boneRotations.rightUpperArm = [armSwing, 0, 65]
      boneRotations.leftLowerArm = [-15 + Math.abs(armSwing) * 0.5, 10, 0]
      boneRotations.rightLowerArm = [-15 + Math.abs(armSwing) * 0.5, -10, 0]
      rootOffset = [0, -bob, 0]
      break
    }

    case 'run': {
      // Energetic running cycle: higher frequency, forward lean, high knees
      const runFreq = 8.0
      const phase = timeSec * runFreq
      const legSwing = Math.sin(phase) * 44 * w
      const kneeBendLeft = Math.max(0, Math.sin(phase + Math.PI) * 65 * w)
      const kneeBendRight = Math.max(0, Math.sin(phase) * 65 * w)
      const armSwing = Math.sin(phase) * 45 * w
      const bob = Math.abs(Math.sin(phase)) * 0.08 * w

      boneRotations.hips = [8, Math.sin(phase) * 5 * w, 0]
      boneRotations.spine = [12, -Math.sin(phase) * 4 * w, 0]
      boneRotations.chest = [4, 0, 0]
      boneRotations.leftUpperLeg = [legSwing, 0, -3]
      boneRotations.rightUpperLeg = [-legSwing, 0, 3]
      boneRotations.leftLowerLeg = [kneeBendLeft, 0, 0]
      boneRotations.rightLowerLeg = [kneeBendRight, 0, 0]
      boneRotations.leftUpperArm = [-armSwing, 0, -55]
      boneRotations.rightUpperArm = [armSwing, 0, 55]
      boneRotations.leftLowerArm = [-55, 15, 0]
      boneRotations.rightLowerArm = [-55, -15, 0]
      rootOffset = [0, -bob, 0]
      break
    }

    case 'wave': {
      // Friendly waving arm with happy smile
      const wavePhase = timeSec * 7.5
      const waveArm = Math.sin(wavePhase) * 18 * w

      boneRotations.rightUpperArm = [-30, -30, 115]
      boneRotations.rightLowerArm = [-85, 20 + waveArm, 0]
      boneRotations.rightHand = [0, waveArm * 0.8, 0]
      boneRotations.leftUpperArm = [0, 0, -68]
      boneRotations.head = [-4, -8, 2]
      expressions.happy = 0.85 * w
      expressions.blink = Math.sin(timeSec * 3) > 0.8 ? 0.9 * w : 0
      break
    }

    case 'talk': {
      // Natural speech gestures: head tilts, open hand, mouth viseme modulation
      const speechPhase = timeSec * 6.5
      const gesture = Math.sin(timeSec * 2.0) * 14 * w
      const mouthOpen = Math.max(0, Math.sin(speechPhase) * 0.75 + Math.cos(speechPhase * 1.8) * 0.25) * w

      boneRotations.leftUpperArm = [-20 + gesture * 0.4, 10, -50]
      boneRotations.leftLowerArm = [-45 + gesture, 15, 0]
      boneRotations.leftHand = [-10, gesture * 0.5, 0]
      boneRotations.spine = [2, Math.sin(timeSec * 1.5) * 3 * w, 0]
      boneRotations.head = [Math.sin(timeSec * 2.8) * 4 * w, Math.cos(timeSec * 1.4) * 6 * w, 0]
      expressions.aa = mouthOpen * 0.8
      expressions.ih = Math.max(0, Math.cos(speechPhase) * 0.5) * w
      expressions.happy = 0.4 * w
      break
    }

    case 'dance': {
      // Rhythmic pop groove
      const dancePhase = timeSec * 5.5
      const hipSway = Math.sin(dancePhase) * 12 * w
      const armBounce = Math.cos(dancePhase) * 25 * w

      boneRotations.hips = [0, 0, hipSway]
      boneRotations.spine = [4, Math.sin(dancePhase * 0.5) * 8 * w, -hipSway * 0.6]
      boneRotations.leftUpperArm = [-armBounce, 20, -75]
      boneRotations.rightUpperArm = [armBounce, -20, 75]
      boneRotations.leftLowerArm = [-35, 15, 0]
      boneRotations.rightLowerArm = [-35, -15, 0]
      boneRotations.head = [0, Math.sin(dancePhase) * 6 * w, -hipSway * 0.4]
      expressions.happy = 0.9 * w
      rootOffset = [0, Math.abs(Math.sin(dancePhase)) * 0.05 * w, 0]
      break
    }

    case 'jump': {
      // Anticipation -> Leap -> Landing
      const jumpPhase = (progress % 1.0) * 2 * Math.PI
      const height = Math.max(0, Math.sin(jumpPhase)) * 0.35 * w

      if (progress < 0.25) {
        // Crouch anticipation
        const crouch = (progress / 0.25)
        boneRotations.leftUpperLeg = [-35 * crouch * w, 0, -2]
        boneRotations.rightUpperLeg = [-35 * crouch * w, 0, 2]
        boneRotations.leftLowerLeg = [60 * crouch * w, 0, 0]
        boneRotations.rightLowerLeg = [60 * crouch * w, 0, 0]
        rootOffset = [0, -0.15 * crouch * w, 0]
      } else if (progress < 0.75) {
        // Airborne
        boneRotations.leftUpperLeg = [10 * w, 0, -5]
        boneRotations.rightUpperLeg = [-10 * w, 0, 5]
        boneRotations.leftUpperArm = [-20, 0, -110 * w]
        boneRotations.rightUpperArm = [-20, 0, 110 * w]
        rootOffset = [0, height, 0]
      } else {
        // Cushion landing
        const land = (progress - 0.75) / 0.25
        boneRotations.leftLowerLeg = [30 * (1 - land) * w, 0, 0]
        boneRotations.rightLowerLeg = [30 * (1 - land) * w, 0, 0]
        rootOffset = [0, -0.05 * (1 - land) * w, 0]
      }
      break
    }

    case 'attack': {
      // Dynamic sword slash / punch
      const attackPhase = progress * Math.PI
      const thrust = Math.sin(attackPhase) * w

      boneRotations.spine = [8 * thrust, -20 * thrust, 0]
      boneRotations.rightUpperArm = [-70 * thrust, -35 * thrust, 45]
      boneRotations.rightLowerArm = [-20 * thrust, 0, 0]
      boneRotations.leftUpperArm = [20 * thrust, 0, -65]
      boneRotations.leftUpperLeg = [25 * thrust, 0, -2]
      boneRotations.rightUpperLeg = [-20 * thrust, 0, 2]
      expressions.angry = 0.7 * w
      rootOffset = [0, 0, 0.15 * thrust]
      break
    }

    case 'sit': {
      // Natural relaxed sitting posture
      const breath = Math.sin(timeSec * 2.0) * 1.0 * w
      boneRotations.spine = [-5 + breath, 0, 0]
      boneRotations.leftUpperLeg = [-85 * w, 0, -4]
      boneRotations.rightUpperLeg = [-85 * w, 0, 4]
      boneRotations.leftLowerLeg = [85 * w, 0, 0]
      boneRotations.rightLowerLeg = [85 * w, 0, 0]
      boneRotations.leftUpperArm = [0, 0, -65]
      boneRotations.rightUpperArm = [0, 0, 65]
      boneRotations.leftLowerArm = [-25, 10, 0]
      boneRotations.rightLowerArm = [-25, -10, 0]
      rootOffset = [0, -0.55 * w, 0]
      break
    }

    default:
      break
  }

  return { boneRotations, expressions, rootOffset }
}

// ==========================================
// 4. Lip Sync Analyzer & Viseme Generator
// ==========================================

export interface VisemePhoneme {
  frame: number
  viseme: 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | 'blink' | 'smile'
  weight: number
}

export function generateLipSyncFromText(
  text: string, 
  startFrame: number, 
  fps: number = 30
): VisemePhoneme[] {
  const result: VisemePhoneme[] = []
  if (!text) return result

  // Approximate phonetic timing: average 4 phonemes per second
  const words = text.toLowerCase().split(/\s+/)
  let currentFrame = startFrame

  for (const word of words) {
    const letters = word.split('')
    for (let i = 0; i < letters.length; i++) {
      const char = letters[i]
      let viseme: 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | null = null

      if (['a', 'h'].includes(char)) viseme = 'aa'
      else if (['e', 'y'].includes(char)) viseme = 'ee'
      else if (['i', 'j'].includes(char)) viseme = 'ih'
      else if (['o'].includes(char)) viseme = 'oh'
      else if (['u', 'w'].includes(char)) viseme = 'ou'

      if (viseme) {
        result.push({
          frame: currentFrame,
          viseme,
          weight: 0.75 + Math.random() * 0.25
        })
      }
      currentFrame += Math.round(fps * 0.08) // ~80ms per letter
    }
    // Small pause between words
    currentFrame += Math.round(fps * 0.12)
  }

  return result
}

// ==========================================
// 5. Empty Initial Animation Project
// ==========================================

export function createEmptyAnimationProject(name = 'Untitled Project'): AnimationProject {
  return {
    id: `project_${Date.now()}`,
    name,
    fps: 30,
    totalFrames: 120,
    currentFrame: 0,
    isPlaying: false,
    isLooping: true,
    inPoint: 0,
    outPoint: 120,
    selectedTrackId: null,
    selectedKeyframeIds: [],
    tracks: [],
    cameraCuts: [],
    markers: [],
    audioClips: [],
    zoom: 18,
    scrollX: 0,
    mode: 'timeline',
    autoKeyframe: true,
    snapToFrames: true
  }
}

// ==========================================
// 6. Project Evaluation Engine
// ==========================================

export interface EvaluatedSceneState {
  characters: Map<string, {
    position?: [number, number, number]
    rotation?: [number, number, number]
    scale?: [number, number, number]
    boneRotations?: Record<string, [number, number, number]>
    expressions?: Record<string, number>
  }>
  camera: {
    activeShotId?: string
    fov?: number
    position?: [number, number, number]
    target?: [number, number, number]
  }
}

export function evaluateAnimationAtFrame(
  project: AnimationProject,
  frame: number,
  baseCharacters: SceneCharacterInstance[] = []
): EvaluatedSceneState {
  const result: EvaluatedSceneState = {
    characters: new Map(),
    camera: {}
  }

  // 1. Evaluate Camera Cuts
  if (project.cameraCuts && project.cameraCuts.length > 0) {
    const activeCut = project.cameraCuts.find(
      cut => frame >= cut.startFrame && frame < cut.startFrame + cut.durationFrames
    )
    if (activeCut) {
      result.camera.activeShotId = activeCut.cameraShotId
    } else {
      // Default to last cut if past end or first
      const last = project.cameraCuts[project.cameraCuts.length - 1]
      if (last && frame >= last.startFrame) {
        result.camera.activeShotId = last.cameraShotId
      }
    }
  }

  // 2. Initialize character states from base
  for (const char of baseCharacters) {
    result.characters.set(char.id, {
      position: [...char.position],
      rotation: [...char.rotation],
      scale: [...char.scale],
      boneRotations: { ...(char.state?.boneRotations || {}) },
      expressions: { ...(char.state?.expressions || {}) }
    })
  }

  // 3. Process each track
  for (const track of project.tracks) {
    if (track.muted) continue

    if (track.targetType === 'character') {
      let charState = result.characters.get(track.targetId)
      if (!charState) {
        charState = {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          boneRotations: {},
          expressions: {}
        }
        result.characters.set(track.targetId, charState)
      }

      // Position track
      if (track.property === 'position' && track.keyframes.length > 0) {
        charState.position = sampleTrackValue(
          track.keyframes,
          frame,
          charState.position || [0, 0, 0],
          lerpVec3
        )
      }

      // Rotation track
      if (track.property === 'rotation' && track.keyframes.length > 0) {
        charState.rotation = sampleTrackValue(
          track.keyframes,
          frame,
          charState.rotation || [0, 0, 0],
          lerpVec3
        )
      }

      // Scale track
      if (track.property === 'scale' && track.keyframes.length > 0) {
        charState.scale = sampleTrackValue(
          track.keyframes,
          frame,
          charState.scale || [1, 1, 1],
          lerpVec3
        )
      }

      // Expression weight track
      if (track.property === 'expression' && track.subProperty && track.keyframes.length > 0) {
        const val = sampleTrackValue(
          track.keyframes,
          frame,
          charState.expressions?.[track.subProperty] || 0,
          lerpNumber
        )
        if (!charState.expressions) charState.expressions = {}
        charState.expressions[track.subProperty] = val
      }

      // Specific bone rotation track
      if (track.property === 'boneRotation' && track.subProperty && track.keyframes.length > 0) {
        const val = sampleTrackValue(
          track.keyframes,
          frame,
          charState.boneRotations?.[track.subProperty] || [0, 0, 0],
          lerpVec3
        )
        if (!charState.boneRotations) charState.boneRotations = {}
        charState.boneRotations[track.subProperty] = val
      }

      // Action Clips track
      if (track.property === 'clip' && track.clips && track.clips.length > 0) {
        for (const clip of track.clips) {
          const sample = sampleAnimationClip(clip, frame)
          if (sample) {
            // Blend bone rotations
            if (!charState.boneRotations) charState.boneRotations = {}
            for (const [bone, rot] of Object.entries(sample.boneRotations)) {
              charState.boneRotations[bone] = rot
            }
            // Blend expressions
            if (!charState.expressions) charState.expressions = {}
            for (const [exp, weight] of Object.entries(sample.expressions)) {
              charState.expressions[exp] = Math.max(charState.expressions[exp] || 0, weight)
            }
            // Apply root position offset
            if (sample.rootOffset && charState.position) {
              charState.position = [
                charState.position[0] + sample.rootOffset[0],
                charState.position[1] + sample.rootOffset[1],
                charState.position[2] + sample.rootOffset[2]
              ]
            }
          }
        }
      }
    }

    // Camera FOV
    if (track.targetType === 'camera' && track.property === 'cameraFov' && track.keyframes.length > 0) {
      result.camera.fov = sampleTrackValue(
        track.keyframes,
        frame,
        result.camera.fov || 32,
        lerpNumber
      )
    }
  }

  return result
}
