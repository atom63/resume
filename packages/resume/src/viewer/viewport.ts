export const INTERACTIVE_PAN_SELECTOR = 'a, button, [role="button"], input, textarea, select'

export const PAN_THRESHOLD_PX = 6

export function clampZoom(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

export function isInteractivePanTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest(INTERACTIVE_PAN_SELECTOR))
}

export function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) {
    return 0
  }

  const first = touches[0]
  const second = touches[1]
  if (!first || !second) {
    return 0
  }

  const deltaX = first.clientX - second.clientX
  const deltaY = first.clientY - second.clientY
  return Math.hypot(deltaX, deltaY)
}

export function clampScrollPosition(element: HTMLElement): void {
  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight)
  element.scrollLeft = Math.min(Math.max(0, element.scrollLeft), maxScrollLeft)
  element.scrollTop = Math.min(Math.max(0, element.scrollTop), maxScrollTop)
}

export function hasExceededPanThreshold(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  threshold = PAN_THRESHOLD_PX
): boolean {
  return Math.abs(currentX - startX) > threshold || Math.abs(currentY - startY) > threshold
}
