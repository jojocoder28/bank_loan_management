import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent OpenTelemetry / Genkit packages from being bundled into
      // the Next.js build worker — they use require.extensions and dynamic
      // loaders that break static page collection.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        '@opentelemetry/exporter-jaeger',
        '@genkit-ai/firebase',
      ];
    }
    // Suppress the require.extensions webpack warning from handlebars/dotprompt
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /handlebars/ },
      { module: /dotprompt/ },
    ];
    return config;
  },
};

export default nextConfig;

