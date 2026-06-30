import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { Columns, Header, Main, Sidebar } from './components'
import { PaginatedResume } from './paginated-resume'

// jsdom has no ResizeObserver; the measure layer constructs one on mount.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('PaginatedResume', () => {
  it('mounts and renders a page frame', () => {
    const { container } = render(
      <PaginatedResume>
        <Header>
          <h1>Jane Doe</h1>
        </Header>
        <Columns>
          <Sidebar>
            <p>Skills</p>
          </Sidebar>
          <Main>
            <p>Experience</p>
          </Main>
        </Columns>
      </PaginatedResume>
    )
    expect(container.querySelector('[data-resume-document]')).not.toBeNull()
  })
})
