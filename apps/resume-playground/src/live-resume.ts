export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function ensureResumeDocument(source: string): string {
  if (source.includes('<ResumeDocument>')) return source

  const body = source.trim()
  if (body.includes('<Header') || body.includes('<Columns')) {
    return `<ResumeDocument>\n\n${body}\n\n</ResumeDocument>`
  }

  return `<ResumeDocument>\n\n<Columns>\n<Main>\n\n${body}\n\n</Main>\n</Columns>\n\n</ResumeDocument>`
}

export function readDraft(storage: StorageLike | undefined, key: string, fallback: string): string {
  try {
    return storage?.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

export function writeDraft(storage: StorageLike | undefined, key: string, next: string): void {
  try {
    storage?.setItem(key, next)
  } catch {
    // localStorage can be unavailable in private mode or embedded previews.
  }
}
