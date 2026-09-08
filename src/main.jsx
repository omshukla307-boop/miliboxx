import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

// Apply initial theme class BEFORE first render to prevent flash
const savedTheme = localStorage.getItem('millibox_theme') ?? 'dark';
document.documentElement.classList.add(
  savedTheme === 'light' ? 'light-mode' : savedTheme === 'hybrid' ? 'hybrid-mode' : 'dark-mode'
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);