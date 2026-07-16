/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@netflix/ui', '@netflix/types', '@netflix/db'],
  images: {
    remotePatterns: [{ hostname: 'image.tmdb.org' }],
  },
}

export default nextConfig
