import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fontes guardadas dentro do app (nada é baixado de servidores de terceiros)
import '@fontsource/lato/700.css'
import '@fontsource/cabin/500.css'
import '@fontsource/habibi/400.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
