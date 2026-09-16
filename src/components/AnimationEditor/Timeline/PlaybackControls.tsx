/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Clock,
  Zap
} from 'lucide-react'

interface PlaybackControlsProps {
  currentFrame: number
  totalFrames: number
  fps: number
  isPlaying: boolean
  isLooping: boolean
  playbackSpeed?: number
  inPoint: number
  outPoint: number
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSeek: (frame: number) => void
  onPrevFrame: () => void
  onNextFrame: () => void
  onGoToStart: () => void
  onGoToEnd: () => void
  onPrevKeyframe: () => void
  onNextKeyframe: () => void
  onToggleLoop: () => void
  onChangeSpeed?: (speed: number) => void
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentFrame,
  totalFrames,
  fps,
  isPlaying,
  isLooping,
  playbackSpeed = 1.0,
  inPoint,
  outPoint,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onPrevFrame,
  onNextFrame,
  onGoToStart,
  onGoToEnd,
  onPrevKeyframe,
  onNextKeyframe,
  onToggleLoop,
  onChangeSpeed
}) => {
  const [isEditingFrame, setIsEditingFrame] = useState(false)
  const [frameInputVal, setFrameInputVal] = useState(String(currentFrame))

  // Timecode formatter: 00:01.40
  const formatTime = (frame: number) => {
    const totalSec = frame / fps
    const minutes = Math.floor(totalSec / 60)
    const seconds = Math.floor(totalSec % 60)
    const centis = Math.floor((totalSec % 1) * 100)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
  }

  const handleFrameInputSubmit = () => {
    setIsEditingFrame(false)
    const parsed = parseInt(frameInputVal, 10)
    if (!isNaN(parsed)) {
      onSeek(Math.max(0, Math.min(totalFrames, parsed)))
    }
  }

  return (
    <div className="h-10 bg-[#0E0E14] border-t border-[#1C1C26] flex items-center justify-between px-3 select-none shrink-0 z-20">
      {/* Left: Frame & Timecode Readouts */}
      <div className="flex items-center gap-3">
        {/* FRAME Indicator */}
        <div className="flex items-center gap-1.5 bg-[#14141C] px-2.5 py-1 rounded-lg border border-[#222230]">
          <span className="text-[10px] font-bold text-[#6D6D82] uppercase tracking-wider">Frame</span>
          {isEditingFrame ? (
            <input
              type="number"
              autoFocus
              value={frameInputVal}
              onChange={e => setFrameInputVal(e.target.value)}
              onBlur={handleFrameInputSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleFrameInputSubmit()
                if (e.key === 'Escape') setIsEditingFrame(false)
              }}
              className="w-12 bg-[#252536] text-white text-xs font-mono font-bold px-1 rounded text-center focus:outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setFrameInputVal(String(currentFrame))
                setIsEditingFrame(true)
              }}
              title="Click to jump directly to frame"
              className="text-xs font-mono font-bold text-[#00E676] hover:bg-[#20202E] px-1 rounded transition-colors cursor-pointer"
            >
              {currentFrame}
            </button>
          )}
          <span className="text-[11px] font-mono text-[#58586E]">/ {totalFrames}</span>
        </div>

        {/* TIME Readout */}
        <div className="flex items-center gap-1.5 bg-[#14141C] px-2.5 py-1 rounded-lg border border-[#222230]">
          <Clock className="w-3 h-3 text-[#A0A0B5]" />
          <span className="text-[10px] font-bold text-[#6D6D82] uppercase tracking-wider">Time</span>
          <span className="text-xs font-mono font-bold text-white">
            {formatTime(currentFrame)}
          </span>
          <span className="text-[10px] font-mono text-[#58586E]">
            / {formatTime(totalFrames)}
          </span>
        </div>

        {/* FPS Readout */}
        <div className="hidden md:flex items-center gap-1 bg-[#14141C] px-2 py-1 rounded-lg border border-[#222230]">
          <span className="text-[10px] font-bold text-[#6D6D82]">FPS:</span>
          <span className="text-xs font-mono font-bold text-[#60A5FA]">{fps}</span>
        </div>
      </div>

      {/* Center: Playback Transport Buttons */}
      <div className="flex items-center gap-1">
        {/* |◀ Go to Start */}
        <button
          onClick={onGoToStart}
          title="Go to Start (Home)"
          className="p-1.5 text-[#9898AB] hover:text-white hover:bg-[#1E1E2C] rounded transition-all cursor-pointer"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* ◀◆ Previous Keyframe */}
        <button
          onClick={onPrevKeyframe}
          title="Previous Keyframe (Shift + Left)"
          className="flex items-center gap-0.5 px-1.5 py-1 text-[#9898AB] hover:text-white hover:bg-[#1E1E2C] rounded text-xs font-bold transition-all cursor-pointer"
        >
          <span className="text-[11px]">◀</span>
          <span className="text-[#00E676] text-[10px]">◆</span>
        </button>

        {/* ◀ Previous Frame */}
        <button
          onClick={onPrevFrame}
          title="Previous Frame (Left Arrow)"
          className="p-1.5 text-[#9898AB] hover:text-white hover:bg-[#1E1E2C] rounded transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* ▶ / ⏸ Play / Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? "Pause Playback (Space)" : "Start Playback (Space)"}
          className={`px-4 py-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md mx-1 ${
            isPlaying 
              ? 'bg-[#EAB308] hover:bg-[#CA8A04] text-black shadow-[#EAB308]/20' 
              : 'bg-[#D32F2F] hover:bg-[#B71C1C] text-white shadow-[#D32F2F]/25'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* ⏹ Stop */}
        <button
          onClick={onStop}
          title="Stop & Reset to Start"
          className="p-1.5 text-[#9898AB] hover:text-white hover:bg-[#1E1E2C] rounded transition-all cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* ▶ Next Frame */}
        <button
          onClick={onNextFrame}
          title="Next Frame (Right Arrow)"
          className="p-1.5 text-[#9898AB] hover:text-white hover:bg-[#1E1E2C] rounded transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* ◆▶ Next Keyframe */}
        <button
          onClick={onNextKeyframe}
          title="Next Keyframe (Shift + Right)"
          className="flex items-center gap-0.5 px-1.5 py-1 text-[#9898AB] hover:text-white hover:bg-[#1E1E2C] rounded text-xs font-bold transition-all cursor-pointer"
        >
          <span className="text-[#00E676] text-[10px]">◆</span>
          <span className="text-[11px]">▶</span>
        </button>

        {/* ▶| Go to End */}
        <button
          onClick={onGoToEnd}
          title="Go to End (End)"
          className="p-1.5 text-[#9898AB] hover:text-white hover:bg-[#1E1E2C] rounded transition-all cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* 🔁 Loop Toggle */}
        <button
          onClick={onToggleLoop}
          title={isLooping ? "Loop Playback: ON" : "Loop Playback: OFF"}
          className={`p-1.5 rounded transition-all cursor-pointer ml-1 ${
            isLooping ? 'text-[#10B981] bg-[#10B981]/15' : 'text-[#68687D] hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Playback Speed Control (0.25x, 0.5x, 1x, 1.5x, 2x) */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-[#6D6D82] uppercase tracking-wider hidden sm:inline">Speed:</span>
        <div className="flex items-center bg-[#14141C] p-0.5 rounded-lg border border-[#222230]">
          {[0.25, 0.5, 1.0, 1.5, 2.0].map(speed => (
            <button
              key={speed}
              onClick={() => onChangeSpeed?.(speed)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                playbackSpeed === speed 
                  ? 'bg-[#D32F2F] text-white shadow-sm' 
                  : 'text-[#7D7D92] hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
