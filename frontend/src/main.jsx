import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element')
}

console.log('🚀 Starting Spiro App...')
console.log('Environment:', process.env.NODE_ENV)

// Create root and render app
const root = ReactDOM.createRoot(rootElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Only register service worker in production
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered successfully')
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error)
      })
  })
} else {
  console.log('📱 PWA disabled in development mode')
}