import { MDXProvider } from '@mdx-js/react'
import clsx from 'clsx'
import { ClipboardCopy, Maximize2, Minus, Plus } from 'lucide-react'
import { useRef } from 'react'
import { resumeMdxComponents } from '../document/components'
import { PaginationReportContext, ResumeFontFamilyContext } from '../document/pagination-context'
import { PAGE } from '../geometry'
import '../styles/tokens.css'
import '../styles/document.css'
import '../styles/viewer.css'
import type { ResumeViewerProps } from './resume-viewer.types'
import { useIsMobile } from './use-is-mobile'
import { useResumeViewport } from './use-resume-viewport'

export function ResumeViewer({
  Content,
  components,
  fontFamily,
  isActive = true,
  pdfFilename,
  onCopy,
  onError,
  className,
  toolbarStart,
  toolbarEnd,
}: ResumeViewerProps) {
  const isMobile = useIsMobile()
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const {
    pageCount,
    setPageCount,
    effectiveScale,
    isFitToWidth,
    totalHeight,
    handleZoomIn,
    handleZoomOut,
    handleActualSize,
    handleFitToWidth,
    requestPrint,
    handleCopyText,
    minScale,
    maxScale,
  } = useResumeViewport({
    scrollRef,
    contentRef,
    isMobile,
    isActive,
    pdfFilename,
    onCopy,
    onError,
  })

  return (
    <div className="resume-viewer">
      <div className="resume-viewer-toolbar">
        {toolbarStart}
        <span className="resume-viewer-pagecount">
          {pageCount} page{pageCount > 1 ? 's' : ''}
        </span>
        <div className="resume-viewer-controls">
          <button
            aria-label="Fit resume to width"
            aria-pressed={isFitToWidth}
            className={clsx('resume-viewer-btn', isFitToWidth && 'resume-viewer-btn-active')}
            onClick={handleFitToWidth}
            title="Fit to width"
            type="button"
          >
            <Maximize2 className="resume-viewer-icon" />
          </button>
          <div className="resume-viewer-btn-group">
            <button
              aria-label="Zoom out"
              className="resume-viewer-btn"
              disabled={!isFitToWidth && effectiveScale <= minScale}
              onClick={handleZoomOut}
              title="Zoom out"
              type="button"
            >
              <Minus className="resume-viewer-icon" />
            </button>
            <button
              className="resume-viewer-zoom-label"
              onClick={handleActualSize}
              title="Actual size (100%)"
              type="button"
            >
              {Math.round(effectiveScale * 100)}%
            </button>
            <button
              aria-label="Zoom in"
              className="resume-viewer-btn"
              disabled={effectiveScale >= maxScale}
              onClick={handleZoomIn}
              title="Zoom in"
              type="button"
            >
              <Plus className="resume-viewer-icon" />
            </button>
          </div>
          <button
            aria-label="Copy resume text"
            className="resume-viewer-btn"
            onClick={handleCopyText}
            title="Copy resume text"
            type="button"
          >
            <ClipboardCopy className="resume-viewer-icon" />
          </button>
          <button
            className="resume-viewer-btn resume-viewer-btn-text"
            onClick={requestPrint}
            type="button"
          >
            Save to PDF
          </button>
          {toolbarEnd}
        </div>
      </div>

      <div
        className={clsx(
          'resume-viewer-scroll',
          isMobile ? 'resume-viewer-scroll-mobile' : 'resume-viewer-scroll-grab',
          className
        )}
        ref={scrollRef}
      >
        <section
          aria-label={
            isMobile
              ? 'Resume preview. Drag with one finger to pan, pinch to zoom.'
              : 'Resume preview. Drag to pan, Ctrl+scroll to zoom.'
          }
          className="resume-viewer-stage"
        >
          <div
            className="resume-viewer-page-box"
            style={{
              width: PAGE.widthPx * effectiveScale,
              height: totalHeight * effectiveScale,
            }}
          >
            <div
              className="resume-viewer-scale-root"
              data-resume-scale-root=""
              style={{
                width: PAGE.widthPx,
                height: totalHeight,
                transform: effectiveScale === 1 ? undefined : `scale(${effectiveScale})`,
              }}
            >
              <ResumeFontFamilyContext.Provider value={fontFamily}>
                <PaginationReportContext.Provider value={setPageCount}>
                  <MDXProvider components={components ?? resumeMdxComponents}>
                    <div
                      className="resume-viewer-content"
                      id="resume-print-target"
                      ref={contentRef}
                      style={{ zIndex: 1 }}
                    >
                      <Content />
                    </div>
                  </MDXProvider>
                </PaginationReportContext.Provider>
              </ResumeFontFamilyContext.Provider>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
