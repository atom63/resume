const MDX_SPECIAL_PROTOCOL = /^(mailto|tel|javascript):/i

/**
 * True when `href` should open in a new tab: off-origin http(s), protocol-relative,
 * or absolute http(s) during SSR. Same-origin URLs, in-app paths (`/…`, `#…`),
 * relative paths, and `mailto:` / `tel:` / `javascript:` stay in-tab / default behavior.
 */
export function isExternalMdxHref(href: string | undefined): boolean {
  if (!href) {
    return false
  }
  const t = href.trim()
  if (t.startsWith('#') || t.startsWith('/')) {
    return false
  }
  if (MDX_SPECIAL_PROTOCOL.test(t)) {
    return false
  }
  if (t.startsWith('//')) {
    return true
  }
  if (typeof globalThis.window !== 'undefined') {
    try {
      const u = new URL(t, globalThis.window.location.href)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return false
      }
      return u.origin !== globalThis.window.location.origin
    } catch {
      return false
    }
  }
  try {
    const u = new URL(t)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
