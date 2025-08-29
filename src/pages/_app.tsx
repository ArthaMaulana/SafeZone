import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Inject popup styles
    const style = document.createElement('style');
    style.textContent = `
      .modern-popup .leaflet-popup-content-wrapper {
        background: transparent !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .modern-popup .leaflet-popup-content {
        margin: 0 !important;
        padding: 0 !important;
        width: auto !important;
        min-height: auto !important;
      }

      .modern-popup .leaflet-popup-tip-container {
        display: none !important;
      }

      .modern-popup .leaflet-popup-close-button {
        display: none !important;
      }

      .modern-popup {
        animation: popupFadeIn 0.3s ease-out;
      }

      @keyframes popupFadeIn {
        0% {
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .modern-popup button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }

      .modern-popup * {
        transition: all 0.2s ease !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
