'use client'

import { useState, useEffect, useRef } from 'react'

const TILE_SIZE = 48
const TILE_PADDING = 5
const TILE_DISPLAY_STROKE = 3  // fixed screen-pixel stroke for all tiles

export default function SegmentTile({ segment, isActive, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const btnRef = useRef(null)

  // Scroll into view when activated via keyboard arrow navigation
  useEffect(() => {
    if (isActive && btnRef.current) {
      btnRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isActive])
  const { element, attrs, viewBox: vbStr, filled, label, footprint } = segment

  const [vbX, vbY, vbW, vbH] = vbStr.split(' ').map(Number)

  // Same "stroke inside" inset as Canvas — strokePad so the outer stroke
  // edge aligns with the tile boundary rather than being half-clipped
  const strokePad = filled ? 0 : TILE_DISPLAY_STROKE / 2
  const area = TILE_SIZE - TILE_PADDING * 2 - strokePad * 2
  const innerOffset = TILE_PADDING + strokePad
  const sx = area / vbW
  const sy = area / vbH
  const tx = innerOffset - vbX * sx
  const ty = innerOffset - vbY * sy

  const color = isActive ? '#60aaff' : 'rgba(255,255,255,0.7)'

  const elementProps = {
    ...attrs,
    ...(filled
      ? { fill: color }
      : {
          fill: 'none',
          stroke: color,
          strokeWidth: String(TILE_DISPLAY_STROKE),
          vectorEffect: 'non-scaling-stroke',
          strokeMiterlimit: '10',
          strokeLinecap: 'butt',
          strokeLinejoin: 'miter',
        }
    ),
  }

  const El = element
  const [fpCols, fpRows] = footprint

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          padding: 0,
          background: isActive ? 'rgba(96,170,255,0.08)' : 'transparent',
          border: `1px solid ${isActive ? 'rgba(96,170,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 4,
          cursor: 'pointer',
          display: 'block',
          transition: 'border-color 0.12s, background 0.12s',
        }}
      >
        <svg
          width={TILE_SIZE}
          height={TILE_SIZE}
          viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`}
          style={{ display: 'block' }}
        >
          <clipPath id={`tile-clip-${segment.id}`}>
            <rect x={1} y={1} width={TILE_SIZE - 2} height={TILE_SIZE - 2} />
          </clipPath>
          <g clipPath={`url(#tile-clip-${segment.id})`}>
            <g transform={`translate(${tx.toFixed(3)}, ${ty.toFixed(3)}) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})`}>
              <El {...elementProps} />
            </g>
          </g>
        </svg>
      </button>

      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 3,
          padding: '4px 8px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 50,
        }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
            {label}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', fontFamily: 'monospace', marginTop: 1 }}>
            {fpCols}×{fpRows} grid
          </div>
        </div>
      )}
    </div>
  )
}