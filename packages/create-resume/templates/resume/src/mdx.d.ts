declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: Record<string, unknown>
  const MDXComponent: ComponentType
  export default MDXComponent
}

declare module '*.mdx?raw' {
  const src: string
  export default src
}
