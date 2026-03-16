'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Canvas from '@/components/builder/Canvas'
import ToolPanel from '@/components/builder/ToolPanel'
import { segments as allSegments, getSegmentById, nextRotation, DEFAULT_STROKE } from '@/lib/segments'

export default function BuilderPage() {

  // ── History-aware segments state ─────────────────────────────────────────────
  // Instead of a plain useState, we keep a history stack in a ref so undo/redo
  // never causes stale closure issues in event listeners.
  //
  //   history.current = {
  //     past:    [ [...placedSegments], ... ],   // older states, index 0 = oldest
  //     present: [ ...placedSegments ],           // current state
  //     future:  [ [...placedSegments], ... ],   // states ahead of present
  //   }
  //
  // Calling commit(nextSegments) pushes present → past, sets present = next,
  // and clears future. Undo/redo move the pointer without losing any state.

  const history = useRef({ past: [], present: [], future: [] })
  const [placedSegments, setPlacedSegmentsState] = useState([])

  const commit = useCallback((nextSegments) => {
    history.current = {
      past: [...history.current.past, history.current.present],
      present: nextSegments,
      future: [],
    }
    setPlacedSegmentsState(nextSegments)
  }, [])

  const handleUndo = useCallback(() => {
    const { past, present, future } = history.current
    if (past.length === 0) return
    const previous = past[past.length - 1]
    history.current = {
      past: past.slice(0, -1),
      present: previous,
      future: [present, ...future],
    }
    setPlacedSegmentsState(previous)
  }, [])

  const handleRedo = useCallback(() => {
    const { past, present, future } = history.current
    if (future.length === 0) return
    const next = future[0]
    history.current = {
      past: [...past, present],
      present: next,
      future: future.slice(1),
    }
    setPlacedSegmentsState(next)
  }, [])

  // ── Selection + tool state (not tracked in history) ──────────────────────────
  const [selectedPlacementId, setSelectedPlacementId] = useState(null)
  const [activeSegment, setActiveSegmentRaw]    = useState(null)
  const [activeRotation, setActiveRotation]     = useState(0)
  const [showGrid, setShowGrid]                 = useState(true)
  const [stencilGap, setStencilGap]             = useState(0)
  const [defaultStroke, setDefaultStroke]       = useState(DEFAULT_STROKE)
  const [snapToGrid, setSnapToGrid]             = useState(true)

  const selectedPlacement = placedSegments.find(ps => ps.placementId === selectedPlacementId) ?? null

  const handleSelectSegment = useCallback((seg) => {
    setActiveSegmentRaw(seg)
    setActiveRotation(seg ? seg.allowedRotations[0] : 0)
    setSelectedPlacementId(null)
  }, [])

  // ── Rotate active tool ────────────────────────────────────────────────────────
  const handleRotateActive = useCallback(() => {
    if (!activeSegment) return
    setActiveRotation(prev => {
      const rotations = activeSegment.allowedRotations
      const idx = rotations.indexOf(prev)
      return rotations[(idx + 1) % rotations.length]
    })
  }, [activeSegment])

  // ── Place ─────────────────────────────────────────────────────────────────────
  const handlePlace = useCallback((pos) => {
    if (!activeSegment) return
    const newPlacement = {
      placementId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      cellCol: pos.cellCol,
      cellRow: pos.cellRow,
      x: pos.x,
      y: pos.y,
      segmentId: activeSegment.id,
      rotation: activeRotation,
      strokeWidth: defaultStroke,
    }
    commit([...history.current.present, newPlacement])
  }, [activeSegment, activeRotation, defaultStroke, commit])

  // ── Select ────────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((placementId) => {
    setSelectedPlacementId(prev => prev === placementId ? null : placementId)
    if (placementId !== null) setActiveSegmentRaw(null)
  }, [])

  // ── Rotate selected ───────────────────────────────────────────────────────────
  const handleRotateSelected = useCallback(() => {
    if (!selectedPlacement) return
    const seg = getSegmentById(selectedPlacement.segmentId)
    if (!seg) return
    const next = nextRotation(seg, selectedPlacement.rotation)
    commit(history.current.present.map(ps =>
      ps.placementId === selectedPlacementId ? { ...ps, rotation: next } : ps
    ))
  }, [selectedPlacement, selectedPlacementId, commit])

  // ── Delete selected ───────────────────────────────────────────────────────────
  const handleDeleteSelected = useCallback(() => {
    if (!selectedPlacementId) return
    commit(history.current.present.filter(ps => ps.placementId !== selectedPlacementId))
    setSelectedPlacementId(null)
  }, [selectedPlacementId, commit])

  // ── Stroke weight ─────────────────────────────────────────────────────────────
  const handleStrokeWidthChange = useCallback((value) => {
    if (selectedPlacementId) {
      commit(history.current.present.map(ps =>
        ps.placementId === selectedPlacementId ? { ...ps, strokeWidth: value } : ps
      ))
    } else {
      setDefaultStroke(value)
    }
  }, [selectedPlacementId, commit])

  // ── Move ──────────────────────────────────────────────────────────────────────
  const handleMove = useCallback((placementId, pos) => {
    commit(history.current.present.map(ps =>
      ps.placementId === placementId
        ? { ...ps, cellCol: pos.cellCol, cellRow: pos.cellRow, x: pos.x, y: pos.y }
        : ps
    ))
  }, [commit])

  // ── Clear canvas ──────────────────────────────────────────────────────────────
  const handleClearCanvas = useCallback(() => {
    commit([])
    setSelectedPlacementId(null)
    setActiveSegmentRaw(null)
    setActiveRotation(0)
  }, [commit])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  //   Cmd/Ctrl + Z           — undo
  //   Cmd/Ctrl + Shift + Z   — redo
  //   R                      — rotate active tool or selected segment
  //   ArrowRight / ArrowLeft — cycle segment library
  //   Delete / Backspace     — delete selected segment
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return

      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }

      if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
        return
      }

      if (e.key === 'r' || e.key === 'R') {
        if (activeSegment) handleRotateActive()
        else if (selectedPlacement) handleRotateSelected()
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const currentIdx = activeSegment
          ? allSegments.findIndex(s => s.id === activeSegment.id)
          : -1
        const nextIdx = e.key === 'ArrowRight'
          ? (currentIdx < allSegments.length - 1 ? currentIdx + 1 : 0)
          : (currentIdx > 0 ? currentIdx - 1 : allSegments.length - 1)
        const nextSeg = allSegments[nextIdx]
        setActiveSegmentRaw(nextSeg)
        setActiveRotation(nextSeg.allowedRotations[0])
        setSelectedPlacementId(null)
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPlacement) handleDeleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeSegment, selectedPlacement,
    handleUndo, handleRedo,
    handleRotateActive, handleRotateSelected, handleDeleteSelected,
  ])

  const displayedStrokeWidth = selectedPlacement?.strokeWidth ?? defaultStroke
  const canUndo = history.current.past.length > 0
  const canRedo = history.current.future.length > 0

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0f0f0f',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        overflow: 'hidden',
      }}>
        <Canvas
          placedSegments={placedSegments}
          activeSegment={activeSegment}
          activeRotation={activeRotation}
          selectedPlacementId={selectedPlacementId}
          showGrid={showGrid}
          stencilGap={stencilGap}
          defaultStrokeWidth={defaultStroke}
          snapToGrid={snapToGrid}
          onPlace={handlePlace}
          onSelect={handleSelect}
          onMove={handleMove}
        />
      </div>

      <ToolPanel
        activeSegment={activeSegment}
        activeRotation={activeRotation}
        selectedPlacement={selectedPlacement}
        showGrid={showGrid}
        stencilGap={stencilGap}
        strokeWidth={displayedStrokeWidth}
        snapToGrid={snapToGrid}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleSnap={() => setSnapToGrid(v => !v)}
        onSelectSegment={handleSelectSegment}
        onRotateActive={handleRotateActive}
        onToggleGrid={() => setShowGrid(v => !v)}
        onStencilGapChange={setStencilGap}
        onStrokeWidthChange={handleStrokeWidthChange}
        onRotateSelected={handleRotateSelected}
        onDeleteSelected={handleDeleteSelected}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearCanvas={handleClearCanvas}
      />
    </div>
  )
}