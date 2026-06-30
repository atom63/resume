import type React from 'react'

/**
 * Vendored, dependency-free base prose component map.
 *
 * This is a minimal fallback map that the resume spreads over
 * (`...baseMdxComponents`) before defining its own `h1/h3/h4/p/ul/li/strong/em/a/hr`.
 * It deliberately has NO dependency on `@atom63/ui`, lightbox, article blocks,
 * example containers, or any other `@atom63/*` package — every entry is a plain
 * HTML-element component so the resume package stays self-contained.
 *
 * It only needs to provide sane defaults for elements the resume does NOT override.
 */
export const baseMdxComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props} />,
  h5: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h5 {...props} />,
  h6: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h6 {...props} />,
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => <ol {...props} />,
  blockquote: (props: React.HTMLAttributes<HTMLElement>) => <blockquote {...props} />,
  code: (props: React.HTMLAttributes<HTMLElement>) => <code {...props} />,
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => <pre {...props} />,
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // biome-ignore lint/a11y/useAltText: alt is forwarded via spread props
    <img {...props} />
  ),
} as const
