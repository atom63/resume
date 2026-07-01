# resume-playground

A standalone, deployable live playground for [`@atom63/resume`](../../packages/resume): edit your resume/CV as MDX in the browser (by hand or with any LLM / coding agent), preview the paginated pages, and export a print-ready, ATS-friendly PDF. Drafts persist to `localStorage`.

## Why this is separate from `resume-starter`

- **`apps/resume-starter`** is the monorepo **dev harness** — it links `@atom63/resume` via `workspace:*` and hot-reloads the package source. It's a workspace member.
- **`apps/resume-playground`** (this app) is the **deploy artifact** — it pins the **published** `@atom63/resume` from npm, is **excluded from the workspace** (see the `!apps/resume-playground` line in the root `pnpm-workspace.yaml`), and is synced into the public mirror by `scripts/release-resume-public.sh`. So it never adds a build to the monorepo/CI, and Vercel builds it straight from npm with no build-order coupling.

## Run it locally

Because it's excluded from the workspace, install it in isolation:

```bash
cd apps/resume-playground
pnpm install --ignore-workspace
pnpm dev
```

## Deploy (Vercel, from the mirror)

Point a Vercel project at the **mirror repo** (github.com/atom63/resume) with:

- **Root Directory:** `apps/resume-playground`
- Install / build / output are declared in `vercel.json` (`pnpm install --ignore-workspace`, `pnpm build`, `dist`).

No monorepo access and no build-order gotcha — it resolves `@atom63/resume` from public npm.
