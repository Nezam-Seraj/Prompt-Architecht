
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Remove the initial loader once React is ready to mount
const removeLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical Failure: Root element not found.");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  removeLoader();
} catch (err) {
  console.error("Initialization Error:", err);
  // Show a basic error message if React fails to mount
  rootElement.innerHTML = `
    <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; color: #ff4444; font-family: monospace; padding: 20px; text-align: center;">
      <div>
        <h1 style="font-size: 24px;">SYSTEM CRASH</h1>
        <p style="opacity: 0.7;">Check browser console for neural dump.</p>
        <pre style="background: #111; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 12px; color: #fff;">${err instanceof Error ? err.message : String(err)}</pre>
      </div>
    </div>
  `;
  removeLoader();
}
