'use client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Canvas from '@/components/builder/Canvas'
import ToolPanel from '@/components/builder/ToolPanel'
import SubmitModal from '@/components/builder/SubmitModal'
import { segments as allSegments, getSegmentById, nextRotation, DEFAULT_STROKE } from '@/lib/segments'

function BuilderPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const letter       = searchParams.get('letter') || 'A'

  // ── History ───────────────────────────────────────────────────────────────
  // present = { segments: [...], strokes: [...] }
  const history = useRef({ past: [], present: { segments: [], strokes: [] }, future: [] })
  const [segments,      setSegmentsState]  = useState([])
  const [strokes,       setStrokesState]   = useState([])

  const commit = useCallback((nextSegments, nextStrokes) => {
    history.current = {
      past:    [...history.current.past, history.current.present],
      present: { segments: nextSegments, strokes: nextStrokes },
      future:  [],
    }
    setSegmentsState(nextSegments)
    setStrokesState(nextStrokes)
  }, [])

  const handleUndo = useCallback(() => {
    const { past, present, future } = history.current
    if (past.length === 0) return
    const previous = past[past.length - 1]
    history.current = { past: past.slice(0, -1), present: previous, future: [present, ...future] }
    setSegmentsState(previous.segments)
    setStrokesState(previous.strokes)
  }, [])

  const handleRedo = useCallback(() => {
    const { past, present, future } = history.current
    if (future.length === 0) return
    const next = future[0]
    history.current = { past: [...past, present], present: next, future: future.slice(1) }
    setSegmentsState(next.segments)
    setStrokesState(next.strokes)
  }, [])

  // ── Selection + tool state ─────────────────────────────────────────────────
  const [selectedPlacementId, setSelectedPlacementId] = useState(null)
  const [selectedStrokeId,    setSelectedStrokeId]    = useState(null)
  const [showSubmitModal,     setShowSubmitModal]      = useState(false)
  const [activeSegment,       setActiveSegmentRaw]     = useState(null)
  const [activeRotation,      setActiveRotation]       = useState(0)
  const [brushMode,           setBrushMode]            = useState(false)
  const [showGrid,            setShowGrid]             = useState(true)
  const [stencilGap,          setStencilGap]           = useState(0)
  const [defaultStroke,       setDefaultStroke]        = useState(DEFAULT_STROKE)
  const [snapToGrid,          setSnapToGrid]           = useState(true)

  const presentSegments = history.current.present.segments
  const presentStrokes  = history.current.present.strokes

  const selectedPlacement = segments.find(ps => ps.placementId === selectedPlacementId) ?? null
  const selectedStroke    = strokes.find(s => s.strokeId === selectedStrokeId) ?? null

  // Activating brush mode deactivates segment tool and vice versa
  const handleSelectSegment = useCallback((seg) => {
    setActiveSegmentRaw(seg)
    setActiveRotation(seg ? seg.allowedRotations[0] : 0)
    setSelectedPlacementId(null)
    setSelectedStrokeId(null)
    if (seg) setBrushMode(false)
  }, [])

  const handleToggleBrush = useCallback(() => {
    setBrushMode(prev => {
      if (!prev) {
        // Entering brush mode — deactivate segment tool
        setActiveSegmentRaw(null)
        setSelectedPlacementId(null)
        setSelectedStrokeId(null)
      }
      return !prev
    })
  }, [])

  // ── Rotate active ─────────────────────────────────────────────────────────
  const handleRotateActive = useCallback(() => {
    if (!activeSegment) return
    setActiveRotation(prev => {
      const rotations = activeSegment.allowedRotations
      return rotations[(rotations.indexOf(prev) + 1) % rotations.length]
    })
  }, [activeSegment])

  // ── Place segment ─────────────────────────────────────────────────────────
  const handlePlace = useCallback((pos) => {
    if (!activeSegment) return
    const newPlacement = {
      placementId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      cellCol: pos.cellCol, cellRow: pos.cellRow, x: pos.x, y: pos.y,
      segmentId: activeSegment.id, rotation: activeRotation, strokeWidth: defaultStroke,
    }
    commit([...presentSegments, newPlacement], presentStrokes)
  }, [activeSegment, activeRotation, defaultStroke, commit, presentSegments, presentStrokes])

  // ── Add freehand stroke ───────────────────────────────────────────────────
  const handleAddStroke = useCallback((stroke) => {
    commit(presentSegments, [...presentStrokes, stroke])
  }, [commit, presentSegments, presentStrokes])

  // ── Select ────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((placementId) => {
    setSelectedPlacementId(prev => prev === placementId ? null : placementId)
    setSelectedStrokeId(null)
    if (placementId !== null) setActiveSegmentRaw(null)
  }, [])

  const handleSelectStroke = useCallback((strokeId) => {
    setSelectedStrokeId(prev => prev === strokeId ? null : strokeId)
    setSelectedPlacementId(null)
    if (strokeId !== null) setActiveSegmentRaw(null)
  }, [])

  // ── Rotate selected segment ───────────────────────────────────────────────
  const handleRotateSelected = useCallback(() => {
    if (!selectedPlacement) return
    const seg = getSegmentById(selectedPlacement.segmentId)
    if (!seg) return
    const next = nextRotation(seg, selectedPlacement.rotation)
    commit(
      presentSegments.map(ps => ps.placementId === selectedPlacementId ? { ...ps, rotation: next } : ps),
      presentStrokes
    )
  }, [selectedPlacement, selectedPlacementId, commit, presentSegments, presentStrokes])

  // ── Delete selected ───────────────────────────────────────────────────────
  const handleDeleteSelected = useCallback(() => {
    if (selectedPlacementId) {
      commit(presentSegments.filter(ps => ps.placementId !== selectedPlacementId), presentStrokes)
      setSelectedPlacementId(null)
    } else if (selectedStrokeId) {
      commit(presentSegments, presentStrokes.filter(s => s.strokeId !== selectedStrokeId))
      setSelectedStrokeId(null)
    }
  }, [selectedPlacementId, selectedStrokeId, commit, presentSegments, presentStrokes])

  // ── Stroke width ──────────────────────────────────────────────────────────
  const handleStrokeWidthChange = useCallback((value) => {
    if (selectedPlacementId) {
      commit(presentSegments.map(ps => ps.placementId === selectedPlacementId ? { ...ps, strokeWidth: value } : ps), presentStrokes)
    } else {
      setDefaultStroke(value)
    }
  }, [selectedPlacementId, commit, presentSegments, presentStrokes])

  // ── Move ──────────────────────────────────────────────────────────────────
  const handleMove = useCallback((placementId, pos) => {
    commit(
      presentSegments.map(ps => ps.placementId === placementId ? { ...ps, cellCol: pos.cellCol, cellRow: pos.cellRow, x: pos.x, y: pos.y } : ps),
      presentStrokes
    )
  }, [commit, presentSegments, presentStrokes])

  // ── Clear ─────────────────────────────────────────────────────────────────
  const handleClearCanvas = useCallback(() => {
    commit([], [])
    setSelectedPlacementId(null)
    setSelectedStrokeId(null)
    setActiveSegmentRaw(null)
    setActiveRotation(0)
    setBrushMode(false)
  }, [commit])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmitSuccess = useCallback((newId) => {
    setShowSubmitModal(false)
    router.push(`/archive?highlight=${newId}`)
  }, [router])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return }
      if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); return }

      if (e.key === 'b' || e.key === 'B') { handleToggleBrush(); return }

      if (e.key === 'r' || e.key === 'R') {
        if (activeSegment) handleRotateActive()
        else if (selectedPlacement) handleRotateSelected()
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const currentIdx = activeSegment ? allSegments.findIndex(s => s.id === activeSegment.id) : -1
        const nextIdx = e.key === 'ArrowRight'
          ? (currentIdx < allSegments.length - 1 ? currentIdx + 1 : 0)
          : (currentIdx > 0 ? currentIdx - 1 : allSegments.length - 1)
        const nextSeg = allSegments[nextIdx]
        setActiveSegmentRaw(nextSeg)
        setActiveRotation(nextSeg.allowedRotations[0])
        setSelectedPlacementId(null)
        setBrushMode(false)
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPlacement || selectedStroke) handleDeleteSelected()
      }

      if (e.key === 'Escape') {
        setActiveSegmentRaw(null)
        setBrushMode(false)
        setSelectedPlacementId(null)
        setSelectedStrokeId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeSegment, selectedPlacement, selectedStroke, handleUndo, handleRedo, handleToggleBrush, handleRotateActive, handleRotateSelected, handleDeleteSelected])

  const displayedStrokeWidth = selectedPlacement?.strokeWidth ?? defaultStroke
  const canUndo = history.current.past.length > 0
  const canRedo = history.current.future.length > 0

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0f0f0f' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, overflow: 'hidden', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, alignSelf: 'stretch', justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 9, letterSpacing: '0.2em', fontFamily: 'monospace', cursor: 'pointer', padding: 0 }}>
            ← BACK
          </button>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.25em', fontFamily: 'monospace' }}>BUILDING</span>
            <span style={{ fontSize: 32, fontWeight: 700, color: 'white', fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', lineHeight: 1 }}>{letter}</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
        <Canvas
          placedSegments={segments}
          freehandStrokes={strokes}
          activeSegment={activeSegment}
          activeRotation={activeRotation}
          selectedPlacementId={selectedPlacementId}
          selectedStrokeId={selectedStrokeId}
          brushMode={brushMode}
          showGrid={showGrid}
          stencilGap={stencilGap}
          defaultStrokeWidth={defaultStroke}
          snapToGrid={snapToGrid}
          onPlace={handlePlace}
          onSelect={handleSelect}
          onSelectStroke={handleSelectStroke}
          onMove={handleMove}
          onAddStroke={handleAddStroke}
        />
      </div>

      <ToolPanel
        activeSegment={activeSegment}
        activeRotation={activeRotation}
        selectedPlacement={selectedPlacement}
        selectedStroke={selectedStroke}
        brushMode={brushMode}
        showGrid={showGrid}
        stencilGap={stencilGap}
        strokeWidth={displayedStrokeWidth}
        snapToGrid={snapToGrid}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleBrush={handleToggleBrush}
        onToggleSnap={() => setSnapToGrid(v => !v)}
        onSelectSegment={handleSelectSegment}
        onRotateActive={handleRotateActive}
        onToggleGrid={() => setShowGrid(v => !v)}
        onStencilGapChange={setStencilGap}
        onStrokeWidthChange={handleStrokeWidthChange}
        onRotateSelected={handleRotateSelected}
        onDeleteSelected={handleDeleteSelected}
        onSubmit={() => setShowSubmitModal(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearCanvas={handleClearCanvas}
      />

      {showSubmitModal && (
        <SubmitModal
          letter={letter}
          placedSegments={segments}
          freehandStrokes={strokes}
          stencilGap={stencilGap}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  )
}

export default function BuildPageWrapper() {
  return <Suspense><BuilderPage /></Suspense>
}