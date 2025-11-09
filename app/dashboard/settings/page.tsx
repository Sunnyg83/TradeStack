'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Settings } from '@/lib/types/database'
import { PlaidLinkButton } from '@/components/PlaidLinkButton'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plaidStatus, setPlaidStatus] = useState<{
    connected: boolean
    status: string
    loading: boolean
    account: any
  }>({ connected: false, status: 'unknown', loading: true, account: null })
  const [stripeConnectStatus, setStripeConnectStatus] = useState<{
    connected: boolean
    status: string
    loading: boolean
    account_id: string | null
  }>({ connected: false, status: 'unknown', loading: true, account_id: null })
  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    checkPlaidStatus()
    checkStripeConnectStatus()
    
    // Check for redirect parameters
    const params = new URLSearchParams(window.location.search)
    if (params.get('plaid_success') === 'true') {
      alert('Bank account connected successfully!')
      checkPlaidStatus()
      window.history.replaceState({}, '', '/dashboard/settings')
    }
    if (params.get('stripe_success') === 'true') {
      alert('Stripe account connected successfully! You can now receive payments.')
      checkStripeConnectStatus()
      window.history.replaceState({}, '', '/dashboard/settings')
    }
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

  const checkPlaidStatus = async () => {
    try {
      setPlaidStatus(prev => ({ ...prev, loading: true }))
      const response = await fetch('/api/plaid/status')
      const data = await response.json()
      setPlaidStatus({
        connected: data.connected || false,
        status: data.status || 'unknown',
        loading: false,
        account: data.account || null,
      })
    } catch (error) {
      console.error('Error checking Plaid status:', error)
      setPlaidStatus({ connected: false, status: 'error', loading: false, account: null })
    }
  }

  const checkStripeConnectStatus = async () => {
    try {
      setStripeConnectStatus(prev => ({ ...prev, loading: true }))
      const response = await fetch('/api/stripe/connect/status')
      const data = await response.json()
      setStripeConnectStatus({
        connected: data.connected || false,
        status: data.status || 'unknown',
        loading: false,
        account_id: data.account_id || null,
      })
    } catch (error) {
      console.error('Error checking Stripe Connect status:', error)
      setStripeConnectStatus({ connected: false, status: 'error', loading: false, account_id: null })
    }
  }

  const handleConnectStripe = async () => {
    try {
      setStripeConnectStatus(prev => ({ ...prev, loading: true }))
      const response = await fetch('/api/stripe/connect/onboard')
      
      // Try to parse JSON, but handle empty or invalid responses
      let data
      try {
        const text = await response.text()
        console.log('🔍 Raw API Response:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          text: text.substring(0, 500), // First 500 chars
        })
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', parseError)
        data = { error: 'Invalid response from server' }
      }
      
      // Log the full response for debugging
      console.log('🔍 Stripe Connect API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        data: data,
      })
      
      // Check if response is not OK (error status)
      if (!response.ok) {
        console.error('❌ Stripe Connect API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          error_code: data.error_code,
          needs_onboarding: data.needs_onboarding,
          needs_migration: data.needs_migration,
          full_response: data,
        })
        
        if (data.needs_onboarding) {
          // Profile not found - redirect to onboarding
          const shouldRedirect = confirm(
            'You need to complete your profile setup first. Would you like to go to onboarding now?'
          )
          if (shouldRedirect) {
            window.location.href = '/onboarding'
          }
          setStripeConnectStatus(prev => ({ ...prev, loading: false }))
          return
        }
        
        if (data.needs_migration) {
          alert(`Database Error: ${data.error}\n\nPlease run the Stripe Connect migration (04_stripe_connect.sql) in your Supabase database.`)
          setStripeConnectStatus(prev => ({ ...prev, loading: false }))
          return
        }
        
        if (data.needs_platform_profile) {
          // Platform profile needs to be completed
          const platformProfileUrl = data.platform_profile_url || 'https://dashboard.stripe.com/settings/connect/platform-profile'
          alert(
            `⚠️ Complete Stripe Connect Setup\n\n` +
            `You need to review and acknowledge the platform responsibilities.\n\n` +
            `Opening Stripe Dashboard now...\n\n` +
            `Steps:\n` +
            `1. Review the responsibilities\n` +
            `2. Acknowledge/accept them\n` +
            `3. Complete the platform profile\n` +
            `4. Come back here and try again`
          )
          // Open Stripe Dashboard platform profile page
          window.open(platformProfileUrl, '_blank')
          setStripeConnectStatus(prev => ({ ...prev, loading: false }))
          return
        }
        
        if (data.needs_stripe_connect_enabled) {
          // Automatically open Stripe Dashboard to enable Connect
          const stripeConnectUrl = 'https://dashboard.stripe.com/settings/connect'
          alert(
            `⚠️ Stripe Connect needs to be enabled (one-time setup)\n\n` +
            `Opening Stripe Dashboard now...\n\n` +
            `Steps:\n` +
            `1. Click "Get started" or "Activate Connect"\n` +
            `2. Choose "Express accounts"\n` +
            `3. Complete setup\n` +
            `4. Come back here and try again\n\n` +
            `This is a one-time setup. After this, users can connect automatically!`
          )
          // Open Stripe Dashboard in new tab
          window.open(stripeConnectUrl, '_blank')
          setStripeConnectStatus(prev => ({ ...prev, loading: false }))
          return
        }
        
        // Show detailed error message
        const errorMsg = data.error || `Server error (${response.status})`
        const errorCode = data.error_code ? `\nError Code: ${data.error_code}` : ''
        alert(`Error: ${errorMsg}${errorCode}\n\nStatus: ${response.status}\n\nCheck the browser console (F12) for more details.`)
        setStripeConnectStatus(prev => ({ ...prev, loading: false }))
        return
      }
      
      // Success cases - Automatically redirect to Stripe
      if (data.onboarding_url) {
        // Automatically redirect to Stripe onboarding (user creates account there)
        console.log('✅ Automatically redirecting to Stripe onboarding:', data.onboarding_url)
        // Redirect immediately - no alerts, just go to Stripe
        window.location.href = data.onboarding_url
        return // Don't set loading to false, we're redirecting
      } else if (data.connected) {
        // Already connected
        console.log('✅ Stripe account already connected')
        checkStripeConnectStatus()
        setStripeConnectStatus(prev => ({ ...prev, loading: false }))
      } else {
        console.error('⚠️ Unexpected response:', data)
        alert(`Unexpected response. Please try again.`)
        setStripeConnectStatus(prev => ({ ...prev, loading: false }))
      }
    } catch (error: any) {
      console.error('💥 Exception in handleConnectStripe:', error)
      alert(`Network Error: ${error.message || 'Failed to connect to server'}\n\nCheck the browser console (F12) for more details.`)
      setStripeConnectStatus(prev => ({ ...prev, loading: false }))
    }
  }

  const createLinkToken = async () => {
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (!response.ok) {
        // Show the actual error message from the API
        const errorMsg = data.error || 'Failed to create link token'
        const errorCode = data.error_code || ''
        const errorType = data.error_type || ''
        const errorDetails = data.details || {}
        
        console.error('Plaid API error:', {
          message: errorMsg,
          code: errorCode,
          type: errorType,
          details: errorDetails,
          full_response: data,
        })
        
        if (errorMsg.includes('Plaid is not configured') || errorMsg.includes('PLAID_CLIENT_ID')) {
          alert(
            `Plaid is not configured yet.\n\n` +
            `To connect bank accounts, you need to:\n` +
            `1. Sign up at https://dashboard.plaid.com/signup\n` +
            `2. Get your API keys from Plaid dashboard\n` +
            `3. Add them to your .env.local file:\n\n` +
            `PLAID_CLIENT_ID=your_client_id\n` +
            `PLAID_SECRET=your_sandbox_secret\n` +
            `PLAID_ENV=sandbox\n\n` +
            `See PLAID_SETUP.md for detailed instructions.`
          )
        } else {
          // Show detailed error message
          let errorDisplay = `Plaid Error: ${errorMsg}`
          if (errorCode) {
            errorDisplay += `\n\nError Code: ${errorCode}`
          }
          if (errorType) {
            errorDisplay += `\nError Type: ${errorType}`
          }
          if (errorDetails && Object.keys(errorDetails).length > 0) {
            errorDisplay += `\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}`
          }
          alert(errorDisplay)
        }
        return null
      }
      
      if (data.link_token) {
        setLinkToken(data.link_token)
        return data.link_token
      } else {
        throw new Error(data.error || 'Failed to create link token')
      }
    } catch (error: any) {
      console.error('Error creating link token:', error)
      alert(`Error: ${error.message || 'Failed to initialize bank connection'}`)
      return null
    }
  }

  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    try {
      // Get the selected account ID
      const accountId = metadata.accounts[0]?.id
      
      if (!accountId) {
        throw new Error('No account selected')
      }

      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token: publicToken,
          account_id: accountId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect bank account')
      }

      alert('Bank account connected successfully! You can now receive payments.')
      checkPlaidStatus()
      setLinkToken(null)
      setPlaidStatus(prev => ({ ...prev, loading: false }))
    } catch (error: any) {
      console.error('Error connecting bank account:', error)
      alert(`Error: ${error.message || 'Failed to connect bank account'}`)
      setPlaidStatus(prev => ({ ...prev, loading: false }))
    }
  }, [checkPlaidStatus])

  const handlePlaidExit = useCallback((err: any, metadata: any) => {
    if (err) {
      console.error('Plaid Link error:', err)
    }
    setLinkToken(null)
    setPlaidStatus(prev => ({ ...prev, loading: false }))
  }, [])

  const handleConnectBank = async () => {
    try {
      setPlaidStatus(prev => ({ ...prev, loading: true }))
      const token = await createLinkToken()
      if (!token) {
        setPlaidStatus(prev => ({ ...prev, loading: false }))
      }
      // PlaidLinkButton will handle opening when token is ready
    } catch (error) {
      setPlaidStatus(prev => ({ ...prev, loading: false }))
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

      {/* Stripe Connect - Payment Account Setup (REQUIRED) */}
      <div className="mb-8 bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Payment Account Setup</h2>
        <p className="text-slate-300 mb-4">
          Connect your Stripe account to receive payments directly. When clients pay your invoices, the money goes <strong>directly to your Stripe account</strong> - not through any platform account.
        </p>
        
        {stripeConnectStatus.loading ? (
          <div className="text-slate-300">Checking payment account status...</div>
        ) : stripeConnectStatus.connected && stripeConnectStatus.status === 'active' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-green-300 font-medium">Payment account connected</p>
                <p className="text-slate-400 text-sm mt-1">
                  Payments from invoices go directly to your Stripe account. Stripe automatically transfers funds to your bank account.
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  Account ID: {stripeConnectStatus.account_id?.slice(0, 20)}...
                </p>
              </div>
            </div>
            <button
              onClick={checkStripeConnectStatus}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Refresh status
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 font-medium mb-2">Payment account not connected</p>
              <p className="text-slate-400 text-sm mb-4">
                Click the button below to connect your Stripe account. You'll be automatically redirected to Stripe to create your account (takes 2 minutes).
              </p>
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm font-medium mb-1">💡 Super simple:</p>
                <p className="text-slate-300 text-xs mb-2">
                  • Click button → Redirected to Stripe<br/>
                  • Create account → Add bank details<br/>
                  • Done! → Payments go directly to you<br/>
                  • <strong>Fully automatic</strong> - no manual steps needed
                </p>
              </div>
              <button
                onClick={handleConnectStripe}
                disabled={stripeConnectStatus.loading}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/50"
              >
                {stripeConnectStatus.loading ? 'Setting up...' : 'Connect Stripe Account →'}
              </button>
              <p className="text-slate-400 text-xs mt-3">
                💡 If you get an error, Stripe Connect needs to be enabled first (one-time setup). The app will guide you.
              </p>
            </div>
            <p className="text-slate-400 text-xs">
              💡 You'll be redirected to Stripe to complete the setup. Your payment account is secure and payments go directly to you.
            </p>
          </div>
        )}
      </div>

      {/* Plaid Bank Account - Optional */}
      <div className="mb-8 bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Bank Account (Optional)</h2>
        <p className="text-slate-300 mb-4">
          Connect your bank account via Plaid for additional features. This is <strong>optional</strong> - Stripe Connect handles all payments automatically.
        </p>
        
        {plaidStatus.loading ? (
          <div className="text-slate-300">Checking bank account status...</div>
        ) : plaidStatus.connected && plaidStatus.status === 'connected' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-green-300 font-medium">Bank account connected via Plaid</p>
                {plaidStatus.account && (
                  <p className="text-slate-400 text-sm">
                    {plaidStatus.account.name} ••••{plaidStatus.account.mask} ({plaidStatus.account.type})
                  </p>
                )}
                <p className="text-slate-400 text-xs mt-1">
                  Note: Payments are handled by Stripe Connect. Plaid connection is optional for additional features.
                </p>
              </div>
            </div>
            <button
              onClick={checkPlaidStatus}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Refresh status
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
              <p className="text-slate-300 text-sm mb-4">
                Connect your bank account via Plaid for additional features. This is completely optional - Stripe Connect handles all payment processing automatically.
              </p>
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm font-medium mb-1">💡 Important:</p>
                <p className="text-slate-300 text-xs">
                  When Plaid asks if you want to connect a <strong>Personal</strong> or <strong>Business</strong> account, select <strong>Personal</strong>. 
                  You can use your personal bank account even if you're running a solo business.
                </p>
              </div>
              <button
                onClick={handleConnectBank}
                disabled={plaidStatus.loading}
                className="rounded-xl bg-slate-700 hover:bg-slate-600 px-6 py-3 font-semibold text-white disabled:opacity-50 transition-all"
              >
                {plaidStatus.loading ? 'Connecting...' : 'Connect Bank Account (Optional)'}
              </button>
            </div>
            <p className="text-slate-400 text-xs">
              💡 This is optional. Stripe Connect handles all payments automatically - you don't need Plaid for payments to work.
            </p>
          </div>
        )}
        
        {/* Plaid Link Component - handles the connection flow */}
        {linkToken && (
          <PlaidLinkButton
            linkToken={linkToken}
            onSuccess={handlePlaidSuccess}
            onExit={handlePlaidExit}
          />
        )}
      </div>

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
