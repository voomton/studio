import * as THREE from 'three'
import { SavedCharacterRecord, VRMAvatarState, DEFAULT_AVATAR_STATE, DEFAULT_MATERIALS } from './vrmManager'

const VRM_DB_NAME = 'voomtoon-studio-db'
const VRM_STORE_NAME = 'vrm-binary-files'
const CHAR_STORAGE_KEY = 'voomtoon-saved-characters-v2'

export function openVrmDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const timer = setTimeout(() => {
      reject(new Error('IndexedDB open timed out'))
    }, 1200)

    try {
      const request = indexedDB.open(VRM_DB_NAME, 2)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(VRM_STORE_NAME)) {
          request.result.createObjectStore(VRM_STORE_NAME)
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

export async function idbSaveVrm(id: string, arrayBuffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openVrmDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VRM_STORE_NAME, 'readwrite')
      tx.objectStore(VRM_STORE_NAME).put(arrayBuffer, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('IDB save fallback error:', err)
  }
}

export async function idbGetVrm(id: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openVrmDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VRM_STORE_NAME, 'readonly')
      const request = tx.objectStore(VRM_STORE_NAME).get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.warn('IDB get fallback error:', err)
    return null
  }
}

export async function idbDeleteVrm(id: string): Promise<void> {
  try {
    const db = await openVrmDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VRM_STORE_NAME, 'readwrite')
      tx.objectStore(VRM_STORE_NAME).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('IDB delete error:', err)
  }
}

export async function idbGetAllVrmKeys(): Promise<string[]> {
  try {
    const db = await openVrmDb()
    return new Promise((resolve) => {
      const tx = db.transaction(VRM_STORE_NAME, 'readonly')
      const req = tx.objectStore(VRM_STORE_NAME).getAllKeys()
      req.onsuccess = () => resolve((req.result || []).map(String))
      req.onerror = () => resolve([])
    })
  } catch (err) {
    console.warn('IDB getAllKeys error:', err)
    return []
  }
}

// Demo character IDs and names to permanently purge and never re-create
export const DEMO_CHARACTER_IDS = [
  'char_ryo_tanaka',
  'char_sakura_aiko',
  'char_kaito_sora',
  'char_mira',
  'char_leon_vance',
  'char_yuki_copy'
] as const

export const DEMO_CHARACTER_NAMES = [
  'Ryo Tanaka',
  'Sakura Aiko',
  'Kaito Sora',
  'Mira',
  'Leon Vance',
  'Yuki (Copy)'
] as const

/**
 * Permanently purges demo/seed characters from localStorage and IndexedDB.
 * Ensures the Character Library and Scene Builder start completely empty by default.
 */
