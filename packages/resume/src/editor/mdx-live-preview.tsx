// packages/resume/src/editor/mdx-live-preview.tsx
//
// Vendored from @atom63/mdx's MdxLivePreview (+ its useMdxRuntime helper),
// with all @atom63/* imports stripped. Depends only on react, @mdx-js/mdx,
// and @mdx-js/react — all already declared as resume package dependencies.
import { MDXProvider } from '@mdx-js/react'
import type { ComponentType, ReactNode } from 'react'
import { Component as ReactComponent, useEffect, useRef, useState } from 'react'

type MdxComponent = ComponentType<{ components?: Record<string, unknown> }>

// biome-ignore lint/suspicious/noExplicitAny: @mdx-js/mdx evaluate is loaded dynamically
let evaluatePromise: Promise<any> | null = null
function loadEvaluate() {
  if (!evaluatePromise) {
    evaluatePromise = import('@mdx-js/mdx').then(m => m.evaluate)
  }
  return evaluatePromise
}

/**
 * Compile an MDX string to a React component at runtime. Lazy-loads the MDX
 * compiler so it never enters the base bundle. The returned component renders
 * inside an `<MDXProvider>` (or accepts a `components` prop) for scope.
 */
async function compileMdx(source: string): Promise<MdxComponent> {
  const [evaluate, runtime, mdxReact] = await Promise.all([
    loadEvaluate(),
    import('react/jsx-runtime'),
    import('@mdx-js/react'),
  ])
  const mod = await evaluate(source, {
    ...(runtime as Record<string, unknown>),
    useMDXComponents: mdxReact.useMDXComponents,
    baseUrl: import.meta.url,
  })
  return mod.default as MdxComponent
}

interface MdxRuntimeResult {
  Component: MdxComponent | null
  error: Error | null
  status: 'idle' | 'compiling' | 'ready' | 'error'
}

/**
 * Debounced runtime compile of an MDX string. Keeps the last successfully
 * compiled component while compiling and on error, so a transient typo never
 * blanks the preview.
 */
function useMdxRuntime(source: string, debounceMs = 300): MdxRuntimeResult {
  const [state, setState] = useState<MdxRuntimeResult>({
    Component: null,
    error: null,
    status: 'idle',
  })
  const lastGood = useRef<MdxComponent | null>(null)
  const reqId = useRef(0)

  useEffect(() => {
    const trimmed = source.trim()
    if (!trimmed) {
      setState({ Component: null, error: null, status: 'idle' })
      return
    }
    const id = ++reqId.current
    setState(s => ({ ...s, status: 'compiling' }))
    const timer = setTimeout(() => {
      compileMdx(trimmed)
        .then(Component => {
          if (id !== reqId.current) return
          lastGood.current = Component
          setState({ Component, error: null, status: 'ready' })
        })
        .catch((e: unknown) => {
          if (id !== reqId.current) return
          setState({
            Component: lastGood.current,
            error: e instanceof Error ? e : new Error(String(e)),
            status: 'error',
          })
        })
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [source, debounceMs])

  return state
}

class MdxErrorBoundary extends ReactComponent<
  { children: ReactNode; resetKey: string; fallback: (e: Error) => ReactNode },
  { err: Error | null }
> {
  state: { err: Error | null } = { err: null }
  static getDerivedStateFromError(err: Error) {
    return { err }
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.err) {
      this.setState({ err: null })
    }
  }
  render() {
    return this.state.err ? this.props.fallback(this.state.err) : this.props.children
  }
}

export interface MdxLivePreviewProps {
  source: string
  components: Record<string, unknown>
  onError?: (error: Error | null) => void
}

/**
 * Renders runtime-compiled MDX inside the given component scope, isolating
 * runtime throws in an error boundary. Compile errors are surfaced via onError
 * while the last good render stays on screen.
 */
export function MdxLivePreview({ source, components, onError }: MdxLivePreviewProps) {
  const { Component, error } = useMdxRuntime(source)

  // biome-ignore lint/correctness/useExhaustiveDependencies: onError is a stable callback from the host
  useEffect(() => {
    onError?.(error)
  }, [error])

  if (!Component) {
    return <div className="resume-mdx-live-empty">Start typing MDX…</div>
  }

  return (
    <MdxErrorBoundary
      fallback={e => <div className="resume-mdx-live-error">Runtime error: {e.message}</div>}
      resetKey={source}
    >
      <MDXProvider components={components as Record<string, ComponentType>}>
        <Component />
      </MDXProvider>
    </MdxErrorBoundary>
  )
}
