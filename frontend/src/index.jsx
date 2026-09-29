import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { LanguageProvider } from './context/LanguageContext';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);