export async function purgeDemoCharacters(): Promise<void> {
  try {
    // 1. Clean localStorage character library
    const raw = localStorage.getItem(CHAR_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(c => 
          c && 
          !DEMO_CHARACTER_IDS.includes(c.id as any) && 
          !DEMO_CHARACTER_NAMES.some(name => c.name?.includes(name))
        )
        localStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(cleaned))
      }
    }

    // 2. Clean localStorage scene characters
    const sceneCharsRaw = localStorage.getItem('voomtoon_scene_characters_v1')
    if (sceneCharsRaw) {
      const parsed = JSON.parse(sceneCharsRaw)
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(c => 
          c && 
          !DEMO_CHARACTER_IDS.includes(c.characterId as any) && 
          !DEMO_CHARACTER_NAMES.some(name => c.name?.includes(name))
        )
        localStorage.setItem('voomtoon_scene_characters_v1', JSON.stringify(cleaned))
      }
    }

    // 3. Clean IndexedDB for demo character IDs
    for (const demoId of DEMO_CHARACTER_IDS) {
      try {
        await idbDeleteVrm(demoId)
      } catch {
        // silent IDB guard
      }
    }

    // 4. Clean any legacy demo animation project to keep timeline empty
    const animRaw = localStorage.getItem('voomtoon_animation_project_v2')
    if (animRaw) {
      try {
        const anim = JSON.parse(animRaw)
        if (anim && (anim.id === 'project_voomtoon_demo' || anim.name?.includes('Anime Episode 01'))) {
          localStorage.removeItem('voomtoon_animation_project_v2')
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Error purging demo characters:', err)
  }
}

// Candidate storage keys for character recovery across versions
export const CANDIDATE_CHAR_STORAGE_KEYS = [
  'voomtoon-saved-characters-v2',
  'voomtoon_saved_characters_backup',
  'voomtoon-saved-characters-v1',
  'voomtoon-saved-characters',
  'voomtoon_saved_characters_v2',
  'voomtoon_saved_characters_v1',
  'voomtoon_saved_characters',
  'voomtoon_characters_v2',
  'voomtoon_characters_v1',
  'voomtoon_characters',
  'voomtoon_character_library'
]

/**
 * Get all saved character records
 */
export function getSavedCharactersList(): SavedCharacterRecord[] {
  return loadSavedCharactersList()
}

/**
 * Safely loads character records from primary key, candidate backup keys, all localStorage entries, and scene/track instances.
 * Never drops user characters.
 */
export function loadSavedCharactersList(): SavedCharacterRecord[] {
  const charactersMap = new Map<string, SavedCharacterRecord>()

  const ingestItem = (item: any) => {
    if (!item || typeof item !== 'object') return
    const id = item.id || item.characterId
    if (!id || typeof id !== 'string') return

    // Filter out known demo dummy IDs/names
    const isDemo = DEMO_CHARACTER_IDS.includes(id as any) ||
      (item.name && DEMO_CHARACTER_NAMES.some(name => item.name.includes(name)))
    if (isDemo) return

    const existing = charactersMap.get(id)
    const rawName = item.name || item.meta?.title || (existing ? existing.name : undefined)
    const cleanName = rawName && !rawName.startsWith('Character ') ? rawName : (existing?.name || rawName || 'Saved Character')

    const record: SavedCharacterRecord = {
      id,
      name: cleanName,
      createdAt: item.createdAt || existing?.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
      templateType: item.templateType || existing?.templateType,
      thumbnail: item.thumbnail || existing?.thumbnail,
      state: item.state || existing?.state || {
        ...DEFAULT_AVATAR_STATE,
        id,
        meta: { ...DEFAULT_AVATAR_STATE.meta, title: cleanName }
      }
    }
    charactersMap.set(id, record)
  }

  const tryParseAndIngest = (raw: string | null) => {
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          ingestItem(item)
        }
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.characters)) {
          for (const item of parsed.characters) ingestItem(item)
        } else if (Array.isArray(parsed.characterList)) {
          for (const item of parsed.characterList) ingestItem(item)
        } else if (parsed.id) {
          ingestItem(parsed)
        }
      }
    } catch {
      // Ignore JSON parse errors for non-JSON storage items
    }
  }

  try {
    // 1. Check all explicit candidate storage keys
    for (const key of CANDIDATE_CHAR_STORAGE_KEYS) {
      try {
        tryParseAndIngest(localStorage.getItem(key))
      } catch {}
    }

    // 2. Scan all other localStorage keys for any character data
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && !CANDIDATE_CHAR_STORAGE_KEYS.includes(k)) {
          if (/char|avatar|vrm|hero|actor/i.test(k)) {
            try {
              tryParseAndIngest(localStorage.getItem(k))
            } catch {}
          }
        }
      }
    }

    // 3. Also check scene characters storage to recover any character instances that exist there
    try {
      const sceneCharsRaw = localStorage.getItem('voomtoon_scene_characters_v1')
      if (sceneCharsRaw) {
        const sceneChars = JSON.parse(sceneCharsRaw)
        if (Array.isArray(sceneChars)) {
          for (const sc of sceneChars) {
            if (sc && (sc.characterId || sc.id)) {
              ingestItem({
                id: sc.characterId || sc.id,
                name: sc.name,
                state: sc.state,
                createdAt: sc.createdAt
              })
            }
          }
        }
      }
    } catch {}

    // 4. Also check animation project tracks to recover named characters
    try {
      const animRaw = localStorage.getItem('voomtoon_animation_project_v2')
      if (animRaw) {
        const anim = JSON.parse(animRaw)
        if (anim && Array.isArray(anim.tracks)) {
          for (const tr of anim.tracks) {
            if (tr && tr.targetType === 'character' && tr.targetId && tr.targetName) {
              ingestItem({
                id: tr.targetId,
                name: tr.targetName
              })
            }
          }
        }
      }
    } catch {}

    const mergedList = Array.from(charactersMap.values())
    if (mergedList.length > 0) {
      // Sync back to primary key and backup
      try {
        localStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(mergedList))
        localStorage.setItem('voomtoon_saved_characters_backup', JSON.stringify(mergedList))
      } catch {}
      return mergedList
    }
  } catch (e) {
    console.warn('Failed to parse character library:', e)
  }

  return []
}

