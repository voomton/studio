import * as THREE from 'three'
import { CharacterConfig, PoseId } from '../types/character'
import {
  getToonGradientMap,
  generateAnimeEyeTexture,
  generateBlushTexture,
  generateMouthTexture
} from './toonShader'

export interface CharacterRig {
  root: THREE.Group
  bones: {
    hips: THREE.Group
    spine: THREE.Group
    chest: THREE.Group
    neck: THREE.Group
    head: THREE.Group
    leftShoulder: THREE.Group
    leftArm: THREE.Group
    leftForearm: THREE.Group
    leftHand: THREE.Group
    rightShoulder: THREE.Group
    rightArm: THREE.Group
    rightForearm: THREE.Group
    rightHand: THREE.Group
    leftUpLeg: THREE.Group
    leftLeg: THREE.Group
    leftFoot: THREE.Group
    rightUpLeg: THREE.Group
    rightLeg: THREE.Group
    rightFoot: THREE.Group
  }
  materials: {
    skin: THREE.MeshToonMaterial
    eyeLeft: THREE.MeshBasicMaterial
    eyeRight: THREE.MeshBasicMaterial
    blush: THREE.MeshBasicMaterial
    mouth: THREE.MeshBasicMaterial
    eyebrows: THREE.MeshToonMaterial
    hair: THREE.MeshToonMaterial
    hairHighlight: THREE.MeshBasicMaterial
    outfitPrimary: THREE.MeshToonMaterial
    outfitSecondary: THREE.MeshToonMaterial
    outfitTrim: THREE.MeshToonMaterial
    shoes: THREE.MeshToonMaterial
    socks: THREE.MeshToonMaterial
    accessories: THREE.MeshToonMaterial
  }
  updatePose: (pose: PoseId, time?: number) => void
  dispose: () => void
}

/**
 * Builds a smooth, seamless parametric anime character model.
 */
