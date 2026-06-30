import fs from 'node:fs/promises'
import type { Plugin } from 'vite'

const RAW_MDX = /\.mdx\?raw$/
const VIRTUAL_PREFIX = '\0mdx-raw:'
const VIRTUAL_SUFFIX = '.raw'

/**
 * Serve raw `.mdx?raw` imports as plain strings.
 *
 * Vite's built-in `?raw` works for most files, but `@mdx-js/rollup` strips the
 * query and compiles every `.mdx` to a component — so `?raw` would otherwise
 * yield the compiled module, not the source. This `pre` plugin resolves
 * `*.mdx?raw` to a virtual id ending in `.raw` (not `.mdx`), which MDX's
 * extension check skips, then loads the file text for it.
 *
 * Standalone resume consumers need this so `import source from './resume.mdx?raw'`
 * returns the raw MDX text (e.g. to feed the in-app editor / source view).
 */
export function mdxRawPlugin(): Plugin {
  return {
    name: 'mdx-raw',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (!RAW_MDX.test(id)) {
        return null
      }
      const clean = id.replace(/\?raw$/, '')
      const resolved = await this.resolve(clean, importer, { skipSelf: true })
      const filePath = resolved?.id ?? clean
      return `${VIRTUAL_PREFIX}${filePath}${VIRTUAL_SUFFIX}`
    },
    async load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) {
        return null
      }
      const filePath = id.slice(VIRTUAL_PREFIX.length, id.length - VIRTUAL_SUFFIX.length)
      const code = await fs.readFile(filePath, 'utf-8')
      return { code: `export default ${JSON.stringify(code)}`, map: null }
    },
  }
}
