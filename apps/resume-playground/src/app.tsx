import {
  PaginationReportContext,
  resumeMdxComponents,
  ResumeFontFamilyContext,
  ResumePageSizeContext,
  useResumeViewport,
} from '@atom63/resume'
import { MdxLivePreview } from '@atom63/resume/editor'
import CvSource from './cv.mdx?raw'
import ResumeSource from './resume.mdx?raw'
import { ClipboardCheck, ClipboardCopy, Maximize2, Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ensureResumeDocument, readDraft, writeDraft } from './live-resume'

const DOCS = {
  resume: {
    label: 'Resume',
    file: 'resume.mdx',
    source: ResumeSource,
    storageKey: 'atom63:resume-live:resume',
    pdfFilename: 'Resume',
  },
  cv: {
    label: 'CV',
    file: 'cv.mdx',
    source: CvSource,
    storageKey: 'atom63:resume-live:cv',
    pdfFilename: 'CV',
  },
} as const

type DocKey = keyof typeof DOCS
type Paper = 'letter' | 'a4'

function getLocalStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    // Touch behavior (one-finger pan, pinch-zoom) is a pointer concern, not a
    // width one — key it off a coarse primary pointer (phones/tablets), with a
    // narrow-width fallback for phones that report otherwise.
    const query = window.matchMedia('(pointer: coarse), (max-width: 640px)')
    const update = () => setIsNarrow(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isNarrow
}

