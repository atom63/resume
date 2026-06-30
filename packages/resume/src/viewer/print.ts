/**
 * Build a print-ready clone of the resume content element. The pagination
 * engine already renders real 8.5x11 `[data-resume-page]` frames, so the clone
 * is a plain wrapper holding those frames (no extra page sizing/padding); the
 * print stylesheet maps each frame to a physical page. The hidden measuring
 * layer is dropped so only the real pages print.
 */
export function createPrintClone(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement
  clone.id = 'resume-print-clone'
  clone.style.cssText = 'background:white;color:black'
  clone.querySelector('[data-resume-measure]')?.remove()
  return clone
}

/** Hide all non-essential body children for printing; returns the hidden elements. */
export function hideBodyChildren(): HTMLElement[] {
  const hidden: HTMLElement[] = []
  const preserveTags = new Set(['STYLE', 'LINK', 'SCRIPT'])
  for (const child of Array.from(document.body.children) as HTMLElement[]) {
    if (!preserveTags.has(child.tagName)) {
      child.style.setProperty('display', 'none', 'important')
      hidden.push(child)
    }
  }
  return hidden
}

export interface PrintControllerOptions {
  /** The element holding the rendered resume page frames (contentRef.current). */
  getTarget: () => HTMLElement | null
  /** Suggested PDF filename — becomes document.title during print. */
  getFilename: () => string
  /** Whether THIS viewer should own the print (e.g. it requested print, or it's the active/focused view). */
  shouldOwnPrint: () => boolean
  /** Optional: called after print is torn down (e.g. to force a re-render). */
  onAfterPrint?: () => void
}

/**
 * Register beforeprint/afterprint handlers implementing the clone-and-hide
 * print strategy. Returns an unsubscribe function that removes the listeners.
 */
export function registerPrintController(opts: PrintControllerOptions): () => void {
  let hiddenElements: HTMLElement[] = []
  let savedTitle = ''

  const beforePrint = () => {
    // Own the print only when this viewer should (its Save-to-PDF button /
    // shortcut requested it, or it's the active/focused view). Otherwise leave
    // it alone so another app isn't cloned/printed underneath, and so this
    // viewer isn't skipped when focus hasn't flushed yet.
    if (!opts.shouldOwnPrint()) return
    const target = opts.getTarget()
    if (!target) return
    savedTitle = document.title
    document.title = opts.getFilename()
    const clone = createPrintClone(target)
    hiddenElements = hideBodyChildren()
    document.body.appendChild(clone)
  }

  const afterPrint = () => {
    const clone = document.getElementById('resume-print-clone')
    if (clone) clone.remove()
    document.title = savedTitle
    for (const el of hiddenElements) {
      el.style.removeProperty('display')
    }
    hiddenElements = []
    opts.onAfterPrint?.()
  }

  window.addEventListener('beforeprint', beforePrint)
  window.addEventListener('afterprint', afterPrint)
  return () => {
    window.removeEventListener('beforeprint', beforePrint)
    window.removeEventListener('afterprint', afterPrint)
  }
}
