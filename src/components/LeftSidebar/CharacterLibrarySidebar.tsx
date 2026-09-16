import React, { useState } from 'react'
import { SavedCharacterRecord } from '../../utils/vrmManager'
import { 
  Plus, 
  Upload, 
  Copy, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  Search,
  Eye,
  EyeOff,
  User,
  Users
} from 'lucide-react'

interface CharacterLibrarySidebarProps {
  className?: string
  characters: SavedCharacterRecord[]
  activeCharacterId: string
  hasUnsavedChanges: boolean
  viewportHiddenCharacterIds?: string[]
  onSelectCharacter: (char: SavedCharacterRecord) => void
  onCreateNew: (templateType: 'female_mage' | 'male_warrior' | 'female_idol' | 'custom_empty') => void
  onUploadClick: () => void
  onDuplicateCharacter?: (charId: string) => void
  onDeleteCharacter: (charId: string) => void
  onRenameCharacter?: (charId: string, newName: string) => void
  onToggleViewportVisibility?: (charId: string) => void
}

export const CharacterLibrarySidebar: React.FC<CharacterLibrarySidebarProps> = ({
  className,
  characters = [],
  activeCharacterId = '',
  hasUnsavedChanges = false,
  viewportHiddenCharacterIds = [],
  onSelectCharacter,
  onCreateNew,
  onUploadClick,
  onDuplicateCharacter,
  onDeleteCharacter,
  onRenameCharacter,
  onToggleViewportVisibility
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filteredCharacters = (characters || []).filter(c => 
    c && c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartRename = (char: SavedCharacterRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(char.id)
    setEditNameValue(char.name)
  }

  const handleSaveRename = (charId: string, e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation()
    if (editNameValue.trim()) {
      onRenameCharacter?.(charId, editNameValue.trim())
    }
    setEditingId(null)
  }

  // Format date readable
  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Recent'
    const diffHours = Math.floor((Date.now() - timestamp) / 3600000)
    if (diffHours <= 0) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const days = Math.floor(diffHours / 24)
    return `${days}d ago`
  }

  return (
    <aside 
      id="character-library-sidebar"
      className={className || "w-72 shrink-0 flex flex-col h-full bg-[#1F1930] border-r border-[#2E2548] select-none z-20 overflow-hidden"}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[#2E2548] flex items-center justify-between bg-[#1A1429]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EC4899]/15 border border-[#EC4899]/30 flex items-center justify-center text-[#EC4899]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F8F8FC]">
              Character Library
            </h2>
            <span className="text-[10px] text-[#A09BB5] font-mono">
              {(characters || []).length} Characters
            </span>
          </div>
        </div>

        {/* New Character Button */}
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            id="btn-new-character"
            title="Add New Character"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#EC4899] to-[#A855F7] hover:from-[#F43F5E] hover:to-[#9333EA] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#EC4899]/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          {/* New Character Presets Dropdown */}
          {showNewMenu && (
            <div 
              className="absolute right-0 top-full mt-1.5 w-52 bg-[#1A1429] border border-[#3E325E] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setShowNewMenu(false)}
            >
              <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8A81A6]">
                Select Base Rig Template
              </div>
              
              <button
                onClick={() => onCreateNew('female_mage')}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-[#F8F8FC] hover:bg-[#271F3D] flex items-center justify-between cursor-pointer"
              >
                <span>Noble Anime Mage</span>
                <span className="text-[9px] text-[#EC4899] font-bold">Female</span>
              </button>

              <button
                onClick={() => onCreateNew('male_warrior')}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-[#F8F8FC] hover:bg-[#271F3D] flex items-center justify-between cursor-pointer"
              >
                <span>Cyber Blade Hero</span>
                <span className="text-[9px] text-[#38BDF8] font-bold">Male</span>
              </button>

              <button
                onClick={() => onCreateNew('female_idol')}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-[#F8F8FC] hover:bg-[#271F3D] flex items-center justify-between cursor-pointer"
              >
                <span>Idol Pop Star</span>
                <span className="text-[9px] text-[#A855F7] font-bold">Female</span>
              </button>

              <div className="my-1 border-t border-[#2E2548]" />

              <button
                onClick={() => {
                  setShowNewMenu(false)
                  onUploadClick()
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-[#A09BB5] hover:bg-[#271F3D] hover:text-white flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#EC4899]" />
                <span>Upload .VRM / .GLB</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-[#2E2548] bg-[#1F1930]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A81A6]" />
          <input
            type="text"
            placeholder="Search characters..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#16121E] border border-[#2E2548] rounded-lg text-xs text-[#F8F8FC] placeholder-[#706B85] focus:outline-none focus:border-[#EC4899] transition-all"
          />
        </div>
      </div>

      {/* Character Cards List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar bg-[#1F1930]">
        {filteredCharacters.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-[#28203F] border border-[#3E325E] flex items-center justify-center text-[#A09BB5] mb-3 shadow-inner">
              <User className="w-6 h-6 text-[#A09BB5]/60" />
            </div>
            <p className="text-xs font-bold text-[#F8F8FC] mb-1">
              {searchQuery ? 'No matching characters' : '0 Characters in Library'}
            </p>
            <p className="text-[11px] text-[#8A81A6] mb-5 max-w-[190px] leading-relaxed">
              {searchQuery 
                ? 'Try searching with a different character name.' 
                : 'Your library is empty. Click below to create your first character or import a VRM avatar.'}
            </p>
            {!searchQuery && (
              <div className="flex flex-col gap-2 w-full max-w-[190px]">
                <button
                  onClick={() => onCreateNew('female_mage')}
                  id="btn-empty-new-character"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#EC4899] to-[#A855F7] hover:from-[#F43F5E] hover:to-[#9333EA] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#EC4899]/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Character</span>
                </button>
                <button
                  onClick={onUploadClick}
                  id="btn-empty-upload-vrm"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#271F3D] hover:bg-[#32274F] text-[#E2DCF0] hover:text-white border border-[#3E325E] text-xs font-semibold transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Upload VRM</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredCharacters.map(char => {
          const isActive = char.id === activeCharacterId
          const isEditing = editingId === char.id
          const isDeleting = deleteConfirmId === char.id
          const isHidden = viewportHiddenCharacterIds.includes(char.id)

          // Stylized character gradient based on template or name
          const avatarGradient = char.templateType === 'male_warrior'
            ? 'from-blue-600 to-indigo-700'
            : char.templateType === 'female_idol'
            ? 'from-pink-500 to-rose-600'
            : 'from-purple-600 to-pink-600'

          return (
            <div
              key={char.id}
              id={`char-card-${char.id}`}
              onClick={() => onSelectCharacter(char)}
              className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-2 border-[#EC4899] bg-[#271F3D] shadow-lg shadow-[#EC4899]/15'
                  : 'bg-[#191426] border-[#2E2548] hover:bg-[#221A33] hover:border-[#3E325E]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Character Thumbnail / Stylized Avatar */}
                <div 
                  className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border relative overflow-hidden bg-gradient-to-br ${avatarGradient} ${
                    isActive 
                      ? 'border-[#EC4899] shadow-md shadow-[#EC4899]/20 text-white' 
                      : 'border-[#3E325E] text-white/90'
                  }`}
                >
                  {/* Subtle anime silhouette head outline */}
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white/30 absolute" fill="currentColor">
                    <path d="M12 2a5 5 0 0 0-5 5c0 2.5 1.5 4.5 4 4.9V14h2v-2.1c2.5-.4 4-2.4 4-4.9a5 5 0 0 0-5-5zM6 18c0-2.2 4-3.5 6-3.5s6 1.3 6 3.5v2H6v-2z" />
                  </svg>
                  <span className="relative z-10 text-white font-black drop-shadow">
                    {char.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name, Info Tag & Date */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <form 
                      onSubmit={(e) => handleSaveRename(char.id, e)} 
                      className="flex items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        className="w-full px-2 py-0.5 bg-[#16121E] border border-[#EC4899] rounded text-xs text-[#F8F8FC] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 rounded bg-[#EC4899] text-white hover:bg-[#DB2777]"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-[#F8F8FC]' : 'text-[#E2DCF0] group-hover:text-white'
                      }`}>
                        {char.name}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#16121E] text-[#EC4899] border border-[#3E325E]">
                      {char.isDefaultTemplate ? 'Anime Rig' : 'VRM 1.0'}
                    </span>
                    <span className="text-[10px] text-[#8A81A6] font-mono">
                      {formatTimeAgo(char.updatedAt || char.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Icons: View, Edit, Duplicate, Delete */}
              <div 
                className="flex items-center justify-end gap-1 mt-2 pt-1.5 border-t border-[#2E2548]/60"
                onClick={e => e.stopPropagation()}
              >
                {/* View / Toggle Viewport */}
                <button
                  onClick={() => onToggleViewportVisibility?.(char.id)}
                  title={isHidden ? 'Show in Viewport' : 'Hide from Viewport'}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    isHidden
                      ? 'text-[#8A81A6] hover:text-[#EC4899]'
                      : 'text-[#EC4899] hover:bg-[#2E2548]'
                  }`}
                >
                  {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                {/* Edit / Rename */}
                <button
                  onClick={e => handleStartRename(char, e)}
                  title="Rename Character"
                  className="p-1 rounded-md text-[#8A81A6] hover:text-white hover:bg-[#2E2548] transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Duplicate */}
                <button
                  onClick={() => onDuplicateCharacter?.(char.id)}
                  title="Duplicate Character"
                  className="p-1 rounded-md text-[#8A81A6] hover:text-white hover:bg-[#2E2548] transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                {isDeleting ? (
                  <div className="flex items-center gap-1 bg-[#271F3D] px-1 py-0.5 rounded border border-rose-500/50">
                    <span className="text-[9px] text-rose-400 font-bold">Delete?</span>
                    <button
                      onClick={() => onDeleteCharacter(char.id)}
                      className="px-1 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-1 py-0.5 rounded bg-[#16121E] text-[#A09BB5] text-[9px]"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(char.id)}
                    title="Delete Character"
                    className="p-1 rounded-md text-[#8A81A6] hover:text-rose-400 hover:bg-[#2E2548] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
      </div>
    </aside>
  )
}
