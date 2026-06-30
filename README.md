# @atom63/resume

**Write your resume and CV as MDX — and let a coding agent draft them.**

A resume is just an `.mdx` file built from a small grammar of composable primitives (`Header`, `Columns`/`Sidebar`/`Main`, `Section`, `Entry`, `Footer`, …). The engine paginates it into real 8.5×11″ pages, renders a zoom/pan viewer, and prints to a clean multi-page PDF. Because the document is *code*, a coding agent (Claude Code, Cursor, …) can write the whole thing from your notes — and you keep the MDX as the source of truth.

> Status: `0.1.x`. The API may shift before `1.0`.

## Two ways to use it

### 1. Scaffold a project (`npm create`)

```bash
npm create @atom63/resume@latest my-resume
cd my-resume
npm install
npm run dev      # resume renders in a zoom/pan viewer; Save to PDF from the toolbar
```

You get a standalone Vite app with starter `src/resume.mdx` (two-column) and `src/cv.mdx` (single-column). Point your coding agent at those files to author the content.

### 2. Add the module to an existing React app

```bash
npm i @atom63/resume
```

```tsx
import { ResumeViewer } from '@atom63/resume'
import '@atom63/resume/styles'
import Resume from './resume.mdx'

export default () => <ResumeViewer Content={Resume} pdfFilename="Resume" />
```

Your app needs the MDX + raw-import Vite wiring shown in the scaffolded `vite.config.ts` (`@mdx-js/rollup` + `mdxRawPlugin` from `@atom63/resume/vite`).

## What's in the box

| Export | What it is |
|---|---|
| `@atom63/resume` | `ResumeViewer`, the `PaginatedResume` engine + MDX primitives, the pure `packIntoPages` packer, `useResumeViewport`, and `PAGE` geometry |
| `@atom63/resume/editor` | `ResumeEditor` + `MdxLivePreview` — an optional in-app live MDX editor |
| `@atom63/resume/vite` | `mdxRawPlugin` (so `import src from './resume.mdx?raw'` works) + `resumeWriteBackPlugin` |
| `@atom63/resume/styles` | import-and-done stylesheet (tokens + document + viewer chrome) |
| `@atom63/resume/tokens` | just the `--paper-*` / `--doc-*` design tokens |

## Styling

The document is styled by a small, **Tailwind-free** token system you can override (scoped to `[data-resume-document]`):

- `--paper-*` — page geometry (`--paper-width`, `--paper-height`, `--paper-pad-x/y`). Defaults to US Letter; override for A4.
- `--doc-*` — document language: layout (`--doc-meta-col`, `--doc-cols`), type (`--doc-text`, `--doc-leading`), and ink (`--doc-ink`, `--doc-ink-body/muted/faint`, `--doc-rule`).

## The MDX grammar

```mdx
<ResumeDocument>
  <Header>
    <HeaderLeft># Jane Doe</HeaderLeft>
    <HeaderRight>Design Engineer</HeaderRight>
  </Header>
  <Columns>
    <Sidebar>
      ### Skills
      - TypeScript, React
    </Sidebar>
    <Main>
      ### Experience
      <Entry year="2022 — Now" role="Engineer @ ACME">
        Built things.
      </Entry>
    </Main>
  </Columns>
  <Footer>jane@example.com</Footer>
</ResumeDocument>
```

Single-column CVs put everything in `<Main>` (or drop the sidebar) and use `<Section label="…">` + `<Entry>` rows.

## Limitations

- Markdown tables render unstyled (the resume engine ships no table styling).

## Development

This repo is a **generated mirror** of the `@atom63/resume` toolchain, which is developed in the [atom63 monorepo](https://github.com/atom63/atom63-vite) (the OS63 desktop dogfoods the engine via a workspace link). Don't hand-edit this mirror — changes are synced from the monorepo. Issues and PRs are welcome here; fixes land upstream.

```bash
pnpm install
pnpm -r build
pnpm -r test
```

## License

MIT
