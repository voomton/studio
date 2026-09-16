import React from 'react'
import { VRM } from '@pixiv/three-vrm'
import { VRMAvatarState } from '../../utils/vrmManager'
import { 
  Wind, 
  Sparkles, 
  RotateCcw, 
  Layers, 
  Compass, 
  Zap,
  Activity
} from 'lucide-react'

interface VRMPhysicsPanelProps {
  vrm: VRM | null
  avatarState: VRMAvatarState
  onChange: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
}

export const VRMPhysicsPanel: React.FC<VRMPhysicsPanelProps> = ({
  vrm,
  avatarState,
  onChange
}) => {
  // Count springbone springs
  const springJointsCount = React.useMemo(() => {
    if (!vrm?.springBoneManager) return 0
    return vrm.springBoneManager.joints?.size || (vrm.springBoneManager as any)._joints?.length || 0
  }, [vrm])

  const springCollidersCount = React.useMemo(() => {
    if (!vrm?.springBoneManager) return 0
    return (vrm.springBoneManager.colliders as any)?.size || (vrm.springBoneManager as any)?.length || 0
  }, [vrm])

  const handleWindAngleChange = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180
    const dirX = Math.sin(rad)
    const dirZ = Math.cos(rad)

    onChange(prev => ({
      ...prev,
      windDirection: [dirX, 0.1, dirZ]
    }))
  }

  const currentWindAngle = avatarState.windDirection
    ? Math.round((Math.atan2(avatarState.windDirection[0], avatarState.windDirection[2]) * 180) / Math.PI)
    : 45

  return (
    <div className="flex flex-col gap-5 p-4 text-xs">
      {/* Physics Master Toggle */}
      <div className="flex items-center justify-between bg-[#18181F] p-3 rounded-lg border border-[#2D2D35]">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#D32F2F]" />
            SpringBone Secondary Physics
          </span>
          <span className="text-[9.5px] text-[#80808F]">
            Hair, ribbons, skirts, capes & bust spring physics
          </span>
        </div>
        <button
          onClick={() => onChange(prev => ({ ...prev, springBonePhysics: !prev.springBonePhysics }))}
          className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
            avatarState.springBonePhysics
              ? 'bg-[#D32F2F] text-white shadow-sm'
              : 'bg-[#1E1E24] text-[#80808F] hover:text-white'
          }`}
        >
          {avatarState.springBonePhysics ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Physics Stats Badge */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col bg-[#18181F] p-2.5 rounded-lg border border-[#2D2D35]">
          <span className="text-[9.5px] text-[#80808F] uppercase font-bold">Spring Joints</span>
          <span className="text-sm font-mono font-bold text-white mt-0.5">
            {springJointsCount} Bones
          </span>
        </div>
        <div className="flex flex-col bg-[#18181F] p-2.5 rounded-lg border border-[#2D2D35]">
          <span className="text-[9.5px] text-[#80808F] uppercase font-bold">Body Colliders</span>
          <span className="text-sm font-mono font-bold text-white mt-0.5">
            {springCollidersCount} Spheres
          </span>
        </div>
      </div>

      {/* Live Wind Simulation Controls */}
      <div className="flex flex-col gap-3 bg-[#18181F] p-3 rounded-lg border border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
            <Wind className="w-3 h-3 text-[#D32F2F]" />
            Live Wind Force Generator
          </label>
          {(avatarState.windStrength ?? 0) > 0 && (
            <button
              onClick={() => onChange(prev => ({ ...prev, windStrength: 0 }))}
              className="text-[10px] text-[#80808F] hover:text-white"
            >
              Stop Wind
            </button>
          )}
        </div>

        {/* Wind Speed / Strength */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-[#E0E0E5]">Wind Velocity</span>
            <span className="font-mono text-[#80808F]">{Math.round((avatarState.windStrength ?? 0) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={avatarState.windStrength ?? 0}
            onChange={e => onChange(prev => ({ ...prev, windStrength: parseFloat(e.target.value) }))}
            className="w-full accent-[#D32F2F] h-1.5 bg-[#252530] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Wind Angle / Direction */}
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-[#E0E0E5]">Wind Direction Angle</span>
            <span className="font-mono text-[#80808F]">{currentWindAngle}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={5}
            value={currentWindAngle}
            onChange={e => handleWindAngleChange(parseInt(e.target.value))}
            className="w-full accent-[#D32F2F] h-1.5 bg-[#252530] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Wind Quick Presets */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            onClick={() => {
              onChange(prev => ({
                ...prev,
                windStrength: 0.25,
                windDirection: [0.5, 0.1, 0.5]
              }))
            }}
            className="py-1.5 px-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[10px] font-bold text-[#E0E0E5] hover:text-white transition-all text-center"
          >
            Breeze
          </button>
          <button
            onClick={() => {
              onChange(prev => ({
                ...prev,
                windStrength: 0.6,
                windDirection: [-0.8, 0.1, 0.3]
              }))
            }}
            className="py-1.5 px-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[10px] font-bold text-[#E0E0E5] hover:text-white transition-all text-center"
          >
            Gust
          </button>
          <button
            onClick={() => {
              onChange(prev => ({
                ...prev,
                windStrength: 0.95,
                windDirection: [0, 0.1, -1]
              }))
            }}
            className="py-1.5 px-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[10px] font-bold text-[#E0E0E5] hover:text-white transition-all text-center"
          >
            Storm
          </button>
          <button
            onClick={() => onChange(prev => ({ ...prev, windStrength: 0 }))}
            className="py-1.5 px-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[10px] font-bold text-[#80808F] hover:text-white transition-all text-center"
          >
            Calm
          </button>
        </div>
      </div>
    </div>
  )
}
