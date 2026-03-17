// exportSvg.js
// Exports only the placed segment geometry — no canvas background, no fixed
// canvas size. The viewBox is computed as the tight bounding box around the
// actual segments, so the SVG centers correctly in any display container.

import { CELL_SIZE } from '@/components/builder/Canvas'
import { getSegmentById } from '@/lib/segments'

function computeTransform(vbStr, dx, dy, dw, dh) {
    const [vbX, vbY, vbW, vbH] = vbStr.split(' ').map(Number)
    const sx = dw / vbW
    const sy = dh / vbH
    const tx = dx - vbX * sx
    const ty = dy - vbY * sy
    return { sx, sy, tx, ty }
}

function attrsToString(attrs) {
    return Object.entries(attrs)
        .map(([k, v]) => {
            const key = k
                .replace('strokeWidth', 'stroke-width')
                .replace('strokeMiterlimit', 'stroke-miterlimit')
                .replace('strokeLinecap', 'stroke-linecap')
                .replace('strokeLinejoin', 'stroke-linejoin')
                .replace('vectorEffect', 'vector-effect')
                .replace('fillOpacity', 'fill-opacity')
            return `${key}="${v}"`
        })
        .join(' ')
}

function renderSegmentToSVG({ segment, pixelX, pixelY, rotation, strokeWidth, stencilGap }) {
    const { element, attrs, viewBox: vbStr, footprint, filled } = segment
    const [fpCols, fpRows] = footprint
    const gap = stencilGap

    const clipW = fpCols * CELL_SIZE
    const clipH = fpRows * CELL_SIZE

    const strokePad = filled ? 0 : strokeWidth / 2
    const dx = pixelX + gap + strokePad
    const dy = pixelY + gap + strokePad
    const dw = clipW - 2 * (gap + strokePad)
    const dh = clipH - 2 * (gap + strokePad)

    const { sx, sy, tx, ty } = computeTransform(vbStr, dx, dy, dw, dh)

    const cx = pixelX + clipW / 2
    const cy = pixelY + clipH / 2

    const attrStr = attrsToString(
        filled
            ? { ...attrs, fill: '#000000' }
            : {
                ...attrs,
                fill: 'none',
                stroke: '#000000',
                'stroke-width': String(strokeWidth),
                'stroke-miterlimit': '10',
                'stroke-linecap': 'butt',
                'stroke-linejoin': 'miter',
            }
    )

    return `  <g transform="rotate(${rotation}, ${cx.toFixed(3)}, ${cy.toFixed(3)})">
    <g transform="translate(${tx.toFixed(3)}, ${ty.toFixed(3)}) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})">
      <${element} ${attrStr}/>
    </g>
  </g>`
}

export function exportToSVG(placedSegments, freehandStrokes = [], stencilGap = 0, letter = '') {
    if (placedSegments.length === 0 && freehandStrokes.length === 0) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>`
    }

    // ── Compute tight bounding box around all placed segments ──────────────────
    // Segments can be rotated, so we can't just use footprint rectangles — a
    // rotated segment's visual bounds extend beyond its declared footprint.
    //
    // For each placement we compute the axis-aligned bounding box of the
    // rotated footprint rectangle, then union all of them together.
    //
    // rotatedAABB: given a rect (x, y, w, h) rotated `deg` around its center,
    // returns the axis-aligned bounding box of all four rotated corners.
    function rotatedAABB(x, y, w, h, deg) {
        const cx = x + w / 2
        const cy = y + h / 2
        const rad = deg * Math.PI / 180
        const cos = Math.abs(Math.cos(rad))
        const sin = Math.abs(Math.sin(rad))
        // Width and height of the axis-aligned box that contains the rotated rect
        const rw = w * cos + h * sin
        const rh = w * sin + h * cos
        return { x: cx - rw / 2, y: cy - rh / 2, w: rw, h: rh }
    }

    // Stroke padding so the outer edge of the stroke isn't clipped
    const MAX_STROKE = Math.max(...placedSegments.map(ps => ps.strokeWidth || 17))
    const PAD = MAX_STROKE / 2 + 4

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    placedSegments.forEach(ps => {
        const seg = getSegmentById(ps.segmentId)
        if (!seg) return
        const [fpCols, fpRows] = seg.footprint
        const bbox = rotatedAABB(ps.x, ps.y, fpCols * CELL_SIZE, fpRows * CELL_SIZE, ps.rotation)
        if (bbox.x - PAD < minX) minX = bbox.x - PAD
        if (bbox.y - PAD < minY) minY = bbox.y - PAD
        if (bbox.x + bbox.w + PAD > maxX) maxX = bbox.x + bbox.w + PAD
        if (bbox.y + bbox.h + PAD > maxY) maxY = bbox.y + bbox.h + PAD
    })

    // Include freehand stroke bboxes — stored at draw time so no parsing needed
    freehandStrokes.forEach(stroke => {
        const sw = (stroke.strokeWidth || 17) / 2
        if (stroke.minX - sw - PAD < minX) minX = stroke.minX - sw - PAD
        if (stroke.minY - sw - PAD < minY) minY = stroke.minY - sw - PAD
        if (stroke.maxX + sw + PAD > maxX) maxX = stroke.maxX + sw + PAD
        if (stroke.maxY + sw + PAD > maxY) maxY = stroke.maxY + sw + PAD
    })

    const vbW = maxX - minX
    const vbH = maxY - minY

    // ── Render segments ────────────────────────────────────────────────────────
    const segmentSVGs = placedSegments.map(ps => {
        const seg = getSegmentById(ps.segmentId)
        if (!seg) return ''
        return renderSegmentToSVG({
            segment: seg,
            pixelX: ps.x,
            pixelY: ps.y,
            rotation: ps.rotation,
            strokeWidth: ps.strokeWidth,
            stencilGap,
        })
    }).join('\n')

    // Render freehand strokes
    const strokeSVGs = freehandStrokes.map(stroke =>
        `  <path d="${stroke.d}" fill="none" stroke="#000000" stroke-width="${stroke.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('\n')

    // viewBox is the tight bounding box — no fixed width/height on the root element.
    // This lets the SVG scale to any container and centers via preserveAspectRatio.
    return `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${minX.toFixed(3)} ${minY.toFixed(3)} ${vbW.toFixed(3)} ${vbH.toFixed(3)}"
>
  <!-- Letterform Builder — ${letter} -->
${segmentSVGs}
${strokeSVGs}
</svg>`
}