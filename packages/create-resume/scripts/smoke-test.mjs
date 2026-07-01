import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const tempDir = mkdtempSync(join(tmpdir(), 'create-resume-'))
const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const cliPath = join(packageDir, 'dist/index.js')
const projectName = 'smoke-resume'
const projectDir = join(tempDir, projectName)

let failed = false

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ ${message}`)
    failed = true
  } else {
    console.log(`  ✓ ${message}`)
  }
}

try {
  // 1. Scaffold
  console.log('\n→ Scaffolding project...')
  const result = spawnSync('node', [cliPath, projectName, '--no-install', '--no-git'], {
    cwd: tempDir,
    stdio: 'pipe',
    env: { ...process.env, CI: '1' },
  })

  assert(result.status === 0, 'CLI exits with code 0')

  // 2. Verify file structure
  console.log('\n→ Checking file structure...')
  const expectedFiles = [
    'package.json',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'README.md',
    '.gitignore',
    'src/main.tsx',
    'src/app.tsx',
    'src/resume.mdx',
    'src/cv.mdx',
    'src/index.css',
  ]

  for (const file of expectedFiles) {
    assert(existsSync(join(projectDir, file)), `${file} exists`)
  }

  // 3. Verify package.json — name rewritten, external deps (no workspace:*)
  console.log('\n→ Checking package.json...')
  const pkgJson = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf-8'))

  assert(pkgJson.name === projectName, 'name is set to the requested project name')
  assert(pkgJson.dependencies['@atom63/resume'] === '^0.2.1', '@atom63/resume is a published range')

  const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies }
  const workspaceRefs = Object.entries(allDeps).filter(([, v]) =>
    String(v).startsWith('workspace:')
  )
  assert(workspaceRefs.length === 0, 'no workspace: references remain')

  // 4. Verify the template is Tailwind-free (no tailwind deps, no @source wiring)
  console.log('\n→ Checking Tailwind-free wiring...')
  assert(!('tailwindcss' in allDeps), 'no tailwindcss dependency')
  assert(!('@tailwindcss/vite' in allDeps), 'no @tailwindcss/vite dependency')
  const indexCss = readFileSync(join(projectDir, 'src/index.css'), 'utf-8')
  assert(!indexCss.includes('tailwindcss'), 'index.css does not import tailwindcss')

  // 5. Verify app + MDX wire the published package, not a monorepo path
  console.log('\n→ Checking package wiring...')
  const appTsx = readFileSync(join(projectDir, 'src/app.tsx'), 'utf-8')
  assert(appTsx.includes('@atom63/resume'), 'app.tsx imports from @atom63/resume')
  assert(!appTsx.includes('packages/resume'), 'app.tsx has no monorepo-relative import')

  // 6. Verify tsconfigs are self-contained (no @atom63/tsconfig extends)
  console.log('\n→ Checking tsconfig is self-contained...')
  const tsconfigApp = readFileSync(join(projectDir, 'tsconfig.app.json'), 'utf-8')
  assert(
    !tsconfigApp.includes('@atom63/tsconfig'),
    'tsconfig.app.json does not extend @atom63/tsconfig'
  )

  // 7. Verify no monorepo-only artifacts leaked
  console.log('\n→ Checking no monorepo artifacts...')
  assert(!existsSync(join(projectDir, 'node_modules')), 'no node_modules copied')
  assert(!existsSync(join(projectDir, '.turbo')), 'no .turbo copied')

  // Summary
  console.log(failed ? '\n✗ Smoke test FAILED' : '\n✓ All checks passed')
} finally {
  rmSync(tempDir, { force: true, recursive: true })
}

if (failed) process.exit(1)
