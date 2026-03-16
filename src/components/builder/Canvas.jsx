'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { segments as segmentDefs } from '@/lib/segments'

export const CELL_SIZE = 80
export const COLS = 7
export const ROWS = 8

function computeTransform(vbStr, dx, dy, dw, dh) {
  const [vbX, vbY, vbW, vbH] = vbStr.split(' ').map(Number)
  const sx = dw / vbW
  const sy = dh / vbH
  const tx = dx - vbX * sx
  const ty = dy - vbY * sy
  return { sx, sy, tx, ty }
}

// ─── renderSegmentGeometry ────────────────────────────────────────────────────
// Takes pixel origin (pixelX, pixelY) — the top-left corner of the footprint
// in SVG coordinate space. Works for both snapped and free-placed segments.

function renderSegmentGeometry({ segment, pixelX, pixelY, rotation, strokeWidth, stencilGap, cellSize, color }) {
  const { element, attrs, viewBox: vbStr, footprint, filled } = segment
  const [fpCols, fpRows] = footprint
  const gap = stencilGap

  const clipW = fpCols * cellSize
  const clipH = fpRows * cellSize

  const strokePad = filled ? 0 : strokeWidth / 2
  const dx = pixelX + gap + strokePad
  const dy = pixelY + gap + strokePad
  const dw = clipW - 2 * (gap + strokePad)
  const dh = clipH - 2 * (gap + strokePad)

  const { sx, sy, tx, ty } = computeTransform(vbStr, dx, dy, dw, dh)

  const cx = pixelX + clipW / 2
  const cy = pixelY + clipH / 2

  const elementProps = {
    ...attrs,
    ...(filled
      ? { fill: color }
      : {
          fill: 'none',
          stroke: color,
          strokeWidth: String(strokeWidth),
          vectorEffect: 'non-scaling-stroke',
          strokeMiterlimit: '10',
          strokeLinecap: 'butt',
          strokeLinejoin: 'miter',
        }
    ),
  }

  const El = element

  return (
    <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
      <g transform={`translate(${tx.toFixed(3)}, ${ty.toFixed(3)}) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})`}>
        <El {...elementProps} />
      </g>
    </g>
  )
}

// ─── PlacedSegment ────────────────────────────────────────────────────────────

