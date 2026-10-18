import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App'

// Solo reporta en producción; el DSN llega por variable de entorno (Vercel), nunca en el código
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  environment: import.meta.env.MODE,
  // SDK v11 reemplazó sendDefaultPii por dataCollection: sin IP, usuario, cookies, headers ni bodies
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
  tracesSampleRate: 0.2,
})

createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
