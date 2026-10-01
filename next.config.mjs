/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `images.remotePatterns` on purpose: this app never renders
  // <Image> from a remote host — generated images arrive as base64
  // data URLs from our own API routes. Leaving remotePatterns empty
  // keeps the Next Image Optimizer closed to external URLs.
  reactStrictMode: true,
}

export default nextConfig
