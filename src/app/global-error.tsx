'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ 
        background: '#0a0a1a', 
        color: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Algo salió mal</h2>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
            El error fue reportado automáticamente a nuestro equipo.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#7c3aed',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
