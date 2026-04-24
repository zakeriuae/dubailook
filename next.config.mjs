/** @type {import('next').NextConfig} */
// Deploy trigger: 2026-04-24 domain update
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
