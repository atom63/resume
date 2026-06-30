# @atom63/create-resume

**Step 1 of the agent workflow.** Scaffold a standalone resume/CV project powered by the [`@atom63/resume`](https://www.npmjs.com/package/@atom63/resume) engine — the project your coding agent then fills in.

The pitch: write your resume and CV as MDX and let a coding agent draft them. This CLI lays down the project; you point your agent at `src/resume.mdx` (and `src/cv.mdx`), describe your background, and it writes the document from a small set of layout primitives. Run the dev server and **Save to PDF** from the viewer toolbar.

```bash
npm create @atom63/resume@latest my-resume
# or
pnpm create @atom63/resume my-resume
```

Then:

```bash
cd my-resume
npm install
npm run dev
```

From here the loop is: describe your background to your coding agent → it drafts `src/resume.mdx` / `src/cv.mdx` → `npm run dev` and Save to PDF. The freshly-scaffolded project's own README documents the primitive grammar and how to switch the viewer to the CV.

## Options

```
npm create @atom63/resume <project-name> -- [options]

  --pm npm|pnpm|yarn       Package manager for install + instructions (default: npm)
  --install / --no-install Install dependencies after scaffolding
  --git / --no-git         Initialize a git repository
  -h, --help               Show help
```

The generated project depends only on the published `@atom63/resume` package — no private workspace packages, no host design system, and no Tailwind. Edit `src/resume.mdx` and go.
