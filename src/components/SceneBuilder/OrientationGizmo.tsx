import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

export type AxisDirection = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz'

interface OrientationGizmoProps {
  onSnapDirection: (dir: AxisDirection) => void
  onOrbitDelta?: (deltaX: number, deltaY: number) => void
  subscribeCamera?: (cb: (quaternion: THREE.Quaternion) => void) => () => void
  className?: string
}

interface ProjectedAxis {
  id: AxisDirection
  label: string
  fullName: string
  color: string
  hoverColor: string
  x: number
  y: number
  depth: number
  isPositive: boolean
}

const AXIS_DEFS: {
  id: AxisDirection
  label: string
  fullName: string
  color: string
  hoverColor: string
  dir: [number, number, number]
  isPositive: boolean
}[] = [
  { id: 'px', label: 'X', fullName: 'Right View (+X)', color: '#EF4444', hoverColor: '#F87171', dir: [1, 0, 0], isPositive: true },
  { id: 'nx', label: '-X', fullName: 'Left View (-X)', color: '#DC2626', hoverColor: '#EF4444', dir: [-1, 0, 0], isPositive: false },
  { id: 'py', label: 'Y', fullName: 'Top View (+Y)', color: '#10B981', hoverColor: '#34D399', dir: [0, 1, 0], isPositive: true },
  { id: 'ny', label: '-Y', fullName: 'Bottom View (-Y)', color: '#059669', hoverColor: '#10B981', dir: [0, -1, 0], isPositive: false },
  { id: 'pz', label: 'Z', fullName: 'Front View (+Z)', color: '#3B82F6', hoverColor: '#60A5FA', dir: [0, 0, 1], isPositive: true },
  { id: 'nz', label: '-Z', fullName: 'Back View (-Z)', color: '#2563EB', hoverColor: '#3B82F6', dir: [0, 0, -1], isPositive: false }
]

export const OrientationGizmo: React.FC<OrientationGizmoProps> = ({
  onSnapDirection,
  onOrbitDelta,
  subscribeCamera,
  className = ''
}) => {
  const [hoveredAxis, setHoveredAxis] = useState<AxisDirection | null>(null)
  const [axes, setAxes] = useState<ProjectedAxis[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const quatRef = useRef<THREE.Quaternion>(new THREE.Quaternion())

  const updateAxes = useCallback((q: THREE.Quaternion) => {
    quatRef.current.copy(q)
    const invQ = q.clone().invert()
    const radius = 30
    const cx = 42
    const cy = 42

    const projected: ProjectedAxis[] = AXIS_DEFS.map(def => {
      const vec = new THREE.Vector3(...def.dir).applyQuaternion(invQ)
      return {
        id: def.id,
        label: def.label,
        fullName: def.fullName,
        color: def.color,
        hoverColor: def.hoverColor,
        x: cx + vec.x * radius,
        y: cy - vec.y * radius,
        depth: vec.z,
        isPositive: def.isPositive
      }
    })

    // Sort by depth ascending so farthest items render first (behind)
    projected.sort((a, b) => a.depth - b.depth)
    setAxes(projected)
  }, [])

  useEffect(() => {
    // Initial default orientation (facing front)
    updateAxes(new THREE.Quaternion())

    if (subscribeCamera) {
      const unsubscribe = subscribeCamera(q => {
        updateAxes(q)
      })
      return () => unsubscribe()
    }
  }, [subscribeCamera, updateAxes])

  // Drag to orbit interaction on gizmo disc
  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking on an axis button directly, don't initiate orbit drag
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !onOrbitDelta) return
    const dx = e.clientX - dragStartPos.current.x
    const dy = e.clientY - dragStartPos.current.y
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    onOrbitDelta(dx, dy)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    }
  }

  const cx = 42
  const cy = 42

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title="Orientation Gizmo — Click axis to snap view · Drag to orbit (Blender style)"
      className={`relative w-[84px] h-[84px] rounded-full bg-[#120F1A]/85 backdrop-blur-md border border-[#3E3360] shadow-2xl select-none cursor-grab active:cursor-grabbing group transition-all duration-150 ${className}`}
      style={{ touchAction: 'none' }}
    >
      <svg className="w-full h-full pointer-events-none" viewBox="0 0 84 84">
        {/* Subtle center hub circle */}
        <circle cx={cx} cy={cy} r={3.5} fill="#4C3D70" opacity={0.6} />

        {/* Lines from center to each axis pole */}
        {axes.map(axis => {
          const isFaded = axis.depth < -0.15
          return (
            <line
              key={`line-${axis.id}`}
              x1={cx}
              y1={cy}
              x2={axis.x}
              y2={axis.y}
              stroke={axis.color}
              strokeWidth={axis.isPositive ? 1.8 : 1.2}
              strokeOpacity={isFaded ? 0.25 : 0.75}
              strokeDasharray={axis.isPositive ? 'none' : '2,2'}
            />
          )
        })}
      </svg>

      {/* Axis Nodes / Bubbles */}
      {axes.map(axis => {
        const isHovered = hoveredAxis === axis.id
        const isFacingBack = axis.depth < -0.2
        const size = axis.isPositive ? (isHovered ? 20 : 17) : (isHovered ? 13 : 10)
        const radius = size / 2

        return (
          <button
            key={axis.id}
            type="button"
            onClick={e => {
              e.stopPropagation()
              onSnapDirection(axis.id)
            }}
            onMouseEnter={() => setHoveredAxis(axis.id)}
            onMouseLeave={() => setHoveredAxis(null)}
            title={axis.fullName}
            style={{
              left: `${axis.x - radius}px`,
              top: `${axis.y - radius}px`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: axis.isPositive
                ? isHovered ? axis.hoverColor : axis.color
                : isHovered ? axis.hoverColor : '#231B38',
              borderColor: axis.color,
              opacity: isFacingBack ? 0.45 : 1,
              zIndex: Math.round((axis.depth + 1.5) * 10)
            }}
            className={`absolute rounded-full flex items-center justify-center border font-bold text-[10px] text-white cursor-pointer shadow-md transition-transform duration-75 hover:scale-115 active:scale-95 ${
              isHovered ? 'ring-2 ring-white/50' : ''
            }`}
          >
            {axis.isPositive && <span>{axis.label}</span>}
          </button>
        )
      })}

      {/* Hover tooltip indicator at bottom */}
      {hoveredAxis && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap px-1.5 py-0.5 rounded bg-[#1A1528] border border-[#3E3360] text-[9px] font-bold text-white shadow-lg animate-in fade-in">
          {AXIS_DEFS.find(a => a.id === hoveredAxis)?.fullName}
        </div>
      )}
    </div>
  )
}
