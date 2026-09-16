import React, { useState } from 'react'
import { Volume2, Mic, Play, Plus, Upload, Sparkles, MessageSquare, Music } from 'lucide-react'
import { VOOM_DRAG_TYPES, setDragData, DraggedAudioPayload } from '../../../utils/dragDropAsset'

interface AudioPreset {
  id: string
  name: string
  type: 'dialogue' | 'music' | 'sfx'
  durationFrames: number
  description: string
  sampleText?: string
}

export const SAMPLE_AUDIO_PRESETS: AudioPreset[] = [
  {
    id: 'audio_dialogue_greeting',
    name: 'Anime Greeting "Konnichiwa!"',
    type: 'dialogue',
    durationFrames: 36,
    description: 'Energetic upbeat anime female greeting line',
    sampleText: 'Konnichiwa! Welcome to VoomToon studio!'
  },
  {
    id: 'audio_dialogue_battle_cry',
    name: 'Hero Battle Cry',
    type: 'dialogue',
    durationFrames: 24,
    description: 'Dynamic courageous battle cheer with high pitch',
    sampleText: 'I will never give up! Let us go!'
  },
  {
    id: 'audio_sfx_whoosh',
    name: 'Sword Whoosh Action',
    type: 'sfx',
    durationFrames: 18,
    description: 'Sharp aerodynamic slash sound effect'
  },
  {
    id: 'audio_bgm_cyber',
    name: 'Cyber City Groove (Loop)',
    type: 'music',
    durationFrames: 96,
    description: 'Chill synthwave ambient background loop'
  }
]

interface AudioLipSyncPanelProps {
  onGenerateLipSync?: (text: string) => void
  onAddAudioClip?: (preset: AudioPreset) => void
}

export const AudioLipSyncPanel: React.FC<AudioLipSyncPanelProps> = ({
  onGenerateLipSync,
  onAddAudioClip
}) => {
  const [dialogueText, setDialogueText] = useState('Hello everyone! Welcome to VoomToon!')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    if (!dialogueText.trim() || !onGenerateLipSync) return
    setIsGenerating(true)
    setTimeout(() => {
      onGenerateLipSync(dialogueText.trim())
      setIsGenerating(false)
    }, 400)
  }

  return (
    <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white">
      {/* Lip Sync Quick Generator */}
      <div className="p-3 border-b border-[#1E1E26] bg-[#12121A]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-[#EC4899]/20 text-[#EC4899] flex items-center justify-center">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Speech & Lip-Sync
          </span>
        </div>

        <div className="space-y-2">
          <textarea
            value={dialogueText}
            onChange={e => setDialogueText(e.target.value)}
            placeholder="Type dialogue to generate phonetic viseme lip-sync animation..."
            rows={2}
            className="w-full p-2 bg-[#0A0A0E] border border-[#22222E] rounded-lg text-xs text-white placeholder-[#505060] focus:outline-none focus:border-[#EC4899] transition-all resize-none"
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !dialogueText.trim()}
            className="w-full py-1.5 px-3 rounded-lg bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#EC4899]/20 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing Visemes...' : 'Generate Character Lip-Sync'}</span>
          </button>
        </div>
      </div>

      {/* Audio Clips Library */}
      <div className="p-3 border-b border-[#1E1E26] flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Audio & Sound Tracks
          </h4>
          <p className="text-[10px] text-[#707080]">
            Drag audio file into <b>Audio Track</b> in timeline
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {SAMPLE_AUDIO_PRESETS.map(audio => (
          <div
            key={audio.id}
            draggable
            onDragStart={e => {
              const payload: DraggedAudioPayload = {
                type: 'audio',
                id: audio.id,
                name: audio.name,
                durationFrames: audio.durationFrames
              }
              setDragData(e, VOOM_DRAG_TYPES.AUDIO, payload)
            }}
            className="group p-2.5 rounded-xl border border-[#1E1E28] bg-[#14141C] hover:bg-[#181824] hover:border-[#353548] transition-all cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EC4899]/15 border border-[#EC4899]/30 flex items-center justify-center text-[#EC4899]">
                  {audio.type === 'music' ? <Music className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-[#EC4899] transition-colors">
                    {audio.name}
                  </h5>
                  <span className="text-[10px] text-[#707080] font-mono">
                    {audio.durationFrames} frames • {audio.type.toUpperCase()}
                  </span>
                </div>
              </div>

              {onAddAudioClip && (
                <button
                  onClick={() => onAddAudioClip(audio)}
                  title="Add to timeline audio track"
                  className="p-1.5 rounded-lg bg-[#1E1E2C] hover:bg-[#EC4899] hover:text-white text-[#808095] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-[#1C1C26] flex items-center justify-between text-[9px] text-[#606070]">
              <span className="line-clamp-1">{audio.description}</span>
              <span className="text-[#EC4899] opacity-0 group-hover:opacity-100 font-mono transition-opacity">
                ⋮⋮ Drag to Timeline
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
