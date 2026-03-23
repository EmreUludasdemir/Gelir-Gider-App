/** @type {import('next').NextConfig} */
const standaloneBuild = process.env.NEXT_BUILD_STANDALONE === 'true'
const analyzeBuild = process.env.ANALYZE === 'true'

const nextConfig = {
  reactStrictMode: true,
  output: standaloneBuild ? 'standalone' : undefined,
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const destination =
      apiUrl && /^https?:\/\//i.test(apiUrl) ? apiUrl : 'http://api:3001'
    return [
      {
        source: '/api/:path*',
        destination: `${destination}/:path*`,
      },
    ]
  },
}

module.exports = analyzeBuild
  ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
  : nextConfig
