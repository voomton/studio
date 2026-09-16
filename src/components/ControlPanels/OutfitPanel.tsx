import React from 'react'
import { CharacterConfig, OutfitId, FootwearId, SocksStyle } from '../../types/character'
import { Shirt, Sparkles } from 'lucide-react'

interface OutfitPanelProps {
  config: CharacterConfig
  onChange: (updater: (prev: CharacterConfig) => CharacterConfig) => void
}

const OUTFITS: { id: OutfitId; label: string; desc: string }[] = [
  { id: 'school_sailor', label: 'Sailor Uniform', desc: 'Classic anime sailor fuku with tie & pleated skirt' },
  { id: 'casual_hoodie', label: 'Casual Hoodie', desc: 'Comfy streetwear oversized hoodie & shorts' },
  { id: 'fantasy_robe', label: 'Fantasy Adventurer', desc: 'Layered battle tunic with gold pauldrons & boots' },
  { id: 'gothic_lolita', label: 'Gothic Lolita', desc: 'Corset bodice, frilled tiered dress & puffy sleeves' },
  { id: 'summer_yukata', label: 'Summer Yukata', desc: 'Traditional crossover wrap kimono robe & wide obi sash' },
  { id: 'cyber_techwear', label: 'Cyber Techwear', desc: 'Futuristic cropped tech jacket & glowing neon trim' }
]

const FOOTWEAR: { id: FootwearId; label: string }[] = [
  { id: 'loafers', label: 'Loafers' },
  { id: 'sneakers', label: 'Sneakers' },
  { id: 'boots', label: 'Boots' },
  { id: 'mary_janes', label: 'Mary Janes' },
  { id: 'geta', label: 'Geta' }
]

const SOCKS: { id: SocksStyle; label: string }[] = [
  { id: 'knee_high', label: 'Knee-High' },
  { id: 'thigh_high', label: 'Thigh-High' },
  { id: 'ankle', label: 'Ankle' },
  { id: 'bare', label: 'Bare Leg' }
]

export const OutfitPanel: React.FC<OutfitPanelProps> = ({ config, onChange }) => {
  const updateOutfit = (key: keyof CharacterConfig['outfit'], value: any) => {
    onChange(prev => ({
      ...prev,
      outfit: {
        ...prev.outfit,
        [key]: value
      }
    }))
  }

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">
      {/* Outfit Styles */}
      <div className="flex flex-col gap-2">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Anime Costume & Wardrobe
        </label>
        <div className="grid grid-cols-1 gap-2">
          {OUTFITS.map(o => (
            <button
              key={o.id}
              onClick={() => updateOutfit('style', o.id)}
              className={`flex items-center justify-between p-2.5 rounded-md border text-left transition-all ${
                config.outfit.style === o.id
                  ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:border-[#3D3D45] hover:bg-[#26262E]'
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase">{o.label}</div>
                <div className="text-[10px] text-[#80808F]">{o.desc}</div>
              </div>
              {config.outfit.style === o.id && (
                <span className="w-2 h-2 rounded-full bg-[#D32F2F]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Outfit Color Palette */}
      <div className="flex flex-col gap-3 pt-2 border-t border-[#2D2D35]">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Costume Color Palette
        </label>

        {/* Primary Color */}
        <div className="flex items-center justify-between p-2 rounded bg-[#1E1E24] border border-[#2D2D35]">
          <span className="text-xs text-[#E0E0E5]">Primary Fabric</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#80808F]">{config.outfit.primaryColor}</span>
            <input
              type="color"
              value={config.outfit.primaryColor}
              onChange={e => updateOutfit('primaryColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div className="flex items-center justify-between p-2 rounded bg-[#1E1E24] border border-[#2D2D35]">
          <span className="text-xs text-[#E0E0E5]">Secondary / Skirt</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#80808F]">{config.outfit.secondaryColor}</span>
            <input
              type="color"
              value={config.outfit.secondaryColor}
              onChange={e => updateOutfit('secondaryColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>

        {/* Trim & Accent Color */}
        <div className="flex items-center justify-between p-2 rounded bg-[#1E1E24] border border-[#2D2D35]">
          <span className="text-xs text-[#E0E0E5]">Trim & Ribbons</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#80808F]">{config.outfit.trimColor}</span>
            <input
              type="color"
              value={config.outfit.trimColor}
              onChange={e => updateOutfit('trimColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Footwear & Legwear */}
      <div className="flex flex-col gap-3 pt-2 border-t border-[#2D2D35]">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Footwear & Shoes
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {FOOTWEAR.map(f => (
            <button
              key={f.id}
              onClick={() => updateOutfit('footwear', f.id)}
              className={`py-1.5 px-2 text-center rounded-md border text-[11px] font-bold uppercase transition-all ${
                config.outfit.footwear === f.id
                  ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Shoe Color */}
        <div className="flex items-center justify-between p-2 rounded bg-[#1E1E24] border border-[#2D2D35]">
          <span className="text-xs text-[#E0E0E5]">Shoe Leather Color</span>
          <input
            type="color"
            value={config.outfit.shoeColor}
            onChange={e => updateOutfit('shoeColor', e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>

        {/* Socks Style */}
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F] mt-1">
          Hosiery / Socks
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SOCKS.map(s => (
            <button
              key={s.id}
              onClick={() => updateOutfit('socksStyle', s.id)}
              className={`py-1.5 px-2 text-center rounded-md border text-[11px] font-bold uppercase transition-all ${
                config.outfit.socksStyle === s.id
                  ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
