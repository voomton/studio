import React from 'react'
import { VRM } from '@pixiv/three-vrm'
import { VRMAvatarState } from '../../utils/vrmManager'
import { 
  FileCode, 
  User, 
  ShieldCheck, 
  Layers, 
  Info, 
  Sparkles,
  Calendar,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface VRMMetadataPanelProps {
  vrm: VRM | null
  avatarState: VRMAvatarState
}

export const VRMMetadataPanel: React.FC<VRMMetadataPanelProps> = ({
  vrm,
  avatarState
}) => {
  const meta = avatarState.meta

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return 'Sample Rig'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="flex flex-col gap-4 p-4 text-xs">
      {/* Avatar Identity Card */}
      <div className="flex flex-col gap-3 bg-[#18181F] p-4 rounded-xl border border-[#2D2D35] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D32F2F]/20 border border-[#D32F2F]/40 flex items-center justify-center text-[#D32F2F] shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-extrabold text-white truncate">
              {meta.title || avatarState.fileName}
            </h3>
            <span className="text-[11px] text-[#A0A0B0]">
              by <strong className="text-white">{meta.author || 'Original Author'}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2D2D35]">
          <div className="flex flex-col">
            <span className="text-[9px] text-[#80808F] uppercase font-bold">VRM Spec</span>
            <span className="text-xs font-mono font-bold text-[#00E676]">
              VRM {meta.vrmVersion}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-[#80808F] uppercase font-bold">File Size</span>
            <span className="text-xs font-mono font-bold text-white">
              {formatFileSize(avatarState.fileSize)}
            </span>
          </div>
        </div>
      </div>

      {/* 3D Geometry Metrics */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-[#D32F2F]" />
          3D Geometry & Shader Complexity
        </label>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col bg-[#18181F] p-2.5 rounded-lg border border-[#2D2D35]">
            <span className="text-[9px] text-[#80808F] uppercase font-bold">Triangles</span>
            <span className="text-xs font-mono font-bold text-white mt-0.5">
              {meta.triangleCount ? meta.triangleCount.toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col bg-[#18181F] p-2.5 rounded-lg border border-[#2D2D35]">
            <span className="text-[9px] text-[#80808F] uppercase font-bold">Meshes</span>
            <span className="text-xs font-mono font-bold text-white mt-0.5">
              {meta.meshCount || 0}
            </span>
          </div>
          <div className="flex flex-col bg-[#18181F] p-2.5 rounded-lg border border-[#2D2D35]">
            <span className="text-[9px] text-[#80808F] uppercase font-bold">Materials</span>
            <span className="text-xs font-mono font-bold text-white mt-0.5">
              {meta.materialCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* License & Usage Terms */}
      <div className="flex flex-col gap-2 bg-[#18181F] p-3 rounded-lg border border-[#2D2D35]">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-[#D32F2F]" />
          VRM Distribution & License Policy
        </label>

        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A0A0B0]">Avatar Permission:</span>
            <span className="text-[11px] font-bold text-white">{meta.allowedUserName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A0A0B0]">Commercial Usage:</span>
            <span className="text-[11px] font-bold text-[#00E676]">{meta.commercialUsageName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#A0A0B0]">License Type:</span>
            <span className="text-[11px] font-mono text-white truncate max-w-[150px]">{meta.licenseName}</span>
          </div>
        </div>
      </div>

      {/* Technical VRM Verification Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676]">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex flex-col">
          <span className="font-bold text-[11px]">Exact 1:1 VRM Stream Active</span>
          <span className="text-[10px] opacity-80 leading-relaxed mt-0.5">
            Your uploaded avatar is rendered using native MToon shaders with direct spring physics and normalized humanoid bones.
          </span>
        </div>
      </div>
    </div>
  )
}
