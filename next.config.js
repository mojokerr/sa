/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable React 19 features
    reactCompiler: false,
    // Improve build performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Enable static optimization
  poweredByHeader: false,
  // Improve image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = nextConfig;
