import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Package styles first, then the document token overrides (index.css), then the
// playground chrome (playground.css) — cascade order matters.
import '@atom63/resume/styles'
import './index.css'
import './playground.css'
import { App } from './app'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
