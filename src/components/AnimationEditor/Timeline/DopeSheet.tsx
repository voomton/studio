/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react'
import { AnimationTrack } from '../../../types/animation'
import { Layers, Plus, Diamond, ChevronRight } from 'lucide-react'

interface DopeSheetProps {
  tracks: AnimationTrack[]
  selectedTrackId?: string
  currentFrame: number
  totalFrames: number
  zoom: number
  scrollX: number
  onSeek: (frame: number) => void
  onSelectTrack: (trackId: string) => void
  onSelectKeyframe: (keyframeId: string) => void
}

export const DopeSheet: React.FC<DopeSheetProps> = ({
  tracks,
  selectedTrackId,
  currentFrame,
  totalFrames,
  zoom,
  scrollX,
  onSeek,
  onSelectTrack,
  onSelectKeyframe
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0C0C12] overflow-hidden select-none">
      {/* Header bar */}
      <div className="h-7 bg-[#14141C] border-b border-[#22222E] flex items-center px-3 justify-between text-[11px] text-[#808090] font-bold">
        <span>DOPE SHEET • DENSE KEYFRAME MATRIX</span>
        <span>{tracks.reduce((acc, t) => acc + t.keyframes.length, 0)} TOTAL KEYFRAMES</span>
      </div>

      {/* Track rows */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map(track => (
          <div 
            key={track.id}
            onClick={() => onSelectTrack(track.id)}
            className={`flex items-center h-6 border-b border-[#1A1A24] cursor-pointer ${
              selectedTrackId === track.id ? 'bg-[#181824]' : 'hover:bg-[#12121A]'
            }`}
          >
            {/* Track Name */}
            <div className="w-56 shrink-0 px-3 text-[11px] font-bold truncate text-[#A0A0B0] border-r border-[#22222E]">
              {track.name}
            </div>

            {/* Dope Sheet Strip */}
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const clickX = e.clientX - rect.left
                const frame = Math.max(0, Math.min(totalFrames, Math.round((clickX + scrollX) / zoom)))
                onSeek(frame)
              }}
              className="flex-1 h-full relative overflow-hidden bg-[#0A0A0F]"
            >
              {track.keyframes.map(kf => {
                const kx = kf.frame * zoom - scrollX
                if (kx < -20 || kx > 2000) return null

                return (
                  <div
                    key={kf.id}
                    style={{ left: `${kx}px` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectKeyframe(kf.id)
                      onSeek(kf.frame)
                    }}
                    title={`Frame ${kf.frame}`}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#D32F2F] hover:bg-[#00E676] rounded-xs cursor-pointer shadow-sm"
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
