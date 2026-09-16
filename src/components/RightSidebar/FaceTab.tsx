import React from 'react'
import { Smile, Eye, MessageSquare, RefreshCw } from 'lucide-react'

interface FaceTabProps {
  expressions: Record<string, number>
  onChange: (expressions: Record<string, number>) => void
}

export const FaceTab: React.FC<FaceTabProps> = ({ expressions, onChange }) => {
  const updateExpr = (name: string, value: number) => {
    onChange({
      ...expressions,
      [name]: value
    })
  }

  const handleResetAll = () => {
    onChange({})
  }

  const emotionList = [
    { id: 'happy', label: 'Joy / Happy' },
    { id: 'relaxed', label: 'Relaxed / Calm' },
    { id: 'angry', label: 'Angry / Serious' },
    { id: 'sad', label: 'Sad / Sorrow' },
    { id: 'surprised', label: 'Surprised / Shocked' }
  ]

  const eyeList = [
    { id: 'blink', label: 'Blink Both' },
    { id: 'blinkLeft', label: 'Blink Left (Wink)' },
    { id: 'blinkRight', label: 'Blink Right (Wink)' },
    { id: 'lookUp', label: 'Look Up' },
    { id: 'lookDown', label: 'Look Down' },
    { id: 'lookLeft', label: 'Look Left' },
    { id: 'lookRight', label: 'Look Right' }
  ]

  const mouthList = [
    { id: 'aa', label: 'Mouth: Aa (Open)' },
    { id: 'ih', label: 'Mouth: Ih (Smile Open)' },
    { id: 'ou', label: 'Mouth: Ou (Pucker)' },
    { id: 'ee', label: 'Mouth: Ee (Wide)' },
    { id: 'oh', label: 'Mouth: Oh (O-Shape)' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Facial Expressions & Morphs
          </h3>
          <p className="text-[10px] text-[#707080]">
            Blendshape morph targets for anime expressions
          </p>
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#1A1A24] hover:bg-[#222230] text-[#A0A0B5] hover:text-white text-[10px] font-bold transition-all cursor-pointer"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Emotion Group */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#E0E0EC]">
          <Smile className="w-3.5 h-3.5 text-[#D32F2F]" />
          <span>Emotions & Mood</span>
        </div>

        <div className="space-y-3 pl-2 border-l border-[#22222E]">
          {emotionList.map(item => (
            <div key={item.id}>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>{item.label}</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round((expressions[item.id] || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={expressions[item.id] || 0}
                onChange={e => updateExpr(item.id, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Eyes & Gaze Group */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#E0E0EC]">
          <Eye className="w-3.5 h-3.5 text-[#D32F2F]" />
          <span>Eyes & Gaze Direction</span>
        </div>

        <div className="space-y-3 pl-2 border-l border-[#22222E]">
          {eyeList.map(item => (
            <div key={item.id}>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>{item.label}</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round((expressions[item.id] || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={expressions[item.id] || 0}
                onChange={e => updateExpr(item.id, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mouth & Visemes Group */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#E0E0EC]">
          <MessageSquare className="w-3.5 h-3.5 text-[#D32F2F]" />
          <span>Mouth Visemes & Dialogue</span>
        </div>

        <div className="space-y-3 pl-2 border-l border-[#22222E]">
          {mouthList.map(item => (
            <div key={item.id}>
              <div className="flex justify-between text-xs text-[#C0C0D0] mb-1">
                <span>{item.label}</span>
                <span className="text-[#D32F2F] font-mono text-[11px]">
                  {Math.round((expressions[item.id] || 0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={expressions[item.id] || 0}
                onChange={e => updateExpr(item.id, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#22222E] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
