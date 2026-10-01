import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://postcraft.ai'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep private/functional routes out of the index.
        disallow: ['/api/', '/auth/'],
      },
      // Google AdSense crawler needs full access to review the site.
      { userAgent: 'Mediapartners-Google', allow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
