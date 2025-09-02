/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@octokit/rest']
  }
}

module.exports = nextConfig