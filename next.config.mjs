/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  webpack: (config) => {
    // better-sqlite3 has native bindings — let Next.js bundle them only on server.
    return config;
  },
};

export default nextConfig;
