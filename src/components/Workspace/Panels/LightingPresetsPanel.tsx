import React from 'react'
import { Sun, Sparkles, Moon, Flame, Zap, Check } from 'lucide-react'
import { VOOM_DRAG_TYPES, setDragData, DraggedLightPayload } from '../../../utils/dragDropAsset'
import { VRMAvatarState } from '../../../utils/vrmManager'

export interface LightingPreset {
  id: string
  name: string
  description: string
  keyColor: string
  fillColor: string
  rimColor: string
  ambientIntensity: number
  keyIntensity: number
  backdrop: 'dark' | 'slate' | 'white' | 'sakura' | 'cyber' | 'sunset'
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: 'light_studio_clean',
    name: 'Studio Three-Point',
    description: 'Clean balanced commercial anime key, fill and rim light',
    keyColor: '#FFFFFF',
    fillColor: '#B0C4DE',
    rimColor: '#FFFFFF',
    ambientIntensity: 0.7,
    keyIntensity: 1.2,
    backdrop: 'dark'
  },
  {
    id: 'light_sunset_golden',
    name: 'Golden Hour Sunset',
    description: 'Warm amber key light with soft violet atmospheric shadows',
    keyColor: '#FFA500',
    fillColor: '#8A2BE2',
    rimColor: '#FFD700',
    ambientIntensity: 0.6,
    keyIntensity: 1.4,
    backdrop: 'sunset'
  },
  {
    id: 'light_cyber_neon',
    name: 'Cyberpunk Neon',
    description: 'Vibrant magenta key and cyan backlight accents',
    keyColor: '#EC4899',
    fillColor: '#06B6D4',
    rimColor: '#3B82F6',
    ambientIntensity: 0.4,
    keyIntensity: 1.5,
    backdrop: 'cyber'
  },
  {
    id: 'light_night_moonlight',
    name: 'Moonlit Night',
    description: 'Cool blue ambience with high-contrast rim silhouette',
    keyColor: '#38BDF8',
    fillColor: '#1E1B4B',
    rimColor: '#E0F2FE',
    ambientIntensity: 0.35,
    keyIntensity: 1.1,
    backdrop: 'slate'
  },
  {
    id: 'light_horror_noir',
    name: 'Dramatic Noir Horror',
    description: 'Deep stark shadows with razor-sharp upward illumination',
    keyColor: '#EF4444',
    fillColor: '#0A0A0E',
    rimColor: '#DC2626',
    ambientIntensity: 0.2,
    keyIntensity: 1.6,
    backdrop: 'dark'
  },
  {
    id: 'light_sakura_bloom',
    name: 'Sakura Anime Bloom',
    description: 'Pastel blossom warm illumination with soft rim highlights',
    keyColor: '#FDF2F8',
    fillColor: '#F472B6',
    rimColor: '#FB7185',
    ambientIntensity: 0.8,
    keyIntensity: 1.1,
    backdrop: 'sakura'
  }
]

interface LightingPresetsPanelProps {
  onApplyPreset?: (preset: LightingPreset) => void
  activePresetId?: string
}

export const LightingPresetsPanel: React.FC<LightingPresetsPanelProps> = ({
  onApplyPreset,
  activePresetId
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white">
      <div className="p-3 border-b border-[#1E1E26]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Lighting Environments
        </h3>
        <p className="text-[10px] text-[#707080] mt-0.5">
          Drag preset directly into <b>3D Viewport</b> to illuminate scene
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {LIGHTING_PRESETS.map(light => {
          const isActive = activePresetId === light.id

          return (
            <div
              key={light.id}
              draggable
              onDragStart={e => {
                const payload: DraggedLightPayload = {
                  type: 'light',
                  presetId: light.id,
                  name: light.name,
                  keyColor: light.keyColor,
                  fillColor: light.fillColor,
                  ambientIntensity: light.ambientIntensity
                }
                setDragData(e, VOOM_DRAG_TYPES.LIGHT, payload)
              }}
              onClick={() => onApplyPreset?.(light)}
              className={`group p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                isActive
                  ? 'bg-[#221C14] border-[#F59E0B] shadow-md shadow-[#F59E0B]/20'
                  : 'bg-[#14141C] border-[#222230] hover:bg-[#1A1A26] hover:border-[#353548]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-inner"
                    style={{ 
                      background: `linear-gradient(135deg, ${light.keyColor}40, ${light.fillColor}40)`,
                      border: `1px solid ${light.keyColor}80` 
                    }}
                  >
                    <Sun className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#F59E0B] transition-colors">
                      {light.name}
                    </h4>
                    <p className="text-[10px] text-[#707080] leading-tight mt-0.5 line-clamp-1">
                      {light.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: light.keyColor }} title="Key Light" />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: light.fillColor }} title="Fill Light" />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: light.rimColor }} title="Rim Light" />
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#1C1C26] flex items-center justify-between text-[9px] text-[#555568]">
                <span>Amb {Math.round(light.ambientIntensity * 100)}% • Key {light.keyIntensity}x</span>
                <span className="text-[#F59E0B] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  ⋮⋮ Drag to Viewport
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
