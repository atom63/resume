import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import the package styles FIRST, then index.css — so your token overrides in
// index.css win the cascade over the package defaults.
import '@atom63/resume/styles'
import './index.css'
import { App } from './app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
