# Changelog

All notable changes to `@atom63/resume`. Versions are `0.x` — the API may shift before `1.0`.

## 0.2.1

Standalone-rendering fixes. If you saw oversized, off-center pages or loose
spacing in a non-OS63 app, this release corrects it. **The fixes change how the
document renders — re-check your layout after upgrading.**

- **Fix: pages rendered too wide / off-center.** The page frames assumed a global
  `box-sizing: border-box` reset; the package now ships its own (scoped to the
  document), so pages are the correct paper size and stay centered.
- **Fix: loose vertical spacing.** User-agent margins on headings/paragraphs/lists
  were adding to the layout's flex gaps. The package now resets them (scoped).
- **Fix: token overrides could be ignored.** Components self-imported the CSS,
  re-injecting it after a consumer's overrides. Styles now ship only via the
  `@atom63/resume/styles` entry — **import it once in your app** — so your
  `--doc-*` overrides reliably win.
- **Fix: phantom horizontal scrollbar.** The hidden measuring layer was pushed
  far off-screen, inflating the scroll area; it's now clipped to 0×0.
- **Font follows the host app** by default (`font-family: var(--doc-font, inherit)`)
  instead of the browser default. Set `--doc-font` to choose a specific stack; the
  `create-resume` scaffold sets a clean sans stack in its `index.css`.
- Viewer chrome polish (primary Save-to-PDF, segmented zoom controls).

## 0.2.0

- **`pageSize` prop** (`'letter' | 'a4'`, default `'letter'`) on `ResumeViewer`
  and via `ResumePageSizeContext`. Drives pagination, the on-screen page, and the
  `@page` print size. New exports: `getPageGeometry`, `PageSize`, `PageGeometry`.
- Removed the unwired `--paper-*` tokens (page size is the prop now; `--doc-*`
  remains the styling vocabulary).

## 0.1.0

- Initial release: paginated MDX resume/CV engine, `ResumeViewer`, the MDX
  primitives, `packIntoPages`, the `--doc-*` token system, and the optional
  `./editor` and `./vite` subexports.
