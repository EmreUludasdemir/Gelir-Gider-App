/** @type {import('next').NextConfig} */
const standaloneBuild = process.env.NEXT_BUILD_STANDALONE === 'true'
const analyzeBuild = process.env.ANALYZE === 'true'
const trimTrailingSlash = (value) => (value.endsWith('/') ? value.slice(0, -1) : value)
const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value)

const resolveInternalApiUrl = () => {
  const internalApiUrl = process.env.INTERNAL_API_URL
  if (internalApiUrl) {
    return trimTrailingSlash(internalApiUrl)
  }

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL
  if (publicApiUrl && isAbsoluteUrl(publicApiUrl)) {
    return trimTrailingSlash(publicApiUrl)
  }

  return 'http://localhost:3001'
}

const nextConfig = {
  reactStrictMode: true,
  output: standaloneBuild ? 'standalone' : undefined,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${resolveInternalApiUrl()}/:path*`,
      },
    ]
  },
}

module.exports = analyzeBuild
  ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
  : nextConfig
