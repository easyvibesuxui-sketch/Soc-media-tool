'use client'

import { useState } from 'react'
import { Mail, MessageSquare, HelpCircle, Send, CheckCircle } from 'lucide-react'
import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: 'General', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production: POST to a form handling API (Formspree, Resend, etc.)
    // For now, simulate submission
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      <section className="bg-gradient-to-br from-violet-50 to-fuchsia-50 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-500 text-lg">Got a question, feedback, or partnership idea? We&apos;d love to hear from you.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Mail, title: 'Email', desc: 'hello@postcraft.ai', sub: 'We reply within 24 hours', color: 'bg-violet-100 text-violet-600' },
              { icon: HelpCircle, title: 'Support', desc: 'support@postcraft.ai', sub: 'Technical issues & bugs', color: 'bg-fuchsia-100 text-fuchsia-600' },
              { icon: MessageSquare, title: 'Press', desc: 'press@postcraft.ai', sub: 'Media inquiries', color: 'bg-pink-100 text-pink-600' },
            ].map(({ icon: Icon, title, desc, sub, color }) => (
              <div key={title} className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
                  <Icon size={18} />
                </div>
                <p className="font-bold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-violet-600 mt-0.5">{desc}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Contact form */}
          {sent ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h3>
              <p className="text-gray-500 text-sm">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    <option>General</option>
                    <option>Technical Support</option>
                    <option>Billing</option>
                    <option>Feature Request</option>
                    <option>Partnership</option>
                    <option>Press / Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md"
                >
                  <Send size={14} />
                  Send Message
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
