import React, { useState, useEffect, useCallback } from 'react'

interface CinemaResizerProps {
  orientation: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
  onResizeEnd?: () => void
  className?: string
  id?: string
}

export const CinemaResizer: React.FC<CinemaResizerProps> = ({
  orientation,
  onResize,
  onResizeEnd,
  className = '',
  id
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    const startX = e.clientX
    const startY = e.clientY
    let lastX = startX
    let lastY = startY

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      if (orientation === 'vertical') {
        const delta = moveEvent.clientX - lastX
        lastX = moveEvent.clientX
        onResize(delta)
      } else {
        const delta = moveEvent.clientY - lastY
        lastY = moveEvent.clientY
        onResize(delta)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (onResizeEnd) onResizeEnd()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }, [orientation, onResize, onResizeEnd])

  return (
    <div
      id={id}
      onMouseDown={handleMouseDown}
      className={`group relative select-none shrink-0 transition-colors z-20 ${
        orientation === 'vertical'
          ? 'w-2 hover:w-2.5 -mx-1 cursor-col-resize flex items-center justify-center'
          : 'h-2 hover:h-2.5 -my-1 cursor-row-resize flex items-center justify-center'
      } ${isDragging ? 'bg-[#8C7BFF]/30' : 'bg-transparent'} ${className}`}
      title={orientation === 'vertical' ? 'Drag horizontally to resize panel' : 'Drag vertically to resize timeline'}
    >
      {/* Visual Guide Line */}
      <div
        className={`transition-all duration-150 ${
          orientation === 'vertical'
            ? 'w-[2px] h-full group-hover:w-[3px]'
            : 'h-[2px] w-full group-hover:h-[3px]'
        } ${
          isDragging
            ? 'bg-[#8C7BFF] shadow-[0_0_8px_rgba(140,123,255,0.7)]'
            : 'bg-[#2E2548] group-hover:bg-[#8C7BFF] group-hover:shadow-[0_0_6px_rgba(140,123,255,0.5)]'
        }`}
      />

      {/* Grip Indicator Dots */}
      <div
        className={`absolute pointer-events-none flex items-center justify-center gap-0.5 rounded-full px-1 py-0.5 transition-all ${
          isDragging ? 'bg-[#8C7BFF] text-[#16121E]' : 'bg-[#251E38] group-hover:bg-[#8C7BFF] text-[#8C7BFF] group-hover:text-[#16121E]'
        } ${orientation === 'vertical' ? 'flex-col h-6 w-3' : 'flex-row w-6 h-3'}`}
      >
        <span className="w-1 h-1 rounded-full bg-current" />
        <span className="w-1 h-1 rounded-full bg-current" />
        <span className="w-1 h-1 rounded-full bg-current" />
      </div>
    </div>
  )
}
