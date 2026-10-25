const isExport = process.env.NEXT_EXPORT === '1'
const basePath = process.env.BASE_PATH || '/orb.me'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? {
        output: 'export',
        basePath,
        assetPrefix: basePath,
        trailingSlash: true,
      }
    : {
        // Local/dev: same-origin proxy avoids CORS to the live PHP API
        async rewrites() {
          const live = 'https://cgiterate.com/orb.me/api'
          return [
            { source: '/api/artists.php', destination: `${live}/artists.php` },
            { source: '/api/markers.php', destination: `${live}/markers.php` },
            { source: '/api/vote.php', destination: `${live}/vote.php` },
            { source: '/api/signup.php', destination: `${live}/signup.php` },
            { source: '/api/recommend.php', destination: `${live}/recommend.php` },
            { source: '/api/admin.php', destination: `${live}/admin.php` },
          ]
        },
      }),
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: isExport ? basePath : '',
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || '',
  },
}

export default nextConfig
