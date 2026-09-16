import * as THREE from 'three'
import { EyeShape } from '../types/character'

// Reusable toon gradient maps cache
const toonGradientCache = new Map<number, THREE.CanvasTexture>()

/**
 * Creates a stepped gradient texture for MeshToonMaterial to achieve crisp anime cel shading.
 */
export function getToonGradientMap(steps: number = 3): THREE.CanvasTexture {
  if (toonGradientCache.has(steps)) {
    return toonGradientCache.get(steps)!
  }

  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 1
  const ctx = canvas.getContext('2d')!

  // Create crisp stepped gradient
  for (let i = 0; i < steps; i++) {
    const start = (i / steps) * 128
    const width = (1 / steps) * 128
    const brightness = Math.round(100 + (155 / (steps - 1 || 1)) * i)
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
    ctx.fillRect(start, 0, width, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  toonGradientCache.set(steps, texture)
  return texture
}

/**
 * Generates an anime eye texture with multi-layered iris, highlights, and customizable shape.
 */
export function generateAnimeEyeTexture(
  shape: EyeShape,
  irisColorHex: string,
  secondaryColorHex: string,
  pupilColorHex: string = '#111827',
  isRightEye: boolean = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, 512, 512)

  // Sclera (Eye White with subtle top shadow)
  ctx.save()
  if (isRightEye) {
    ctx.translate(512, 0)
    ctx.scale(-1, 1)
  }

  // Draw eye outline path based on shape
  ctx.beginPath()
  if (shape === 'cat_eye') {
    ctx.moveTo(80, 260)
    ctx.bezierCurveTo(150, 110, 360, 120, 440, 210)
    ctx.bezierCurveTo(390, 380, 170, 390, 80, 260)
  } else if (shape === 'tareme_gentle') {
    ctx.moveTo(70, 220)
    ctx.bezierCurveTo(140, 140, 380, 150, 430, 290)
    ctx.bezierCurveTo(350, 390, 140, 380, 70, 220)
  } else if (shape === 'sharp_heroic') {
    ctx.moveTo(70, 260)
    ctx.lineTo(260, 150)
    ctx.lineTo(440, 210)
    ctx.bezierCurveTo(380, 350, 180, 360, 70, 260)
  } else if (shape === 'chibi_cute') {
    ctx.ellipse(256, 256, 170, 170, 0, 0, Math.PI * 2)
  } else {
    // Default / Sparkle Anime / Tsundere
    ctx.moveTo(70, 250)
    ctx.bezierCurveTo(140, 120, 380, 120, 440, 240)
    ctx.bezierCurveTo(390, 390, 130, 390, 70, 250)
  }
  ctx.closePath()

  // Sclera background
  const scleraGrad = ctx.createLinearGradient(256, 100, 256, 400)
  scleraGrad.addColorStop(0, '#d1d5db')
  scleraGrad.addColorStop(0.3, '#f3f4f6')
  scleraGrad.addColorStop(1, '#ffffff')
  ctx.fillStyle = scleraGrad
  ctx.fill()
  ctx.clip()

  // Sclera upper cast shadow
  ctx.fillStyle = 'rgba(100, 116, 139, 0.35)'
  ctx.beginPath()
  ctx.ellipse(256, 160, 200, 70, 0, 0, Math.PI * 2)
  ctx.fill()

  // Iris Ellipse
  const irisCenterX = 256
  const irisCenterY = 265
  const irisRadiusX = shape === 'chibi_cute' ? 120 : 105
  const irisRadiusY = shape === 'chibi_cute' ? 135 : 125

  // Outer Iris
  const irisGrad = ctx.createRadialGradient(
    irisCenterX,
    irisCenterY - 30,
    15,
    irisCenterX,
    irisCenterY,
    irisRadiusY
  )
  irisGrad.addColorStop(0, secondaryColorHex)
  irisGrad.addColorStop(0.6, irisColorHex)
  irisGrad.addColorStop(1, '#0f172a')

  ctx.fillStyle = irisGrad
  ctx.beginPath()
  ctx.ellipse(irisCenterX, irisCenterY, irisRadiusX, irisRadiusY, 0, 0, Math.PI * 2)
  ctx.fill()

  // Inner glow ring (Anime eye depth)
  ctx.strokeStyle = secondaryColorHex
  ctx.lineWidth = 6
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.ellipse(irisCenterX, irisCenterY + 25, irisRadiusX * 0.7, irisRadiusY * 0.45, 0, Math.PI * 0.1, Math.PI * 0.9)
  ctx.stroke()
  ctx.globalAlpha = 1.0

  // Pupil
  ctx.fillStyle = pupilColorHex
  ctx.beginPath()
  ctx.ellipse(irisCenterX, irisCenterY - 10, irisRadiusX * 0.42, irisRadiusY * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Primary Catchlight / Sparkle Reflection
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(irisCenterX - 45, irisCenterY - 55, 32, 40, -Math.PI / 8, 0, Math.PI * 2)
  ctx.fill()

  // Secondary lower glint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.beginPath()
  ctx.ellipse(irisCenterX + 40, irisCenterY + 45, 18, 22, Math.PI / 6, 0, Math.PI * 2)
  ctx.fill()

  // Sparkle star glint for 'sparkle_anime' shape
  if (shape === 'sparkle_anime' || shape === 'chibi_cute') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.beginPath()
    ctx.arc(irisCenterX - 10, irisCenterY + 40, 10, 0, Math.PI * 2)
    ctx.fill()
  }

  // Eyelash / Upper Eyelid Line
  ctx.restore()
  ctx.save()
  if (isRightEye) {
    ctx.translate(512, 0)
    ctx.scale(-1, 1)
  }

  ctx.strokeStyle = '#1e1b4b'
  ctx.lineWidth = 18
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  if (shape === 'cat_eye') {
    ctx.moveTo(65, 275)
    ctx.bezierCurveTo(150, 100, 360, 110, 455, 195)
    ctx.lineTo(465, 180)
  } else if (shape === 'tareme_gentle') {
    ctx.moveTo(60, 215)
    ctx.bezierCurveTo(140, 125, 380, 135, 445, 305)
  } else if (shape === 'sharp_heroic') {
    ctx.moveTo(60, 265)
    ctx.lineTo(260, 140)
    ctx.lineTo(450, 200)
  } else {
    ctx.moveTo(60, 255)
    ctx.bezierCurveTo(130, 110, 380, 110, 450, 245)
  }
  ctx.stroke()

  // Eyelash Wing Flairs
  ctx.fillStyle = '#1e1b4b'
  ctx.beginPath()
  ctx.moveTo(435, 210)
  ctx.lineTo(470, 185)
  ctx.lineTo(430, 235)
  ctx.closePath()
  ctx.fill()

  // Lower delicate eyelid line
  ctx.strokeStyle = 'rgba(30, 27, 75, 0.7)'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(130, 380)
  ctx.bezierCurveTo(240, 410, 360, 395, 410, 355)
  ctx.stroke()

  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Creates soft anime cheek blush texture.
 */
export function generateBlushTexture(colorHex: string = '#f43f5e'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 60)
  grad.addColorStop(0, colorHex)
  grad.addColorStop(0.5, colorHex + 'aa')
  grad.addColorStop(1, colorHex + '00')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)

  // Cute manga diagonal blush hatch marks
  ctx.strokeStyle = colorHex
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.moveTo(54 + i * 16, 76)
    ctx.lineTo(74 + i * 16, 52)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Creates stylized anime mouth texture with clean curvature.
 */
export function generateMouthTexture(
  expression: string,
  skinToneHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = skinToneHex
  ctx.fillRect(0, 0, 256, 128)

  ctx.strokeStyle = '#881337'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (expression === 'smile') {
    ctx.beginPath()
    ctx.moveTo(70, 50)
    ctx.bezierCurveTo(100, 85, 156, 85, 186, 50)
    ctx.stroke()

    // Inner teeth / tongue
    ctx.fillStyle = '#f43f5e'
    ctx.beginPath()
    ctx.moveTo(80, 55)
    ctx.bezierCurveTo(110, 80, 146, 80, 176, 55)
    ctx.bezierCurveTo(140, 75, 116, 75, 80, 55)
    ctx.fill()
  } else if (expression === 'smirk') {
    ctx.beginPath()
    ctx.moveTo(75, 65)
    ctx.bezierCurveTo(120, 68, 170, 55, 190, 40)
    ctx.stroke()
    // Cheek dimple tick
    ctx.beginPath()
    ctx.moveTo(188, 38)
    ctx.lineTo(194, 46)
    ctx.stroke()
  } else if (expression === 'cat_mouth') {
    // :3 cat mouth
    ctx.beginPath()
    ctx.moveTo(80, 55)
    ctx.bezierCurveTo(100, 75, 125, 75, 128, 55)
    ctx.bezierCurveTo(131, 75, 156, 75, 176, 55)
    ctx.stroke()
  } else if (expression === 'pout') {
    ctx.beginPath()
    ctx.moveTo(80, 68)
    ctx.bezierCurveTo(110, 48, 146, 48, 176, 68)
    ctx.stroke()
  } else if (expression === 'open_talk' || expression === 'shocked') {
    ctx.fillStyle = '#4c0519'
    ctx.beginPath()
    ctx.ellipse(128, 64, 38, expression === 'shocked' ? 44 : 32, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Tongue
    ctx.fillStyle = '#fb7185'
    ctx.beginPath()
    ctx.ellipse(128, 76, 24, 16, 0, 0, Math.PI)
    ctx.fill()
  } else {
    // Neutral delicate anime mouth
    ctx.beginPath()
    ctx.moveTo(95, 64)
    ctx.lineTo(161, 64)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Creates clean toon outline mesh via inverted hull method.
 */
export function createOutlineMesh(
  geometry: THREE.BufferGeometry,
  thickness: number = 0.008,
  color: number = 0x18181b
): THREE.Mesh {
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide
  })

  const outlineMesh = new THREE.Mesh(geometry, outlineMaterial)
  outlineMesh.scale.set(1 + thickness, 1 + thickness, 1 + thickness)
  return outlineMesh
}
