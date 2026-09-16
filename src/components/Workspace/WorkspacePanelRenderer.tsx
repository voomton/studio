import React from 'react'
import { PanelId } from '../../types/workspace'
import { VRMAvatarState, SavedCharacterRecord } from '../../utils/vrmManager'
import { SceneCharacterInstance, SceneProp, SceneEntitySelection, GizmoMode, GizmoSpace, SceneCameraShot, EditorMode } from '../../types/scene'
import { AnimationProject } from '../../types/animation'
import { CharacterLibrarySidebar } from '../LeftSidebar/CharacterLibrarySidebar'
import { CharacterEditorSidebar } from '../RightSidebar/CharacterEditorSidebar'
import { SceneHierarchySidebar } from '../LeftSidebar/SceneHierarchySidebar'
import { PropTransformSidebar } from '../RightSidebar/PropTransformSidebar'
import { AnimationInspector } from '../AnimationEditor/Inspector/AnimationInspector'
import { AnimationTimeline } from '../AnimationEditor/Timeline/AnimationTimeline'
import { GraphEditor } from '../AnimationEditor/Timeline/GraphEditor'
import { DopeSheet } from '../AnimationEditor/Timeline/DopeSheet'
import { AnimationLibraryPanel } from './Panels/AnimationLibraryPanel'
import { PoseLibraryPanel } from './Panels/PoseLibraryPanel'
import { CameraPresetsPanel } from './Panels/CameraPresetsPanel'
import { LightingPresetsPanel, LightingPreset } from './Panels/LightingPresetsPanel'
import { AudioLipSyncPanel } from './Panels/AudioLipSyncPanel'
import { ProjectSettingsPanel } from './Panels/ProjectSettingsPanel'
import { Camera, Film, Sliders, Layers, Box, User, Video, Volume2, Sparkles, Move, Plus } from 'lucide-react'

export interface WorkspacePanelRendererProps {
  panelId: PanelId
  avatarState?: VRMAvatarState | null
  onAvatarStateChange: (updater: (prev: VRMAvatarState) => VRMAvatarState) => void
  savedCharacters: SavedCharacterRecord[]
  activeCharacterId?: string
  onSelectCharacter: (record: SavedCharacterRecord) => void
  onDeleteCharacterRecord: (id: string) => void
  onCreateNewCharacter: () => void
  onUploadCustomVRM: () => void
  isLibraryOpen?: boolean
  sceneCharacters: SceneCharacterInstance[]
  sceneProps: SceneProp[]
  selectedEntity: SceneEntitySelection
  selectedPropId: string | null
  gizmoMode: GizmoMode
  gizmoSpace: GizmoSpace
  cameraShots: SceneCameraShot[]
  activeCameraShotId: string | null
  onSelectEntity: (selection: SceneEntitySelection) => void
  onSelectProp: (id: string | null) => void
  onAddPropFromPreset: (presetId: string) => void
  onUploadCustomProp: (file: File) => void
  onDeleteProp: (propId: string) => void
  onDeleteCharacterFromScene: (charId: string) => void
  onApplyCameraShot: (shot: SceneCameraShot) => void
  onSaveCurrentCameraView: (name?: string) => void
  onDeleteCameraShot: (shotId: string) => void
  onUpdateCameraPosition: (shotId: string, pos: [number, number, number]) => void
  onUpdatePropTransform: (id: string, updates: any) => void
  onUpdateCharacterTransform: (id: string, updates: any) => void
  onDuplicateProp: (id: string) => void
  onDuplicateCharacter: (id: string) => void
  onAutoFitPropScale: (id: string) => void
  onFocusEntity: () => void
  animationProject: AnimationProject
  onUpdateAnimationProject: (updates: Partial<AnimationProject> | ((prev: AnimationProject) => AnimationProject)) => void
  onPlayAnimation: () => void
  onPauseAnimation: () => void
  onStopAnimation: () => void
  onSeekAnimation: (frame: number) => void
  onAddKeyframeCurrent: () => void
  onDeleteSelectedKeyframes: () => void
  onApplyClipToCharacter: (charId: string, clip: any) => void
  onGenerateLipSync: (text: string) => void
  onApplyLightingPreset?: (preset: LightingPreset) => void
  onTriggerRenderModal?: () => void
  hasUnsavedChanges?: boolean
  onRenameCharacterRecord?: (charId: string, newName: string) => void
  onDuplicateCharacterRecord?: (charId: string) => void
  editorMode?: EditorMode
  viewportHiddenCharacterIds?: string[]
  onToggleCharacterViewportVisibility?: (charId: string) => void
}