/**
 * Asynchronously recovers characters from IndexedDB binary files in case localStorage was cleared
 */
export async function recoverCharactersFromIndexedDB(): Promise<SavedCharacterRecord[]> {
  try {
    const existingList = loadSavedCharactersList()
    const existingMap = new Map(existingList.map(c => [c.id, c]))
    const idbKeys = await idbGetAllVrmKeys()
    let hasNew = false

    for (const key of idbKeys) {
      if (DEMO_CHARACTER_IDS.includes(key as any)) continue
      if (!existingMap.has(key)) {
        // Construct character record for this stored VRM
        const cleanName = key.startsWith('char-') || key.startsWith('char_') 
          ? `Character ${existingMap.size + 1}` 
          : key.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
        const newRecord: SavedCharacterRecord = {
          id: key,
          name: cleanName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          state: {
            ...DEFAULT_AVATAR_STATE,
            id: key,
            meta: {
              ...DEFAULT_AVATAR_STATE.meta,
              title: cleanName
            }
          }
        }
        existingMap.set(key, newRecord)
        hasNew = true
      }
    }

    const finalList = Array.from(existingMap.values())
    if (hasNew) {
      saveCharactersList(finalList)
    }
    return finalList
  } catch (err) {
    console.warn('Failed to recover characters from IndexedDB:', err)
    return loadSavedCharactersList()
  }
}

export function saveCharacterRecord(id: string, name: string, state: VRMAvatarState, thumbnail?: string): SavedCharacterRecord[] {
  const currentList = loadSavedCharactersList()
  const existingIdx = currentList.findIndex(c => c.id === id)
  
  const updatedRecord: SavedCharacterRecord = {
    id,
    name,
    createdAt: existingIdx >= 0 ? currentList[existingIdx].createdAt : Date.now(),
    updatedAt: Date.now(),
    state,
    thumbnail: thumbnail || (existingIdx >= 0 ? currentList[existingIdx].thumbnail : undefined)
  }

  let nextList: SavedCharacterRecord[]
  if (existingIdx >= 0) {
    nextList = [...currentList]
    nextList[existingIdx] = updatedRecord
  } else {
    nextList = [updatedRecord, ...currentList]
  }

  saveCharactersList(nextList)
  return nextList
}

export function deleteCharacterRecord(id: string): SavedCharacterRecord[] {
  const currentList = loadSavedCharactersList()
  const nextList = currentList.filter(c => c.id !== id)
  saveCharactersList(nextList)
  return nextList
}

export function createDefaultCharacterRecord(templateType: 'female_mage' | 'male_warrior' | 'female_idol' | 'custom_empty' = 'female_mage'): SavedCharacterRecord {
  const id = `char-${Date.now()}`
  const nameMap = {
    female_mage: 'Noble Anime Mage',
    male_warrior: 'Cyber Blade Hero',
    female_idol: 'Idol Pop Star',
    custom_empty: 'Custom Avatar'
  }

  const name = nameMap[templateType] || 'Custom Character'

  const state: VRMAvatarState = {
    ...DEFAULT_AVATAR_STATE,
    id,
    fileName: `${name.replace(/\s+/g, '_')}.vrm`,
    meta: {
      ...DEFAULT_AVATAR_STATE.meta,
      title: name
    }
  }

  return {
    id,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    templateType,
    state
  }
}

export function saveCharactersList(list: SavedCharacterRecord[]) {
  try {
    localStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(list))
    localStorage.setItem('voomtoon_saved_characters_backup', JSON.stringify(list))
  } catch (e) {
    console.warn('Failed to save character list:', e)
  }
}

/**
 * Creates a procedural 3D Manga Mannequin Rig with full VRM-compatible bone structure,
 * modest opaque layered clothing that covers the body completely, and facial blendshapes.
 */
