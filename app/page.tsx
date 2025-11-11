'use client'

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How quickly can I get started?",
      answer: "You can set up your TradeStack account in just 5 minutes. Simply sign up, complete the onboarding, and start managing your leads immediately."
    },
    {
      question: "Do I need a credit card to start?",
      answer: "No credit card required! TradeStack offers a free forever plan so you can start managing your business right away."
    },
    {
      question: "Can I integrate with my existing tools?",
      answer: "Yes! TradeStack integrates seamlessly with popular tools and platforms. Our API also allows for custom integrations."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Dark Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.08),transparent_70%)]"></div>
        
        {/* Floating gradient orbs - Blue only */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-sky-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-blue-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                TradeStack
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-blue-400 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-blue-400 font-medium transition-colors">How it works</a>
              <a href="#faq" className="text-slate-300 hover:text-blue-400 font-medium transition-colors">FAQs</a>
            </nav>

            {/* CTA Button */}
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up">
                Stop losing leads.
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent mt-2">
                  Start closing more deals.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 leading-relaxed mb-8 animate-fade-in-up animation-delay-200 max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                Manage every lead in one place. Get AI-powered follow-up messages. Turn inquiries into customers faster.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-400">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-xl shadow-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-105"
                >
                  Start Free — No Credit Card
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-400 animate-fade-in animation-delay-600">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Free forever plan available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right - Dashboard Preview */}
            <div className="relative animate-fade-in animation-delay-500">
              <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-500/30 p-4 ring-1 ring-blue-500/20">
                <div className="bg-slate-900 rounded-lg p-6 border border-blue-500/10">
                  <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-blue-500/40 rounded w-3/4"></div>
                    <div className="h-4 bg-cyan-500/40 rounded w-full"></div>
                    <div className="h-4 bg-blue-400/40 rounded w-5/6"></div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="h-20 bg-gradient-to-br from-blue-600/30 to-blue-500/20 rounded border border-blue-500/20"></div>
                      <div className="h-20 bg-gradient-to-br from-cyan-600/30 to-cyan-500/20 rounded border border-cyan-500/20"></div>
                      <div className="h-20 bg-gradient-to-br from-blue-500/30 to-cyan-500/20 rounded border border-blue-500/20"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-500 rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Removed stats band to restore original landing layout */}

      {/* Problem/Solution Section */}
      <section className="relative py-24 border-t border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                You're losing money on every lead you forget to follow up with
              </h2>
              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                Most trade businesses lose 30-40% of potential revenue because they can't keep track of leads. Between phone calls, emails, and quotes, it's easy to let opportunities slip through the cracks.
              </p>
              <p className="text-xl text-slate-300 leading-relaxed">
                TradeStack puts every lead in one place. You see who needs follow-up, when, and AI helps you send the right message at the right time.
              </p>
            </div>
            <div className="relative">
              <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/20 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-red-950/30 border border-red-500/20 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-400 text-xl">✗</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Sarah's Plumbing Inquiry</div>
                      <div className="text-slate-400 text-sm">No follow-up for 3 days</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 text-xl">✓</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Mike's HVAC Request</div>
                      <div className="text-slate-400 text-sm">Followed up within 1 hour</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section id="features" className="relative py-24 bg-slate-900/40 backdrop-blur-sm border-y border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Three ways TradeStack helps you close more deals
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                benefit: 'Never miss a follow-up again',
                description: 'Every lead gets tracked automatically. You see who needs attention, when they last heard from you, and what they\'re interested in. No more sticky notes or forgotten calls.',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )
              },
              {
                benefit: 'AI writes your follow-up messages',
                description: 'Stop spending 20 minutes crafting each email. Our AI generates personalized messages based on what the lead asked about. You review, send, and move on.',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )
              },
              {
                benefit: 'Turn your website into a lead machine',
                description: 'Get a public page that customers can use to request quotes. Leads come straight into your dashboard, and you get notified immediately.',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-slate-800/60 backdrop-blur-xl rounded-xl p-8 border border-blue-500/20 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all hover:-translate-y-1"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                
                <div className="relative w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 relative">{feature.benefit}</h3>
                <p className="text-slate-300 leading-relaxed relative">{feature.description}</p>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Get set up in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Sign up and create your profile',
                description: 'Tell us about your business, services, and pricing. Takes about 5 minutes.'
              },
              {
                step: '2',
                title: 'Share your public page',
                description: 'Get a custom URL to share with customers. They can request quotes directly, and leads appear in your dashboard instantly.'
              },
              {
                step: '3',
                title: 'Manage leads and follow up',
                description: 'See all your leads in one place. Use AI to generate follow-up messages. Close more deals with less work.'
              }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-8 border border-blue-500/20 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xl mb-6 shadow-lg shadow-blue-500/50">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Start free. Upgrade when you're ready to scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-8 border-2 border-slate-700/50 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">Perfect for getting started</p>
              <Link
                href="/signup"
                className="block w-full text-center py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-3">
                {['Up to 50 leads/month', 'AI-powered CRM', 'Service management', 'Public page', 'Basic analytics', 'Email support'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Standard Plan - Highlighted */}
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-xl p-8 border-2 border-blue-500 shadow-2xl shadow-blue-500/30 relative scale-105 ring-2 ring-blue-500/20">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Standard</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">For growing businesses</p>
              <Link
                href="/signup"
                className="block w-full text-center py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50 mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-3">
                {['Unlimited leads', 'AI-powered CRM', 'Service management', 'Public page', 'Advanced analytics', 'AI message generation', 'Priority support', 'Custom branding'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-200">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-8 border-2 border-slate-700/50 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$99</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">For teams and agencies</p>
              <Link
                href="/signup"
                className="block w-full text-center py-3 px-6 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-3">
                {['Everything in Standard', 'Multi-user access', 'API access', 'Custom integrations', 'Dedicated support', 'Advanced reporting'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="relative py-24 bg-slate-900/40 backdrop-blur-sm border-y border-blue-500/20">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-blue-500/20 shadow-xl overflow-hidden hover:border-blue-500/40 transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
                >
                  <span className="font-semibold text-white text-lg">{faq.question}</span>
                  <span className={`text-2xl text-blue-400 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-slate-300 leading-relaxed animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to stop losing leads?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Start managing your leads better today. Sign up free, no credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-xl shadow-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-105"
          >
            Start Free Today
            <span className="ml-2">→</span>
          </Link>
          <p className="mt-4 text-sm text-slate-400">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-blue-500/20 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="text-xl font-bold text-white">TradeStack</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-powered CRM for trade businesses
              </p>
            </div>

            {/* Menu */}
            <div>
              <h4 className="text-white font-semibold mb-4">Menu</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How it works</a></li>
                <li><a href="#faq" className="hover:text-blue-400 transition-colors">FAQs</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-slate-400 mb-4">Get tips and updates delivered to your inbox</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2024 TradeStack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
