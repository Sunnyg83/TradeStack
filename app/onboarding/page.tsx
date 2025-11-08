'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import type { Trade } from '@/lib/types/database'

const TRADE_OPTIONS: { value: Trade; label: string }[] = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'power_washer', label: 'Power Washer' },
]

const DEFAULT_SERVICES: Record<Trade, Array<{ name: string; description: string; base_price: number }>> = {
  plumber: [
    { name: 'Emergency Repair', description: '24/7 emergency plumbing services', base_price: 150 },
    { name: 'Drain Cleaning', description: 'Professional drain cleaning and unclogging', base_price: 125 },
    { name: 'Water Heater Installation', description: 'New water heater installation', base_price: 800 },
    { name: 'Pipe Repair', description: 'Pipe leak detection and repair', base_price: 200 },
  ],
  electrician: [
    { name: 'Electrical Repair', description: 'Fix electrical issues and faults', base_price: 150 },
    { name: 'Panel Upgrade', description: 'Electrical panel upgrade service', base_price: 1200 },
    { name: 'Outlet Installation', description: 'New outlet and switch installation', base_price: 150 },
    { name: 'Lighting Installation', description: 'Interior and exterior lighting', base_price: 200 },
  ],
  hvac: [
    { name: 'AC Repair', description: 'Air conditioning repair and maintenance', base_price: 150 },
    { name: 'AC Installation', description: 'New AC unit installation', base_price: 3000 },
    { name: 'Heating Repair', description: 'Furnace and heating system repair', base_price: 150 },
    { name: 'Duct Cleaning', description: 'Professional duct cleaning service', base_price: 300 },
  ],
  power_washer: [
    { name: 'House Washing', description: 'Exterior house pressure washing', base_price: 300 },
    { name: 'Driveway Cleaning', description: 'Driveway and walkway cleaning', base_price: 150 },
    { name: 'Deck Cleaning', description: 'Deck and patio pressure washing', base_price: 200 },
    { name: 'Roof Cleaning', description: 'Roof cleaning and maintenance', base_price: 400 },
  ],
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    trade: '' as Trade | '',
    business_name: '',
    service_area: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          router.push('/dashboard')
        }
      }
    }
    checkProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const slug = generateSlug(formData.business_name)
      
      // Check if slug exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('slug')
        .eq('slug', slug)
        .single()

      let finalSlug = slug
      if (existing) {
        finalSlug = `${slug}-${Date.now()}`
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          user_id: user.id,
          trade: formData.trade,
          business_name: formData.business_name,
          service_area: formData.service_area,
          phone: formData.phone || null,
          email: formData.email || user.email || null,
          slug: finalSlug,
        })

      if (profileError) throw profileError

      // Create default services
      const services = DEFAULT_SERVICES[formData.trade as Trade]
      if (services) {
        const { error: servicesError } = await supabase
          .from('services')
          .insert(
            services.map((service) => ({
              user_id: user.id,
              name: service.name,
              description: service.description,
              base_price: service.base_price,
              unit: 'service',
              is_active: true,
            }))
          )

        if (servicesError) throw servicesError
      }

      // Create default settings
      const { error: settingsError } = await supabase
        .from('settings')
        .insert({
          user_id: user.id,
          ai_prompt_template: `You are a friendly ${formData.trade} professional. Write a warm, professional message to a lead who inquired about {service}. Be concise and ask about their timeline.`,
          email_from_name: formData.business_name,
        })

      if (settingsError) throw settingsError

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Dark Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                TradeStack
              </span>
            </Link>
            <h1 className="mb-2 text-3xl font-bold text-white">Complete Your Profile</h1>
            <p className="text-slate-300">Tell us about your business to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 p-8 shadow-xl">
            {error && (
              <div className="rounded-lg bg-red-950/30 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="trade" className="mb-2 block text-sm font-medium text-slate-300">
                Trade Type *
              </label>
              <select
                id="trade"
                value={formData.trade}
                onChange={(e) => setFormData({ ...formData, trade: e.target.value as Trade })}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Select your trade</option>
                {TRADE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="business_name" className="mb-2 block text-sm font-medium text-slate-300">
                Business Name *
              </label>
              <input
                id="business_name"
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="John's Plumbing"
              />
            </div>

            <div>
              <label htmlFor="service_area" className="mb-2 block text-sm font-medium text-slate-300">
                Service Area (City/ZIP) *
              </label>
              <input
                id="service_area"
                type="text"
                value={formData.service_area}
                onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="San Francisco, CA or 94102"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-300">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                Business Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="contact@business.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/50 hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

