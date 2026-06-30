// @atom63/resume — public API.
//
// Two layers ship from this entry:
//   • the document engine — `PaginatedResume`, the MDX primitives, and the pure
//     `packIntoPages` packer — for composing your own chrome, and
//   • `ResumeViewer` — a ready-to-use zoom/pan/print viewer.
// The live MDX editor is the optional `@atom63/resume/editor` subexport; Vite
// plumbing is `@atom63/resume/vite`; styles are `@atom63/resume/styles`.

export {
  Columns,
  Entry,
  Footer,
  Group,
  Header,
  Main,
  Rule,
  resumeMdxComponents,
  Section,
  Sidebar,
} from './document/components'
// Document engine
export { PaginatedResume } from './document/paginated-resume'
export {
  PaginationReportContext,
  ResumeFontFamilyContext,
  usePaginationReport,
  useResumeFontFamily,
} from './document/pagination-context'
// Page geometry (for consumers wiring their own layout)
export { BLOCK_GAP_PX, PAGE } from './geometry'
export type { Block, ColumnKey, PackInput, PackResult } from './pagination/pagination'
// Pure pagination packer
export { packIntoPages } from './pagination/pagination'
// Standalone viewer
export { ResumeViewer } from './viewer/resume-viewer'
export type { ResumeViewerProps } from './viewer/resume-viewer.types'
export { useIsMobile as useResumeIsMobile } from './viewer/use-is-mobile'
// Headless viewport engine — for hosts that supply their own toolbar/chrome but
// must reuse the zoom/pan/pinch/print logic (single source of truth).
export {
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
  type UseResumeViewport,
  type UseResumeViewportOptions,
  useResumeViewport,
} from './viewer/use-resume-viewport'
