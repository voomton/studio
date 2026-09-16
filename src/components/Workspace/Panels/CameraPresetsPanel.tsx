import React from 'react'
import { Camera, Video, Plus, Check, Play } from 'lucide-react'
import { SceneCameraShot } from '../../../types/scene'
import { VOOM_DRAG_TYPES, setDragData, DraggedCameraPayload } from '../../../utils/dragDropAsset'

interface CameraPresetsPanelProps {
  cameraShots: SceneCameraShot[]
  activeShotId?: string | null
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onSaveCurrentCamera?: () => void
  onAddCameraShotCut?: (shot: SceneCameraShot) => void
}

export const CAMERA_PRESETS: SceneCameraShot[] = [
  {
    id: 'shot_wide_establishing',
    name: 'Master Wide',
    position: [0, 2.2, 4.8],
    target: [0, 0.9, 0],
    fov: 36,
    description: 'Full scene overview framing characters and props',
    createdAt: 1
  },
  {
    id: 'shot_medium_dialogue',
    name: 'Medium Two-Shot',
    position: [1.2, 1.4, 2.6],
    target: [0, 1.0, 0],
    fov: 32,
    description: 'Waist-up framing for cinematic conversations',
    createdAt: 2
  },
  {
    id: 'shot_closeup_hero',
    name: 'Hero Close-Up',
    position: [0.3, 1.35, 1.1],
    target: [0, 1.3, 0],
    fov: 28,
    description: 'Tight framing on character facial expression',
    createdAt: 3
  },
  {
    id: 'shot_dramatic_low',
    name: 'Low Angle Dramatic',
    position: [-1.4, 0.45, 2.2],
    target: [0, 1.1, 0],
    fov: 34,
    description: 'Upward dynamic tilt for heroic power moments',
    createdAt: 4
  },
  {
    id: 'shot_birds_eye',
    name: "Bird's Eye Overlook",
    position: [1.8, 3.2, 2.5],
    target: [0, 0.8, 0],
    fov: 38,
    description: 'High-altitude isometric perspective',
    createdAt: 5
  },
  {
    id: 'shot_over_shoulder',
    name: 'Over the Shoulder',
    position: [-0.6, 1.4, 1.8],
    target: [0.4, 1.2, 0.2],
    fov: 30,
    description: 'Framing past character shoulder toward counterpart',
    createdAt: 6
  }
]

export const CameraPresetsPanel: React.FC<CameraPresetsPanelProps> = ({
  cameraShots = [],
  activeShotId,
  onApplyCameraShot,
  onSaveCurrentCamera,
  onAddCameraShotCut
}) => {
  const allShots = [...CAMERA_PRESETS, ...(cameraShots || []).filter(s => s && !CAMERA_PRESETS.some(p => p.id === s.id))]

  return (
    <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white">
      {/* Header bar */}
      <div className="p-3 border-b border-[#1E1E26] flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Camera Shots
          </span>
          <p className="text-[10px] text-[#707080]">
            Drag shot into <b>Viewport</b> or <b>Timeline</b>
          </p>
        </div>
        {onSaveCurrentCamera && (
          <button
            onClick={onSaveCurrentCamera}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#60A5FA] text-[11px] font-bold hover:bg-[#3B82F6]/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture Shot</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {allShots.map(shot => {
          const isActive = activeShotId === shot.id

          return (
            <div
              key={shot.id}
              draggable
              onDragStart={e => {
                const payload: DraggedCameraPayload = {
                  type: 'camera',
                  id: shot.id,
                  name: shot.name,
                  position: shot.position,
                  target: shot.target,
                  fov: shot.fov
                }
                setDragData(e, VOOM_DRAG_TYPES.CAMERA, payload)
              }}
              onClick={() => onApplyCameraShot(shot)}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-grab active:cursor-grabbing ${
                isActive
                  ? 'bg-[#141C2B] border-[#3B82F6] shadow-md shadow-[#3B82F6]/20'
                  : 'bg-[#14141C] border-[#222230] hover:bg-[#1A1A26] hover:border-[#353548]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {shot.name}
                    {isActive && <span className="text-[9px] px-1 rounded bg-[#3B82F6] text-white">Active</span>}
                  </h4>
                  <span className="text-[10px] text-[#707080]">
                    FOV {shot.fov}° • Pos [{shot.position.map(n => n.toFixed(1)).join(', ')}]
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onAddCameraShotCut && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onAddCameraShotCut(shot)
                    }}
                    title="Insert camera cut into timeline at playhead"
                    className="p-1 rounded bg-[#1E1E2C] hover:bg-[#3B82F6] hover:text-white text-[#808095] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-xs text-[#505060] font-mono">⋮⋮</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
