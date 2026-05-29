/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Impede que a página seja carregada em iframes (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Impede MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Força HTTPS por 1 ano
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Limita referrer em navegação cross-origin
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Desativa features desnecessárias
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // CSP: permite scripts do próprio domínio + NextAuth
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
module.exports = nextConfig;
