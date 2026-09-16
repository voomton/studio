import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SceneProp, StarterPropPreset } from '../types/scene'

const gltfLoader = new GLTFLoader()

export const STARTER_PROP_PRESETS: StarterPropPreset[] = [
  {
    id: 'road_tile',
    name: 'Asphalt Road & Sidewalk',
    category: 'street',
    description: 'Modular city asphalt road tile with pedestrian sidewalk and street markings',
    defaultScale: [1, 1, 1],
    defaultPosition: [0, 0, 0],
    defaultRotation: [0, 0, 0],
    icon: 'Layers'
  },
  {
    id: 'building_block',
    name: 'Anime City Storefront',
    category: 'architecture',
    description: 'Stylized 2-story commercial city building with shop window and canopy',
    defaultScale: [1, 1, 1],
    defaultPosition: [-3.5, 0, -2.5],
    defaultRotation: [0, 30, 0],
    icon: 'Building'
  },
  {
    id: 'park_bench',
    name: 'Park Wooden Bench',
    category: 'furniture',
    description: 'Outdoor wooden slat bench with cast-iron frame for sitting poses',
    defaultScale: [1, 1, 1],
    defaultPosition: [1.2, 0, -0.5],
    defaultRotation: [0, -45, 0],
    icon: 'Armchair'
  },
  {
    id: 'school_desk',
    name: 'School Desk & Chair',
    category: 'furniture',
    description: 'Classic anime classroom wooden study desk with metal leg chair',
    defaultScale: [1, 1, 1],
    defaultPosition: [1.0, 0, 0],
    defaultRotation: [0, -30, 0],
    icon: 'BookOpen'
  },
  {
    id: 'streetlight',
    name: 'City Streetlight Lamp',
    category: 'street',
    description: 'Urban single-arm streetlight post with glowing warm luminaire',
    defaultScale: [1, 1, 1],
    defaultPosition: [-2.0, 0, 1.2],
    defaultRotation: [0, 45, 0],
    icon: 'Lamp'
  },
  {
    id: 'anime_tree',
    name: 'Stylized Sakura / Foliage Tree',
    category: 'nature',
    description: 'Fluffy stylized cartoon canopy tree with wooden trunk',
    defaultScale: [1, 1, 1],
    defaultPosition: [3.2, 0, -2.0],
    defaultRotation: [0, 15, 0],
    icon: 'Trees'
  },
  {
    id: 'cafe_parasol',
    name: 'Cafe Table & Umbrella',
    category: 'furniture',
    description: 'Outdoor sidewalk cafe round table with parasol umbrella',
    defaultScale: [1, 1, 1],
    defaultPosition: [2.5, 0, 1.5],
    defaultRotation: [0, 0, 0],
    icon: 'Coffee'
  },
  {
    id: 'wooden_crate',
    name: 'Shipping Wooden Crate',
    category: 'items',
    description: 'Stackable industrial wooden cargo crate with reinforced corners',
    defaultScale: [1, 1, 1],
    defaultPosition: [-1.4, 0, -1.0],
    defaultRotation: [0, 15, 0],
    icon: 'Package'
  }
]

/**
 * Sanitizes and prepares imported 3D prop meshes:
 * - Ensures valid materials and textures
 * - Provides graceful neutral-grey fallback if textures or colors are missing/black
 * - Double-sided material configuration so walls and ceilings are never invisible
 * - Safe transparency and depth writing so geometry never self-occludes or punches holes
 * - Cast/receive shadows enabled
 * - Only prunes non-visual orphan empties or embedded cameras/lights
 */
