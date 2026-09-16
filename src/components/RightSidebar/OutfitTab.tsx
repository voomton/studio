import React from 'react'
import { CharacterMaterials, DEFAULT_MATERIALS } from '../../utils/vrmManager'
import { Shirt, ShieldCheck, Sparkles, Layers, Palette, Eye } from 'lucide-react'

interface OutfitTabProps {
  materials?: CharacterMaterials
  onChange: (materials: CharacterMaterials) => void
}

export const OutfitTab: React.FC<OutfitTabProps> = ({ materials, onChange }) => {
  const currentMaterials: CharacterMaterials = { ...DEFAULT_MATERIALS, ...(materials || {}) }

  const updateMat = (key: keyof CharacterMaterials, value: any) => {
    onChange({
      ...currentMaterials,
      [key]: value
    })
  }

  const shadingModes: Array<{ id: 'toon' | 'matte' | 'glossy' | 'pbr'; label: string; desc: string }> = [
    { id: 'toon', label: 'Anime Cel-Shaded (MToon)', desc: 'Crisp manga stylization with light bands' },
    { id: 'matte', label: 'Matte Studio', desc: 'Soft non-reflective studio shading' },
    { id: 'glossy', label: 'Glossy / Satin', desc: 'Silky fabric with specular sheen' },
    { id: 'pbr', label: 'PBR Standard', desc: 'Physically balanced realistic rendering' }
  ]

  const skinPresets = [
    { name: 'Fair Anime', color: '#FFE4D6' },
    { name: 'Warm Peach', color: '#FBD3BD' },
    { name: 'Golden Sun', color: '#E8B28B' },
    { name: 'Tanned Bronze', color: '#C68852' },
    { name: 'Deep Mocha', color: '#6A4126' },
    { name: 'Porcelain White', color: '#FFF5F0' }
  ]

  const outfitTintPresets = [
    { name: 'Pure Original', color: '#FFFFFF' },
    { name: 'Crimson Scarlet', color: '#E53935' },
    { name: 'Midnight Navy', color: '#1E3A8A' },
    { name: 'Emerald Jade', color: '#059669' },
    { name: 'Royal Purple', color: '#7C3AED' },
    { name: 'Obsidian Black', color: '#1F2937' },
    { name: 'Sakura Rose', color: '#F472B6' },
    { name: 'Amber Gold', color: '#D97706' }
  ]

  const outfitStyles = [
    { id: 'default', name: 'Original VRM Mesh', desc: 'Preserves authored 3D clothing geometry' },
    { id: 'uniform', name: 'Academy Uniform', desc: 'Classic pleated sailor / blazer silhouette' },
    { id: 'mage', name: 'Mage Vestments', desc: 'Fantasy spellcaster embroidered robe style' },
    { id: 'cyber', name: 'Cyber Streetwear', desc: 'Futuristic techwear layered aesthetic' },
    { id: 'idol', name: 'Pop Idol Dress', desc: 'Stage concert ruffled performance outfit' },
    { id: 'casual', name: 'Urban Casual', desc: 'Modern oversized jacket & streetwear' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Outfit & Skin Shading
        </h3>
        <p className="text-[10px] text-[#707080]">
          Skin tones, fabric tints, surface shaders & modest mesh coverage
        </p>
      </div>

      {/* Skin Tone Palette */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold text-[#D0D0E0]">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#D32F2F]" />
            <span>Character Skin Tone</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#A0A0B0]">{currentMaterials.skinTone}</span>
            <input
              type="color"
              value={currentMaterials.skinTone}
              onChange={e => updateMat('skinTone', e.target.value)}
              className="w-6 h-6 rounded border border-[#2B2B38] bg-transparent cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {skinPresets.map(preset => (
            <button
              key={preset.name}
              onClick={() => updateMat('skinTone', preset.color)}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                currentMaterials.skinTone.toLowerCase() === preset.color.toLowerCase()
                  ? 'bg-[#1E1E2A] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
              }`}
            >
              <span 
                className="w-3 h-3 rounded-full shrink-0 border border-white/20" 
                style={{ backgroundColor: preset.color }}
              />
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Outfit Fabric Tint */}
      <div className="space-y-2.5 pt-2 border-t border-[#22222E]">
        <div className="flex justify-between items-center text-xs font-bold text-[#D0D0E0]">
          <span className="flex items-center gap-1.5">
            <Shirt className="w-3.5 h-3.5 text-[#D32F2F]" />
            <span>Clothing Fabric Color Tint</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#A0A0B0]">{currentMaterials.outfitTint}</span>
            <input
              type="color"
              value={currentMaterials.outfitTint}
              onChange={e => updateMat('outfitTint', e.target.value)}
              className="w-6 h-6 rounded border border-[#2B2B38] bg-transparent cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {outfitTintPresets.map(preset => (
            <button
              key={preset.name}
              onClick={() => updateMat('outfitTint', preset.color)}
              title={preset.name}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                currentMaterials.outfitTint.toLowerCase() === preset.color.toLowerCase()
                  ? 'bg-[#1E1E2A] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
              }`}
            >
              <span 
                className="w-3 h-3 rounded-full shrink-0 border border-white/20" 
                style={{ backgroundColor: preset.color }}
              />
              <span className="truncate">{preset.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Outfit Style Options */}
      <div className="space-y-2.5 pt-2 border-t border-[#22222E]">
        <div className="text-xs font-bold text-[#D0D0E0]">
          Outfit Style Preset
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {outfitStyles.map(style => (
            <button
              key={style.id}
              onClick={() => updateMat('outfitStyle', style.id)}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                (currentMaterials.outfitStyle || 'default') === style.id
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

      {/* Shading Style Select */}
      <div className="space-y-2.5 pt-2 border-t border-[#22222E]">
        <div className="text-xs font-bold text-[#D0D0E0]">
          Shader Shading Model
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shadingModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => updateMat('shadingMode', mode.id)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                currentMaterials.shadingMode === mode.id
                  ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white shadow-md'
                  : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
              }`}
            >
              <div className="text-xs font-bold">{mode.label}</div>
              <div className="text-[9px] text-[#707080] mt-0.5 leading-tight">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mesh Rigging & Double-Side Coverage */}
      <div className="p-3 bg-[#14141C] border border-[#22222E] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00E676]" />
            <div>
              <div className="text-xs font-bold text-white">Opaque Modest Coverage</div>
              <div className="text-[10px] text-[#707080]">Enforces double-sided clothing rendering</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={currentMaterials.doubleSidedOpaque}
            onChange={e => updateMat('doubleSidedOpaque', e.target.checked)}
            className="w-4 h-4 accent-[#D32F2F] cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
