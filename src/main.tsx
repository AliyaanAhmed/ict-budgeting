import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initUserContext } from './services/userContextService'
import { initCycleContext } from './services/cycleService'
import { initInstanceContext } from './services/instanceService'

// Boot sequence: user → teams+accounts → cycles → instance → render
initUserContext()
  .then(() => initCycleContext())
  .then(() => initInstanceContext())
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