export function cleanAndPrunePropMesh(group: THREE.Group | THREE.Object3D) {
  group.updateMatrixWorld(true)
  const nodesToRemove: THREE.Object3D[] = []

  // Shared fallback neutral material for broken/missing textures
  const fallbackMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a8a9a,
    roughness: 0.65,
    metalness: 0.15,
    side: THREE.DoubleSide
  })

  group.traverse((node: any) => {
    // 1. Remove non-visual clutter like stray embedded lights or cameras that clash with the scene
    if (node.isCamera || node.isLight) {
      nodesToRemove.push(node)
      return
    }

    if (!node.isMesh) return

    // 2. Validate geometry
    if (!node.geometry) {
      nodesToRemove.push(node)
      return
    }

    node.castShadow = true
    node.receiveShadow = true

    // 3. Process and sanitize materials
    const rawMaterials = Array.isArray(node.material) ? node.material : [node.material]
    const updatedMaterials = rawMaterials.map((mat: any) => {
      if (!mat) {
        return fallbackMaterial.clone()
      }

      // Convert material or clone if not standard/physical
      const m = mat

      // Ensure double-sided rendering so imported architecture, walls, and props are visible from all angles
      m.side = THREE.DoubleSide

      // If material has pure black base color and NO texture map, apply neutral grey
      // so it doesn't render as a flat silhouette
      if (m.color) {
        const isPureBlack = m.color.r < 0.02 && m.color.g < 0.02 && m.color.b < 0.02
        if (isPureBlack && !m.map) {
          m.color.setHex(0x767688)
        }
      }

      // Tame extreme metalness without environment reflection (prevents pitch-black rendering)
      if (m.metalness !== undefined && m.metalness > 0.85 && !m.metalnessMap) {
        m.metalness = 0.4
      }
      if (m.roughness !== undefined && m.roughness < 0.15 && !m.roughnessMap) {
        m.roughness = 0.45
      }

      // Transparency and depthWrite normalization:
      // In GLTF, many opaque meshes are exported with transparent: true.
      // If opacity is near 1.0 (>= 0.95), treat as opaque to guarantee proper depth sorting
      if (m.transparent) {
        if (m.opacity === undefined || m.opacity >= 0.95) {
          m.transparent = false
          m.depthWrite = true
        } else {
          m.depthWrite = m.opacity > 0.4
        }
      } else {
        m.depthWrite = true
      }
      m.depthTest = true

      // Texture color space
      if (m.map) {
        m.map.colorSpace = THREE.SRGBColorSpace
        m.map.needsUpdate = true
      }

      return m
    })

    node.material = Array.isArray(node.material) ? updatedMaterials : updatedMaterials[0]
  })

  // Remove non-visual nodes
  for (const n of nodesToRemove) {
    if (n.parent) {
      n.parent.remove(n)
    }
  }

  group.updateMatrixWorld(true)
}

/**
 * Adjusts child meshes so the lowest point of the group rests precisely at Y=0 (flush with ground)
 */
export function normalizePropMeshToGround(group: THREE.Group) {
  group.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(group)
  if (!box.isEmpty() && Number.isFinite(box.min.y)) {
    const diffY = box.min.y
    if (Math.abs(diffY) > 0.0005) {
      group.children.forEach(child => {
        child.position.y -= diffY
      })
      group.updateMatrixWorld(true)
    }
  }
}

/**
 * Parses a .glb or .gltf ArrayBuffer into a Three.js Group
 */
export async function loadGLBPropFromArrayBuffer(buffer: ArrayBuffer): Promise<{
  group: THREE.Group
  dimensions: { width: number; height: number; depth: number }
}> {
  return new Promise((resolve, reject) => {
    gltfLoader.parse(
      buffer,
      '',
      (gltf) => {
        const root = gltf.scene || gltf.scenes[0]
        const group = new THREE.Group()
        group.add(root)

        // Aggressively clean and prune unwanted bases, sky domes, oversized planes, and fix transparent depth-writing
        cleanAndPrunePropMesh(group)

        // Compute Bounding Box of actual visible asset geometry
        const bbox = new THREE.Box3().setFromObject(group)
        const size = new THREE.Vector3()
        bbox.getSize(size)

        // Center horizontally on floor base, grounding lowest vertex flush to Y=0
        const center = new THREE.Vector3()
        bbox.getCenter(center)
        root.position.x -= center.x
        root.position.z -= center.z
        root.position.y -= bbox.min.y // Ground to bottom (Y=0) flush with zero gap

        root.updateMatrixWorld(true)
        group.updateMatrixWorld(true)
        normalizePropMeshToGround(group)

        resolve({
          group,
          dimensions: { width: size.x, height: size.y, depth: size.z }
        })
      },
      (error) => {
        console.error('Failed to parse GLB prop:', error)
        reject(error)
      }
    )
  })
}

/**
 * Creates rich, stylized procedural 3D meshes for built-in Starter Scene Props
 */
