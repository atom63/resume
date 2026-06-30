import type { ComponentType, ReactNode } from 'react'

export interface ResumeViewerProps {
  /** Compiled MDX component for the document (rendered as <Content />). */
  Content: ComponentType
  /** Override the MDX component map; defaults to resumeMdxComponents. */
  components?: Record<string, ComponentType<unknown>>
  /** Font-family hint; a change re-measures/re-paginates. */
  fontFamily?: string
  /** Whether this viewer owns global print + keyboard shortcuts. Default true. */
  isActive?: boolean
  /** Suggested PDF filename (becomes document.title during print). */
  pdfFilename?: string
  /** Called after a successful copy-to-clipboard (host shows its own toast). */
  onCopy?: () => void
  /** Called when copy-to-clipboard fails. */
  onError?: (error: unknown) => void
  /** Extra className on the root element. */
  className?: string
  /**
   * Host content injected at the START of the toolbar, before the page count.
   * Use this to add e.g. a document-variant toggle without re-implementing the
   * viewport. Optional and backward-compatible.
   */
  toolbarStart?: ReactNode
  /**
   * Host content injected at the END of the toolbar, after the built-in
   * controls. Use this to add e.g. a "view source" button. Optional and
   * backward-compatible.
   */
  toolbarEnd?: ReactNode
}
