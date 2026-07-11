import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './context/AppContext.tsx';
import { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import { SocketProvider } from './context/SocketContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="874664685754-qij8j64gbmhqkpikvjjadi79cm1bpisv.apps.googleusercontent.com">
      <Toaster/>
      <AppProvider>
        <SocketProvider>

          <App />
        </SocketProvider>
      </AppProvider>  
    </GoogleOAuthProvider>
  </StrictMode>,
)
 