export function createStarterPropMesh(presetId: string): THREE.Group {
  const group = new THREE.Group()

  switch (presetId) {
    case 'road_tile': {
      // Base asphalt
      const roadGeo = new THREE.BoxGeometry(6, 0.1, 6)
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x24242e, roughness: 0.85 })
      const road = new THREE.Mesh(roadGeo, roadMat)
      road.position.y = 0.05
      road.receiveShadow = true
      group.add(road)

      // Sidewalk curb
      const sidewalkGeo = new THREE.BoxGeometry(1.5, 0.22, 6)
      const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x90909c, roughness: 0.7 })
      const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat)
      sidewalk.position.set(-2.25, 0.11, 0)
      sidewalk.receiveShadow = true
      sidewalk.castShadow = true
      group.add(sidewalk)

      // Road white dashed lines
      for (let z = -2.2; z <= 2.2; z += 1.5) {
        const lineGeo = new THREE.PlaneGeometry(0.18, 0.8)
        const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
        const line = new THREE.Mesh(lineGeo, lineMat)
        line.rotation.x = -Math.PI / 2
        line.position.set(0.5, 0.105, z)
        group.add(line)
      }
      break
    }

    case 'building_block': {
      // Main 2-story building body
      const bodyGeo = new THREE.BoxGeometry(3.5, 5.0, 3.0)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d4452, roughness: 0.6 })
      const body = new THREE.Mesh(bodyGeo, bodyMat)
      body.position.set(0, 2.5, 0)
      body.castShadow = true
      body.receiveShadow = true
      group.add(body)

      // Shop facade frame
      const facadeGeo = new THREE.BoxGeometry(3.2, 2.0, 0.2)
      const facadeMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4 })
      const facade = new THREE.Mesh(facadeGeo, facadeMat)
      facade.position.set(0, 1.2, 1.55)
      facade.castShadow = true
      group.add(facade)

      // Shop window glass
      const glassGeo = new THREE.BoxGeometry(2.8, 1.4, 0.1)
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85
      })
      const glass = new THREE.Mesh(glassGeo, glassMat)
      glass.position.set(0, 1.2, 1.62)
      group.add(glass)

      // Awning canopy
      const awningGeo = new THREE.BoxGeometry(3.4, 0.15, 1.2)
      const awningMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.5 })
      const awning = new THREE.Mesh(awningGeo, awningMat)
      awning.position.set(0, 2.25, 2.0)
      awning.rotation.x = 0.2
      awning.castShadow = true
      group.add(awning)

      // 2nd floor windows
      for (let x = -0.9; x <= 0.9; x += 1.8) {
        const winGeo = new THREE.BoxGeometry(1.0, 1.2, 0.15)
        const winMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.2, metalness: 0.7 })
        const win = new THREE.Mesh(winGeo, winMat)
        win.position.set(x, 3.8, 1.52)
        group.add(win)
      }
      break
    }

    case 'park_bench': {
      // Wooden seat slats
      const slatMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.65 })
      for (let i = 0; i < 4; i++) {
        const slatGeo = new THREE.BoxGeometry(1.6, 0.04, 0.1)
        const slat = new THREE.Mesh(slatGeo, slatMat)
        slat.position.set(0, 0.45, -0.15 + i * 0.12)
        slat.castShadow = true
        group.add(slat)
      }

      // Wooden backrest slats
      for (let i = 0; i < 3; i++) {
        const slatGeo = new THREE.BoxGeometry(1.6, 0.1, 0.04)
        const slat = new THREE.Mesh(slatGeo, slatMat)
        slat.position.set(0, 0.62 + i * 0.12, -0.22)
        slat.rotation.x = -0.15
        slat.castShadow = true
        group.add(slat)
      }

      // Metal legs & armrests
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.3, metalness: 0.8 })
      for (const x of [-0.7, 0.7]) {
        // Legs
        const legGeo = new THREE.BoxGeometry(0.06, 0.45, 0.45)
        const leg = new THREE.Mesh(legGeo, metalMat)
        leg.position.set(x, 0.225, 0.02)
        leg.castShadow = true
        group.add(leg)

        // Armrest
        const armGeo = new THREE.BoxGeometry(0.06, 0.35, 0.45)
        const arm = new THREE.Mesh(armGeo, metalMat)
        arm.position.set(x, 0.55, 0.02)
        arm.castShadow = true
        group.add(arm)
      }
      break
    }

    case 'school_desk': {
      const woodMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.5 })
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x4a4e69, roughness: 0.3, metalness: 0.7 })

      // Desk Top
      const topGeo = new THREE.BoxGeometry(0.8, 0.04, 0.55)
      const top = new THREE.Mesh(topGeo, woodMat)
      top.position.set(0, 0.74, 0)
      top.castShadow = true
      group.add(top)

      // Desk Frame / Book shelf
      const shelfGeo = new THREE.BoxGeometry(0.72, 0.02, 0.48)
      const shelf = new THREE.Mesh(shelfGeo, steelMat)
      shelf.position.set(0, 0.62, 0)
      shelf.castShadow = true
      group.add(shelf)

      // Desk Legs
      for (const x of [-0.34, 0.34]) {
        for (const z of [-0.22, 0.22]) {
          const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.74, 8)
          const leg = new THREE.Mesh(legGeo, steelMat)
          leg.position.set(x, 0.37, z)
          leg.castShadow = true
          group.add(leg)
        }
      }

      // Chair Base
      const chairSeatGeo = new THREE.BoxGeometry(0.42, 0.03, 0.4)
      const chairSeat = new THREE.Mesh(chairSeatGeo, woodMat)
      chairSeat.position.set(0, 0.45, 0.48)
      chairSeat.castShadow = true
      group.add(chairSeat)

      // Chair Backrest
      const chairBackGeo = new THREE.BoxGeometry(0.42, 0.22, 0.03)
      const chairBack = new THREE.Mesh(chairBackGeo, woodMat)
      chairBack.position.set(0, 0.72, 0.66)
      chairBack.castShadow = true
      group.add(chairBack)

      // Chair Legs
      for (const x of [-0.17, 0.17]) {
        for (const z of [0.32, 0.64]) {
          const legGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8)
          const leg = new THREE.Mesh(legGeo, steelMat)
          leg.position.set(x, 0.225, z)
          leg.castShadow = true
          group.add(leg)
        }
      }
      break
    }

    case 'streetlight': {
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.3, metalness: 0.85 })
      
      // Base
      const baseGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.35, 12)
      const base = new THREE.Mesh(baseGeo, poleMat)
      base.position.y = 0.175
      base.castShadow = true
      group.add(base)

      // Main Vertical Pole
      const poleGeo = new THREE.CylinderGeometry(0.05, 0.07, 3.6, 12)
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.y = 1.95
      pole.castShadow = true
      group.add(pole)

      // Curved Lamp Arm
      const armGeo = new THREE.BoxGeometry(0.06, 0.06, 0.8)
      const arm = new THREE.Mesh(armGeo, poleMat)
      arm.position.set(0, 3.65, 0.35)
      arm.castShadow = true
      group.add(arm)

      // Lamp Head
      const lampGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.18, 12)
      const lamp = new THREE.Mesh(lampGeo, poleMat)
      lamp.position.set(0, 3.55, 0.7)
      lamp.castShadow = true
      group.add(lamp)

      // Glowing Light Bulb
      const bulbGeo = new THREE.SphereGeometry(0.1, 16, 16)
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffea00 })
      const bulb = new THREE.Mesh(bulbGeo, bulbMat)
      bulb.position.set(0, 3.48, 0.7)
      group.add(bulb)
      break
    }

    case 'anime_tree': {
      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 1.8, 8)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 })
      const trunk = new THREE.Mesh(trunkGeo, trunkMat)
      trunk.position.y = 0.9
      trunk.castShadow = true
      group.add(trunk)

      // Fluffy Anime Foliage Clumps (Sakura / Anime Leaf Puffs)
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0xffb7c5, // Sakura Pink
        roughness: 0.7,
        flatShading: true
      })

      const clumps = [
        { pos: [0, 2.5, 0], scale: [1.3, 1.1, 1.3] },
        { pos: [0.6, 2.8, 0.4], scale: [0.9, 0.8, 0.9] },
        { pos: [-0.6, 2.7, -0.3], scale: [0.95, 0.85, 0.95] },
        { pos: [0, 3.4, 0], scale: [0.85, 0.75, 0.85] }
      ]

      clumps.forEach(({ pos, scale }) => {
        const clumpGeo = new THREE.DodecahedronGeometry(1.0, 1)
        const clump = new THREE.Mesh(clumpGeo, leafMat)
        clump.position.set(pos[0], pos[1], pos[2])
        clump.scale.set(scale[0], scale[1], scale[2])
        clump.castShadow = true
        clump.receiveShadow = true
        group.add(clump)
      })
      break
    }

    case 'cafe_parasol': {
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x33333d, roughness: 0.3, metalness: 0.8 })
      const fabricMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.6 })
      const tableMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f6, roughness: 0.3, metalness: 0.2 })

      // Round Table Top
      const tableGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 24)
      const table = new THREE.Mesh(tableGeo, tableMat)
      table.position.y = 0.75
      table.castShadow = true
      group.add(table)

      // Table Leg
      const tableLegGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 12)
      const tableLeg = new THREE.Mesh(tableLegGeo, metalMat)
      tableLeg.position.y = 0.375
      tableLeg.castShadow = true
      group.add(tableLeg)

      // Umbrella Pole
      const umbrellaPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.4, 12)
      const umbrellaPole = new THREE.Mesh(umbrellaPoleGeo, metalMat)
      umbrellaPole.position.y = 1.2
      umbrellaPole.castShadow = true
      group.add(umbrellaPole)

      // Umbrella Canopy (Cone)
      const canopyGeo = new THREE.ConeGeometry(1.3, 0.45, 16)
      const canopy = new THREE.Mesh(canopyGeo, fabricMat)
      canopy.position.y = 2.25
      canopy.castShadow = true
      group.add(canopy)
      break
    }

    case 'wooden_crate': {
      const crateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9)
      const crateMat = new THREE.MeshStandardMaterial({ color: 0xb08968, roughness: 0.75 })
      const crate = new THREE.Mesh(crateGeo, crateMat)
      crate.position.y = 0.45
      crate.castShadow = true
      crate.receiveShadow = true
      group.add(crate)

      // Corner reinforcement edges
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.6 })
      for (const y of [0.05, 0.85]) {
        const bandGeo = new THREE.BoxGeometry(0.92, 0.08, 0.92)
        const band = new THREE.Mesh(bandGeo, edgeMat)
        band.position.y = y
        group.add(band)
      }
      break
    }

    default: {
      const boxGeo = new THREE.BoxGeometry(1, 1, 1)
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x707080, roughness: 0.5 })
      const box = new THREE.Mesh(boxGeo, boxMat)
      box.position.y = 0.5
      box.castShadow = true
      group.add(box)
      break
    }
  }

  normalizePropMeshToGround(group)
  return group
}

