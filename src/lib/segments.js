// segments.js
// ─────────────────────────────────────────────────────────────────
// All segment definitions derived from the Illustrator SVG export.
//
// Coordinate system:  1 grid unit = 90px in the original SVG space.
// Stroke width:       17px in the Illustrator file.
//
// IMPORTANT — viewBox values:
//   Every stroked segment's viewBox uses PURE GEOMETRY BOUNDS with no
//   stroke padding. In the Illustrator export each viewBox was padded by
//   half the stroke width (8.5px) on each side so the stroke wouldn't clip
//   inside the file. In the tool we use vectorEffect="non-scaling-stroke"
//   so the stroke renders in screen-pixel space independently of the
//   transform. Including padding in the viewBox would shrink the geometry
//   before mapping it to the cell, causing visible gaps at cell edges even
//   when stencilGap = 0.
//
//   Formula applied:  pure viewBox = geometry bounding box only.
//   For zero-width geometry (vertical/horizontal lines) the cross-axis
//   dimension is kept at 17 (the stroke width) to preserve centering.
//
// ─────────────────────────────────────────────────────────────────

export const GRID_UNIT = 90
export const DEFAULT_STROKE = 17

export const CATEGORIES = {
    circles: 'Circles',
    squares: 'Squares',
    arcs: 'Arcs',
    corners: 'Corners',
    diagonals: 'Diagonals',
    straights: 'Straights',
}

