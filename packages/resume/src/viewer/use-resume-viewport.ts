// packages/resume/src/viewer/use-resume-viewport.ts
//
// Headless viewport engine for a paginated resume: zoom (buttons / Ctrl+wheel /
// pinch), pan (mouse drag / touch), fit-to-width, focus-aware print + keyboard
// shortcuts. The single source of truth for this behaviour — both the built-in
// `ResumeViewer` and bespoke hosts (e.g. an OS window with its own toolbar
// chrome) consume this hook so the logic is never duplicated.
//
// The host owns the markup and supplies the scroll + content refs; the hook
// wires every listener to them and returns the derived scale, page count, and
// the toolbar action handlers.
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PAGE, WRAPPER_PADDING_X } from '../geometry'
import { registerPrintController } from './print'
import {
  clampScrollPosition,
  clampZoom,
  getTouchDistance,
  hasExceededPanThreshold,
  isInteractivePanTarget,
} from './viewport'

export const SCALE_STEP = 0.1
export const MIN_SCALE = 0.25
export const MAX_SCALE = 2
const WHEEL_ZOOM_SENSITIVITY = 0.01
const WHEEL_ZOOM_CAP = 0.03

const clampResumeZoom = (value: number) => clampZoom(value, MIN_SCALE, MAX_SCALE)

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA'
}

export interface UseResumeViewportOptions {
  /** Scroll viewport element (the host attaches this to its scrollable region). */
  scrollRef: RefObject<HTMLDivElement | null>
  /** Element holding the rendered page frames (the print/copy target). */
  contentRef: RefObject<HTMLDivElement | null>
  /** Narrow-viewport flag — drives touch pan/pinch vs mouse drag. */
  isMobile: boolean
  /** Whether this viewport owns global print + keyboard shortcuts. */
  isActive: boolean
  /** Suggested PDF filename (becomes document.title during print). */
  pdfFilename?: string
  /** Called after a successful copy-to-clipboard. */
  onCopy?: () => void
  /** Called when copy-to-clipboard fails. */
  onError?: (error: unknown) => void
}

export interface UseResumeViewport {
  /** Current page count (reported by the pagination engine via setPageCount). */
  pageCount: number
  /** Reporter wired into PaginationReportContext. */
  setPageCount: (n: number) => void
  /** The scale actually applied to the page stage (fit-to-width or manual zoom). */
  effectiveScale: number
  /** Whether fit-to-width mode is active. */
  isFitToWidth: boolean
  /** Total stacked page height (unscaled px) — for sizing the page box. */
  totalHeight: number
  handleZoomIn: () => void
  handleZoomOut: () => void
  handleActualSize: () => void
  handleFitToWidth: () => void
  requestPrint: () => void
  handleCopyText: () => Promise<void>
  /** Lower/upper zoom bounds (for disabling +/- controls). */
  minScale: number
  maxScale: number
}

/**
 * Wire the resume viewport behaviour to host-supplied refs and return the
 * derived state + action handlers. The host renders the scaled page stage; the
 * pagination engine inside it reports its page count through `setPageCount`.
 */
