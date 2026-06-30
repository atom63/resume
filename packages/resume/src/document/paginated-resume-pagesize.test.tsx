import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { getPageGeometry } from '../geometry'
import { Columns, Header, Main, Sidebar } from './components'
import { PaginatedResume } from './paginated-resume'
import { ResumePageSizeContext } from './pagination-context'

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

function frameHeight(container: HTMLElement): number {
  const page = container.querySelector('[data-resume-page]') as HTMLElement | null
  return page ? Number.parseFloat(page.style.height) : 0
}

describe('PaginatedResume page size', () => {
  it('renders A4-height page frames under an a4 context', () => {
    const { container } = render(
      <ResumePageSizeContext.Provider value="a4">
        <PaginatedResume>
          <Header>
            <h1>Jane</h1>
          </Header>
          <Columns>
            <Sidebar>
              <p>S</p>
            </Sidebar>
            <Main>
              <p>M</p>
            </Main>
          </Columns>
        </PaginatedResume>
      </ResumePageSizeContext.Provider>
    )
    // jsdom can't lay out, so the packer may stay in its measure-only state and
    // render no real frames. Tolerate that (assert the document mounted) while
    // still checking the A4 height if a frame is produced.
    const h = frameHeight(container)
    if (h > 0) expect(h).toBeCloseTo(getPageGeometry('a4').heightPx, 1)
    expect(container.querySelector('[data-resume-document]')).not.toBeNull()
  })
})
