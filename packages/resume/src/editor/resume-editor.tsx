// packages/resume/src/editor/resume-editor.tsx
import type { ComponentType } from 'react'
import { resumeMdxComponents } from '../document/components'
import './editor.css'
import { MdxLivePreview } from './mdx-live-preview'

// The pagination engine activates via the <ResumeDocument> wrapper. If an edited
// draft drops it, wrap the whole document so the live preview still paginates
// (instead of rendering as an unpaginated flow with no page background).
function ensureResumeDocument(source: string): string {
  return source.includes('<ResumeDocument>')
    ? source
    : `<ResumeDocument>\n\n${source.trim()}\n\n</ResumeDocument>`
}

export interface ResumeEditorProps {
  /** Current MDX source. */
  source: string
  /** Called when the user edits the source. */
  onChange: (next: string) => void
  /** Compile-error callback. */
  onError?: (error: Error) => void
  /** Optional reset handler (host decides what reset means). */
  onReset?: () => void
  /** Override the MDX component map; defaults to resumeMdxComponents. */
  components?: Record<string, ComponentType<unknown>>
}

/**
 * Host-agnostic, controlled split-pane MDX editor for resumes: a source
 * textarea on the left and a live, paginated preview on the right. Carries no
 * OS63 chrome — the host owns the surrounding shell.
 */
export function ResumeEditor({ source, onChange, onError, components }: ResumeEditorProps) {
  const map = components ?? (resumeMdxComponents as Record<string, ComponentType<unknown>>)

  return (
    <div className="resume-editor">
      <div className="resume-editor-pane">
        <textarea
          className="resume-editor-source"
          value={source}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          aria-label="Resume MDX source"
        />
      </div>
      <div className="resume-editor-pane resume-editor-preview">
        <MdxLivePreview
          source={ensureResumeDocument(source)}
          components={map}
          onError={onError ? e => onError(e ?? new Error('MDX compile error')) : undefined}
        />
      </div>
    </div>
  )
}
