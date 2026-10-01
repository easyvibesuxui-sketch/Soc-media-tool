// ESLint 9 flat config. Next 16 removed `next lint`, so the lint script runs
// `eslint` directly. eslint-config-next 16 ships a native flat config, so it
// is imported straight in — no FlatCompat shim needed.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  {
    ignores: [
      '.next/**',
      '.open-next/**',   // Cloudflare/OpenNext build output
      '.wrangler/**',
      'node_modules/**',
      '_unused-components/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
]

export default config
