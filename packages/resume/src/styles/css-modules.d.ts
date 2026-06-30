// Ambient declaration for side-effect CSS imports (e.g. `import '../styles/document.css'`).
// Required because the base tsconfig sets `noUncheckedSideEffectImports: true`, which
// rejects untyped side-effect imports. CSS imports carry no runtime value here — the
// bundler injects the stylesheet — so the module is declared with no exports.
declare module '*.css' {}
