import React from 'react'
import { AlertTriangle, Save, Trash2, X } from 'lucide-react'

interface UnsavedChangesModalProps {
  isOpen: boolean
  characterName: string
  onSaveAndSwitch: () => void
  onDiscardAndSwitch: () => void
  onCancel: () => void
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  characterName,
  onSaveAndSwitch,
  onDiscardAndSwitch,
  onCancel
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="max-w-sm w-full bg-[#14141C] border border-[#2B2B38] rounded-2xl p-5 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center gap-3 text-[#EAB308] mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAB308]/15 border border-[#EAB308]/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Unsaved Changes</h3>
            <p className="text-[10px] text-[#707080] font-mono">Modifications detected</p>
          </div>
        </div>

        <p className="text-xs text-[#A0A0B5] leading-relaxed mb-5">
          You have unsaved modifications on <span className="text-white font-bold">"{characterName}"</span>. Would you like to save your changes before switching characters?
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onSaveAndSwitch}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00C853] text-[#0A0A0C] text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#00E676]/20"
          >
            <Save className="w-4 h-4" />
            <span>Save & Switch</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onDiscardAndSwitch}
              className="flex-1 py-2 rounded-xl bg-[#1E1E2A] hover:bg-[#282838] border border-[#2F2F40] text-xs font-bold text-[#FF5252] hover:text-[#FF7070] transition-all cursor-pointer"
            >
              Discard Changes
            </button>

            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl bg-[#14141C] hover:bg-[#1E1E28] border border-[#252534] text-xs font-bold text-[#A0A0B0] hover:text-white transition-all cursor-pointer"
            >
              Stay on Character
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
