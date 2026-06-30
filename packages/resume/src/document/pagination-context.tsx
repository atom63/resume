// packages/resume/src/document/pagination-context.tsx
import { createContext, useContext } from 'react'
import type { PageSize } from '../geometry'

/** PaginatedResume reports its computed page count up to the host (ResumeViewer). */
export const PaginationReportContext = createContext<((pageCount: number) => void) | null>(null)

export function usePaginationReport(): (pageCount: number) => void {
  const report = useContext(PaginationReportContext)
  return report ?? (() => {})
}

/** Optional font-family hint — changes trigger re-measure/re-pagination. */
export const ResumeFontFamilyContext = createContext<string | undefined>(undefined)
export const useResumeFontFamily = () => useContext(ResumeFontFamilyContext)

/** Page size for the document — a change re-measures/re-paginates. */
export const ResumePageSizeContext = createContext<PageSize>('letter')
export const useResumePageSize = () => useContext(ResumePageSizeContext)
