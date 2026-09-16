import React from 'react'
import { CharacterConfig, HairstyleId } from '../../types/character'
import { Sparkles } from 'lucide-react'

interface HairPanelProps {
  config: CharacterConfig
  onChange: (updater: (prev: CharacterConfig) => CharacterConfig) => void
}

const HAIRSTYLES: { id: HairstyleId; label: string; desc: string }[] = [
  { id: 'twintails', label: 'Twin-Tails', desc: 'Bouncy anime pigtails with ribbons' },
  { id: 'hime_cut', label: 'Hime Cut', desc: 'Regal long straight locks & blunt bangs' },
  { id: 'short_bob', label: 'Layered Bob', desc: 'Cute short stylish bob with side fringe' },
  { id: 'spiky_hero', label: 'Spiky Hero', desc: 'Volumetric dynamic anime spikes' },
  { id: 'high_ponytail', label: 'High Ponytail', desc: 'Sleek swept high ponytail' },
  { id: 'wavy_locks', label: 'Wavy Locks', desc: 'Romantic flowing waves' },
  { id: 'odango_buns', label: 'Odango Buns', desc: 'Dual buns with flowing ribbons' }
]

const HAIR_COLORS = [
  '#ec4899', // Sakura Pink
  '#f43f5e', // Rose Coral
  '#0284c7', // Sky Blue
  '#06b6d4', // Neon Cyan
  '#7c3aed', // Amethyst Violet
  '#059669', // Emerald Mint
  '#f59e0b', // Golden Blonde
  '#b45309', // Caramel Chestnut
  '#dc2626', // Flame Crimson
  '#475569', // Silver Slate
  '#18181b', // Raven Black
  '#f8fafc'  // Pure Platinum White
]

export const HairPanel: React.FC<HairPanelProps> = ({ config, onChange }) => {
  const updateHair = (key: keyof CharacterConfig['hair'], value: any) => {
    onChange(prev => ({
      ...prev,
      hair: {
        ...prev.hair,
        [key]: value
      }
    }))
  }

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">
      {/* Hairstyle Meshes */}
      <div className="flex flex-col gap-2">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Anime Hairstyle Preset
        </label>
        <div className="grid grid-cols-1 gap-2">
          {HAIRSTYLES.map(h => (
            <button
              key={h.id}
              onClick={() => updateHair('style', h.id)}
              className={`flex items-center justify-between p-2.5 rounded-md border text-left transition-all ${
                config.hair.style === h.id
                  ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:border-[#3D3D45] hover:bg-[#26262E]'
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase">{h.label}</div>
                <div className="text-[10px] text-[#80808F]">{h.desc}</div>
              </div>
              {config.hair.style === h.id && (
                <span className="w-2 h-2 rounded-full bg-[#D32F2F]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hair Base Color */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Hair Base Color
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#80808F]">{config.hair.baseColor}</span>
            <input
              type="color"
              value={config.hair.baseColor}
              onChange={e => updateHair('baseColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {HAIR_COLORS.map(c => (
            <button
              key={c}
              onClick={() => updateHair('baseColor', c)}
              className={`h-7 rounded border transition-transform ${
                config.hair.baseColor === c
                  ? 'ring-2 ring-[#D32F2F] scale-105 border-white'
                  : 'border-[#2D2D35] hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Hair Highlight & Angel's Ring Gloss */}
      <div className="flex flex-col gap-3 pt-2 border-t border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Angel's Ring Sheen Highlight
          </label>
          <input
            type="color"
            value={config.hair.highlightColor}
            onChange={e => updateHair('highlightColor', e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Gloss Intensity</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.hair.glossIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.hair.glossIntensity}
            onChange={e => updateHair('glossIntensity', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Ahoge Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-xs font-bold text-[#E0E0E5]">Ahoge (Rogue Antenna)</div>
            <div className="text-[10px] text-[#80808F]">Classic anime cowlick on crown</div>
          </div>
          <button
            onClick={() => updateHair('hasAhoge', !config.hair.hasAhoge)}
            className={`px-3 py-1 rounded text-xs font-bold uppercase border transition-all ${
              config.hair.hasAhoge
                ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                : 'bg-[#1E1E24] border-[#2D2D35] text-[#80808F]'
            }`}
          >
            {config.hair.hasAhoge ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>
  )
}
