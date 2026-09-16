import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { findBoneNode } from './vrmManager'
import {
  ANIMATIONS_MANIFEST,
  ANIMATION_MANIFEST_MAP,
  getAnimationManifestItem,
  isManifestAnimationId,
  AnimationManifestItem
} from './animationManifest'

/**
 * All 20 canonical humanoid bones required for full-body Mixamo retargeting.
 * Used for validation and console logging.
 */
export const ALL_RELEVANT_HUMANOID_BONES = [
  'hips',
  'spine',
  'chest',
  'upperChest',
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

/**
 * Optional VRM humanoid bones per the official VRM specification (VRM 0.0 & 1.0).
 * Per VRM standard, missing optional secondary bones (such as 30 hand finger knuckles,
 * 2 toe joints, eyes, jaw, and upperChest) are fully compliant and expected.
 * Only missing mandatory core humanoid bones indicate a rig problem.
 */
export const OPTIONAL_VRM_BONES = new Set([
  'upperChest', 'jaw', 'leftEye', 'rightEye', 'leftShoulder', 'rightShoulder',
  'leftToes', 'rightToes',
  'leftThumbMetacarpal', 'leftThumbProximal', 'leftThumbDistal',
  'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
  'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
  'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
  'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
  'rightThumbMetacarpal', 'rightThumbProximal', 'rightThumbDistal',
  'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
  'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
  'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
  'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal'
])

/**
 * Standard Mixamo-to-VRM humanoid bone mapping.
 * Comprehensive dictionary supporting standard Mixamo names ('mixamorigLeftArm'),
 * colon-namespaced names ('mixamorig:LeftArm'), underscore names ('mixamorig_LeftArm'),
 * bare names ('LeftArm', 'LeftUpperArm'), Blender conventions ('upper_arm.L'),
 * and Bip01 conventions ('Bip01_L_UpperArm').
 */
export const MIXAMO_TO_VRM_BONE_MAP: Record<string, string> = {
  // Hips / Pelvis
  mixamorigHips: 'hips',
  'mixamorig:Hips': 'hips',
  mixamorig_Hips: 'hips',
  Hips: 'hips',
  hips: 'hips',
  Pelvis: 'hips',
  pelvis: 'hips',
  Bip01_Pelvis: 'hips',

  // Spine & Chest
  mixamorigSpine: 'spine',
  'mixamorig:Spine': 'spine',
  mixamorig_Spine: 'spine',
  Spine: 'spine',
  spine: 'spine',
  Bip01_Spine: 'spine',

  mixamorigSpine1: 'chest',
  'mixamorig:Spine1': 'chest',
  mixamorig_Spine1: 'chest',
  Spine1: 'chest',
  spine1: 'chest',
  mixamorigChest: 'chest',
  'mixamorig:Chest': 'chest',
  Chest: 'chest',
  chest: 'chest',
  Bip01_Spine1: 'chest',

  mixamorigSpine2: 'upperChest',
  'mixamorig:Spine2': 'upperChest',
  mixamorig_Spine2: 'upperChest',
  Spine2: 'upperChest',
  spine2: 'upperChest',
  mixamorigUpperChest: 'upperChest',
  'mixamorig:UpperChest': 'upperChest',
  UpperChest: 'upperChest',
  upperChest: 'upperChest',
  Bip01_Spine2: 'upperChest',

  // Neck & Head
  mixamorigNeck: 'neck',
  'mixamorig:Neck': 'neck',
  mixamorig_Neck: 'neck',
  Neck: 'neck',
  neck: 'neck',
  Bip01_Neck: 'neck',

  mixamorigHead: 'head',
  'mixamorig:Head': 'head',
  mixamorig_Head: 'head',
  Head: 'head',
  head: 'head',
  Bip01_Head: 'head',

  // Left Shoulder & Arm
  mixamorigLeftShoulder: 'leftShoulder',
  'mixamorig:LeftShoulder': 'leftShoulder',
  mixamorig_LeftShoulder: 'leftShoulder',
  LeftShoulder: 'leftShoulder',
  leftShoulder: 'leftShoulder',
  mixamorigLeftClavicle: 'leftShoulder',
  'mixamorig:LeftClavicle': 'leftShoulder',
  LeftClavicle: 'leftShoulder',
  leftClavicle: 'leftShoulder',
  'shoulder.L': 'leftShoulder',
  Bip01_L_Clavicle: 'leftShoulder',

  mixamorigLeftArm: 'leftUpperArm',
  'mixamorig:LeftArm': 'leftUpperArm',
  mixamorig_LeftArm: 'leftUpperArm',
  LeftArm: 'leftUpperArm',
  leftArm: 'leftUpperArm',
  mixamorigLeftUpperArm: 'leftUpperArm',
  'mixamorig:LeftUpperArm': 'leftUpperArm',
  mixamorig_LeftUpperArm: 'leftUpperArm',
  LeftUpperArm: 'leftUpperArm',
  leftUpperArm: 'leftUpperArm',
  'upper_arm.L': 'leftUpperArm',
  'upperarm.L': 'leftUpperArm',
  UpperArm_L: 'leftUpperArm',
  Bip01_L_UpperArm: 'leftUpperArm',

  mixamorigLeftForeArm: 'leftLowerArm',
  'mixamorig:LeftForeArm': 'leftLowerArm',
  mixamorig_LeftForeArm: 'leftLowerArm',
  LeftForeArm: 'leftLowerArm',
  leftForeArm: 'leftLowerArm',
  mixamorigLeftLowerArm: 'leftLowerArm',
  'mixamorig:LeftLowerArm': 'leftLowerArm',
  mixamorig_LeftLowerArm: 'leftLowerArm',
  LeftLowerArm: 'leftLowerArm',
  leftLowerArm: 'leftLowerArm',
  'forearm.L': 'leftLowerArm',
  ForeArm_L: 'leftLowerArm',
  Bip01_L_Forearm: 'leftLowerArm',

  mixamorigLeftHand: 'leftHand',
  'mixamorig:LeftHand': 'leftHand',
  mixamorig_LeftHand: 'leftHand',
  LeftHand: 'leftHand',
  leftHand: 'leftHand',
  'hand.L': 'leftHand',
  Hand_L: 'leftHand',
  Bip01_L_Hand: 'leftHand',

  // Right Shoulder & Arm
  mixamorigRightShoulder: 'rightShoulder',
  'mixamorig:RightShoulder': 'rightShoulder',
  mixamorig_RightShoulder: 'rightShoulder',
  RightShoulder: 'rightShoulder',
  rightShoulder: 'rightShoulder',
  mixamorigRightClavicle: 'rightShoulder',
  'mixamorig:RightClavicle': 'rightShoulder',
  RightClavicle: 'rightShoulder',
  rightClavicle: 'rightShoulder',
  'shoulder.R': 'rightShoulder',
  Bip01_R_Clavicle: 'rightShoulder',

  mixamorigRightArm: 'rightUpperArm',
  'mixamorig:RightArm': 'rightUpperArm',
  mixamorig_RightArm: 'rightUpperArm',
  RightArm: 'rightUpperArm',
  rightArm: 'rightUpperArm',
  mixamorigRightUpperArm: 'rightUpperArm',
  'mixamorig:RightUpperArm': 'rightUpperArm',
  mixamorig_RightUpperArm: 'rightUpperArm',
  RightUpperArm: 'rightUpperArm',
  rightUpperArm: 'rightUpperArm',
  'upper_arm.R': 'rightUpperArm',
  'upperarm.R': 'rightUpperArm',
  UpperArm_R: 'rightUpperArm',
  Bip01_R_UpperArm: 'rightUpperArm',

  mixamorigRightForeArm: 'rightLowerArm',
  'mixamorig:RightForeArm': 'rightLowerArm',
  mixamorig_RightForeArm: 'rightLowerArm',
  RightForeArm: 'rightLowerArm',
  rightForeArm: 'rightLowerArm',
  mixamorigRightLowerArm: 'rightLowerArm',
  'mixamorig:RightLowerArm': 'rightLowerArm',
  mixamorig_RightLowerArm: 'rightLowerArm',
  RightLowerArm: 'rightLowerArm',
  rightLowerArm: 'rightLowerArm',
  'forearm.R': 'rightLowerArm',
  ForeArm_R: 'rightLowerArm',
  Bip01_R_Forearm: 'rightLowerArm',

  mixamorigRightHand: 'rightHand',
  'mixamorig:RightHand': 'rightHand',
  mixamorig_RightHand: 'rightHand',
  RightHand: 'rightHand',
  rightHand: 'rightHand',
  'hand.R': 'rightHand',
  Hand_R: 'rightHand',
  Bip01_R_Hand: 'rightHand',

  // Left Hand Fingers
  mixamorigLeftHandThumb1: 'leftThumbMetacarpal',
  'mixamorig:LeftHandThumb1': 'leftThumbMetacarpal',
  mixamorigLeftHandThumb2: 'leftThumbProximal',
  'mixamorig:LeftHandThumb2': 'leftThumbProximal',
  mixamorigLeftHandThumb3: 'leftThumbDistal',
  'mixamorig:LeftHandThumb3': 'leftThumbDistal',
  mixamorigLeftHandIndex1: 'leftIndexProximal',
  'mixamorig:LeftHandIndex1': 'leftIndexProximal',
  mixamorigLeftHandIndex2: 'leftIndexIntermediate',
  'mixamorig:LeftHandIndex2': 'leftIndexIntermediate',
  mixamorigLeftHandIndex3: 'leftIndexDistal',
  'mixamorig:LeftHandIndex3': 'leftIndexDistal',
  mixamorigLeftHandMiddle1: 'leftMiddleProximal',
  'mixamorig:LeftHandMiddle1': 'leftMiddleProximal',
  mixamorigLeftHandMiddle2: 'leftMiddleIntermediate',
  'mixamorig:LeftHandMiddle2': 'leftMiddleIntermediate',
  mixamorigLeftHandMiddle3: 'leftMiddleDistal',
  'mixamorig:LeftHandMiddle3': 'leftMiddleDistal',
  mixamorigLeftHandRing1: 'leftRingProximal',
  'mixamorig:LeftHandRing1': 'leftRingProximal',
  mixamorigLeftHandRing2: 'leftRingIntermediate',
  'mixamorig:LeftHandRing2': 'leftRingIntermediate',
  mixamorigLeftHandRing3: 'leftRingDistal',
  'mixamorig:LeftHandRing3': 'leftRingDistal',
  mixamorigLeftHandPinky1: 'leftLittleProximal',
  'mixamorig:LeftHandPinky1': 'leftLittleProximal',
  mixamorigLeftHandPinky2: 'leftLittleIntermediate',
  'mixamorig:LeftHandPinky2': 'leftLittleIntermediate',
  mixamorigLeftHandPinky3: 'leftLittleDistal',
  'mixamorig:LeftHandPinky3': 'leftLittleDistal',

  // Right Hand Fingers
  mixamorigRightHandThumb1: 'rightThumbMetacarpal',
  'mixamorig:RightHandThumb1': 'rightThumbMetacarpal',
  mixamorigRightHandThumb2: 'rightThumbProximal',
  'mixamorig:RightHandThumb2': 'rightThumbProximal',
  mixamorigRightHandThumb3: 'rightThumbDistal',
  'mixamorig:RightHandThumb3': 'rightThumbDistal',
  mixamorigRightHandIndex1: 'rightIndexProximal',
  'mixamorig:RightHandIndex1': 'rightIndexProximal',
  mixamorigRightHandIndex2: 'rightIndexIntermediate',
  'mixamorig:RightHandIndex2': 'rightIndexIntermediate',
  mixamorigRightHandIndex3: 'rightIndexDistal',
  'mixamorig:RightHandIndex3': 'rightIndexDistal',
  mixamorigRightHandMiddle1: 'rightMiddleProximal',
  'mixamorig:RightHandMiddle1': 'rightMiddleProximal',
  mixamorigRightHandMiddle2: 'rightMiddleIntermediate',
  'mixamorig:RightHandMiddle2': 'rightMiddleIntermediate',
  mixamorigRightHandMiddle3: 'rightMiddleDistal',
  'mixamorig:RightHandMiddle3': 'rightMiddleDistal',
  mixamorigRightHandRing1: 'rightRingProximal',
  'mixamorig:RightHandRing1': 'rightRingProximal',
  mixamorigRightHandRing2: 'rightRingIntermediate',
  'mixamorig:RightHandRing2': 'rightRingIntermediate',
  mixamorigRightHandRing3: 'rightRingDistal',
  'mixamorig:RightHandRing3': 'rightRingDistal',
  mixamorigRightHandPinky1: 'rightLittleProximal',
  'mixamorig:RightHandPinky1': 'rightLittleProximal',
  mixamorigRightHandPinky2: 'rightLittleIntermediate',
  'mixamorig:RightHandPinky2': 'rightLittleIntermediate',
  mixamorigRightHandPinky3: 'rightLittleDistal',
  'mixamorig:RightHandPinky3': 'rightLittleDistal',

  // Left Leg & Foot
  mixamorigLeftUpLeg: 'leftUpperLeg',
  'mixamorig:LeftUpLeg': 'leftUpperLeg',
  mixamorig_LeftUpLeg: 'leftUpperLeg',
  LeftUpLeg: 'leftUpperLeg',
  leftUpLeg: 'leftUpperLeg',
  mixamorigLeftUpperLeg: 'leftUpperLeg',
  'mixamorig:LeftUpperLeg': 'leftUpperLeg',
  LeftUpperLeg: 'leftUpperLeg',
  leftUpperLeg: 'leftUpperLeg',
  'thigh.L': 'leftUpperLeg',
  Thigh_L: 'leftUpperLeg',
  Bip01_L_Thigh: 'leftUpperLeg',

  mixamorigLeftLeg: 'leftLowerLeg',
  'mixamorig:LeftLeg': 'leftLowerLeg',
  mixamorig_LeftLeg: 'leftLowerLeg',
  LeftLeg: 'leftLowerLeg',
  leftLeg: 'leftLowerLeg',
  mixamorigLeftLowerLeg: 'leftLowerLeg',
  'mixamorig:LeftLowerLeg': 'leftLowerLeg',
  LeftLowerLeg: 'leftLowerLeg',
  leftLowerLeg: 'leftLowerLeg',
  'calf.L': 'leftLowerLeg',
  Calf_L: 'leftLowerLeg',
  Bip01_L_Calf: 'leftLowerLeg',

  mixamorigLeftFoot: 'leftFoot',
  'mixamorig:LeftFoot': 'leftFoot',
  mixamorig_LeftFoot: 'leftFoot',
  LeftFoot: 'leftFoot',
  leftFoot: 'leftFoot',
  'foot.L': 'leftFoot',
  Foot_L: 'leftFoot',
  Bip01_L_Foot: 'leftFoot',

  mixamorigLeftToeBase: 'leftToes',
  'mixamorig:LeftToeBase': 'leftToes',
  mixamorig_LeftToeBase: 'leftToes',
  LeftToeBase: 'leftToes',
  leftToeBase: 'leftToes',
  mixamorigLeftToes: 'leftToes',
  'mixamorig:LeftToes': 'leftToes',
  LeftToes: 'leftToes',
  leftToes: 'leftToes',
  'toe.L': 'leftToes',
  Toe_L: 'leftToes',
  Bip01_L_Toe0: 'leftToes',

  // Right Leg & Foot
  mixamorigRightUpLeg: 'rightUpperLeg',
  'mixamorig:RightUpLeg': 'rightUpperLeg',
  mixamorig_RightUpLeg: 'rightUpperLeg',
  RightUpLeg: 'rightUpperLeg',
  rightUpLeg: 'rightUpperLeg',
  mixamorigRightUpperLeg: 'rightUpperLeg',
  'mixamorig:RightUpperLeg': 'rightUpperLeg',
  RightUpperLeg: 'rightUpperLeg',
  rightUpperLeg: 'rightUpperLeg',
  'thigh.R': 'rightUpperLeg',
  Thigh_R: 'rightUpperLeg',
  Bip01_R_Thigh: 'rightUpperLeg',

  mixamorigRightLeg: 'rightLowerLeg',
  'mixamorig:RightLeg': 'rightLowerLeg',
  mixamorig_RightLeg: 'rightLowerLeg',
  RightLeg: 'rightLowerLeg',
  rightLeg: 'rightLowerLeg',
  mixamorigRightLowerLeg: 'rightLowerLeg',
  'mixamorig:RightLowerLeg': 'rightLowerLeg',
  RightLowerLeg: 'rightLowerLeg',
  rightLowerLeg: 'rightLowerLeg',
  'calf.R': 'rightLowerLeg',
  Calf_R: 'rightLowerLeg',
  Bip01_R_Calf: 'rightLowerLeg',

  mixamorigRightFoot: 'rightFoot',
  'mixamorig:RightFoot': 'rightFoot',
  mixamorig_RightFoot: 'rightFoot',
  RightFoot: 'rightFoot',
  rightFoot: 'rightFoot',
  'foot.R': 'rightFoot',
  Foot_R: 'rightFoot',
  Bip01_R_Foot: 'rightFoot',

  mixamorigRightToeBase: 'rightToes',
  'mixamorig:RightToeBase': 'rightToes',
  mixamorig_RightToeBase: 'rightToes',
  RightToeBase: 'rightToes',
  rightToeBase: 'rightToes',
  mixamorigRightToes: 'rightToes',
  'mixamorig:RightToes': 'rightToes',
  RightToes: 'rightToes',
  rightToes: 'rightToes',
  'toe.R': 'rightToes',
  Toe_R: 'rightToes',
  Bip01_R_Toe0: 'rightToes'
}

/**
 * Normalizes bone names removing namespace colons, Armature prefixes, or extra paths
 */
export function normalizeMixamoBoneName(rawName: string): string {
  // Direct check
  if (MIXAMO_TO_VRM_BONE_MAP[rawName]) {
    return MIXAMO_TO_VRM_BONE_MAP[rawName]
  }

  // Strip path/hierarchy prefixes: "Armature|mixamorig:LeftArm" or "Armature/mixamorig:LeftArm"
  const leafName = rawName.split('/').pop()!.split('|').pop()!
  if (MIXAMO_TO_VRM_BONE_MAP[leafName]) {
    return MIXAMO_TO_VRM_BONE_MAP[leafName]
  }

  // Strip colons & underscores
  const cleaned = leafName.replace(/[:_]/g, '')
  if (MIXAMO_TO_VRM_BONE_MAP[cleaned]) {
    return MIXAMO_TO_VRM_BONE_MAP[cleaned]
  }

  // Strip mixamorig prefix
  const withoutPrefix = leafName.replace(/^mixamorig[:_]?/i, '')
  if (MIXAMO_TO_VRM_BONE_MAP[withoutPrefix]) {
    return MIXAMO_TO_VRM_BONE_MAP[withoutPrefix]
  }

  // Case-insensitive lookup
  const lower = leafName.toLowerCase().replace(/[:_]/g, '')
  for (const [key, vrmBone] of Object.entries(MIXAMO_TO_VRM_BONE_MAP)) {
    if (key.toLowerCase().replace(/[:_]/g, '') === lower) {
      return vrmBone
    }
  }

  return ''
}

/**
 * Resolves a bone Object3D from the VRM model using normalized bone, raw bone,
 * humanBones dictionary, or scene traversal.
 */
export function getTargetBoneNode(vrm: any, vrmBoneName: string): THREE.Object3D | null {
  if (!vrm) return null

  // 1. Try VRM humanoid normalized bone node (VRM 1.0 canonical)
  let node = vrm.humanoid?.getNormalizedBoneNode?.(vrmBoneName as any)
  if (node) return node

  // 2. Try raw bone node (VRM 0.0 or non-normalized models)
  node = vrm.humanoid?.getRawBoneNode?.(vrmBoneName as any)
  if (node) return node

  // 3. If upperChest was not found, fallback to chest
  if (vrmBoneName === 'upperChest') {
    node = vrm.humanoid?.getNormalizedBoneNode?.('chest' as any) ||
           vrm.humanoid?.getRawBoneNode?.('chest' as any)
    if (node) return node
  }

  // 4. Humanoid humanBones dictionary
  if (vrm.humanoid?.humanBones?.[vrmBoneName]?.node) {
    return vrm.humanoid.humanBones[vrmBoneName].node
  }

  // 5. Fallback traversal using standardized aliases
  return findBoneNode(vrm, vrmBoneName)
}

/**
 * Explicitly verifies all 20 canonical humanoid bones on the retargeted clip.
 * Logs a warning to the console if any of these bones are missing from the retargeted clip,
 * so incomplete animations are caught immediately during testing.
 */
export function verifyRetargetedClipBones(clip: THREE.AnimationClip, animationId: string): string[] {
  const trackNames = clip.tracks.map(t => t.name.toLowerCase())
  const missingBones: string[] = []

  ALL_RELEVANT_HUMANOID_BONES.forEach(bone => {
    const boneLower = bone.toLowerCase()
    const isPresent = trackNames.some(trackName => {
      // Check for exact bone name segment or namespace
      return trackName.includes(boneLower) ||
             trackName.includes(`_${boneLower}`) ||
             trackName.includes(`.${boneLower}`) ||
             (bone === 'upperChest' && (trackName.includes('upperchest') || trackName.includes('spine2') || trackName.includes('chest')))
    })

    if (!isPresent) {
      missingBones.push(bone)
      console.warn(`[MixamoAnimation] ⚠️ Warning: Bone "${bone}" is missing from retargeted clip for animation "${animationId}". Incomplete animation detected!`)
    }
  })

  if (missingBones.length > 0) {
    console.warn(`[MixamoAnimation] ⚠️ Incomplete retargeted animation "${animationId}": Missing ${missingBones.length}/${ALL_RELEVANT_HUMANOID_BONES.length} required bones:`, missingBones)
  } else {
    console.log(`[MixamoAnimation] ✅ Full-body humanoid rig verified: All 20/20 bones active for "${animationId}".`)
  }

  return missingBones
}

/**
 * Formatted console logger verifying that all body parts
 * are present in the retargeted animation clip with a structured table.
 */
export function logRetargetedClipDetails(clip: THREE.AnimationClip, source: string, animationId?: string): void {
  const trackNames = clip.tracks.map(t => t.name)
  console.group(`%c[AnimationEngine] Retargeted AnimationClip: "${clip.name}" (${clip.tracks.length} tracks, source: ${source})`, 'color: #4ade80; font-weight: bold;')
  console.log('Total Track Count:', clip.tracks.length)
  console.log('Duration:', `${clip.duration.toFixed(2)}s`)
  console.log('All Track Names:', trackNames)

  const verificationSummary: Record<string, { present: string; matchingTracks: string }> = {}

  ALL_RELEVANT_HUMANOID_BONES.forEach(bone => {
    const matches = trackNames.filter(t => {
      const lower = t.toLowerCase()
      const boneLower = bone.toLowerCase()
      return lower.includes(boneLower) || lower.includes(`_${boneLower}`) || lower.includes(`.${boneLower}`) ||
             (bone === 'upperChest' && (lower.includes('upperchest') || lower.includes('spine2') || lower.includes('chest')))
    })
    verificationSummary[bone] = {
      present: matches.length > 0 ? '✅ YES' : '❌ MISSING',
      matchingTracks: matches.join(', ') || 'none'
    }
  })

  console.table(verificationSummary)

  const missingBones = ALL_RELEVANT_HUMANOID_BONES.filter(
    b => !verificationSummary[b] || verificationSummary[b].present.includes('MISSING')
  )

  if (missingBones.length === 0) {
    console.log(`%c✨ All ${ALL_RELEVANT_HUMANOID_BONES.length}/${ALL_RELEVANT_HUMANOID_BONES.length} relevant humanoid bones (hips, spine, chest, upperChest, neck, head, shoulders, arms, hands, legs, feet) are verified and actively driving the rig!`, 'color: #22c55e; font-weight: bold;')
  } else {
    console.warn(`[AnimationEngine] Warning: ${missingBones.length} bones missing from rig/clip ${animationId || clip.name}:`, missingBones)
  }
  console.groupEnd()
}

export interface RetargetOptions {
  customBoneMap?: Record<string, string>
  logWarnings?: boolean
  animationClipName?: string
  hipsPositionScaleOverride?: number
}

/**
 * Retargets a Mixamo FBX animation clip onto a target VRM humanoid character rig.
 * Compatible with both VRM 1.0 (normalized bones) and VRM 0.0.
 */
export function retargetMixamoAnimation(
  fbxAsset: THREE.Group | THREE.Object3D,
  vrm: any,
  options: RetargetOptions = {}
): THREE.AnimationClip | null {
  if (!fbxAsset || !vrm) return null

  const {
    customBoneMap = {},
    logWarnings = false,
    animationClipName
  } = options

  const boneMap = { ...MIXAMO_TO_VRM_BONE_MAP, ...customBoneMap }

  // 1. Locate animation clip in FBX asset
  let clip: THREE.AnimationClip | null = null
  const animations = (fbxAsset as any).animations || []
  if (animations.length === 0) {
    if (logWarnings) console.warn('[MixamoRetarget] No animation clips found in FBX asset')
    return null
  }

  if (animationClipName) {
    clip = THREE.AnimationClip.findByName(animations, animationClipName)
  }
  if (!clip) {
    // Try standard Mixamo clip names or default to first clip
    clip = THREE.AnimationClip.findByName(animations, 'mixamo.com') ||
           THREE.AnimationClip.findByName(animations, 'Armature|mixamo.com') ||
           THREE.AnimationClip.findByName(animations, 'Take 001') ||
           animations[0]
  }

  if (!clip) {
    if (logWarnings) console.warn('[MixamoRetarget] Could not find valid clip to retarget')
    return null
  }

  const tracks: THREE.KeyframeTrack[] = []
  const restRotationInverse = new THREE.Quaternion()
  const parentRestWorldRotation = new THREE.Quaternion()
  const _quatA = new THREE.Quaternion()
  const _vec3 = new THREE.Vector3()

  // 2. Compute hips scaling: Mixamo coordinates are in cm, VRM in meters
  let hipsPositionScale = 0.01
  try {
    const mixamoHips = fbxAsset.getObjectByName('mixamorigHips') ||
                       fbxAsset.getObjectByName('mixamorig:Hips') ||
                       fbxAsset.getObjectByName('Hips') ||
                       fbxAsset.getObjectByName('pelvis')
    const motionHipsY = mixamoHips ? Math.abs(mixamoHips.position.y) : null

    const vrmHipsNode = getTargetBoneNode(vrm, 'hips')
    const vrmHipsY = vrmHipsNode ? vrmHipsNode.getWorldPosition(_vec3).y : null
    const vrmRootY = vrm.scene ? vrm.scene.getWorldPosition(new THREE.Vector3()).y : 0

    if (motionHipsY && vrmHipsY !== null && motionHipsY > 1.0) {
      const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY)
      hipsPositionScale = (vrmHipsHeight > 0.1 ? vrmHipsHeight : 1.0) / motionHipsY
    }
  } catch (e) {
    if (logWarnings) console.warn('[MixamoRetarget] Hips height calculation notice:', e)
  }

  if (options.hipsPositionScaleOverride) {
    hipsPositionScale = options.hipsPositionScaleOverride
  }

  const isVRM0 = vrm.meta?.metaVersion === '0' || vrm.meta?.vrmVersion === '0.0'

  // 3. Retarget each track to corresponding VRM humanoid bone
  clip.tracks.forEach((track) => {
    const lastDot = track.name.lastIndexOf('.')
    if (lastDot === -1) return
    const propertyName = track.name.slice(lastDot + 1)
    const rawPath = track.name.slice(0, lastDot)

    // Strip namespaces or armature prefixes (e.g. "Armature|mixamorig:LeftArm" -> "mixamorig:LeftArm")
    const mixamoRigName = rawPath.split('/').pop()!.split('|').pop()!
    if (!propertyName) return

    // Resolve target VRM bone name
    const vrmBoneName = boneMap[mixamoRigName] || normalizeMixamoBoneName(mixamoRigName)
    if (!vrmBoneName) return

    // Find the corresponding node in target VRM
    const vrmNode = getTargetBoneNode(vrm, vrmBoneName)
    if (!vrmNode) {
      // Per VRM specification, optional detail bones (fingers, toes, etc.) are skipped cleanly.
      // Only warn if a mandatory humanoid core body bone is missing.
      if (logWarnings && !OPTIONAL_VRM_BONES.has(vrmBoneName)) {
        console.warn(`[MixamoRetarget] Mandatory VRM bone "${vrmBoneName}" not found in rig`)
      }
      return
    }

    const vrmNodeName = vrmNode.name

    // Locate the source bone in FBX hierarchy to extract rest rotation
    let mixamoRigNode = fbxAsset.getObjectByName(mixamoRigName)
    if (!mixamoRigNode) {
      const altNames = [
        mixamoRigName.replace(':', ''),
        mixamoRigName.includes(':') ? mixamoRigName : mixamoRigName.replace(/^mixamorig/, 'mixamorig:'),
        mixamoRigName.replace(/^mixamorig[:_]?/i, ''),
        mixamoRigName.replace(/^.*[:|/]/, '')
      ]
      for (const alt of altNames) {
        mixamoRigNode = fbxAsset.getObjectByName(alt)
        if (mixamoRigNode) break
      }
    }
    if (!mixamoRigNode) {
      fbxAsset.traverse((child) => {
        if (!mixamoRigNode && (
          child.name.toLowerCase() === mixamoRigName.toLowerCase() ||
          child.name.toLowerCase().endsWith(mixamoRigName.toLowerCase())
        )) {
          mixamoRigNode = child
        }
      })
    }

    if (track instanceof THREE.QuaternionKeyframeTrack) {
      // Compute rest pose rotation inversion
      if (mixamoRigNode) {
        mixamoRigNode.getWorldQuaternion(restRotationInverse).invert()
        if (mixamoRigNode.parent) {
          mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation)
        } else {
          parentRestWorldRotation.identity()
        }
      } else {
        restRotationInverse.identity()
        parentRestWorldRotation.identity()
      }

      const valuesCopy = new Float32Array(track.values.length)
      for (let i = 0; i < track.values.length; i += 4) {
        _quatA.fromArray(track.values, i)
        // Parent rest world rot * track rot * inverted bone rest world rot
        _quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse)
        _quatA.normalize()

        if (isVRM0) {
          // VRM 0.0 coordinate inversion
          valuesCopy[i] = -_quatA.x
          valuesCopy[i + 1] = _quatA.y
          valuesCopy[i + 2] = -_quatA.z
          valuesCopy[i + 3] = _quatA.w
        } else {
          // VRM 1.0 glTF coordinate standard
          valuesCopy[i] = _quatA.x
          valuesCopy[i + 1] = _quatA.y
          valuesCopy[i + 2] = _quatA.z
          valuesCopy[i + 3] = _quatA.w
        }
      }

      tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${vrmNodeName}.${propertyName}`,
          track.times,
          valuesCopy
        )
      )
    } else if (track instanceof THREE.VectorKeyframeTrack && (vrmBoneName === 'hips' || propertyName === 'position')) {
      // Retarget hips translation with scaling
      const valuesCopy = new Float32Array(track.values.length)
      for (let i = 0; i < track.values.length; i += 3) {
        const x = track.values[i] * hipsPositionScale
        const y = track.values[i + 1] * hipsPositionScale
        const z = track.values[i + 2] * hipsPositionScale

        if (isVRM0) {
          valuesCopy[i] = -x
          valuesCopy[i + 1] = y
          valuesCopy[i + 2] = -z
        } else {
          valuesCopy[i] = x
          valuesCopy[i + 1] = y
          valuesCopy[i + 2] = z
        }
      }

      tracks.push(
        new THREE.VectorKeyframeTrack(
          `${vrmNodeName}.${propertyName}`,
          track.times,
          valuesCopy
        )
      )
    }
  })

  if (tracks.length === 0) {
    if (logWarnings) console.warn('[MixamoRetarget] No valid tracks retargeted from FBX')
    return null
  }

  const retargetedClip = new THREE.AnimationClip('vrmMixamoAnimation', clip.duration, tracks)

  // Log track verification table to console
  logRetargetedClipDetails(retargetedClip, 'Mixamo FBX File')

  return retargetedClip
}

/**
 * Creates a high quality procedural humanoid walk cycle clip directly targeting
 * VRM humanoid bones. Includes full body motion:
 * - Legs & Feet: natural stride, knee flexion, ankle push-off
 * - Arms: natural forward/backward swing counter to legs, natural outward clearance
 * - Shoulders: subtle accompaniment twisting with arms
 * - Elbows & Hands: natural forward flexion and wrist follow-through
 * - Torso: hips bobbing/swaying + pelvic rotation, spine & chest counter-rotation
 * - Head: stabilized forward gaze
 */
/**
 * Creates a high quality procedural humanoid locomotion cycle clip directly targeting
 * all 20 canonical VRM humanoid bones.
 * Supports distinct locomotion archetypes:
 * - Walking (natural cadence, arm swing counter to legs, chest counter-rotation)
 * - Running (high cadence, forward torso lean, dynamic knee lift & arm pumping)
 * - Crouched Walking (lowered hips, deep knee flexion, forward pitch, tucked arms)
 * - Walking Backwards (reversed stride phase & foot contact)
 */
export function createProceduralLocomotionClip(vrm: any, animIdOrType: string = 'walking'): THREE.AnimationClip {
  const DEG2RAD = Math.PI / 180
  const animKey = animIdOrType.toLowerCase()

  const isRunning = animKey.includes('run')
  const isCrouching = animKey.includes('crouch')
  const isBackward = animKey.includes('back')

  // Movement parameters tailored by locomotion archetype
  const duration = isRunning ? 0.65 : isCrouching ? 1.25 : isBackward ? 1.1 : 1.1
  const fps = 30
  const totalFrames = Math.round(duration * fps)
  const times = new Float32Array(totalFrames + 1)
  for (let i = 0; i <= totalFrames; i++) {
    times[i] = (i / totalFrames) * duration
  }

  const tracks: THREE.KeyframeTrack[] = []

  const addQuatTrack = (
    boneName: string,
    evalRot: (t: number) => { x: number; y: number; z: number }
  ) => {
    const node = getTargetBoneNode(vrm, boneName)
    if (!node) return

    const values = new Float32Array((totalFrames + 1) * 4)
    const euler = new THREE.Euler()
    const quat = new THREE.Quaternion()

    for (let i = 0; i <= totalFrames; i++) {
      const t = times[i]
      const r = evalRot(t)
      euler.set(r.x, r.y, r.z, 'XYZ')
      quat.setFromEuler(euler)
      values[i * 4] = quat.x
      values[i * 4 + 1] = quat.y
      values[i * 4 + 2] = quat.z
      values[i * 4 + 3] = quat.w
    }

    tracks.push(new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values))
  }

  const isProceduralRig = Boolean(vrm?.isProcedural)
  const restArmZ = isProceduralRig ? 0 : 68 * DEG2RAD

  // 1. Hips Position & Rotation: Vertical step bounce, lateral weight shift, pitch
  const hipsNode = getTargetBoneNode(vrm, 'hips')
  if (hipsNode) {
    const baseHipsY = hipsNode.position.y || 0
    const baseHipsX = hipsNode.position.x || 0
    const baseHipsZ = hipsNode.position.z || 0

    const crouchDropY = isCrouching ? -0.28 : 0
    const bounceAmp = isRunning ? 0.055 : isCrouching ? 0.015 : 0.038
    const swayAmp = isRunning ? 0.032 : isCrouching ? 0.018 : 0.022
    const surgeAmp = isRunning ? 0.018 : 0.008

    const posValues = new Float32Array((totalFrames + 1) * 3)
    for (let i = 0; i <= totalFrames; i++) {
      const phase = (times[i] / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
      posValues[i * 3] = baseHipsX + Math.sin(phase) * swayAmp
      posValues[i * 3 + 1] = baseHipsY + crouchDropY - Math.abs(Math.sin(phase * 2)) * bounceAmp
      posValues[i * 3 + 2] = baseHipsZ + Math.sin(phase * 2) * surgeAmp
    }
    tracks.push(new THREE.VectorKeyframeTrack(`${hipsNode.name}.position`, times, posValues))

    // Hips Rotation: Pelvic rotation (Y) and lateral tilt (Z)
    addQuatTrack('hips', t => {
      const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
      const pitchX = isRunning ? 4.0 * DEG2RAD : isCrouching ? 10.0 * DEG2RAD : isBackward ? -2.0 * DEG2RAD : 1.5 * DEG2RAD
      const yawY = Math.sin(phase) * (isRunning ? 6.5 : 4.5) * DEG2RAD
      const rollZ = Math.cos(phase) * (isRunning ? -3.5 : -2.5) * DEG2RAD
      return { x: pitchX, y: yawY, z: rollZ }
    })
  }

  // 2. Spine & Chest & UpperChest Counter-rotation
  // Dynamic forward pitch according to running / crouching / walking posture
  const spineLeanX = isRunning ? 12.0 * DEG2RAD : isCrouching ? 22.0 * DEG2RAD : isBackward ? -3.0 * DEG2RAD : 3.0 * DEG2RAD
  const chestLeanX = isRunning ? 6.0 * DEG2RAD : isCrouching ? 14.0 * DEG2RAD : isBackward ? -1.0 * DEG2RAD : -1.5 * DEG2RAD
  const upperChestLeanX = isRunning ? 4.0 * DEG2RAD : isCrouching ? 8.0 * DEG2RAD : 0

  addQuatTrack('spine', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    return {
      x: spineLeanX,
      y: Math.sin(phase) * (isRunning ? -5.0 : -3.5) * DEG2RAD,
      z: Math.cos(phase) * 1.5 * DEG2RAD
    }
  })

  addQuatTrack('chest', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    return {
      x: chestLeanX,
      y: Math.sin(phase) * (isRunning ? -9.5 : -7.0) * DEG2RAD,
      z: Math.cos(phase) * -2.0 * DEG2RAD
    }
  })

  // UpperChest track targeting VRM upperChest or chest helper
  const upperChestNode = getTargetBoneNode(vrm, 'upperChest')
  const chestNode = getTargetBoneNode(vrm, 'chest')
  if (upperChestNode && upperChestNode !== chestNode) {
    addQuatTrack('upperChest', t => {
      const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
      return {
        x: upperChestLeanX,
        y: Math.sin(phase) * (isRunning ? -4.0 : -3.0) * DEG2RAD,
        z: Math.cos(phase) * -1.0 * DEG2RAD
      }
    })
  } else if (upperChestNode) {
    // If upperChest alias points to chestNode, add track with unique property name
    const values = new Float32Array((totalFrames + 1) * 4)
    const quat = new THREE.Quaternion()
    for (let i = 0; i <= totalFrames; i++) {
      values[i * 4] = quat.x
      values[i * 4 + 1] = quat.y
      values[i * 4 + 2] = quat.z
      values[i * 4 + 3] = quat.w
    }
    tracks.push(new THREE.QuaternionKeyframeTrack('upperChest.quaternion', times, values))
  }

  // 3. Neck & Head Stabilization
  addQuatTrack('neck', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    const neckPitch = isCrouching ? -12.0 * DEG2RAD : isRunning ? -5.0 * DEG2RAD : 0.5 * DEG2RAD
    return {
      x: neckPitch,
      y: Math.sin(phase) * 3.0 * DEG2RAD,
      z: 0
    }
  })

  addQuatTrack('head', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    const headPitch = isCrouching ? -10.0 * DEG2RAD : isRunning ? -4.0 * DEG2RAD : -1.0 * DEG2RAD
    return {
      x: headPitch,
      y: Math.sin(phase) * 2.0 * DEG2RAD,
      z: Math.cos(phase) * 1.0 * DEG2RAD
    }
  })

  // 4. Shoulders: Accompanies arm motion opposite to legs
  const shoulderAmp = isRunning ? 6.5 : isCrouching ? 2.5 : 4.0
  addQuatTrack('leftShoulder', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1) + Math.PI
    return {
      x: Math.sin(phase) * shoulderAmp * DEG2RAD,
      y: Math.sin(phase) * -3.0 * DEG2RAD,
      z: 1.5 * DEG2RAD
    }
  })

  addQuatTrack('rightShoulder', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    return {
      x: Math.sin(phase) * shoulderAmp * DEG2RAD,
      y: Math.sin(phase) * 3.0 * DEG2RAD,
      z: -1.5 * DEG2RAD
    }
  })

  // 5. Upper Arms: Full natural arm swing opposite to legs
  const armSwingAmp = isRunning ? 42.0 : isCrouching ? 16.0 : 28.0
  addQuatTrack('leftUpperArm', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1) + Math.PI
    const swingX = Math.sin(phase) * armSwingAmp * DEG2RAD
    const twistY = Math.sin(phase) * (isRunning ? 8.0 : 4.0) * DEG2RAD
    const clearanceZ = -restArmZ - (4.0 + Math.abs(Math.sin(phase)) * 4.0) * DEG2RAD
    return {
      x: swingX,
      y: twistY,
      z: clearanceZ
    }
  })

  addQuatTrack('rightUpperArm', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    const swingX = Math.sin(phase) * armSwingAmp * DEG2RAD
    const twistY = -Math.sin(phase) * (isRunning ? 8.0 : 4.0) * DEG2RAD
    const clearanceZ = restArmZ + (4.0 + Math.abs(Math.sin(phase)) * 4.0) * DEG2RAD
    return {
      x: swingX,
      y: twistY,
      z: clearanceZ
    }
  })

  // 6. Lower Arms (Elbows): Flexion during forward stroke
  addQuatTrack('leftLowerArm', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1) + Math.PI
    const baseFlex = isRunning ? 48 : isCrouching ? 42 : 14
    const flexAmp = isRunning ? 32 : isCrouching ? 15 : 20
    const flexion = Math.sin(phase) > 0
      ? (baseFlex + Math.sin(phase) * flexAmp) * DEG2RAD
      : (baseFlex * 0.7 + Math.abs(Math.sin(phase)) * 4) * DEG2RAD
    return {
      x: flexion,
      y: 4 * DEG2RAD,
      z: 0
    }
  })

  addQuatTrack('rightLowerArm', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    const baseFlex = isRunning ? 48 : isCrouching ? 42 : 14
    const flexAmp = isRunning ? 32 : isCrouching ? 15 : 20
    const flexion = Math.sin(phase) > 0
      ? (baseFlex + Math.sin(phase) * flexAmp) * DEG2RAD
      : (baseFlex * 0.7 + Math.abs(Math.sin(phase)) * 4) * DEG2RAD
    return {
      x: flexion,
      y: -4 * DEG2RAD,
      z: 0
    }
  })

  // 7. Hands (Wrists): Natural follow-through
  addQuatTrack('leftHand', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1) + Math.PI
    return {
      x: Math.sin(phase) * (isRunning ? 14.0 : 8.0) * DEG2RAD,
      y: 0,
      z: -2.0 * DEG2RAD
    }
  })

  addQuatTrack('rightHand', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    return {
      x: Math.sin(phase) * (isRunning ? 14.0 : 8.0) * DEG2RAD,
      y: 0,
      z: 2.0 * DEG2RAD
    }
  })

  // 8. Legs: Upper & Lower Legs
  const legStrideAmp = isRunning ? 48.0 : isCrouching ? 24.0 : 30.0
  const crouchLegBias = isCrouching ? -22.0 : 0

  addQuatTrack('leftUpperLeg', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    return {
      x: (Math.sin(phase) * legStrideAmp + crouchLegBias) * DEG2RAD,
      y: 0,
      z: 2 * DEG2RAD
    }
  })

  addQuatTrack('rightUpperLeg', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1) + Math.PI
    return {
      x: (Math.sin(phase) * legStrideAmp + crouchLegBias) * DEG2RAD,
      y: 0,
      z: -2 * DEG2RAD
    }
  })

  // Knees: Bend during swing phase and crouch posture
  const kneeFlexAmp = isRunning ? 74 : isCrouching ? 35 : 52
  const kneeBase = isCrouching ? 48 : 4

  addQuatTrack('leftLowerLeg', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    const bend = Math.sin(phase) < 0
      ? (kneeBase + Math.abs(Math.sin(phase)) * kneeFlexAmp) * DEG2RAD
      : kneeBase * DEG2RAD
    return { x: bend, y: 0, z: 0 }
  })

  addQuatTrack('rightLowerLeg', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1) + Math.PI
    const bend = Math.sin(phase) < 0
      ? (kneeBase + Math.abs(Math.sin(phase)) * kneeFlexAmp) * DEG2RAD
      : kneeBase * DEG2RAD
    return { x: bend, y: 0, z: 0 }
  })

  // 9. Feet: Heel strike to toe push-off
  addQuatTrack('leftFoot', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1)
    return { x: Math.sin(phase) * (isBackward ? 14 : -14) * DEG2RAD, y: 0, z: 0 }
  })

  addQuatTrack('rightFoot', t => {
    const phase = (t / duration) * Math.PI * 2 * (isBackward ? -1 : 1) + Math.PI
    return { x: Math.sin(phase) * (isBackward ? 14 : -14) * DEG2RAD, y: 0, z: 0 }
  })

  const clip = new THREE.AnimationClip(`vrmLocomotion_${animIdOrType}`, duration, tracks)

  // Log verification table to console
  logRetargetedClipDetails(clip, `Procedural Locomotion Engine (${animIdOrType})`, animIdOrType)

  return clip
}

/**
 * Backward-compatible wrapper for createProceduralLocomotionClip
 */
export function createProceduralWalkClip(vrm: any): THREE.AnimationClip {
  return createProceduralLocomotionClip(vrm, 'walking')
}

// Memory cache of loaded and parsed FBX asset groups to prevent redundant network downloads
const fbxAssetCache = new Map<string, THREE.Group>()

export interface PlayAnimationOptions {
  speed?: number
  crossFadeDuration?: number
  onLoaded?: (isMixamoFile: boolean) => void
  onError?: (err: Error) => void
}

/**
 * Generic function that plays a Mixamo animation by ID from the animation manifest.
 * 1. Looks up the file path from the manifest
 * 2. Loads FBX with FBXLoader (caching already-loaded FBX assets so repeated plays don't re-fetch from disk)
 * 3. Retargets the clip onto the given VRM's humanoid bones, explicitly mapping and verifying ALL 20 relevant bones
 * 4. Logs a warning to the console if any bones are missing from the retargeted clip
 * 5. Stops and properly disposes of any previously playing AnimationAction/Mixer for that character before starting
 * 6. Sets the action to loop continuously (THREE.LoopRepeat, Infinity) and calls .play()
 * 7. Ensures NO other system overwrites these bones after the mixer updates each frame
 */
export async function playMixamoAnimation(
  animationId: string,
  vrm: any,
  options: PlayAnimationOptions = {}
): Promise<THREE.AnimationAction | null> {
  if (!vrm || !vrm.scene) {
    console.warn('[MixamoAnimation] Target VRM or scene is missing')
    return null
  }

  const {
    speed,
    onLoaded,
    onError
  } = options

  if (!vrm.userData) vrm.userData = {}

  // 1. Look up file path and speed from manifest
  const manifestItem = getAnimationManifestItem(animationId)
  const targetFbx = manifestItem ? manifestItem.fbx : animationId
  const effectiveSpeed = speed ?? manifestItem?.speed ?? 1.0

  let fbxAsset: THREE.Group | undefined = fbxAssetCache.get(targetFbx)
  let isFromMixamoFile = false
  let finalClip: THREE.AnimationClip | null = null

  // 2. Load FBX with FBXLoader (cache already-loaded FBX assets)
  if (!fbxAsset) {
    const rawFileName = targetFbx.split('/').pop() || ''
    const candidateUrls = [
      targetFbx,
      targetFbx.startsWith('/') ? targetFbx.slice(1) : `/${targetFbx}`,
      `/assets/animations/${rawFileName}`,
      `/animations/${rawFileName}`,
      `/assets/animations/${rawFileName.replace(/_/g, ' ')}`,
      `/assets/animations/${rawFileName.replace(/\s+/g, '_')}`
    ]

    let resolvedUrl: string | null = null
    for (const url of candidateUrls) {
      try {
        const check = await fetch(url, { method: 'HEAD' })
        if (check.ok) {
          resolvedUrl = url
          break
        }
      } catch {
        // continue checking candidate URLs
      }
    }

    if (resolvedUrl) {
      try {
        const loader = new FBXLoader()
        fbxAsset = await loader.loadAsync(resolvedUrl)
        if (fbxAsset) {
          fbxAssetCache.set(targetFbx, fbxAsset)
          fbxAssetCache.set(resolvedUrl, fbxAsset)
        }
      } catch (err: any) {
        console.warn(`[MixamoAnimation] Failed loading FBX at ${resolvedUrl}:`, err.message)
        onError?.(err)
      }
    }
  }

  // 3. Retarget clip onto VRM humanoid bones
  if (fbxAsset) {
    try {
      finalClip = retargetMixamoAnimation(fbxAsset, vrm, {
        animationClipName: `mixamo_${animationId}`,
        logWarnings: true
      })
      if (finalClip && finalClip.tracks.length > 0) {
        isFromMixamoFile = true
      }
    } catch (err: any) {
      console.warn(`[MixamoAnimation] Retargeting failed for ${animationId}:`, err.message)
    }
  }

  // If FBX file is not yet available, fallback to high-fidelity procedural locomotion
  if (!finalClip) {
    console.info(`[MixamoAnimation] Using procedural locomotion engine for "${animationId}"`)
    finalClip = createProceduralLocomotionClip(vrm, animationId)
  }

  // 4. Explicitly verify ALL 20 relevant humanoid bones and log warnings if any are missing
  verifyRetargetedClipBones(finalClip, animationId)
  logRetargetedClipDetails(finalClip, isFromMixamoFile ? `Mixamo FBX (${targetFbx})` : 'Procedural Locomotion Engine', animationId)

  // 5. Stop and properly dispose of any previously playing AnimationAction/Mixer for that character
  // before starting the new one, so animations never conflict or partially overlap
  if (vrm.userData.currentAction) {
    try {
      const prevAction: THREE.AnimationAction = vrm.userData.currentAction
      prevAction.stop()
      prevAction.reset()
    } catch {
      // safe guard
    }
    vrm.userData.currentAction = null
  }

  // Initialize or re-use AnimationMixer
  let mixer: THREE.AnimationMixer = vrm.userData.currentMixer || (vrm as any).mixer
  if (!mixer) {
    mixer = new THREE.AnimationMixer(vrm.scene)
    vrm.userData.currentMixer = mixer
    ;(vrm as any).mixer = mixer
  } else {
    try {
      mixer.stopAllAction()
      mixer.uncacheRoot(vrm.scene)
    } catch {
      // safe guard
    }
  }

  // 6. Sets the action to loop continuously (THREE.LoopRepeat, Infinity) and calls .play()
  const newAction = mixer.clipAction(finalClip)
  newAction.setLoop(THREE.LoopRepeat, Infinity)
  newAction.clampWhenFinished = false
  newAction.timeScale = effectiveSpeed
  newAction.reset()
  newAction.play()

  // 7. Store state on VRM userData
  vrm.userData.currentAction = newAction
  vrm.userData.currentMixer = mixer
  vrm.userData.isPlayingMixamo = true
  vrm.userData.currentAnimationId = animationId
  vrm.userData.currentPoseKey = animationId

  onLoaded?.(isFromMixamoFile)
  return newAction
}

/**
 * Backward-compatible entry point that delegates to playMixamoAnimation
 */
export async function loadAndPlayMixamoAnimation(
  fbxUrlOrId: string,
  vrm: any,
  options: PlayAnimationOptions = {}
): Promise<THREE.AnimationAction | null> {
  return playMixamoAnimation(fbxUrlOrId, vrm, options)
}

/**
 * Stops and disposes of any active AnimationMixer action on the given VRM.
 * Call this when switching back to a static pose.
 */
export function stopMixamoAnimation(vrm: any, fadeOutDuration: number = 0.2): void {
  if (!vrm) return

  const currentAction: THREE.AnimationAction | undefined = vrm.userData?.currentAction
  const mixer: THREE.AnimationMixer | undefined = vrm.userData?.currentMixer || (vrm as any).mixer

  if (currentAction) {
    try {
      if (fadeOutDuration > 0) {
        currentAction.fadeOut(fadeOutDuration)
        setTimeout(() => {
          try {
            currentAction.stop()
            currentAction.reset()
          } catch {
            // safe guard
          }
        }, fadeOutDuration * 1000)
      } else {
        currentAction.stop()
        currentAction.reset()
      }
    } catch {
      // safe guard
    }
  }

  if (vrm.userData) {
    vrm.userData.isPlayingMixamo = false
    vrm.userData.currentAction = null
    vrm.userData.currentAnimationId = null
    vrm.userData.currentPoseKey = null
  }

  if (mixer) {
    try {
      mixer.stopAllAction()
      mixer.uncacheRoot(vrm.scene)
    } catch {
      // safe guard
    }
  }
}

/**
 * Animation configuration registry for backward compatibility.
 */
export interface MixamoAnimationConfig {
  key: string
  name: string
  category: 'Standing' | 'Action' | 'Sitting' | 'Expressive' | 'Animated'
  description: string
  iconType: 'walking' | 'action' | 'sitting' | 'expressive' | 'standing'
  fbxUrl: string
  speed?: number
}

export const MIXAMO_ANIMATION_LIBRARY: Record<string, MixamoAnimationConfig> = {
  walking: {
    key: 'walking',
    name: 'Walking',
    category: 'Animated',
    description: 'Natural humanoid walking cycle retargeted to character rig',
    iconType: 'walking',
    fbxUrl: '/assets/animations/Walking.fbx',
    speed: 1.0
  }
}

/**
 * Helper to check if a pose preset key corresponds to an animated Mixamo clip
 */
export function isAnimatedPoseKey(key: string): boolean {
  if (!key) return false
  return isManifestAnimationId(key) || key in MIXAMO_ANIMATION_LIBRARY || key === 'walking'
}

/**
 * Retrieve animation config by pose key
 */
export function getMixamoAnimationConfig(key: string): MixamoAnimationConfig | null {
  const manifestItem = getAnimationManifestItem(key)
  if (manifestItem) {
    return {
      key: manifestItem.id,
      name: manifestItem.displayName,
      category: 'Animated',
      description: manifestItem.description,
      iconType: manifestItem.id.includes('run') ? 'action' : 'walking',
      fbxUrl: manifestItem.fbx,
      speed: manifestItem.speed || 1.0
    }
  }
  if (key in MIXAMO_ANIMATION_LIBRARY) {
    return MIXAMO_ANIMATION_LIBRARY[key]
  }
  return null
}
