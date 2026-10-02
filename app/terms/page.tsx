import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'

export const metadata = { title: 'Terms of Service — PostCraft AI', description: 'Terms and conditions for using PostCraft AI.' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: May 23, 2025</p>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing and using PostCraft AI (&ldquo;the Service&rdquo;), you accept and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Description of Service</h2>
            <p>PostCraft AI provides an AI-powered social media content generation tool that creates images, captions, and hashtags using third-party AI providers including Google Gemini. The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. User Responsibilities</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Generate content that is illegal, harmful, abusive, harassing, defamatory, or invasive of privacy</li>
              <li>Infringe any intellectual property rights of any party</li>
              <li>Generate misinformation, spam, or deceptive content</li>
              <li>Violate any applicable local, national, or international law</li>
              <li>Attempt to gain unauthorized access to our systems or circumvent usage limits through automated means</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Intellectual Property</h2>
            <p>Content you generate using PostCraft AI is owned by you. We claim no ownership over your generated output. However, you acknowledge that similar or identical outputs may be generated for other users, and we cannot guarantee uniqueness of AI-generated content.</p>
            <p className="mt-2">The PostCraft AI brand, logo, website design, and underlying software are owned by us and protected by intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Free Tier Limitations</h2>
            <p>The free tier of the Service is limited to 5 content generation sessions per day per user. We reserve the right to modify these limits at any time. Automated or programmatic abuse of the free tier is prohibited and may result in account suspension.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Paid Plans</h2>
            <p>Paid subscriptions are processed through our third-party payment provider. All fees are non-refundable except where required by applicable law. We reserve the right to modify pricing with 30 days&apos; notice to existing subscribers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT GENERATED CONTENT WILL MEET YOUR REQUIREMENTS. AI-GENERATED CONTENT MAY CONTAIN ERRORS OR INACCURACIES.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, POSTCRAFT AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Third-Party Services</h2>
            <p>The Service relies on third-party AI providers. Availability and quality of generated content depend on these external services. We are not responsible for outages, changes, or policy updates from these providers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Termination</h2>
            <p>We reserve the right to suspend or terminate your access to the Service at any time for violation of these Terms or for any other reason at our sole discretion. You may stop using the Service at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">11. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">12. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:legal@postcraft.ai" className="text-violet-600 underline">legal@postcraft.ai</a></p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}
