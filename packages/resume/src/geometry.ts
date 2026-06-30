// packages/resume/src/geometry.ts
// Numeric page geometry — the single source of truth shared by the JS packer
// and the default --paper-*/--doc-* token values in styles/tokens.css.
// Print-fixed px at 96dpi for PDF fidelity. Keep tokens.css defaults in sync.

const DPI = 96

export const PAGE = {
  widthPx: 8.5 * DPI,
  heightPx: 11 * DPI,
  padXPx: 0.7 * DPI,
  padYPx: 0.6 * DPI,
  gapPx: 32, // screen-only gap between page frames
} as const

export const CONTENT_WIDTH_PX = PAGE.widthPx - 2 * PAGE.padXPx
export const USABLE_HEIGHT_PX = PAGE.heightPx - 2 * PAGE.padYPx

// Vertical gap between blocks within a column — must match --doc-block-gap
// (0.375rem = 6px) in styles/tokens.css and the column gap in document.css.
export const BLOCK_GAP_PX = 6

// Outer horizontal padding the viewer reserves around the page in its scroll area.
export const WRAPPER_PADDING_X = 32
