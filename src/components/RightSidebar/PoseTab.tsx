import React, { useState } from 'react'
import { POSE_PRESETS } from '../../utils/vrmManager'
import { Move, RefreshCw, FlipHorizontal, Sliders, Check } from 'lucide-react'

interface PoseTabProps {
  boneRotations: Record<string, [number, number, number]>
  activePosePreset: string
  onChange: (rotations: Record<string, [number, number, number]>, presetName?: string) => void
}

export const PoseTab: React.FC<PoseTabProps> = ({
  boneRotations,
  activePosePreset,
  onChange
}) => {
  const [activeBoneGroup, setActiveBoneGroup] = useState<'torso' | 'arms' | 'legs'>('torso')

  const applyPreset = (presetKey: string) => {
    const preset = POSE_PRESETS[presetKey]
    if (preset) {
      onChange({ ...preset.bones }, presetKey)
    }
  }

  const updateBoneAxis = (boneName: string, axisIndex: 0 | 1 | 2, degrees: number) => {
    const current = boneRotations[boneName] || [0, 0, 0]
    const next: [number, number, number] = [current[0], current[1], current[2]]
    next[axisIndex] = degrees
    onChange({
      ...boneRotations,
      [boneName]: next
    }, 'custom')
  }

  const handleResetPose = () => {
    applyPreset('naturalStand')
  }

  const handleMirrorArms = () => {
    const lUp = boneRotations['leftUpperArm'] || [0, 0, 0]
    const lLow = boneRotations['leftLowerArm'] || [0, 0, 0]
    const lHand = boneRotations['leftHand'] || [0, 0, 0]

    onChange({
      ...boneRotations,
      rightUpperArm: [lUp[0], -lUp[1], -lUp[2]],
      rightLowerArm: [lLow[0], -lLow[1], -lLow[2]],
      rightHand: [lHand[0], -lHand[1], -lHand[2]]
    }, 'custom')
  }

  const presetList = Object.entries(POSE_PRESETS)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Pose & Bone Rigging
          </h3>
          <p className="text-[10px] text-[#707080]">
            Manual FK rotation and animation poses
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMirrorArms}
            title="Mirror Left Arm to Right Arm"
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1A24] hover:bg-[#222230] text-[#A0A0B5] hover:text-white text-[10px] font-bold transition-all cursor-pointer"
          >
            <FlipHorizontal className="w-2.5 h-2.5" />
            <span>Mirror</span>
          </button>
          <button
            onClick={handleResetPose}
            title="Reset to Natural Stand"
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1A24] hover:bg-[#222230] text-[#A0A0B5] hover:text-white text-[10px] font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Preset Library Grid */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#D0D0E0]">
          Pose Library Presets
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {presetList.map(([key, preset]) => {
            const isSelected = activePosePreset === key
            return (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#D32F2F]/20 border-[#D32F2F] text-white shadow-sm'
                    : 'bg-[#14141C] border-[#22222E] text-[#A0A0B5] hover:bg-[#1A1A24]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{preset.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-[#D32F2F] shrink-0" />}
                </div>
                <span className="text-[9px] text-[#606070] font-mono block mt-0.5">{preset.category}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Manual Bone FK Controls */}
      <div className="space-y-3 pt-2 border-t border-[#22222E]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#D0D0E0]">Manual Bone FK Controls</span>
          <div className="flex bg-[#14141C] p-0.5 rounded-lg border border-[#22222E]">
            <button
              onClick={() => setActiveBoneGroup('torso')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                activeBoneGroup === 'torso' ? 'bg-[#D32F2F] text-white' : 'text-[#808090]'
              }`}
            >
              Torso
            </button>
            <button
              onClick={() => setActiveBoneGroup('arms')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                activeBoneGroup === 'arms' ? 'bg-[#D32F2F] text-white' : 'text-[#808090]'
              }`}
            >
              Arms
            </button>
            <button
              onClick={() => setActiveBoneGroup('legs')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                activeBoneGroup === 'legs' ? 'bg-[#D32F2F] text-white' : 'text-[#808090]'
              }`}
            >
              Legs
            </button>
          </div>
        </div>

        {/* Torso & Head Controls */}
        {activeBoneGroup === 'torso' && (
          <div className="space-y-3 pl-2 border-l border-[#22222E]">
            {/* Head */}
            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Head Pitch / Nod (X)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['head']?.[0] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                value={boneRotations['head']?.[0] || 0}
                onChange={e => updateBoneAxis('head', 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Head Yaw / Turn (Y)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['head']?.[1] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-70"
                max="70"
                value={boneRotations['head']?.[1] || 0}
                onChange={e => updateBoneAxis('head', 1, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Head Roll / Tilt (Z)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['head']?.[2] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={boneRotations['head']?.[2] || 0}
                onChange={e => updateBoneAxis('head', 2, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>

            {/* Spine */}
            <div className="pt-2 border-t border-[#22222E]">
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Spine Arch (X)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['spine']?.[0] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={boneRotations['spine']?.[0] || 0}
                onChange={e => updateBoneAxis('spine', 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
          </div>
        )}

        {/* Arms Controls */}
        {activeBoneGroup === 'arms' && (
          <div className="space-y-3 pl-2 border-l border-[#22222E]">
            {/* Left Upper Arm */}
            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Left Upper Arm (Z-Raise)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['leftUpperArm']?.[2] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-120"
                max="120"
                value={boneRotations['leftUpperArm']?.[2] || 0}
                onChange={e => updateBoneAxis('leftUpperArm', 2, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>

            {/* Left Elbow */}
            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Left Elbow Bend (X)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['leftLowerArm']?.[0] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-140"
                max="0"
                value={boneRotations['leftLowerArm']?.[0] || 0}
                onChange={e => updateBoneAxis('leftLowerArm', 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>

            {/* Right Upper Arm */}
            <div className="pt-2 border-t border-[#22222E]">
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Right Upper Arm (Z-Raise)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['rightUpperArm']?.[2] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-120"
                max="120"
                value={boneRotations['rightUpperArm']?.[2] || 0}
                onChange={e => updateBoneAxis('rightUpperArm', 2, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>

            {/* Right Elbow */}
            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Right Elbow Bend (X)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['rightLowerArm']?.[0] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-140"
                max="0"
                value={boneRotations['rightLowerArm']?.[0] || 0}
                onChange={e => updateBoneAxis('rightLowerArm', 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
          </div>
        )}

        {/* Legs Controls */}
        {activeBoneGroup === 'legs' && (
          <div className="space-y-3 pl-2 border-l border-[#22222E]">
            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Left Leg Lift (X)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['leftUpperLeg']?.[0] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                value={boneRotations['leftUpperLeg']?.[0] || 0}
                onChange={e => updateBoneAxis('leftUpperLeg', 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Left Knee Bend (X)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['leftLowerLeg']?.[0] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="130"
                value={boneRotations['leftLowerLeg']?.[0] || 0}
                onChange={e => updateBoneAxis('leftLowerLeg', 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>

            <div className="pt-2 border-t border-[#22222E]">
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Right Leg Lift (X)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['rightUpperLeg']?.[0] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                value={boneRotations['rightUpperLeg']?.[0] || 0}
                onChange={e => updateBoneAxis('rightUpperLeg', 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>Right Knee Bend (X)</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round(boneRotations['rightLowerLeg']?.[0] || 0)}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="130"
                value={boneRotations['rightLowerLeg']?.[0] || 0}
                onChange={e => updateBoneAxis('rightLowerLeg', 0, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
