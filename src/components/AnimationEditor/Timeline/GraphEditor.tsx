/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react'
import { AnimationTrack, AnimationKeyframe, InterpolationType } from '../../../types/animation'
import { evaluateEasing } from '../../../utils/animationEngine'
import { Activity, Sliders, Play, RotateCcw, Check } from 'lucide-react'

interface GraphEditorProps {
  tracks: AnimationTrack[]
  selectedTrackId?: string
  currentFrame: number
  totalFrames: number
  onSeek: (frame: number) => void
  onUpdateKeyframeValue: (trackId: string, keyframeId: string, newValue: any) => void
  onChangeInterpolation: (trackId: string, keyframeId: string, interpolation: InterpolationType) => void
}

export const GraphEditor: React.FC<GraphEditorProps> = ({
  tracks,
  selectedTrackId,
  currentFrame,
  totalFrames,
  onSeek,
  onUpdateKeyframeValue,
  onChangeInterpolation
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeTrack = tracks.find(t => t.id === selectedTrackId) || tracks[0]

  const [selectedChannel, setSelectedChannel] = useState<'x' | 'y' | 'z' | 'scalar'>('z')
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const isDraggingKeyRef = useRef<{ id: string; startY: number; startVal: number } | null>(null)

  // Extract numeric value from keyframe based on channel
  const getNumericValue = (kf: AnimationKeyframe): number => {
    if (typeof kf.value === 'number') return kf.value
    if (Array.isArray(kf.value)) {
      if (selectedChannel === 'x') return kf.value[0] || 0
      if (selectedChannel === 'y') return kf.value[1] || 0
      return kf.value[2] || 0
    }
    return 0
  }

  // Draw the animation curves
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = '#0E0E14'
    ctx.fillRect(0, 0, width, height)

    if (!activeTrack || !activeTrack.keyframes || activeTrack.keyframes.length === 0) {
      ctx.fillStyle = '#606070'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Select an animated track to view and edit curve values', width / 2, height / 2)
      return
    }

    const keyframes = [...activeTrack.keyframes].sort((a, b) => a.frame - b.frame)

    // Calculate value range
    const values = keyframes.map(getNumericValue)
    let minVal = Math.min(...values, 0)
    let maxVal = Math.max(...values, 1)
    if (maxVal - minVal < 0.2) {
      minVal -= 0.5
      maxVal += 0.5
    }
    const valRange = maxVal - minVal
    const paddingY = 40
    const paddingX = 50

    const frameToX = (frame: number) => {
      return paddingX + (frame / Math.max(1, totalFrames)) * (width - paddingX - 20)
    }

    const valToY = (val: number) => {
      const normalized = (val - minVal) / valRange
      return height - paddingY - normalized * (height - paddingY * 2)
    }

    // Grid lines (horizontal value lines)
    ctx.strokeStyle = '#1E1E2C'
    ctx.lineWidth = 1
    ctx.font = '9px monospace'
    ctx.fillStyle = '#5A5A6A'
    ctx.textAlign = 'right'

    const stepCount = 5
    for (let i = 0; i <= stepCount; i++) {
      const v = minVal + (i / stepCount) * valRange
      const y = valToY(v)
      ctx.beginPath()
      ctx.moveTo(paddingX, y)
      ctx.lineTo(width, y)
      ctx.stroke()
      ctx.fillText(v.toFixed(1), paddingX - 6, y + 3)
    }

    // Vertical frame lines
    for (let f = 0; f <= totalFrames; f += 30) {
      const x = frameToX(f)
      ctx.beginPath()
      ctx.moveTo(x, 10)
      ctx.lineTo(x, height - paddingY)
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.fillText(`${f}`, x, height - paddingY + 14)
    }

    // Draw Smooth Curve
    ctx.lineWidth = 2.5
    ctx.strokeStyle = activeTrack.color || '#D32F2F'
    ctx.beginPath()

    const samples = 120
    for (let i = 0; i <= samples; i++) {
      const f = (i / samples) * totalFrames
      // Sample value at frame
      let val = values[0]
      if (f <= keyframes[0].frame) {
        val = values[0]
      } else if (f >= keyframes[keyframes.length - 1].frame) {
        val = values[values.length - 1]
      } else {
        for (let j = 0; j < keyframes.length - 1; j++) {
          const k0 = keyframes[j]
          const k1 = keyframes[j + 1]
          if (f >= k0.frame && f <= k1.frame) {
            const rawT = (f - k0.frame) / (k1.frame - k0.frame)
            const easedT = evaluateEasing(rawT, k0.interpolation || 'easeInOut')
            const v0 = getNumericValue(k0)
            const v1 = getNumericValue(k1)
            val = v0 + (v1 - v0) * easedT
            break
          }
        }
      }

      const x = frameToX(f)
      const y = valToY(val)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Keyframe dots & tangent handles
    for (const kf of keyframes) {
      const kfVal = getNumericValue(kf)
      const kx = frameToX(kf.frame)
      const ky = valToY(kfVal)
      const isSelected = selectedKeyId === kf.id

      // Dot
      ctx.fillStyle = isSelected ? '#00E676' : '#FFFFFF'
      ctx.strokeStyle = '#D32F2F'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(kx, ky, isSelected ? 6 : 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Value label near dot
      if (isSelected) {
        ctx.fillStyle = '#00E676'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`${kfVal.toFixed(2)}`, kx, ky - 10)
      }
    }

    // Current playhead line
    const playheadX = frameToX(currentFrame)
    ctx.strokeStyle = '#D32F2F'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, height)
    ctx.stroke()
  }, [activeTrack, selectedChannel, selectedKeyId, currentFrame, totalFrames])

  // Resize canvas
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const handleResize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    handleResize()

    const ro = new ResizeObserver(handleResize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0E0E14] overflow-hidden select-none">
      {/* Curve Toolbar */}
      <div className="h-8 bg-[#14141C] border-b border-[#22222E] flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#D32F2F]" />
          <span className="text-xs font-bold text-white truncate max-w-xs">
            {activeTrack?.name || 'Curve Editor'}
          </span>

          {/* Channel selector if vector */}
          {activeTrack && activeTrack.property === 'position' && (
            <div className="flex items-center bg-[#1A1A26] rounded-md p-0.5 border border-[#2A2A3A] ml-2">
              <button
                onClick={() => setSelectedChannel('x')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  selectedChannel === 'x' ? 'bg-[#D32F2F] text-white' : 'text-[#808090]'
                }`}
              >
                X (Lat)
              </button>
              <button
                onClick={() => setSelectedChannel('y')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  selectedChannel === 'y' ? 'bg-[#10B981] text-white' : 'text-[#808090]'
                }`}
              >
                Y (Height)
              </button>
              <button
                onClick={() => setSelectedChannel('z')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  selectedChannel === 'z' ? 'bg-[#3B82F6] text-white' : 'text-[#808090]'
                }`}
              >
                Z (Depth)
              </button>
            </div>
          )}
        </div>

        {/* Interpolation Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#707080] font-bold uppercase mr-1">Curve Preset:</span>
          {(['easeInOut', 'easeIn', 'easeOut', 'linear', 'step'] as InterpolationType[]).map(interp => (
            <button
              key={interp}
              onClick={() => {
                if (activeTrack && activeTrack.keyframes.length > 0) {
                  const targetId = selectedKeyId || activeTrack.keyframes[0].id
                  onChangeInterpolation(activeTrack.id, targetId, interp)
                }
              }}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1E1E2C] hover:bg-[#28283C] text-[#C0C0D0] hover:text-white border border-[#2E2E40] cursor-pointer"
            >
              {interp}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef} 
        onClick={(e) => {
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return
          const clickX = e.clientX - rect.left - 50
          const frame = Math.max(0, Math.min(totalFrames, Math.round((clickX / (rect.width - 70)) * totalFrames)))
          onSeek(frame)
        }}
        className="flex-1 relative cursor-crosshair"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      </div>
    </div>
  )
}