export function createProceduralAnimeRig(characterType: string = 'female_mage', name = 'Custom Character') {
  const group = new THREE.Group()
  group.name = name

  const isHoodie = characterType === 'male_hoodie'
  const isMaleWarrior = characterType === 'male_warrior'
  const isIdol = characterType === 'female_idol'

  // Color Palettes
  const skinColor = isHoodie ? 0xF5D0B5 : isMaleWarrior ? 0xDDB892 : isIdol ? 0xFFE0D0 : 0xF8D8C8
  const suitColor = isHoodie ? 0x18181B : isMaleWarrior ? 0x1E293B : isIdol ? 0xDB2777 : 0x4C1D95
  const trimColor = isHoodie ? 0xDC2626 : isMaleWarrior ? 0x0EA5E9 : isIdol ? 0xFDE047 : 0xFACC15
  const pantsColor = isHoodie ? 0x1F2937 : isMaleWarrior ? 0x111827 : isIdol ? 0xBE185D : 0x311042
  const hairColor = isHoodie ? 0x18181B : isMaleWarrior ? 0x0F172A : isIdol ? 0x4A2810 : 0x6B21A8

  const matSkin = new THREE.MeshStandardMaterial({
    name: 'skin',
    color: skinColor,
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.DoubleSide
  })

  const matSuit = new THREE.MeshStandardMaterial({
    name: 'outfit',
    color: suitColor,
    roughness: 0.7,
    metalness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true
  })

  const matTrim = new THREE.MeshStandardMaterial({
    name: 'outfit_trim',
    color: trimColor,
    roughness: 0.45,
    metalness: 0.15,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true
  })

  const matPants = new THREE.MeshStandardMaterial({
    name: 'outfit_bottom',
    color: pantsColor,
    roughness: 0.75,
    metalness: 0.05,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true
  })

  const matShoes = new THREE.MeshStandardMaterial({
    name: 'outfit_shoes',
    color: trimColor,
    roughness: 0.4,
    metalness: 0.15,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true
  })

  const matSole = new THREE.MeshStandardMaterial({
    name: 'outfit_sole',
    color: 0xF8FAFC,
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide
  })

  const matHair = new THREE.MeshStandardMaterial({
    name: 'hair',
    color: hairColor,
    roughness: 0.65,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  const matEye = new THREE.MeshBasicMaterial({ 
    name: 'eyes',
    color: isHoodie ? 0x854D0E : isMaleWarrior ? 0x0284C7 : isIdol ? 0x059669 : 0x7C3AED 
  })
  const matPupil = new THREE.MeshBasicMaterial({ name: 'pupils', color: 0x09090B })
  const matEyeWhite = new THREE.MeshBasicMaterial({ name: 'eyewhite', color: 0xFFFFFF })
  const matMouth = new THREE.MeshBasicMaterial({ name: 'mouth', color: 0x9F1239 })

  // Hierarchical Bone Nodes Map
  const bones: Record<string, THREE.Object3D> = {}

  // 1. Hips / Root (grounded around 0.96m)
  const hips = new THREE.Group()
  hips.name = 'hips'
  hips.position.set(0, 0.95, 0)
  group.add(hips)
  bones['hips'] = hips

  // Pelvis / Lower Hoodie Hem
  const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.155, 0.18, 16), isHoodie ? matSuit : matPants)
  pelvisMesh.name = 'outfit_pelvis'
  pelvisMesh.position.set(0, 0, 0)
  hips.add(pelvisMesh)

  if (isHoodie) {
    // Ribbed bottom hem of hoodie
    const hoodieHem = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 16), matSuit)
    hoodieHem.name = 'outfit_hoodie_hem'
    hoodieHem.position.set(0, -0.07, 0)
    hips.add(hoodieHem)
  }

  // Skirt / Tunic hem for idol or mage
  if (isIdol || (!isHoodie && !isMaleWarrior)) {
    const skirtMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 0.24, 16), matSuit)
    skirtMesh.name = 'outfit_skirt'
    skirtMesh.position.set(0, -0.1, 0)
    hips.add(skirtMesh)

    const skirtTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.278, 0.285, 0.03, 16), matTrim)
    skirtTrim.name = 'outfit_skirt_trim'
    skirtTrim.position.set(0, -0.21, 0)
    hips.add(skirtTrim)
  }

  // 2. Spine
  const spine = new THREE.Group()
  spine.name = 'spine'
  spine.position.set(0, 0.12, 0)
  hips.add(spine)
  bones['spine'] = spine

  const spineMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.165, 0.16, 16), matSuit)
  spineMesh.name = 'outfit_spine'
  spineMesh.position.set(0, 0.08, 0)
  spine.add(spineMesh)

  // 3. Chest / Torso
  const chest = new THREE.Group()
  chest.name = 'chest'
  chest.position.set(0, 0.16, 0)
  spine.add(chest)
  bones['chest'] = chest

  const chestWidth = (isHoodie || isMaleWarrior) ? 0.20 : 0.16
  const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(chestWidth * 2, 0.24, 0.22), matSuit)
  chestMesh.name = 'outfit_chest'
  chestMesh.position.set(0, 0.12, 0)
  chest.add(chestMesh)

  if (isHoodie) {
    // Red chest diagonal graphic / slash accent
    const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(chestWidth * 1.8, 0.04, 0.226), matTrim)
    chestStripe.name = 'outfit_stripe'
    chestStripe.position.set(0, 0.14, 0.002)
    chest.add(chestStripe)

    // Kangaroo front pocket
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.03), matSuit)
    pocket.name = 'outfit_pocket'
    pocket.position.set(0, 0.04, 0.115)
    chest.add(pocket)

    // Folded red hood resting on upper back/shoulders
    const hoodFold = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.15, 12, 1, false, 0, Math.PI), matTrim)
    hoodFold.name = 'outfit_hood'
    hoodFold.rotation.x = 0.5
    hoodFold.rotation.y = Math.PI
    hoodFold.position.set(0, 0.18, -0.10)
    chest.add(hoodFold)

    // Red dangling hoodie drawstrings
    const stringL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), matTrim)
    stringL.name = 'outfit_string'
    stringL.position.set(0.06, 0.12, 0.12)
    chest.add(stringL)

    const tipL = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.02, 6), matSole)
    tipL.name = 'outfit_string_tip'
    tipL.position.set(0.06, 0.035, 0.12)
    chest.add(tipL)

    const stringR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), matTrim)
    stringR.name = 'outfit_string'
    stringR.position.set(-0.06, 0.12, 0.12)
    chest.add(stringR)

    const tipR = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.02, 6), matSole)
    tipR.name = 'outfit_string_tip'
    tipR.position.set(-0.06, 0.035, 0.12)
    chest.add(tipR)
  } else {
    const collar = new THREE.Mesh(new THREE.BoxGeometry(chestWidth * 2.05, 0.05, 0.21), matTrim)
    collar.name = 'outfit_collar'
    collar.position.set(0, 0.21, 0)
    chest.add(collar)
  }

  // 4. Neck
  const neck = new THREE.Group()
  neck.name = 'neck'
  neck.position.set(0, 0.24, 0)
  chest.add(neck)
  bones['neck'] = neck

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.1, 12), matSkin)
  neckMesh.name = 'skin_neck'
  neckMesh.position.set(0, 0.05, 0)
  neck.add(neckMesh)

  // 5. Head
  const head = new THREE.Group()
  head.name = 'head'
  head.position.set(0, 0.1, 0)
  neck.add(head)
  bones['head'] = head

  // Stylized anime face mesh
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.165, 24, 24), matSkin)
  headMesh.name = 'skin_head'
  headMesh.scale.set(1, 1.15, 1.05)
  headMesh.position.set(0, 0.12, 0)
  head.add(headMesh)

  // Anime Chin / Jaw taper
  const jawMesh = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 8), matSkin)
  jawMesh.name = 'skin_jaw'
  jawMesh.rotation.x = Math.PI
  jawMesh.position.set(0, 0.04, 0.06)
  head.add(jawMesh)

  // Anime Hair: layered base + bangs + spiky crown
  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.178, 20, 20), matHair)
  hairBase.name = 'hair_base'
  hairBase.position.set(0, 0.15, -0.02)
  hairBase.scale.set(1.06, 1.12, 1.08)
  head.add(hairBase)

  // Front Anime Bangs
  const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.13, 0.09), matHair)
  hairBangs.name = 'hair_bangs'
  hairBangs.position.set(0, 0.23, 0.12)
  hairBangs.rotation.x = 0.28
  head.add(hairBangs)

  // Spiky Anime Side Locks
  const sideL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 6), matHair)
  sideL.name = 'hair_sidelock'
  sideL.position.set(0.16, 0.14, 0.06)
  sideL.rotation.z = -0.3
  sideL.rotation.x = 0.2
  head.add(sideL)

  const sideR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 6), matHair)
  sideR.name = 'hair_sidelock'
  sideR.position.set(-0.16, 0.14, 0.06)
  sideR.rotation.z = 0.3
  sideR.rotation.x = 0.2
  head.add(sideR)

  // Top spikes
  const topSpike1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), matHair)
  topSpike1.name = 'hair_spike'
  topSpike1.position.set(0.04, 0.32, -0.02)
  topSpike1.rotation.z = -0.2
  head.add(topSpike1)

  const topSpike2 = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 6), matHair)
  topSpike2.name = 'hair_spike'
  topSpike2.position.set(-0.06, 0.31, 0.02)
  topSpike2.rotation.z = 0.25
  head.add(topSpike2)

  if (isIdol) {
    // Twin tails
    const twinL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.48, 8), matHair)
    twinL.name = 'hair_twintail'
    twinL.position.set(0.21, 0.15, -0.06)
    twinL.rotation.z = -0.38
    head.add(twinL)
    const twinR = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.48, 8), matHair)
    twinR.name = 'hair_twintail'
    twinR.position.set(-0.21, 0.15, -0.06)
    twinR.rotation.z = 0.38
    head.add(twinR)
  }

  // Anime Eyes with Highlights
  const eyeWhiteL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.015), matEyeWhite)
  eyeWhiteL.name = 'eyes_white_l'
  eyeWhiteL.position.set(0.065, 0.138, 0.152)
  head.add(eyeWhiteL)

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.038, 0.018), matEye)
  eyeL.name = 'eyes_l'
  eyeL.position.set(0.065, 0.138, 0.154)
  head.add(eyeL)

  const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.020), matPupil)
  pupilL.name = 'pupil_l'
  pupilL.position.set(0.065, 0.138, 0.156)
  head.add(pupilL)

  const eyeWhiteR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.015), matEyeWhite)
  eyeWhiteR.name = 'eyes_white_r'
  eyeWhiteR.position.set(-0.065, 0.138, 0.152)
  head.add(eyeWhiteR)

  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.038, 0.018), matEye)
  eyeR.name = 'eyes_r'
  eyeR.position.set(-0.065, 0.138, 0.154)
  head.add(eyeR)

  const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.020), matPupil)
  pupilR.name = 'pupil_r'
  pupilR.position.set(-0.065, 0.138, 0.156)
  head.add(pupilR)

  // Eyebrows
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.014, 0.015), matHair)
  browL.name = 'eyebrows_l'
  browL.position.set(0.065, 0.178, 0.158)
  head.add(browL)

  const browR = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.014, 0.015), matHair)
  browR.name = 'eyebrows_r'
  browR.position.set(-0.065, 0.178, 0.158)
  head.add(browR)

  // Mouth
  const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.015, 8), matMouth)
  mouth.name = 'mouth'
  mouth.rotation.x = Math.PI / 2
  mouth.position.set(0, 0.062, 0.155)
  head.add(mouth)

  // 6. Left Arm
  const leftShoulder = new THREE.Group()
  leftShoulder.name = 'leftShoulder'
  leftShoulder.position.set(0.20, 0.18, 0)
  chest.add(leftShoulder)
  bones['leftShoulder'] = leftShoulder

  const leftUpperArm = new THREE.Group()
  leftUpperArm.name = 'leftUpperArm'
  leftUpperArm.position.set(0.08, 0, 0)
  leftShoulder.add(leftUpperArm)
  bones['leftUpperArm'] = leftUpperArm

  const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.050, 0.26, 12), matSuit)
  lArmMesh.name = 'outfit_upper_arm_l'
  lArmMesh.position.set(0, -0.13, 0)
  leftUpperArm.add(lArmMesh)

  if (isHoodie) {
    // Red armband / accent stripe
    const lBand = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.056, 0.035, 12), matTrim)
    lBand.name = 'outfit_armband'
    lBand.position.set(0, -0.09, 0)
    leftUpperArm.add(lBand)
  }

  const leftLowerArm = new THREE.Group()
  leftLowerArm.name = 'leftLowerArm'
  leftLowerArm.position.set(0, -0.26, 0)
  leftUpperArm.add(leftLowerArm)
  bones['leftLowerArm'] = leftLowerArm

  const lForeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.042, 0.24, 12), isHoodie ? matSuit : matSkin)
  lForeMesh.name = 'outfit_lower_arm_l'
  lForeMesh.position.set(0, -0.12, 0)
  leftLowerArm.add(lForeMesh)

  if (isHoodie) {
    // Red ribbed wrist cuff
    const lCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.035, 12), matTrim)
    lCuff.name = 'outfit_cuff_l'
    lCuff.position.set(0, -0.22, 0)
    leftLowerArm.add(lCuff)
  }

  const leftHand = new THREE.Group()
  leftHand.name = 'leftHand'
  leftHand.position.set(0, -0.24, 0)
  leftLowerArm.add(leftHand)
  bones['leftHand'] = leftHand

  const lHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.035), matSkin)
  lHandMesh.name = 'skin_hand_l'
  lHandMesh.position.set(0, -0.04, 0)
  leftHand.add(lHandMesh)

  // 7. Right Arm
  const rightShoulder = new THREE.Group()
  rightShoulder.name = 'rightShoulder'
  rightShoulder.position.set(-0.20, 0.18, 0)
  chest.add(rightShoulder)
  bones['rightShoulder'] = rightShoulder

  const rightUpperArm = new THREE.Group()
  rightUpperArm.name = 'rightUpperArm'
  rightUpperArm.position.set(-0.08, 0, 0)
  rightShoulder.add(rightUpperArm)
  bones['rightUpperArm'] = rightUpperArm

  const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.050, 0.26, 12), matSuit)
  rArmMesh.name = 'outfit_upper_arm_r'
  rArmMesh.position.set(0, -0.13, 0)
  rightUpperArm.add(rArmMesh)

  const rightLowerArm = new THREE.Group()
  rightLowerArm.name = 'rightLowerArm'
  rightLowerArm.position.set(0, -0.26, 0)
  rightUpperArm.add(rightLowerArm)
  bones['rightLowerArm'] = rightLowerArm

  const rForeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.042, 0.24, 12), isHoodie ? matSuit : matSkin)
  rForeMesh.name = 'outfit_lower_arm_r'
  rForeMesh.position.set(0, -0.12, 0)
  rightLowerArm.add(rForeMesh)

  if (isHoodie) {
    const rCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.035, 12), matTrim)
    rCuff.name = 'outfit_cuff_r'
    rCuff.position.set(0, -0.22, 0)
    rightLowerArm.add(rCuff)
  }

  const rightHand = new THREE.Group()
  rightHand.name = 'rightHand'
  rightHand.position.set(0, -0.24, 0)
  rightLowerArm.add(rightHand)
  bones['rightHand'] = rightHand

  const rHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.035), matSkin)
  rHandMesh.name = 'skin_hand_r'
  rHandMesh.position.set(0, -0.04, 0)
  rightHand.add(rHandMesh)

  // 8. Left Leg
  const leftUpperLeg = new THREE.Group()
  leftUpperLeg.name = 'leftUpperLeg'
  leftUpperLeg.position.set(0.09, -0.08, 0)
  hips.add(leftUpperLeg)
  bones['leftUpperLeg'] = leftUpperLeg

  const lThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.060, 0.38, 14), matPants)
  lThighMesh.name = 'outfit_thigh_l'
  lThighMesh.position.set(0, -0.19, 0)
  leftUpperLeg.add(lThighMesh)

  const leftLowerLeg = new THREE.Group()
  leftLowerLeg.name = 'leftLowerLeg'
  leftLowerLeg.position.set(0, -0.38, 0)
  leftUpperLeg.add(leftLowerLeg)
  bones['leftLowerLeg'] = leftLowerLeg

  const lShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.050, 0.38, 14), matPants)
  lShinMesh.name = 'outfit_shin_l'
  lShinMesh.position.set(0, -0.19, 0)
  leftLowerLeg.add(lShinMesh)

  const leftFoot = new THREE.Group()
  leftFoot.name = 'leftFoot'
  leftFoot.position.set(0, -0.38, 0)
  leftLowerLeg.add(leftFoot)
  bones['leftFoot'] = leftFoot

  // High-top red & black sneakers with white sole
  const lShoeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.075, 0.18), matShoes)
  lShoeMesh.name = 'outfit_shoes_l'
  lShoeMesh.position.set(0, -0.025, 0.04)
  leftFoot.add(lShoeMesh)

  const lSoleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.02, 0.185), matSole)
  lSoleMesh.name = 'outfit_sole_l'
  lSoleMesh.position.set(0, -0.065, 0.04)
  leftFoot.add(lSoleMesh)

  // 9. Right Leg
  const rightUpperLeg = new THREE.Group()
  rightUpperLeg.name = 'rightUpperLeg'
  rightUpperLeg.position.set(-0.09, -0.08, 0)
  hips.add(rightUpperLeg)
  bones['rightUpperLeg'] = rightUpperLeg

  const rThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.060, 0.38, 14), matPants)
  rThighMesh.name = 'outfit_thigh_r'
  rThighMesh.position.set(0, -0.19, 0)
  rightUpperLeg.add(rThighMesh)

  const rightLowerLeg = new THREE.Group()
  rightLowerLeg.name = 'rightLowerLeg'
  rightLowerLeg.position.set(0, -0.38, 0)
  rightUpperLeg.add(rightLowerLeg)
  bones['rightLowerLeg'] = rightLowerLeg

  const rShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.060, 0.050, 0.38, 14), matPants)
  rShinMesh.name = 'outfit_shin_r'
  rShinMesh.position.set(0, -0.19, 0)
  rightLowerLeg.add(rShinMesh)

  const rightFoot = new THREE.Group()
  rightFoot.name = 'rightFoot'
  rightFoot.position.set(0, -0.38, 0)
  rightLowerLeg.add(rightFoot)
  bones['rightFoot'] = rightFoot

  const rShoeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.075, 0.18), matShoes)
  rShoeMesh.name = 'outfit_shoes_r'
  rShoeMesh.position.set(0, -0.025, 0.04)
  rightFoot.add(rShoeMesh)

  const rSoleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.02, 0.185), matSole)
  rSoleMesh.name = 'outfit_sole_r'
  rSoleMesh.position.set(0, -0.065, 0.04)
  rightFoot.add(rSoleMesh)

  // Register optional secondary humanoid bones to parent extremity nodes
  bones['upperChest'] = chest
  bones['leftToes'] = leftFoot
  bones['rightToes'] = rightFoot

  // Emulated VRM Object
  const vrmWrapper = {
    scene: group,
    userData: {} as Record<string, any>,
    isProcedural: true,
    humanoid: {
      getNormalizedBoneNode: (boneName: string) => bones[boneName] || null,
      getRawBoneNode: (boneName: string) => bones[boneName] || null,
      update: () => {}
    },
    expressionManager: {
      setValue: (expressionName: string, value: number) => {
        if (['aa', 'ih', 'ou', 'ee', 'oh'].includes(expressionName)) {
          mouth.scale.set(1 + value * 1.5, 1 + value * 2.5, 1)
        } else if (expressionName === 'blink' || expressionName === 'blinkLeft' || expressionName === 'blinkRight') {
          eyeL.scale.y = Math.max(0.1, 1 - value * 0.9)
          eyeR.scale.y = Math.max(0.1, 1 - value * 0.9)
        } else if (expressionName === 'happy') {
          browL.position.y = 0.178 + value * 0.02
          browR.position.y = 0.178 + value * 0.02
          browL.rotation.z = -value * 0.2
          browR.rotation.z = value * 0.2
        } else if (expressionName === 'angry') {
          browL.rotation.z = value * 0.3
          browR.rotation.z = -value * 0.3
          browL.position.y = 0.178 - value * 0.02
          browR.position.y = 0.178 - value * 0.02
        } else if (expressionName === 'sad') {
          browL.rotation.z = -value * 0.3
          browR.rotation.z = value * 0.3
        } else if (expressionName === 'surprised') {
          eyeL.scale.set(1 + value * 0.5, 1 + value * 0.8, 1)
          eyeR.scale.set(1 + value * 0.5, 1 + value * 0.8, 1)
          mouth.scale.set(1.4, 2.5 * value, 1)
        }
      },
      getValue: () => 0,
      update: () => {}
    },
    blendShapeProxy: {
      setValue: (name: string, value: number) => {
        if (['aa', 'ih', 'ou', 'ee', 'oh'].includes(name)) {
          mouth.scale.set(1 + value * 1.5, 1 + value * 2.5, 1)
        } else if (name === 'blink' || name === 'blinkLeft' || name === 'blinkRight') {
          eyeL.scale.y = Math.max(0.1, 1 - value * 0.9)
          eyeR.scale.y = Math.max(0.1, 1 - value * 0.9)
        }
      },
      update: () => {}
    },
    lookAt: {
      target: null as THREE.Object3D | null
    },
    meta: {
      metaVersion: '0' as const,
      title: name,
      author: 'Voom Anime Engine',
      version: '1.0',
      vrmVersion: '0.0',
      triangleCount: 3840,
      meshCount: 26,
      materialCount: 9
    },
    update: (_delta: number) => {
      // Stable
    }
  }

  return vrmWrapper as any
}
