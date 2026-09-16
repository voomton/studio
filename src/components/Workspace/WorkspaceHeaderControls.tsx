import React, { useState, useRef, useEffect } from 'react'
import { 
  Layout, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Command, 
  SlidersHorizontal, 
  Plus, 
  Save, 
  Trash2, 
  Check, 
  Sidebar, 
  Sparkles,
  Clapperboard,
  User,
  Camera,
  Volume2,
  Video
} from 'lucide-react'
import { WorkspacePresetName, WorkspaceLayout, PanelId, PANEL_DEFINITIONS } from '../../types/workspace'

interface WorkspaceHeaderControlsProps {
  activePreset: WorkspacePresetName
  onSelectPreset: (preset: WorkspacePresetName) => void
  onResetLayout: () => void
  onSaveCustomPreset: (name: string) => void
  customPresets: Array<{ id: string; name: string; layout: WorkspaceLayout }>
  onDeleteCustomPreset: (id: string) => void
  onToggleFocusMode: () => void
  isFocusMode: boolean
  onOpenCommandPalette: () => void
  onToggleToolShelf: () => void
  showToolShelf: boolean
  mode: 'beginner' | 'pro'
  onToggleMode: () => void
  allPanels: PanelId[]
  openPanelIds: PanelId[]
  onOpenPanel: (panelId: PanelId) => void
}

const PRESET_ICONS: Record<string, any> = {
  animation: Clapperboard,
  character: User,
  cinematic: Camera,
  audio: Volume2,
  render: Video,
  custom: Layout
}

