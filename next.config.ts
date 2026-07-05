import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Next.js 15 — keep problematic packages out of the server bundle entirely.
  // genkit / opentelemetry use require.extensions and missing optional deps
  // that crash the static page collection worker.
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/googleai',
    '@genkit-ai/firebase',
    'dotprompt',
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-jaeger',
    'handlebars',
  ],
  webpack: (config) => {
    // Suppress residual require.extensions warnings from handlebars/dotprompt
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /handlebars/ },
      { module: /dotprompt/ },
      { module: /opentelemetry/ },
    ];
    return config;
  },
};

export default nextConfig;
