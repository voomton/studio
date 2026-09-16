import React from 'react'
import { CharacterPhysicsSettings, DEFAULT_PHYSICS } from '../../utils/vrmManager'
import { Wind, Activity, RefreshCw, Eye, MessageSquare, ShieldCheck, Power } from 'lucide-react'

interface PhysicsTabProps {
  physics?: CharacterPhysicsSettings
  autoBreathing?: boolean
  autoBlink?: boolean
  autoLipSync?: boolean
  eyeTracking?: boolean
  onPhysicsChange: (physics: CharacterPhysicsSettings) => void
  onAutoToggle: (key: 'autoBreathing' | 'autoBlink' | 'autoLipSync' | 'eyeTracking', val: boolean) => void
}

export const PhysicsTab: React.FC<PhysicsTabProps> = ({
  physics,
  autoBreathing = false,
  autoBlink = false,
  autoLipSync = false,
  eyeTracking = false,
  onPhysicsChange,
  onAutoToggle
}) => {
  const currentPhysics = { ...DEFAULT_PHYSICS, ...(physics || {}) }

  const updatePhys = (key: keyof CharacterPhysicsSettings, value: any) => {
    onPhysicsChange({
      ...currentPhysics,
      [key]: value
    })
  }

  const handleReset = () => {
    onPhysicsChange({ ...DEFAULT_PHYSICS })
    onAutoToggle('autoBreathing', false)
    onAutoToggle('autoBlink', false)
    onAutoToggle('autoLipSync', false)
    onAutoToggle('eyeTracking', false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Physics & Dynamics
          </h3>
          <p className="text-[10px] text-[#707080]">
            SpringBone cloth/hair simulation and procedural animators
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1A24] hover:bg-[#222230] text-[#A0A0B5] hover:text-white text-[10px] font-bold transition-all cursor-pointer"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Freeze & Reset</span>
        </button>
      </div>

      {/* Master Physics Enable Card */}
      <div className="p-3 bg-[#14141C] border border-[#22222E] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentPhysics.enabled ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-[#22222E] text-[#707080]'}`}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">SpringBone Dynamics</div>
              <div className="text-[10px] text-[#707080]">
                {currentPhysics.enabled ? 'Physics active (Real-time simulation)' : 'Frozen at rest (Maximum stability)'}
              </div>
            </div>
          </div>
          <button
            onClick={() => updatePhys('enabled', !currentPhysics.enabled)}
            className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-tight transition-all cursor-pointer ${
              currentPhysics.enabled
                ? 'bg-[#00E676] text-[#0A0A0C]'
                : 'bg-[#22222E] text-[#A0A0B0] hover:bg-[#2A2A38]'
            }`}
          >
            {currentPhysics.enabled ? 'Enabled' : 'Off (Rest)'}
          </button>
        </div>

        {/* Physics Tuning Sliders (Visible when enabled) */}
        {currentPhysics.enabled && (
          <div className="space-y-3 pt-3 border-t border-[#22222E]">
            <div>
              <div className="flex justify-between text-xs text-[#D0D0E0] mb-1">
                <span>Joint Stiffness</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">{Math.round(currentPhysics.stiffness * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={currentPhysics.stiffness}
                onChange={e => updatePhys('stiffness', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#D0D0E0] mb-1">
                <span>Damping / Air Drag</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">{Math.round(currentPhysics.drag * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={currentPhysics.drag}
                onChange={e => updatePhys('drag', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Manual Wind Generator */}
      <div className="p-3 bg-[#14141C] border border-[#22222E] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentPhysics.windEnabled ? 'bg-[#D32F2F]/20 text-[#D32F2F]' : 'bg-[#22222E] text-[#707080]'}`}>
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Wind Generator</div>
              <div className="text-[10px] text-[#707080]">
                {currentPhysics.windEnabled ? 'Simulating directional wind breeze' : 'Disabled (Calm air)'}
              </div>
            </div>
          </div>
          <button
            onClick={() => updatePhys('windEnabled', !currentPhysics.windEnabled)}
            className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-tight transition-all cursor-pointer ${
              currentPhysics.windEnabled
                ? 'bg-[#D32F2F] text-white'
                : 'bg-[#22222E] text-[#A0A0B0] hover:bg-[#2A2A38]'
            }`}
          >
            {currentPhysics.windEnabled ? 'Breeze ON' : 'Breeze OFF'}
          </button>
        </div>

        {currentPhysics.windEnabled && (
          <div className="space-y-3 pt-3 border-t border-[#22222E]">
            <div>
              <div className="flex justify-between text-xs text-[#D0D0E0] mb-1">
                <span>Wind Velocity</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">{Math.round(currentPhysics.windStrength * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={currentPhysics.windStrength || 0.3}
                onChange={e => updatePhys('windStrength', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Explicit Procedural Animators */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#D0D0E0]">
          Explicit Trigger Automations
        </div>

        <div className="space-y-2">
          {/* Breathing */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#14141C] border border-[#22222E]">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#00E676]" />
              <span className="text-xs font-medium text-white">Gentle Chest Breathing</span>
            </div>
            <input
              type="checkbox"
              checked={autoBreathing}
              onChange={e => onAutoToggle('autoBreathing', e.target.checked)}
              className="w-4 h-4 accent-[#D32F2F] cursor-pointer"
            />
          </div>

          {/* Auto Blink */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#14141C] border border-[#22222E]">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#D32F2F]" />
              <span className="text-xs font-medium text-white">Periodic Natural Blinking</span>
            </div>
            <input
              type="checkbox"
              checked={autoBlink}
              onChange={e => onAutoToggle('autoBlink', e.target.checked)}
              className="w-4 h-4 accent-[#D32F2F] cursor-pointer"
            />
          </div>

          {/* Auto LipSync */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#14141C] border border-[#22222E]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#EAB308]" />
              <span className="text-xs font-medium text-white">Talking Mouth Animation</span>
            </div>
            <input
              type="checkbox"
              checked={autoLipSync}
              onChange={e => onAutoToggle('autoLipSync', e.target.checked)}
              className="w-4 h-4 accent-[#D32F2F] cursor-pointer"
            />
          </div>

          {/* Mouse Eye Tracking */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#14141C] border border-[#22222E]">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="text-xs font-medium text-white">Follow Mouse Cursor (LookAt)</span>
            </div>
            <input
              type="checkbox"
              checked={eyeTracking}
              onChange={e => onAutoToggle('eyeTracking', e.target.checked)}
              className="w-4 h-4 accent-[#D32F2F] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
