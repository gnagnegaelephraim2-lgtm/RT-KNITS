/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Turbopack is default in Next.js 16 — WASM files served from /public/wasm/
  turbopack: {},
}

export default nextConfig
