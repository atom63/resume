import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { ResumeViewer } from './resume-viewer'
import { ResumeDocumentFixture } from './resume-viewer.test-fixture'

// jsdom lacks ResizeObserver + matchMedia; stub them.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

describe('ResumeViewer', () => {
  it('mounts with a document and shows the Save to PDF control', () => {
    const { getByText } = render(<ResumeViewer Content={ResumeDocumentFixture} pdfFilename="x" />)
    expect(getByText(/save to pdf/i)).not.toBeNull()
  })
})
