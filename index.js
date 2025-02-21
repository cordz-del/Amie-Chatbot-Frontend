import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';

import './index.css';
import App from './App';
import { store } from './store';
import theme from './theme';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize performance monitoring
const reportPerformance = (metric) => {
  // You can send metrics to your analytics service here
  console.log(metric);
};

// Get the root element
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <HelmetProvider>
            <ThemeProvider theme={theme}>
              {/* CssBaseline normalizes styles across browsers */}
              <CssBaseline />
              <App />
            </ThemeProvider>
          </HelmetProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Performance monitoring
reportWebVitals(reportPerformance);

// Hot Module Replacement (HMR)
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <Provider store={store}>
            <BrowserRouter>
              <HelmetProvider>
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <NextApp />
                </ThemeProvider>
              </HelmetProvider>
            </BrowserRouter>
          </Provider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
}

// Remove loading spinner
const loadingSpinner = document.getElementById('loading-spinner');
if (loadingSpinner) {
  loadingSpinner.remove();
}

// Add error handling for unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // You can add error reporting service here
});

// Add error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  // You can add error reporting service here
});
