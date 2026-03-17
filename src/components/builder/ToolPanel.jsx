'use client'

import { useState, useEffect, useRef } from 'react'
import { CATEGORIES, getByCategory } from '@/lib/segments'
import SegmentTile from './SegmentTile'

export default function ToolPanel({
  activeSegment,
  activeRotation,
  selectedPlacement,
  selectedStroke,
  brushMode,
  showGrid,
  snapToGrid,
  stencilGap,
  strokeWidth,
  canUndo,
  canRedo,
  onSelectSegment,
  onRotateActive,
  onToggleBrush,
  onToggleGrid,
  onToggleSnap,
  onUndo,
  onRedo,
  onStencilGapChange,
  onStrokeWidthChange,
  onRotateSelected,
  onDeleteSelected,
  onSubmit,
  onClearCanvas,
}) {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const categoryKeys = Object.keys(CATEGORIES)

  return (
    <div style={{
      width: 264,
      minWidth: 264,
      background: '#111',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'monospace',
    }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', margin: 0 }}>
          LETTERFORM BUILDER
        </p>
      </div>

      {/* Grid toggle */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <ToggleRow label="GRID" value={showGrid} onToggle={onToggleGrid} />
      </div>

      {/* Snap toggle */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <ToggleRow label="SNAP" value={snapToGrid} onToggle={onToggleSnap} accent={!snapToGrid} />
      </div>

      {/* Brush mode toggle */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 8, color: brushMode ? '#60aaff' : 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
            BRUSH MODE
          </span>
          <button
            onClick={onToggleBrush}
            style={{
              padding: '4px 10px',
              background: brushMode ? 'rgba(96,170,255,0.12)' : 'transparent',
              border: `1px solid ${brushMode ? 'rgba(96,170,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 3,
              color: brushMode ? '#60aaff' : 'rgba(255,255,255,0.2)',
              fontSize: 8,
              letterSpacing: '0.15em',
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.12s',
            }}
          >
            {brushMode ? 'ON' : 'OFF'}
          </button>
        </div>
        {brushMode && (
          <p style={{ fontSize: 7, color: 'rgba(96,170,255,0.4)', margin: '5px 0 0', letterSpacing: '0.1em' }}>
            DRAW FREELY — B TO TOGGLE
          </p>
        )}
      </div>

      {/* Undo / Redo */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
        <ActionButton
          label="↩ UNDO"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <ActionButton
          label="↪ REDO"
          onClick={onRedo}
          disabled={!canRedo}
        />
      </div>

      {/* Stencil gap */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SliderRow
          label="STENCIL GAP"
          value={stencilGap}
          min={0} max={12} step={1}
          onChange={onStencilGapChange}
          display={`${stencilGap}px`}
        />
      </div>

      {/* Stroke weight */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SliderRow
          label={selectedPlacement ? 'WEIGHT — SELECTED' : 'WEIGHT — DEFAULT'}
          value={strokeWidth}
          min={4} max={30} step={1}
          onChange={onStrokeWidthChange}
          display={strokeWidth}
          accent={!!selectedPlacement}
        />
      </div>

      {/* Selected segment actions */}
      {selectedPlacement && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
          <ActionButton label="↻ ROTATE" onClick={onRotateSelected} />
          <ActionButton label="× DELETE" onClick={onDeleteSelected} danger />
        </div>
      )}

      {/* Selected stroke actions */}
      {selectedStroke && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
          <ActionButton label="× DELETE STROKE" onClick={onDeleteSelected} danger />
        </div>
      )}

      {/* Active tool — rotation controls */}
      {activeSegment && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(96,170,255,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 8, color: '#60aaff', letterSpacing: '0.15em' }}>
              ● {activeSegment.label.toUpperCase()}
            </span>
            <button
              onClick={() => onSelectSegment(null)}
              style={{ background: 'none', border: 'none', color: '#60aaff', fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
            >×</button>
          </div>
          {activeSegment.allowedRotations.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={onRotateActive}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  background: 'transparent',
                  border: '1px solid rgba(96,170,255,0.25)',
                  borderRadius: 3,
                  color: '#60aaff',
                  fontSize: 8,
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                ↻ ROTATE
              </button>
              <span style={{ fontSize: 9, color: 'rgba(96,170,255,0.5)', fontFamily: 'monospace', minWidth: 28, textAlign: 'right' }}>
                {activeRotation}°
              </span>
            </div>
          )}
        </div>
      )}

      {/* Segment drawer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <button
          onClick={() => setDrawerOpen(o => !o)}
          style={{
            padding: '9px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.2)',
            fontSize: 8,
            letterSpacing: '0.25em',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            flexShrink: 0,
          }}
        >
          <span>SEGMENTS</span>
          <span>{drawerOpen ? '▲' : '▼'}</span>
        </button>

        {drawerOpen && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {categoryKeys.map(categoryKey => {
              const categorySegments = getByCategory(categoryKey)
              if (!categorySegments.length) return null

              // Group within each category by footprint size
              const sizeGroups = {}
              categorySegments.forEach(seg => {
                const [c, r] = seg.footprint
                const sizeKey = `${c}×${r}`
                if (!sizeGroups[sizeKey]) sizeGroups[sizeKey] = []
                sizeGroups[sizeKey].push(seg)
              })
              const sizeKeys = Object.keys(sizeGroups)
              const hasSizeVariants = sizeKeys.length > 1

              return (
                <div key={categoryKey} style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.2em', margin: '0 0 8px' }}>
                    {CATEGORIES[categoryKey].toUpperCase()}
                  </p>

                  {hasSizeVariants ? (
                    sizeKeys.map(sizeKey => (
                      <div key={sizeKey} style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.08)', letterSpacing: '0.12em', margin: '0 0 5px 1px' }}>
                          {sizeKey} GRID
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {sizeGroups[sizeKey].map(seg => (
                            <SegmentTile
                              key={seg.id}
                              segment={seg}
                              isActive={activeSegment?.id === seg.id}
                              onClick={() => onSelectSegment(activeSegment?.id === seg.id ? null : seg)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {categorySegments.map(seg => (
                        <SegmentTile
                          key={seg.id}
                          segment={seg}
                          isActive={activeSegment?.id === seg.id}
                          onClick={() => onSelectSegment(activeSegment?.id === seg.id ? null : seg)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onSubmit}
          style={{
            padding: '8px 0',
            background: 'white',
            color: 'black',
            border: 'none',
            borderRadius: 3,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.2em',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}>
          SUBMIT LETTERFORM →
        </button>
        <button
          onClick={onClearCanvas}
          style={{
            padding: '7px 0',
            background: 'transparent',
            color: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 3,
            fontSize: 8,
            letterSpacing: '0.15em',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          CLEAR CANVAS
        </button>
      </div>
    </div>
  )
}

function ToggleRow({ label, value, onToggle, accent }) {
  // accent=true highlights the OFF state (used for snap toggle to signal free mode is active)
  const offColor = accent ? 'rgba(255,180,50,0.8)' : 'rgba(255,255,255,0.2)'
  const offBorder = accent ? 'rgba(255,180,50,0.3)' : 'rgba(255,255,255,0.06)'
  const offBg = accent ? 'rgba(255,180,50,0.06)' : 'transparent'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 8, color: value ? 'rgba(255,255,255,0.2)' : offColor, letterSpacing: '0.2em' }}>{label}</span>
      <button
        onClick={onToggle}
        style={{
          padding: '4px 10px',
          background: value ? 'rgba(255,255,255,0.07)' : offBg,
          border: `1px solid ${value ? 'rgba(255,255,255,0.15)' : offBorder}`,
          borderRadius: 3,
          color: value ? 'rgba(255,255,255,0.6)' : offColor,
          fontSize: 8,
          letterSpacing: '0.15em',
          cursor: 'pointer',
          fontFamily: 'monospace',
          transition: 'all 0.12s',
        }}
      >
        {value ? 'ON' : 'PIXEL'}
      </button>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, onChange, display, accent }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 8, color: accent ? '#60aaff' : 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>{label}</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: accent ? '#60aaff' : 'white' }}
      />
    </div>
  )
}

function ActionButton({ label, onClick, danger, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        flex: 1,
        padding: '6px 0',
        background: 'transparent',
        border: `1px solid ${
          disabled ? 'rgba(255,255,255,0.04)'
          : danger  ? 'rgba(255,80,80,0.2)'
          :           'rgba(255,255,255,0.08)'
        }`,
        borderRadius: 3,
        color: disabled ? 'rgba(255,255,255,0.12)'
             : danger   ? 'rgba(255,100,100,0.8)'
             :            'rgba(255,255,255,0.4)',
        fontSize: 8,
        letterSpacing: '0.15em',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'monospace',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  )
}