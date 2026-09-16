import React, { useState } from 'react'
import { SceneCameraShot } from '../types/scene'
import { 
  Camera, 
  Plus, 
  Trash2, 
  Video, 
  RefreshCw, 
  Check, 
  Edit2, 
  Eye, 
  Compass, 
  Sliders, 
  Copy,
  Layers,
  Sparkles,
  Info
} from 'lucide-react'

interface SceneCameraShotsPanelProps {
  cameraShots: SceneCameraShot[]
  activeShotId: string | null
  onSaveCurrentView: (name?: string) => void
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onDeleteCameraShot: (shotId: string) => void
  onOverwriteCameraShot: (shotId: string) => void
  onRenameCameraShot: (shotId: string, newName: string) => void
  onResetToDefaultView: () => void
}

export const SceneCameraShotsPanel: React.FC<SceneCameraShotsPanelProps> = ({
  cameraShots,
  activeShotId,
  onSaveCurrentView,
  onApplyCameraShot,
  onDeleteCameraShot,
  onOverwriteCameraShot,
  onRenameCameraShot,
  onResetToDefaultView
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newShotName, setNewShotName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleStartRename = (shot: SceneCameraShot) => {
    setEditingId(shot.id)
    setEditName(shot.name)
  }

  const handleSaveRename = (shotId: string) => {
    if (editName.trim()) {
      onRenameCameraShot(shotId, editName.trim())
    }
    setEditingId(null)
  }

  const handleCreateShot = () => {
    onSaveCurrentView(newShotName.trim() || undefined)
    setNewShotName('')
    setIsAdding(false)
  }

  return (
    <div className="space-y-3 p-3 bg-[#14141C] rounded-2xl border border-[#22222E]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E53935]/20 border border-[#E53935]/30 flex items-center justify-center text-[#EF5350]">
            <Video className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Camera Shots
            </h3>
            <span className="text-[10px] text-[#707080] font-mono">
              {cameraShots.length} saved angle{cameraShots.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          title="Save Current Camera Angle"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E53935] hover:bg-[#D32F2F] text-white text-[11px] font-bold transition-all shadow-md shadow-[#E53935]/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save View</span>
        </button>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <div className="p-2.5 rounded-xl bg-[#1A1A26] border border-[#2D2D3E] space-y-2 animate-in fade-in slide-in-from-top-1">
          <div className="text-[10px] font-bold text-[#A0A0B0] uppercase tracking-wider">
            Save Current Viewport Angle
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newShotName}
              onChange={(e) => setNewShotName(e.target.value)}
              placeholder={`Shot ${cameraShots.length + 1} (e.g. Hero Close-up, Wide)`}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateShot()}
              autoFocus
              className="flex-1 bg-[#101018] border border-[#2E2E40] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#606070] focus:outline-none focus:border-[#E53935]"
            />
            <button
              onClick={handleCreateShot}
              className="px-3 py-1.5 rounded-lg bg-[#E53935] hover:bg-[#D32F2F] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-2 py-1.5 rounded-lg bg-[#222230] hover:bg-[#2C2C3E] text-[#808090] text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shots List */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-0.5">
        {cameraShots.length === 0 ? (
          <div className="p-3 text-center rounded-xl bg-[#101016] border border-[#1E1E28]">
            <Camera className="w-5 h-5 text-[#505060] mx-auto mb-1.5" />
            <p className="text-xs font-medium text-[#808090]">
              No custom camera shots saved yet
            </p>
            <p className="text-[10px] text-[#606070] mt-0.5">
              Orbit, pan or zoom around your scene, then click "Save View".
            </p>
          </div>
        ) : (
          cameraShots.map((shot, idx) => {
            const isActive = activeShotId === shot.id
            const isEditing = editingId === shot.id

            return (
              <div
                key={shot.id}
                onClick={() => !isEditing && onApplyCameraShot(shot)}
                className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E53935]/15 border-[#E53935]/50 shadow-sm'
                    : 'bg-[#12121A] hover:bg-[#1A1A24] border-[#1E1E2A] hover:border-[#2D2D3E]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold font-mono ${
                      isActive
                        ? 'bg-[#E53935] text-white'
                        : 'bg-[#20202E] text-[#808095] group-hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(shot.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        className="w-full bg-[#0A0A10] border border-[#E53935] rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(shot.id)}
                        className="p-1 rounded bg-[#E53935] text-white hover:bg-[#D32F2F] cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-[#D0D0DC] group-hover:text-white'}`}>
                          {shot.name}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-tight bg-[#E53935] text-white">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-[#606070] font-mono truncate">
                        Pos: [{shot.position.map(n => n.toFixed(1)).join(', ')}] • FOV: {shot.fov}°
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOverwriteCameraShot(shot.id)
                      }}
                      title="Update this shot with current viewport camera"
                      className="p-1.5 rounded-lg text-[#707080] hover:text-[#FFA000] hover:bg-[#FFA000]/15 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartRename(shot)
                      }}
                      title="Rename Shot"
                      className="p-1.5 rounded-lg text-[#707080] hover:text-white hover:bg-[#252535] transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteCameraShot(shot.id)
                      }}
                      title="Delete Shot"
                      className="p-1.5 rounded-lg text-[#707080] hover:text-[#EF5350] hover:bg-[#EF5350]/15 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer Navigation Help */}
      <div className="pt-2 border-t border-[#1E1E28] flex items-center justify-between text-[10px] text-[#707080]">
        <div className="flex items-center gap-1">
          <Compass className="w-3 h-3 text-[#3B82F6]" />
          <span>Orbit: Left-drag • Pan: Shift+drag</span>
        </div>
        <button
          onClick={onResetToDefaultView}
          className="text-[#808095] hover:text-white underline cursor-pointer"
        >
          Reset Front
        </button>
      </div>
    </div>
  )
}