export const WorkspaceHeaderControls: React.FC<WorkspaceHeaderControlsProps> = ({
  activePreset,
  onSelectPreset,
  onResetLayout,
  onSaveCustomPreset,
  customPresets = [],
  onDeleteCustomPreset,
  onToggleFocusMode,
  isFocusMode,
  onOpenCommandPalette,
  onToggleToolShelf,
  showToolShelf,
  mode,
  onToggleMode,
  allPanels = [],
  openPanelIds = [],
  onOpenPanel
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false)
  const [showPanelsMenu, setShowPanelsMenu] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [isSavingPreset, setIsSavingPreset] = useState(false)

  const presetsMenuRef = useRef<HTMLDivElement>(null)
  const panelsMenuRef = useRef<HTMLDivElement>(null)

  // Click outside listener
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (presetsMenuRef.current && !presetsMenuRef.current.contains(e.target as Node)) {
        setShowPresetsMenu(false)
        setIsSavingPreset(false)
      }
      if (panelsMenuRef.current && !panelsMenuRef.current.contains(e.target as Node)) {
        setShowPanelsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const closedPanels = (allPanels || []).filter(p => !(openPanelIds || []).includes(p))

  const handleSave = () => {
    if (!newPresetName.trim()) return
    onSaveCustomPreset(newPresetName.trim())
    setNewPresetName('')
    setIsSavingPreset(false)
  }

  const PresetIcon = PRESET_ICONS[activePreset] || Layout

  return (
    <div className="flex items-center gap-1.5 select-none">
      {/* Workspace Presets Menu */}
      <div className="relative" ref={presetsMenuRef}>
        <button
          onClick={() => setShowPresetsMenu(prev => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181824] hover:bg-[#202032] border border-[#2B2B3E] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          title="Workspace Layout Presets"
        >
          <PresetIcon className="w-3.5 h-3.5 text-[#00E676]" />
          <span className="capitalize">{activePreset} Workspace</span>
        </button>

        {showPresetsMenu && (
          <div className="absolute left-0 top-full mt-1.5 w-60 bg-[#12121D] border border-[#2B2B3E] rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#707085] px-2 py-1">
              Studio Layouts
            </div>

            {(['animation', 'character', 'cinematic', 'audio', 'render'] as WorkspacePresetName[]).map(p => {
              const Icon = PRESET_ICONS[p]
              const isCurrent = activePreset === p

              return (
                <button
                  key={p}
                  onClick={() => {
                    onSelectPreset(p)
                    setShowPresetsMenu(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#00E676]/15 text-[#00E676]'
                      : 'text-[#C0C0D0] hover:bg-[#1C1C2A] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="capitalize">{p}</span>
                  </div>
                  {isCurrent && <Check className="w-3.5 h-3.5" />}
                </button>
              )
            })}

            {/* Custom Presets Section */}
            {customPresets.length > 0 && (
              <>
                <div className="border-t border-[#202030] my-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-[#707085] px-2">
                  My Custom Layouts
                </div>
                {customPresets.map(cp => (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between px-2.5 py-1 rounded-lg hover:bg-[#1C1C2A] group"
                  >
                    <button
                      onClick={() => {
                        onSelectPreset('custom')
                        setShowPresetsMenu(false)
                      }}
                      className="text-xs text-[#C0C0D0] group-hover:text-white truncate text-left cursor-pointer flex-1"
                    >
                      {cp.name}
                    </button>
                    <button
                      onClick={() => onDeleteCustomPreset(cp.id)}
                      title="Delete Preset"
                      className="p-1 rounded text-[#707085] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Save Current Layout */}
            <div className="border-t border-[#202030] mt-2 pt-2">
              {isSavingPreset ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Preset name..."
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    className="flex-1 px-2 py-1 bg-[#0A0A0E] border border-[#2B2B3E] rounded text-xs text-white focus:outline-none focus:border-[#00E676]"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="px-2 py-1 bg-[#00E676] text-black font-bold text-xs rounded hover:bg-[#00C853] cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSavingPreset(true)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#808095] hover:text-white hover:bg-[#1C1C2A] flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#00E676]" />
                  <span>Save Current Workspace...</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Panel Menu */}
      <div className="relative" ref={panelsMenuRef}>
        <button
          onClick={() => setShowPanelsMenu(prev => !prev)}
          title="Open or restore closed editor panels"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#14141C] hover:bg-[#1C1C28] border border-[#222230] text-[#9090A5] hover:text-white text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3 text-[#00E676]" />
          <span>Panels</span>
        </button>

        {showPanelsMenu && (
          <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#12121D] border border-[#2B2B3E] rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto custom-scrollbar animate-fadeIn">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#707085] px-2 py-1">
              Available Panels
            </div>

            {allPanels.map(pid => {
              const def = PANEL_DEFINITIONS[pid]
              const isOpen = openPanelIds.includes(pid)

              return (
                <button
                  key={pid}
                  onClick={() => {
                    onOpenPanel(pid)
                    setShowPanelsMenu(false)
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isOpen
                      ? 'text-[#606075] hover:bg-[#181824]'
                      : 'text-[#C0C0D0] hover:bg-[#1F1F30] hover:text-white'
                  }`}
                >
                  <span className="truncate">{def?.name || pid}</span>
                  {isOpen ? (
                    <span className="text-[9px] px-1 rounded bg-[#1C1C28] text-[#707080]">Open</span>
                  ) : (
                    <Plus className="w-3 h-3 text-[#00E676]" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Reset Layout */}
      <button
        onClick={onResetLayout}
        title="Reset workspace layout to default arrangement"
        className="p-1.5 rounded-lg bg-[#14141C] hover:bg-[#1C1C28] border border-[#222230] text-[#808095] hover:text-white transition-all cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        title="Quick Command Palette (Ctrl/Cmd + K)"
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#14141C] hover:bg-[#1C1C28] border border-[#222230] text-[#808095] hover:text-white text-xs font-mono transition-all cursor-pointer"
      >
        <Command className="w-3 h-3" />
        <span className="text-[10px] hidden sm:inline">Ctrl+K</span>
      </button>

      {/* Focus Mode (Fullscreen Viewport / Panel) */}
      <button
        onClick={onToggleFocusMode}
        title={isFocusMode ? 'Exit Focus Mode (Ctrl+Space)' : 'Focus Mode: Fullscreen Viewport (Ctrl+Space)'}
        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
          isFocusMode
            ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676]'
            : 'bg-[#14141C] hover:bg-[#1C1C28] border-[#222230] text-[#808095] hover:text-white'
        }`}
      >
        {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>

      {/* Beginner / Pro Mode Toggle */}
      <button
        onClick={onToggleMode}
        title={mode === 'pro' ? 'Switch to Beginner Mode' : 'Switch to Pro Mode'}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold uppercase transition-all cursor-pointer ${
          mode === 'pro'
            ? 'bg-[#181828] border-[#3B82F6]/50 text-[#60A5FA]'
            : 'bg-[#14141C] border-[#222230] text-[#9090A5]'
        }`}
      >
        <SlidersHorizontal className="w-3 h-3" />
        <span className="hidden md:inline">{mode}</span>
      </button>
    </div>
  )
}
