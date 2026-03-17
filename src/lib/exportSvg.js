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

export function exportToSVG(placedSegments, stencilGap = 0, letter = '') {
    if (placedSegments.length === 0) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>`
    }

    // ── Compute tight bounding box around all placed segments ──────────────────
    // Each segment occupies [fpCols * CELL_SIZE, fpRows * CELL_SIZE] starting at (x, y).
    // Add a small padding so strokes on the outer edge aren't clipped.
    const PAD = 4

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    placedSegments.forEach(ps => {
        const seg = getSegmentById(ps.segmentId)
        if (!seg) return
        const [fpCols, fpRows] = seg.footprint
        const x0 = ps.x - PAD
        const y0 = ps.y - PAD
        const x1 = ps.x + fpCols * CELL_SIZE + PAD
        const y1 = ps.y + fpRows * CELL_SIZE + PAD
        if (x0 < minX) minX = x0
        if (y0 < minY) minY = y0
        if (x1 > maxX) maxX = x1
        if (y1 > maxY) maxY = y1
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

    // viewBox is the tight bounding box — no fixed width/height on the root element.
    // This lets the SVG scale to any container and centers via preserveAspectRatio.
    return `<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${minX.toFixed(3)} ${minY.toFixed(3)} ${vbW.toFixed(3)} ${vbH.toFixed(3)}"
>
  <!-- Letterform Builder — ${letter} -->
${segmentSVGs}
</svg>`
}