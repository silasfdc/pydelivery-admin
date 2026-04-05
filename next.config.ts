import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Only wrap with Sentry if the package is available AND DSN is set
let finalConfig = nextConfig;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  try {
    const { withSentryConfig } = require("@sentry/nextjs");
    finalConfig = withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    });
  } catch {
    // Sentry not installed or misconfigured — skip
  }
}

export default finalConfig;
