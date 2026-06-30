// packages/resume/src/pagination/pagination.ts

export interface Block {
  id: string
  /** Measured px (offsetHeight + vertical margins). */
  height: number
  /** Section headings: don't leave them orphaned at a page bottom. */
  keepWithNext: boolean
}

export type ColumnKey = 'sidebar' | 'main'

export interface PackInput {
  columns: Record<ColumnKey, Block[]>
  /** Usable content height for a given page index; index 0 may be shorter (header band). */
  pageUsableHeight: (pageIndex: number) => number
  /**
   * Vertical gap rendered between consecutive blocks in a column (the flex
   * `gap`). Block heights are measured individually, so the packer must add
   * this back or pages overflow once they hold many blocks. Defaults to 0.
   */
  blockGap?: number
}

export interface PackResult {
  pageCount: number
  pageOf: Record<ColumnKey, Record<string, number>>
  /** Blocks taller than a full page — placed alone, allowed to overflow. */
  oversized: string[]
}

function packColumn(
  blocks: Block[],
  pageUsableHeight: (p: number) => number,
  gap: number
): { pageOf: Record<string, number>; pages: number; oversized: string[] } {
  const pageOf: Record<string, number> = {}
  const oversized: string[] = []
  let page = 0
  let used = 0

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    let cap = pageUsableHeight(page)
    // A gap precedes every block except the first on its page.
    const gapBefore = used > 0 ? gap : 0

    // Move to a fresh page if this block (plus its leading gap) overflows.
    if (used > 0 && used + gapBefore + b.height > cap) {
      page++
      used = 0
      cap = pageUsableHeight(page)
    } else if (
      // Keep-with-next: heading fits alone but heading + gap + next block
      // doesn't — push the heading forward so it isn't orphaned.
      used > 0 &&
      b.keepWithNext &&
      used + gapBefore + b.height <= cap &&
      i + 1 < blocks.length &&
      used + gapBefore + b.height + gap + blocks[i + 1].height > cap
    ) {
      page++
      used = 0
      cap = pageUsableHeight(page)
    }

    // Oversized: taller than a whole (now-empty) page. Place alone, allow overflow.
    if (b.height > cap && used === 0) {
      oversized.push(b.id)
      pageOf[b.id] = page
      page++
      used = 0
      continue
    }

    pageOf[b.id] = page
    used += (used > 0 ? gap : 0) + b.height
  }

  return { pageOf, pages: page + 1, oversized }
}

/** Assign measured blocks to pages per column. Pure: no DOM. */
export function packIntoPages(input: PackInput): PackResult {
  const gap = input.blockGap ?? 0
  const sidebar = packColumn(input.columns.sidebar, input.pageUsableHeight, gap)
  const main = packColumn(input.columns.main, input.pageUsableHeight, gap)
  return {
    pageCount: Math.max(sidebar.pages, main.pages, 1),
    pageOf: { sidebar: sidebar.pageOf, main: main.pageOf },
    oversized: [...sidebar.oversized, ...main.oversized],
  }
}
