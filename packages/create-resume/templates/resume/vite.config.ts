import mdx from '@mdx-js/rollup'
import { mdxRawPlugin } from '@atom63/resume/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'

// Present-first config: compile resume.mdx / cv.mdx and render them through the
// @atom63/resume viewer. mdxRawPlugin keeps a `?raw` import of the MDX source
// working alongside the MDX plugin — the optional in-app editor relies on it
// (see "Optional: in-app editor" in the README).
export default defineConfig({
  plugins: [
    mdxRawPlugin(),
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(mdx|tsx|jsx)$/ }),
  ],
})
