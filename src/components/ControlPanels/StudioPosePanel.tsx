import React from 'react'
import { CharacterConfig, PoseId, StudioBackdrop } from '../../types/character'
import { Sparkles, Sun, Palette, Sliders } from 'lucide-react'

interface StudioPosePanelProps {
  config: CharacterConfig
  onChange: (updater: (prev: CharacterConfig) => CharacterConfig) => void
}

const POSES: { id: PoseId; label: string; desc: string }[] = [
  { id: 'idle_breath', label: 'Idle Breathing', desc: 'Natural relaxed standing pose with breathing loop' },
  { id: 'cute_peace', label: 'Cute Peace Sign', desc: 'Cheeky idol peace gesture with head tilt' },
  { id: 'heroic_stance', label: 'Heroic Stance', desc: 'Hand on hip confident anime protagonist stance' },
  { id: 'shy_kawaii', label: 'Shy Kawaii', desc: 'Hands held behind back with inward stance' },
  { id: 'spellcaster', label: 'Spellcaster / Battle', desc: 'Dynamic magical spell casting stance' },
  { id: 't_pose', label: 'Rig T-Pose', desc: 'Standard modeling calibration T-pose' }
]

const BACKDROPS: { id: StudioBackdrop; label: string; desc: string; preview: string }[] = [
  { 
    id: 'dark_obsidian', 
    label: 'Dark Obsidian', 
    desc: 'Studio darkroom with deep charcoal tones',
    preview: 'bg-[#121217]'
  },
  { 
    id: 'sakura_garden', 
    label: 'Sakura Twilight', 
    desc: 'Mystical purple & magenta dusk atmosphere',
    preview: 'bg-gradient-to-br from-purple-950 to-pink-950'
  },
  { 
    id: 'cyber_neon', 
    label: 'Cyber Neon', 
    desc: 'Dark blue futuristic sci-fi ambiance',
    preview: 'bg-gradient-to-br from-cyan-950 to-blue-950'
  },
  { 
    id: 'clean_daylight', 
    label: 'Clean Daylight', 
    desc: 'Neutral slate gray lighting for model inspection',
    preview: 'bg-[#272730]'
  }
]

export const StudioPosePanel: React.FC<StudioPosePanelProps> = ({ config, onChange }) => {
  const updateStudio = (key: keyof CharacterConfig['studio'], value: any) => {
    onChange(prev => ({
      ...prev,
      studio: {
        ...prev.studio,
        [key]: value
      }
    }))
  }

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">
      {/* Dynamic Poses */}
      <div className="flex flex-col gap-2">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Character Pose & Motion
        </label>
        <div className="grid grid-cols-1 gap-2">
          {POSES.map(p => (
            <button
              key={p.id}
              onClick={() => updateStudio('pose', p.id)}
              className={`flex items-center justify-between p-2.5 rounded-md border text-left transition-all ${
                config.studio.pose === p.id
                  ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:border-[#3D3D45] hover:bg-[#26262E]'
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase">{p.label}</div>
                <div className="text-[10px] text-[#80808F]">{p.desc}</div>
              </div>
              {config.studio.pose === p.id && (
                <span className="w-2 h-2 rounded-full bg-[#D32F2F]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Studio Backdrops */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#2D2D35]">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
          Studio Backdrop & Environment
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BACKDROPS.map(b => (
            <button
              key={b.id}
              onClick={() => updateStudio('backdrop', b.id)}
              className={`flex flex-col p-2 rounded-md border text-left transition-all ${
                config.studio.backdrop === b.id
                  ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white shadow-sm'
                  : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:border-[#3D3D45] hover:bg-[#26262E]'
              }`}
            >
              <div className={`w-full h-8 rounded mb-1.5 border border-[#3D3D45] ${b.preview}`} />
              <span className="text-[11px] font-bold uppercase">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Anime Edge / Rim Light Settings */}
      <div className="flex flex-col gap-3 pt-2 border-t border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
            Stylized Anime Rim Light
          </label>
          <input
            type="color"
            value={config.studio.rimLightColor}
            onChange={e => updateStudio('rimLightColor', e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#B0B0BF]">Rim Light Intensity</span>
            <span className="font-mono text-[#80808F]">{config.studio.rimLightIntensity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={config.studio.rimLightIntensity}
            onChange={e => updateStudio('rimLightIntensity', parseFloat(e.target.value))}
            className="w-full accent-[#D32F2F] cursor-pointer"
          />
        </div>

        {/* Breathing Animation Loop Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-xs font-bold text-[#E0E0E5]">Idle Breathing Motion</div>
            <div className="text-[10px] text-[#80808F]">Organic subtle spine expansion</div>
          </div>
          <button
            onClick={() => updateStudio('enableBreathing', !config.studio.enableBreathing)}
            className={`px-3 py-1 rounded text-xs font-bold uppercase border transition-all ${
              config.studio.enableBreathing
                ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                : 'bg-[#1E1E24] border-[#2D2D35] text-[#80808F]'
            }`}
          >
            {config.studio.enableBreathing ? 'Active' : 'Paused'}
          </button>
        </div>
      </div>
    </div>
  )
}
