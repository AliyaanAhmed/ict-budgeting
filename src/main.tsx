import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'
import App from './App.tsx'
import { initUserContext } from './services/userContextService'
import { initCycleContext } from './services/cycleService'
import { initInstanceContext } from './services/instanceService'
import { initDgeRoleContext } from './services/dgeRoleContextService'

// Boot sequence: user → teams+accounts → cycles → instance → render
initUserContext()
  .then(() => initCycleContext())
  .then(() => initInstanceContext())
  .then(() => initDgeRoleContext(sessionStorage.getItem('userID')))
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
