import React from 'react'
import { 
  Undo2, 
  Redo2, 
  Magnet, 
  Scissors, 
  SkipBack, 
  StepBack, 
  Play, 
  Pause, 
  StepForward, 
  SkipForward, 
  Repeat, 
  Settings, 
  Film, 
  Maximize,
  Sliders,
  Sparkles
} from 'lucide-react'

interface CinemaTransportBarProps {
  isPlaying: boolean
  onPlayPause: () => void
  currentFrame: number
  totalFrames: number
  fps: number
  onFpsChange: (fps: number) => void
  speed: number
  onSpeedChange: (speed: number) => void
  currentTimecode: string
  totalTimecode?: string
  onJumpToStart: () => void
  onJumpToEnd: () => void
  onPreviousFrame: () => void
  onNextFrame: () => void
  onSeekFrame: (frame: number) => void
  onTotalFramesChange?: (newTotalFrames: number) => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  isSnapping?: boolean
  onToggleSnapping?: () => void
  isLooping?: boolean
  onToggleLooping?: () => void
  onOpenRenderModal?: () => void
}

export const CinemaTransportBar: React.FC<CinemaTransportBarProps> = ({
  isPlaying,
  onPlayPause,
  currentFrame,
  totalFrames,
  fps,
  onFpsChange,
  speed,
  onSpeedChange,
  currentTimecode,
  totalTimecode,
  onJumpToStart,
  onJumpToEnd,
  onPreviousFrame,
  onNextFrame,
  onSeekFrame,
  onTotalFramesChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isSnapping = true,
  onToggleSnapping,
  isLooping = true,
  onToggleLooping,
  onOpenRenderModal
}) => {
  return (
    <div className="h-11 px-3 border-y border-[#2E2548]/80 bg-[#140F1E] flex items-center justify-between shrink-0 select-none z-10">
      {/* Left: Tools (Undo, Redo, Magnet, Split) */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl + Z)"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            canUndo 
              ? 'text-[#A09BB5] hover:text-white hover:bg-[#251E38]' 
              : 'text-[#48405A] cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl + Y)"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            canRedo 
              ? 'text-[#A09BB5] hover:text-white hover:bg-[#251E38]' 
              : 'text-[#48405A] cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-[#2E2548] mx-1" />

        <button
          onClick={onToggleSnapping}
          title={isSnapping ? 'Timeline Snapping: ON' : 'Timeline Snapping: OFF'}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isSnapping 
              ? 'bg-[#8C7BFF]/20 text-[#C4B5FD] border border-[#8C7BFF]/50' 
              : 'text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
          }`}
        >
          <Magnet className="w-4 h-4" />
        </button>

        <button
          onClick={() => {}}
          title="Split Clip at Playhead (S)"
          className="p-1.5 rounded-lg text-[#A09BB5] hover:text-white hover:bg-[#251E38] transition-colors cursor-pointer"
        >
          <Scissors className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Playback Controls, Timecode & Frame */}
      <div className="flex items-center gap-3">
        {/* Step to Start */}
        <button
          onClick={onJumpToStart}
          title="Jump to Start (Home)"
          className="p-1.5 rounded-lg text-[#A09BB5] hover:text-white hover:bg-[#251E38] transition-colors cursor-pointer"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Step Previous Frame */}
        <button
          onClick={onPreviousFrame}
          title="Previous Frame (Left Arrow)"
          className="p-1.5 rounded-lg text-[#A09BB5] hover:text-white hover:bg-[#251E38] transition-colors cursor-pointer"
        >
          <StepBack className="w-4 h-4" />
        </button>

        {/* PRIMARY PLAY / PAUSE BUTTON: Coral #FF7A93 */}
        <button
          onClick={onPlayPause}
          title={isPlaying ? 'Pause Animation (Space)' : 'Play Animation (Space)'}
          className="w-8 h-8 rounded-lg bg-[#FF7A93] hover:bg-[#FF6482] text-white flex items-center justify-center shadow-md shadow-[#FF7A93]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Step Next Frame */}
        <button
          onClick={onNextFrame}
          title="Next Frame (Right Arrow)"
          className="p-1.5 rounded-lg text-[#A09BB5] hover:text-white hover:bg-[#251E38] transition-colors cursor-pointer"
        >
          <StepForward className="w-4 h-4" />
        </button>

        {/* Jump to End */}
        <button
          onClick={onJumpToEnd}
          title="Jump to End (End)"
          className="p-1.5 rounded-lg text-[#A09BB5] hover:text-white hover:bg-[#251E38] transition-colors cursor-pointer"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-[#2E2548] mx-0.5" />

        {/* Current Timecode / Total Timecode Display */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E172E] border border-[#2E2548] font-mono text-xs font-bold shadow-inner" title="Current Playhead / Total Timeline Duration">
          <span className="text-white tracking-wider">{currentTimecode}</span>
          {totalTimecode && (
            <>
              <span className="text-[#685F80]">/</span>
              <span className="text-[#A09BB5] tracking-wider">{totalTimecode}</span>
            </>
          )}
        </div>

        {/* Frame Counter Display */}
        <div className="flex items-center gap-1 font-mono text-xs text-[#A09BB5]">
          <span>Frame</span>
          <input
            type="number"
            min={0}
            max={totalFrames}
            value={currentFrame}
            onChange={(e) => onSeekFrame(Number(e.target.value))}
            className="w-14 px-1.5 py-0.5 rounded bg-[#1E172E] border border-[#2E2548] text-white text-center font-bold text-xs focus:border-[#8C7BFF] outline-none"
            title="Current Frame Number"
          />
        </div>

        {/* Timeline Duration Selector: from 3s up to 1h+ */}
        {onTotalFramesChange && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A09BB5]">
            <span>Duration</span>
            <select
              value={totalFrames}
              onChange={(e) => onTotalFramesChange(Number(e.target.value))}
              className="bg-[#1E172E] text-white border border-[#2E2548] rounded-md px-1.5 py-0.5 text-xs font-mono font-bold outline-none cursor-pointer hover:border-[#8C7BFF] transition-colors"
              title="Change total timeline length (3s to 1 hour)"
            >
              <option value={fps * 3}>3s (Quick clip)</option>
              <option value={fps * 5}>5s</option>
              <option value={fps * 10}>10s</option>
              <option value={fps * 15}>15s</option>
              <option value={fps * 30}>30s (Half minute)</option>
              <option value={fps * 60}>1m (Standard scene)</option>
              <option value={fps * 120}>2m</option>
              <option value={fps * 180}>3m</option>
              <option value={fps * 300}>5m</option>
              <option value={fps * 600}>10m</option>
              <option value={fps * 900}>15m</option>
              <option value={fps * 1800}>30m</option>
              <option value={fps * 3600}>1h (Full movie)</option>
              {/* If current value is not one of the standard presets */}
              {![3, 5, 10, 15, 30, 60, 120, 180, 300, 600, 900, 1800, 3600].includes(Math.round(totalFrames / fps)) && (
                <option value={totalFrames}>
                  Custom ({Math.floor(totalFrames / fps / 60)}m {Math.floor((totalFrames / fps) % 60)}s)
                </option>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Right: Speed, FPS, Loop & Render */}
      <div className="flex items-center gap-2">
        {/* Playback Speed Dropdown */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A09BB5]">
          <span>Speed</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-[#1E172E] text-white border border-[#2E2548] rounded-md px-1.5 py-0.5 text-xs font-mono font-bold outline-none cursor-pointer hover:border-[#8C7BFF] transition-colors"
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
          </select>
        </div>

        {/* FPS Dropdown */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A09BB5]">
          <span>FPS</span>
          <select
            value={fps}
            onChange={(e) => onFpsChange(Number(e.target.value))}
            className="bg-[#1E172E] text-white border border-[#2E2548] rounded-md px-1.5 py-0.5 text-xs font-mono font-bold outline-none cursor-pointer hover:border-[#8C7BFF] transition-colors"
          >
            <option value={24}>24</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
        </div>

        <div className="w-px h-4 bg-[#2E2548] mx-0.5" />

        {/* Loop Toggle */}
        <button
          onClick={onToggleLooping}
          title={isLooping ? 'Loop Playback: ON' : 'Loop Playback: OFF'}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isLooping 
              ? 'text-[#8C7BFF] bg-[#8C7BFF]/15' 
              : 'text-[#A09BB5] hover:text-white hover:bg-[#251E38]'
          }`}
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Render Cinema Button */}
        {onOpenRenderModal && (
          <button
            onClick={onOpenRenderModal}
            title="Render Sequence / Export Video"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#271F3D] hover:bg-[#8C7BFF] hover:text-white border border-[#3E325E] text-xs font-bold text-[#C4B5FD] transition-all cursor-pointer"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Render</span>
          </button>
        )}
      </div>
    </div>
  )
}
