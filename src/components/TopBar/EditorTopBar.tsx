import React from 'react'
import { 
  CloudCheck, 
  Upload, 
  User, 
  Film, 
  ChevronDown,
  Check,
  Clapperboard,
  Box
} from 'lucide-react'
import { EditorMode } from '../../types/scene'

interface EditorTopBarProps {
  projectName?: string
  sceneName?: string
  characterName: string
  hasUnsavedChanges: boolean
  isAutosaving?: boolean
  canUndo?: boolean
  canRedo?: boolean
  editorMode: EditorMode
  isPlayingAnimation?: boolean
  isFullscreen?: boolean
  onModeChange: (mode: EditorMode) => void
  onProjectNameChange?: (name: string) => void
  onNameChange: (newName: string) => void
  onSave: () => void
  onExportClick: () => void
  onRenderClick?: () => void
  onPreviewToggle?: () => void
  onSettingsClick?: () => void
  onFullscreenToggle?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onReset?: () => void
  onUploadClick: () => void
  workspaceControls?: React.ReactNode
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  projectName = 'My Manga Project',
  sceneName = 'Scene 01',
  characterName,
  hasUnsavedChanges,
  isAutosaving = false,
  editorMode = 'character',
  onModeChange,
  onProjectNameChange,
  onSave,
  onUploadClick
}) => {
  return (
    <header 
      id="main-top-navbar"
      className="h-14 bg-[#1F1930] border-b border-[#2E2548] flex items-center justify-between px-4 select-none z-30 shrink-0"
    >
      {/* Top Left: VoomToon Studio Branding & Project Selector */}
      <div className="flex items-center gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#EC4899] via-[#D946EF] to-[#8B5CF6] flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#EC4899]/25 group-hover:scale-105 transition-transform">
            V
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-sm font-black tracking-wider text-[#F8F8FC]">
                VoomToon Studio
              </span>
            </div>
            <p className="text-[10px] text-[#A09BB5] font-medium leading-none mt-0.5">
              3D Character & Scene Studio
            </p>
          </div>
        </div>

        <div className="h-5 w-px bg-[#2E2548]" />

        {/* Project Selector: "Project: My Manga Project" */}
        <div className="flex items-center gap-2 bg-[#271F3D] px-3 py-1.5 rounded-lg border border-[#3E325E] hover:border-[#EC4899]/50 transition-colors">
          <Film className="w-3.5 h-3.5 text-[#EC4899]" />
          <span className="text-xs text-[#A09BB5] font-medium">Project:</span>
          <input
            type="text"
            value={projectName}
            onChange={e => onProjectNameChange?.(e.target.value)}
            title="Project Name"
            placeholder="My Manga Project"
            className="bg-transparent text-xs font-bold text-[#F8F8FC] focus:outline-none w-36 hover:text-white"
          />
          <ChevronDown className="w-3 h-3 text-[#8A81A6]" />
        </div>
      </div>

      {/* Top Center: Main Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-[#16121E] p-1 rounded-xl border border-[#2E2548]">
        {/* 1. Character Editor */}
        <button
          onClick={() => onModeChange('character')}
          id="nav-character-editor"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            editorMode === 'character'
              ? 'bg-[#271F3D] text-[#EC4899] border border-[#EC4899]/40 shadow-sm shadow-[#EC4899]/10'
              : 'text-[#A09BB5] hover:text-[#F8F8FC] hover:bg-[#201A30]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>1. Character Editor</span>
        </button>

        {/* 2. Scene Builder */}
        <button
          onClick={() => onModeChange('scene')}
          id="nav-scene-builder"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            editorMode === 'scene'
              ? 'border border-[#8C7BFF] bg-[#8C7BFF]/25 text-white shadow-sm shadow-[#8C7BFF]/20'
              : 'text-[#A09BB5] hover:text-[#F8F8FC] hover:bg-[#201A30]'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>2. Scene Builder</span>
        </button>

        {/* 3. Animation & Cinema */}
        <button
          onClick={() => onModeChange('animation')}
          id="nav-animation-cinema"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            editorMode === 'animation'
              ? 'border border-[#8C7BFF] bg-[#8C7BFF]/25 text-white shadow-sm shadow-[#8C7BFF]/20'
              : 'text-[#A09BB5] hover:text-[#F8F8FC] hover:bg-[#201A30]'
          }`}
        >
          <Clapperboard className="w-3.5 h-3.5" />
          <span>3. Animation & Cinema</span>
        </button>
      </nav>

      {/* Top Right: Cloud/Save status, Upload VRM button, User Profile icon */}
      <div className="flex items-center gap-3">
        {/* Cloud / Save Status */}
        <button
          onClick={onSave}
          title="Save Project Changes (Ctrl + S)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#271F3D] border border-[#3E325E] text-xs font-medium text-[#A09BB5] hover:text-[#F8F8FC] transition-colors cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-[#F8F8FC]">Saved</span>
        </button>

        {/* Upload VRM Button */}
        <button
          onClick={onUploadClick}
          id="btn-upload-vrm-top"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#EC4899] to-[#A855F7] hover:from-[#F43F5E] hover:to-[#9333EA] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#EC4899]/20"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload VRM</span>
        </button>

        {/* User / Profile Icon */}
        <div 
          title="User Account"
          className="w-9 h-9 rounded-full bg-[#271F3D] border border-[#3E325E] hover:border-[#EC4899] flex items-center justify-center text-[#F8F8FC] cursor-pointer transition-colors"
        >
          <User className="w-4 h-4 text-[#A09BB5]" />
        </div>
      </div>
    </header>
  )
}
