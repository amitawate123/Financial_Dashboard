import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { getStoredTheme, applyTheme } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

applyTheme(getStoredTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
