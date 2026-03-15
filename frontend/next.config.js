/** @type {import('next').NextConfig} */
const path = require('path');
const os = require('os');

// Next.js always resolves distDir relative to the project root via path.join,
// so we compute a relative path that lands outside OneDrive where symlinks work.
const distDir = path.relative(__dirname, path.join(os.tmpdir(), 'chess-learning-next'));

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
let parsed;
try {
  parsed = new URL(apiUrl);
} catch {
  parsed = new URL('http://localhost:4000');
}

const nextConfig = {
  distDir,
  transpilePackages: ['chess.js'],
  images: {
    remotePatterns: [
      {
        protocol: parsed.protocol.replace(':', ''),
        hostname: parsed.hostname,
        port: parsed.port || '',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
