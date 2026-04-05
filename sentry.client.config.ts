import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Session replay (captures user interactions on errors)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Debug in development
  debug: process.env.NODE_ENV !== 'production',
});
