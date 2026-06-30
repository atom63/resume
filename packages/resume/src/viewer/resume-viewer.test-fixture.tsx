import { Columns, Header, Main, resumeMdxComponents, Sidebar } from '../document/components'

const ResumeDocumentWrapper = resumeMdxComponents.ResumeDocument

/**
 * A minimal paginated document built from the package primitives — wrapped in
 * ResumeDocument (= PaginatedResume) so the pagination engine runs, exactly as
 * a compiled MDX <Content /> would be.
 */
export function ResumeDocumentFixture() {
  return (
    <ResumeDocumentWrapper>
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
    </ResumeDocumentWrapper>
  )
}
