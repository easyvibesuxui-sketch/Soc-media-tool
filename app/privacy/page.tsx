import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'

export const metadata = { title: 'Privacy Policy — PostCraft AI', description: 'How PostCraft AI collects, uses and protects your personal information.' }

export default function PrivacyPage() {
  const updated = 'May 23, 2025'
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {updated}</p>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Introduction</h2>
            <p>Welcome to PostCraft AI (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our content-generation service.</p>
            <p className="mt-2">Please read this policy carefully. If you disagree with its terms, please discontinue use of the site.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Information We Collect</h2>
            <p><strong>Information you provide directly:</strong> When you use PostCraft AI, you may provide topic descriptions, selected preferences (platform, tone, language) and optionally create an account. We do not require personal information to use the free tier of the tool.</p>
            <p className="mt-2"><strong>Automatically collected information:</strong> We may collect standard web analytics data such as IP addresses, browser type, operating system, referring URLs, and pages visited. This data is collected in aggregate and is not linked to individual identities.</p>
            <p className="mt-2"><strong>Cookies:</strong> We use essential cookies to ensure the site functions correctly, and analytics cookies (with your consent) to understand usage patterns. You can opt out of non-essential cookies at any time via your browser settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide, operate and maintain our services</li>
              <li>Process your content generation requests via third-party AI APIs (Google Gemini, Pollinations.ai)</li>
              <li>Improve, personalize and expand our services</li>
              <li>Understand and analyze how you use our platform</li>
              <li>Communicate with you, if you have provided contact information</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Third-Party AI Services</h2>
            <p>PostCraft AI uses the following third-party services to generate content:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Google Gemini API</strong> — used for text generation (captions, hashtags, image prompts) and image generation. Subject to <a href="https://policies.google.com/privacy" className="text-violet-600 underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.</li>
              <li><strong>Pollinations.ai</strong> — used as a fallback image generation service. Content sent is subject to their terms.</li>
              <li><strong>Groq</strong> — optional AI text model provider. Subject to <a href="https://groq.com/privacy-policy/" className="text-violet-600 underline" target="_blank" rel="noopener noreferrer">Groq&apos;s Privacy Policy</a>.</li>
            </ul>
            <p className="mt-2">Your topic inputs may be transmitted to these services. We recommend not including personally identifiable or sensitive information in your topic descriptions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Data Retention</h2>
            <p>We do not persistently store your generated content, images, captions or hashtags. Content generation requests are transient — processed and returned to your browser without being saved to our servers. If you create an account, your account metadata (email, usage counts) is stored for the duration of your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Advertising</h2>
            <p>We may display advertisements provided by Google AdSense. Google may use cookies and web beacons to collect information about your browsing activity in order to serve relevant ads. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-violet-600 underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. For more information, please review <a href="https://policies.google.com/privacy" className="text-violet-600 underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Your Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>The right to access personal data we hold about you</li>
              <li>The right to request correction of inaccurate data</li>
              <li>The right to request deletion of your data</li>
              <li>The right to object to or restrict processing</li>
              <li>The right to data portability</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Children&apos;s Privacy</h2>
            <p>PostCraft AI is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the &ldquo;Last updated&rdquo; date at the top of this page. Continued use of the service after changes constitutes your acceptance of the revised policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Contact Us</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
            <p className="mt-2"><strong>PostCraft AI</strong><br />Email: <a href="mailto:privacy@postcraft.ai" className="text-violet-600 underline">privacy@postcraft.ai</a></p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}
