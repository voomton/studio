import React, { useState } from 'react'
import { VRM } from '@pixiv/three-vrm'
import { VRMAvatarState, POSE_PRESETS } from '../../utils/vrmManager'
import { 
  User, 
  RotateCcw, 
  Sparkles, 
  Activity, 
  Layers, 
  Compass,
  SlidersHorizontal,
  RefreshCw,
  Move
} from 'lucide-react'

interface VRMPosingPanelProps {
  vrm: VRM | null
  avatarState: VRMAvatarState
  onChange: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
}

type BoneGroup = 'upper' | 'arms' | 'legs'

export const VRMPosingPanel: React.FC<VRMPosingPanelProps> = ({
  vrm,
  avatarState,
  onChange
}) => {
  const [activeBoneGroup, setActiveBoneGroup] = useState<BoneGroup>('upper')

  const applyPosePreset = (presetKey: string) => {
    const preset = POSE_PRESETS[presetKey]
    if (!preset) return

    onChange(prev => ({
      ...prev,
      boneRotations: { ...preset.bones }
    }))
  }

  const handleBoneSlider = (boneName: string, axisIndex: 0 | 1 | 2, degValue: number) => {
    onChange(prev => {
      const current = prev.boneRotations[boneName] || [0, 0, 0]
      const updated: [number, number, number] = [current[0], current[1], current[2]]
      updated[axisIndex] = degValue

      return {
        ...prev,
        boneRotations: {
          ...prev.boneRotations,
          [boneName]: updated
        }
      }
    })
  }

  const handleResetPose = () => {
    applyPosePreset('naturalStand')
  }

  const handleMirrorPose = () => {
    onChange(prev => {
      const b = prev.boneRotations
      const nextBones: Record<string, [number, number, number]> = { ...b }

      // Mirror left to right
      const pairs = [
        ['leftUpperArm', 'rightUpperArm'],
        ['leftLowerArm', 'rightLowerArm'],
        ['leftHand', 'rightHand'],
        ['leftUpperLeg', 'rightUpperLeg'],
        ['leftLowerLeg', 'rightLowerLeg'],
        ['leftFoot', 'rightFoot']
      ]

      pairs.forEach(([left, right]) => {
        if (b[left]) {
          nextBones[right] = [b[left][0], -b[left][1], -b[left][2]]
        }
      })

      return {
        ...prev,
        boneRotations: nextBones
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 p-4 text-xs">
      {/* Quick Pose Presets Grid */}
      <div className="flex flex-col gap-2 bg-[#18181F] p-3 rounded-lg border border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#D32F2F]" />
            Anime Pose Presets
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMirrorPose}
              title="Mirror Left arm/leg pose to Right side"
              className="flex items-center gap-1 text-[10px] text-[#80808F] hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Mirror
            </button>
            <button
              onClick={handleResetPose}
              className="flex items-center gap-1 text-[10px] text-[#80808F] hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {Object.entries(POSE_PRESETS).map(([key, pose]) => (
            <button
              key={key}
              onClick={() => applyPosePreset(key)}
              className="flex flex-col text-left p-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] hover:border-[#D32F2F]/50 transition-all group"
            >
              <span className="font-bold text-[11px] text-[#E0E0E5] group-hover:text-white">
                {pose.name}
              </span>
              <span className="text-[9.5px] text-[#80808F] truncate mt-0.5">
                {pose.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Auto Breathing Dynamic Motion */}
      <div className="flex items-center justify-between bg-[#18181F] p-3 rounded-lg border border-[#2D2D35]">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#D32F2F]" />
            Natural Idle Breathing
          </span>
          <span className="text-[9.5px] text-[#80808F]">
            Harmonic chest and spine respiration loop
          </span>
        </div>
        <button
          onClick={() => onChange(prev => ({ ...prev, autoBreathing: !prev.autoBreathing }))}
          className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
            avatarState.autoBreathing
              ? 'bg-[#D32F2F] text-white shadow-sm'
              : 'bg-[#1E1E24] text-[#80808F] hover:text-white'
          }`}
        >
          {avatarState.autoBreathing ? 'Active' : 'Off'}
        </button>
      </div>

      {/* Bone Hierarchy Inspector Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-[#D32F2F]" />
            FK Bone Rotations
          </span>
          <div className="flex bg-[#18181F] p-0.5 rounded border border-[#2D2D35]">
            <button
              onClick={() => setActiveBoneGroup('upper')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                activeBoneGroup === 'upper' ? 'bg-[#D32F2F] text-white' : 'text-[#80808F] hover:text-white'
              }`}
            >
              Torso & Head
            </button>
            <button
              onClick={() => setActiveBoneGroup('arms')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                activeBoneGroup === 'arms' ? 'bg-[#D32F2F] text-white' : 'text-[#80808F] hover:text-white'
              }`}
            >
              Arms
            </button>
            <button
              onClick={() => setActiveBoneGroup('legs')}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                activeBoneGroup === 'legs' ? 'bg-[#D32F2F] text-white' : 'text-[#80808F] hover:text-white'
              }`}
            >
              Legs
            </button>
          </div>
        </div>

        {/* Bone Sliders according to active group */}
        {activeBoneGroup === 'upper' && (
          <div className="flex flex-col gap-2.5">
            <BoneControlRow
              label="Head Tilt & Turn"
              boneName="head"
              rotations={avatarState.boneRotations['head'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Neck Orientation"
              boneName="neck"
              rotations={avatarState.boneRotations['neck'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Chest & Ribcage"
              boneName="chest"
              rotations={avatarState.boneRotations['chest'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Spine / Core Arch"
              boneName="spine"
              rotations={avatarState.boneRotations['spine'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
          </div>
        )}

        {activeBoneGroup === 'arms' && (
          <div className="flex flex-col gap-2.5">
            <BoneControlRow
              label="Left Upper Arm"
              boneName="leftUpperArm"
              rotations={avatarState.boneRotations['leftUpperArm'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Left Forearm / Elbow"
              boneName="leftLowerArm"
              rotations={avatarState.boneRotations['leftLowerArm'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Left Hand / Wrist"
              boneName="leftHand"
              rotations={avatarState.boneRotations['leftHand'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <div className="h-px bg-[#2D2D35] my-1" />
            <BoneControlRow
              label="Right Upper Arm"
              boneName="rightUpperArm"
              rotations={avatarState.boneRotations['rightUpperArm'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Right Forearm / Elbow"
              boneName="rightLowerArm"
              rotations={avatarState.boneRotations['rightLowerArm'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Right Hand / Wrist"
              boneName="rightHand"
              rotations={avatarState.boneRotations['rightHand'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
          </div>
        )}

        {activeBoneGroup === 'legs' && (
          <div className="flex flex-col gap-2.5">
            <BoneControlRow
              label="Left Thigh / Hip"
              boneName="leftUpperLeg"
              rotations={avatarState.boneRotations['leftUpperLeg'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Left Knee / Shin"
              boneName="leftLowerLeg"
              rotations={avatarState.boneRotations['leftLowerLeg'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Left Foot"
              boneName="leftFoot"
              rotations={avatarState.boneRotations['leftFoot'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <div className="h-px bg-[#2D2D35] my-1" />
            <BoneControlRow
              label="Right Thigh / Hip"
              boneName="rightUpperLeg"
              rotations={avatarState.boneRotations['rightUpperLeg'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Right Knee / Shin"
              boneName="rightLowerLeg"
              rotations={avatarState.boneRotations['rightLowerLeg'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
            <BoneControlRow
              label="Right Foot"
              boneName="rightFoot"
              rotations={avatarState.boneRotations['rightFoot'] || [0, 0, 0]}
              onSliderChange={handleBoneSlider}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface BoneControlRowProps {
  label: string
  boneName: string
  rotations: [number, number, number]
  onSliderChange: (boneName: string, axisIndex: 0 | 1 | 2, degValue: number) => void
}

const BoneControlRow: React.FC<BoneControlRowProps> = ({
  label,
  boneName,
  rotations,
  onSliderChange
}) => {
  return (
    <div className="flex flex-col gap-1.5 bg-[#18181F] p-2.5 rounded-lg border border-[#2D2D35]">
      <div className="flex justify-between items-center text-[11px] font-bold text-[#E0E0E5]">
        <span>{label}</span>
        <span className="text-[10px] font-mono text-[#80808F]">
          X:{Math.round(rotations[0])}° Y:{Math.round(rotations[1])}° Z:{Math.round(rotations[2])}°
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* X axis */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[9px] text-[#80808F]">
            <span>Pitch (X)</span>
            <span>{Math.round(rotations[0])}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotations[0]}
            onChange={e => onSliderChange(boneName, 0, parseInt(e.target.value))}
            className="w-full accent-[#D32F2F] h-1 bg-[#252530] rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Y axis */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[9px] text-[#80808F]">
            <span>Yaw (Y)</span>
            <span>{Math.round(rotations[1])}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotations[1]}
            onChange={e => onSliderChange(boneName, 1, parseInt(e.target.value))}
            className="w-full accent-[#D32F2F] h-1 bg-[#252530] rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Z axis */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[9px] text-[#80808F]">
            <span>Roll (Z)</span>
            <span>{Math.round(rotations[2])}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotations[2]}
            onChange={e => onSliderChange(boneName, 2, parseInt(e.target.value))}
            className="w-full accent-[#D32F2F] h-1 bg-[#252530] rounded appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
