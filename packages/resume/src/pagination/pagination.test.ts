// packages/resume/src/pagination/pagination.test.ts
import { describe, expect, it } from 'vitest'
import { type Block, packIntoPages } from './pagination'

const flat = (n: number, h: number, keep = false): Block[] =>
  Array.from({ length: n }, (_, i) => ({ id: `b${i}`, height: h, keepWithNext: keep }))
const full = () => 1000 // usable height for every page

describe('packIntoPages', () => {
  it('keeps everything on one page when it fits', () => {
    const r = packIntoPages({
      columns: { sidebar: flat(2, 200), main: flat(3, 200) },
      pageUsableHeight: full,
    })
    expect(r.pageCount).toBe(1)
    expect(r.pageOf.main.b2).toBe(0)
  })

  it('advances a page when the next block overflows', () => {
    const r = packIntoPages({
      columns: {
        sidebar: [],
        main: [
          { id: 'a', height: 600, keepWithNext: false },
          { id: 'b', height: 600, keepWithNext: false },
        ],
      },
      pageUsableHeight: full,
    })
    expect(r.pageCount).toBe(2)
    expect(r.pageOf.main.a).toBe(0)
    expect(r.pageOf.main.b).toBe(1)
  })

  it('moves a keep-with-next heading forward to avoid an orphan', () => {
    const r = packIntoPages({
      columns: {
        sidebar: [],
        main: [
          { id: 'fill', height: 900, keepWithNext: false },
          { id: 'head', height: 20, keepWithNext: true },
          { id: 'body', height: 200, keepWithNext: false },
        ],
      },
      pageUsableHeight: full,
    })
    // head alone would fit on page 0 (920 <= 1000) but head+body would not,
    // so head moves to page 1 with body.
    expect(r.pageOf.main.head).toBe(1)
    expect(r.pageOf.main.body).toBe(1)
  })

  it('gives an oversized block its own page', () => {
    const r = packIntoPages({
      columns: {
        sidebar: [],
        main: [
          { id: 'a', height: 300, keepWithNext: false },
          { id: 'big', height: 1400, keepWithNext: false },
          { id: 'c', height: 300, keepWithNext: false },
        ],
      },
      pageUsableHeight: full,
    })
    expect(r.oversized).toContain('big')
    expect(r.pageOf.main.a).toBe(0)
    expect(r.pageOf.main.big).toBe(1)
    expect(r.pageOf.main.c).toBe(2)
  })

  it('does not add a trailing blank page after a final oversized block', () => {
    const r = packIntoPages({
      columns: {
        sidebar: [],
        main: [{ id: 'big', height: 1400, keepWithNext: false }],
      },
      pageUsableHeight: full,
    })
    expect(r.pageCount).toBe(1)
    expect(r.pageOf.main.big).toBe(0)
  })

  it('uses a shorter first page (header band) to shift the boundary', () => {
    const r = packIntoPages({
      columns: { sidebar: [], main: flat(2, 600) },
      pageUsableHeight: p => (p === 0 ? 800 : 1000),
    })
    expect(r.pageOf.main.b0).toBe(0)
    expect(r.pageOf.main.b1).toBe(1) // 600+600 > 800
  })

  it('page count is the max across columns', () => {
    const r = packIntoPages({
      columns: { sidebar: flat(1, 200), main: flat(6, 400) },
      pageUsableHeight: full,
    })
    expect(r.pageCount).toBe(3) // main: 400*6=2400 / 1000 -> 3 pages
  })

  it('empty content is a single page', () => {
    const r = packIntoPages({ columns: { sidebar: [], main: [] }, pageUsableHeight: full })
    expect(r.pageCount).toBe(1)
  })

  it('accounts for the inter-block gap so a column does not overflow', () => {
    const cols = { sidebar: [], main: flat(4, 250) } // 4*250 = 1000, exactly fits without gap
    // Without a gap, all four blocks fit on one page.
    expect(packIntoPages({ columns: cols, pageUsableHeight: full }).pageCount).toBe(1)
    // With a 50px gap between blocks, 250 + 3*(50+250) = 1150 > 1000 → spills to page 2.
    const gapped = packIntoPages({ columns: cols, pageUsableHeight: full, blockGap: 50 })
    expect(gapped.pageCount).toBe(2)
    expect(gapped.pageOf.main.b3).toBe(1)
  })
})
