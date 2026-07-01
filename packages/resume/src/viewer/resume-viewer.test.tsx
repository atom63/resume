import { useMDXComponents } from '@mdx-js/react'
import { render } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
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

  it('merges custom MDX components over the default resume components', () => {
    function CustomThing() {
      return <p>Custom component rendered</p>
    }

    function CustomDocumentFixture() {
      const {
        Columns,
        CustomThing: CustomThingFromContext,
        Header,
        Main,
        ResumeDocument,
      } = useMDXComponents() as {
        Columns: ComponentType<{ children: ReactNode }>
        CustomThing: ComponentType
        Header: ComponentType<{ children: ReactNode }>
        Main: ComponentType<{ children: ReactNode }>
        ResumeDocument: ComponentType<{ children: ReactNode }>
      }

      return (
        <ResumeDocument>
          <Header>
            <h1>Jane Doe</h1>
          </Header>
          <Columns>
            <Main>
              <CustomThingFromContext />
            </Main>
          </Columns>
        </ResumeDocument>
      )
    }

    const components = { CustomThing: CustomThing as ComponentType<unknown> }
    const { getAllByText } = render(
      <ResumeViewer Content={CustomDocumentFixture} components={components} pdfFilename="x" />
    )

    expect(getAllByText('Jane Doe').length).toBeGreaterThan(0)
    expect(getAllByText('Custom component rendered').length).toBeGreaterThan(0)
  })
})
