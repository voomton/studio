import React, { useState } from 'react'
import { CharacterConfig } from '../types/character'
import { 
  X, 
  Download, 
  Image as ImageIcon, 
  FileCode, 
  Check, 
  Sparkles,
  Layers,
  Palette
} from 'lucide-react'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  config: CharacterConfig
  onCaptureScreenshot: (transparent?: boolean) => string
}

type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4'

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  config,
  onCaptureScreenshot
}) => {
  const [aspect, setAspect] = useState<AspectRatio>('1:1')
  const [bgMode, setBgMode] = useState<'studio' | 'transparent' | 'chroma'>('studio')
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const handleDownloadImage = () => {
    setIsExporting(true)
    setTimeout(() => {
      const dataUrl = onCaptureScreenshot(bgMode === 'transparent')
      if (dataUrl) {
        const downloadAnchor = document.createElement('a')
        downloadAnchor.setAttribute('href', dataUrl)
        downloadAnchor.setAttribute(
          'download',
          `${config.name.toLowerCase().replace(/\s+/g, '_')}_render_${aspect.replace(':', 'x')}.png`
        )
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
      }
      setIsExporting(false)
      onClose()
    }, 150)
  }

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${config.name.toLowerCase().replace(/\s+/g, '_')}_anime_avatar.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="flex flex-col w-full max-w-lg bg-[#121217] border border-[#2D2D35] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D35] bg-[#18181F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D32F2F]/20 border border-[#D32F2F]/40 flex items-center justify-center text-[#D32F2F]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Export & Render Character
              </h2>
              <p className="text-xs text-[#80808F]">
                Download high-resolution 2D renders or parametric 3D JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#80808F] hover:text-white hover:bg-[#26262E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 p-6">
          {/* Format Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F]">
              Image Background Canvas
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setBgMode('studio')}
                className={`py-2 px-3 rounded-md text-xs font-bold uppercase border transition-all ${
                  bgMode === 'studio'
                    ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                    : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
                }`}
              >
                Studio Scene
              </button>
              <button
                onClick={() => setBgMode('transparent')}
                className={`py-2 px-3 rounded-md text-xs font-bold uppercase border transition-all ${
                  bgMode === 'transparent'
                    ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                    : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
                }`}
              >
                Transparent PNG
              </button>
              <button
                onClick={() => setBgMode('chroma')}
                className={`py-2 px-3 rounded-md text-xs font-bold uppercase border transition-all ${
                  bgMode === 'chroma'
                    ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-sm'
                    : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
                }`}
              >
                Chroma Key
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-[#2D2D35]">
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{isExporting ? 'Capturing High-Res Frame...' : 'Download Rendered PNG'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#1E1E24] hover:bg-[#26262E] border border-[#2D2D35] text-[#E0E0E5] text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <FileCode className="w-4 h-4 text-[#80808F]" />
              <span>Export Character Config (.JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