export function useResumeViewport({
  scrollRef,
  contentRef,
  isMobile,
  isActive,
  pdfFilename,
  onCopy,
  onError,
}: UseResumeViewportOptions): UseResumeViewport {
  // Keep the latest active state readable from global listeners (print/keyboard)
  // without re-registering them, so this viewport only hijacks printing when
  // it's the active view (avoids clashing with other apps' print handlers).
  const isActiveRef = useRef(isActive)
  isActiveRef.current = isActive

  // Set synchronously right before window.print() so the global beforeprint
  // listener knows THIS viewport initiated the print (active state can lag a click).
  const printRequestedRef = useRef(false)
  const requestPrint = useCallback(() => {
    printRequestedRef.current = true
    window.print()
  }, [])

  const zoomAnchorRef = useRef<{
    pointX: number
    pointY: number
    viewportX: number
    viewportY: number
    prevScale: number
  } | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(1)
  const [isFitToWidth, setIsFitToWidth] = useState(true)
  const [, forceRender] = useState(0)
  const dragRef = useRef<{
    startX: number
    startY: number
    scrollX: number
    scrollY: number
  } | null>(null)
  const touchPanRef = useRef<{
    scrollX: number
    scrollY: number
    startX: number
    startY: number
  } | null>(null)
  const pinchRef = useRef<{
    startDistance: number
    startScale: number
  } | null>(null)

  const effectiveScale = isFitToWidth ? fitScale : zoom

  // Refs for stable closures — avoids tearing down/re-registering listeners on every zoom tick
  const effectiveScaleRef = useRef(effectiveScale)
  const isFitToWidthRef = useRef(isFitToWidth)
  const fitScaleRef = useRef(fitScale)
  effectiveScaleRef.current = effectiveScale
  isFitToWidthRef.current = isFitToWidth
  fitScaleRef.current = fitScale

  // Keep zoom synced to fitScale while in fit-to-width mode
  useEffect(() => {
    if (isFitToWidth) setZoom(fitScale)
  }, [isFitToWidth, fitScale])

  // Responsive scaling — compute fit-to-width from the scroll viewport.
  useEffect(() => {
    const viewport = scrollRef.current
    if (!viewport) return

    const updateFitScale = () => {
      const available = Math.max(0, viewport.clientWidth - WRAPPER_PADDING_X)
      setFitScale(clampResumeZoom(Math.min(1, available / PAGE.widthPx)))
    }

    updateFitScale()
    const observer = new ResizeObserver(updateFitScale)
    observer.observe(viewport)
    window.visualViewport?.addEventListener('resize', updateFitScale)

    return () => {
      observer.disconnect()
      window.visualViewport?.removeEventListener('resize', updateFitScale)
    }
  }, [scrollRef])

  const captureViewportCenter = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    zoomAnchorRef.current = {
      pointX: el.scrollLeft + el.clientWidth / 2,
      pointY: el.scrollTop + el.clientHeight / 2,
      viewportX: el.clientWidth / 2,
      viewportY: el.clientHeight / 2,
      prevScale: effectiveScaleRef.current,
    }
  }, [scrollRef])

  const handleZoomIn = useCallback(() => {
    captureViewportCenter()
    setIsFitToWidth(false)
    setZoom(prev => clampResumeZoom(prev + SCALE_STEP))
  }, [captureViewportCenter])

  const handleZoomOut = useCallback(() => {
    captureViewportCenter()
    setIsFitToWidth(false)
    setZoom(prev => clampResumeZoom(prev - SCALE_STEP))
  }, [captureViewportCenter])

  const handleActualSize = useCallback(() => {
    captureViewportCenter()
    setIsFitToWidth(false)
    setZoom(1)
  }, [captureViewportCenter])

  const handleFitToWidth = useCallback(() => {
    setIsFitToWidth(true)
  }, [])

  // Ctrl+wheel zoom — rAF-batched for smooth trackpad pinch
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let pendingDelta = 0
    let rafId = 0
    let lastCursorX = 0
    let lastCursorY = 0

    const flush = () => {
      rafId = 0
      const delta = pendingDelta
      pendingDelta = 0
      const cursorX = lastCursorX
      const cursorY = lastCursorY

      setZoom(prev => {
        const next = clampResumeZoom(prev + delta)
        if (next === prev) return prev
        zoomAnchorRef.current = {
          pointX: el.scrollLeft + cursorX,
          pointY: el.scrollTop + cursorY,
          viewportX: cursorX,
          viewportY: cursorY,
          prevScale: isFitToWidthRef.current ? fitScaleRef.current : prev,
        }
        return next
      })
      setIsFitToWidth(false)
    }

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()

      pendingDelta = Math.max(
        -WHEEL_ZOOM_CAP,
        Math.min(pendingDelta + -e.deltaY * WHEEL_ZOOM_SENSITIVITY, WHEEL_ZOOM_CAP)
      )
      const rect = el.getBoundingClientRect()
      lastCursorX = e.clientX - rect.left
      lastCursorY = e.clientY - rect.top

      if (rafId === 0) {
        rafId = requestAnimationFrame(flush)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (rafId !== 0) cancelAnimationFrame(rafId)
    }
  }, [scrollRef])

  // Scroll anchoring — adjust scroll position after zoom so the focal point stays put
  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current
    if (!anchor) return
    const el = scrollRef.current
    if (!el) return

    const ratio = effectiveScale / anchor.prevScale
    el.scrollLeft = anchor.pointX * ratio - anchor.viewportX
    el.scrollTop = anchor.pointY * ratio - anchor.viewportY
    zoomAnchorRef.current = null
  }, [effectiveScale, scrollRef])

  // Print handling — clone-and-hide strategy, gated on this viewport owning the print.
  useEffect(
    () =>
      registerPrintController({
        getTarget: () => contentRef.current,
        getFilename: () => pdfFilename ?? 'resume',
        shouldOwnPrint: () => printRequestedRef.current || isActiveRef.current,
        onAfterPrint: () => {
          printRequestedRef.current = false
          forceRender(n => n + 1)
        },
      }),
    [pdfFilename, contentRef]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const keyActions: Record<string, () => void> = {
      '+': handleZoomIn,
      '=': handleZoomIn,
      '-': handleZoomOut,
      _: handleZoomOut,
    }
    const modKeyActions: Record<string, () => void> = {
      '0': handleFitToWidth,
      '1': handleActualSize,
      p: requestPrint,
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActiveRef.current || isInputFocused()) return
      const mod = e.ctrlKey || e.metaKey
      const action = mod ? modKeyActions[e.key] : keyActions[e.key]
      if (action) {
        e.preventDefault()
        action()
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown)
    return () => globalThis.removeEventListener('keydown', handleKeyDown)
  }, [handleZoomIn, handleZoomOut, handleFitToWidth, handleActualSize, requestPrint])

  // Click-and-drag panning (hand tool). Mobile uses touch pan + pinch-to-zoom.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const setPanActive = (active: boolean) => {
      if (isMobile) {
        el.dataset.panActive = active ? '' : undefined
      }
    }

    const moveDrag = (clientX: number, clientY: number) => {
      const drag = dragRef.current
      if (!drag) return
      el.scrollLeft = drag.scrollX - (clientX - drag.startX)
      el.scrollTop = drag.scrollY - (clientY - drag.startY)
      clampScrollPosition(el)
    }

    const beginDrag = (clientX: number, clientY: number) => {
      dragRef.current = {
        startX: clientX,
        startY: clientY,
        scrollX: el.scrollLeft,
        scrollY: el.scrollTop,
      }
      setPanActive(true)
      if (!isMobile) {
        el.classList.replace('resume-viewer-scroll-grab', 'resume-viewer-scroll-grabbing')
        el.classList.replace('cursor-grab', 'cursor-grabbing')
      }
    }

    const endDrag = () => {
      touchPanRef.current = null
      pinchRef.current = null
      if (!dragRef.current) return
      dragRef.current = null
      setPanActive(false)
      if (!isMobile) {
        el.classList.replace('resume-viewer-scroll-grabbing', 'resume-viewer-scroll-grab')
        el.classList.replace('cursor-grabbing', 'cursor-grab')
      }
    }

    const captureZoomAnchor = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      zoomAnchorRef.current = {
        pointX: el.scrollLeft + clientX - rect.left,
        pointY: el.scrollTop + clientY - rect.top,
        viewportX: clientX - rect.left,
        viewportY: clientY - rect.top,
        prevScale: effectiveScaleRef.current,
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (isMobile || e.button !== 0) return
      if (isInteractivePanTarget(e.target)) return

      beginDrag(e.clientX, e.clientY)
      e.preventDefault()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isMobile) return
      moveDrag(e.clientX, e.clientY)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobile) return

      if (e.touches.length === 2) {
        touchPanRef.current = null
        dragRef.current = null
        const distance = getTouchDistance(e.touches)
        if (distance <= 0) return
        pinchRef.current = {
          startDistance: distance,
          startScale: effectiveScaleRef.current,
        }
        setIsFitToWidth(false)
        return
      }

      if (e.touches.length !== 1 || pinchRef.current) return
      if (isInteractivePanTarget(e.target)) return

      const touch = e.touches[0]
      if (!touch) return
      touchPanRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        scrollX: el.scrollLeft,
        scrollY: el.scrollTop,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isMobile) return

      if (pinchRef.current && e.touches.length === 2) {
        const distance = getTouchDistance(e.touches)
        if (distance <= 0 || pinchRef.current.startDistance <= 0) return

        const first = e.touches[0]
        const second = e.touches[1]
        if (!first || !second) return

        const centerX = (first.clientX + second.clientX) / 2
        const centerY = (first.clientY + second.clientY) / 2
        const nextScale = clampResumeZoom(
          pinchRef.current.startScale * (distance / pinchRef.current.startDistance)
        )

        captureZoomAnchor(centerX, centerY)
        setZoom(nextScale)
        setIsFitToWidth(false)
        e.preventDefault()
        return
      }

      const pendingPan = touchPanRef.current
      const touch = e.touches[0]
      if (!pendingPan || !touch) return

      if (!dragRef.current) {
        if (
          !hasExceededPanThreshold(
            pendingPan.startX,
            pendingPan.startY,
            touch.clientX,
            touch.clientY
          )
        ) {
          return
        }

        dragRef.current = {
          startX: pendingPan.startX,
          startY: pendingPan.startY,
          scrollX: pendingPan.scrollX,
          scrollY: pendingPan.scrollY,
        }
        setPanActive(true)
      }

      moveDrag(touch.clientX, touch.clientY)
      e.preventDefault()
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', endDrag)

    if (isMobile) {
      el.addEventListener('touchstart', onTouchStart, { passive: true })
      el.addEventListener('touchmove', onTouchMove, { passive: false })
      el.addEventListener('touchend', endDrag)
      el.addEventListener('touchcancel', endDrag)
    }

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', endDrag)
      delete el.dataset.panActive
      if (isMobile) {
        el.removeEventListener('touchstart', onTouchStart)
        el.removeEventListener('touchmove', onTouchMove)
        el.removeEventListener('touchend', endDrag)
        el.removeEventListener('touchcancel', endDrag)
      }
    }
  }, [isMobile, scrollRef])

  const handleCopyText = useCallback(async () => {
    const content = contentRef.current
    if (!content) return
    try {
      await navigator.clipboard.writeText(content.innerText)
      onCopy?.()
    } catch (error) {
      onError?.(error)
    }
  }, [contentRef, onCopy, onError])

  const totalHeight = pageCount * PAGE.heightPx + Math.max(0, pageCount - 1) * PAGE.gapPx

  return {
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
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  }
}
