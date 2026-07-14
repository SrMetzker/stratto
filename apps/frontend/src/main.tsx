import React from 'react'
import App from './App'
import './index.css'
import { createRoot } from 'react-dom/client';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import { authClient } from '../lib/auth';


createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NeonAuthUIProvider emailOTP authClient={authClient}>
        <App />
    </NeonAuthUIProvider>
  </React.StrictMode>,
)
