import { describe, expect, it } from 'vitest'
import { CONTENT_WIDTH_PX, getPageGeometry, PAGE, USABLE_HEIGHT_PX } from './geometry'

describe('geometry', () => {
  it('derives US Letter px from inches at 96dpi', () => {
    expect(PAGE.widthPx).toBe(8.5 * 96)
    expect(PAGE.heightPx).toBe(11 * 96)
  })
  it('derives content + usable area from padding', () => {
    expect(CONTENT_WIDTH_PX).toBe(PAGE.widthPx - 2 * PAGE.padXPx)
    expect(USABLE_HEIGHT_PX).toBe(PAGE.heightPx - 2 * PAGE.padYPx)
  })
})

describe('getPageGeometry', () => {
  it('letter matches the legacy PAGE defaults', () => {
    const g = getPageGeometry('letter')
    expect(g.widthPx).toBe(8.5 * 96)
    expect(g.heightPx).toBe(11 * 96)
    expect(g.padXPx).toBe(0.7 * 96)
    expect(g.padYPx).toBe(0.6 * 96)
    expect(g.gapPx).toBe(32)
    expect(g.contentWidthPx).toBe(g.widthPx - 2 * g.padXPx)
    expect(g.usableHeightPx).toBe(g.heightPx - 2 * g.padYPx)
    expect(g.cssPageSize).toBe('letter')
  })
  it('a4 derives 210x297mm at 96dpi', () => {
    const g = getPageGeometry('a4')
    const mm = 96 / 25.4
    expect(g.widthPx).toBeCloseTo(210 * mm, 5)
    expect(g.heightPx).toBeCloseTo(297 * mm, 5)
    expect(g.cssPageSize).toBe('A4')
  })
  it('defaults to letter', () => {
    expect(getPageGeometry().widthPx).toBe(getPageGeometry('letter').widthPx)
  })
})
