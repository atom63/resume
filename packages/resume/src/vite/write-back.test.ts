import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ViteDevServer } from 'vite'
import { expect, test, vi } from 'vitest'
import { handleWriteBack, resumeWriteBackPlugin } from './write-back'

test('writes posted body to the configured resume file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'wb-'))
  const resume = join(dir, 'resume.mdx')
  writeFileSync(resume, 'old')
  const res = await handleWriteBack({ resumePath: resume, root: dir }, 'new content')
  expect(res.ok).toBe(true)
  expect(readFileSync(resume, 'utf8')).toBe('new content')
})

test('rejects when resolved resume escapes root', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'wb-'))
  const res = await handleWriteBack({ resumePath: '/etc/passwd', root: dir }, 'x')
  expect(res.ok).toBe(false)
})

test('resolves a relative resumePath against root', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'wb-'))
  writeFileSync(join(dir, 'resume.mdx'), 'old')
  const res = await handleWriteBack({ resumePath: 'resume.mdx', root: dir }, 'next')
  expect(res.ok).toBe(true)
  expect(readFileSync(join(dir, 'resume.mdx'), 'utf8')).toBe('next')
})

test('write-back middleware restores the watcher and returns json when writing fails', async () => {
  vi.useFakeTimers()
  const dir = mkdtempSync(join(tmpdir(), 'wb-'))
  mkdirSync(join(dir, 'resume.mdx'))

  type Middleware = (
    req: AsyncIterable<Buffer> & { method?: string; url?: string },
    res: {
      end: (body?: string) => void
      setHeader: (key: string, value: string) => void
      statusCode: number
    },
    next: () => void
  ) => Promise<void>
  let middleware: Middleware | undefined

  const plugin = resumeWriteBackPlugin({ resumePath: 'resume.mdx' })
  const watcher = { add: vi.fn(), unwatch: vi.fn() }
  const server = {
    config: { root: dir },
    middlewares: {
      use(fn: Middleware) {
        middleware = fn
      },
    },
    watcher,
  } as unknown as ViteDevServer
  const configureServer = plugin.configureServer
  if (typeof configureServer === 'function') {
    configureServer.call({} as never, server)
  } else {
    configureServer?.handler.call({} as never, server)
  }

  if (!middleware) {
    throw new Error('write-back middleware was not registered')
  }

  let responseBody = ''
  const res = {
    statusCode: 200,
    end: vi.fn((body?: string) => {
      responseBody = body ?? ''
    }),
    setHeader: vi.fn(),
  }
  const req = {
    method: 'POST',
    url: '/__write-resume',
    async *[Symbol.asyncIterator]() {
      yield Buffer.from('next')
    },
  }

  await expect(middleware(req, res, vi.fn())).resolves.toBeUndefined()
  await vi.runOnlyPendingTimersAsync()
  vi.useRealTimers()

  expect(watcher.unwatch).toHaveBeenCalledWith(join(dir, 'resume.mdx'))
  expect(watcher.add).toHaveBeenCalledWith(join(dir, 'resume.mdx'))
  expect(res.statusCode).toBe(500)
  expect(res.setHeader).toHaveBeenCalledWith('content-type', 'application/json')
  expect(JSON.parse(responseBody)).toMatchObject({ ok: false })
})
