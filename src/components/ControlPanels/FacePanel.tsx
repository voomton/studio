import React from 'react'
import { CharacterConfig, EyeShape, EyebrowStyle, MouthExpression } from '../../types/character'
import { Eye, Smile, Sparkles } from 'lucide-react'

interface FacePanelProps {
  config: CharacterConfig
  onChange: (updater: (prev: CharacterConfig) => CharacterConfig) => void
}

const EYE_SHAPES: { id: EyeShape; label: string; desc: string }[] = [
  { id: 'sparkle_anime', label: 'Sparkle Idol', desc: 'Classic large anime eyes with star glints' },
  { id: 'cat_eye', label: 'Cat Eye', desc: 'Slightly upturned tsundere style' },
  { id: 'tareme_gentle', label: 'Tareme', desc: 'Gentle, soft droopy anime eyes' },
  { id: 'sharp_heroic', label: 'Heroic', desc: 'Focused, sharp determined gaze' },
  { id: 'chibi_cute', label: 'Chibi Sparkle', desc: 'Extra round adorable pupils' },
  { id: 'tsundere', label: 'Tsundere', desc: 'Sharp lash corners with deep contrast' }
]

const MOUTHS: { id: MouthExpression; label: string }[] = [
  { id: 'smile', label: 'Smile' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'smirk', label: 'Smirk' },
  { id: 'pout', label: 'Pout' },
  { id: 'cat_mouth', label: 'Cat :3' },
  { id: 'open_talk', label: 'Open' },
  { id: 'shocked', label: 'Gasp' }
]

const BROWS: { id: EyebrowStyle; label: string }[] = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'arched', label: 'Arched' },
  { id: 'sharp', label: 'Sharp' },
  { id: 'confident', label: 'Confident' },
  { id: 'worried', label: 'Worried' },
  { id: 'straight', label: 'Straight' }
]

const EYE_COLORS = [
  '#0284c7', // Sky Blue
  '#2563eb', // Royal Blue
  '#7c3aed', // Amethyst Violet
  '#c026d3', // Magenta
  '#059669', // Emerald Green
  '#10b981', // Jade Mint
  '#dc2626', // Ruby Crimson
  '#ea580c', // Fiery Amber
  '#eab308', // Gold
  '#1e293b', // Deep Slate
  '#09090b'  // Obsidian Black
]

export const FacePanel: React.FC<FacePanelProps> = ({ config, onChange }) => {
  const updateFace = (key: keyof CharacterConfig['face'], value: any) => {
    onChange(prev => ({
      ...prev,
      face: {
        ...prev.face,
        [key]: value
      }
    }))
  }

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">
      {/* Eye Shape Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Eye Archetype & Shape
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EYE_SHAPES.map(s => (
            <button
              key={s.id}
              onClick={() => updateFace('eyeShape', s.id)}
              className={`flex flex-col p-2.5 rounded-md border text-left transition-all ${
                config.face.eyeShape === s.id
                  ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:border-[#3D3D45] hover:bg-[#26262E]'
              }`}
            >
              <span className="text-xs font-bold uppercase">{s.label}</span>
              <span className="text-[9.5px] text-[#80808F] leading-tight mt-0.5">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Eye Color Swatches */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Iris Color Palette
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#80808F]">{config.face.eyeColor}</span>
            <input
              type="color"
              value={config.face.eyeColor}
              onChange={e => updateFace('eyeColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {EYE_COLORS.map(c => (
            <button
              key={c}
              onClick={() => {
                updateFace('eyeColor', c)
                updateFace('eyeSecondaryColor', c)
              }}
              className={`h-7 rounded border transition-transform ${
                config.face.eyeColor === c
                  ? 'ring-2 ring-[#D32F2F] scale-105 border-white'
                  : 'border-[#2D2D35] hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Eye Proportions */}
      <div className="flex flex-col gap-3 pt-2 border-t border-[#2D2D35]">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Eye Size & Position
        </label>

        {/* Eye Size */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Eye Scale</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.face.eyeSize * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.25"
            step="0.02"
            value={config.face.eyeSize}
            onChange={e => updateFace('eyeSize', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Eye Spacing */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Inter-Eye Spacing</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.face.eyeSpacing * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.9"
            max="1.15"
            step="0.01"
            value={config.face.eyeSpacing}
            onChange={e => updateFace('eyeSpacing', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>
      </div>

      {/* Mouth Expressions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#2D2D35]">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Mouth & Facial Expression
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {MOUTHS.map(m => (
            <button
              key={m.id}
              onClick={() => updateFace('mouthExpression', m.id)}
              className={`py-2 px-2 text-center rounded-md border text-xs font-bold uppercase transition-all ${
                config.face.mouthExpression === m.id
                  ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Eyebrows Style & Arch */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#2D2D35]">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Eyebrows
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {BROWS.map(b => (
            <button
              key={b.id}
              onClick={() => updateFace('eyebrowStyle', b.id)}
              className={`py-1.5 px-2 text-center rounded-md border text-[11px] font-bold uppercase transition-all ${
                config.face.eyebrowStyle === b.id
                  ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Eyebrow Angle Slider */}
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Eyebrow Slant</span>
            <span className="font-mono text-[#80808F]">{config.face.eyebrowAngle}°</span>
          </div>
          <input
            type="range"
            min="-15"
            max="15"
            step="1"
            value={config.face.eyebrowAngle}
            onChange={e => updateFace('eyebrowAngle', parseInt(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>
      </div>

      {/* Blush & Ears */}
      <div className="flex flex-col gap-3 pt-2 border-t border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Anime Cheek Blush
          </label>
          <input
            type="color"
            value={config.face.blushColor}
            onChange={e => updateFace('blushColor', e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Blush Opacity</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.face.blushIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.face.blushIntensity}
            onChange={e => updateFace('blushIntensity', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Elf Ear Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-[#E0E0E5]">Ear Style</span>
          <button
            onClick={() => updateFace('earStyle', config.face.earStyle === 'elf' ? 'human' : 'elf')}
            className={`px-3 py-1 rounded text-xs font-bold uppercase border transition-all ${
              config.face.earStyle === 'elf'
                ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                : 'bg-[#1E1E24] border-[#2D2D35] text-[#80808F]'
            }`}
          >
            {config.face.earStyle === 'elf' ? 'Elf Ears' : 'Human Ears'}
          </button>
        </div>
      </div>
    </div>
  )
}
