import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { handleWriteBack } from './write-back'

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
