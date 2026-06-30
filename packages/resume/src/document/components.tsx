import clsx from 'clsx'
import { baseMdxComponents } from '../mdx/base-components'
import { isExternalMdxHref } from '../mdx/external-href'
import { PaginatedResume } from './paginated-resume'

// Styling for these primitives lives in resume-document.css as a small token
// system (--doc-*) + semantic classes (.doc-*). Components only compose those —
// no hardcoded sizes/colors/grid widths — so the resume and CV share one source
// of truth. See paginated-resume.tsx for where the .css is imported and where
// the [data-resume-document] token scope is applied.

export function Header({
  children,
  meta = false,
}: {
  children: React.ReactNode
  /**
   * Use the universal meta grid (left label column + content), the same track
   * widths as <Section> and <Entry>, so the header aligns with everything
   * below it. The default is the resume's sidebar|main split.
   */
  meta?: boolean
}) {
  return (
    <div
      className={clsx('doc-header', meta ? 'doc-meta-grid' : 'doc-resume-grid')}
      data-resume-header
    >
      {children}
    </div>
  )
}

function HeaderLeft({ children }: { children: React.ReactNode }) {
  return <div className="doc-header-col doc-header-left">{children}</div>
}

function HeaderRight({ children }: { children: React.ReactNode }) {
  return <div className="doc-header-col doc-header-right">{children}</div>
}

function Links({ children }: { children: React.ReactNode }) {
  return <div className="doc-group doc-links">{children}</div>
}

export function Group({ children }: { children: React.ReactNode }) {
  return <div className="doc-group">{children}</div>
}

/**
 * A record row (award, media mention, talk, …): a `year | role` meta column on
 * the left and the linked title on the right. Each Entry is a single pagination
 * block, so render long CV lists as a flat sequence of Entry elements (NOT one
 * <ul>) so pages can break between them.
 */
export function Entry({
  year,
  role,
  children,
}: {
  year?: string
  role?: string
  children: React.ReactNode
}) {
  return (
    <div className="doc-meta-grid">
      <span className="doc-meta">{role ? `${year} | ${role}` : year}</span>
      <div className="doc-body doc-entry-body">{children}</div>
    </div>
  )
}

/** A thin full-width divider — the CV uses one under the header band. */
export function Rule() {
  return <div className="doc-rule" />
}

/**
 * Editorial section: the label sits in the left meta column (aligned with the
 * `year | role` column of Entry rows) and the content fills the right column,
 * so prose sections share one left edge with the record rows below. The
 * .doc-section margin keeps every section on the same vertical rhythm as the
 * record-section headings (h3). One pagination block — keep a body under a page.
 */
export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="doc-section doc-meta-grid">
      <h3 className="doc-heading">{label}</h3>
      <div className="doc-col">{children}</div>
    </div>
  )
}

export function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="doc-footer" data-footer>
      {children}
    </div>
  )
}

export function Columns({ children }: { children: React.ReactNode }) {
  return <div className="doc-resume-grid">{children}</div>
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="doc-col doc-col-sidebar" data-resume-col="sidebar">
      {children}
    </div>
  )
}

export function Main({ children }: { children: React.ReactNode }) {
  return (
    <div className="doc-col doc-col-main" data-resume-col="main">
      {children}
    </div>
  )
}

export const resumeMdxComponents = {
  ...baseMdxComponents,

  ResumeDocument: PaginatedResume,

  Header,
  HeaderLeft,
  HeaderRight,
  Links,
  Group,
  Entry,
  Rule,
  Section,
  Footer,
  Columns,
  Sidebar,
  Main,

  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="doc-title" {...props}>
      {children}
    </h1>
  ),

  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="doc-section doc-heading" data-resume-keep-with-next {...props}>
      {children}
    </h3>
  ),

  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="doc-subheading" {...props}>
      {children}
    </h4>
  ),

  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="doc-body" {...props}>
      {children}
    </p>
  ),

  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="doc-list" {...props}>
      {children}
    </ul>
  ),

  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="doc-body" {...props}>
      {children}
    </li>
  ),

  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="doc-strong" {...props}>
      {children}
    </strong>
  ),

  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="doc-meta doc-em" {...props}>
      {children}
    </em>
  ),

  a: ({ children, href, target, rel, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const external = isExternalMdxHref(href)
    return (
      <a
        className="doc-link"
        href={href}
        {...props}
        rel={external ? (rel ?? 'noopener noreferrer') : rel}
        target={external ? (target ?? '_blank') : target}
      >
        {children}
      </a>
    )
  },

  hr: (_props: React.HTMLAttributes<HTMLHRElement>) => <div className="doc-hr" />,
}
