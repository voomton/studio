import React from 'react'
import { CharacterConfig, BodyBuild, Gender } from '../../types/character'
import { User, Sparkles, Sliders } from 'lucide-react'

interface BodyPanelProps {
  config: CharacterConfig
  onChange: (updater: (prev: CharacterConfig) => CharacterConfig) => void
}

const SKIN_SWATCHES = [
  { name: 'Porcelain', color: '#ffedd5' },
  { name: 'Peach', color: '#fed7aa' },
  { name: 'Warm Cream', color: '#fde047' },
  { name: 'Sun Tan', color: '#fcd34d' },
  { name: 'Warm Amber', color: '#fbb086' },
  { name: 'Bronze', color: '#e0a96d' },
  { name: 'Deep Caramel', color: '#8d5b4c' },
  { name: 'Demon Lilac', color: '#e9d5ff' },
  { name: 'Elf Pale', color: '#ccfbf1' }
]

const BUILDS: { id: BodyBuild; label: string; desc: string }[] = [
  { id: 'slim', label: 'Slim', desc: 'Slender anime silhouette' },
  { id: 'average', label: 'Average', desc: 'Balanced classic anime proportions' },
  { id: 'athletic', label: 'Athletic', desc: 'Broad shoulders & toned build' },
  { id: 'curvy', label: 'Curvy', desc: 'Pronounced hips & bust' },
  { id: 'chibi', label: 'Chibi', desc: 'Cute compact stylized avatar' }
]

export const BodyPanel: React.FC<BodyPanelProps> = ({ config, onChange }) => {
  const updateBody = (key: keyof CharacterConfig['body'], value: any) => {
    onChange(prev => ({
      ...prev,
      body: {
        ...prev.body,
        [key]: value
      }
    }))
  }

  const setGender = (gender: Gender) => {
    onChange(prev => ({
      ...prev,
      gender,
      body: {
        ...prev.body,
        chestSize: gender === 'male' ? 0.7 : 1.0,
        shoulderWidth: gender === 'male' ? 1.15 : 1.0
      }
    }))
  }

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">
      {/* Base Identity & Gender */}
      <div className="flex flex-col gap-2">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Character Base
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setGender('female')}
            className={`py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${
              config.gender === 'female'
                ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-md'
                : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
            }`}
          >
            Female
          </button>
          <button
            onClick={() => setGender('male')}
            className={`py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${
              config.gender === 'male'
                ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-md'
                : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
            }`}
          >
            Male
          </button>
        </div>
      </div>

      {/* Body Build Type */}
      <div className="flex flex-col gap-2">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Body Archetype / Build
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {BUILDS.map(b => (
            <button
              key={b.id}
              onClick={() => updateBody('build', b.id)}
              className={`flex items-center justify-between p-2.5 rounded-md border text-left transition-all ${
                config.body.build === b.id
                  ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:border-[#3D3D45] hover:bg-[#26262E]'
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase">{b.label}</div>
                <div className="text-[10px] text-[#80808F]">{b.desc}</div>
              </div>
              {config.body.build === b.id && (
                <span className="w-2 h-2 rounded-full bg-[#D32F2F]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Tone Selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Skin Tone
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#80808F]">{config.body.skinTone}</span>
            <input
              type="color"
              value={config.body.skinTone}
              onChange={e => updateBody('skinTone', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {SKIN_SWATCHES.map(s => (
            <button
              key={s.color}
              onClick={() => updateBody('skinTone', s.color)}
              title={s.name}
              className={`h-7 rounded border transition-transform ${
                config.body.skinTone === s.color
                  ? 'ring-2 ring-[#D32F2F] scale-105 border-white'
                  : 'border-[#2D2D35] hover:scale-105'
              }`}
              style={{ backgroundColor: s.color }}
            />
          ))}
        </div>
      </div>

      {/* Anatomical Proportions Sliders */}
      <div className="flex flex-col gap-3 pt-2 border-t border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Detailed Proportions
          </label>
          <Sliders className="w-3.5 h-3.5 text-[#80808F]" />
        </div>

        {/* Height */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Height Scale</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.body.height * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.25"
            step="0.02"
            value={config.body.height}
            onChange={e => updateBody('height', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Shoulder Width */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Shoulder Width</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.body.shoulderWidth * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.02"
            value={config.body.shoulderWidth}
            onChange={e => updateBody('shoulderWidth', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Chest / Bust Size */}
        {config.gender === 'female' && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#B0B0BF]">Bust Proportions</span>
              <span className="font-mono text-[#80808F]">{Math.round(config.body.chestSize * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.6"
              step="0.05"
              value={config.body.chestSize}
              onChange={e => updateBody('chestSize', parseFloat(e.target.value))}
              className="w-full accent-[#D32F2F] cursor-pointer"
            />
          </div>
        )}

        {/* Waist Scale */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Waist Taper</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.body.waistScale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.02"
            value={config.body.waistScale}
            onChange={e => updateBody('waistScale', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Hip Scale */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Hip Width</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.body.hipScale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.35"
            step="0.02"
            value={config.body.hipScale}
            onChange={e => updateBody('hipScale', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Limb Thickness */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Limb Thickness</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.body.limbThickness * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.25"
            step="0.02"
            value={config.body.limbThickness}
            onChange={e => updateBody('limbThickness', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Head Scale */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Head Proportion</span>
            <span className="font-mono text-[#80808F]">{Math.round(config.body.headScale * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.85"
            max="1.2"
            step="0.02"
            value={config.body.headScale}
            onChange={e => updateBody('headScale', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
