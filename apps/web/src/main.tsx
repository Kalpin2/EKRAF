import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { applyTheme, useTheme } from './lib/theme';
import './index.css';

// Terapkan tema sebelum render, lalu sinkronkan setiap perubahan (persist di localStorage).
applyTheme(useTheme.getState().mode);
useTheme.subscribe((state) => applyTheme(state.mode));

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