export const WorkspacePanelRenderer: React.FC<WorkspacePanelRendererProps> = props => {
  const {
    panelId,
    avatarState,
    onAvatarStateChange,
    savedCharacters,
    activeCharacterId,
    onSelectCharacter,
    onDeleteCharacterRecord,
    onCreateNewCharacter,
    onUploadCustomVRM,
    sceneCharacters,
    sceneProps,
    selectedEntity,
    selectedPropId,
    gizmoMode,
    gizmoSpace,
    cameraShots,
    activeCameraShotId,
    onSelectEntity,
    onSelectProp,
    onAddPropFromPreset,
    onUploadCustomProp,
    onDeleteProp,
    onDeleteCharacterFromScene,
    onApplyCameraShot,
    onSaveCurrentCameraView,
    onDeleteCameraShot,
    onUpdateCameraPosition,
    onUpdatePropTransform,
    onUpdateCharacterTransform,
    onDuplicateProp,
    onDuplicateCharacter,
    onAutoFitPropScale,
    onFocusEntity,
    animationProject,
    onUpdateAnimationProject,
    onPlayAnimation,
    onPauseAnimation,
    onStopAnimation,
    onSeekAnimation,
    onAddKeyframeCurrent,
    onDeleteSelectedKeyframes,
    onApplyClipToCharacter,
    onGenerateLipSync,
    onApplyLightingPreset,
    onTriggerRenderModal,
    hasUnsavedChanges,
    onRenameCharacterRecord,
    onDuplicateCharacterRecord,
    editorMode,
    viewportHiddenCharacterIds,
    onToggleCharacterViewportVisibility
  } = props

  const selectedCharacter = (sceneCharacters || []).find(c => c.id === selectedEntity?.id) || null
  const selectedProp = (sceneProps || []).find(p => p.id === selectedEntity?.id) || null
  const selectedCameraShot = (cameraShots || []).find(c => c.id === selectedEntity?.id) || null

  switch (panelId) {
    // 1. Characters Library
    case 'characters':
      return (
        <CharacterLibrarySidebar
          characters={savedCharacters || []}
          activeCharacterId={activeCharacterId || ''}
          hasUnsavedChanges={Boolean(hasUnsavedChanges)}
          viewportHiddenCharacterIds={viewportHiddenCharacterIds}
          onSelectCharacter={onSelectCharacter}
          onCreateNew={onCreateNewCharacter}
          onUploadClick={onUploadCustomVRM}
          onDuplicateCharacter={onDuplicateCharacterRecord || onDuplicateCharacter}
          onDeleteCharacter={onDeleteCharacterRecord}
          onRenameCharacter={onRenameCharacterRecord || (() => {})}
          onToggleViewportVisibility={onToggleCharacterViewportVisibility}
        />
      )

    // 2. Assets & Props
    case 'assets':
      return (
        <SceneHierarchySidebar
          isOpen={true}
          onToggle={() => {}}
          sceneCharacters={sceneCharacters}
          sceneProps={sceneProps}
          cameraShots={cameraShots}
          selectedEntity={selectedEntity}
          onSelectEntity={onSelectEntity}
          onAddPropFromPreset={onAddPropFromPreset}
          onUploadCustomProp={onUploadCustomProp}
          onDeleteProp={onDeleteProp}
          onDeleteCharacter={onDeleteCharacterFromScene}
          onAddCameraShot={onSaveCurrentCameraView}
          onApplyCameraShot={onApplyCameraShot}
          onDeleteCameraShot={onDeleteCameraShot}
          defaultTab="assets"
        />
      )

    // 3. Scene & Outliner
    case 'scene':
    case 'outliner':
      return (
        <SceneHierarchySidebar
          isOpen={true}
          onToggle={() => {}}
          sceneCharacters={sceneCharacters}
          sceneProps={sceneProps}
          cameraShots={cameraShots}
          selectedEntity={selectedEntity}
          onSelectEntity={onSelectEntity}
          onAddPropFromPreset={onAddPropFromPreset}
          onUploadCustomProp={onUploadCustomProp}
          onDeleteProp={onDeleteProp}
          onDeleteCharacter={onDeleteCharacterFromScene}
          onAddCameraShot={onSaveCurrentCameraView}
          onApplyCameraShot={onApplyCameraShot}
          onDeleteCameraShot={onDeleteCameraShot}
          defaultTab="scene"
        />
      )

    // 4. Animation Library
    case 'animation_library':
      return (
        <AnimationLibraryPanel
          onApplyClip={clip => {
            const charId = selectedCharacter ? selectedCharacter.id : sceneCharacters[0]?.id
            if (charId) {
              onApplyClipToCharacter(charId, clip)
            }
          }}
          selectedCharacterName={selectedCharacter?.name || sceneCharacters[0]?.name}
        />
      )

    // 5. Pose Library
    case 'pose':
      return (
        <PoseLibraryPanel
          activePoseKey={avatarState?.activePosePreset || (avatarState as any)?.posePreset || 'aPose'}
          onApplyPose={poseKey => {
            onAvatarStateChange(prev => ({
              ...prev,
              activePosePreset: poseKey
            }))
          }}
          onAddPoseKeyframe={poseKey => {
            onUpdateAnimationProject(prev => {
              const charId = selectedCharacter?.id || sceneCharacters[0]?.id || 'char_01'
              let poseTrack = prev.tracks.find(t => t.property === 'pose' && t.targetId === charId)
              const newKf = {
                id: `kf_pose_${Date.now()}`,
                frame: prev.currentFrame,
                value: poseKey,
                interpolation: 'easeInOut' as const
              }

              if (poseTrack) {
                return {
                  ...prev,
                  tracks: (prev.tracks || []).map(t => t.id === poseTrack!.id ? {
                    ...t,
                    keyframes: [...(t.keyframes || []).filter(k => k.frame !== prev.currentFrame), newKf].sort((a, b) => a.frame - b.frame)
                  } : t)
                }
              } else {
                return {
                  ...prev,
                  tracks: [
                    ...(prev.tracks || []),
                    {
                      id: `track_pose_${Date.now()}`,
                      name: `${selectedCharacter?.name || 'Character'} Pose`,
                      targetType: 'character' as const,
                      targetId: charId,
                      targetName: selectedCharacter?.name || 'Character',
                      property: 'pose',
                      muted: false,
                      locked: false,
                      keyframes: [newKf]
                    }
                  ]
                }
              }
            })
          }}
        />
      )

    // 6. Character Sub-Panels (Face, Hair, Outfit, Physics)
    case 'face':
    case 'hair':
    case 'outfit':
    case 'physics':
      return (
        <CharacterEditorSidebar
          avatarState={avatarState}
          onChange={onAvatarStateChange}
        />
      )

    // 7. Camera Shots
    case 'camera':
      if (editorMode === 'character') {
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-[#707080] bg-[#121218]">
            <Camera className="w-8 h-8 mb-2 opacity-40 text-[#818CF8]" />
            <p className="text-xs font-semibold text-white mb-1">Camera Tools in Scene & Animation</p>
            <p className="text-[11px] max-w-xs leading-relaxed text-[#9E9EB0]">
              Camera shots, cinematic lenses, and framing are managed in Scene Builder and Animation modes.
            </p>
          </div>
        )
      }
      return (
        <CameraPresetsPanel
          cameraShots={cameraShots}
          activeShotId={activeCameraShotId}
          onApplyCameraShot={onApplyCameraShot}
          onSaveCurrentCamera={onSaveCurrentCameraView}
          onAddCameraShotCut={shot => {
            const cutId = `cut_${Date.now()}`
            onUpdateAnimationProject(prev => ({
              ...prev,
              cameraCuts: [
                ...(prev.cameraCuts || []).filter(c => Math.abs(c.startFrame - prev.currentFrame) > 3),
                {
                  id: cutId,
                  cameraShotId: shot.id,
                  cameraName: shot.name,
                  startFrame: prev.currentFrame,
                  durationFrames: 48,
                  transition: 'cut' as const
                }
              ].sort((a, b) => a.startFrame - b.startFrame)
            }))
          }}
        />
      )

    // 8. Lights & Studio Environment
    case 'lights':
      return (
        <LightingPresetsPanel
          activePresetId={avatarState?.backdrop || 'sunset'}
          onApplyPreset={lightPreset => {
            if (onApplyLightingPreset) {
              onApplyLightingPreset(lightPreset)
            } else {
              onAvatarStateChange(prev => ({
                ...prev,
                backdrop: lightPreset.backdrop,
                lighting: {
                  ...prev.lighting,
                  keyLightColor: lightPreset.keyColor,
                  fillLightColor: lightPreset.fillColor,
                  rimLightColor: lightPreset.rimColor,
                  ambientIntensity: lightPreset.ambientIntensity,
                  keyLightIntensity: lightPreset.keyIntensity
                }
              }))
            }
          }}
        />
      )

    // 9. Properties Inspector (Smart Context Sensitive)
    case 'inspector':
      if (editorMode === 'character') {
        return (
          <CharacterEditorSidebar
            avatarState={avatarState}
            onChange={onAvatarStateChange}
          />
        )
      }

      if (selectedEntity?.type === 'prop' && selectedProp) {
        return (
          <PropTransformSidebar
            selectedEntity={selectedEntity}
            selectedCharacter={null}
            selectedProp={selectedProp}
            selectedCameraShot={null}
            gizmoMode={gizmoMode}
            gizmoSpace={gizmoSpace}
            avatarState={avatarState}
            onDeselect={() => onSelectEntity(null)}
            onAvatarStateChange={onAvatarStateChange}
            onGizmoModeChange={() => {}}
            onGizmoSpaceChange={() => {}}
            onUpdateProp={updates => onUpdatePropTransform(selectedProp.id, updates)}
            onUpdateCharacter={() => {}}
            onUpdateCameraPosition={onUpdateCameraPosition}
            onApplyCameraShot={onApplyCameraShot}
            onDeleteCameraShot={onDeleteCameraShot}
            onAutoFitScale={() => onAutoFitPropScale(selectedProp.id)}
            onDuplicateProp={() => onDuplicateProp(selectedProp.id)}
            onDuplicateCharacter={() => {}}
            onDeleteProp={() => onDeleteProp(selectedProp.id)}
            onDeleteCharacter={() => {}}
            onFocusEntity={onFocusEntity}
          />
        )
      }

      if (selectedEntity?.type === 'character' && selectedCharacter) {
        return (
          <PropTransformSidebar
            selectedEntity={selectedEntity}
            selectedCharacter={selectedCharacter}
            selectedProp={null}
            selectedCameraShot={null}
            gizmoMode={gizmoMode}
            gizmoSpace={gizmoSpace}
            avatarState={avatarState}
            onDeselect={() => onSelectEntity(null)}
            onAvatarStateChange={onAvatarStateChange}
            onGizmoModeChange={() => {}}
            onGizmoSpaceChange={() => {}}
            onUpdateProp={() => {}}
            onUpdateCharacter={updates => onUpdateCharacterTransform(selectedCharacter.id, updates)}
            onUpdateCameraPosition={onUpdateCameraPosition}
            onApplyCameraShot={onApplyCameraShot}
            onDeleteCameraShot={onDeleteCameraShot}
            onAutoFitScale={() => {}}
            onDuplicateProp={() => {}}
            onDuplicateCharacter={() => onDuplicateCharacter(selectedCharacter.id)}
            onDeleteProp={() => {}}
            onDeleteCharacter={() => onDeleteCharacterFromScene(selectedCharacter.id)}
            onFocusEntity={onFocusEntity}
          />
        )
      }

      // Default animation / transform inspector
      return (
        <AnimationInspector
          selectedEntity={selectedEntity}
          selectedCharacter={selectedCharacter}
          selectedProp={selectedProp}
          selectedCamera={selectedCameraShot}
          project={animationProject}
          currentFrame={animationProject.currentFrame}
          onUpdateCharacterTransform={onUpdateCharacterTransform}
          onUpdateCharacterState={(_charId, updater) => onAvatarStateChange(updater)}
          onUpdateCameraShot={(shotId, updates) => {
            if (updates.position) onUpdateCameraPosition(shotId, updates.position)
          }}
          onAddKeyframe={(trackId, frame, value) => {
            onUpdateAnimationProject(prev => ({
              ...prev,
              tracks: (prev.tracks || []).map(t => t.id === trackId ? {
                ...t,
                keyframes: [...(t.keyframes || []).filter(k => k.frame !== frame), {
                  id: `kf_${Date.now()}`,
                  frame,
                  value,
                  interpolation: 'easeInOut' as const
                }].sort((a, b) => a.frame - b.frame)
              } : t)
            }))
          }}
          onKeyframeAllTransform={charId => {
            if (charId) onAddKeyframeCurrent()
          }}
          onApplyClipToCharacter={onApplyClipToCharacter}
          onGenerateLipSync={onGenerateLipSync}
          onUpdateTrack={(trackId, updates) => {
            onUpdateAnimationProject(prev => ({
              ...prev,
              tracks: (prev.tracks || []).map(t => t.id === trackId ? { ...t, ...updates } : t)
            }))
          }}
          onUpdateKeyframe={(trackId, kfId, updates) => {
            onUpdateAnimationProject(prev => ({
              ...prev,
              tracks: (prev.tracks || []).map(t => t.id === trackId ? {
                ...t,
                keyframes: (t.keyframes || []).map(k => k.id === kfId ? { ...k, ...updates } : k)
              } : t)
            }))
          }}
          onDeleteKeyframe={(trackId, kfId) => {
            onUpdateAnimationProject(prev => ({
              ...prev,
              tracks: (prev.tracks || []).map(t => t.id === trackId ? {
                ...t,
                keyframes: (t.keyframes || []).filter(k => k.id !== kfId)
              } : t)
            }))
          }}
        />
      )

    // 10. Timeline Sequencer
    case 'timeline':
      return (
        <AnimationTimeline
          project={animationProject}
          onUpdateProject={onUpdateAnimationProject}
          onPlay={onPlayAnimation}
          onPause={onPauseAnimation}
          onStop={onStopAnimation}
          onSeek={onSeekAnimation}
          onAddKeyframeCurrent={onAddKeyframeCurrent}
          onDeleteSelectedKeyframes={onDeleteSelectedKeyframes}
        />
      )

    // 11. Graph Editor
    case 'graph_editor': {
      const activeTrack = animationProject.tracks.find(t => t.id === animationProject.selectedTrackId) || animationProject.tracks[0]
      return (
        <GraphEditor
          tracks={animationProject.tracks}
          selectedTrackId={activeTrack?.id}
          currentFrame={animationProject.currentFrame}
          totalFrames={animationProject.totalFrames}
          onSeek={onSeekAnimation}
          onUpdateKeyframeValue={(trackId, kfId, newValue) => {
            onUpdateAnimationProject(prev => ({
              ...prev,
              tracks: prev.tracks.map(t => t.id === trackId ? {
                ...t,
                keyframes: t.keyframes.map(k => k.id === kfId ? { ...k, value: newValue } : k)
              } : t)
            }))
          }}
          onChangeInterpolation={(trackId, kfId, interpolation) => {
            onUpdateAnimationProject(prev => ({
              ...prev,
              tracks: prev.tracks.map(t => t.id === trackId ? {
                ...t,
                keyframes: t.keyframes.map(k => k.id === kfId ? { ...k, interpolation } : k)
              } : t)
            }))
          }}
        />
      )
    }

    // 12. Dope Sheet Matrix
    case 'dope_sheet':
      return (
        <DopeSheet
          tracks={animationProject.tracks}
          selectedTrackId={animationProject.selectedTrackId}
          currentFrame={animationProject.currentFrame}
          totalFrames={animationProject.totalFrames}
          zoom={animationProject.zoom}
          scrollX={animationProject.scrollX}
          onSeek={onSeekAnimation}
          onSelectTrack={trackId => onUpdateAnimationProject({ selectedTrackId: trackId })}
          onSelectKeyframe={id => onUpdateAnimationProject({ selectedKeyframeIds: [id] })}
        />
      )

    // 13. Audio & Lip Sync
    case 'audio':
    case 'lip_sync':
      return (
        <AudioLipSyncPanel
          onGenerateLipSync={onGenerateLipSync}
          onAddAudioClip={audio => {
            const clipId = `audio_${Date.now()}`
            const dummyWaveform = Array.from({ length: 30 }, () => Math.max(0.2, Math.random()))
            onUpdateAnimationProject(prev => ({
              ...prev,
              audioClips: [
                ...(prev.audioClips || []),
                {
                  id: clipId,
                  name: audio.name,
                  type: 'voice' as const,
                  startFrame: prev.currentFrame,
                  durationFrames: audio.durationFrames,
                  volume: 1.0,
                  pan: 0,
                  fadeInFrames: 0,
                  fadeOutFrames: 0,
                  muted: false,
                  solo: false,
                  waveform: dummyWaveform,
                  dialogueText: audio.sampleText
                }
              ]
            }))
          }}
        />
      )

    // 14. Markers
    case 'markers':
      return (
        <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white p-3 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E1E26]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Timeline Markers</h4>
            <button
              onClick={() => {
                const markerId = `marker_${Date.now()}`
                onUpdateAnimationProject(prev => ({
                  ...prev,
                  markers: [
                    ...prev.markers,
                    {
                      id: markerId,
                      frame: prev.currentFrame,
                      label: `Marker ${prev.markers.length + 1}`,
                      color: '#00E676',
                      category: 'event' as const
                    }
                  ].sort((a, b) => a.frame - b.frame)
                }))
              }}
              className="flex items-center gap-1 px-2 py-1 bg-[#00E676]/20 border border-[#00E676]/40 text-[#00E676] rounded-lg text-xs font-bold hover:bg-[#00E676]/30 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Marker</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
            {animationProject.markers.map(m => (
              <div
                key={m.id}
                onClick={() => onSeekAnimation(m.frame)}
                className="p-2 rounded-xl bg-[#14141C] border border-[#222230] hover:border-[#353548] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-xs font-bold text-white">{m.label}</span>
                </div>
                <span className="text-[10px] font-mono text-[#808095]">Frame {m.frame}</span>
              </div>
            ))}
          </div>
        </div>
      )

    // 15. Render
    case 'render':
      return (
        <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white p-4 space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Video className="w-4 h-4 text-[#10B981]" />
              <span>Render Movie Video</span>
            </h3>
            <p className="text-[10px] text-[#707080] mt-0.5">
              Compile 3D animation timeline to video file with full shaders and audio
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#14141C] border border-[#222230] space-y-2 text-xs">
            <div className="flex justify-between text-[#808095]">
              <span>Timeline Duration:</span>
              <span className="font-mono text-white">{animationProject.totalFrames} frames ({(animationProject.totalFrames / animationProject.fps).toFixed(1)}s)</span>
            </div>
            <div className="flex justify-between text-[#808095]">
              <span>Resolution:</span>
              <span className="font-mono text-white">1920 x 1080 (1080p FHD)</span>
            </div>
            <div className="flex justify-between text-[#808095]">
              <span>Framerate:</span>
              <span className="font-mono text-[#10B981] font-bold">{animationProject.fps} FPS</span>
            </div>
          </div>

          <button
            onClick={onTriggerRenderModal}
            className="w-full py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#10B981]/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>Launch Render Sequencer</span>
          </button>
        </div>
      )

    // 16. Camera Live Preview
    case 'preview':
      return (
        <div className="flex flex-col h-full bg-[#0D0D12] select-none text-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Camera Monitor</span>
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1C1C28] text-[#38BDF8]">
              {selectedCameraShot ? selectedCameraShot.name : 'Director Cam'}
            </span>
          </div>
          <div className="flex-1 rounded-xl bg-[#08080C] border border-[#20202E] flex items-center justify-center text-center p-4">
            <div className="text-[11px] text-[#707080] space-y-1">
              <Camera className="w-6 h-6 mx-auto text-[#38BDF8] opacity-70" />
              <p>Active Camera Frame Preview</p>
              <p className="text-[9px] font-mono text-[#505060]">Aspect Ratio 16:9 • FHD Safe Guides</p>
            </div>
          </div>
        </div>
      )

    // 17. Project Settings
    case 'project_settings':
      return (
        <ProjectSettingsPanel
          fps={animationProject.fps}
          totalFrames={animationProject.totalFrames}
          onUpdateFps={fps => onUpdateAnimationProject({ fps })}
          onUpdateTotalFrames={totalFrames => onUpdateAnimationProject({ totalFrames })}
          shadingMode={avatarState.materials?.shadingMode || 'toon'}
          onUpdateShadingMode={shadingMode => {
            onAvatarStateChange(prev => ({
              ...prev,
              materials: {
                ...prev.materials,
                shadingMode: shadingMode as any
              }
            }))
          }}
        />
      )

    default:
      return (
        <div className="p-6 text-center text-xs text-[#707080]">
          Panel "{panelId}" active
        </div>
      )
  }
}
