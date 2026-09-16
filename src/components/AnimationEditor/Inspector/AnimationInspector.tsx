/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react'
import { 
  SceneEntitySelection, 
  SceneCharacterInstance, 
  SceneProp, 
  SceneCameraShot 
} from '../../../types/scene'
import { AnimationProject } from '../../../types/animation'
import { POSE_PRESETS, STANDARD_EXPRESSIONS, STANDARD_HUMANOID_BONES, VRMAvatarState } from '../../../utils/vrmManager'
import { generateLipSyncFromText } from '../../../utils/animationEngine'
import { 
  User, 
  Camera, 
  Sun, 
  Volume2, 
  Diamond, 
  Sliders, 
  Smile, 
  Move, 
  RotateCcw, 
  Sparkles, 
  Mic, 
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus
} from 'lucide-react'

interface AnimationInspectorProps {
  selectedEntity: SceneEntitySelection
  selectedCharacter?: SceneCharacterInstance
  selectedProp?: SceneProp
  selectedCamera?: SceneCameraShot
  project: AnimationProject
  currentFrame: number
  onUpdateCharacterTransform?: (charId: string, updates: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number] }) => void
  onUpdateCharacterState?: (charId: string, updater: (prev: VRMAvatarState) => VRMAvatarState) => void
  onUpdateCameraShot?: (shotId: string, updates: Partial<SceneCameraShot>) => void
  onAddKeyframe: (trackId: string, frame: number, value: any) => void
  onKeyframeAllTransform?: (charId: string) => void
  onApplyClipToCharacter?: (charId: string, clipType: any) => void
  onGenerateLipSync?: (charId: string, text: string) => void
  onUpdateTrack?: (trackId: string, updates: any) => void
  onUpdateKeyframe?: (trackId: string, keyframeId: string, updates: any) => void
  onDeleteKeyframe?: (trackId: string, keyframeId: string) => void
}

