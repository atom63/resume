import {
  Children,
  Fragment,
  isValidElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { BLOCK_GAP_PX, getPageGeometry } from '../geometry'
import { type Block, type ColumnKey, packIntoPages } from '../pagination/pagination'
import { Columns, Footer, Header, Main, Sidebar } from './components'
import { usePaginationReport, useResumeFontFamily, useResumePageSize } from './pagination-context'
import '../styles/tokens.css'
import '../styles/document.css'

type Columned = Record<ColumnKey, ReactNode[]>

/**
 * Flatten one level, descending through Fragments. MDX wraps top-level content
 * (and component children) in Fragments, so `Children.toArray` alone yields the
 * Fragment, not the Header/Columns/Sidebar elements inside it.
 */
function flattenChildren(children: ReactNode): ReactNode[] {
  const out: ReactNode[] = []
  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === Fragment) {
      out.push(...flattenChildren((child.props as { children: ReactNode }).children))
    } else {
      out.push(child)
    }
  }
  return out
}

/** Pull Header / Columns(Sidebar,Main) / Footer out of the MDX wrapper children. */
function extract(children: ReactNode): {
  header: ReactNode | null
  footer: ReactNode | null
  blocks: Columned
} {
  let header: ReactNode | null = null
  let footer: ReactNode | null = null
  const blocks: Columned = { sidebar: [], main: [] }

  for (const child of flattenChildren(children)) {
    if (!isValidElement(child)) continue
    if (child.type === Header) header = child
    else if (child.type === Footer) footer = child
    else if (child.type === Columns) {
      for (const col of flattenChildren((child.props as { children: ReactNode }).children)) {
        if (!isValidElement(col)) continue
        const key: ColumnKey | null =
          col.type === Sidebar ? 'sidebar' : col.type === Main ? 'main' : null
        if (key) {
          blocks[key] = flattenChildren((col.props as { children: ReactNode }).children)
        }
      }
    }
  }
  return { header, footer, blocks }
}

/** Read a block element's full vertical extent (border box + margins). */
function blockHeight(el: HTMLElement): number {
  const cs = getComputedStyle(el)
  const mt = Number.parseFloat(cs.marginTop) || 0
  const mb = Number.parseFloat(cs.marginBottom) || 0
  return el.getBoundingClientRect().height + mt + mb
}

/**
 * Mounted as the MDX `wrapper`, so it receives [Header, Columns, Footer].
 * Measures each column's blocks in a hidden layer, packs them into pages, and
 * renders physical page frames. Reports pageCount up to ResumeApp.
 */
