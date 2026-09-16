/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react'

export const VOOM_DRAG_TYPES = {
  CHARACTER: 'application/x-voomtoon-character',
  PROP: 'application/x-voomtoon-prop',
  ANIMATION: 'application/x-voomtoon-animation',
  POSE: 'application/x-voomtoon-pose',
  CAMERA: 'application/x-voomtoon-camera',
  LIGHT: 'application/x-voomtoon-light',
  AUDIO: 'application/x-voomtoon-audio',
  PANEL: 'application/x-voomtoon-panel'
} as const

export interface DraggedCharacterPayload {
  type: 'character'
  id: string
  name: string
  templateType?: string
}

export interface DraggedPropPayload {
  type: 'prop'
  id: string
  name: string
  presetId?: string
  sourceType: 'starter_preset' | 'custom_upload'
}

export interface DraggedAnimationPayload {
  type: 'animation'
  clipId: string
  name: string
  clipType: 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'dance' | 'talk' | 'wave' | 'sit' | 'custom'
  durationFrames: number
  color?: string
}

export interface DraggedPosePayload {
  type: 'pose'
  poseKey: string
  name: string
  category?: string
}

export interface DraggedCameraPayload {
  type: 'camera'
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export interface DraggedLightPayload {
  type: 'light'
  presetId: string
  name: string
  keyColor: string
  fillColor: string
  ambientIntensity: number
}

export interface DraggedAudioPayload {
  type: 'audio'
  id: string
  name: string
  durationFrames: number
  url?: string
}

export interface DraggedPanelPayload {
  type: 'panel'
  panelId: string
  sourceZone?: 'left' | 'right' | 'bottom' | 'floating'
}

export function setDragData(e: React.DragEvent, type: string, payload: any) {
  try {
    e.dataTransfer.setData(type, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copyMove'
  } catch (err) {
    console.error('Failed to set drag data', err)
  }
}

export function getDragData<T>(e: React.DragEvent, type: string): T | null {
  try {
    const raw = e.dataTransfer.getData(type)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
