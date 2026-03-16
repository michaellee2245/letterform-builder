'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COLS = 6

const GRID_ITEMS = [
  { type: 'label', text: 'Uppercase Alphabet', id: 'label-upper' },
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => ({ type: 'char', char: c })),
  { type: 'label', text: 'Lowercase Alphabet', id: 'label-lower' },
  ...'abcdefghijklmnopqrstuvwxyz'.split('').map(c => ({ type: 'char', char: c })),
  { type: 'label', text: 'Numbers', id: 'label-num' },
  ...'0123456789'.split('').map(c => ({ type: 'char', char: c })),
  { type: 'label', text: 'Extras', id: 'label-extras' },
  ...['!', '?', '.', ',', ':', ';', '(', ')', '+', '-', '/', '\\', '@', '#', '$', '%', '*', '&'].map(c => ({ type: 'char', char: c })),
]

const CELL   = 150
const GAP    = 0
const RADIUS = 6

export default function SelectionPage() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered]   = useState(null)
  const router = useRouter()

  const handleGetStarted = () => {
    if (!selected) return
    router.push(`/build?letter=${encodeURIComponent(selected)}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      boxSizing: 'border-box',
    }}>

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#000',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{
          margin: 0,
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: 400,
          lineHeight: 1.5,
        }}>
          This is a typeface creation tool,{' '}
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>
            click on a glyph to begin
          </span>
        </p>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div style={{
        padding: '24px 20px 100px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
          gap: GAP,
        }}>
          {GRID_ITEMS.map((item, i) => {
            if (item.type === 'label') {
              return (
                <div
                  key={item.id}
                  style={{
                    width: CELL,
                    height: CELL,
                    background: '#e8261a',
                    borderRadius: RADIUS,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 9px',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{
                    fontSize: 12,
                    color: '#fff',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}>
                    {item.text}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: '#fff',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    marginTop: 1,
                  }}>→</span>
                </div>
              )
            }

            const isSelected = selected === item.char
            const isHovered  = hovered === i && !isSelected

            return (
              <div
                key={`${item.char}-${i}`}
                onClick={() => setSelected(prev => prev === item.char ? null : item.char)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: CELL,
                  height: CELL,
                  background: isSelected ? '#e0e0e0' : isHovered ? '#f5f5f5' : '#fff',
                  borderRadius: RADIUS,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  outline: 'none',
                  outlineOffset: 2,
                  transition: 'background 0.08s',
                }}
              >
                <span style={{
                  fontSize: 38,
                  lineHeight: 1,
                  color: '#000',
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontWeight: 400,
                  userSelect: 'none',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                  display: 'block',
                  transition: 'transform 0.08s',
                }}>
                  {item.char}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Fixed Get Started button ───────────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(0,0,0,1)',
        borderRadius: 10,
        padding: '12px 16px',
        transition: 'opacity 0.2s, transform 0.2s',
        opacity: selected ? 1 : 0,
        transform: selected ? 'translateX(0)' : 'translateX(100%)',
        pointerEvents: selected ? 'auto' : 'none',
      }}>
        {/* Selected letter preview */}
        {selected && (
          <div style={{
            width: 48,
            height: 48,
            background: '#fff',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 28,
              color: '#000',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 400,
              lineHeight: 1,
              userSelect: 'none',
            }}>
              {selected}
            </span>
          </div>
        )}

        <button
          onClick={handleGetStarted}
          style={{
            padding: '14px 24px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          Get Started →
        </button>
      </div>
    </div>
  )
}