export function PaginatedResume({ children }: { children: ReactNode }) {
  const { header, footer, blocks } = extract(children)
  const fontFamily = useResumeFontFamily()
  const pageSize = useResumePageSize()
  const geo = getPageGeometry(pageSize)
  const report = usePaginationReport()

  const measureRef = useRef<HTMLDivElement>(null)
  const [heights, setHeights] = useState<Record<ColumnKey, number[]> | null>(null)
  const [headerH, setHeaderH] = useState(0)

  // contentKey changes whenever the rendered content could change height.
  // Print-fixed (px) sizes: only the inherited font *family* and the block
  // counts can change measured heights — the OS typography scale is ignored.
  const contentKey = `${fontFamily}:${pageSize}:${blocks.sidebar.length}:${blocks.main.length}`

  // contentKey is the intentional re-measure trigger: a change in font family /
  // block counts must force a fresh measure even though it isn't read in the body.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberate re-run trigger
  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root) return
    const measure = () => {
      const cols: Record<ColumnKey, number[]> = { sidebar: [], main: [] }
      for (const key of ['sidebar', 'main'] as ColumnKey[]) {
        const colEl = root.querySelector(`[data-resume-col="${key}"]`)
        if (colEl) {
          cols[key] = Array.from(colEl.children).map(c => blockHeight(c as HTMLElement))
        }
      }
      const headerEl = root.querySelector('[data-resume-header]') as HTMLElement | null
      setHeaderH(headerEl ? blockHeight(headerEl) : 0)
      setHeights(cols)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)

    // Re-measure on window (os63 window) resize — e.g. maximize/restore. The
    // measure root is fixed-width, so its own observer never catches this;
    // watch the enclosing scroll viewport, which tracks the window size. A
    // double rAF lets layout settle so a mid-transition read doesn't stick
    // (which collapsed multi-page docs to a single clipped page).
    const viewport = root.closest('[data-slot="scroll-area-viewport"]')
    // Debounce to a TRAILING measure: the os63 window's maximize/restore is a
    // spring animation, so reading mid-transition lands on a wrong height that
    // then sticks. Wait for the resize to stop, then measure the settled layout.
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    const scheduleMeasure = () => {
      clearTimeout(settleTimer)
      settleTimer = setTimeout(measure, 250)
    }
    const vpObserver = viewport ? new ResizeObserver(scheduleMeasure) : null
    vpObserver?.observe(viewport as Element)

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(measure).catch(() => {})
    }
    return () => {
      ro.disconnect()
      vpObserver?.disconnect()
      clearTimeout(settleTimer)
    }
  }, [contentKey])

  // The hidden measuring layer renders the real structure at content width.
  const measureLayer = (
    <div
      aria-hidden
      data-resume-measure
      ref={measureRef}
      style={{
        position: 'absolute',
        top: 0,
        left: -99999,
        width: geo.contentWidthPx,
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {header}
      {blocks.sidebar.length === 0 ? (
        // Single-column docs (e.g. the CV) put everything in Main and render
        // full-width. Measure at full width too so block heights match the
        // full-width page render below (otherwise they'd be measured at the
        // narrower 2/3 main-column width and mis-paginate).
        <div className="doc-col" data-resume-col="main">
          {blocks.main}
        </div>
      ) : (
        <Columns>
          <Sidebar>{blocks.sidebar}</Sidebar>
          <Main>{blocks.main}</Main>
        </Columns>
      )}
    </div>
  )

  if (!heights) {
    return <div data-resume-document>{measureLayer}</div>
  }

  const toBlocks = (key: ColumnKey): Block[] =>
    blocks[key].map((node, i) => ({
      id: `${key}-${i}`,
      height: heights[key][i] ?? 0,
      keepWithNext:
        isValidElement(node) &&
        Boolean((node.props as Record<string, unknown>)['data-resume-keep-with-next']),
    }))

  const sidebarBlocks = toBlocks('sidebar')
  const mainBlocks = toBlocks('main')

  const pack = packIntoPages({
    columns: { sidebar: sidebarBlocks, main: mainBlocks },
    pageUsableHeight: p =>
      p === 0 ? Math.max(0, geo.usableHeightPx - headerH) : geo.usableHeightPx,
    blockGap: BLOCK_GAP_PX,
  })

  return (
    <div data-resume-document>
      {measureLayer}
      <div className="doc-pages" style={{ gap: geo.gapPx }}>
        {Array.from({ length: pack.pageCount }, (_, p) => {
          const sideOnPage = blocks.sidebar.filter(
            (_, i) => pack.pageOf.sidebar[`sidebar-${i}`] === p
          )
          const mainOnPage = blocks.main.filter((_, i) => pack.pageOf.main[`main-${i}`] === p)
          // Key the layout on the WHOLE document, not the current page: a
          // single-column doc (the CV — no sidebar at all) renders full
          // width, but a two-column doc keeps its grid on every page,
          // including continuation pages where the sidebar has run out, so
          // the main column stays in its right-hand track instead of
          // jumping to full width (which broke the 2-col layout on page 2+).
          const isTwoColumn = blocks.sidebar.length > 0
          return (
            <div
              className="doc-page"
              data-resume-page
              key={`page-${String(p)}`}
              style={{
                width: geo.widthPx,
                height: geo.heightPx,
                overflow: 'hidden',
                padding: `${geo.padYPx}px ${geo.padXPx}px`,
              }}
            >
              {p === 0 && header}
              {isTwoColumn ? (
                <div className="doc-resume-grid">
                  <div className="doc-col doc-col-sidebar">{sideOnPage}</div>
                  <div className="doc-col doc-col-main">{mainOnPage}</div>
                </div>
              ) : (
                <div className="doc-col">{mainOnPage}</div>
              )}
              {p === pack.pageCount - 1 && footer}
            </div>
          )
        })}
      </div>
      <PageCountReporter count={pack.pageCount} report={report} />
    </div>
  )
}

/** Reports pageCount via an effect (no setState-during-render). */
function PageCountReporter({ count, report }: { count: number; report: (n: number) => void }) {
  useEffect(() => {
    report(count)
  }, [count, report])
  return null
}
