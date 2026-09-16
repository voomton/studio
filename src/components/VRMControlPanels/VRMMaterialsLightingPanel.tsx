import React from 'react'
import { VRM } from '@pixiv/three-vrm'
import { VRMAvatarState } from '../../utils/vrmManager'
import { 
  Sun, 
  Sparkles, 
  Palette, 
  Layers, 
  Lightbulb, 
  Moon, 
  Image as ImageIcon 
} from 'lucide-react'

interface VRMMaterialsLightingPanelProps {
  vrm: VRM | null
  avatarState: VRMAvatarState
  onChange: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
}

const RIM_COLORS = [
  { name: 'Sakura Pink', hex: '#FF6B8B' },
  { name: 'Cyber Cyan', hex: '#00E5FF' },
  { name: 'Electric Gold', hex: '#FFD700' },
  { name: 'Neon Purple', hex: '#D500F9' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Crimson Red', hex: '#FF1744' }
]

const BACKDROPS: { id: VRMAvatarState['backdrop']; label: string; desc: string; color: string }[] = [
  { id: 'dark', label: 'Dark Obsidian', desc: 'Studio black luxury atmosphere', color: '#111116' },
  { id: 'sakura', label: 'Sakura Twilight', desc: 'Warm magenta manga night', color: '#2E1424' },
  { id: 'cyber', label: 'Cyber Blue', desc: 'Deep sci-fi navy gradient', color: '#0B1A2E' },
  { id: 'slate', label: 'Daylight Slate', desc: 'Neutral architectural daylight', color: '#334155' },
  { id: 'chroma', label: 'Chroma Green', desc: 'Pure #00FF00 green for video keying', color: '#00FF00' },
  { id: 'transparent', label: 'Alpha Grid', desc: 'Transparent canvas for PNG cutout', color: '#1E1E24' }
]

export const VRMMaterialsLightingPanel: React.FC<VRMMaterialsLightingPanelProps> = ({
  vrm,
  avatarState,
  onChange
}) => {
  return (
    <div className="flex flex-col gap-5 p-4 text-xs">
      {/* Studio Backdrop Picker */}
      <div className="flex flex-col gap-2.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3 text-[#D32F2F]" />
          Studio Backdrop Canvas
        </label>

        <div className="grid grid-cols-2 gap-2">
          {BACKDROPS.map(bg => (
            <button
              key={bg.id}
              onClick={() => onChange(prev => ({ ...prev, backdrop: bg.id }))}
              className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                avatarState.backdrop === bg.id
                  ? 'bg-[#1E1E24] border-[#D32F2F] shadow-sm'
                  : 'bg-[#14141A] border-[#2D2D35] hover:bg-[#1E1E24]'
              }`}
            >
              <div 
                className="w-5 h-5 rounded-md border border-white/20 shrink-0" 
                style={{ backgroundColor: bg.color }} 
              />
              <div className="flex flex-col min-w-0">
                <span className={`text-[11px] font-bold truncate ${avatarState.backdrop === bg.id ? 'text-white' : 'text-[#B0B0BF]'}`}>
                  {bg.label}
                </span>
                <span className="text-[9px] text-[#80808F] truncate">
                  {bg.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Studio Lighting Controls */}
      <div className="flex flex-col gap-3 bg-[#18181F] p-3 rounded-lg border border-[#2D2D35]">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
          <Sun className="w-3 h-3 text-[#D32F2F]" />
          3-Point Studio Lighting
        </label>

        {/* Key Light */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-[#E0E0E5]">Key Directional Light</span>
            <span className="font-mono text-[#80808F]">{(avatarState.keyLightIntensity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={3.0}
            step={0.05}
            value={avatarState.keyLightIntensity}
            onChange={e => onChange(prev => ({ ...prev, keyLightIntensity: parseFloat(e.target.value) }))}
            className="w-full accent-[#D32F2F] h-1.5 bg-[#252530] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Ambient Light */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-[#E0E0E5]">Ambient Sky Light</span>
            <span className="font-mono text-[#80808F]">{(avatarState.ambientIntensity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.05}
            value={avatarState.ambientIntensity}
            onChange={e => onChange(prev => ({ ...prev, ambientIntensity: parseFloat(e.target.value) }))}
            className="w-full accent-[#D32F2F] h-1.5 bg-[#252530] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Rim Light / Backlight */}
        <div className="flex flex-col gap-1 pt-1 border-t border-[#2D2D35]">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-[#E0E0E5]">Anime Rim Light Intensity</span>
            <span className="font-mono text-[#80808F]">{(avatarState.rimLightIntensity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={3.0}
            step={0.05}
            value={avatarState.rimLightIntensity}
            onChange={e => onChange(prev => ({ ...prev, rimLightIntensity: parseFloat(e.target.value) }))}
            className="w-full accent-[#D32F2F] h-1.5 bg-[#252530] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Rim Light Color Swatches */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[10px] text-[#80808F] font-bold uppercase">Rim Light Color Tint</span>
          <div className="grid grid-cols-6 gap-1.5">
            {RIM_COLORS.map(c => (
              <button
                key={c.hex}
                onClick={() => onChange(prev => ({ ...prev, rimLightColor: c.hex }))}
                title={c.name}
                className={`h-7 rounded-md border transition-all ${
                  avatarState.rimLightColor.toLowerCase() === c.hex.toLowerCase()
                    ? 'border-white scale-105 shadow-md'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
