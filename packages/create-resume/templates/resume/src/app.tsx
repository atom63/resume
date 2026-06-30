import { ResumeViewer } from '@atom63/resume'
import '@atom63/resume/styles'
import Resume from './resume.mdx'

// Present-first: the project boots straight into the resume viewer — zoom, pan,
// and Save to PDF from its toolbar. To render the long-form CV instead, swap the
// import for `./cv.mdx` (and adjust pdfFilename). See the README for the optional
// in-app live editor.
export function App() {
  return <ResumeViewer Content={Resume} pdfFilename="Resume" />
}
