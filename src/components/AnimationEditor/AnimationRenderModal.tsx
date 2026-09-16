/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react'
import { 
  X, 
  Film, 
  Download, 
  Play, 
  Check, 
  Loader2, 
  Sparkles, 
  Video, 
  Sliders, 
  Clock, 
  FileVideo, 
  Layers,
  AlertCircle
} from 'lucide-react'
import { AnimationProject } from '../../types/animation'

interface AnimationRenderModalProps {
  isOpen: boolean
  onClose: () => void
  project: AnimationProject
  onSeekFrame: (frame: number) => void
  getCanvasElement: () => HTMLCanvasElement | null
}

export const AnimationRenderModal: React.FC<AnimationRenderModalProps> = ({
  isOpen,
  onClose,
  project,
  onSeekFrame,
  getCanvasElement
}) => {
  const [resolutionPreset, setResolutionPreset] = useState<'1080p' | '720p' | '4k' | 'vertical'>('1080p')
  const [exportFormat, setExportFormat] = useState<'webm' | 'mp4' | 'gif' | 'png'>('webm')
  const [fps, setFps] = useState<number>(project.fps || 24)
  const [frameRangeMode, setFrameRangeMode] = useState<'all' | 'in_out' | 'custom'>('all')
  const [customStart, setCustomStart] = useState<number>(0)
  const [customEnd, setCustomEnd] = useState<number>(project.totalFrames)
  const [videoQuality, setVideoQuality] = useState<'high' | 'ultra' | 'preview'>('high')
  
  // Render state
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [currentRenderFrame, setCurrentRenderFrame] = useState(0)
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null)
  const [renderedSizeMb, setRenderedSizeMb] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stopRequestedRef = useRef(false)

  if (!isOpen) return null

  // Calculate active frame range
  const getRenderRange = () => {
    if (frameRangeMode === 'in_out') {
      return { start: project.inPoint || 0, end: project.outPoint || project.totalFrames }
    }
    if (frameRangeMode === 'custom') {
      return { start: Math.max(0, customStart), end: Math.min(project.totalFrames, customEnd) }
    }
    return { start: 0, end: project.totalFrames }
  }

  const { start: startFrame, end: endFrame } = getRenderRange()
  const totalFramesToRender = Math.max(1, endFrame - startFrame)
  const durationSec = (totalFramesToRender / fps).toFixed(1)

  const handleStartRender = async () => {
    const canvas = getCanvasElement()
    if (!canvas) {
      setErrorMessage("Could not detect active 3D canvas for recording.")
      return
    }

    setIsRendering(true)
    setRenderProgress(0)
    setCurrentRenderFrame(startFrame)
    setRenderedBlobUrl(null)
    setErrorMessage(null)
    stopRequestedRef.current = false

    try {
      // Set up MediaRecorder from canvas stream
      const stream = canvas.captureStream(fps)
      
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ]
      const selectedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm'

      const bitrateMap = {
        preview: 2_500_000,
        high: 8_000_000,
        ultra: 16_000_000
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: bitrateMap[videoQuality]
      })

      const recordedChunks: Blob[] = []
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data)
        }
      }

      recorder.start()

      // Step frame by frame with timing sync
      const frameIntervalMs = 1000 / fps
      for (let f = startFrame; f <= endFrame; f++) {
        if (stopRequestedRef.current) break

        setCurrentRenderFrame(f)
        onSeekFrame(f)
        setRenderProgress(Math.round(((f - startFrame) / totalFramesToRender) * 100))

        // Yield execution so Three.js renders the frame to canvas
        await new Promise(resolve => setTimeout(resolve, frameIntervalMs * 0.75))
      }

      // Stop recording
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
        recorder.stop()
      })

      const blob = new Blob(recordedChunks, { type: selectedMime })
      const url = URL.createObjectURL(blob)
      setRenderedBlobUrl(url)
      setRenderedSizeMb(Number((blob.size / (1024 * 1024)).toFixed(2)))
      setIsRendering(false)
      setRenderProgress(100)
    } catch (err: any) {
      console.error("Render failed:", err)
      setErrorMessage(err.message || "Recording encountered an unexpected error.")
      setIsRendering(false)
    }
  }

  const handleDownload = () => {
    if (!renderedBlobUrl) return
    const a = document.createElement('a')
    a.href = renderedBlobUrl
    const safeProjectName = (project.name || 'VoomToon_Animation').replace(/[^a-zA-Z0-9_-]/g, '_')
    const ext = exportFormat === 'mp4' ? 'mp4' : exportFormat === 'gif' ? 'gif' : exportFormat === 'png' ? 'zip' : 'webm'
    a.download = `${safeProjectName}_${resolutionPreset}_${fps}fps.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCancelRender = () => {
    stopRequestedRef.current = true
    setIsRendering(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#0F0F16] border border-[#242434] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F2E] bg-[#14141E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">
                RENDER ANIMATION SEQUENCER
              </h2>
              <p className="text-xs text-[#707085]">
                Export cinematic video movie directly from your 3D timeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isRendering}
            className="p-1.5 rounded-lg text-[#707080] hover:text-white hover:bg-[#20202E] transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#A0A0B5]">
          {/* Resolution Presets */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#808095] mb-2 block">
              Resolution & Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '1080p', label: '1080p FHD', desc: '1920x1080 (16:9)' },
                { id: '720p', label: '720p HD', desc: '1280x720 (Fast)' },
                { id: 'vertical', label: '9:16 Vertical', desc: '1080x1920 Shorts' },
                { id: '4k', label: '4K Ultra', desc: '3840x2160 UHD' }
              ].map(item => (
                <button
                  key={item.id}
                  disabled={isRendering}
                  onClick={() => setResolutionPreset(item.id as any)}
                  className={`flex flex-col p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    resolutionPreset === item.id
                      ? 'bg-[#10B981]/15 border-[#10B981] text-white'
                      : 'bg-[#14141E] border-[#222230] text-[#9090A0] hover:border-[#353548]'
                  }`}
                >
                  <span className="font-bold text-xs">{item.label}</span>
                  <span className="text-[9px] text-[#606070] mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#808095] mb-2 block">
              Container Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'webm', label: 'WebM Video', desc: 'Fast & High Quality' },
                { id: 'mp4', label: 'MP4 Video', desc: 'Universal Playback' },
                { id: 'gif', label: 'Animated GIF', desc: 'Social & Web loops' },
                { id: 'png', label: 'PNG Sequence', desc: 'Lossless frame set' }
              ].map(fmt => (
                <button
                  key={fmt.id}
                  disabled={isRendering}
                  onClick={() => setExportFormat(fmt.id as any)}
                  className={`flex flex-col p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    exportFormat === fmt.id
                      ? 'bg-[#10B981]/15 border-[#10B981] text-white'
                      : 'bg-[#14141E] border-[#222230] text-[#9090A0] hover:border-[#353548]'
                  }`}
                >
                  <span className="font-bold text-xs">{fmt.label}</span>
                  <span className="text-[9px] text-[#606070] mt-0.5">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Framerate & Quality */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#808095] mb-1.5 block">
                Framerate (FPS)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[24, 30, 60].map(val => (
                  <button
                    key={val}
                    disabled={isRendering}
                    onClick={() => setFps(val)}
                    className={`py-1.5 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      fps === val
                        ? 'bg-[#10B981] text-black border-[#10B981]'
                        : 'bg-[#14141E] border-[#222230] text-[#A0A0B0] hover:bg-[#1A1A26]'
                    }`}
                  >
                    {val} fps
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#808095] mb-1.5 block">
                Encoding Bitrate
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'preview', label: 'Draft' },
                  { id: 'high', label: 'High (8M)' },
                  { id: 'ultra', label: 'Master' }
                ].map(item => (
                  <button
                    key={item.id}
                    disabled={isRendering}
                    onClick={() => setVideoQuality(item.id as any)}
                    className={`py-1.5 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                      videoQuality === item.id
                        ? 'bg-[#10B981] text-black border-[#10B981]'
                        : 'bg-[#14141E] border-[#222230] text-[#A0A0B0] hover:bg-[#1A1A26]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Frame Range Options */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#808095]">
                Export Range ({totalFramesToRender} frames · ~{durationSec}s)
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Full Project', desc: `0 to ${project.totalFrames}` },
                { id: 'in_out', label: 'In/Out Points', desc: `${project.inPoint || 0} to ${project.outPoint || project.totalFrames}` },
                { id: 'custom', label: 'Custom Range', desc: 'Specify frames' }
              ].map(opt => (
                <button
                  key={opt.id}
                  disabled={isRendering}
                  onClick={() => setFrameRangeMode(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    frameRangeMode === opt.id
                      ? 'bg-[#10B981]/15 border-[#10B981] text-white'
                      : 'bg-[#14141E] border-[#222230] text-[#9090A0] hover:border-[#353548]'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[9px] text-[#606070] mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {frameRangeMode === 'custom' && (
              <div className="flex items-center gap-3 mt-2.5 p-2 bg-[#14141E] border border-[#222230] rounded-xl">
                <span className="text-[11px] text-[#808090]">From Frame:</span>
                <input
                  type="number"
                  min={0}
                  max={customEnd}
                  value={customStart}
                  onChange={e => setCustomStart(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 bg-[#1A1A26] border border-[#2F2F40] rounded text-white font-mono text-center"
                />
                <span className="text-[11px] text-[#808090]">To Frame:</span>
                <input
                  type="number"
                  min={customStart}
                  max={project.totalFrames}
                  value={customEnd}
                  onChange={e => setCustomEnd(parseInt(e.target.value) || project.totalFrames)}
                  className="w-16 px-2 py-1 bg-[#1A1A26] border border-[#2F2F40] rounded text-white font-mono text-center"
                />
              </div>
            )}
          </div>

          {/* Progress / Status Bar */}
          {isRendering && (
            <div className="p-4 bg-[#14141E] border border-[#10B981]/30 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2 text-[#10B981]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Encoding Frame {currentRenderFrame} of {endFrame}...</span>
                </div>
                <span className="text-white font-mono">{renderProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#1E1E2C] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#00E676] transition-all duration-150"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Render Result Preview */}
          {renderedBlobUrl && !isRendering && (
            <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2.5 text-[#10B981] font-bold text-xs">
                <Check className="w-4 h-4" />
                <span>Render Complete! Generated {renderedSizeMb} MB WebM Video</span>
              </div>
              <video 
                src={renderedBlobUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full rounded-lg border border-[#242436] max-h-48 object-contain bg-black"
              />
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl flex items-center gap-2 text-[#EF4444] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1F1F2E] bg-[#14141E]">
          <span className="text-[10px] text-[#606070] font-mono">
            Direct GPU Canvas Encoder · Zero Upload Required
          </span>

          <div className="flex items-center gap-2.5">
            {isRendering ? (
              <button
                onClick={handleCancelRender}
                className="px-4 py-2 rounded-xl bg-[#222230] hover:bg-[#2C2C3E] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancel Render
              </button>
            ) : renderedBlobUrl ? (
              <>
                <button
                  onClick={handleStartRender}
                  className="px-4 py-2 rounded-xl bg-[#20202E] hover:bg-[#2A2A3C] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Re-Render
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#10B981]/25 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleStartRender}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#10B981]/25 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Start Video Render</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
