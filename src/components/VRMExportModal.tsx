import React, { useState } from 'react'
import { 
  X, 
  Download, 
  Image, 
  FileBox, 
  FileCode, 
  Check, 
  Sparkles,
  Camera,
  Layers
} from 'lucide-react'
import { exportSceneAsGLB, downloadRawVRM, VRMAvatarState } from '../utils/vrmManager'
import { idbGetVrm } from '../utils/vrmStorage'
import * as THREE from 'three'

interface VRMExportModalProps {
  isOpen: boolean
  onClose: () => void
  avatarState: VRMAvatarState
  rawVrmBuffer: ArrayBuffer | null
  getVRMScene: () => THREE.Group | null
  takeScreenshot: (resolution?: '1080p' | '2k' | '4k', transparent?: boolean) => string
}

export const VRMExportModal: React.FC<VRMExportModalProps> = ({
  isOpen,
  onClose,
  avatarState,
  rawVrmBuffer,
  getVRMScene,
  takeScreenshot
}) => {
  const [exportingType, setExportingType] = useState<string | null>(null)
  const [photoResolution, setPhotoResolution] = useState<'1080p' | '2k' | '4k'>('1080p')
  const [transparentBg, setTransparentBg] = useState(false)
  const [exportedSuccess, setExportedSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  // 1. Export 1:1 .VRM File
  const handleExportVRM = async () => {
    setExportingType('vrm')
    try {
      let bufferToDownload = rawVrmBuffer
      if (!bufferToDownload) {
        bufferToDownload = await idbGetVrm(avatarState.id)
      }

      if (bufferToDownload) {
        const safeName = (avatarState.meta.title || avatarState.fileName || 'character').replace(/[^a-zA-Z0-9_-]/g, '_')
        downloadRawVRM(bufferToDownload, `${safeName}.vrm`)
        setExportedSuccess('VRM downloaded successfully!')
      } else {
        // Procedural scene fallback export
        const scene = getVRMScene()
        if (scene) {
          const safeName = (avatarState.meta.title || 'character').replace(/[^a-zA-Z0-9_-]/g, '_')
          await exportSceneAsGLB(scene, `${safeName}.glb`)
          setExportedSuccess('3D Model exported as GLB!')
        }
      }
    } catch (err) {
      console.error('Export VRM error:', err)
    } finally {
      setExportingType(null)
      setTimeout(() => setExportedSuccess(null), 3500)
    }
  }

  // 2. Export .GLB Model
  const handleExportGLB = async () => {
    setExportingType('glb')
    try {
      const scene = getVRMScene()
      if (scene) {
        const safeName = (avatarState.meta.title || avatarState.fileName || 'avatar').replace(/[^a-zA-Z0-9_-]/g, '_')
        await exportSceneAsGLB(scene, `${safeName}.glb`)
        setExportedSuccess('GLB model exported successfully!')
      }
    } catch (err) {
      console.error('Export GLB error:', err)
    } finally {
      setExportingType(null)
      setTimeout(() => setExportedSuccess(null), 3500)
    }
  }

  // 3. Export High-Res PNG
  const handleExportPNG = () => {
    setExportingType('png')
    try {
      const dataUrl = takeScreenshot(photoResolution, transparentBg)
      if (dataUrl) {
        const a = document.createElement('a')
        a.href = dataUrl
        const safeName = (avatarState.meta.title || 'avatar').replace(/[^a-zA-Z0-9_-]/g, '_')
        a.download = `${safeName}_${photoResolution}${transparentBg ? '_alpha' : ''}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setExportedSuccess(`PNG snapshot (${photoResolution}) saved!`)
      }
    } catch (err) {
      console.error('PNG export error:', err)
    } finally {
      setExportingType(null)
      setTimeout(() => setExportedSuccess(null), 3500)
    }
  }

  // 4. Export Pose JSON
  const handleExportPoseJSON = () => {
    const poseData = {
      character: avatarState.meta.title || avatarState.fileName,
      timestamp: Date.now(),
      proportions: avatarState.proportions,
      boneRotations: avatarState.boneRotations,
      expressions: avatarState.expressions,
      materials: avatarState.materials
    }
    const blob = new Blob([JSON.stringify(poseData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(avatarState.meta.title || 'character').replace(/[^a-zA-Z0-9_-]/g, '_')}_pose.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExportedSuccess('Pose JSON exported!')
    setTimeout(() => setExportedSuccess(null), 3500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121217] border border-[#2B2B38] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#22222D]">
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-[#D32F2F]" />
              <span>Export Character Assets</span>
            </h2>
            <p className="text-xs text-[#707080] mt-0.5">
              Production ready 3D models, high-res renders, and pose presets
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#707080] hover:text-white hover:bg-[#1E1E28] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {exportedSuccess && (
          <div className="my-4 p-3 bg-[#00E676]/15 border border-[#00E676]/30 rounded-xl flex items-center gap-2 text-xs font-bold text-[#00E676] animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{exportedSuccess}</span>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="space-y-3 my-5">
          {/* 1. VRM Download */}
          <div className="p-3.5 bg-[#161620] border border-[#252534] rounded-xl flex items-center justify-between hover:border-[#38384C] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D32F2F]/20 border border-[#D32F2F]/40 flex items-center justify-center text-[#D32F2F]">
                <FileBox className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Universal .VRM Avatar</h3>
                <p className="text-[10px] text-[#707080]">1:1 byte-exact 3D model with full metadata</p>
              </div>
            </div>
            <button
              onClick={handleExportVRM}
              disabled={exportingType === 'vrm'}
              className="px-3 py-1.5 rounded-lg bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold uppercase tracking-tight transition-all cursor-pointer shadow-sm"
            >
              {exportingType === 'vrm' ? 'Exporting...' : 'Download'}
            </button>
          </div>

          {/* 2. GLB Model */}
          <div className="p-3.5 bg-[#161620] border border-[#252534] rounded-xl flex items-center justify-between hover:border-[#38384C] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/20 border border-[#0EA5E9]/40 flex items-center justify-center text-[#0EA5E9]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">3D .GLB Scene Model</h3>
                <p className="text-[10px] text-[#707080]">For Blender, Unity, Unreal Engine & Godot</p>
              </div>
            </div>
            <button
              onClick={handleExportGLB}
              disabled={exportingType === 'glb'}
              className="px-3 py-1.5 rounded-lg bg-[#1E1E2A] hover:bg-[#282838] border border-[#303042] text-white text-xs font-bold uppercase tracking-tight transition-all cursor-pointer"
            >
              {exportingType === 'glb' ? 'Exporting...' : 'Export GLB'}
            </button>
          </div>

          {/* 3. High-Res PNG Snapshot */}
          <div className="p-3.5 bg-[#161620] border border-[#252534] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EC4899]/20 border border-[#EC4899]/40 flex items-center justify-center text-[#EC4899]">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">High-Res PNG Snapshot</h3>
                  <p className="text-[10px] text-[#707080]">For manga panels, comics, and thumbnails</p>
                </div>
              </div>
              <button
                onClick={handleExportPNG}
                disabled={exportingType === 'png'}
                className="px-3 py-1.5 rounded-lg bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold uppercase tracking-tight transition-all cursor-pointer shadow-sm"
              >
                {exportingType === 'png' ? 'Capturing...' : 'Capture PNG'}
              </button>
            </div>

            {/* Resolution and Alpha options */}
            <div className="flex items-center justify-between pt-2 border-t border-[#22222E]">
              <div className="flex items-center gap-1 bg-[#101016] p-0.5 rounded-lg border border-[#22222E]">
                {(['1080p', '2k', '4k'] as const).map(res => (
                  <button
                    key={res}
                    onClick={() => setPhotoResolution(res)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      photoResolution === res
                        ? 'bg-[#EC4899] text-white'
                        : 'text-[#808090] hover:text-white'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-[#A0A0B0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={e => setTransparentBg(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#EC4899]"
                />
                <span>Transparent Alpha</span>
              </label>
            </div>
          </div>

          {/* 4. Pose JSON */}
          <div className="p-3.5 bg-[#161620] border border-[#252534] rounded-xl flex items-center justify-between hover:border-[#38384C] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAB308]/20 border border-[#EAB308]/40 flex items-center justify-center text-[#EAB308]">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Pose & Rigging Data (.JSON)</h3>
                <p className="text-[10px] text-[#707080]">Joint angle coordinates & blendshapes</p>
              </div>
            </div>
            <button
              onClick={handleExportPoseJSON}
              className="px-3 py-1.5 rounded-lg bg-[#1E1E2A] hover:bg-[#282838] border border-[#303042] text-white text-xs font-bold uppercase tracking-tight transition-all cursor-pointer"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1A1A24] hover:bg-[#222230] text-xs font-bold text-[#A0A0B0] hover:text-white transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
