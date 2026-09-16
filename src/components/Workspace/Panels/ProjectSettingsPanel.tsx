import React from 'react'
import { Settings, Sliders, Monitor, Film, Layers, Palette, Shield } from 'lucide-react'

interface ProjectSettingsPanelProps {
  fps: number
  totalFrames: number
  onUpdateFps: (fps: number) => void
  onUpdateTotalFrames: (frames: number) => void
  shadingMode?: string
  onUpdateShadingMode?: (mode: string) => void
}

export const ProjectSettingsPanel: React.FC<ProjectSettingsPanelProps> = ({
  fps,
  totalFrames,
  onUpdateFps,
  onUpdateTotalFrames,
  shadingMode = 'toon',
  onUpdateShadingMode
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white p-4 space-y-5 overflow-y-auto custom-scrollbar">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-[#3B82F6]" />
          <span>Project Configuration</span>
        </h3>
        <p className="text-[10px] text-[#707080] mt-0.5">
          Global sequence framerate, timeline limits and render settings
        </p>
      </div>

      {/* Framerate Selection */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-[#A0A0B5] uppercase tracking-wider block">
          Framerate (FPS)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 24, label: '24 FPS', desc: 'Anime & Cinema' },
            { value: 30, label: '30 FPS', desc: 'Broadcast' },
            { value: 60, label: '60 FPS', desc: 'Ultra-Smooth' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onUpdateFps(opt.value)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                fps === opt.value
                  ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/20'
                  : 'bg-[#14141C] border-[#222230] text-[#808095] hover:border-[#353548]'
              }`}
            >
              <span className="font-bold text-xs block text-white">{opt.label}</span>
              <span className="text-[9px] text-[#606070]">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Total Sequence Length */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[#A0A0B5] uppercase tracking-wider">
            Total Sequence Frames
          </label>
          <span className="text-xs font-mono font-bold text-[#3B82F6]">
            {totalFrames} frames ({(totalFrames / fps).toFixed(1)}s)
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[72, 120, 240, 480].map(cnt => (
            <button
              key={cnt}
              onClick={() => onUpdateTotalFrames(cnt)}
              className={`py-1.5 px-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                totalFrames === cnt
                  ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                  : 'bg-[#14141C] border-[#222230] text-[#808095] hover:text-white'
              }`}
            >
              {cnt}f
            </button>
          ))}
        </div>
      </div>

      {/* Shading Mode */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-[#A0A0B5] uppercase tracking-wider block">
          Cel & Surface Shading
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'toon', label: 'Anime Cel-Toon' },
            { id: 'pbr', label: 'PBR Realistic' },
            { id: 'unlit', label: 'Flat Unlit' }
          ].map(sh => (
            <button
              key={sh.id}
              onClick={() => onUpdateShadingMode?.(sh.id)}
              className={`py-2 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                shadingMode === sh.id
                  ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                  : 'bg-[#14141C] border-[#222230] text-[#707080] hover:text-white'
              }`}
            >
              {sh.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Quality & Anti-aliasing */}
      <div className="p-3 rounded-xl bg-[#12121A] border border-[#1E1E28] space-y-2">
        <span className="text-xs font-bold text-white block">Engine Performance</span>
        <div className="text-[11px] text-[#808095] space-y-1">
          <div className="flex justify-between">
            <span>Hardware Acceleration:</span>
            <span className="text-[#10B981] font-bold">WebGL 2.0 Active</span>
          </div>
          <div className="flex justify-between">
            <span>Shadow Map Resolution:</span>
            <span className="text-white">2048 x 2048</span>
          </div>
          <div className="flex justify-between">
            <span>Texture Anisotropy:</span>
            <span className="text-white">16x Max</span>
          </div>
        </div>
      </div>
    </div>
  )
}
