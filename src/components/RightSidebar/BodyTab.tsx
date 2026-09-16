import React, { useState } from 'react'
import { CharacterProportions, DEFAULT_PROPORTIONS } from '../../utils/vrmManager'
import { 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Palette, 
  User, 
  Sliders, 
  Check, 
  Flame,
  Shield
} from 'lucide-react'

interface BodyTabProps {
  proportions: CharacterProportions
  skinTint?: string
  onChange: (proportions: CharacterProportions) => void
  onSkinTintChange?: (color: string) => void
}

export const BodyTab: React.FC<BodyTabProps> = ({ 
  proportions, 
  skinTint = '#ffffff', 
  onChange,
  onSkinTintChange 
}) => {
  // Accordion Section States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    presets: true,
    skin: true,
    details: false,
    muscle: false,
    tattoos: false
  })

  // Active Body Shape Preset
  const [activeShapePreset, setActiveShapePreset] = useState<string>('Standard Anime')
  const [muscleTone, setMuscleTone] = useState<number>(35)
  const [selectedMark, setSelectedMark] = useState<string>('none')

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const updateProp = (key: keyof CharacterProportions, value: number) => {
    onChange({
      ...proportions,
      [key]: value
    })
  }

  const handleReset = () => {
    onChange({ ...DEFAULT_PROPORTIONS })
    setActiveShapePreset('Standard Anime')
  }

  // Body Shape Presets
  const bodyShapePresets = [
    {
      id: 'standard',
      name: 'Standard Anime',
      proportions: { height: 1.0, headScale: 1.0, shoulderWidth: 1.0, chestScale: 1.0, waistScale: 1.0, hipScale: 1.0, armLength: 1.0, legLength: 1.0 }
    },
    {
      id: 'slim',
      name: 'Slender / Petite',
      proportions: { height: 0.95, headScale: 1.05, shoulderWidth: 0.88, chestScale: 0.85, waistScale: 0.82, hipScale: 0.9, armLength: 0.98, legLength: 1.02 }
    },
    {
      id: 'athletic',
      name: 'Athletic Fighter',
      proportions: { height: 1.06, headScale: 0.95, shoulderWidth: 1.15, chestScale: 1.12, waistScale: 0.95, hipScale: 1.02, armLength: 1.02, legLength: 1.05 }
    },
    {
      id: 'heroic',
      name: 'Heroic Knight',
      proportions: { height: 1.12, headScale: 0.92, shoulderWidth: 1.25, chestScale: 1.25, waistScale: 1.05, hipScale: 1.08, armLength: 1.05, legLength: 1.08 }
    },
    {
      id: 'chibi',
      name: 'Cute Chibi',
      proportions: { height: 0.82, headScale: 1.35, shoulderWidth: 0.82, chestScale: 0.8, waistScale: 0.88, hipScale: 0.85, armLength: 0.85, legLength: 0.85 }
    }
  ]

  // Skin Tone Swatches
  const skinTones = [
    { name: 'Fair Porcelain', color: '#FFF3EB' },
    { name: 'Anime Peach', color: '#FFE6D5' },
    { name: 'Natural Warm', color: '#FAD8C3' },
    { name: 'Golden Sun', color: '#E8BF9E' },
    { name: 'Warm Tan', color: '#D2A17E' },
    { name: 'Deep Bronze', color: '#8D5B3A' },
    { name: 'Dark Ebony', color: '#4A2F21' },
    { name: 'Mystic Lilac', color: '#E2D9F3' }
  ]

  // Anime Tattoos / Marks
  const tattooMarks = [
    { id: 'none', label: 'None' },
    { id: 'arcane_rune', label: 'Arcane Crest' },
    { id: 'dragon_mark', label: 'Dragon Sigil' },
    { id: 'cyber_line', label: 'Cyber Circuit' },
    { id: 'cheek_stars', label: 'Cheek Star' },
    { id: 'forehead_gem', label: 'Forehead Gem' }
  ]

  return (
    <div id="character-body-panel" className="space-y-5 text-[#F8F8FC]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#2E2548]">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8F8FC]">
            Body Settings
          </h3>
          <p className="text-[10px] text-[#A09BB5]">
            Parametric anatomical scaling
          </p>
        </div>
        <button
          onClick={handleReset}
          id="btn-reset-proportions"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#271F3D] hover:bg-[#32284F] text-[#A09BB5] hover:text-[#F8F8FC] text-[10px] font-bold border border-[#2E2548] transition-all cursor-pointer"
        >
          <RefreshCw className="w-2.5 h-2.5 text-[#EC4899]" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Sliders with Value Boxes */}
      <div className="space-y-3.5 bg-[#191426] p-3 rounded-xl border border-[#2E2548]">
        {/* Height */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-[#F8F8FC] mb-1.5">
            <span className="font-semibold">Height</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.70"
                max="1.35"
                step="0.01"
                value={proportions.height}
                onChange={e => updateProp('height', parseFloat(e.target.value) || 1)}
                className="w-14 px-1.5 py-0.5 bg-[#271F3D] border border-[#3E325E] focus:border-[#EC4899] rounded text-[11px] font-mono text-right text-[#F8F8FC] focus:outline-none"
              />
              <span className="text-[10px] text-[#8A81A6] font-mono">x</span>
            </div>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.30"
            step="0.01"
            value={proportions.height}
            onChange={e => updateProp('height', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#271F3D] rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
          />
        </div>

        {/* Head Scale */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-[#F8F8FC] mb-1.5">
            <span className="font-semibold">Head Scale</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.70"
                max="1.40"
                step="0.01"
                value={proportions.headScale}
                onChange={e => updateProp('headScale', parseFloat(e.target.value) || 1)}
                className="w-14 px-1.5 py-0.5 bg-[#271F3D] border border-[#3E325E] focus:border-[#EC4899] rounded text-[11px] font-mono text-right text-[#F8F8FC] focus:outline-none"
              />
              <span className="text-[10px] text-[#8A81A6] font-mono">x</span>
            </div>
          </div>
          <input
            type="range"
            min="0.80"
            max="1.35"
            step="0.01"
            value={proportions.headScale}
            onChange={e => updateProp('headScale', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#271F3D] rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
          />
        </div>

        {/* Shoulder Width */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-[#F8F8FC] mb-1.5">
            <span className="font-semibold">Shoulder Width</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.70"
                max="1.40"
                step="0.01"
                value={proportions.shoulderWidth}
                onChange={e => updateProp('shoulderWidth', parseFloat(e.target.value) || 1)}
                className="w-14 px-1.5 py-0.5 bg-[#271F3D] border border-[#3E325E] focus:border-[#EC4899] rounded text-[11px] font-mono text-right text-[#F8F8FC] focus:outline-none"
              />
              <span className="text-[10px] text-[#8A81A6] font-mono">x</span>
            </div>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.35"
            step="0.01"
            value={proportions.shoulderWidth}
            onChange={e => updateProp('shoulderWidth', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#271F3D] rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
          />
        </div>

        {/* Chest Build */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-[#F8F8FC] mb-1.5">
            <span className="font-semibold">Chest Build</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.60"
                max="1.45"
                step="0.01"
                value={proportions.chestScale}
                onChange={e => updateProp('chestScale', parseFloat(e.target.value) || 1)}
                className="w-14 px-1.5 py-0.5 bg-[#271F3D] border border-[#3E325E] focus:border-[#EC4899] rounded text-[11px] font-mono text-right text-[#F8F8FC] focus:outline-none"
              />
              <span className="text-[10px] text-[#8A81A6] font-mono">x</span>
            </div>
          </div>
          <input
            type="range"
            min="0.65"
            max="1.40"
            step="0.01"
            value={proportions.chestScale}
            onChange={e => updateProp('chestScale', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#271F3D] rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
          />
        </div>

        {/* Waist */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-[#F8F8FC] mb-1.5">
            <span className="font-semibold">Waist</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.65"
                max="1.40"
                step="0.01"
                value={proportions.waistScale}
                onChange={e => updateProp('waistScale', parseFloat(e.target.value) || 1)}
                className="w-14 px-1.5 py-0.5 bg-[#271F3D] border border-[#3E325E] focus:border-[#EC4899] rounded text-[11px] font-mono text-right text-[#F8F8FC] focus:outline-none"
              />
              <span className="text-[10px] text-[#8A81A6] font-mono">x</span>
            </div>
          </div>
          <input
            type="range"
            min="0.70"
            max="1.35"
            step="0.01"
            value={proportions.waistScale}
            onChange={e => updateProp('waistScale', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#271F3D] rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
          />
        </div>

        {/* Hip Width */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-[#F8F8FC] mb-1.5">
            <span className="font-semibold">Hip Width</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0.65"
                max="1.40"
                step="0.01"
                value={proportions.hipScale}
                onChange={e => updateProp('hipScale', parseFloat(e.target.value) || 1)}
                className="w-14 px-1.5 py-0.5 bg-[#271F3D] border border-[#3E325E] focus:border-[#EC4899] rounded text-[11px] font-mono text-right text-[#F8F8FC] focus:outline-none"
              />
              <span className="text-[10px] text-[#8A81A6] font-mono">x</span>
            </div>
          </div>
          <input
            type="range"
            min="0.70"
            max="1.35"
            step="0.01"
            value={proportions.hipScale}
            onChange={e => updateProp('hipScale', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#271F3D] rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
          />
        </div>
      </div>

      {/* Expandable Section: Body Shape Presets */}
      <div className="border border-[#2E2548] rounded-xl overflow-hidden bg-[#1A1429]">
        <button
          onClick={() => toggleSection('presets')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#F8F8FC] hover:bg-[#231C36] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>Body Shape Presets</span>
          </div>
          {openSections.presets ? <ChevronDown className="w-4 h-4 text-[#8A81A6]" /> : <ChevronRight className="w-4 h-4 text-[#8A81A6]" />}
        </button>

        {openSections.presets && (
          <div className="p-3 border-t border-[#2E2548] space-y-1.5 bg-[#16121E]">
            {bodyShapePresets.map(preset => {
              const isSelected = activeShapePreset === preset.name
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setActiveShapePreset(preset.name)
                    onChange({ ...DEFAULT_PROPORTIONS, ...preset.proportions })
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#271F3D] text-[#EC4899] border border-[#EC4899]/50 shadow-sm'
                      : 'bg-[#191426] text-[#A09BB5] hover:text-white hover:bg-[#201A30] border border-transparent'
                  }`}
                >
                  <span>{preset.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#EC4899]" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Expandable Section: Skin Tone */}
      <div className="border border-[#2E2548] rounded-xl overflow-hidden bg-[#1A1429]">
        <button
          onClick={() => toggleSection('skin')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#F8F8FC] hover:bg-[#231C36] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Skin Tone</span>
          </div>
          {openSections.skin ? <ChevronDown className="w-4 h-4 text-[#8A81A6]" /> : <ChevronRight className="w-4 h-4 text-[#8A81A6]" />}
        </button>

        {openSections.skin && (
          <div className="p-3 border-t border-[#2E2548] space-y-3 bg-[#16121E]">
            <div className="grid grid-cols-4 gap-2">
              {skinTones.map(tone => {
                const isSelected = skinTint?.toLowerCase() === tone.color.toLowerCase()
                return (
                  <button
                    key={tone.name}
                    onClick={() => onSkinTintChange?.(tone.color)}
                    className={`group flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#271F3D] border-[#EC4899] shadow-sm ring-1 ring-[#EC4899]'
                        : 'bg-[#191426] border-[#2E2548] hover:border-[#3E325E]'
                    }`}
                    title={tone.name}
                  >
                    <div 
                      className="w-7 h-7 rounded-full border border-black/30 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: tone.color }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                    </div>
                    <span className="text-[9px] text-[#8A81A6] group-hover:text-white truncate w-full text-center mt-1">
                      {tone.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center justify-between pt-1 border-t border-[#2E2548]">
              <span className="text-[11px] text-[#A09BB5]">Custom Tone</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={skinTint}
                  onChange={e => onSkinTintChange?.(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[10px] font-mono text-[#8A81A6] uppercase">{skinTint}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Section: Body Details */}
      <div className="border border-[#2E2548] rounded-xl overflow-hidden bg-[#1A1429]">
        <button
          onClick={() => toggleSection('details')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#F8F8FC] hover:bg-[#231C36] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>Body Details</span>
          </div>
          {openSections.details ? <ChevronDown className="w-4 h-4 text-[#8A81A6]" /> : <ChevronRight className="w-4 h-4 text-[#8A81A6]" />}
        </button>

        {openSections.details && (
          <div className="p-3 border-t border-[#2E2548] space-y-3 bg-[#16121E]">
            {/* Arm Length */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-[#A09BB5]">Arm Length</span>
                <span className="text-[#EC4899] font-mono">{proportions.armLength.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.01"
                value={proportions.armLength}
                onChange={e => updateProp('armLength', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#271F3D] rounded appearance-none cursor-pointer accent-[#EC4899]"
              />
            </div>

            {/* Leg Length */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-[#A09BB5]">Leg Length</span>
                <span className="text-[#EC4899] font-mono">{proportions.legLength.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.25"
                step="0.01"
                value={proportions.legLength}
                onChange={e => updateProp('legLength', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#271F3D] rounded appearance-none cursor-pointer accent-[#EC4899]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Expandable Section: Muscle Definition */}
      <div className="border border-[#2E2548] rounded-xl overflow-hidden bg-[#1A1429]">
        <button
          onClick={() => toggleSection('muscle')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#F8F8FC] hover:bg-[#231C36] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-[#F43F5E]" />
            <span>Muscle Definition</span>
          </div>
          {openSections.muscle ? <ChevronDown className="w-4 h-4 text-[#8A81A6]" /> : <ChevronRight className="w-4 h-4 text-[#8A81A6]" />}
        </button>

        {openSections.muscle && (
          <div className="p-3 border-t border-[#2E2548] space-y-3 bg-[#16121E]">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-[#A09BB5]">Muscle Tone</span>
                <span className="text-[#F43F5E] font-mono">{muscleTone}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={muscleTone}
                onChange={e => setMuscleTone(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#271F3D] rounded appearance-none cursor-pointer accent-[#F43F5E]"
              />
            </div>
            <div className="flex justify-between text-[9px] text-[#706B85] font-mono">
              <span>Smooth Soft</span>
              <span>Defined</span>
              <span>Vascular Heroic</span>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Section: Tattoos & Marks */}
      <div className="border border-[#2E2548] rounded-xl overflow-hidden bg-[#1A1429]">
        <button
          onClick={() => toggleSection('tattoos')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#F8F8FC] hover:bg-[#231C36] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>Tattoos & Marks</span>
          </div>
          {openSections.tattoos ? <ChevronDown className="w-4 h-4 text-[#8A81A6]" /> : <ChevronRight className="w-4 h-4 text-[#8A81A6]" />}
        </button>

        {openSections.tattoos && (
          <div className="p-3 border-t border-[#2E2548] space-y-1.5 bg-[#16121E]">
            <div className="grid grid-cols-2 gap-1.5">
              {tattooMarks.map(mark => {
                const isSelected = selectedMark === mark.id
                return (
                  <button
                    key={mark.id}
                    onClick={() => setSelectedMark(mark.id)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#271F3D] text-[#EC4899] border border-[#EC4899]/50 shadow-sm'
                        : 'bg-[#191426] text-[#A09BB5] hover:text-white hover:bg-[#201A30] border border-[#2E2548]'
                    }`}
                  >
                    {mark.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
