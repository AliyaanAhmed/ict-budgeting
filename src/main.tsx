import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initCycleContext } from './services/cycleService'
import { initDgeRoleContext } from './services/dgeRoleContextService'
import { initInstanceContext } from './services/instanceService'
import { initUserContext } from './services/userContextService'

initUserContext()
  .then(() => initDgeRoleContext(sessionStorage.getItem('userID')))
  .then(() => initCycleContext())
  .then(() => initInstanceContext())
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
