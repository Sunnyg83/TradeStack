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
        <div className="text-slate-900">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Settings</h1>

      {/* Business Profile */}
      {profile && (
        <div className="mb-8">
          <div className="bg-blue-50 backdrop-blur-xl rounded-xl border border-blue-200 shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Business Profile</h2>
            <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={profile.business_name}
                onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Service Area
              </label>
              <input
                type="text"
                value={profile.service_area}
                onChange={(e) => setProfile({ ...profile, service_area: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
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
        <div className="mb-8 bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Public Page</h2>
          <p className="text-slate-600 mb-4">
            Share this link with customers to collect leads
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-white border border-slate-300 px-4 py-3 text-sm text-slate-700 break-all font-mono">
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
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl border border-blue-200 shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Auto-Messaging</h2>
          <p className="text-slate-600 mb-6">
            When customers submit a lead through your public page, AI will automatically write and send them a personalized message. Customize how these messages sound below.
          </p>
          
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div className="flex-1">
                <p className="text-slate-900 font-medium mb-1">How it works:</p>
                <ol className="text-slate-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Customer fills out form on your public page</li>
                  <li>AI automatically writes them a personalized message</li>
                  <li>Message is saved in your CRM for you to review</li>
                  <li>You can edit or send the message anytime</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Message Template
              </label>
              <p className="text-sm text-slate-600 mb-3">
                Write instructions for how AI should write messages to your leads. The AI will use this as a guide to create personalized messages.
              </p>
              <textarea
                value={settings.ai_prompt_template}
                onChange={(e) =>
                  setSettings({ ...settings, ai_prompt_template: e.target.value })
                }
                rows={6}
                placeholder="Example: You are a friendly plumber professional. Write a warm, professional message to a lead who inquired about {service}. Be concise and ask about their timeline."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none text-sm"
              />
              <div className="mt-2 p-3 bg-slate-100 border border-slate-200 rounded-lg">
                <p className="text-xs font-medium text-slate-700 mb-1">💡 Special placeholders you can use:</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li><code className="bg-white px-1 py-0.5 rounded">{'{trade}'}</code> - Your trade type (e.g., "plumber", "electrician")</li>
                  <li><code className="bg-white px-1 py-0.5 rounded">{'{service}'}</code> - The service they requested</li>
                  <li><code className="bg-white px-1 py-0.5 rounded">{'{name}'}</code> - The customer's name</li>
                </ul>
                <p className="text-xs text-slate-600 mt-2">
                  These will be automatically replaced with real information when the message is generated.
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Sender Name
              </label>
              <p className="text-sm text-slate-600 mb-3">
                The name that appears when you send emails to leads. This is how customers will see your name in their inbox.
              </p>
              <input
                type="text"
                value={settings.email_from_name}
                onChange={(e) =>
                  setSettings({ ...settings, email_from_name: e.target.value })
                }
                placeholder="Your Business Name"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
              <p className="mt-2 text-xs text-slate-600">
                Example: If you enter "John's Plumbing", emails will appear as "From: John's Plumbing"
              </p>
            </div>
            
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full md:w-auto rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/50"
            >
              {saving ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
