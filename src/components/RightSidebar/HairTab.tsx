import React from 'react'
import { CharacterMaterials, DEFAULT_MATERIALS } from '../../utils/vrmManager'
import { Sparkles, Palette, Scissors } from 'lucide-react'

interface HairTabProps {
  materials?: CharacterMaterials
  onChange: (materials: CharacterMaterials) => void
}

export const HairTab: React.FC<HairTabProps> = ({ materials, onChange }) => {
  const currentMaterials: CharacterMaterials = { ...DEFAULT_MATERIALS, ...(materials || {}) }

  const updateMat = (key: keyof CharacterMaterials, value: any) => {
    onChange({
      ...currentMaterials,
      [key]: value
    })
  }

  const hairColorPresets = [
    { name: 'Raven Black', color: '#18181B' },
    { name: 'Espresso Brown', color: '#4A2810' },
    { name: 'Golden Blonde', color: '#EAB308' },
    { name: 'Crimson Scarlet', color: '#DC2626' },
    { name: 'Sakura Pink', color: '#F472B6' },
    { name: 'Silver White', color: '#E2E8F0' },
    { name: 'Cyber Cyan', color: '#06B6D4' },
    { name: 'Mystic Indigo', color: '#6366F1' }
  ]

  const hairStyles = [
    { id: 'default', name: 'Original VRM Hair', desc: 'Preserves authored hair mesh strands' },
    { id: 'ponytail', name: 'High Ponytail', desc: 'Sleek anime ponytail with side bangs' },
    { id: 'twintail', name: 'Anime Twin Tails', desc: 'Dual pigtails with cute ribbon ties' },
    { id: 'bob', name: 'Short Bob Cut', desc: 'Clean modern chin-length bob' },
    { id: 'long', name: 'Long Flowing', desc: 'Waist-length cascading anime locks' },
    { id: 'spiky', name: 'Spiky Shonen', desc: 'Dynamic energetic stylized spikes' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Hair Styling & Colors
        </h3>
        <p className="text-[10px] text-[#707080]">
          Anime hair tints, highlights, glossiness, and styling presets
        </p>
      </div>

      {/* Hair Base Color */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold text-[#D0D0E0]">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#D32F2F]" />
            <span>Base Hair Color</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#A0A0B0]">{currentMaterials.hairColor}</span>
            <input
              type="color"
              value={currentMaterials.hairColor}
              onChange={e => updateMat('hairColor', e.target.value)}
              className="w-6 h-6 rounded border border-[#2B2B38] bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Color Swatches */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {hairColorPresets.map(preset => (
            <button
              key={preset.name}
              onClick={() => updateMat('hairColor', preset.color)}
              title={preset.name}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                currentMaterials.hairColor.toLowerCase() === preset.color.toLowerCase()
                  ? 'bg-[#1E1E2A] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
              }`}
            >
              <span 
                className="w-3 h-3 rounded-full shrink-0 border border-white/20" 
                style={{ backgroundColor: preset.color }}
              />
              <span className="truncate">{preset.name.split(' ')[1] || preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Highlight Color */}
      <div className="space-y-2.5 pt-2 border-t border-[#22222E]">
        <div className="flex justify-between items-center text-xs font-bold text-[#D0D0E0]">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D32F2F]" />
            <span>Anime Specular Highlight Tint</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#A0A0B0]">{currentMaterials.hairHighlight}</span>
            <input
              type="color"
              value={currentMaterials.hairHighlight}
              onChange={e => updateMat('hairHighlight', e.target.value)}
              className="w-6 h-6 rounded border border-[#2B2B38] bg-transparent cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Hairstyle Presets */}
      <div className="space-y-2.5 pt-2 border-t border-[#22222E]">
        <div className="text-xs font-bold text-[#D0D0E0]">
          Hairstyle Preset
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {hairStyles.map(style => (
            <button
              key={style.id}
              onClick={() => updateMat('hairStyle', style.id)}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                (currentMaterials.hairStyle || 'default') === style.id
                  ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
              }`}
            >
              <div className="text-xs font-bold text-white">{style.name}</div>
              <div className="text-[9px] text-[#707080] leading-tight mt-0.5 line-clamp-1">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hair Gloss / Roughness */}
      <div className="space-y-4 pt-2 border-t border-[#22222E]">
        <div>
          <div className="flex justify-between text-xs font-bold text-[#D0D0E0] mb-1.5">
            <span>Hair Sheen & Smoothness</span>
            <span className="text-[#D32F2F] font-mono">
              {Math.round((1 - currentMaterials.hairRoughness) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.95"
            step="0.01"
            value={currentMaterials.hairRoughness}
            onChange={e => updateMat('hairRoughness', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-[#D0D0E0] mb-1.5">
            <span>Metallic / Silky Reflection</span>
            <span className="text-[#D32F2F] font-mono">
              {Math.round(currentMaterials.hairMetalness * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.01"
            value={currentMaterials.hairMetalness}
            onChange={e => updateMat('hairMetalness', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
          />
        </div>
      </div>
    </div>
  )
}
