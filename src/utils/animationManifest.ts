/**
 * Animation Manifest definition for Mixamo FBX animations.
 * Provides a scalable, registry-driven configuration for locomotion and action clips.
 */

export interface AnimationManifestItem {
  id: string
  displayName: string
  category: 'Walking' | 'Running' | 'Action' | string
  fbx: string
  description: string
  speed?: number
}

export const ANIMATIONS_MANIFEST: AnimationManifestItem[] = [
  {
    id: 'walking',
    displayName: 'Walking',
    category: 'Walking',
    fbx: '/assets/animations/Walking.fbx',
    description: 'Natural bipedal forward walk cycle with dynamic arm swing',
    speed: 1.0
  },
  {
    id: 'running',
    displayName: 'Running',
    category: 'Running',
    fbx: '/assets/animations/Running.fbx',
    description: 'High-energy athletic running sprint with forward torso drive',
    speed: 1.0
  },
  {
    id: 'crouched_walking',
    displayName: 'Crouched Walking',
    category: 'Walking',
    fbx: '/assets/animations/Crouched_Walking.fbx',
    description: 'Low stealth crouch-walk with lowered hips and bent knees',
    speed: 0.9
  },
  {
    id: 'walking_backwards',
    displayName: 'Walking Backwards',
    category: 'Walking',
    fbx: '/assets/animations/Walking_Backwards.fbx',
    description: 'Cautious backward stepping cycle with reversed foot roll',
    speed: 0.95
  },
  {
    id: 'unarmed_run_forward',
    displayName: 'Unarmed Run Forward',
    category: 'Running',
    fbx: '/assets/animations/Unarmed_Run_Forward.fbx',
    description: 'Realistic combat sprint with defensive posture and pace',
    speed: 1.05
  },
  {
    id: 'unarmed_run_backward',
    displayName: 'Unarmed Run Backward',
    category: 'Running',
    fbx: '/assets/animations/Unarmed_Run_Backward.fbx',
    description: 'Tactical backward retreat run maintaining target focus',
    speed: 0.95
  },
  {
    id: 'walker_walk',
    displayName: 'Walker Walk',
    category: 'Walking',
    fbx: '/assets/animations/Walker_Walk.fbx',
    description: 'Deliberate pacing walk with prominent hip sway and arm cadence',
    speed: 0.95
  },
  {
    id: 'fast_run',
    displayName: 'Sprint Run',
    category: 'Running',
    fbx: '/assets/animations/Fast_Run.fbx',
    description: 'Full velocity sprint with aggressive stride and arm drive',
    speed: 1.15
  },
  {
    id: 'casual_walk',
    displayName: 'Casual Walk',
    category: 'Walking',
    fbx: '/assets/animations/Casual_Walk.fbx',
    description: 'Relaxed street walk with gentle shoulder sway',
    speed: 1.0
  },
  {
    id: 'strut_walk',
    displayName: 'Stylized Walk',
    category: 'Walking',
    fbx: '/assets/animations/Strut_Walk.fbx',
    description: 'Confident runway strut with exaggerated hip and shoulder motion',
    speed: 1.0
  }
]

export const ANIMATION_MANIFEST_MAP: Record<string, AnimationManifestItem> = Object.fromEntries(
  ANIMATIONS_MANIFEST.map(item => [item.id, item])
)

/**
 * Helper to check if a pose or animation key exists in the manifest
 */
export function isManifestAnimationId(id: string): boolean {
  return id in ANIMATION_MANIFEST_MAP
}

/**
 * Retrieve manifest item by id
 */
export function getAnimationManifestItem(id: string): AnimationManifestItem | undefined {
  return ANIMATION_MANIFEST_MAP[id]
}