/**
 * Calculates auto-fit uniform scale to match standard 1.6m human proportion
 */
export function calculateAutoFitScale(group: THREE.Group, targetHeightMeters = 1.6): number {
  const bbox = new THREE.Box3().setFromObject(group)
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim <= 0.001) return 1.0
  return Number((targetHeightMeters / maxDim).toFixed(3))
}

// ---------------- IndexedDB Persistence for Prop GLBs ----------------

const PROP_DB_NAME = 'VoomToonPropsDB'
const PROP_STORE_NAME = 'prop_glb_binaries'

function openPropDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const timer = setTimeout(() => {
      reject(new Error('IndexedDB openPropDB timed out'))
    }, 1200)

    try {
      const request = indexedDB.open(PROP_DB_NAME, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(PROP_STORE_NAME)) {
          db.createObjectStore(PROP_STORE_NAME)
        }
      }
      request.onsuccess = () => {
        clearTimeout(timer)
        resolve(request.result)
      }
      request.onerror = () => {
        clearTimeout(timer)
        reject(request.error)
      }
      request.onblocked = () => {
        clearTimeout(timer)
        reject(new Error('IndexedDB blocked'))
      }
    } catch (e) {
      clearTimeout(timer)
      reject(e)
    }
  })
}

export async function idbSavePropGlb(propId: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openPropDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROP_STORE_NAME, 'readwrite')
      const store = tx.objectStore(PROP_STORE_NAME)
      const req = store.put(buffer, propId)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('idbSavePropGlb error:', err)
  }
}

export async function idbGetPropGlb(propId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openPropDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROP_STORE_NAME, 'readonly')
      const store = tx.objectStore(PROP_STORE_NAME)
      const req = store.get(propId)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('idbGetPropGlb error:', err)
    return null
  }
}

export async function idbDeletePropGlb(propId: string): Promise<void> {
  try {
    const db = await openPropDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROP_STORE_NAME, 'readwrite')
      const store = tx.objectStore(PROP_STORE_NAME)
      const req = store.delete(propId)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('idbDeletePropGlb error:', err)
  }
}

export async function idbGetAllPropKeys(): Promise<string[]> {
  try {
    const db = await openPropDB()
    return new Promise((resolve) => {
      const tx = db.transaction(PROP_STORE_NAME, 'readonly')
      const store = tx.objectStore(PROP_STORE_NAME)
      const req = store.getAllKeys()
      req.onsuccess = () => resolve((req.result || []).map(String))
      req.onerror = () => resolve([])
    })
  } catch (err) {
    console.warn('idbGetAllPropKeys error:', err)
    return []
  }
}
