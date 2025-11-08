'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdTemplate, Service } from '@/lib/types/database'

export default function AdsPage() {
  const [services, setServices] = useState<Service[]>([])
  const [templates, setTemplates] = useState<AdTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    service: '',
    city: '',
    tone: 'friendly',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      setServices(servicesData || [])

      const { data: templatesData } = await supabase
        .from('ad_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setTemplates(templatesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.service || !formData.city) {
      alert('Please select a service and enter a city')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: formData.service,
          city: formData.city,
          tone: formData.tone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate ad' }))
        throw new Error(errorData.error || 'Failed to generate ad')
      }

      const data = await response.json()
      setTemplates([data.template, ...templates])
      setFormData({ service: '', city: '', tone: 'friendly' })
      setShowForm(false)
    } catch (error: any) {
      console.error('Error generating ad:', error)
      const errorMessage = error.message || 'Error generating ad content'
      alert(errorMessage + '\n\nIf this persists, check your GEMINI_API_KEY in .env.local')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-slate-300">Loading...</div>
      </div>
    )
  }

  const draftsCount = 0
  const scheduledCount = 0
  const postedCount = templates.length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Ad Manager</h1>
            <p className="text-slate-300 mt-2">Reach customers across platforms</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl">
          <div className="text-3xl font-bold text-white mb-2">{draftsCount}</div>
          <div className="text-sm font-medium text-slate-300">Drafts</div>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl">
          <div className="text-3xl font-bold text-white mb-2">{scheduledCount}</div>
          <div className="text-sm font-medium text-slate-300">Scheduled</div>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl">
          <div className="text-3xl font-bold text-white mb-2">{postedCount}</div>
          <div className="text-sm font-medium text-slate-300">Posted</div>
        </div>
      </div>

      {/* Create New Ad Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Ad</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-white font-medium">Blank Ad</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <span className="text-white font-medium">Use Template</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-white font-medium">AI Generate</span>
          </button>
        </div>
      </div>

      {/* Your Ads Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Your Ads</h2>
        {templates.length === 0 ? (
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-12 border border-blue-500/20 shadow-xl flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-lg bg-slate-700/50 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="text-slate-300 text-lg">No ads yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-white text-xl mb-2">{template.headline}</h3>
                  <p className="text-sm text-slate-400">
                    {template.service} - {template.city}
                  </p>
                </div>
                <p className="text-slate-300 mb-4">{template.body}</p>
                <div className="space-y-3">
                  {template.fb_caption && (
                    <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                      <span className="text-sm font-medium text-slate-300">Facebook</span>
                      <button
                        onClick={() => copyToClipboard(template.fb_caption!)}
                        className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {template.nextdoor_caption && (
                    <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                      <span className="text-sm font-medium text-slate-300">Nextdoor</span>
                      <button
                        onClick={() => copyToClipboard(template.nextdoor_caption!)}
                        className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {template.instagram_caption && (
                    <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                      <span className="text-sm font-medium text-slate-300">Instagram</span>
                      <button
                        onClick={() => copyToClipboard(template.instagram_caption!)}
                        className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Ad Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-xl p-8 w-full max-w-2xl shadow-2xl border border-blue-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Generate Ad Content</h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Service</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                >
                  <option value="" className="bg-slate-900">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name} className="bg-slate-900">
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  >
                    <option value="friendly" className="bg-slate-900">Friendly</option>
                    <option value="professional" className="bg-slate-900">Professional</option>
                    <option value="casual" className="bg-slate-900">Casual</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/50"
                >
                  {generating ? 'Generating...' : 'Generate Ad'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-slate-600 bg-slate-800/50 px-6 py-3 font-semibold text-slate-300 hover:bg-slate-800/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
