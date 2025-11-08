'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Settings, OutreachTarget } from '@/lib/types/database'

export default function AICRMPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [outreachTargets, setOutreachTargets] = useState<OutreachTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSettings(settingsData)

      // Load outreach targets
      const { data: targetsData } = await supabase
        .from('outreach_targets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setOutreachTargets(targetsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('settings')
        .update({
          ai_prompt_template: settings.ai_prompt_template,
          email_from_name: settings.email_from_name,
        })
        .eq('user_id', user.id)

      if (error) throw error
      alert('Settings saved!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    }
  }

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return

    setGenerating(true)
    try {
      const text = await csvFile.text()
      const lines = text.split('\n').filter((line) => line.trim())
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

      const nameIdx = headers.findIndex((h) => h.includes('name'))
      const emailIdx = headers.findIndex((h) => h.includes('email'))
      const cityIdx = headers.findIndex((h) => h.includes('city') || h.includes('location'))

      if (nameIdx === -1 || emailIdx === -1) {
        throw new Error('CSV must have "name" and "email" columns')
      }

      const contacts = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim())
        return {
          name: values[nameIdx],
          email: values[emailIdx],
          city: cityIdx !== -1 ? values[cityIdx] : null,
        }
      })

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Insert targets
      const { error: insertError } = await supabase
        .from('outreach_targets')
        .insert(
          contacts.map((contact) => ({
            user_id: user.id,
            name: contact.name,
            email: contact.email,
            city: contact.city,
            status: 'pending',
          }))
        )

      if (insertError) throw insertError

      // Generate outreach for all contacts
      const response = await fetch('/api/ai/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: contacts.slice(0, 10), // Limit to 10 for demo
        }),
      })

      if (!response.ok) throw new Error('Failed to generate outreach')

      alert(`Uploaded ${contacts.length} contacts and started generating outreach!`)
      setCsvFile(null)
      loadData()
    } catch (error: any) {
      console.error('Error processing CSV:', error)
      alert(error.message || 'Error processing CSV')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="text-slate-300">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">AI CRM</h1>
        <p className="mt-2 text-slate-300">Configure AI-powered outreach and messaging</p>
      </div>

      <div className="space-y-8">
        {/* Settings */}
        <div className="rounded-xl bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 shadow-xl p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">AI Prompt Template</h2>
          <p className="mb-4 text-sm text-slate-400">
            Customize how the AI generates messages. Use {'{trade}'}, {'{service}'}, {'{name}'} as
            placeholders.
          </p>
          {settings && (
            <>
              <textarea
                value={settings.ai_prompt_template}
                onChange={(e) =>
                  setSettings({ ...settings, ai_prompt_template: e.target.value })
                }
                rows={6}
                className="mb-4 w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email From Name
                </label>
                <input
                  type="text"
                  value={settings.email_from_name}
                  onChange={(e) => setSettings({ ...settings, email_from_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50"
              >
                Save Settings
              </button>
            </>
          )}
        </div>

        {/* Cold Outreach */}
        <div className="rounded-xl bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 shadow-xl p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Cold Outreach</h2>
          <p className="mb-4 text-sm text-slate-400">
            Upload a CSV file with contacts (name, email, city) to generate personalized outreach
            emails.
          </p>
          <form onSubmit={handleCsvUpload} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                CSV format: name, email, city (or location)
              </p>
            </div>
            <button
              type="submit"
              disabled={!csvFile || generating}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/50"
            >
              {generating ? 'Processing...' : 'Upload & Generate Outreach'}
            </button>
          </form>
        </div>

        {/* Outreach Targets */}
        <div className="rounded-xl bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 shadow-xl p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Outreach Targets</h2>
          <div className="space-y-2">
            {outreachTargets.length === 0 ? (
              <div className="text-center text-slate-400">No outreach targets yet</div>
            ) : (
              outreachTargets.slice(0, 20).map((target) => (
                <div
                  key={target.id}
                  className="flex items-center justify-between rounded-lg border border-slate-600/50 bg-slate-900/50 p-4"
                >
                  <div>
                    <div className="font-medium text-white">{target.name}</div>
                    <div className="text-sm text-slate-400">{target.email}</div>
                    {target.city && <div className="text-xs text-slate-500">{target.city}</div>}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      target.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : target.status === 'sent'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : target.status === 'responded'
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {target.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

