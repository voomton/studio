import React, { useState } from 'react'
import { VRMAvatarState, DEFAULT_MATERIALS, DEFAULT_PHYSICS } from '../../utils/vrmManager'
import { BodyTab } from './BodyTab'
import { FaceTab } from './FaceTab'
import { HairTab } from './HairTab'
import { OutfitTab } from './OutfitTab'
import { PhysicsTab } from './PhysicsTab'
import { LightingStudioTab } from './LightingStudioTab'
import { 
  User, 
  Smile, 
  Sparkles, 
  Shirt, 
  Activity, 
  Sun, 
  Check, 
  CloudCheck
} from 'lucide-react'

interface CharacterEditorSidebarProps {
  className?: string
  avatarState: VRMAvatarState
  onChange: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
  onTakeScreenshot?: (resolution?: '1080p' | '2k' | '4k', transparent?: boolean) => string
}

export const CharacterEditorSidebar: React.FC<CharacterEditorSidebarProps> = ({
  className,
  avatarState,
  onChange,
  onTakeScreenshot
}) => {
  // Tabs: Body, Face, Hair, Outfit, Physics, Lights
  const [activeTab, setActiveTab] = useState<'body' | 'face' | 'hair' | 'outfit' | 'physics' | 'lights'>('body')

  const tabs = [
    { id: 'body', label: 'Body', icon: User },
    { id: 'face', label: 'Face', icon: Smile },
    { id: 'hair', label: 'Hair', icon: Sparkles },
    { id: 'outfit', label: 'Outfit', icon: Shirt },
    { id: 'physics', label: 'Physics', icon: Activity },
    { id: 'lights', label: 'Lights', icon: Sun }
  ] as const

  return (
    <aside 
      id="character-editing-panel" 
      className={className || "w-84 shrink-0 flex flex-col h-full bg-[#1F1930] border-l border-[#2E2548] select-none z-20 overflow-hidden"}
    >
      {/* Navigation Tabs Bar */}
      <div className="p-2 border-b border-[#2E2548] bg-[#1A1429] shrink-0">
        <div className="grid grid-cols-6 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#271F3D] text-[#EC4899] border border-[#EC4899]/50 shadow-sm shadow-[#EC4899]/10'
                    : 'text-[#A09BB5] hover:text-white hover:bg-[#251D3A]'
                }`}
                title={tab.label}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#1F1930]">
        {activeTab === 'body' && (
          <BodyTab
            proportions={avatarState.proportions}
            skinTint={avatarState.materials?.skinTint || '#ffffff'}
            onChange={proportions => {
              onChange(prev => ({
                ...prev,
                proportions
              }))
            }}
            onSkinTintChange={color => {
              onChange(prev => ({
                ...prev,
                materials: {
                  ...prev.materials,
                  skinTint: color
                }
              }))
            }}
          />
        )}

        {activeTab === 'face' && (
          <FaceTab
            expressions={avatarState.expressions}
            onChange={expressions => {
              onChange(prev => ({
                ...prev,
                expressions
              }))
            }}
          />
        )}

        {activeTab === 'hair' && (
          <HairTab
            materials={avatarState.materials || DEFAULT_MATERIALS}
            onChange={materials => {
              onChange(prev => ({
                ...prev,
                materials
              }))
            }}
          />
        )}

        {activeTab === 'outfit' && (
          <OutfitTab
            materials={avatarState.materials || DEFAULT_MATERIALS}
            onChange={materials => {
              onChange(prev => ({
                ...prev,
                materials
              }))
            }}
          />
        )}

        {activeTab === 'physics' && (
          <PhysicsTab
            physics={avatarState.physics || DEFAULT_PHYSICS}
            autoBreathing={avatarState.autoBreathing ?? false}
            autoBlink={avatarState.autoBlink ?? false}
            autoLipSync={avatarState.autoLipSync ?? false}
            eyeTracking={avatarState.eyeTracking ?? false}
            onPhysicsChange={physics => {
              onChange(prev => ({
                ...prev,
                physics
              }))
            }}
            onAutoToggle={(key, val) => {
              onChange(prev => ({
                ...prev,
                [key]: val
              }))
            }}
          />
        )}

        {activeTab === 'lights' && (
          <LightingStudioTab
            avatarState={avatarState}
            onChange={onChange}
          />
        )}
      </div>

      {/* Bottom Status Bar: Saved (Ctrl + S) */}
      <div className="h-10 px-4 border-t border-[#2E2548] bg-[#1A1429] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-[#A09BB5] flex items-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Saved</span>
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#706B85] bg-[#271F3D] px-2 py-0.5 rounded border border-[#3E325E]">
          Ctrl + S
        </span>
      </div>
    </aside>
  )
}
