# resume

You just scaffolded a resume/CV project powered by the [`@atom63/resume`](https://www.npmjs.com/package/@atom63/resume) engine — a host-agnostic, paginated, print-ready document runtime for React. You write the document as MDX from a small set of layout primitives; the engine handles pagination, the paper styling, and Save-to-PDF.

A document is a single `.mdx` file. Two starters ship:

- **`src/resume.mdx`** — a two-column resume (sidebar + main).
- **`src/cv.mdx`** — a long-form, single-column CV (a flat record of entries).

The intended way to fill them: **describe your background to a coding agent and let it write the MDX**, then run the dev server and Save to PDF.

## 1. Scaffold

You've done this — you're reading the generated project's README.

## 2. Fill it with your agent

Point your coding agent (Claude Code, Cursor, …) at `src/resume.mdx` (and `src/cv.mdx`) and describe your background — roles, dates, accomplishments, links. The agent drafts the MDX using the primitive grammar below. You don't hand-write JSX; the MDX stays the source of truth. Replace the `Jane Doe` placeholders with your details.

## 3. Run + Save to PDF

```bash
npm install
npm run dev
```

Open the printed local URL — the project boots straight into the **viewer**: zoom, pan, and a **Save to PDF** button in the toolbar (it sets the print filename and triggers the browser's print-to-PDF). `npm run build` produces a static bundle.

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR            |
| `npm run build`     | Production build into `dist/`                 |
| `npm run preview`   | Preview the production build locally          |
| `npm run typecheck` | Run `tsc` against the app sources             |

## How it works

- **`src/resume.mdx` / `src/cv.mdx`** — your document, written from the primitives below.
- **`src/app.tsx`** — renders the compiled MDX through `<ResumeViewer Content={Resume} pdfFilename="Resume" pageSize="letter" />`.
- **`src/main.tsx`** — mounts the app and imports `./index.css`.
- **`src/index.css`** — a neutral page background + full-height root. The document's own type/ink styling (the `--doc-*` token system) ships inside `@atom63/resume/styles`; override any token in `index.css` to restyle.

## Customize

- **Paper size** — set the `pageSize` prop in `src/app.tsx` to `"letter"` (US, default) or `"a4"`. It drives pagination, the on-screen page, and the PDF.
- **Look** — override the `--doc-*` design tokens (ink, type, column layout) in `src/index.css`. The documented set is listed there.

## The primitive grammar

Every primitive comes from `@atom63/resume` and is available in MDX without an import — the viewer provides the component map. Use **only** these:

| Primitive          | What it does                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `<ResumeDocument>` | The outermost wrapper — paginates everything inside it into pages.           |
| `<Header>`         | The top band. Default is a sidebar\|main split; add `meta` for the meta grid. |
| `<HeaderLeft>`     | Left column of the header (typically your name + a `<Links>` block).         |
| `<HeaderRight>`    | Right column of the header (title, tagline, a `<Links>` block).              |
| `<Links>`          | A grouped run of contact / profile links.                                   |
| `<Columns>`        | The body grid. Wrap `<Sidebar>` + `<Main>`, or just `<Main>` for one column. |
| `<Sidebar>`        | The narrow left column (summary, skills, education).                        |
| `<Main>`           | The wide right column (experience, projects).                              |
| `<Section>`        | A labelled block — the `label` sits in the left meta column.                |
| `<Group>`          | Groups a heading + its lines into one unbreakable block (e.g. one job).      |
| `<Entry>`          | A record row: `year` / `role` meta on the left, linked title on the right. Use a flat sequence of `<Entry>` for long CV lists so pages break between them. |
| `<Rule>`           | A thin full-width divider (the CV uses one under the header band).           |
| `<Footer>`         | The bottom band (e.g. a copyright line).                                     |

Plain markdown inside these renders through the engine's styled prose: `#` → document title, `###` → section heading, `####` → subheading, paragraphs, `- ` bullet lists, `**bold**`, `_italic_`, and `[links](…)`.

## Switching to the CV

`src/app.tsx` renders `resume.mdx` by default. To render the CV instead, swap the import:

```tsx
import { ResumeViewer } from '@atom63/resume'
import '@atom63/resume/styles'
import Cv from './cv.mdx'

export function App() {
  return <ResumeViewer Content={Cv} pdfFilename="CV" />
}
```

## Limitations

- **Markdown tables render unstyled** — the resume engine ships no table styling. Use `<Entry>` rows or `<Section>` blocks for tabular content (year/role + title) instead of a `| … |` table.

## Optional: in-app editor

The main path is agent-authored MDX. If you want a GUI to edit the document live in the browser, `@atom63/resume/editor` ships a live MDX editor surface (it adds no new dependencies — it's inside `@atom63/resume`). The `mdxRawPlugin` already wired in `vite.config.ts` enables the `./resume.mdx?raw` import the editor reads from. See the [`@atom63/resume`](https://www.npmjs.com/package/@atom63/resume) docs for wiring `@atom63/resume/editor`.

## Learn more

- `@atom63/resume` on npm: <https://www.npmjs.com/package/@atom63/resume>
- Vite: <https://vite.dev>
- MDX: <https://mdxjs.com>
