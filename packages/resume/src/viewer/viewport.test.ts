import { describe, expect, it } from 'vitest'
import {
  clampScrollPosition,
  clampZoom,
  getTouchDistance,
  hasExceededPanThreshold,
  isInteractivePanTarget,
} from './viewport'

describe('resume-viewport', () => {
  it('clamps zoom between bounds', () => {
    expect(clampZoom(0.1, 0.25, 2)).toBe(0.25)
    expect(clampZoom(1.5, 0.25, 2)).toBe(1.5)
    expect(clampZoom(3, 0.25, 2)).toBe(2)
  })

  it('detects interactive pan targets', () => {
    const button = document.createElement('button')
    expect(isInteractivePanTarget(button)).toBe(true)

    const wrapper = document.createElement('div')
    wrapper.append(button)
    expect(isInteractivePanTarget(wrapper)).toBe(false)
  })

  it('measures touch distance', () => {
    const touches = [
      { clientX: 0, clientY: 0 },
      { clientX: 3, clientY: 4 },
    ] as unknown as TouchList

    expect(getTouchDistance(touches)).toBe(5)
  })

  it('requires movement before pan starts', () => {
    expect(hasExceededPanThreshold(0, 0, 2, 2)).toBe(false)
    expect(hasExceededPanThreshold(0, 0, 8, 0)).toBe(true)
  })

  it('clamps scroll offsets to content bounds', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'scrollWidth', { value: 1000 })
    Object.defineProperty(element, 'clientWidth', { value: 300 })
    Object.defineProperty(element, 'scrollHeight', { value: 2000 })
    Object.defineProperty(element, 'clientHeight', { value: 400 })

    element.scrollLeft = -50
    element.scrollTop = 2500
    clampScrollPosition(element)

    expect(element.scrollLeft).toBe(0)
    expect(element.scrollTop).toBe(1600)
  })
})
