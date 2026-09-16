/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react'
import { TimelineMarker, RulerUnit } from '../../../types/animation'

interface TimelineRulerProps {
  totalFrames: number
  currentFrame: number
  fps: number
  zoom: number // pixels per frame
  scrollX: number
  rulerUnit?: RulerUnit
  markers: TimelineMarker[]
  inPoint: number
  outPoint: number
  onSeek: (frame: number) => void
  onAddMarker?: (frame: number) => void
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  totalFrames,
  currentFrame,
  fps,
  zoom,
  scrollX,
  rulerUnit = 'frames',
  markers,
  inPoint,
  outPoint,
  onSeek
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  // Draw ruler ticks and labels
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = '#0F0F14'
    ctx.fillRect(0, 0, width, height)

    // In-Out Range highlight
    const inX = inPoint * zoom - scrollX
    const outX = outPoint * zoom - scrollX
    if (outX > inX) {
      ctx.fillStyle = 'rgba(211, 47, 47, 0.08)'
      ctx.fillRect(Math.max(0, inX), 0, Math.min(width, outX) - Math.max(0, inX), height)
    }

    // Determine tick intervals based on zoom level
    let majorInterval = fps // 1 second
    let minorInterval = 5
    if (zoom < 10) {
      majorInterval = fps * 2
      minorInterval = 10
    } else if (zoom > 35) {
      majorInterval = fps
      minorInterval = 1
    }

    const startFrame = Math.max(0, Math.floor(scrollX / zoom))
    const endFrame = Math.min(totalFrames, Math.ceil((scrollX + width) / zoom) + 1)

    ctx.lineWidth = 1
    ctx.font = '10px ui-monospace, SFMono-Regular, monospace'
    ctx.textBaseline = 'top'

    for (let f = startFrame; f <= endFrame; f++) {
      const x = Math.round(f * zoom - scrollX)
      const isMajor = f % majorInterval === 0
      const isMinor = f % minorInterval === 0

      if (isMajor) {
        // Full major tick + label
        ctx.strokeStyle = '#4E4E62'
        ctx.beginPath()
        ctx.moveTo(x + 0.5, height - 12)
        ctx.lineTo(x + 0.5, height)
        ctx.stroke()

        let label = `${f}`
        if (rulerUnit === 'seconds') {
          const sec = Math.floor(f / fps)
          const framePart = f % fps
          label = `${String(sec).padStart(2, '0')}:${String(framePart).padStart(2, '0')}`
        } else if (rulerUnit === 'timecode') {
          const totalSec = Math.floor(f / fps)
          const mins = Math.floor(totalSec / 60)
          const secs = totalSec % 60
          const framesPart = f % fps
          label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(framesPart).padStart(2, '0')}`
        }

        ctx.fillStyle = '#9E9EB5'
        ctx.fillText(label, x + 3, 3)
      } else if (isMinor) {
        // Minor tick
        ctx.strokeStyle = '#2E2E3E'
        ctx.beginPath()
        ctx.moveTo(x + 0.5, height - 7)
        ctx.lineTo(x + 0.5, height)
        ctx.stroke()

        if (zoom >= 18 && f % majorInterval !== 0) {
          ctx.fillStyle = '#5C5C70'
          ctx.fillText(`${f}`, x + 2, 4)
        }
      } else if (zoom > 25) {
        // Fine tick
        ctx.strokeStyle = '#22222E'
        ctx.beginPath()
        ctx.moveTo(x + 0.5, height - 4)
        ctx.lineTo(x + 0.5, height)
        ctx.stroke()
      }
    }

    // In Point & Out Point Markers on Ruler
    if (inX >= 0 && inX <= width) {
      ctx.fillStyle = '#3B82F6'
      ctx.beginPath()
      ctx.moveTo(inX, 0)
      ctx.lineTo(inX + 6, 0)
      ctx.lineTo(inX, 10)
      ctx.fill()
    }
    if (outX >= 0 && outX <= width) {
      ctx.fillStyle = '#3B82F6'
      ctx.beginPath()
      ctx.moveTo(outX, 0)
      ctx.lineTo(outX - 6, 0)
      ctx.lineTo(outX, 10)
      ctx.fill()
    }

    // Bottom border line
    ctx.strokeStyle = '#20202C'
    ctx.beginPath()
    ctx.moveTo(0, height - 0.5)
    ctx.lineTo(width, height - 0.5)
    ctx.stroke()
  }, [totalFrames, fps, zoom, scrollX, inPoint, outPoint, rulerUnit])

  // Handle ResizeObserver for canvas resolution
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const updateSize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    updateSize()

    const ro = new ResizeObserver(updateSize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    isDraggingRef.current = true
    const clientX = e.clientX - rect.left
    const frame = Math.max(0, Math.min(totalFrames, Math.round((clientX + scrollX) / zoom)))
    onSeek(frame)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.clientX - rect.left
    const frame = Math.max(0, Math.min(totalFrames, Math.round((clientX + scrollX) / zoom)))
    onSeek(frame)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const playheadX = currentFrame * zoom - scrollX

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-8 select-none cursor-ew-resize overflow-hidden bg-[#0F0F14]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Markers overlay */}
      {markers.map(m => {
        const mx = m.frame * zoom - scrollX
        if (mx < -20 || mx > 2500) return null
        return (
          <div
            key={m.id}
            style={{ left: `${mx}px` }}
            title={`${m.label} (Frame ${m.frame})`}
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
          >
            <div 
              style={{ backgroundColor: m.color }}
              className="w-2.5 h-2.5 rotate-45 rounded-xs shadow-md border border-white/40"
            />
            <span className="text-[8px] font-bold text-white/80 px-1 py-0.2 rounded bg-black/70 backdrop-blur-xs whitespace-nowrap mt-0.5 border border-white/10">
              {m.label}
            </span>
          </div>
        )
      })}

      {/* Highly Visible Red Triangular Scrubber Playhead in Ruler */}
      <div
        style={{ left: `${playheadX}px` }}
        className="absolute top-0 bottom-0 pointer-events-none z-20 transform -translate-x-1/2 flex flex-col items-center"
      >
        {/* Triangular Handle ▼ with Frame Badge */}
        <div className="relative flex flex-col items-center">
          <div className="w-4 h-4 bg-[#D32F2F] text-white flex items-center justify-center font-black text-[8px] font-mono shadow-md border border-[#FF6666]">
            {currentFrame}
          </div>
          {/* Down-pointing Triangle Tip ▼ */}
          <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-[#D32F2F]" />
        </div>
      </div>
    </div>
  )
}
