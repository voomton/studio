import React from 'react'
import { CharacterConfig, GlassesId, HeadwearId, ExtraAccessoryId } from '../../types/character'
import { Glasses, Crown, Sparkles } from 'lucide-react'

interface AccessoriesPanelProps {
  config: CharacterConfig
  onChange: (updater: (prev: CharacterConfig) => CharacterConfig) => void
}

const GLASSES: { id: GlassesId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'round_wire', label: 'Round Wire' },
  { id: 'black_frames', label: 'Black Frames' },
  { id: 'sunglasses', label: 'Sunglasses' },
  { id: 'rimless_oval', label: 'Rimless Oval' }
]

const HEADWEAR: { id: HeadwearId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'cat_ears', label: 'Neko Cat Ears' },
  { id: 'witch_hat', label: 'Witch Hat' },
  { id: 'halo', label: 'Angel Halo' },
  { id: 'demon_horns', label: 'Demon Horns' },
  { id: 'beret', label: 'Cute Beret' },
  { id: 'flower_hairpin', label: 'Flower Clip' }
]

const EXTRAS: { id: ExtraAccessoryId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'choker_ribbon', label: 'Choker Ribbon' },
  { id: 'angel_wings', label: 'Angel Wings' },
  { id: 'face_bandaid', label: 'Face Band-Aid' },
  { id: 'earrings', label: 'Earrings' }
]

export const AccessoriesPanel: React.FC<AccessoriesPanelProps> = ({ config, onChange }) => {
  const updateAcc = (key: keyof CharacterConfig['accessories'], value: any) => {
    onChange(prev => ({
      ...prev,
      accessories: {
        ...prev.accessories,
        [key]: value
      }
    }))
  }

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">
      {/* Glasses */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Eyewear & Glasses
          </label>
          {config.accessories.glasses !== 'none' && (
            <input
              type="color"
              value={config.accessories.glassesColor}
              onChange={e => updateAcc('glassesColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {GLASSES.map(g => (
            <button
              key={g.id}
              onClick={() => updateAcc('glasses', g.id)}
              className={`py-2 px-2 text-center rounded-md border text-xs font-bold uppercase transition-all ${
                config.accessories.glasses === g.id
                  ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Headwear & Hats */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Headwear & Ears / Horns
          </label>
          {config.accessories.headwear !== 'none' && (
            <input
              type="color"
              value={config.accessories.headwearColor}
              onChange={e => updateAcc('headwearColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {HEADWEAR.map(h => (
            <button
              key={h.id}
              onClick={() => updateAcc('headwear', h.id)}
              className={`py-2 px-2 text-center rounded-md border text-xs font-bold uppercase transition-all ${
                config.accessories.headwear === h.id
                  ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Extra Accessories */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Special Accessories
          </label>
          {config.accessories.extra !== 'none' && (
            <input
              type="color"
              value={config.accessories.extraColor}
              onChange={e => updateAcc('extraColor', e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {EXTRAS.map(e => (
            <button
              key={e.id}
              onClick={() => updateAcc('extra', e.id)}
              className={`py-2 px-2 text-center rounded-md border text-xs font-bold uppercase transition-all ${
                config.accessories.extra === e.id
                  ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
