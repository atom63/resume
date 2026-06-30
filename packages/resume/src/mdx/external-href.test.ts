import { describe, expect, it } from 'vitest'
import { isExternalMdxHref } from './external-href'

describe('isExternalMdxHref', () => {
  it('returns false for empty/undefined', () => {
    expect(isExternalMdxHref(undefined)).toBe(false)
    expect(isExternalMdxHref('')).toBe(false)
  })

  it('returns false for anchor links', () => {
    expect(isExternalMdxHref('#anchor')).toBe(false)
  })

  it('returns false for absolute paths', () => {
    expect(isExternalMdxHref('/path')).toBe(false)
    expect(isExternalMdxHref('/docs/intro')).toBe(false)
  })

  it('returns false for mailto: and tel:', () => {
    expect(isExternalMdxHref('mailto:x@y.com')).toBe(false)
    expect(isExternalMdxHref('tel:123')).toBe(false)
  })

  it('returns false for protocol-relative URLs (treated as absolute path)', () => {
    // starts with '/' so the function treats it as an in-app path
    expect(isExternalMdxHref('//cdn.example.com')).toBe(false)
  })

  it('returns true for https URLs in jsdom (different origin)', () => {
    expect(isExternalMdxHref('https://example.com')).toBe(true)
  })

  it('returns false for relative paths', () => {
    expect(isExternalMdxHref('foo.html')).toBe(false)
    expect(isExternalMdxHref('docs/intro')).toBe(false)
  })
})