export const AnimationInspector: React.FC<AnimationInspectorProps> = ({
  selectedEntity,
  selectedCharacter,
  selectedProp,
  selectedCamera,
  project,
  currentFrame,
  onUpdateCharacterTransform,
  onUpdateCharacterState,
  onUpdateCameraShot,
  onAddKeyframe,
  onKeyframeAllTransform,
  onApplyClipToCharacter,
  onGenerateLipSync,
  onUpdateTrack,
  onUpdateKeyframe,
  onDeleteKeyframe
}) => {
  const [activeTab, setActiveTab] = useState<'transform' | 'pose' | 'face' | 'lipsync' | 'clips' | 'keyframe'>('transform')
  const [dialogueInput, setDialogueInput] = useState("Hey there! Ready to create an amazing animation!")
  const [selectedBoneGroup, setSelectedBoneGroup] = useState<'head' | 'arms' | 'legs' | 'spine'>('head')

  // Find active track (selected in timeline, or matching selected entity)
  const activeTrack = project.selectedTrackId 
    ? project.tracks.find(t => t.id === project.selectedTrackId)
    : project.tracks.find(t => t.targetId === selectedCharacter?.id || t.targetId === selectedCamera?.id)

  // Find active keyframe (selected keyframe, or closest keyframe at current frame)
  const selectedKeyframeId = project.selectedKeyframeIds[0]
  const activeKeyframe = activeTrack?.keyframes.find(k => k.id === selectedKeyframeId) ||
    activeTrack?.keyframes.find(k => k.frame === currentFrame) ||
    activeTrack?.keyframes[0]

  // Render SVG Easing Preview Graph
  const renderEasingCurvePreview = (type: string) => {
    let pathD = 'M 10 50 L 90 10' // default linear
    if (type === 'easeIn') pathD = 'M 10 50 C 45 50, 75 40, 90 10'
    else if (type === 'easeOut') pathD = 'M 10 50 C 25 20, 55 10, 90 10'
    else if (type === 'easeInOut') pathD = 'M 10 50 C 45 50, 55 10, 90 10'
    else if (type === 'step' || type === 'constant') pathD = 'M 10 50 L 90 50 L 90 10'
    else if (type === 'bezier') pathD = 'M 10 50 C 30 65, 70 -5, 90 10'

    return (
      <div className="w-full h-24 bg-[#0A0A0F] rounded-lg border border-[#222230] p-2 relative flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-[9px] font-mono text-[#606075] z-10 pointer-events-none">
          <span>VAL 1.0</span>
          <span className="text-[#00E676] font-bold uppercase">{type} CURVE</span>
        </div>
        <svg className="w-full h-14 overflow-visible" viewBox="0 0 100 60" preserveAspectRatio="none">
          {/* Subtle grid lines */}
          <line x1="10" y1="10" x2="90" y2="10" stroke="#1E1E2A" strokeDasharray="2 2" strokeWidth="0.8" />
          <line x1="10" y1="30" x2="90" y2="30" stroke="#1E1E2A" strokeDasharray="2 2" strokeWidth="0.8" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="#1E1E2A" strokeDasharray="2 2" strokeWidth="0.8" />
          {/* Main easing curve */}
          <path d={pathD} fill="none" stroke="#D32F2F" strokeWidth="2.5" strokeLinecap="round" />
          {/* Start & End anchors */}
          <circle cx="10" cy="50" r="3" fill="#3B82F6" stroke="#fff" strokeWidth="1" />
          <circle cx="90" cy="10" r="3" fill="#00E676" stroke="#fff" strokeWidth="1" />
        </svg>
        <div className="flex items-center justify-between text-[9px] font-mono text-[#606075] z-10 pointer-events-none">
          <span>F{activeKeyframe?.frame ?? 0}</span>
          <span>F{(activeKeyframe?.frame ?? 0) + 30}</span>
        </div>
      </div>
    )
  }

  if (!selectedEntity && !activeTrack) {
    return (
      <aside className="w-80 bg-[#0E0E14] border-l border-[#1E1E26] flex flex-col items-center justify-center p-6 text-center select-none shrink-0">
        <Sliders className="w-10 h-10 text-[#404050] mb-3" />
        <h3 className="text-sm font-bold text-[#A0A0B0]">No Entity or Track Selected</h3>
        <p className="text-xs text-[#606070] mt-1">
          Click any character, camera, light, or track/keyframe in the timeline to inspect and animate properties.
        </p>
      </aside>
    )
  }

  return (
    <aside className="w-80 bg-[#0D0D12] border-l border-[#1E1E26] flex flex-col h-full select-none z-10 shrink-0 overflow-hidden">
      {/* Inspector Header */}
      <div className="h-11 px-3.5 bg-[#12121A] border-b border-[#22222E] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {selectedEntity?.type === 'character' && <User className="w-4 h-4 text-[#D32F2F]" />}
          {selectedEntity?.type === 'camera' && <Camera className="w-4 h-4 text-[#10B981]" />}
          {selectedEntity?.type === 'prop' && <Layers className="w-4 h-4 text-[#3B82F6]" />}
          {!selectedEntity && activeTrack && <Sliders className="w-4 h-4 text-[#00E676]" />}
          
          <span className="text-xs font-black uppercase text-white truncate max-w-[170px]">
            {selectedCharacter?.name || selectedCamera?.name || selectedProp?.name || activeTrack?.name || 'Selected Entity'}
          </span>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#20202E] text-[#A0A0B0] uppercase border border-[#2D2D3E]">
          Frame {currentFrame}
        </span>
      </div>

      {/* Tabs for Character or Active Track */}
      <div className="flex items-center bg-[#14141C] border-b border-[#22222E] p-1 gap-1 shrink-0 overflow-x-auto">
        {selectedEntity?.type === 'character' && selectedCharacter && (
          <>
            <button
              onClick={() => setActiveTab('transform')}
              className={`flex-1 min-w-[50px] py-1 text-[11px] font-bold rounded transition-colors cursor-pointer text-center ${
                activeTab === 'transform' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#808090] hover:text-white'
              }`}
            >
              Transform
            </button>
            <button
              onClick={() => setActiveTab('clips')}
              className={`flex-1 min-w-[40px] py-1 text-[11px] font-bold rounded transition-colors cursor-pointer text-center ${
                activeTab === 'clips' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#808090] hover:text-white'
              }`}
            >
              Clips
            </button>
            <button
              onClick={() => setActiveTab('pose')}
              className={`flex-1 min-w-[40px] py-1 text-[11px] font-bold rounded transition-colors cursor-pointer text-center ${
                activeTab === 'pose' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#808090] hover:text-white'
              }`}
            >
              Pose
            </button>
            <button
              onClick={() => setActiveTab('face')}
              className={`flex-1 min-w-[40px] py-1 text-[11px] font-bold rounded transition-colors cursor-pointer text-center ${
                activeTab === 'face' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#808090] hover:text-white'
              }`}
            >
              Face
            </button>
            <button
              onClick={() => setActiveTab('lipsync')}
              className={`flex-1 min-w-[52px] py-1 text-[11px] font-bold rounded transition-colors cursor-pointer text-center ${
                activeTab === 'lipsync' ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-[#808090] hover:text-white'
              }`}
            >
              LipSync
            </button>
          </>
        )}

        {activeTrack && (
          <button
            onClick={() => setActiveTab('keyframe')}
            className={`flex-1 min-w-[65px] py-1 text-[11px] font-bold rounded transition-colors cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'keyframe' || (!selectedEntity && activeTrack) ? 'bg-[#00E676] text-[#0A0A0E] shadow-sm font-black' : 'text-[#00E676] hover:bg-[#00E676]/10'
            }`}
          >
            <Diamond className="w-3 h-3" />
            <span>Curve / Key</span>
          </button>
        )}
      </div>

      {/* Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* CHARACTER: TRANSFORM TAB */}
        {selectedEntity?.type === 'character' && selectedCharacter && activeTab === 'transform' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#707080] tracking-wider">
                Position (Meters)
              </span>
              <button
                onClick={() => onKeyframeAllTransform && onKeyframeAllTransform(selectedCharacter.id)}
                title="Add Keyframe for Position & Rotation at current frame"
                className="flex items-center gap-1 text-[10px] font-bold text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/30 hover:bg-[#00E676]/20 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Keyframe (K)</span>
              </button>
            </div>

            {/* Position Inputs */}
            <div className="grid grid-cols-3 gap-2">
              {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                <div key={axis} className="bg-[#14141C] p-2 rounded-lg border border-[#22222E]">
                  <span className="text-[9px] font-bold text-[#707080]">{axis}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={Number((selectedCharacter.position[idx] || 0).toFixed(2))}
                    onChange={e => {
                      const newPos = [...selectedCharacter.position] as [number, number, number]
                      newPos[idx] = parseFloat(e.target.value) || 0
                      onUpdateCharacterTransform && onUpdateCharacterTransform(selectedCharacter.id, { position: newPos })
                    }}
                    className="w-full bg-transparent text-white font-bold text-xs focus:outline-none mt-0.5"
                  />
                </div>
              ))}
            </div>

            {/* Rotation Inputs */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-[#707080] tracking-wider">
                Rotation (Degrees)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['Pitch X', 'Yaw Y', 'Roll Z'] as const).map((axis, idx) => (
                  <div key={axis} className="bg-[#14141C] p-2 rounded-lg border border-[#22222E]">
                    <span className="text-[9px] font-bold text-[#707080]">{axis}</span>
                    <input
                      type="number"
                      step="5"
                      value={Math.round(selectedCharacter.rotation[idx] || 0)}
                      onChange={e => {
                        const newRot = [...selectedCharacter.rotation] as [number, number, number]
                        newRot[idx] = parseFloat(e.target.value) || 0
                        onUpdateCharacterTransform && onUpdateCharacterTransform(selectedCharacter.id, { rotation: newRot })
                      }}
                      className="w-full bg-transparent text-white font-bold text-xs focus:outline-none mt-0.5"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scale Inputs */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-[#707080] tracking-wider">
                Scale
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                  <div key={axis} className="bg-[#14141C] p-2 rounded-lg border border-[#22222E]">
                    <span className="text-[9px] font-bold text-[#707080]">{axis}</span>
                    <input
                      type="number"
                      step="0.05"
                      value={Number((selectedCharacter.scale[idx] || 1).toFixed(2))}
                      onChange={e => {
                        const newScale = [...selectedCharacter.scale] as [number, number, number]
                        newScale[idx] = parseFloat(e.target.value) || 1
                        onUpdateCharacterTransform && onUpdateCharacterTransform(selectedCharacter.id, { scale: newScale })
                      }}
                      className="w-full bg-transparent text-white font-bold text-xs focus:outline-none mt-0.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHARACTER: ANIMATION CLIPS TAB */}
        {selectedEntity?.type === 'character' && selectedCharacter && activeTab === 'clips' && (
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-[#707080] tracking-wider">
              Apply Action Clip to Timeline
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'idle', name: 'Natural Idle', color: '#6366F1' },
                { type: 'walk', name: 'Walk Cycle', color: '#3B82F6' },
                { type: 'run', name: 'Fast Run', color: '#0EA5E9' },
                { type: 'wave', name: 'Friendly Wave', color: '#10B981' },
                { type: 'talk', name: 'Talking Gestures', color: '#8B5CF6' },
                { type: 'dance', name: 'Pop Dance', color: '#EC4899' },
                { type: 'jump', name: 'Action Jump', color: '#F59E0B' },
                { type: 'attack', name: 'Sword Attack', color: '#D32F2F' }
              ].map(clip => (
                <button
                  key={clip.type}
                  onClick={() => onApplyClipToCharacter && onApplyClipToCharacter(selectedCharacter.id, clip.type)}
                  style={{ borderLeftColor: clip.color }}
                  className="p-2.5 bg-[#14141C] hover:bg-[#1C1C28] border border-[#252536] border-l-4 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs text-white block">{clip.name}</span>
                  <span className="text-[9px] text-[#707080] mt-0.5 block">+ Add to Frame {currentFrame}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CHARACTER: POSE TAB */}
        {selectedEntity?.type === 'character' && selectedCharacter && activeTab === 'pose' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#707080] tracking-wider">
                Pose Presets
              </span>
              <button
                onClick={() => {
                  if (onUpdateCharacterState) {
                    onUpdateCharacterState(selectedCharacter.id, prev => ({
                      ...prev,
                      boneRotations: {}
                    }))
                  }
                }}
                className="text-[10px] text-[#A0A0B0] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset T-Pose</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(POSE_PRESETS).slice(0, 10).map(([key, pose]) => (
                <button
                  key={key}
                  onClick={() => {
                    if (onUpdateCharacterState) {
                      onUpdateCharacterState(selectedCharacter.id, prev => ({
                        ...prev,
                        boneRotations: { ...pose.bones },
                        activePosePreset: key
                      }))
                    }
                  }}
                  className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                    selectedCharacter.state?.activePosePreset === key
                      ? 'bg-[#D32F2F]/20 border-[#D32F2F] text-white'
                      : 'bg-[#14141C] border-[#22222E] text-[#A0A0B0] hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs block">{pose.name || (pose as any).label}</span>
                  <span className="text-[9px] text-[#606070] truncate block">{pose.category}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CHARACTER: FACE TAB */}
        {selectedEntity?.type === 'character' && selectedCharacter && activeTab === 'face' && (
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-[#707080] tracking-wider">
              Facial Expressions
            </span>

            {STANDARD_EXPRESSIONS.map(exp => {
              const currentWeight = selectedCharacter.state?.expressions?.[exp.id] || 0
              return (
                <div key={exp.id} className="bg-[#14141C] p-2.5 rounded-lg border border-[#22222E] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{exp.label}</span>
                    <span className="font-mono text-[10px] text-[#00E676]">{Math.round(currentWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentWeight}
                    onChange={e => {
                      const val = parseFloat(e.target.value)
                      if (onUpdateCharacterState) {
                        onUpdateCharacterState(selectedCharacter.id, prev => ({
                          ...prev,
                          expressions: {
                            ...prev.expressions,
                            [exp.id]: val
                          }
                        }))
                      }
                    }}
                    className="w-full h-1.5 bg-[#252536] accent-[#D32F2F] rounded cursor-pointer"
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* CHARACTER: LIP SYNC TAB */}
        {selectedEntity?.type === 'character' && selectedCharacter && activeTab === 'lipsync' && (
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-[#707080] tracking-wider">
              Automated Lip Sync Generator
            </span>
            <p className="text-[11px] text-[#808090]">
              Enter speech dialogue to automatically generate phonetic mouth shapes on the timeline:
            </p>
            <textarea
              rows={3}
              value={dialogueInput}
              onChange={e => setDialogueInput(e.target.value)}
              className="w-full bg-[#14141C] border border-[#252536] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D32F2F]"
            />
            <button
              onClick={() => onGenerateLipSync && onGenerateLipSync(selectedCharacter.id, dialogueInput)}
              className="w-full py-2 bg-[#00E676] hover:bg-[#00C853] text-[#0A0A0E] font-black text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#00E676]/20"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Generate Lip-Sync on Timeline</span>
            </button>
          </div>
        )}

        {/* CAMERA INSPECTOR */}
        {selectedEntity?.type === 'camera' && selectedCamera && (
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase text-[#707080] tracking-wider">
              Camera Lens & Framing
            </span>
            
            <div className="bg-[#14141C] p-3 rounded-lg border border-[#22222E] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">Field of View (FOV)</span>
                <span className="font-mono text-xs text-[#10B981]">{Math.round(selectedCamera.fov)}°</span>
              </div>
              <input
                type="range"
                min="18"
                max="65"
                value={selectedCamera.fov}
                onChange={e => {
                  onUpdateCameraShot && onUpdateCameraShot(selectedCamera.id, { fov: parseFloat(e.target.value) })
                }}
                className="w-full h-1.5 bg-[#252536] accent-[#10B981] rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 12. TRACK & KEYFRAME INSPECTOR (When activeTab is 'keyframe' or when no 3D mesh is selected) */}
        {(activeTab === 'keyframe' || (!selectedEntity && activeTrack)) && activeTrack && (
          <div className="space-y-4">
            {/* Track Info Card */}
            <div className="bg-[#14141C] p-3 rounded-xl border border-[#252538] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#A0A0B5]">
                  Track Details
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#202030] text-[#00E676] uppercase">
                  {activeTrack.targetType}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#707080] block mb-1">Track Name</label>
                <input
                  type="text"
                  value={activeTrack.name}
                  onChange={e => onUpdateTrack && onUpdateTrack(activeTrack.id, { name: e.target.value })}
                  className="w-full bg-[#0D0D12] border border-[#2B2B3C] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:border-[#D32F2F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-[#1E1E28]">
                  <span className="text-[9px] font-bold text-[#707080] block uppercase">Property</span>
                  <span className="font-mono font-bold text-[#E0E0F0] truncate block">{activeTrack.property}</span>
                </div>
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-[#1E1E28]">
                  <span className="text-[9px] font-bold text-[#707080] block uppercase">Total Keys</span>
                  <span className="font-mono font-bold text-[#00E676] block">{activeTrack.keyframes.length}</span>
                </div>
              </div>
            </div>

            {/* Active Keyframe Details */}
            {activeKeyframe ? (
              <div className="bg-[#14141C] p-3 rounded-xl border border-[#252538] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#A0A0B5]">
                    <Diamond className="w-3.5 h-3.5 text-[#00E676]" />
                    <span>Active Keyframe</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/20">
                    F{activeKeyframe.frame}
                  </span>
                </div>

                {/* Keyframe Frame Position */}
                <div>
                  <label className="text-[10px] font-bold text-[#707080] block mb-1">Keyframe Frame</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={project.totalFrames}
                      value={activeKeyframe.frame}
                      onChange={e => {
                        const newFrame = parseInt(e.target.value) || 0
                        onUpdateKeyframe && onUpdateKeyframe(activeTrack.id, activeKeyframe.id, { frame: newFrame })
                      }}
                      className="w-full bg-[#0D0D12] border border-[#2B2B3C] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#D32F2F] focus:outline-none"
                    />
                    <button
                      onClick={() => onUpdateKeyframe && onUpdateKeyframe(activeTrack.id, activeKeyframe.id, { frame: currentFrame })}
                      className="px-2 py-1.5 bg-[#222230] hover:bg-[#2C2C3E] rounded-lg text-[10px] font-bold text-[#A0A0B5] hover:text-white border border-[#333345] cursor-pointer whitespace-nowrap"
                    >
                      Snap to Playhead
                    </button>
                  </div>
                </div>

                {/* Keyframe Value */}
                <div>
                  <label className="text-[10px] font-bold text-[#707080] block mb-1">Keyframe Value</label>
                  {Array.isArray(activeKeyframe.value) ? (
                    <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                      {['X', 'Y', 'Z'].map((axis, idx) => (
                        <div key={axis} className="bg-[#0E0E14] border border-[#222230] rounded-lg p-1.5">
                          <span className="text-[9px] font-bold text-[#707080] block">{axis}</span>
                          <input
                            type="number"
                            step="0.05"
                            value={Number((activeKeyframe.value[idx] ?? 0).toFixed(2))}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0
                              const newArr = [...activeKeyframe.value]
                              newArr[idx] = val
                              onUpdateKeyframe && onUpdateKeyframe(activeTrack.id, activeKeyframe.id, { value: newArr })
                            }}
                            className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  ) : typeof activeKeyframe.value === 'number' ? (
                    <input
                      type="number"
                      step="0.1"
                      value={activeKeyframe.value}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0
                        onUpdateKeyframe && onUpdateKeyframe(activeTrack.id, activeKeyframe.id, { value: val })
                      }}
                      className="w-full bg-[#0D0D12] border border-[#2B2B3C] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#D32F2F] focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(activeKeyframe.value ?? '')}
                      onChange={e => onUpdateKeyframe && onUpdateKeyframe(activeTrack.id, activeKeyframe.id, { value: e.target.value })}
                      className="w-full bg-[#0D0D12] border border-[#2B2B3C] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#D32F2F] focus:outline-none"
                    />
                  )}
                </div>

                {/* Interpolation / Easing */}
                <div>
                  <label className="text-[10px] font-bold text-[#707080] block mb-1">Interpolation / Easing</label>
                  <select
                    value={activeKeyframe.interpolation || 'linear'}
                    onChange={e => onUpdateKeyframe && onUpdateKeyframe(activeTrack.id, activeKeyframe.id, { interpolation: e.target.value })}
                    className="w-full bg-[#0D0D12] border border-[#2B2B3C] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#D32F2F] focus:outline-none cursor-pointer"
                  >
                    <option value="linear">Linear</option>
                    <option value="easeIn">Ease In</option>
                    <option value="easeOut">Ease Out</option>
                    <option value="easeInOut">Ease In Out</option>
                    <option value="step">Constant / Step</option>
                    <option value="bezier">Bezier Curve</option>
                  </select>
                </div>

                {/* Interpolation Curve Preview Graph */}
                <div>
                  <label className="text-[10px] font-bold text-[#707080] block mb-1.5">Easing Curve Preview</label>
                  {renderEasingCurvePreview(activeKeyframe.interpolation || 'linear')}
                </div>

                {/* Keyframe Actions */}
                <div className="pt-2 flex items-center gap-2 border-t border-[#20202E]">
                  <button
                    onClick={() => onDeleteKeyframe && onDeleteKeyframe(activeTrack.id, activeKeyframe.id)}
                    className="flex-1 py-1.5 bg-[#251014] hover:bg-[#38141A] text-[#EF4444] border border-[#521C24] rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Delete Keyframe
                  </button>
                  <button
                    onClick={() => onAddKeyframe(activeTrack.id, currentFrame, activeKeyframe.value)}
                    className="flex-1 py-1.5 bg-[#14251B] hover:bg-[#1A3825] text-[#00E676] border border-[#1E4D30] rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Duplicate at Playhead
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#14141C] p-4 rounded-xl border border-[#222230] text-center space-y-2">
                <span className="text-xs text-[#808095] block">No keyframe selected on this track.</span>
                <button
                  onClick={() => onAddKeyframe(activeTrack.id, currentFrame, [0, 0, 0])}
                  className="px-3 py-1.5 bg-[#00E676] hover:bg-[#00C853] text-[#0A0A0E] text-xs font-bold rounded-lg cursor-pointer"
                >
                  + Add Keyframe at Frame {currentFrame}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