export function App() {
  const [docKey, setDocKey] = useState<DocKey>('resume')
  const [paper, setPaper] = useState<Paper>('letter')
  const doc = DOCS[docKey]
  const [source, setSource] = useState(() =>
    readDraft(getLocalStorage(), DOCS.resume.storageKey, DOCS.resume.source)
  )
  const [compileError, setCompileError] = useState<Error | null>(null)
  const [copyStatus, setCopyStatus] = useState('Copy template')
  const [copyTextStatus, setCopyTextStatus] = useState('Copy text')
  const isNarrow = useIsNarrow()
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const {
    pageCount,
    setPageCount,
    effectiveScale,
    isFitToWidth,
    totalHeight,
    geo,
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
    isMobile: isNarrow,
    isActive: true,
    pageSize: paper,
    pdfFilename: doc.pdfFilename,
    onCopy: () => {
      setCopyTextStatus('Copied')
      window.setTimeout(() => setCopyTextStatus('Copy text'), 1500)
    },
    onError: () => {
      setCopyTextStatus('Copy failed')
      window.setTimeout(() => setCopyTextStatus('Copy text'), 1800)
    },
  })

  const handleDocChange = (next: DocKey) => {
    setDocKey(next)
    setSource(readDraft(getLocalStorage(), DOCS[next].storageKey, DOCS[next].source))
    setCompileError(null)
    scrollRef.current?.scrollTo({ top: 0, left: 0 })
    handleFitToWidth()
  }

  const handleSourceChange = (next: string) => {
    setSource(next)
    writeDraft(getLocalStorage(), doc.storageKey, next)
  }

  const handleReset = () => {
    setSource(doc.source)
    writeDraft(getLocalStorage(), doc.storageKey, doc.source)
    setCompileError(null)
  }

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(doc.source)
      setCopyStatus('Copied')
      window.setTimeout(() => setCopyStatus('Copy template'), 1500)
    } catch {
      setCopyStatus('Copy failed')
      window.setTimeout(() => setCopyStatus('Copy template'), 1800)
    }
  }

  return (
    <div className="live-resume">
      <style>{`@page { size: ${paper}; margin: 0; }`}</style>
      <section className="live-source" aria-label="Resume MDX source editor">
        <div className="live-source-toolbar">
          <DocSegment value={docKey} onChange={handleDocChange} />
          <div className="live-source-actions">
            <button
              className="resume-viewer-btn live-source-btn"
              onClick={handleCopyTemplate}
              type="button"
            >
              {copyStatus === 'Copied' ? (
                <ClipboardCheck className="resume-viewer-icon live-btn-icon live-btn-icon-check" />
              ) : (
                <ClipboardCopy className="resume-viewer-icon live-btn-icon" />
              )}
              <span>{copyStatus}</span>
            </button>
            <button
              className="resume-viewer-btn live-source-btn"
              onClick={handleReset}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>

        <textarea
          aria-label={`${doc.file} source`}
          className="live-source-input"
          onChange={event => handleSourceChange(event.target.value)}
          spellCheck={false}
          value={source}
        />

        <div className="live-source-footer">
          <span>{doc.file}</span>
          <span>{source.length.toLocaleString()} chars</span>
        </div>
      </section>

      <section className="live-preview resume-viewer" aria-label="Parsed resume PDF preview">
        <div className="resume-viewer-toolbar">
          <PageSizeSegment value={paper} onChange={setPaper} />
          <span className="resume-viewer-pagecount">
            {pageCount} page{pageCount === 1 ? '' : 's'}
          </span>
          <div className="resume-viewer-controls">
            <button
              aria-label="Fit resume to width"
              aria-pressed={isFitToWidth}
              className={`resume-viewer-btn${isFitToWidth ? ' resume-viewer-btn-active' : ''}`}
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
              title={copyTextStatus}
              type="button"
            >
              {copyTextStatus === 'Copied' ? (
                <ClipboardCheck className="resume-viewer-icon live-btn-icon-check" />
              ) : (
                <ClipboardCopy className="resume-viewer-icon" />
              )}
            </button>
            <button
              className="resume-viewer-btn resume-viewer-btn-primary"
              onClick={requestPrint}
              type="button"
            >
              Save to PDF
            </button>
          </div>
        </div>

        {compileError ? (
          <div className="live-error" role="status">
            {compileError.message}
          </div>
        ) : null}

        <div
          className={`resume-viewer-scroll ${
            isNarrow ? 'resume-viewer-scroll-mobile' : 'resume-viewer-scroll-grab'
          }`}
          ref={scrollRef}
        >
          <section
            aria-label={
              isNarrow
                ? 'Resume preview. Drag with one finger to pan, pinch to zoom.'
                : 'Resume preview. Drag to pan, Ctrl+scroll to zoom.'
            }
            className="resume-viewer-stage"
          >
            <div
              className="resume-viewer-page-box"
              style={{
                width: geo.widthPx * effectiveScale,
                height: totalHeight * effectiveScale,
              }}
            >
              <div
                className="resume-viewer-scale-root"
                data-resume-scale-root=""
                style={{
                  width: geo.widthPx,
                  height: totalHeight,
                  transform: effectiveScale === 1 ? undefined : `scale(${effectiveScale})`,
                }}
              >
                <ResumePageSizeContext.Provider value={paper}>
                  <ResumeFontFamilyContext.Provider value="inherit">
                    <PaginationReportContext.Provider value={setPageCount}>
                      <div
                        className="resume-viewer-content"
                        id="resume-print-target"
                        ref={contentRef}
                        style={{ zIndex: 1 }}
                      >
                        <MdxLivePreview
                          components={resumeMdxComponents}
                          onError={setCompileError}
                          source={ensureResumeDocument(source)}
                        />
                      </div>
                    </PaginationReportContext.Provider>
                  </ResumeFontFamilyContext.Provider>
                </ResumePageSizeContext.Provider>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function PageSizeSegment({ value, onChange }: { value: Paper; onChange: (next: Paper) => void }) {
  return (
    <div className="resume-viewer-btn-group live-page-size">
      {(['letter', 'a4'] as const).map(opt => (
        <button
          aria-pressed={value === opt}
          className={`resume-viewer-btn${value === opt ? ' resume-viewer-btn-active' : ''}`}
          key={opt}
          onClick={() => onChange(opt)}
          type="button"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function DocSegment({ value, onChange }: { value: DocKey; onChange: (next: DocKey) => void }) {
  return (
    <div className="resume-viewer-btn-group live-doc-segment">
      {(Object.keys(DOCS) as DocKey[]).map(key => (
        <button
          aria-pressed={value === key}
          className={`resume-viewer-btn${value === key ? ' resume-viewer-btn-active' : ''}`}
          key={key}
          onClick={() => onChange(key)}
          type="button"
        >
          {DOCS[key].label}
        </button>
      ))}
    </div>
  )
}
