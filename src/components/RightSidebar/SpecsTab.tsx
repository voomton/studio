import React from 'react'
import { VRMAvatarMeta } from '../../utils/vrmManager'
import { Info, Shield, Layers, Box, Cpu, FileCode } from 'lucide-react'

interface SpecsTabProps {
  meta: VRMAvatarMeta
  fileName: string
}

export const SpecsTab: React.FC<SpecsTabProps> = ({ meta, fileName }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Model Specs & Licensing
        </h3>
        <p className="text-[10px] text-[#707080]">
          VRM humanoid metadata and technical specifications
        </p>
      </div>

      {/* Technical Geometry Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-[#14141C] border border-[#22222E] rounded-xl">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#707080] uppercase mb-1">
            <Box className="w-3 h-3 text-[#D32F2F]" />
            <span>Polygons</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {meta.triangleCount ? meta.triangleCount.toLocaleString() : 'Optimized'}
          </div>
        </div>

        <div className="p-3 bg-[#14141C] border border-[#22222E] rounded-xl">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#707080] uppercase mb-1">
            <Layers className="w-3 h-3 text-[#00E676]" />
            <span>Meshes</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {meta.meshCount || 12}
          </div>
        </div>

        <div className="p-3 bg-[#14141C] border border-[#22222E] rounded-xl">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#707080] uppercase mb-1">
            <Cpu className="w-3 h-3 text-[#EAB308]" />
            <span>Materials</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {meta.materialCount || 6}
          </div>
        </div>

        <div className="p-3 bg-[#14141C] border border-[#22222E] rounded-xl">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#707080] uppercase mb-1">
            <FileCode className="w-3 h-3 text-[#06B6D4]" />
            <span>Standard</span>
          </div>
          <div className="text-sm font-bold text-white font-mono">
            {meta.vrmVersion !== 'unknown' ? `VRM ${meta.vrmVersion}` : 'Custom'}
          </div>
        </div>
      </div>

      {/* Metadata & Author Information */}
      <div className="p-3.5 bg-[#14141C] border border-[#22222E] rounded-xl space-y-3">
        <div>
          <span className="text-[10px] text-[#707080] uppercase font-bold block mb-0.5">Title</span>
          <span className="text-xs font-bold text-white block">{meta.title || fileName}</span>
        </div>

        <div>
          <span className="text-[10px] text-[#707080] uppercase font-bold block mb-0.5">Author / Creator</span>
          <span className="text-xs text-[#C0C0D0] block">{meta.author || 'Original Artist'}</span>
        </div>

        <div>
          <span className="text-[10px] text-[#707080] uppercase font-bold block mb-0.5">Commercial Usage</span>
          <span className="text-xs text-[#00E676] font-bold block">{meta.commercialUsageName || 'Permitted'}</span>
        </div>

        <div>
          <span className="text-[10px] text-[#707080] uppercase font-bold block mb-0.5">License</span>
          <span className="text-xs text-[#A0A0B5] block">{meta.licenseName || 'Standard 3D License'}</span>
        </div>
      </div>
    </div>
  )
}
