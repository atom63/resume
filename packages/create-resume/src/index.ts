import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { cp, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cancel, confirm, intro, isCancel, log, outro, select, spinner, text } from '@clack/prompts'

type PackageManager = 'npm' | 'pnpm' | 'yarn'

type CliOptions = {
  cwd: string
  install?: boolean
  git?: boolean
  packageManager?: PackageManager
  projectName?: string
}

const TEMPLATE = 'resume'
const packageManagers = ['npm', 'pnpm', 'yarn'] as const

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    cwd: process.cwd(),
  }

  const args = [...argv]

  while (args.length > 0) {
    const arg = args.shift()

    if (!arg) {
      continue
    }

    if (arg === '--pm') {
      options.packageManager = args.shift() as PackageManager
      continue
    }

    if (arg.startsWith('--pm=')) {
      options.packageManager = arg.slice('--pm='.length) as PackageManager
      continue
    }

    if (arg === '--install') {
      options.install = true
      continue
    }

    if (arg === '--no-install') {
      options.install = false
      continue
    }

    if (arg === '--git') {
      options.git = true
      continue
    }

    if (arg === '--no-git') {
      options.git = false
      continue
    }

    if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }

    if (!options.projectName) {
      options.projectName = arg
    }
  }

  return options
}

function printHelp() {
  log.info(`@atom63/create-resume

Usage:
  npm create @atom63/resume <project-name> -- [options]

Scaffolds a standalone resume/CV project powered by the @atom63/resume engine.

Options:
  --pm npm|pnpm|yarn       Package manager for install + instructions (default: npm)
  --install / --no-install Install dependencies after scaffolding
  --git / --no-git         Initialize a git repository
  -h, --help               Show help`)
}

function packageNameFromProjectName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function assertValidProjectName(projectName: string) {
  if (!projectName.trim()) {
    throw new Error('Project name is required.')
  }

  if (projectName.includes('/') || projectName.includes('\\')) {
    throw new Error('Project name must be a directory name, not a path.')
  }
}

function assertEmptyOrMissingDirectory(targetDir: string) {
  if (!existsSync(targetDir)) {
    return
  }

  const entries = readdirSync(targetDir).filter(entry => entry !== '.DS_Store')

  if (entries.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDir}`)
  }
}

function getReadableTemplateDir() {
  const packageDir = dirname(fileURLToPath(import.meta.url))

  // Built CLI: templates ship alongside dist/ at the package root.
  const builtDir = resolve(packageDir, '../templates', TEMPLATE)
  if (existsSync(builtDir)) {
    return builtDir
  }

  throw new Error(`Template not found: ${TEMPLATE}`)
}

async function rewritePackageName(targetDir: string, packageName: string) {
  const pkgJsonPath = join(targetDir, 'package.json')
  const raw = await readFile(pkgJsonPath, 'utf-8')
  const pkgJson = JSON.parse(raw)

  pkgJson.name = packageName

  await writeFile(pkgJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`)
}

async function promptForOptions(options: CliOptions): Promise<Required<CliOptions>> {
  intro('Create a @atom63/resume project')

  const projectName =
    options.projectName ??
    (await text({
      message: 'Project name',
      placeholder: 'my-resume',
      validate(value) {
        return value.trim() ? undefined : 'Project name is required.'
      },
    }))

  if (isCancel(projectName)) {
    cancel('Scaffold cancelled.')
    process.exit(0)
  }

  // Default to npm so `npm create @atom63/resume` works without further prompting once a
  // project name is known. The picker only appears for fully interactive runs.
  const packageManager: PackageManager =
    options.packageManager ??
    (options.projectName
      ? 'npm'
      : await (async () => {
          const picked = await select({
            message: 'Package manager',
            options: packageManagers.map(value => ({ label: value, value })),
          })
          if (isCancel(picked)) {
            cancel('Scaffold cancelled.')
            process.exit(0)
          }
          return picked
        })())

  const install =
    options.install ??
    (options.projectName
      ? false
      : await (async () => {
          const picked = await confirm({
            initialValue: false,
            message: 'Install dependencies now?',
          })
          if (isCancel(picked)) {
            cancel('Scaffold cancelled.')
            process.exit(0)
          }
          return picked
        })())

  const git =
    options.git ??
    (options.projectName
      ? true
      : await (async () => {
          const picked = await confirm({
            initialValue: true,
            message: 'Initialize git?',
          })
          if (isCancel(picked)) {
            cancel('Scaffold cancelled.')
            process.exit(0)
          }
          return picked
        })())

  return {
    cwd: options.cwd,
    git,
    install,
    packageManager,
    projectName,
  }
}

async function scaffoldProject(options: Required<CliOptions>) {
  assertValidProjectName(options.projectName)

  const packageName = packageNameFromProjectName(options.projectName)
  const targetDir = resolve(options.cwd, options.projectName)
  const templateDir = getReadableTemplateDir()

  if (!existsSync(templateDir)) {
    throw new Error(`Template not found: ${TEMPLATE}`)
  }

  assertEmptyOrMissingDirectory(targetDir)
  mkdirSync(targetDir, { recursive: true })

  const s = spinner()
  s.start(`Scaffolding ${options.projectName}`)
  await cp(templateDir, targetDir, {
    filter(source) {
      // Compare against the path *relative to the template root* so install
      // locations that themselves live under node_modules (npm create / npx)
      // don't cause every file to be filtered out.
      const rel = relative(templateDir, source)
      const segments = rel.split(/[\\/]/)
      return (
        !source.endsWith('.DS_Store') &&
        !segments.includes('node_modules') &&
        !segments.includes('.turbo')
      )
    },
    recursive: true,
  })

  // Set the copied package.json name to the requested project name.
  await rewritePackageName(targetDir, packageName)

  s.stop('Project scaffolded')

  if (options.git) {
    runCommand('git', ['init'], targetDir, 'Initialized git repository')
  }

  if (options.install) {
    runCommand(options.packageManager, ['install'], targetDir, 'Installed dependencies')
  }

  const relativeTarget = relative(options.cwd, targetDir)
  const installCommand =
    options.packageManager === 'npm' ? 'npm install' : `${options.packageManager} install`
  const devCommand =
    options.packageManager === 'npm' ? 'npm run dev' : `${options.packageManager} dev`

  outro(`Done. Next:

  cd ${relativeTarget}
  ${options.install ? devCommand : installCommand}
  ${options.install ? '' : devCommand}

  Then point your coding agent at src/resume.mdx (and src/cv.mdx) to author the
  document, run the dev server, and Save to PDF from the viewer toolbar.`)
}

function runCommand(command: string, args: string[], cwd: string, successMessage: string) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }

  log.success(successMessage)
}

async function main() {
  try {
    const options = await promptForOptions(parseArgs(process.argv.slice(2)))
    await scaffoldProject(options)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    log.error(message)
    process.exit(1)
  }
}

await main()

export { parseArgs, packageNameFromProjectName }
