'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Settings } from '@/lib/types/database'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProfile(profileData)

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSettings(settingsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: profile.business_name,
          service_area: profile.service_area,
          phone: profile.phone,
          email: profile.email,
          brand_color: profile.brand_color,
        })
        .eq('id', profile.id)

      if (error) throw error
      alert('Profile updated!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('settings')
        .update({
          ai_prompt_template: settings.ai_prompt_template,
          email_from_name: settings.email_from_name,
        })
        .eq('user_id', settings.user_id)

      if (error) throw error
      alert('Settings saved!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const copyPublicLink = () => {
    if (!profile) return
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/biz/${profile.slug}`
      navigator.clipboard.writeText(url)
      alert('Public link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-slate-300">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

      {/* Business Profile */}
      {profile && (
        <div className="mb-8">
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-blue-500/20 shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6">Business Profile</h2>
            <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={profile.business_name}
                onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Service Area
              </label>
              <input
                type="text"
                value={profile.service_area}
                onChange={(e) => setProfile({ ...profile, service_area: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full md:w-auto rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Page Link */}
      {profile && (
        <div className="mb-8 bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-2">Public Page</h2>
          <p className="text-slate-300 mb-4">
            Share this link with customers to collect leads
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-slate-900/50 border border-slate-700 px-4 py-3 text-sm text-slate-300 break-all font-mono">
              {typeof window !== 'undefined' ? `${window.location.origin}/biz/${profile.slug}` : `/biz/${profile.slug}`}
            </code>
            <button
              onClick={copyPublicLink}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* AI Settings */}
      {settings && (
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-blue-500/20 shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">AI Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                AI Prompt Template
              </label>
              <textarea
                value={settings.ai_prompt_template}
                onChange={(e) =>
                  setSettings({ ...settings, ai_prompt_template: e.target.value })
                }
                rows={8}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none font-mono text-sm"
              />
              <p className="mt-2 text-sm text-slate-400">
                Use {'{trade}'}, {'{service}'}, {'{name}'} as placeholders
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email From Name
              </label>
              <input
                type="text"
                value={settings.email_from_name}
                onChange={(e) =>
                  setSettings({ ...settings, email_from_name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full md:w-auto rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
