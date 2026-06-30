// packages/resume/src/geometry.ts
// Numeric page geometry — the single source of truth shared by the JS packer
// and the rendered page frames. Print-fixed px at 96dpi for PDF fidelity.

const DPI = 96
const MM = DPI / 25.4

export type PageSize = 'letter' | 'a4'

export interface PageGeometry {
  widthPx: number
  heightPx: number
  padXPx: number
  padYPx: number
  /** Screen-only gap between page frames. */
  gapPx: number
  contentWidthPx: number
  usableHeightPx: number
  /** Value for the CSS `@page { size: … }` print rule. */
  cssPageSize: 'letter' | 'A4'
}

// Both sizes keep the same physical 0.7in x 0.6in margins.
const PAD_X_PX = 0.7 * DPI
const PAD_Y_PX = 0.6 * DPI
const GAP_PX = 32

const DIMENSIONS: Record<
  PageSize,
  { widthPx: number; heightPx: number; cssPageSize: 'letter' | 'A4' }
> = {
  letter: { widthPx: 8.5 * DPI, heightPx: 11 * DPI, cssPageSize: 'letter' },
  a4: { widthPx: 210 * MM, heightPx: 297 * MM, cssPageSize: 'A4' },
}

/** Resolve the print-fixed geometry for a page size (defaults to US Letter). */
export function getPageGeometry(size: PageSize = 'letter'): PageGeometry {
  const d = DIMENSIONS[size]
  return {
    widthPx: d.widthPx,
    heightPx: d.heightPx,
    padXPx: PAD_X_PX,
    padYPx: PAD_Y_PX,
    gapPx: GAP_PX,
    contentWidthPx: d.widthPx - 2 * PAD_X_PX,
    usableHeightPx: d.heightPx - 2 * PAD_Y_PX,
    cssPageSize: d.cssPageSize,
  }
}

/** Back-compat default geometry (US Letter). */
export const PAGE = getPageGeometry('letter')

// Kept for back-compat; equal to the Letter geometry's derived values.
export const CONTENT_WIDTH_PX = PAGE.contentWidthPx
export const USABLE_HEIGHT_PX = PAGE.usableHeightPx

// Vertical gap between blocks within a column — must match --doc-block-gap
// (0.375rem = 6px) in styles/tokens.css and the column gap in document.css.
export const BLOCK_GAP_PX = 6

// Outer horizontal padding the viewer reserves around the page in its scroll area.
export const WRAPPER_PADDING_X = 32
