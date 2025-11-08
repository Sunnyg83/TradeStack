'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/lib/types/database'

export default function QuoteForm({
  userId,
  services,
}: {
  userId: string
  services: Service[]
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_requested: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          service_requested: formData.service_requested || null,
          message: formData.message || null,
          status: 'new',
        })
        .select()
        .single()

      if (leadError) throw leadError

      // Trigger AI message generation (async, via API)
      if (lead?.id) {
        try {
          await fetch('/api/ai/generate-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: lead.id,
              type: 'initial',
            }),
          })
        } catch (error) {
          console.error('Error triggering AI message:', error)
          // Don't fail the form submission if AI fails
        }
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', service_requested: '', message: '' })
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-950/30 border border-green-500/20 p-6 text-center">
        <h3 className="mb-2 text-xl font-semibold text-green-400">Thank You!</h3>
        <p className="text-slate-300">
          We've received your request and will get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-300">
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-300">
          Phone
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

      {services.length > 0 && (
        <div>
          <label htmlFor="service" className="mb-2 block text-sm font-medium text-slate-300">
            Service Interested In
          </label>
          <select
            id="service"
            value={formData.service_requested}
            onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="" className="bg-slate-900">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.name} className="bg-slate-900">
                {service.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-300">
          Message
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={4}
          className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          placeholder="Tell us about your project..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/50 hover:shadow-xl disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Request Quote'}
      </button>
    </form>
  )
}

