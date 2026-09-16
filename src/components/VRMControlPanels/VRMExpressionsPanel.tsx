import React from 'react'
import { VRM } from '@pixiv/three-vrm'
import { VRMAvatarState, STANDARD_EXPRESSIONS } from '../../utils/vrmManager'
import { 
  Smile, 
  RotateCcw, 
  Sparkles, 
  Mic, 
  Eye, 
  Heart, 
  Flame, 
  Frown, 
  Coffee,
  Sliders
} from 'lucide-react'

interface VRMExpressionsPanelProps {
  vrm: VRM | null
  avatarState: VRMAvatarState
  onChange: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
}

export const VRMExpressionsPanel: React.FC<VRMExpressionsPanelProps> = ({
  vrm,
  avatarState,
  onChange
}) => {
  // Extract all available expression names from VRM expression manager or fallback
  const availableExpressions = React.useMemo(() => {
    if (!vrm?.expressionManager) return []
    const list: string[] = []
    
    // Check VRM expressions map
    try {
      const exprMap = (vrm.expressionManager as any)._expressions || (vrm.expressionManager as any).expressionsMap
      if (exprMap) {
        if (exprMap instanceof Map) {
          exprMap.forEach((_, key) => list.push(key))
        } else if (typeof exprMap === 'object') {
          Object.keys(exprMap).forEach(key => list.push(key))
        }
      }
    } catch (e) {
      // fallback
    }

    if (list.length === 0) {
      STANDARD_EXPRESSIONS.forEach(e => list.push(e.id))
    }
    return list
  }, [vrm])

  const handleExpressionSlider = (name: string, value: number) => {
    onChange(prev => ({
      ...prev,
      expressions: {
        ...prev.expressions,
        [name]: value
      }
    }))
  }

  const handleResetExpressions = () => {
    onChange(prev => ({
      ...prev,
      expressions: {},
      autoBlink: false,
      autoLipSync: false
    }))
  }

  const setQuickMood = (mood: 'happy' | 'angry' | 'sad' | 'surprised' | 'neutral') => {
    onChange(prev => {
      const nextExpr: Record<string, number> = {}
      if (mood === 'happy') nextExpr['happy'] = 1.0
      if (mood === 'angry') nextExpr['angry'] = 0.9
      if (mood === 'sad') nextExpr['sad'] = 0.9
      if (mood === 'surprised') {
        nextExpr['surprised'] = 1.0
        nextExpr['aa'] = 0.5
      }
      return {
        ...prev,
        expressions: nextExpr
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 p-4 text-xs">
      {/* Quick Mood Shortcuts */}
      <div className="flex flex-col gap-2 bg-[#18181F] p-3 rounded-lg border border-[#2D2D35]">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#D32F2F]" />
            Quick Mood Presets
          </label>
          <button
            onClick={handleResetExpressions}
            className="flex items-center gap-1 text-[10px] text-[#80808F] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5 pt-1">
          <button
            onClick={() => setQuickMood('happy')}
            className="flex flex-col items-center justify-center p-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[#E0E0E5] hover:text-white transition-all group"
          >
            <Smile className="w-4 h-4 text-[#00E676] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] mt-1 font-bold">Happy</span>
          </button>
          <button
            onClick={() => setQuickMood('angry')}
            className="flex flex-col items-center justify-center p-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[#E0E0E5] hover:text-white transition-all group"
          >
            <Flame className="w-4 h-4 text-[#FF5252] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] mt-1 font-bold">Angry</span>
          </button>
          <button
            onClick={() => setQuickMood('sad')}
            className="flex flex-col items-center justify-center p-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[#E0E0E5] hover:text-white transition-all group"
          >
            <Frown className="w-4 h-4 text-[#448AFF] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] mt-1 font-bold">Sorrow</span>
          </button>
          <button
            onClick={() => setQuickMood('surprised')}
            className="flex flex-col items-center justify-center p-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[#E0E0E5] hover:text-white transition-all group"
          >
            <Sparkles className="w-4 h-4 text-[#FFD700] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] mt-1 font-bold">Surprise</span>
          </button>
          <button
            onClick={() => setQuickMood('neutral')}
            className="flex flex-col items-center justify-center p-2 rounded bg-[#1E1E24] hover:bg-[#282830] border border-[#2D2D35] text-[#E0E0E5] hover:text-white transition-all group"
          >
            <Coffee className="w-4 h-4 text-[#B0B0BF] group-hover:scale-110 transition-transform" />
            <span className="text-[9px] mt-1 font-bold">Neutral</span>
          </button>
        </div>
      </div>

      {/* Live Auto-Actions */}
      <div className="flex flex-col gap-2 bg-[#18181F] p-3 rounded-lg border border-[#2D2D35]">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-[#D32F2F]" />
          Live Facial Automation
        </label>
        
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onChange(prev => ({ ...prev, autoBlink: !prev.autoBlink }))}
            className={`flex items-center justify-between p-2 rounded border transition-all ${
              avatarState.autoBlink
                ? 'bg-[#D32F2F]/20 border-[#D32F2F] text-white font-bold'
                : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <Eye className="w-3.5 h-3.5" />
              Auto-Blink
            </span>
            <div className={`w-2 h-2 rounded-full ${avatarState.autoBlink ? 'bg-[#00E676] animate-pulse' : 'bg-[#404050]'}`} />
          </button>

          <button
            onClick={() => onChange(prev => ({ ...prev, autoLipSync: !prev.autoLipSync }))}
            className={`flex items-center justify-between p-2 rounded border transition-all ${
              avatarState.autoLipSync
                ? 'bg-[#D32F2F]/20 border-[#D32F2F] text-white font-bold'
                : 'bg-[#1E1E24] border-[#2D2D35] text-[#B0B0BF] hover:bg-[#26262E]'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <Mic className="w-3.5 h-3.5" />
              Auto-Talk Lip Sync
            </span>
            <div className={`w-2 h-2 rounded-full ${avatarState.autoLipSync ? 'bg-[#00E676] animate-pulse' : 'bg-[#404050]'}`} />
          </button>
        </div>
      </div>

      {/* Emotion Expressions */}
      <div className="flex flex-col gap-3">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-[#D32F2F]" />
          Emotional Blendshapes
        </span>

        {STANDARD_EXPRESSIONS.filter(e => e.category === 'Emotion').map(expr => {
          const val = avatarState.expressions[expr.id] || 0
          return (
            <div key={expr.id} className="flex flex-col gap-1 bg-[#18181F] p-2.5 rounded-lg border border-[#2D2D35]">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-medium text-[#E0E0E5]">{expr.label}</span>
                <span className="font-mono text-[#80808F]">{Math.round(val * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={val}
                onChange={e => handleExpressionSlider(expr.id, parseFloat(e.target.value))}
                className="w-full accent-[#D32F2F] h-1.5 bg-[#252530] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )
        })}
      </div>

      {/* Eye & Viseme Morphs */}
      <div className="flex flex-col gap-3">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#80808F] flex items-center gap-1.5">
          <Mic className="w-3 h-3 text-[#D32F2F]" />
          Mouth & Viseme Morph Targets
        </span>

        {STANDARD_EXPRESSIONS.filter(e => e.category === 'Viseme').map(expr => {
          const val = avatarState.expressions[expr.id] || 0
          return (
            <div key={expr.id} className="flex flex-col gap-1 bg-[#18181F] p-2 rounded-lg border border-[#2D2D35]">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-medium text-[#E0E0E5]">{expr.label}</span>
                <span className="font-mono text-[#80808F]">{Math.round(val * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={val}
                onChange={e => handleExpressionSlider(expr.id, parseFloat(e.target.value))}
                className="w-full accent-[#D32F2F] h-1.5 bg-[#252530] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
