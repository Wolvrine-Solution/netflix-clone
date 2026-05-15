/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@netflix/ui', '@netflix/types', '@netflix/db'],
  images: {
    remotePatterns: [
      { hostname: 'image.tmdb.org' },
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'avatars.githubusercontent.com' },
    ],
  },
}

export default nextConfig