export function createAnimeCharacterRig(config: CharacterConfig): CharacterRig {
  const root = new THREE.Group()
  root.name = 'AnimeCharacterRoot'

  const toonGrad = getToonGradientMap(3)

  // 1. Materials Initialization
  const skinColor = new THREE.Color(config.body.skinTone)
  const hairColor = new THREE.Color(config.hair.baseColor)
  const hairHighlightColor = new THREE.Color(config.hair.highlightColor)
  const outfit1Color = new THREE.Color(config.outfit.primaryColor)
  const outfit2Color = new THREE.Color(config.outfit.secondaryColor)
  const outfitTrimColor = new THREE.Color(config.outfit.trimColor)
  const shoesColor = new THREE.Color(config.outfit.shoeColor)
  const socksColor = new THREE.Color(config.outfit.socksColor)
  const eyebrowColor = new THREE.Color(config.face.eyebrowColor || config.hair.baseColor)

  const matSkin = new THREE.MeshToonMaterial({
    color: skinColor,
    gradientMap: toonGrad
  })

  const eyeTexLeft = generateAnimeEyeTexture(
    config.face.eyeShape,
    config.face.eyeColor,
    config.face.eyeSecondaryColor,
    config.face.pupilColor,
    false
  )
  const eyeTexRight = generateAnimeEyeTexture(
    config.face.eyeShape,
    config.face.eyeColor,
    config.face.eyeSecondaryColor,
    config.face.pupilColor,
    true
  )

  const matEyeLeft = new THREE.MeshBasicMaterial({
    map: eyeTexLeft,
    transparent: true,
    depthWrite: false
  })
  const matEyeRight = new THREE.MeshBasicMaterial({
    map: eyeTexRight,
    transparent: true,
    depthWrite: false
  })

  const blushTex = generateBlushTexture(config.face.blushColor)
  const matBlush = new THREE.MeshBasicMaterial({
    map: blushTex,
    transparent: true,
    opacity: config.face.blushIntensity,
    depthWrite: false
  })

  const mouthTex = generateMouthTexture(config.face.mouthExpression, config.body.skinTone)
  const matMouth = new THREE.MeshBasicMaterial({
    map: mouthTex,
    transparent: true,
    depthWrite: false
  })

  const matEyebrows = new THREE.MeshToonMaterial({
    color: eyebrowColor,
    gradientMap: toonGrad
  })

  const matHair = new THREE.MeshToonMaterial({
    color: hairColor,
    gradientMap: toonGrad
  })

  const matHairHighlight = new THREE.MeshBasicMaterial({
    color: hairHighlightColor,
    transparent: true,
    opacity: 0.65 * config.hair.glossIntensity
  })

  const matOutfitPrimary = new THREE.MeshToonMaterial({
    color: outfit1Color,
    gradientMap: toonGrad
  })

  const matOutfitSecondary = new THREE.MeshToonMaterial({
    color: outfit2Color,
    gradientMap: toonGrad
  })

  const matOutfitTrim = new THREE.MeshToonMaterial({
    color: outfitTrimColor,
    gradientMap: toonGrad
  })

  const matShoes = new THREE.MeshToonMaterial({
    color: shoesColor,
    gradientMap: toonGrad
  })

  const matSocks = new THREE.MeshToonMaterial({
    color: socksColor,
    gradientMap: toonGrad
  })

  const matAcc = new THREE.MeshToonMaterial({
    color: new THREE.Color(config.accessories.headwearColor || '#e11d48'),
    gradientMap: toonGrad
  })

  // 2. Build proportions calculation
  let buildWaistMod = 1.0
  let buildChestMod = 1.0
  let buildHipMod = 1.0
  let buildLimbMod = 1.0

  if (config.body.build === 'slim') {
    buildWaistMod = 0.85
    buildChestMod = 0.85
    buildHipMod = 0.9
    buildLimbMod = 0.88
  } else if (config.body.build === 'athletic') {
    buildWaistMod = 0.95
    buildChestMod = 1.15
    buildHipMod = 1.05
    buildLimbMod = 1.1
  } else if (config.body.build === 'curvy') {
    buildWaistMod = 0.9
    buildChestMod = 1.3
    buildHipMod = 1.25
    buildLimbMod = 1.05
  } else if (config.body.build === 'chibi') {
    buildWaistMod = 1.2
    buildChestMod = 0.8
    buildHipMod = 1.1
    buildLimbMod = 1.15
  }

  const waistScale = config.body.waistScale * buildWaistMod
  const chestScale = config.body.chestSize * buildChestMod
  const hipScale = config.body.hipScale * buildHipMod
  const limbThick = config.body.limbThickness * buildLimbMod
  const headScale = config.body.headScale * (config.body.build === 'chibi' ? 1.35 : 1.0)
  const totalHeightScale = config.body.height * (config.body.build === 'chibi' ? 0.75 : 1.0)

  // 3. Construct Hierarchical Rig Groups
  const hips = new THREE.Group()
  hips.name = 'hips'
  hips.position.set(0, 0.95 * totalHeightScale, 0)
  root.add(hips)

  const spine = new THREE.Group()
  spine.name = 'spine'
  spine.position.set(0, 0.12, 0)
  hips.add(spine)

  const chest = new THREE.Group()
  chest.name = 'chest'
  chest.position.set(0, 0.16, 0)
  spine.add(chest)

  const neck = new THREE.Group()
  neck.name = 'neck'
  neck.position.set(0, 0.22, 0)
  chest.add(neck)

  const head = new THREE.Group()
  head.name = 'head'
  head.position.set(0, 0.08, 0)
  head.scale.set(headScale, headScale, headScale)
  neck.add(head)

  // Shoulders & Arms
  const shoulderOffset = 0.18 * config.body.shoulderWidth

  const leftShoulder = new THREE.Group()
  leftShoulder.name = 'leftShoulder'
  leftShoulder.position.set(shoulderOffset, 0.16, 0)
  chest.add(leftShoulder)

  const leftArm = new THREE.Group()
  leftArm.name = 'leftArm'
  leftShoulder.add(leftArm)

  const leftForearm = new THREE.Group()
  leftForearm.name = 'leftForearm'
  leftForearm.position.set(0, -0.24, 0)
  leftArm.add(leftForearm)

  const leftHand = new THREE.Group()
  leftHand.name = 'leftHand'
  leftHand.position.set(0, -0.22, 0)
  leftForearm.add(leftHand)

  const rightShoulder = new THREE.Group()
  rightShoulder.name = 'rightShoulder'
  rightShoulder.position.set(-shoulderOffset, 0.16, 0)
  chest.add(rightShoulder)

  const rightArm = new THREE.Group()
  rightArm.name = 'rightArm'
  rightShoulder.add(rightArm)

  const rightForearm = new THREE.Group()
  rightForearm.name = 'rightForearm'
  rightForearm.position.set(0, -0.24, 0)
  rightArm.add(rightForearm)

  const rightHand = new THREE.Group()
  rightHand.name = 'rightHand'
  rightHand.position.set(0, -0.22, 0)
  rightForearm.add(rightHand)

  // Legs
  const hipOffset = 0.09 * hipScale

  const leftUpLeg = new THREE.Group()
  leftUpLeg.name = 'leftUpLeg'
  leftUpLeg.position.set(hipOffset, -0.05, 0)
  hips.add(leftUpLeg)

  const leftLeg = new THREE.Group()
  leftLeg.name = 'leftLeg'
  leftLeg.position.set(0, -0.42 * totalHeightScale, 0)
  leftUpLeg.add(leftLeg)

  const leftFoot = new THREE.Group()
  leftFoot.name = 'leftFoot'
  leftFoot.position.set(0, -0.42 * totalHeightScale, 0)
  leftLeg.add(leftFoot)

  const rightUpLeg = new THREE.Group()
  rightUpLeg.name = 'rightUpLeg'
  rightUpLeg.position.set(-hipOffset, -0.05, 0)
  hips.add(rightUpLeg)

  const rightLeg = new THREE.Group()
  rightLeg.name = 'rightLeg'
  rightLeg.position.set(0, -0.42 * totalHeightScale, 0)
  rightUpLeg.add(rightLeg)

  const rightFoot = new THREE.Group()
  rightFoot.name = 'rightFoot'
  rightFoot.position.set(0, -0.42 * totalHeightScale, 0)
  rightLeg.add(rightFoot)

  // =========================================================================
  // 4. ANATOMICAL SMOOTH BODY GENERATION (VRoid / Anime Aesthetic)
  // =========================================================================

  // Hips / Pelvis Mesh
  const pelvisGeo = new THREE.CylinderGeometry(0.12 * waistScale, 0.14 * hipScale, 0.16, 24)
  const pelvisMesh = new THREE.Mesh(pelvisGeo, matSkin)
  pelvisMesh.position.set(0, -0.02, 0)
  hips.add(pelvisMesh)

  // Spine / Mid Torso
  const spineGeo = new THREE.CylinderGeometry(0.125 * waistScale, 0.12 * waistScale, 0.15, 24)
  const spineMesh = new THREE.Mesh(spineGeo, matSkin)
  spineMesh.position.set(0, 0.07, 0)
  spine.add(spineMesh)

  // Chest / Upper Torso
  const chestGeo = new THREE.CylinderGeometry(0.14 * config.body.shoulderWidth, 0.125 * waistScale, 0.18, 24)
  const chestMesh = new THREE.Mesh(chestGeo, matSkin)
  chestMesh.position.set(0, 0.09, 0)
  chest.add(chestMesh)

  // Anime Bust Sculpt
  if (config.gender === 'female' && chestScale > 0.4) {
    const bustRadius = 0.065 * chestScale
    const bustGeo = new THREE.SphereGeometry(bustRadius, 16, 16)
    bustGeo.scale(1.0, 0.9, 1.2)

    const bustL = new THREE.Mesh(bustGeo, matSkin)
    bustL.position.set(0.065 * config.body.shoulderWidth, 0.08, 0.09 * chestScale)
    bustL.rotation.x = 0.15
    bustL.rotation.y = 0.1
    chest.add(bustL)

    const bustR = new THREE.Mesh(bustGeo, matSkin)
    bustR.position.set(-0.065 * config.body.shoulderWidth, 0.08, 0.09 * chestScale)
    bustR.rotation.x = 0.15
    bustR.rotation.y = -0.1
    chest.add(bustR)
  }

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.048, 0.055, 0.11, 20)
  const neckMesh = new THREE.Mesh(neckGeo, matSkin)
  neckMesh.position.set(0, 0.04, 0)
  neck.add(neckMesh)

  // -------------------------------------------------------------------------
  // 5. SCULPTED ANIME HEAD & EXPRESSIVE FACE
  // -------------------------------------------------------------------------
  // Beautiful tapered anime head profile
  const headPoints: THREE.Vector2[] = [
    new THREE.Vector2(0, -0.16), // Chin tip
    new THREE.Vector2(0.045, -0.14), // Jaw corner
    new THREE.Vector2(0.105, -0.06), // Lower cheek
    new THREE.Vector2(0.138, 0.03), // Full cheek
    new THREE.Vector2(0.145, 0.12), // Temple
    new THREE.Vector2(0.135, 0.2), // Upper forehead
    new THREE.Vector2(0.09, 0.25), // Crown curve
    new THREE.Vector2(0, 0.26) // Top skull
  ]
  const headGeo = new THREE.LatheGeometry(headPoints, 32)
  headGeo.scale(1.0, 1.0, 1.08)
  const headMesh = new THREE.Mesh(headGeo, matSkin)
  headMesh.position.set(0, 0.08, 0)
  head.add(headMesh)

  // Ears
  const earGeo = new THREE.SphereGeometry(0.035, 12, 12)
  if (config.face.earStyle === 'elf') {
    earGeo.scale(0.7, 2.2, 0.7)
  } else {
    earGeo.scale(0.6, 1.1, 0.7)
  }

  const earL = new THREE.Mesh(earGeo, matSkin)
  earL.position.set(0.145, 0.08, -0.02)
  earL.rotation.z = config.face.earStyle === 'elf' ? -0.4 : -0.1
  earL.rotation.y = 0.25
  head.add(earL)

  const earR = new THREE.Mesh(earGeo, matSkin)
  earR.position.set(-0.145, 0.08, -0.02)
  earR.rotation.z = config.face.earStyle === 'elf' ? 0.4 : 0.1
  earR.rotation.y = -0.25
  head.add(earR)

  // Anime Nose Tip
  const noseGeo = new THREE.ConeGeometry(0.012, 0.025, 8)
  const noseMesh = new THREE.Mesh(noseGeo, matSkin)
  noseMesh.position.set(0, 0.075, 0.155)
  noseMesh.rotation.x = Math.PI / 2.3
  head.add(noseMesh)

  // Anime Eyes (Curved Decal Planes)
  const eyeWidth = 0.075 * config.face.eyeSize
  const eyeHeight = 0.085 * config.face.eyeSize
  const eyeGeo = new THREE.PlaneGeometry(eyeWidth, eyeHeight)
  const eyeSpacing = 0.065 * config.face.eyeSpacing

  const eyeL = new THREE.Mesh(eyeGeo, matEyeLeft)
  eyeL.position.set(eyeSpacing, 0.09, 0.142)
  eyeL.rotation.y = 0.18
  eyeL.rotation.x = -0.05
  head.add(eyeL)

  const eyeR = new THREE.Mesh(eyeGeo, matEyeRight)
  eyeR.position.set(-eyeSpacing, 0.09, 0.142)
  eyeR.rotation.y = -0.18
  eyeR.rotation.x = -0.05
  head.add(eyeR)

  // Eyebrows
  const browGeo = new THREE.CylinderGeometry(0.0035, 0.0055, 0.055, 8)
  const browAngleRad = (config.face.eyebrowAngle * Math.PI) / 180

  const browL = new THREE.Mesh(browGeo, matEyebrows)
  browL.position.set(eyeSpacing, 0.145, 0.14)
  browL.rotation.z = Math.PI / 2 + browAngleRad
  browL.rotation.y = 0.15
  head.add(browL)

  const browR = new THREE.Mesh(browGeo, matEyebrows)
  browR.position.set(-eyeSpacing, 0.145, 0.14)
  browR.rotation.z = Math.PI / 2 - browAngleRad
  browR.rotation.y = -0.15
  head.add(browR)

  // Cheeks Blush Decals
  const blushGeo = new THREE.PlaneGeometry(0.065, 0.065)

  const blushL = new THREE.Mesh(blushGeo, matBlush)
  blushL.position.set(0.085, 0.055, 0.138)
  blushL.rotation.y = 0.3
  blushL.rotation.x = -0.08
  head.add(blushL)

  const blushR = new THREE.Mesh(blushGeo, matBlush)
  blushR.position.set(-0.085, 0.055, 0.138)
  blushR.rotation.y = -0.3
  blushR.rotation.x = -0.08
  head.add(blushR)

  // Anime Mouth
  const mouthGeo = new THREE.PlaneGeometry(0.055, 0.028)
  const mouthMesh = new THREE.Mesh(mouthGeo, matMouth)
  mouthMesh.position.set(0, 0.032, 0.148)
  mouthMesh.rotation.x = -0.1
  head.add(mouthMesh)

  // -------------------------------------------------------------------------
  // 6. SMOOTH LIMBS, JOINTS, HANDS & LEGS
  // -------------------------------------------------------------------------
  const armRadiusTop = 0.042 * limbThick
  const armRadiusBot = 0.036 * limbThick
  const armLen = 0.24

  // Upper Arms
  const armGeo = new THREE.CylinderGeometry(armRadiusTop, armRadiusBot, armLen, 20)
  armGeo.translate(0, -armLen / 2, 0)

  const armL = new THREE.Mesh(armGeo, matSkin)
  leftArm.add(armL)

  const armR = new THREE.Mesh(armGeo, matSkin)
  rightArm.add(armR)

  // Forearms
  const forearmGeo = new THREE.CylinderGeometry(armRadiusBot, armRadiusBot * 0.85, 0.22, 20)
  forearmGeo.translate(0, -0.11, 0)

  const forearmL = new THREE.Mesh(forearmGeo, matSkin)
  leftForearm.add(forearmL)

  const forearmR = new THREE.Mesh(forearmGeo, matSkin)
  rightForearm.add(forearmR)

  // Stylized Anime Hands
  const handGeo = new THREE.SphereGeometry(0.038 * limbThick, 14, 14)
  handGeo.scale(0.8, 1.2, 0.5)
  handGeo.translate(0, -0.03, 0)

  const handL = new THREE.Mesh(handGeo, matSkin)
  leftHand.add(handL)

  const handR = new THREE.Mesh(handGeo, matSkin)
  rightHand.add(handR)

  // Smooth Thighs & Calves
  const thighRadiusTop = 0.078 * limbThick * hipScale
  const thighRadiusBot = 0.052 * limbThick
  const legLen = 0.42 * totalHeightScale

  const thighGeo = new THREE.CylinderGeometry(thighRadiusTop, thighRadiusBot, legLen, 24)
  thighGeo.translate(0, -legLen / 2, 0)

  const thighL = new THREE.Mesh(thighGeo, matSkin)
  leftUpLeg.add(thighL)

  const thighR = new THREE.Mesh(thighGeo, matSkin)
  rightUpLeg.add(thighR)

  const calfGeo = new THREE.CylinderGeometry(thighRadiusBot, 0.042 * limbThick, legLen, 24)
  calfGeo.translate(0, -legLen / 2, 0)

  const calfL = new THREE.Mesh(calfGeo, matSkin)
  leftLeg.add(calfL)

  const calfR = new THREE.Mesh(calfGeo, matSkin)
  rightLeg.add(calfR)

  // Feet / Ankle
  const footGeo = new THREE.BoxGeometry(0.065 * limbThick, 0.05, 0.14)
  footGeo.translate(0, -0.025, 0.04)

  const footL = new THREE.Mesh(footGeo, matShoes)
  leftFoot.add(footL)

  const footR = new THREE.Mesh(footGeo, matShoes)
  rightFoot.add(footR)

  // -------------------------------------------------------------------------
  // 7. HAIR SYSTEMS (7 HIGH QUALITY ANIME HAIRSTYLES)
  // -------------------------------------------------------------------------
  const hairGroup = new THREE.Group()
  hairGroup.name = 'HairGroup'
  head.add(hairGroup)

  // Hair Skull Cap Base
  const skullCapGeo = new THREE.SphereGeometry(0.155, 24, 24)
  skullCapGeo.scale(1.02, 1.05, 1.05)
  const skullCap = new THREE.Mesh(skullCapGeo, matHair)
  skullCap.position.set(0, 0.12, -0.01)
  hairGroup.add(skullCap)

  // Halo Anime Gloss Highlight Ring
  const glossRingGeo = new THREE.TorusGeometry(0.152, 0.012, 8, 32)
  const glossRing = new THREE.Mesh(glossRingGeo, matHairHighlight)
  glossRing.position.set(0, 0.17, 0)
  glossRing.rotation.x = Math.PI / 2.2
  hairGroup.add(glossRing)

  // Front Bangs / Fringe Strands
  const bangStrandCount = 7
  for (let i = 0; i < bangStrandCount; i++) {
    const t = (i / (bangStrandCount - 1) - 0.5) * 1.6
    const bangGeo = new THREE.ConeGeometry(0.028, 0.14, 8)
    bangGeo.scale(1.0, 1.0, 0.4)
    bangGeo.translate(0, -0.07, 0)

    const bang = new THREE.Mesh(bangGeo, matHair)
    bang.position.set(t * 0.12, 0.22, 0.12)
    bang.rotation.z = -t * 0.25
    bang.rotation.x = 0.28
    hairGroup.add(bang)
  }

  // Hairstyle specific geometry
  if (config.hair.style === 'twintails') {
    // Left & Right Twin-Tails
    const pigtailPoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.08, -0.15, -0.04),
      new THREE.Vector3(0.14, -0.35, -0.02),
      new THREE.Vector3(0.18, -0.55, 0.05),
      new THREE.Vector3(0.16, -0.7, 0.12)
    ]
    const pigtailCurve = new THREE.CatmullRomCurve3(pigtailPoints)
    const pigtailGeo = new THREE.TubeGeometry(pigtailCurve, 24, 0.048, 12, false)

    const pigtailL = new THREE.Mesh(pigtailGeo, matHair)
    pigtailL.position.set(0.15, 0.24, -0.05)
    hairGroup.add(pigtailL)

    const pigtailGeoR = pigtailGeo.clone()
    pigtailGeoR.scale(-1, 1, 1)
    const pigtailR = new THREE.Mesh(pigtailGeoR, matHair)
    pigtailR.position.set(-0.15, 0.24, -0.05)
    hairGroup.add(pigtailR)

    // Ribbon Ties
    const ribbonGeo = new THREE.TorusGeometry(0.04, 0.015, 8, 16)
    const ribbonL = new THREE.Mesh(ribbonGeo, matAcc)
    ribbonL.position.set(0.15, 0.24, -0.05)
    hairGroup.add(ribbonL)

    const ribbonR = new THREE.Mesh(ribbonGeo, matAcc)
    ribbonR.position.set(-0.15, 0.24, -0.05)
    hairGroup.add(ribbonR)
  } else if (config.hair.style === 'hime_cut') {
    // Long straight back hair
    const backGeo = new THREE.CylinderGeometry(0.15, 0.22, 0.7, 24, 1, true, -Math.PI * 0.75, Math.PI * 1.5)
    backGeo.translate(0, -0.35, -0.04)
    const backHair = new THREE.Mesh(backGeo, matHair)
    backHair.position.set(0, 0.18, 0)
    hairGroup.add(backHair)

    // Blunt Side Locks
    const sidelockGeo = new THREE.BoxGeometry(0.02, 0.35, 0.05)
    sidelockGeo.translate(0, -0.175, 0)

    const sidelockL = new THREE.Mesh(sidelockGeo, matHair)
    sidelockL.position.set(0.13, 0.16, 0.08)
    hairGroup.add(sidelockL)

    const sidelockR = new THREE.Mesh(sidelockGeo, matHair)
    sidelockR.position.set(-0.13, 0.16, 0.08)
    hairGroup.add(sidelockR)
  } else if (config.hair.style === 'short_bob') {
    // Cute curved bob
    const bobPoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, -0.12, 0.02),
      new THREE.Vector3(0.08, -0.22, 0.04),
      new THREE.Vector3(0.06, -0.28, 0.01)
    ]
    const bobCurve = new THREE.CatmullRomCurve3(bobPoints)
    const bobGeo = new THREE.TubeGeometry(bobCurve, 16, 0.035, 10, false)

    for (let angle = 0; angle <= Math.PI; angle += Math.PI / 6) {
      const strandL = new THREE.Mesh(bobGeo, matHair)
      strandL.position.set(Math.cos(angle) * 0.12, 0.18, Math.sin(angle) * -0.1)
      strandL.rotation.y = angle - Math.PI / 2
      hairGroup.add(strandL)
    }
  } else if (config.hair.style === 'spiky_hero') {
    // Volumetric Anime Spikes
    for (let i = 0; i < 14; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.045, 0.22, 6)
      spikeGeo.scale(1.0, 1.0, 0.5)
      spikeGeo.translate(0, 0.11, 0)

      const spike = new THREE.Mesh(spikeGeo, matHair)
      const u = (i / 13) * Math.PI
      spike.position.set(Math.cos(u) * 0.14, 0.18 + Math.sin(u) * 0.08, Math.sin(u) * -0.08)
      spike.rotation.z = -Math.cos(u) * 0.8
      spike.rotation.x = -0.3
      hairGroup.add(spike)
    }
  } else if (config.hair.style === 'high_ponytail') {
    // Swept high ponytail
    const ponyPoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.1, -0.12),
      new THREE.Vector3(0, -0.3, -0.18),
      new THREE.Vector3(0, -0.55, -0.12)
    ]
    const ponyCurve = new THREE.CatmullRomCurve3(ponyPoints)
    const ponyGeo = new THREE.TubeGeometry(ponyCurve, 20, 0.065, 12, false)

    const ponytail = new THREE.Mesh(ponyGeo, matHair)
    ponytail.position.set(0, 0.26, -0.12)
    hairGroup.add(ponytail)

    const ponyRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 16), matAcc)
    ponyRing.position.set(0, 0.26, -0.12)
    ponyRing.rotation.x = Math.PI / 4
    hairGroup.add(ponyRing)
  } else if (config.hair.style === 'wavy_locks') {
    // Romantic wavy locks
    const wavyGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.65, 20, 4, true, -Math.PI * 0.8, Math.PI * 1.6)
    wavyGeo.translate(0, -0.32, -0.04)
    const wavyMesh = new THREE.Mesh(wavyGeo, matHair)
    wavyMesh.position.set(0, 0.18, 0)
    hairGroup.add(wavyMesh)

    // Flowing front waves
    const wavePoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, -0.15, 0.03),
      new THREE.Vector3(-0.02, -0.3, 0.05),
      new THREE.Vector3(0.03, -0.45, 0.02)
    ]
    const waveCurve = new THREE.CatmullRomCurve3(wavePoints)
    const waveTubeGeo = new THREE.TubeGeometry(waveCurve, 16, 0.032, 10, false)

    const waveL = new THREE.Mesh(waveTubeGeo, matHair)
    waveL.position.set(0.12, 0.16, 0.08)
    hairGroup.add(waveL)

    const waveR = new THREE.Mesh(waveTubeGeo, matHair)
    waveR.position.set(-0.12, 0.16, 0.08)
    waveR.scale.set(-1, 1, 1)
    hairGroup.add(waveR)
  } else if (config.hair.style === 'odango_buns') {
    // Double anime buns
    const bunGeo = new THREE.SphereGeometry(0.07, 16, 16)

    const bunL = new THREE.Mesh(bunGeo, matHair)
    bunL.position.set(0.14, 0.28, -0.02)
    hairGroup.add(bunL)

    const bunR = new THREE.Mesh(bunGeo, matHair)
    bunR.position.set(-0.14, 0.28, -0.02)
    hairGroup.add(bunR)

    // Floating bun ribbons
    const ribbonGeo = new THREE.TorusGeometry(0.065, 0.012, 8, 16)
    const ribL = new THREE.Mesh(ribbonGeo, matAcc)
    ribL.position.set(0.14, 0.28, -0.02)
    hairGroup.add(ribL)

    const ribR = new THREE.Mesh(ribbonGeo, matAcc)
    ribR.position.set(-0.14, 0.28, -0.02)
    hairGroup.add(ribR)
  }

  // Rogue Anime Ahoge (Cowlick)
  if (config.hair.hasAhoge) {
    const ahogePoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.08, 0.03),
      new THREE.Vector3(0.08, 0.16, -0.02),
      new THREE.Vector3(0.02, 0.2, -0.05)
    ]
    const ahogeCurve = new THREE.CatmullRomCurve3(ahogePoints)
    const ahogeGeo = new THREE.TubeGeometry(ahogeCurve, 12, 0.008, 6, false)
    const ahogeMesh = new THREE.Mesh(ahogeGeo, matHair)
    ahogeMesh.position.set(0, 0.25, 0.02)
    hairGroup.add(ahogeMesh)
  }

  // -------------------------------------------------------------------------
  // 8. OUTFITS (6 DETAILED WRAP-AROUND CLOTHING STYLES)
  // -------------------------------------------------------------------------
  const outfitGroup = new THREE.Group()
  outfitGroup.name = 'OutfitGroup'
  root.add(outfitGroup)

  if (config.outfit.style === 'school_sailor') {
    // Sailor Uniform Blouse
    const blouseGeo = new THREE.CylinderGeometry(0.148 * config.body.shoulderWidth, 0.13 * waistScale, 0.2, 24)
    const blouse = new THREE.Mesh(blouseGeo, matOutfitPrimary)
    blouse.position.set(0, 0.09, 0)
    chest.add(blouse)

    // Sailor Flap Collar
    const collarGeo = new THREE.BoxGeometry(0.24 * config.body.shoulderWidth, 0.02, 0.2)
    const collar = new THREE.Mesh(collarGeo, matOutfitSecondary)
    collar.position.set(0, 0.17, -0.03)
    chest.add(collar)

    // Red Scarf Tie / Bow
    const tieGeo = new THREE.ConeGeometry(0.035, 0.12, 6)
    const tie = new THREE.Mesh(tieGeo, matOutfitTrim)
    tie.position.set(0, 0.11, 0.11 * chestScale)
    tie.rotation.x = 0.2
    chest.add(tie)

    // Pleated Flared Skirt
    const skirtGeo = new THREE.ConeGeometry(0.26 * hipScale, 0.22, 24, 1, true)
    skirtGeo.translate(0, -0.11, 0)
    const skirt = new THREE.Mesh(skirtGeo, matOutfitSecondary)
    skirt.position.set(0, 0.02, 0)
    hips.add(skirt)

    // Socks & Loafers
    const sockGeo = new THREE.CylinderGeometry(0.054 * limbThick, 0.044 * limbThick, 0.3, 20)
    sockGeo.translate(0, -0.15, 0)
    const sockL = new THREE.Mesh(sockGeo, matSocks)
    leftLeg.add(sockL)
    const sockR = new THREE.Mesh(sockGeo, matSocks)
    rightLeg.add(sockR)
  } else if (config.outfit.style === 'casual_hoodie') {
    // Baggy Hoodie
    const hoodieGeo = new THREE.CylinderGeometry(0.165 * config.body.shoulderWidth, 0.155 * waistScale, 0.38, 24)
    const hoodie = new THREE.Mesh(hoodieGeo, matOutfitPrimary)
    hoodie.position.set(0, 0.08, 0)
    chest.add(hoodie)

    // Hoodie Neck Collar / Pulled Back Hood
    const hoodCollarGeo = new THREE.TorusGeometry(0.1, 0.035, 12, 24)
    const hoodCollar = new THREE.Mesh(hoodCollarGeo, matOutfitPrimary)
    hoodCollar.position.set(0, 0.16, -0.04)
    hoodCollar.rotation.x = Math.PI / 3
    chest.add(hoodCollar)

    // Baggy Hoodie Sleeves
    const sleeveGeo = new THREE.CylinderGeometry(0.056 * limbThick, 0.05 * limbThick, 0.24, 20)
    sleeveGeo.translate(0, -0.12, 0)
    const sleeveL = new THREE.Mesh(sleeveGeo, matOutfitPrimary)
    leftArm.add(sleeveL)
    const sleeveR = new THREE.Mesh(sleeveGeo, matOutfitPrimary)
    rightArm.add(sleeveR)

    // Denim Shorts
    const shortsGeo = new THREE.CylinderGeometry(0.135 * waistScale, 0.16 * hipScale, 0.16, 24)
    const shorts = new THREE.Mesh(shortsGeo, matOutfitSecondary)
    shorts.position.set(0, -0.03, 0)
    hips.add(shorts)
  } else if (config.outfit.style === 'fantasy_robe') {
    // Battle Adventurer Robe / Armor Tunic
    const tunicGeo = new THREE.CylinderGeometry(0.15 * config.body.shoulderWidth, 0.135 * waistScale, 0.34, 24)
    const tunic = new THREE.Mesh(tunicGeo, matOutfitPrimary)
    tunic.position.set(0, 0.08, 0)
    chest.add(tunic)

    // Pauldrons (Shoulder Armor)
    const pauldronGeo = new THREE.SphereGeometry(0.065, 12, 12)
    pauldronGeo.scale(1.2, 0.8, 1.0)
    const pauldronL = new THREE.Mesh(pauldronGeo, matOutfitTrim)
    pauldronL.position.set(0.04, 0.02, 0)
    leftShoulder.add(pauldronL)

    const pauldronR = new THREE.Mesh(pauldronGeo, matOutfitTrim)
    pauldronR.position.set(-0.04, 0.02, 0)
    rightShoulder.add(pauldronR)

    // Gold Waist Belt
    const beltGeo = new THREE.CylinderGeometry(0.138 * waistScale, 0.138 * waistScale, 0.04, 24)
    const belt = new THREE.Mesh(beltGeo, matOutfitTrim)
    belt.position.set(0, 0.01, 0)
    hips.add(belt)

    // Flowing Layered Tassets / Skirt Coat
    const tassetGeo = new THREE.ConeGeometry(0.24 * hipScale, 0.38, 24, 1, true)
    tassetGeo.translate(0, -0.19, 0)
    const tasset = new THREE.Mesh(tassetGeo, matOutfitSecondary)
    tasset.position.set(0, 0.01, 0)
    hips.add(tasset)

    // Adventurer Leather Knee Boots
    const bootGeo = new THREE.CylinderGeometry(0.062 * limbThick, 0.048 * limbThick, 0.36, 20)
    bootGeo.translate(0, -0.18, 0)
    const bootL = new THREE.Mesh(bootGeo, matShoes)
    leftLeg.add(bootL)
    const bootR = new THREE.Mesh(bootGeo, matShoes)
    rightLeg.add(bootR)
  } else if (config.outfit.style === 'gothic_lolita') {
    // Corset Lace Bodice
    const corsetGeo = new THREE.CylinderGeometry(0.145 * config.body.shoulderWidth, 0.12 * waistScale, 0.22, 24)
    const corset = new THREE.Mesh(corsetGeo, matOutfitPrimary)
    corset.position.set(0, 0.08, 0)
    chest.add(corset)

    // Tiered Frilled Bell Dress
    const skirt1Geo = new THREE.ConeGeometry(0.32 * hipScale, 0.28, 24, 1, true)
    skirt1Geo.translate(0, -0.14, 0)
    const skirt1 = new THREE.Mesh(skirt1Geo, matOutfitPrimary)
    skirt1.position.set(0, 0.02, 0)
    hips.add(skirt1)

    // Bottom White Lace Ruffle
    const ruffleGeo = new THREE.ConeGeometry(0.35 * hipScale, 0.08, 24, 1, true)
    ruffleGeo.translate(0, -0.28, 0)
    const ruffle = new THREE.Mesh(ruffleGeo, matOutfitSecondary)
    ruffle.position.set(0, 0.02, 0)
    hips.add(ruffle)

    // Bell Puffy Sleeves
    const puffGeo = new THREE.SphereGeometry(0.065, 14, 14)
    const puffL = new THREE.Mesh(puffGeo, matOutfitPrimary)
    puffL.position.set(0, -0.04, 0)
    leftArm.add(puffL)
    const puffR = new THREE.Mesh(puffGeo, matOutfitPrimary)
    puffR.position.set(0, -0.04, 0)
    rightArm.add(puffR)
  } else if (config.outfit.style === 'summer_yukata') {
    // Crossover Wrap Kimono Robe
    const robeGeo = new THREE.CylinderGeometry(0.155 * config.body.shoulderWidth, 0.2 * hipScale, 0.65, 24)
    const robe = new THREE.Mesh(robeGeo, matOutfitPrimary)
    robe.position.set(0, -0.15, 0)
    hips.add(robe)

    // Wide Obi Sash
    const obiGeo = new THREE.CylinderGeometry(0.14 * waistScale, 0.14 * waistScale, 0.12, 24)
    const obi = new THREE.Mesh(obiGeo, matOutfitSecondary)
    obi.position.set(0, 0.02, 0)
    hips.add(obi)

    // Back Obi Ribbon Knot
    const knotGeo = new THREE.BoxGeometry(0.14, 0.12, 0.06)
    const knot = new THREE.Mesh(knotGeo, matOutfitSecondary)
    knot.position.set(0, 0.02, -0.15 * waistScale)
    hips.add(knot)

    // Kimono Sleeves
    const kimSleeveGeo = new THREE.BoxGeometry(0.08, 0.26, 0.18)
    kimSleeveGeo.translate(0, -0.13, 0)
    const kimSleeveL = new THREE.Mesh(kimSleeveGeo, matOutfitPrimary)
    leftArm.add(kimSleeveL)
    const kimSleeveR = new THREE.Mesh(kimSleeveGeo, matOutfitPrimary)
    rightArm.add(kimSleeveR)
  } else if (config.outfit.style === 'cyber_techwear') {
    // Cyber Cropped Vest
    const cyberGeo = new THREE.CylinderGeometry(0.15 * config.body.shoulderWidth, 0.13 * waistScale, 0.18, 24)
    const cyber = new THREE.Mesh(cyberGeo, matOutfitPrimary)
    cyber.position.set(0, 0.09, 0)
    chest.add(cyber)

    // Glowing Neon Cyber Trims
    const neonGeo = new THREE.TorusGeometry(0.135, 0.008, 8, 24)
    const neon = new THREE.Mesh(neonGeo, matOutfitTrim)
    neon.position.set(0, 0.02, 0)
    neon.rotation.x = Math.PI / 2
    chest.add(neon)

    // Tech Utility Skirt with Pockets
    const techSkirtGeo = new THREE.CylinderGeometry(0.13 * waistScale, 0.2 * hipScale, 0.22, 24)
    const techSkirt = new THREE.Mesh(techSkirtGeo, matOutfitSecondary)
    techSkirt.position.set(0, -0.05, 0)
    hips.add(techSkirt)
  }

  // -------------------------------------------------------------------------
  // 9. ACCESSORIES (GLASSES, HATS, HORNS, WINGS)
  // -------------------------------------------------------------------------
  const accGroup = new THREE.Group()
  accGroup.name = 'AccessoriesGroup'
  head.add(accGroup)

  // Glasses
  if (config.accessories.glasses !== 'none') {
    const glassesMat = new THREE.MeshToonMaterial({
      color: new THREE.Color(config.accessories.glassesColor || '#1e1b4b'),
      gradientMap: toonGrad
    })

    if (config.accessories.glasses === 'round_wire') {
      const rimGeo = new THREE.TorusGeometry(0.026, 0.003, 8, 24)
      const rimL = new THREE.Mesh(rimGeo, glassesMat)
      rimL.position.set(eyeSpacing, 0.09, 0.152)
      accGroup.add(rimL)

      const rimR = new THREE.Mesh(rimGeo, glassesMat)
      rimR.position.set(-eyeSpacing, 0.09, 0.152)
      accGroup.add(rimR)

      const bridgeGeo = new THREE.CylinderGeometry(0.002, 0.002, eyeSpacing, 8)
      bridgeGeo.rotateZ(Math.PI / 2)
      const bridge = new THREE.Mesh(bridgeGeo, glassesMat)
      bridge.position.set(0, 0.09, 0.152)
      accGroup.add(bridge)
    } else if (config.accessories.glasses === 'black_frames') {
      const frameGeo = new THREE.BoxGeometry(0.065, 0.045, 0.008)
      const frameL = new THREE.Mesh(frameGeo, glassesMat)
      frameL.position.set(eyeSpacing, 0.09, 0.152)
      accGroup.add(frameL)

      const frameR = new THREE.Mesh(frameGeo, glassesMat)
      frameR.position.set(-eyeSpacing, 0.09, 0.152)
      accGroup.add(frameR)

      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.008), glassesMat)
      bridge.position.set(0, 0.095, 0.152)
      accGroup.add(bridge)
    } else if (config.accessories.glasses === 'sunglasses') {
      const darkLensMat = new THREE.MeshBasicMaterial({ color: 0x0f172a })
      const sunGeo = new THREE.BoxGeometry(0.07, 0.04, 0.008)
      const sunL = new THREE.Mesh(sunGeo, darkLensMat)
      sunL.position.set(eyeSpacing, 0.09, 0.152)
      accGroup.add(sunL)

      const sunR = new THREE.Mesh(sunGeo, darkLensMat)
      sunR.position.set(-eyeSpacing, 0.09, 0.152)
      accGroup.add(sunR)
    }
  }

  // Headwear
  if (config.accessories.headwear === 'witch_hat') {
    const brimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.02, 32)
    const brim = new THREE.Mesh(brimGeo, matAcc)
    brim.position.set(0, 0.26, 0)
    brim.rotation.x = -0.1
    accGroup.add(brim)

    const coneGeo = new THREE.ConeGeometry(0.18, 0.42, 24)
    const cone = new THREE.Mesh(coneGeo, matAcc)
    cone.position.set(0, 0.45, -0.04)
    cone.rotation.x = -0.2
    accGroup.add(cone)
  } else if (config.accessories.headwear === 'cat_ears') {
    const earCatGeo = new THREE.ConeGeometry(0.055, 0.11, 4)
    earCatGeo.scale(1.0, 1.0, 0.5)

    const catL = new THREE.Mesh(earCatGeo, matAcc)
    catL.position.set(0.11, 0.28, 0.02)
    catL.rotation.z = -0.35
    catL.rotation.y = 0.2
    accGroup.add(catL)

    const catR = new THREE.Mesh(earCatGeo, matAcc)
    catR.position.set(-0.11, 0.28, 0.02)
    catR.rotation.z = 0.35
    catR.rotation.y = -0.2
    accGroup.add(catR)
  } else if (config.accessories.headwear === 'halo') {
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xfef08a })
    const haloGeo = new THREE.TorusGeometry(0.16, 0.015, 8, 32)
    const halo = new THREE.Mesh(haloGeo, haloMat)
    halo.position.set(0, 0.36, 0)
    halo.rotation.x = Math.PI / 2
    accGroup.add(halo)
  } else if (config.accessories.headwear === 'demon_horns') {
    const hornMat = new THREE.MeshToonMaterial({ color: 0x991b1b, gradientMap: toonGrad })
    const hornPoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.06, -0.02),
      new THREE.Vector3(0.08, 0.14, -0.05),
      new THREE.Vector3(0.06, 0.2, -0.1)
    ]
    const hornCurve = new THREE.CatmullRomCurve3(hornPoints)
    const hornGeo = new THREE.TubeGeometry(hornCurve, 16, 0.022, 8, false)

    const hornL = new THREE.Mesh(hornGeo, hornMat)
    hornL.position.set(0.09, 0.24, 0.04)
    accGroup.add(hornL)

    const hornGeoR = hornGeo.clone()
    hornGeoR.scale(-1, 1, 1)
    const hornR = new THREE.Mesh(hornGeoR, hornMat)
    hornR.position.set(-0.09, 0.24, 0.04)
    accGroup.add(hornR)
  }

  // Extra Accessories (Angel Wings / Choker)
  if (config.accessories.extra === 'angel_wings') {
    const wingMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonGrad })
    const wingGeo = new THREE.BoxGeometry(0.35, 0.5, 0.02)
    wingGeo.translate(0.18, 0.15, 0)

    const wingL = new THREE.Mesh(wingGeo, wingMat)
    wingL.position.set(0.08, 0.12, -0.14)
    wingL.rotation.y = 0.4
    wingL.rotation.z = -0.3
    chest.add(wingL)

    const wingR = new THREE.Mesh(wingGeo, wingMat)
    wingR.position.set(-0.08, 0.12, -0.14)
    wingR.rotation.y = -0.4
    wingR.rotation.z = 0.3
    wingR.scale.set(-1, 1, 1)
    chest.add(wingR)
  } else if (config.accessories.extra === 'choker_ribbon') {
    const chokerMat = new THREE.MeshBasicMaterial({ color: 0x18181b })
    const chokerGeo = new THREE.TorusGeometry(0.052, 0.008, 8, 24)
    const choker = new THREE.Mesh(chokerGeo, chokerMat)
    choker.position.set(0, 0.04, 0)
    choker.rotation.x = Math.PI / 2
    neck.add(choker)
  }

  // -------------------------------------------------------------------------
  // 10. POSE APPLICATION ENGINE
  // -------------------------------------------------------------------------
  const bones = {
    hips,
    spine,
    chest,
    neck,
    head,
    leftShoulder,
    leftArm,
    leftForearm,
    leftHand,
    rightShoulder,
    rightArm,
    rightForearm,
    rightHand,
    leftUpLeg,
    leftLeg,
    leftFoot,
    rightUpLeg,
    rightLeg,
    rightFoot
  }

  function resetBoneRotations() {
    Object.values(bones).forEach(b => {
      b.rotation.set(0, 0, 0)
    })
  }

  function updatePose(pose: PoseId, time: number = 0) {
    resetBoneRotations()

    // Breathing wave
    const breath = config.studio.enableBreathing ? Math.sin(time * 2.2) * 0.025 : 0
    chest.scale.set(1 + breath * 0.5, 1 + breath, 1 + breath * 0.8)

    if (pose === 't_pose') {
      leftArm.rotation.z = -Math.PI / 2
      rightArm.rotation.z = Math.PI / 2
    } else if (pose === 'cute_peace') {
      // Cute anime peace sign pose
      head.rotation.z = 0.15
      head.rotation.y = -0.1

      leftArm.rotation.z = -0.3
      leftArm.rotation.x = 0.2

      rightArm.rotation.z = 1.3
      rightArm.rotation.x = 0.7
      rightForearm.rotation.z = 1.2
      rightForearm.rotation.y = -0.4

      leftUpLeg.rotation.z = -0.05
      leftUpLeg.rotation.y = 0.1
      rightUpLeg.rotation.z = 0.08
      rightUpLeg.rotation.y = -0.15
    } else if (pose === 'heroic_stance') {
      // Heroic hand on hip stance
      chest.rotation.y = 0.15

      leftArm.rotation.z = -0.8
      leftArm.rotation.x = -0.2
      leftForearm.rotation.z = -1.4
      leftForearm.rotation.y = 0.5

      rightArm.rotation.z = 0.4
      rightArm.rotation.x = 0.2

      leftUpLeg.rotation.z = -0.15
      rightUpLeg.rotation.z = 0.18
    } else if (pose === 'shy_kawaii') {
      // Shy cute pose (hands clasped behind, toes turned inward)
      head.rotation.x = 0.1
      head.rotation.z = -0.1

      leftArm.rotation.z = -0.2
      leftArm.rotation.x = -0.4
      leftForearm.rotation.y = -0.6

      rightArm.rotation.z = 0.2
      rightArm.rotation.x = -0.4
      rightForearm.rotation.y = 0.6

      leftUpLeg.rotation.y = 0.2
      rightUpLeg.rotation.y = -0.2
    } else if (pose === 'spellcaster') {
      // Dynamic fantasy magic casting pose
      spine.rotation.x = 0.1
      chest.rotation.y = -0.2

      leftArm.rotation.z = -1.1
      leftArm.rotation.x = 0.6
      leftForearm.rotation.x = 0.5

      rightArm.rotation.z = 0.9
      rightArm.rotation.x = -0.4
      rightForearm.rotation.z = 0.8

      leftUpLeg.rotation.x = 0.3
      rightUpLeg.rotation.x = -0.3
    } else {
      // Default: idle with natural relaxed arm drop
      leftArm.rotation.z = -0.18 + Math.sin(time * 1.5) * 0.015
      rightArm.rotation.z = 0.18 - Math.sin(time * 1.5) * 0.015
      leftUpLeg.rotation.z = -0.05
      rightUpLeg.rotation.z = 0.05
    }
  }

  // Initial pose application
  updatePose(config.studio.pose, 0)

  return {
    root,
    bones,
    materials: {
      skin: matSkin,
      eyeLeft: matEyeLeft,
      eyeRight: matEyeRight,
      blush: matBlush,
      mouth: matMouth,
      eyebrows: matEyebrows,
      hair: matHair,
      hairHighlight: matHairHighlight,
      outfitPrimary: matOutfitPrimary,
      outfitSecondary: matOutfitSecondary,
      outfitTrim: matOutfitTrim,
      shoes: matShoes,
      socks: matSocks,
      accessories: matAcc
    },
    updatePose,
    dispose: () => {
      // Clean up geometries and textures
      eyeTexLeft.dispose()
      eyeTexRight.dispose()
      blushTex.dispose()
      mouthTex.dispose()
      Object.values(bones).forEach(b => {
        b.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
          }
        })
      })
    }
  }
}