export const segments = [

    // ── CIRCLES ────────────────────────────────────────────────────

    // {
    //     id: 'circle-2u',
    //     label: 'Circle (2u)',
    //     category: 'circles',
    //     footprint: [2, 2],
    //     allowedRotations: [0],
    //     element: 'path',
    //     filled: false,
    //     viewBox: '205.09 691.23 179.88 179.88',
    //     attrs: {
    //         d: 'M295.03,708.23c40.22,0,72.94,32.72,72.94,72.94s-32.72,72.94-72.94,72.94-72.94-32.72-72.94-72.94,32.72-72.94,72.94-72.94M295.03,691.23c-49.67,0-89.94,40.27-89.94,89.94s40.27,89.94,89.94,89.94,89.94-40.27,89.94-89.94-40.27-89.94-89.94-89.94h0Z',
    //         fill: 'currentColor',
    //     },
    // },

    {
        id: 'circle-1u',
        label: 'Circle (1u)',
        category: 'circles',
        footprint: [1, 1],
        allowedRotations: [0],
        element: 'path',
        filled: true,
        viewBox: '600.23 777.91 89.94 89.94',
        attrs: {
            d: 'M645.2,794.91c15.42,0,27.97,12.55,27.97,27.97s-12.55,27.97-27.97,27.97-27.97-12.55-27.97-27.97,12.55-27.97,27.97-27.97M645.2,777.91c-24.84,0-44.97,20.13-44.97,44.97s20.13,44.97,44.97,44.97,44.97-20.13,44.97-44.97-20.13-44.97-44.97-44.97h0Z',
            fill: 'currentColor',
        },
    },

    // // ── SQUARES ────────────────────────────────────────────────────

    // {
    //     id: 'square-1u',
    //     label: 'Square (1u)',
    //     category: 'squares',
    //     footprint: [1, 1],
    //     allowedRotations: [0],
    //     element: 'path',
    //     filled: true,
    //     viewBox: '227.02 565.64 90.45 90.45',
    //     attrs: {
    //         d: 'M300.47,582.64v56.45h-56.45v-56.45h56.45M317.47,565.64h-90.45v90.45h90.45v-90.45h0Z',
    //         fill: 'currentColor',
    //     },
    // },

    // ── ARCS ───────────────────────────────────────────────────────
    // viewBox = pure geometry bounds (no stroke padding).
    // Geometry endpoints map exactly to cell edges.

    {
        id: 'half-arc-1u',
        label: 'Half Arc (1u)',
        category: 'arcs',
        footprint: [1, 1],
        allowedRotations: [0, 90, 180, 270],
        element: 'path',
        filled: false,
        // Endpoints at (596.26,1023.51) and (668.66,1023.51), arc bottom at 1059.71.
        // Geometry: 72.4 wide × 36.2 tall. Non-uniform scale stretches to fill 1×1 cell.
        viewBox: '596.26 1023.51 72.4 36.2',
        attrs: {
            d: 'M668.66,1023.51c0,19.99-16.21,36.2-36.2,36.2s-36.2-16.21-36.2-36.2',
        },
    },

    {
        id: 'half-arc-2u',
        label: 'Half Arc (2u)',
        category: 'arcs',
        footprint: [2, 1],
        allowedRotations: [0, 90, 180, 270],
        element: 'path',
        filled: false,
        // Endpoints at (403.09,862.44) and (565.65,862.44), arc top at 781.16.
        // Geometry: 162.56 wide × 81.28 tall → 2:1 ratio matches 2×1 footprint.
        viewBox: '403.09 781.16 162.56 81.28',
        attrs: {
            d: 'M403.09,862.44c0-44.89,36.39-81.28,81.28-81.28s81.28,36.39,81.28,81.28',
        },
    },

    {
        id: 'quarter-arc-a',
        label: 'Quarter Arc A',
        category: 'arcs',
        footprint: [1, 1],
        allowedRotations: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360],
        element: 'path',
        filled: false,
        // Endpoint (538.98,994.13) → (620.26,912.85). Square geometry, fills 1×1 cell.
        viewBox: '538.98 912.85 81.28 81.28',
        attrs: {
            d: 'M538.98,994.13c0-44.89,36.39-81.28,81.28-81.28',
        },
    },

    {
        id: 'quarter-arc-b',
        label: 'Quarter Arc B',
        category: 'arcs',
        footprint: [1, 1],
        allowedRotations: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360],
        element: 'path',
        filled: false,
        // Endpoint (642.88,912.86) → (724.16,994.14). Square geometry, fills 1×1 cell.
        viewBox: '642.88 912.86 81.28 81.28',
        attrs: {
            d: 'M642.88,912.86c44.89,0,81.28,36.39,81.28,81.28',
        },
    },

    // {
    //     id: 'arch-2u',
    //     label: 'Arch (2u)',
    //     category: 'arcs',
    //     footprint: [2, 2],
    //     allowedRotations: [0, 90, 180, 270],
    //     element: 'path',
    //     filled: false,
    //     // Endpoints at (321.42,1077.39) and (484.74,1077.39), arch top at 906.24.
    //     viewBox: '321.42 906.24 163.32 171.15',
    //     attrs: {
    //         d: 'M321.42,1077.39c0-94.52,36.56-171.15,81.66-171.15s81.66,76.63,81.66,171.15',
    //     },
    // },

    // {
    //     id: 'arch-1u',
    //     label: 'Arch (1u)',
    //     category: 'arcs',
    //     footprint: [1, 1],
    //     allowedRotations: [0, 90, 180, 270],
    //     element: 'path',
    //     filled: false,
    //     // Endpoints at (221.28,1008.51) and (295.22,1008.51), arch top at 927.47.
    //     viewBox: '221.28 927.47 73.94 81.04',
    //     attrs: {
    //         d: 'M221.28,1008.51c0-44.76,16.55-81.04,36.97-81.04s36.97,36.28,36.97,81.04',
    //     },
    // },

    // ── CORNERS / POLYLINES ────────────────────────────────────────
    // viewBox = exact geometry bounds. All four polyline endpoints map
    // to cell edges — geometry fills the full footprint.

    {
        id: 'corner-1u',
        label: 'Corner (1u)',
        category: 'corners',
        footprint: [1, 1],
        allowedRotations: [0, 90, 180, 270],
        element: 'polyline',
        filled: false,
        // Points: (439.61,538.87)→(439.61,620.1)→(520.73,620.1)
        // Maps to: (0,0)→(0,80)→(80,80) in cell space.
        viewBox: '439.61 538.87 81.12 81.23',
        attrs: {
            points: '439.61,538.87 439.61,620.1 520.73,620.1',
        },
    },

    {
        id: 'u-bracket-1u',
        label: 'U Bracket (1u)',
        category: 'corners',
        footprint: [1, 1],
        allowedRotations: [0, 90, 180, 270],
        element: 'polyline',
        filled: false,
        // Points: (439.61,408)→(439.61,489.98)→(512.08,489.98)→(512.08,408)
        // Maps to: (0,0)→(0,80)→(80,80)→(80,0) — open at top.
        viewBox: '439.61 408 72.47 81.98',
        attrs: {
            points: '439.61,408 439.61,489.98 512.08,489.98 512.08,408',
        },
    },

    {
        id: 'l-shape-2u',
        label: 'L-shape (2u)',
        category: 'corners',
        footprint: [2, 2],
        allowedRotations: [0, 90, 180, 270],
        element: 'polyline',
        filled: false,
        // Points: (546.85,538.98)→(546.85,710.21)→(718.08,710.21)
        // Maps to: (0,0)→(0,160)→(160,160) in 2×2 cell space.
        viewBox: '546.85 538.98 171.23 171.23',
        attrs: {
            points: '546.85,538.98 546.85,710.21 718.08,710.21',
        },
    },

    {
        id: 'c-bracket-2u',
        label: 'C Bracket (2u)',
        category: 'corners',
        footprint: [2, 2],
        allowedRotations: [0, 90, 180, 270],
        element: 'polyline',
        filled: false,
        // Points: (403.09,530.5)→(231.85,530.5)→(231.85,367.47)→(403.09,367.47)
        // Maps to: (160,160)→(0,160)→(0,0)→(160,0) — open on right.
        viewBox: '231.85 367.47 171.24 163.03',
        attrs: {
            points: '403.09,530.5 231.85,530.5 231.85,367.47 403.09,367.47',
        },
    },

    // ── DIAGONALS ──────────────────────────────────────────────────
    // viewBox = exact geometry bounds (no padding).
    // rotation 0 = "\", rotation 90 = "/"

    {
        id: 'diagonal-025u',
        label: 'Diagonal (¼u)',
        category: 'diagonals',
        footprint: [1, 1],
        allowedRotations: [0, 90],
        element: 'line',
        filled: false,
        // viewBox 90×90 (normalized) — geometry spans 24.68 of 90 ≈ ¼ of the cell
        viewBox: '612.61 71.46 90 90',
        attrs: {
            x1: '637.29', y1: '96.14',
            x2: '612.61', y2: '71.46',
        },
    },

    {
        id: 'diagonal-05u',
        label: 'Diagonal (½u)',
        category: 'diagonals',
        footprint: [1, 1],
        allowedRotations: [0, 90],
        element: 'line',
        filled: false,
        // viewBox 90×90 (normalized) — geometry spans 46.55 of 90 ≈ ½ of the cell
        viewBox: '500.74 49.64 90 90',
        attrs: {
            x1: '547.29', y1: '96.19',
            x2: '500.74', y2: '49.64',
        },
    },

    {
        id: 'diagonal-1u',
        label: 'Diagonal (1u)',
        category: 'diagonals',
        footprint: [1, 1],
        allowedRotations: [0, 90],
        element: 'line',
        filled: false,
        viewBox: '367.29 6.01 90.18 90.18',
        attrs: {
            x1: '457.47', y1: '96.19',
            x2: '367.29', y2: '6.01',
        },
    },

    {
        id: 'diagonal-2u',
        label: 'Diagonal (2u)',
        category: 'diagonals',
        footprint: [2, 2],
        allowedRotations: [0, 90],
        element: 'line',
        filled: false,
        viewBox: '187.29 6.14 180 180',
        attrs: {
            x1: '367.29', y1: '186.14',
            x2: '187.29', y2: '6.14',
        },
    },

    {
        id: 'diagonal-3u',
        label: 'Diagonal (3u)',
        category: 'diagonals',
        footprint: [3, 3],
        allowedRotations: [0, 90],
        element: 'line',
        filled: false,
        viewBox: '6.01 6.14 271.71 271.71',
        attrs: {
            x1: '277.72', y1: '277.85',
            x2: '6.01', y2: '6.14',
        },
    },

    // ── STRAIGHTS ──────────────────────────────────────────────────
    //
    // Edge-snapping principle:
    //   At rotation 0° the line sits on the LEFT edge of its footprint.
    //   Rotating 90° CW around the footprint center moves it to each
    //   subsequent edge: left → top → right → bottom.
    //
    // viewBox x is set to the line's own x coordinate so the geometry
    // maps to x=0 in cell space (left edge). non-scaling-stroke means
    // the stroke width renders in screen pixels independently of scale.
    //
    // 1×1 segments have all four rotations.
    // Multi-unit segments are split into separate vertical [1,N] and
    // horizontal [N,1] entries — rotating a non-square footprint 90°
    // around its center does not produce clean edge alignment, so the
    // user picks the correct orientation from the panel directly.
    //   Vertical: line at left edge, allowedRotations [0, 180]
    //   Horizontal: line at top edge, allowedRotations [0, 180]

    // ¼u ── 1×1, all four edges
    {
        id: 'straight-025u',
        label: 'Straight (¼u)',
        category: 'straights',
        footprint: [1, 1],
        allowedRotations: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360],
        element: 'line',
        filled: false,
        // vbX = lineX → x=0 (left edge). vbH=90 (normalized) → line spans 22.53/90 ≈ ¼ of cell
        viewBox: '1200.35 1273.02 17 90',
        attrs: {
            x1: '1200.35', y1: '1295.55',
            x2: '1200.35', y2: '1273.02',
        },
    },

    // ½u ── 1×1, all four edges
    {
        id: 'straight-05u',
        label: 'Straight (½u)',
        category: 'straights',
        footprint: [1, 1],
        allowedRotations: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360],
        element: 'line',
        filled: false,
        // vbH=90 (normalized) → line spans 45.06/90 ≈ ½ of cell
        viewBox: '1110.35 1250.49 17 90',
        attrs: {
            x1: '1110.35', y1: '1295.55',
            x2: '1110.35', y2: '1250.49',
        },
    },

    // 1u ── 1×1, all four edges
    {
        id: 'straight-1u',
        label: 'Straight (1u)',
        category: 'straights',
        footprint: [1, 1],
        allowedRotations: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360],
        element: 'line',
        filled: false,
        viewBox: '1020.35 1205.55 17 90',
        attrs: {
            x1: '1020.35', y1: '1295.55',
            x2: '1020.35', y2: '1205.55',
        },
    },

    // 2u vertical ── [1,2], left or right edge
    {
        id: 'straight-2u-v',
        label: 'Straight V (2u)',
        category: 'straights',
        footprint: [1, 2],
        allowedRotations: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360],
        element: 'line',
        filled: false,
        // Line spans full 2u height (180px), sits at left edge of 1×2 footprint
        viewBox: '930.59 1115.55 17 180',
        attrs: {
            x1: '930.59', y1: '1295.55',
            x2: '930.59', y2: '1115.55',
        },
    },

    // 2u horizontal ── [2,1], top or bottom edge
    {
        id: 'straight-2u-h',
        label: 'Straight H (2u)',
        category: 'straights',
        footprint: [2, 1],
        allowedRotations: [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360],
        element: 'line',
        filled: false,
        // Normalized coords: horizontal line at y=0 (top edge) spanning 180px (2u)
        // vbH=17 keeps cross-axis scale consistent with vertical variants
        viewBox: '0 0 180 17',
        attrs: {
            x1: '0', y1: '0',
            x2: '180', y2: '0',
        },
    },

    // 4u vertical ── [1,4], left or right edge
    {
        id: 'straight-4u-v',
        label: 'Straight V (4u)',
        category: 'straights',
        footprint: [1, 4],
        allowedRotations: [0, 180],
        element: 'line',
        filled: false,
        viewBox: '839.96 935.55 17 360',
        attrs: {
            x1: '839.96', y1: '1295.55',
            x2: '839.96', y2: '935.55',
        },
    },

    // 4u horizontal ── [4,1], top or bottom edge
    {
        id: 'straight-4u-h',
        label: 'Straight H (4u)',
        category: 'straights',
        footprint: [4, 1],
        allowedRotations: [0, 180],
        element: 'line',
        filled: false,
        viewBox: '0 0 360 17',
        attrs: {
            x1: '0', y1: '0',
            x2: '360', y2: '0',
        },
    },
]

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

export function getByCategory(category) {
    return segments.filter(s => s.category === category)
}

export function getSegmentById(id) {
    return segments.find(s => s.id === id)
}

export function nextRotation(segment, currentRotation) {
    const rotations = segment.allowedRotations
    const idx = rotations.indexOf(currentRotation)
    return rotations[(idx + 1) % rotations.length]
}