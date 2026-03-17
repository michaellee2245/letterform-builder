'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const COLS   = 6
const CELL   = 150
const GAP    = 0
const RADIUS = 6

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: '2-digit',
    day:   '2-digit',
    year:  'numeric',
  })
}

function downloadSVG(svgData, filename) {
  const blob = new Blob([svgData], { type: 'image/svg+xml' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function letterLabel(letter) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const nums  = '0123456789'
  if (upper.includes(letter))  return `Uppercase '${letter}'`
  if (lower.includes(letter))  return `Lowercase '${letter}'`
  if (nums.includes(letter))   return `Number '${letter}'`
  return `Glyph '${letter}'`
}

// ─── ArchiveCard ──────────────────────────────────────────────────
function ArchiveCard({ lf, isHighlighted, highlightRef }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      ref={isHighlighted ? highlightRef : null}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:    CELL,
        height:   CELL,
        position: 'relative',
        cursor:   'pointer',
        borderRadius: RADIUS,
        overflow: 'hidden',
        background: '#fff',

      }}
    >
      {/* SVG preview — tight viewBox, no fixed canvas size.
          Inject explicit dimensions + centering so it fills the cell. */}
      <div style={{
        width:      '100%',
        height:     '100%',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:    16,
        boxSizing:  'border-box',
        background: '#fff',
      }}>
        <div
          style={{ width: '100%', height: '100%', lineHeight: 0 }}
          dangerouslySetInnerHTML={{
            __html: lf.svg_data.replace(
              /^<svg/,
              '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet"'
            )
          }}
        />
      </div>

      {/* Hover card — slides up from the bottom */}
      <div
        style={{
          position:   'absolute',
          left: 0, right: 0, bottom: 0,
          background: '#e8261a',
          height: '100%',
          padding:    '10px 10px 8px',
          transform:  hovered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
          display:   'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10,
          boxSizing: 'border-box',
        }}
      >
        <div>

        
        {/* Letter label */}
        <p style={{
          margin:      '0 0 2px',
          fontSize:    11,
          fontWeight:  600,
          color:       '#fff',
          fontFamily:  '"Helvetica Neue", Helvetica, Arial, sans-serif',
          lineHeight:  1.3,
          whiteSpace:  'nowrap',
          overflow:    'hidden',
          textOverflow:'ellipsis',
        }}>
          {letterLabel(lf.letter)}
        </p>
        {/* Creator + date */}
        <p style={{
          margin:     '0 0 8px',
          fontSize:   12,
          color:      'rgba(255,255,255,0.75)',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          lineHeight: 1.4,
        }}>
          Created by {lf.first_name} {lf.last_initial}.,{' '}
          {formatDate(lf.created_at)}
        </p>
        </div>
        {/* Download button */}
        <button
          onClick={e => {
            e.stopPropagation()
            downloadSVG(
              lf.svg_data,
              `${lf.letter}-${lf.first_name}-${lf.last_initial}.svg`
            )
          }}
          style={{
            padding:     '5px 12px',
            background:  '#fff',
            color:       '#000',
            border:      'none',
            borderRadius: '50vw',
            width: '100%',
            fontSize:    10,
            fontWeight:  600,
            fontFamily:  '"Helvetica Neue", Helvetica, Arial, sans-serif',
            cursor:      'pointer',
            letterSpacing: '0.01em',
          }}
        >
          Download →
        </button>
      </div>
    </div>
  )
}

// ─── ArchivePage ──────────────────────────────────────────────────
function ArchivePage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const highlightId  = searchParams.get('highlight')

  const [letterforms, setLetterforms] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const highlightRef = useRef(null)

  useEffect(() => {
    async function fetch() {
      const { data, error: dbError } = await supabase
        .from('letterforms')
        .select('id, created_at, first_name, last_initial, letter, svg_data')
        .order('created_at', { ascending: false })
      if (dbError) { setError('Could not load the archive.'); setLoading(false); return }
      setLetterforms(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!loading && highlightRef.current) {
      setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150)
    }
  }, [loading, highlightId])

  const gridWidth = COLS * CELL

  return (
    <div style={{ minHeight: '100vh', background: '#000', boxSizing: 'border-box' }}>

      {/* Sticky header */}
      <div style={{
        position:     'sticky',
        top:           0,
        zIndex:        10,
        background:   '#000',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding:      '16px 24px',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
      }}>
        <p style={{
          margin:     0,
          flex:       1,
          textAlign:  'center',
          fontSize:   13,
          color:      'rgba(255,255,255,0.7)',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: 400,
          lineHeight: 1.5,
        }}>
          Download the glyphs you like{' '}
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>
            to build your own custom alphabet
          </span>
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px 80px', display: 'flex', justifyContent: 'center' }}>

        {loading && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontFamily: 'monospace' }}>
            LOADING...
          </p>
        )}

        {error && (
          <p style={{ fontSize: 11, color: 'rgba(255,80,80,0.7)', fontFamily: 'monospace' }}>
            {error}
          </p>
        )}

        {!loading && !error && letterforms.length === 0 && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
            NO LETTERFORMS YET — BE THE FIRST.
          </p>
        )}

        {/* White container card — same as selection page */}
        {!loading && !error && letterforms.length > 0 && (
          <div style={{
            width:        gridWidth,
            overflow:     'hidden',
          }}>
            <div style={{
              display:             'grid',
              gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
              gap:                  GAP,
            }}>
              {letterforms.map(lf => (
                <ArchiveCard
                  key={lf.id}
                  lf={lf}
                  isHighlighted={lf.id === highlightId}
                  highlightRef={highlightRef}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed new letterform button */}
      <div style={{
        position: 'fixed',
        bottom:   32,
        right:    32,
        zIndex:   20,
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            padding:       '14px 24px',
            background:    '#fff',
            color:         '#000',
            border:        'none',
            borderRadius:  10,
            fontSize:      13,
            fontFamily:    '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight:    600,
            cursor:        'pointer',
            letterSpacing: '0.01em',
            whiteSpace:    'nowrap',
          }}
        >
          + New Letterform
        </button>
      </div>
    </div>
  )
}

export default function ArchivePageWrapper() {
  return (
    <Suspense>
      <ArchivePage />
    </Suspense>
  )
}