function PlacedSegment({
  placement, segment, cellSize, stencilGap,
  isSelected, isDragging,
  onClick, onDragStart,
}) {
  const { placementId, x, y, rotation, strokeWidth } = placement
  const { footprint } = segment
  const [fpCols, fpRows] = footprint

  const clipW = fpCols * cellSize
  const clipH = fpRows * cellSize

  const color = isSelected ? '#60aaff' : 'white'
  const opacity = isDragging ? 0.25 : 1

  return (
    <g
      opacity={opacity}
      onClick={(e) => { e.stopPropagation(); onClick?.(placementId) }}
      onMouseDown={(e) => {
        if (e.button !== 0) return
        if (isSelected) {
          e.stopPropagation()
          e.preventDefault()
          onDragStart?.(placementId, e)
        }
      }}
      style={{ cursor: isSelected ? 'grab' : 'pointer' }}
    >
      <g clipPath={`url(#clip-${placementId})`}>
        {renderSegmentGeometry({ segment, pixelX: x, pixelY: y, rotation, strokeWidth, stencilGap, cellSize, color })}
      </g>

      {isSelected && (
        <rect
          x={x + 1}
          y={y + 1}
          width={clipW - 2}
          height={clipH - 2}
          fill="none"
          stroke="#60aaff"
          strokeWidth="0.75"
          strokeDasharray="4 3"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  )
}

// ─── GhostSegment ─────────────────────────────────────────────────────────────

function GhostSegment({ segment, pixelX, pixelY, rotation, strokeWidth, stencilGap, cellSize, fits }) {
  const { footprint } = segment
  const [fpCols, fpRows] = footprint

  const clipW = fpCols * cellSize
  const clipH = fpRows * cellSize

  const color = fits ? 'rgba(255,255,255,0.35)' : 'rgba(255,80,80,0.45)'
  const borderColor = fits ? 'rgba(255,255,255,0.15)' : 'rgba(255,80,80,0.3)'

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={pixelX + 1}
        y={pixelY + 1}
        width={clipW - 2}
        height={clipH - 2}
        fill={fits ? 'rgba(255,255,255,0.02)' : 'rgba(255,80,80,0.04)'}
        stroke={borderColor}
        strokeWidth="0.5"
        strokeDasharray="4 3"
      />
      <clipPath id="ghost-clip">
        <rect x={pixelX} y={pixelY} width={clipW} height={clipH} />
      </clipPath>
      <g clipPath="url(#ghost-clip)">
        {renderSegmentGeometry({ segment, pixelX, pixelY, rotation, strokeWidth, stencilGap, cellSize, color })}
      </g>
    </g>
  )
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

export default function Canvas({
  placedSegments = [],
  activeSegment = null,
  activeRotation = 0,
  selectedPlacementId = null,
  showGrid = true,
  snapToGrid = true,
  stencilGap = 0,
  defaultStrokeWidth = 17,
  onPlace,
  onSelect,
  onMove,
}) {
  // hoverPos stores either { col, row } when snapping, or { x, y } pixels when free
  const [hoverPos, setHoverPos] = useState(null)

  const dragRef = useRef(null)
  const [dragPos, setDragPos] = useState(null)

  const width = COLS * CELL_SIZE
  const height = ROWS * CELL_SIZE

  const cellMap = useMemo(() => {
    const map = {}
    placedSegments.forEach(ps => {
      const seg = segmentDefs.find(s => s.id === ps.segmentId)
      if (!seg) return
      const [fpCols, fpRows] = seg.footprint
      for (let c = ps.cellCol; c < ps.cellCol + fpCols; c++) {
        for (let r = ps.cellRow; r < ps.cellRow + fpRows; r++) {
          const key = `${c}-${r}`
          if (!map[key]) map[key] = []
          map[key].push(ps)
        }
      }
    })
    return map
  }, [placedSegments])

  // ── Coordinate helpers ───────────────────────────────────────────
  // Returns raw SVG pixel coords {x, y}, clamped to canvas bounds
  const pointToSVG = useCallback((clientX, clientY, svgEl) => {
    try {
      const pt = svgEl.createSVGPoint()
      pt.x = clientX
      pt.y = clientY
      const p = pt.matrixTransform(svgEl.getScreenCTM().inverse())
      return {
        x: Math.max(0, Math.min(width,  p.x)),
        y: Math.max(0, Math.min(height, p.y)),
      }
    } catch { return null }
  }, [width, height])

  // Returns snapped cell {col, row}, or null if out of bounds
  const pointToCell = useCallback((clientX, clientY, svgEl) => {
    const p = pointToSVG(clientX, clientY, svgEl)
    if (!p) return null
    const col = Math.floor(p.x / CELL_SIZE)
    const row = Math.floor(p.y / CELL_SIZE)
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) return { col, row }
    return null
  }, [pointToSVG])

  // Returns the appropriate position object based on snap mode
  const pointToPos = useCallback((clientX, clientY, svgEl) => {
    if (snapToGrid) {
      const cell = pointToCell(clientX, clientY, svgEl)
      return cell ? { snapped: true, col: cell.col, row: cell.row } : null
    } else {
      const p = pointToSVG(clientX, clientY, svgEl)
      if (!p) return null
      // Clamp so segment footprint stays within canvas, snap to nearest pixel
      const seg = activeSegment
      if (seg) {
        const [fpCols, fpRows] = seg.footprint
        const maxX = width  - fpCols * CELL_SIZE
        const maxY = height - fpRows * CELL_SIZE
        return {
          snapped: false,
          x: Math.round(Math.max(0, Math.min(maxX, p.x - (fpCols * CELL_SIZE) / 2))),
          y: Math.round(Math.max(0, Math.min(maxY, p.y - (fpRows * CELL_SIZE) / 2))),
        }
      }
      return { snapped: false, x: Math.round(p.x), y: Math.round(p.y) }
    }
  }, [snapToGrid, pointToCell, pointToSVG, activeSegment, width, height])

  // Resolve a pos object to a pixel origin {x, y}
  const posToPixel = useCallback((pos) => {
    if (!pos) return null
    if (pos.snapped) return { x: pos.col * CELL_SIZE, y: pos.row * CELL_SIZE }
    return { x: pos.x, y: pos.y }
  }, [])

  // ── Drag ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((placementId, e) => {
    const svg = e.target.closest('svg')
    dragRef.current = { placementId, svg }
    setDragPos(null)

    const handleMouseMove = (ev) => {
      if (!dragRef.current) return
      const ps = placedSegments.find(p => p.placementId === dragRef.current.placementId)
      const seg = ps ? segmentDefs.find(s => s.id === ps.segmentId) : null
      if (!seg) return

      if (snapToGrid) {
        const cell = pointToCell(ev.clientX, ev.clientY, dragRef.current.svg)
        setDragPos(cell ? { snapped: true, col: cell.col, row: cell.row } : null)
      } else {
        const p = pointToSVG(ev.clientX, ev.clientY, dragRef.current.svg)
        if (p) {
          const [fpCols, fpRows] = seg.footprint
          const maxX = COLS * CELL_SIZE - fpCols * CELL_SIZE
          const maxY = ROWS * CELL_SIZE - fpRows * CELL_SIZE
          setDragPos({
            snapped: false,
            x: Math.round(Math.max(0, Math.min(maxX, p.x - (fpCols * CELL_SIZE) / 2))),
            y: Math.round(Math.max(0, Math.min(maxY, p.y - (fpRows * CELL_SIZE) / 2))),
          })
        }
      }
    }

    const handleMouseUp = (ev) => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (dragRef.current) {
        const ps = placedSegments.find(p => p.placementId === dragRef.current.placementId)
        const seg = ps ? segmentDefs.find(s => s.id === ps.segmentId) : null
        if (ps && seg) {
          if (snapToGrid) {
            const cell = pointToCell(ev.clientX, ev.clientY, dragRef.current.svg)
            if (cell) {
              const [fpCols, fpRows] = seg.footprint
              const fitsGrid = cell.col + fpCols <= COLS && cell.row + fpRows <= ROWS
              const destKey = `${cell.col}-${cell.row}`
              const destCount = (cellMap[destKey] || [])
                .filter(p => p.placementId !== dragRef.current.placementId).length
              if (fitsGrid && destCount < 3) {
                onMove?.(dragRef.current.placementId, {
                  cellCol: cell.col,
                  cellRow: cell.row,
                  x: cell.col * CELL_SIZE,
                  y: cell.row * CELL_SIZE,
                })
              }
            }
          } else {
            const p = pointToSVG(ev.clientX, ev.clientY, dragRef.current.svg)
            if (p) {
              const [fpCols, fpRows] = seg.footprint
              const maxX = COLS * CELL_SIZE - fpCols * CELL_SIZE
              const maxY = ROWS * CELL_SIZE - fpRows * CELL_SIZE
              const px = Math.round(Math.max(0, Math.min(maxX, p.x - (fpCols * CELL_SIZE) / 2)))
              const py = Math.round(Math.max(0, Math.min(maxY, p.y - (fpRows * CELL_SIZE) / 2)))
              onMove?.(dragRef.current.placementId, {
                cellCol: Math.floor(px / CELL_SIZE),
                cellRow: Math.floor(py / CELL_SIZE),
                x: px,
                y: py,
              })
            }
          }
        }
        dragRef.current = null
        setDragPos(null)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [placedSegments, cellMap, onMove, snapToGrid, pointToCell, pointToSVG])

  // ── Hover ────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (dragRef.current) return
    if (!activeSegment) { setHoverPos(null); return }
    setHoverPos(pointToPos(e.clientX, e.clientY, e.currentTarget))
  }, [activeSegment, pointToPos])

  const handleMouseLeave = useCallback(() => {
    if (!dragRef.current) setHoverPos(null)
  }, [])

  // ── Click ────────────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    if (dragRef.current) return
    const pos = pointToPos(e.clientX, e.clientY, e.currentTarget)
    if (!pos) return
    if (activeSegment) {
      const [fpCols, fpRows] = activeSegment.footprint
      if (snapToGrid) {
        if (pos.col + fpCols > COLS || pos.row + fpRows > ROWS) return
        const key = `${pos.col}-${pos.row}`
        if ((cellMap[key] || []).length >= 3) return
        onPlace?.({
          cellCol: pos.col,
          cellRow: pos.row,
          x: pos.col * CELL_SIZE,
          y: pos.row * CELL_SIZE,
        })
      } else {
        // No cell limit check in free mode
        onPlace?.({
          cellCol: Math.floor(pos.x / CELL_SIZE),
          cellRow: Math.floor(pos.y / CELL_SIZE),
          x: Math.round(pos.x),
          y: Math.round(pos.y),
        })
      }
    } else {
      onSelect?.(null)
    }
  }, [activeSegment, snapToGrid, cellMap, onPlace, onSelect, pointToPos])

  // ── Ghost data ───────────────────────────────────────────────────
  const ghostPixel = useMemo(() => {
    if (!hoverPos || !activeSegment) return null
    const pixel = posToPixel(hoverPos)
    if (!pixel) return null
    const [fpCols, fpRows] = activeSegment.footprint
    if (pixel.x + fpCols * CELL_SIZE > width || pixel.y + fpRows * CELL_SIZE > height) return null
    const fits = snapToGrid
      ? (cellMap[`${hoverPos.col}-${hoverPos.row}`] || []).length < 3
      : true
    return { ...pixel, fits }
  }, [hoverPos, activeSegment, snapToGrid, cellMap, posToPixel, width, height])

  // ── Drag preview data ────────────────────────────────────────────
  const dragPreviewPixel = useMemo(() => {
    if (!dragPos || !dragRef.current) return null
    const ps = placedSegments.find(p => p.placementId === dragRef.current?.placementId)
    const seg = ps ? segmentDefs.find(s => s.id === ps.segmentId) : null
    if (!ps || !seg) return null
    const pixel = posToPixel(dragPos)
    if (!pixel) return null
    const [fpCols, fpRows] = seg.footprint
    const fits = snapToGrid
      ? (() => {
          if (!dragPos.snapped) return true
          if (dragPos.col + fpCols > COLS || dragPos.row + fpRows > ROWS) return false
          const destKey = `${dragPos.col}-${dragPos.row}`
          return (cellMap[destKey] || []).filter(p => p.placementId !== ps.placementId).length < 3
        })()
      : true
    return { x: pixel.x, y: pixel.y, w: fpCols * CELL_SIZE, h: fpRows * CELL_SIZE, fits }
  }, [dragPos, placedSegments, cellMap, snapToGrid, posToPixel])

  const isDragging = !!dragRef.current

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCanvasClick}
      style={{
        display: 'block',
        cursor: isDragging ? 'grabbing' : activeSegment ? 'crosshair' : 'default',
      }}
    >
      <defs>
        {placedSegments.map(ps => {
          const seg = segmentDefs.find(s => s.id === ps.segmentId)
          if (!seg) return null
          const [fpCols, fpRows] = seg.footprint
          return (
            <clipPath key={ps.placementId} id={`clip-${ps.placementId}`}>
              <rect
                x={ps.x}
                y={ps.y}
                width={fpCols * CELL_SIZE}
                height={fpRows * CELL_SIZE}
              />
            </clipPath>
          )
        })}
      </defs>

      <rect width={width} height={height} fill="#0f0f0f" />

      {showGrid && (
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" style={{ pointerEvents: 'none' }}>
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={height} />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * CELL_SIZE} x2={width} y2={i * CELL_SIZE} />
          ))}
        </g>
      )}

      {/* Placed segments */}
      {placedSegments.map(ps => {
        const seg = segmentDefs.find(s => s.id === ps.segmentId)
        if (!seg) return null
        return (
          <PlacedSegment
            key={ps.placementId}
            placement={ps}
            segment={seg}
            cellSize={CELL_SIZE}
            stencilGap={stencilGap}
            isSelected={ps.placementId === selectedPlacementId}
            isDragging={isDragging && ps.placementId === selectedPlacementId}
            onClick={onSelect}
            onDragStart={handleDragStart}
          />
        )
      })}

      {/* Ghost preview */}
      {ghostPixel && activeSegment && (
        <GhostSegment
          segment={activeSegment}
          pixelX={ghostPixel.x}
          pixelY={ghostPixel.y}
          rotation={activeRotation}
          strokeWidth={defaultStrokeWidth}
          stencilGap={stencilGap}
          cellSize={CELL_SIZE}
          fits={ghostPixel.fits}
        />
      )}

      {/* Drag destination preview */}
      {dragPreviewPixel && (
        <rect
          x={dragPreviewPixel.x}
          y={dragPreviewPixel.y}
          width={dragPreviewPixel.w}
          height={dragPreviewPixel.h}
          fill={dragPreviewPixel.fits ? 'rgba(96,170,255,0.08)' : 'rgba(255,80,80,0.06)'}
          stroke={dragPreviewPixel.fits ? '#60aaff' : 'rgba(255,80,80,0.4)'}
          strokeWidth="1"
          strokeDasharray="4 3"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  )
}