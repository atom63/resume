import { writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import type { Plugin } from 'vite'

export interface ResumeWriteBackOptions {
  /** Path (absolute or relative to Vite root) of the resume file to persist to. */
  resumePath?: string
  /** POST endpoint. Default '/__write-resume'. */
  endpoint?: string
}

/** @internal Not part of the public API — use `resumeWriteBackPlugin` instead. */
export async function handleWriteBack(
  cfg: { resumePath: string; root: string },
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const abs = isAbsolute(cfg.resumePath) ? cfg.resumePath : resolve(cfg.root, cfg.resumePath)
  const rel = relative(cfg.root, abs)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    return { ok: false, error: 'resume path escapes project root' }
  }
  await writeFile(abs, body, 'utf8')
  return { ok: true }
}

const MAX_BODY = 5_000_000

/** DEV-ONLY plugin: POST <endpoint> writes the request body to the resume file. */
export function resumeWriteBackPlugin(options: ResumeWriteBackOptions = {}): Plugin {
  const endpoint = options.endpoint ?? '/__write-resume'
  const resumePath = options.resumePath ?? 'src/resume.mdx'

  return {
    name: '@atom63/resume:resume-write-back',
    apply: 'serve',
    configureServer(server) {
      const resumeAbs = isAbsolute(resumePath)
        ? resumePath
        : resolve(server.config.root, resumePath)
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url?.split('?')[0] !== endpoint) return next()
        let body = ''
        for await (const chunk of req) {
          body += chunk
          if (body.length > MAX_BODY) {
            res.statusCode = 413
            res.end()
            return
          }
        }
        // A GUI Save writes the resume file, which Vite would otherwise full-reload
        // — dropping you out of the editor (the editor already holds this content
        // in state, so the reload is pure disruption). Unwatch the resume file
        // around our own write so the change event never fires, then re-watch
        // shortly after so EXTERNAL edits (you / your agent editing resume.mdx)
        // still hot-reload normally.
        server.watcher.unwatch(resumeAbs)
        try {
          const result = await handleWriteBack({ resumePath, root: server.config.root }, body)
          res.statusCode = result.ok ? 200 : 400
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(
            JSON.stringify({
              ok: false,
              error: error instanceof Error ? error.message : 'Failed to write resume',
            })
          )
        } finally {
          setTimeout(() => server.watcher.add(resumeAbs), 250)
        }
      })
    },
  }
}
