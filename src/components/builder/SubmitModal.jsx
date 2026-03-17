'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { exportToSVG } from '@/lib/exportSvg'

const INPUT_STYLE = {
  width: '100%',
  padding: '10px 12px',
  background: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  color: 'white',
  fontSize: 13,
  fontFamily: 'monospace',
  outline: 'none',
  boxSizing: 'border-box',
  letterSpacing: '0.05em',
}

const LABEL_STYLE = {
  fontSize: 8,
  color: 'rgba(255,255,255,0.3)',
  letterSpacing: '0.2em',
  fontFamily: 'monospace',
  display: 'block',
  marginBottom: 5,
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SubmitModal({
  letter,
  placedSegments,
  stencilGap,
  onClose,
  onSuccess,
}) {
  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const today = new Date()
  const dateString = formatDate(today)

  const canSubmit = firstName.trim().length > 0 && lastInitial.trim().length > 0 && !loading

  const handleCreate = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      const svgData = exportToSVG(placedSegments, stencilGap, letter)

      const { data, error: dbError } = await supabase
        .from('letterforms')
        .insert({
          first_name:   firstName.trim(),
          last_initial: lastInitial.trim().toUpperCase().charAt(0),
          letter:       letter,
          svg_data:     svgData,
          placements:   placedSegments,
        })
        .select('id')
        .single()

      if (dbError) throw dbError

      onSuccess(data.id)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '32px 28px',
          width: 340,
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.25em' }}>
              SUBMITTING LETTERFORM
            </span>
            <span style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'white',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              lineHeight: 1,
            }}>
              {letter}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.6 }}>
            Your letterform will be added to the public archive.
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>

          {/* First name + last initial side by side */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 2 }}>
              <label style={LABEL_STYLE}>FIRST NAME</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Ada"
                autoFocus
                style={INPUT_STYLE}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={LABEL_STYLE}>LAST INITIAL</label>
              <input
                type="text"
                value={lastInitial}
                onChange={e => setLastInitial(e.target.value.slice(0, 1))}
                placeholder="L"
                maxLength={1}
                style={INPUT_STYLE}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>

          {/* Date — read only */}
          <div>
            <label style={LABEL_STYLE}>DATE</label>
            <div style={{
              ...INPUT_STYLE,
              color: 'rgba(255,255,255,0.3)',
              cursor: 'default',
            }}>
              {dateString}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 10, color: 'rgba(255,80,80,0.8)', margin: '0 0 14px', letterSpacing: '0.05em' }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              color: 'rgba(255,255,255,0.35)',
              fontSize: 9,
              letterSpacing: '0.15em',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            style={{
              flex: 2,
              padding: '10px 0',
              background: canSubmit ? 'white' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 4,
              color: canSubmit ? 'black' : 'rgba(255,255,255,0.2)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.2em',
              cursor: canSubmit ? 'pointer' : 'default',
              fontFamily: 'monospace',
              transition: 'all 0.12s',
            }}
          >
            {loading ? 'CREATING...' : 'CREATE →'}
          </button>
        </div>
      </div>
    </div>
  )
}