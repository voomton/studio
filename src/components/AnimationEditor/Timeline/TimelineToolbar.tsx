/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react'
import { 
  Plus, 
  Magnet, 
  Layers, 
  Camera, 
  Volume2, 
  Bookmark, 
  UserPlus, 
  Sliders, 
  Activity, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Settings, 
  ChevronDown,
  Sparkles,
  Gauge
} from 'lucide-react'
import { TimelineViewMode, RulerUnit } from '../../../types/animation'

interface TimelineToolbarProps {
  onAddTrack: (trackType: string) => void
  onAddCharacter: () => void
  onAddCamera: () => void
  onAddAudio: () => void
  onAddMarker: () => void
  snapToFrames: boolean
  onToggleSnap: () => void
  magnetSnapping?: boolean
  onToggleMagnet?: () => void
  onAddKeyframeCurrent: () => void
  autoKeyframe: boolean
  onToggleAutoKeyframe: () => void
  isLooping: boolean
  onToggleLoop: () => void
  zoom: number
  onChangeZoom: (newZoom: number) => void
  onFitTimeline: () => void
  fps: number
  onChangeFPS: (fps: number) => void
  rulerUnit: RulerUnit
  onChangeRulerUnit: (unit: RulerUnit) => void
  mode: TimelineViewMode
  onChangeMode: (mode: TimelineViewMode) => void
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  onAddTrack,
  onAddCharacter,
  onAddCamera,
  onAddAudio,
  onAddMarker,
  snapToFrames,
  onToggleSnap,
  magnetSnapping = true,
  onToggleMagnet,
  onAddKeyframeCurrent,
  autoKeyframe,
  onToggleAutoKeyframe,
  isLooping,
  onToggleLoop,
  zoom,
  onChangeZoom,
  onFitTimeline,
  fps,
  onChangeFPS,
  rulerUnit,
  onChangeRulerUnit,
  mode,
  onChangeMode,
  isExpanded,
  onToggleExpanded
}) => {
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const trackMenuRef = useRef<HTMLDivElement>(null)
  const settingsMenuRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trackMenuRef.current && !trackMenuRef.current.contains(e.target as Node)) {
        setIsTrackMenuOpen(false)
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="h-10 bg-[#12121A] border-b border-[#20202C] flex items-center justify-between px-3 select-none shrink-0 z-20">
      {/* LEFT SIDE: Add Track, Add Character, Add Camera, Add Audio, Add Marker */}
      <div className="flex items-center gap-1.5">
        {/* + Track Dropdown */}
        <div className="relative" ref={trackMenuRef}>
          <button
            onClick={() => setIsTrackMenuOpen(prev => !prev)}
            title="Add a new sequencer track"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1C1C28] hover:bg-[#252536] text-white border border-[#2D2D3E] text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#D32F2F]" />
            <span>Track</span>
            <ChevronDown className="w-3 h-3 text-[#7E7E94]" />
          </button>

          {isTrackMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-48 rounded-lg bg-[#181824] border border-[#2B2B3E] shadow-2xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-bold text-[#6D6D82] uppercase tracking-wider">
                Create Track
              </div>
              <button
                onClick={() => { onAddTrack('transform'); setIsTrackMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#222232] text-white text-left cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span>Transform (Pos, Rot, Scale)</span>
              </button>
              <button
                onClick={() => { onAddTrack('clip'); setIsTrackMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#222232] text-white text-left cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Action Animation Clip</span>
              </button>
              <button
                onClick={() => { onAddTrack('expression'); setIsTrackMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#222232] text-white text-left cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
                <span>Face & Expression</span>
              </button>
              <button
                onClick={() => { onAddTrack('cameraFov'); setIsTrackMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#222232] text-white text-left cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                <span>Camera FOV & Animation</span>
              </button>
              <button
                onClick={() => { onAddTrack('audio'); setIsTrackMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#222232] text-white text-left cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span>Dialogue & Audio</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Add Buttons */}
        <button
          onClick={onAddCharacter}
          title="Add Character Track"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#181822] hover:bg-[#20202E] text-[#A0A0B5] hover:text-white border border-[#252534] text-xs font-semibold transition-all cursor-pointer"
        >
          <UserPlus className="w-3 h-3 text-[#3B82F6]" />
          <span className="hidden sm:inline">+ Character</span>
        </button>

        <button
          onClick={onAddCamera}
          title="Add Camera Track or Shot"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#181822] hover:bg-[#20202E] text-[#A0A0B5] hover:text-white border border-[#252534] text-xs font-semibold transition-all cursor-pointer"
        >
          <Camera className="w-3 h-3 text-[#06B6D4]" />
          <span className="hidden sm:inline">+ Camera</span>
        </button>

        <button
          onClick={onAddAudio}
          title="Add Audio Track"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#181822] hover:bg-[#20202E] text-[#A0A0B5] hover:text-white border border-[#252534] text-xs font-semibold transition-all cursor-pointer"
        >
          <Volume2 className="w-3 h-3 text-[#F59E0B]" />
          <span className="hidden sm:inline">+ Audio</span>
        </button>

        <button
          onClick={onAddMarker}
          title="Add Scene Marker at current frame (M)"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#181822] hover:bg-[#20202E] text-[#A0A0B5] hover:text-white border border-[#252534] text-xs font-semibold transition-all cursor-pointer"
        >
          <Bookmark className="w-3 h-3 text-[#EAB308]" />
          <span className="hidden md:inline">+ Marker</span>
        </button>

        <div className="h-4 w-px bg-[#262638] mx-1" />

        {/* View Switcher: Timeline / Graph Editor / Dope Sheet */}
        <div className="flex items-center bg-[#151520] p-0.5 rounded-lg border border-[#252536]">
          <button
            onClick={() => onChangeMode('timeline')}
            title="Sequencer Multi-Track Timeline"
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
              mode === 'timeline'
                ? 'bg-[#D32F2F] text-white shadow-sm'
                : 'text-[#808096] hover:text-white'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => onChangeMode('graph')}
            title="Blender-style Curve Graph Editor"
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
              mode === 'graph'
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'text-[#808096] hover:text-white'
            }`}
          >
            Graph
          </button>
          <button
            onClick={() => onChangeMode('dopesheet')}
            title="Keyframe Timing Dope Sheet"
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
              mode === 'dopesheet'
                ? 'bg-[#10B981] text-black shadow-sm font-black'
                : 'text-[#808096] hover:text-white'
            }`}
          >
            Dope Sheet
          </button>
        </div>
      </div>

      {/* CENTER: Snap, Magnet, Keyframe, Auto Key, Loop */}
      <div className="flex items-center gap-1.5">
        {/* Snap Toggle */}
        <button
          onClick={onToggleSnap}
          title={snapToFrames ? "Frame Snapping Enabled" : "Frame Snapping Disabled"}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer border ${
            snapToFrames 
              ? 'bg-[#D32F2F]/15 border-[#D32F2F]/40 text-[#D32F2F]' 
              : 'bg-[#161622] border-[#252536] text-[#707085] hover:text-white'
          }`}
        >
          <span className="text-[12px] font-mono leading-none">🧲</span>
          <span>Snap</span>
        </button>

        {/* Magnet Snapping Toggle */}
        {onToggleMagnet && (
          <button
            onClick={onToggleMagnet}
            title={magnetSnapping ? "Magnetic Keyframe & Marker Snapping" : "Magnetic Snapping Disabled"}
            className={`p-1 rounded text-xs font-semibold transition-all cursor-pointer border ${
              magnetSnapping 
                ? 'bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#60A5FA]' 
                : 'bg-[#161622] border-[#252536] text-[#707085] hover:text-white'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Keyframe Current Button */}
        <button
          onClick={onAddKeyframeCurrent}
          title="Add / Commit Keyframe at Current Frame (K)"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#252536] hover:bg-[#323248] text-white border border-[#3B3B52] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="text-[#00E676] font-black text-xs">◆</span>
          <span>Keyframe</span>
        </button>

        {/* Auto Key Toggle */}
        <button
          onClick={onToggleAutoKeyframe}
          title={autoKeyframe ? "Auto Keyframe Recording ON: Property edits automatically insert keyframe" : "Auto Keyframe OFF"}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider transition-all cursor-pointer border shadow-sm ${
            autoKeyframe 
              ? 'bg-[#D32F2F] text-white border-[#FF5252] shadow-md shadow-[#D32F2F]/25 animate-pulse' 
              : 'bg-[#161622] border-[#252536] text-[#707085] hover:text-white'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${autoKeyframe ? 'bg-white' : 'bg-[#555566]'}`} />
          <span>Auto Key</span>
        </button>

        {/* Loop Toggle */}
        <button
          onClick={onToggleLoop}
          title={isLooping ? "Playback Loop: ON" : "Playback Loop: OFF"}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer border ${
            isLooping 
              ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]' 
              : 'bg-[#161622] border-[#252536] text-[#707085] hover:text-white'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Loop</span>
        </button>
      </div>

      {/* RIGHT: Timeline Zoom, Fit Timeline, Frame Rate, Settings */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#151520] px-1.5 py-0.5 rounded-lg border border-[#252536]">
          <button
            onClick={() => onChangeZoom(Math.max(6, zoom - 3))}
            title="Zoom Out Timeline (Ctrl -)"
            className="p-1 text-[#808096] hover:text-white hover:bg-[#202030] rounded cursor-pointer transition-all"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          
          {/* Zoom Slider */}
          <input
            type="range"
            min={6}
            max={50}
            step={2}
            value={zoom}
            onChange={e => onChangeZoom(Number(e.target.value))}
            title={`Zoom: ${zoom}px/frame`}
            className="w-16 h-1 bg-[#252536] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
          />

          <button
            onClick={() => onChangeZoom(Math.min(50, zoom + 3))}
            title="Zoom In Timeline (Ctrl +)"
            className="p-1 text-[#808096] hover:text-white hover:bg-[#202030] rounded cursor-pointer transition-all"
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          <button
            onClick={onFitTimeline}
            title="Fit Entire Sequence into View"
            className="px-1.5 py-0.5 text-[10px] font-bold text-[#A0A0B8] hover:text-white hover:bg-[#252536] rounded cursor-pointer transition-all border border-[#2D2D3E]"
          >
            Fit
          </button>
        </div>

        {/* Frame Rate Selector (24, 30, 60 FPS) */}
        <div className="flex items-center bg-[#151520] px-2 py-1 rounded-lg border border-[#252536] gap-1.5">
          <Gauge className="w-3 h-3 text-[#A0A0B8]" />
          <span className="text-[10px] text-[#707085] font-bold">FPS:</span>
          <select
            value={fps}
            onChange={e => onChangeFPS(Number(e.target.value))}
            title="Project Frame Rate"
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value={24} className="bg-[#181824] text-white">24</option>
            <option value={30} className="bg-[#181824] text-white">30</option>
            <option value={60} className="bg-[#181824] text-white">60</option>
          </select>
        </div>

        {/* Ruler Units Switcher: Frames / Seconds / Timecode */}
        <div className="flex items-center bg-[#151520] px-1 py-0.5 rounded-lg border border-[#252536]">
          <button
            onClick={() => onChangeRulerUnit('frames')}
            title="Display Ruler in Raw Frames"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
              rulerUnit === 'frames' ? 'bg-[#2B2B3E] text-white' : 'text-[#707085] hover:text-white'
            }`}
          >
            Frames
          </button>
          <button
            onClick={() => onChangeRulerUnit('seconds')}
            title="Display Ruler in Seconds"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
              rulerUnit === 'seconds' ? 'bg-[#2B2B3E] text-white' : 'text-[#707085] hover:text-white'
            }`}
          >
            Sec
          </button>
          <button
            onClick={() => onChangeRulerUnit('timecode')}
            title="Display Ruler in Standard Timecode (00:00:00:00)"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
              rulerUnit === 'timecode' ? 'bg-[#2B2B3E] text-white' : 'text-[#707085] hover:text-white'
            }`}
          >
            TC
          </button>
        </div>

        {/* Expand / Fullscreen Timeline */}
        {onToggleExpanded && (
          <button
            onClick={onToggleExpanded}
            title={isExpanded ? "Restore Viewport Size" : "Maximize Timeline (Focus Animation Mode)"}
            className="p-1 rounded bg-[#151520] hover:bg-[#222230] text-[#808096] hover:text-white border border-[#252536] cursor-pointer transition-all"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}
