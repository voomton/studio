import React, { useState } from 'react'
import { CharacterConfig } from '../types/character'
import { PRESET_CHARACTERS } from '../utils/presets'
import { 
  X, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles, 
  Check, 
  Copy, 
  Edit3, 
  FolderPlus,
  Bookmark
} from 'lucide-react'

interface SavedCharactersModalProps {
  isOpen: boolean
  onClose: () => void
  currentCharacter: CharacterConfig
  savedList: CharacterConfig[]
  onSelectCharacter: (char: CharacterConfig) => void
  onDeleteCharacter: (id: string) => void
  onSaveCurrent: (name: string) => void
  onImportCharacter: (config: CharacterConfig) => void
}

export const SavedCharactersModal: React.FC<SavedCharactersModalProps> = ({
  isOpen,
  onClose,
  currentCharacter,
  savedList,
  onSelectCharacter,
  onDeleteCharacter,
  onSaveCurrent,
  onImportCharacter
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'presets'>('saved')
  const [saveName, setSaveName] = useState(currentCharacter.name)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleExportJSON = (char: CharacterConfig) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(char, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${char.name.toLowerCase().replace(/\s+/g, '_')}_anime_avatar.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (parsed.body && parsed.hair && parsed.face) {
          onImportCharacter(parsed)
        }
      } catch (err) {
        console.error('Failed to parse character JSON', err)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="flex flex-col w-full max-w-2xl max-h-[85vh] bg-[#121217] border border-[#2D2D35] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D35] bg-[#18181F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D32F2F]/20 border border-[#D32F2F]/40 flex items-center justify-center text-[#D32F2F]">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Character Roster & Library
              </h2>
              <p className="text-xs text-[#80808F]">
                Load presets, view your creations, or backup configuration files
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

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-[#2D2D35] bg-[#14141A]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'saved'
                  ? 'bg-[#D32F2F] text-white shadow-sm'
                  : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
              }`}
            >
              My Characters ({savedList.length})
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'presets'
                  ? 'bg-[#D32F2F] text-white shadow-sm'
                  : 'text-[#80808F] hover:text-white hover:bg-[#1E1E24]'
              }`}
            >
              Studio Presets ({PRESET_CHARACTERS.length})
            </button>
          </div>

          <label className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1E1E24] hover:bg-[#26262E] text-xs text-[#B0B0BF] border border-[#2D2D35] cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'saved' ? (
            <div className="flex flex-col gap-4">
              {/* Quick Save Current Bar */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#18181F] border border-[#2D2D35]">
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="Enter character name..."
                  className="flex-1 px-3 py-1.5 rounded bg-[#121217] border border-[#2D2D35] text-xs text-white placeholder-[#50505F] focus:outline-none focus:border-[#D32F2F]"
                />
                <button
                  onClick={() => {
                    onSaveCurrent(saveName || 'Anime_Avatar')
                    setIsSaving(true)
                    setTimeout(() => setIsSaving(false), 1500)
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#D32F2F] hover:bg-[#B71C1C] text-xs font-bold uppercase tracking-wider text-white transition-colors"
                >
                  {isSaving ? <Check className="w-3.5 h-3.5" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Saved!' : 'Save Current'}</span>
                </button>
              </div>

              {/* Saved List Grid */}
              {savedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[#50505F]">
                  <Bookmark className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No saved characters yet.</p>
                  <p className="text-xs text-[#80808F]">Customize your avatar and click "Save Current" above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {savedList.map(char => (
                    <div
                      key={char.id}
                      className="group flex flex-col justify-between p-3 rounded-lg bg-[#18181F] border border-[#2D2D35] hover:border-[#D32F2F]/60 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white truncate">{char.name}</span>
                          <span className="text-[10px] font-mono text-[#80808F] uppercase">
                            {char.gender}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#26262E] text-[#B0B0BF]">
                            {char.hair.style.replace('_', ' ')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#26262E] text-[#B0B0BF]">
                            {char.outfit.style.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#26262E]">
                        <button
                          onClick={() => {
                            onSelectCharacter(char)
                            onClose()
                          }}
                          className="flex-1 py-1 rounded bg-[#D32F2F]/20 hover:bg-[#D32F2F] text-[#D32F2F] hover:text-white text-[11px] font-bold uppercase transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleExportJSON(char)}
                          title="Export as JSON"
                          className="p-1 rounded text-[#80808F] hover:text-white hover:bg-[#26262E]"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCharacter(char.id)}
                          title="Delete"
                          className="p-1 rounded text-[#80808F] hover:text-[#EF4444] hover:bg-[#26262E]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_CHARACTERS.map(preset => (
                <div
                  key={preset.id}
                  className="group flex flex-col justify-between p-3 rounded-lg bg-[#18181F] border border-[#2D2D35] hover:border-[#D32F2F]/60 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">{preset.name}</span>
                      <span className="text-[10px] font-mono text-[#D32F2F] uppercase">
                        {preset.body.build}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#26262E] text-[#B0B0BF]">
                        {preset.hair.style.replace('_', ' ')}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#26262E] text-[#B0B0BF]">
                        {preset.outfit.style.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#26262E]">
                    <button
                      onClick={() => {
                        onSelectCharacter(preset)
                        onClose()
                      }}
                      className="flex-1 py-1 rounded bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                    >
                      Load Preset
                    </button>
                    <button
                      onClick={() => handleExportJSON(preset)}
                      title="Export as JSON"
                      className="p-1 rounded text-[#80808F] hover:text-white hover:bg-[#26262E]"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
