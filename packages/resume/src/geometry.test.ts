import { describe, expect, it } from 'vitest'
import { CONTENT_WIDTH_PX, PAGE, USABLE_HEIGHT_PX } from './geometry'

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
