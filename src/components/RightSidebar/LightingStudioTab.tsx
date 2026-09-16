import React from 'react'
import { 
  Sun, 
  Sparkles, 
  Image as ImageIcon, 
  Palette, 
  Sliders, 
  Grid, 
  Layers,
  Zap,
  Moon
} from 'lucide-react'
import { VRMAvatarState, StudioSettings, DEFAULT_STUDIO_SETTINGS } from '../../utils/vrmManager'

interface LightingStudioTabProps {
  avatarState: VRMAvatarState
  onChange: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
}

export const LightingStudioTab: React.FC<LightingStudioTabProps> = ({
  avatarState,
  onChange
}) => {
  const studio: StudioSettings = avatarState.studio || DEFAULT_STUDIO_SETTINGS
  const lighting = avatarState.lighting

  const updateLighting = (key: string, value: any) => {
    onChange(prev => ({
      ...prev,
      lighting: {
        ...prev.lighting,
        [key]: value
      }
    }))
  }

  const updateStudio = (key: keyof StudioSettings, value: any) => {
    onChange(prev => ({
      ...prev,
      studio: {
        ...(prev.studio || DEFAULT_STUDIO_SETTINGS),
        [key]: value
      }
    }))
  }

  // Preset lighting rigs
  const lightingPresets = [
    {
      id: 'softStudio',
      name: 'Soft Studio',
      desc: 'Balanced 3-point illumination for character modeling',
      icon: Sun,
      values: {
        keyLightIntensity: 1.2,
        fillLightIntensity: 0.6,
        ambientIntensity: 0.85,
        rimLightIntensity: 0.7,
        rimLightColor: '#FFFFFF',
        exposure: 1.05
      }
    },
    {
      id: 'dramaticRim',
      name: 'Dramatic Rim',
      desc: 'Sharp anime backlight with moody contrast',
      icon: Moon,
      values: {
        keyLightIntensity: 0.8,
        fillLightIntensity: 0.3,
        ambientIntensity: 0.45,
        rimLightIntensity: 1.8,
        rimLightColor: '#FF6B8B',
        exposure: 1.15
      }
    },
    {
      id: 'sunset',
      name: 'Sunset Glow',
      desc: 'Golden hour amber warmth with deep orange rim',
      icon: Sparkles,
      values: {
        keyLightIntensity: 1.4,
        fillLightIntensity: 0.5,
        ambientIntensity: 0.75,
        rimLightIntensity: 1.5,
        rimLightColor: '#FFA726',
        exposure: 1.1
      }
    },
    {
      id: 'daylight',
      name: 'Daylight Neutral',
      desc: 'Clean 5500K bright outdoor daylight',
      icon: Zap,
      values: {
        keyLightIntensity: 1.5,
        fillLightIntensity: 0.8,
        ambientIntensity: 1.0,
        rimLightIntensity: 0.5,
        rimLightColor: '#E0F2FE',
        exposure: 1.0
      }
    },
    {
      id: 'cyberNeon',
      name: 'Cyber Neon',
      desc: 'High-contrast cyberpunk cyan and magenta glows',
      icon: Sparkles,
      values: {
        keyLightIntensity: 1.0,
        fillLightIntensity: 0.4,
        ambientIntensity: 0.5,
        rimLightIntensity: 2.0,
        rimLightColor: '#00FFFF',
        exposure: 1.2
      }
    },
    {
      id: 'mangaHighKey',
      name: 'Anime High Key',
      desc: 'Shadowless crisp cel-shaded anime illumination',
      icon: Sun,
      values: {
        keyLightIntensity: 1.6,
        fillLightIntensity: 1.2,
        ambientIntensity: 1.1,
        rimLightIntensity: 0.9,
        rimLightColor: '#FFFFFF',
        exposure: 1.1
      }
    }
  ]

  const applyLightingPreset = (preset: typeof lightingPresets[0]) => {
    onChange(prev => ({
      ...prev,
      lighting: {
        keyLightIntensity: preset.values.keyLightIntensity,
        fillLightIntensity: preset.values.fillLightIntensity,
        ambientIntensity: preset.values.ambientIntensity,
        rimLightIntensity: preset.values.rimLightIntensity,
        rimLightColor: preset.values.rimLightColor
      },
      studio: {
        ...(prev.studio || DEFAULT_STUDIO_SETTINGS),
        lightingPreset: preset.id as any,
        exposure: preset.values.exposure
      }
    }))
  }

  // Background Presets categorized
  const plainPresets = [
    { id: 'dark', label: 'Dark Obsidian', color: '#0A0A0E' },
    { id: 'slate', label: 'Grey Slate', color: '#1E202E' },
    { id: 'white', label: 'Clean White', color: '#CBD5E1' }
  ]

  const gradientPresets = [
    { id: 'sakura', label: 'Sakura Dusk', color: '#2E1424' },
    { id: 'cyber', label: 'Cyber Blue', color: '#0B1A2E' },
    { id: 'sunset', label: 'Sunset Crimson', color: '#591C2B' }
  ]

  const environmentScenes = [
    { id: 'skyClouds', label: 'Anime Sky & Clouds', desc: 'Clear blue day', color: '#38BDF8' },
    { id: 'animeRoom', label: 'Manga Loft Room', desc: 'Warm interior ambient', color: '#1E1B4B' },
    { id: 'fantasyForest', label: 'Enchanted Forest', desc: 'Emerald atmosphere', color: '#064E3B' },
    { id: 'neonCity', label: 'Neo-Tokyo Night', desc: 'Night skyline glow', color: '#4C0519' }
  ]

  const specialPresets = [
    { id: 'chroma', label: 'Chroma Green (#00FF00)', desc: 'Live video keying', color: '#00FF00' },
    { id: 'transparent', label: 'Transparent Alpha', desc: 'Cutout sticker PNG', color: 'transparent' }
  ]

  const handleSelectBackdrop = (presetId: string) => {
    onChange(prev => ({
      ...prev,
      backdrop: presetId as any,
      studio: {
        ...(prev.studio || DEFAULT_STUDIO_SETTINGS),
        backdropPreset: presetId as any
      }
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Studio Stage & Lighting
        </h3>
        <p className="text-[10px] text-[#707080]">
          Environment backdrops, 3-point lighting rigs, rim highlights & studio stage lighting
        </p>
      </div>

      {/* Lighting Presets */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#D0D0E0]">Lighting Rigs</span>
          <span className="text-[10px] text-[#707080]">Click to apply</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {lightingPresets.map(preset => {
            const Icon = preset.icon
            const isSelected = studio.lightingPreset === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => applyLightingPreset(preset)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white shadow-sm'
                    : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D32F2F]' : 'text-[#808095]'}`} />
                  <span className="text-xs font-bold text-white">{preset.name}</span>
                </div>
                <div className="text-[9px] text-[#707080] leading-tight line-clamp-1">{preset.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Background / Environment Presets */}
      <div className="space-y-3 pt-2 border-t border-[#22222E]">
        <div className="text-xs font-bold text-[#D0D0E0]">
          Environment & Backdrops
        </div>

        {/* Studio Solids & Gradients */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#808095] uppercase">Studio & Gradients</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[...plainPresets, ...gradientPresets].map(bg => {
              const isSelected = (studio.backdropPreset || avatarState.backdrop) === bg.id
              return (
                <button
                  key={bg.id}
                  onClick={() => handleSelectBackdrop(bg.id)}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E1E2A] border-[#D32F2F] text-white'
                      : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
                  }`}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded shrink-0 border border-white/20"
                    style={{ backgroundColor: bg.color }}
                  />
                  <span className="truncate">{bg.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Outdoor & Thematic Scenes */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-[#808095] uppercase">Thematic Environments</span>
          <div className="grid grid-cols-2 gap-1.5">
            {environmentScenes.map(scene => {
              const isSelected = (studio.backdropPreset || avatarState.backdrop) === scene.id
              return (
                <button
                  key={scene.id}
                  onClick={() => handleSelectBackdrop(scene.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white'
                      : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
                  }`}
                >
                  <span 
                    className="w-4 h-4 rounded-md shrink-0 border border-white/20"
                    style={{ backgroundColor: scene.color }}
                  />
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-white truncate">{scene.label}</div>
                    <div className="text-[9px] text-[#707080] truncate">{scene.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Keying & Custom Color */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-[#808095] uppercase">Video Keying & Custom Color</span>
          <div className="grid grid-cols-2 gap-1.5">
            {specialPresets.map(sp => {
              const isSelected = (studio.backdropPreset || avatarState.backdrop) === sp.id
              return (
                <button
                  key={sp.id}
                  onClick={() => handleSelectBackdrop(sp.id)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#D32F2F]/15 border-[#D32F2F] text-white'
                      : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
                  }`}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded shrink-0 border border-white/20"
                    style={{ backgroundColor: sp.color === 'transparent' ? '#333' : sp.color }}
                  />
                  <span className="text-[10px] font-bold truncate">{sp.label}</span>
                </button>
              )
            })}
          </div>

          {/* Solid Color Picker */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#14141C] border border-[#22222E] mt-1.5">
            <span className="text-xs font-bold text-white">Custom Solid Color</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#A0A0B0]">{studio.customBackdropColor}</span>
              <input
                type="color"
                value={studio.customBackdropColor || '#121218'}
                onChange={e => {
                  updateStudio('customBackdropColor', e.target.value)
                  updateStudio('backdropPreset', 'custom')
                  onChange(prev => ({ ...prev, backdrop: 'custom' as any }))
                }}
                className="w-6 h-6 rounded border border-[#2B2B38] bg-transparent cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floor Grid & Floor Shadow Toggles */}
      <div className="space-y-4 pt-2 border-t border-[#22222E]">
        <div className="text-xs font-bold text-[#D0D0E0]">
          Stage & Shadow Settings
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-2.5 bg-[#14141C] border border-[#22222E] rounded-xl">
            <div className="flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-[#A0A0B5]" />
              <span className="text-xs font-bold text-white">Floor Grid</span>
            </div>
            <input
              type="checkbox"
              checked={studio.showGrid}
              onChange={e => updateStudio('showGrid', e.target.checked)}
              className="w-4 h-4 accent-[#D32F2F] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#14141C] border border-[#22222E] rounded-xl">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#A0A0B5]" />
              <span className="text-xs font-bold text-white">Floor Shadow</span>
            </div>
            <input
              type="checkbox"
              checked={studio.showFloorShadow}
              onChange={e => updateStudio('showFloorShadow', e.target.checked)}
              className="w-4 h-4 accent-[#D32F2F] cursor-pointer"
            />
          </div>
        </div>

        {/* Shadow Opacity Slider */}
        {studio.showFloorShadow && (
          <div>
            <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
              <span>Shadow Contact Density</span>
              <span className="text-[#D32F2F] font-mono text-[11px]">
                {Math.round((studio.shadowOpacity || 0.28) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.01"
              value={studio.shadowOpacity || 0.28}
              onChange={e => updateStudio('shadowOpacity', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
            />
          </div>
        )}
      </div>

      {/* 3-Point Light Manual Sliders */}
      <div className="space-y-4 pt-2 border-t border-[#22222E]">
        <div className="text-xs font-bold text-[#D0D0E0]">
          Manual Illumination Controls
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
            <span>Key Spotlight Power</span>
            <span className="text-[#D32F2F] font-mono text-[11px]">
              {lighting.keyLightIntensity.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={lighting.keyLightIntensity}
            onChange={e => updateLighting('keyLightIntensity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
            <span>Fill Light Softness</span>
            <span className="text-[#D32F2F] font-mono text-[11px]">
              {lighting.fillLightIntensity.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={lighting.fillLightIntensity}
            onChange={e => updateLighting('fillLightIntensity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
            <span>Ambient Base Light</span>
            <span className="text-[#D32F2F] font-mono text-[11px]">
              {lighting.ambientIntensity.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={lighting.ambientIntensity}
            onChange={e => updateLighting('ambientIntensity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
          />
        </div>

        {/* Anime Rim Light */}
        <div className="space-y-2 pt-1 border-t border-[#1E1E26]">
          <div className="flex justify-between items-center text-xs font-bold text-[#D0D0E0]">
            <span>Anime Rim Light Color</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#A0A0B0]">{lighting.rimLightColor}</span>
              <input
                type="color"
                value={lighting.rimLightColor}
                onChange={e => updateLighting('rimLightColor', e.target.value)}
                className="w-6 h-6 rounded border border-[#2B2B38] bg-transparent cursor-pointer"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
              <span>Rim Highlight Intensity</span>
              <span className="text-[#D32F2F] font-mono text-[11px]">
                {lighting.rimLightIntensity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={lighting.rimLightIntensity}
              onChange={e => updateLighting('rimLightIntensity', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
