'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [totalLeads, setTotalLeads] = useState(0)
  const [newLeads, setNewLeads] = useState(0)
  const [totalServices, setTotalServices] = useState(0)
  const [isStripeConnected, setIsStripeConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const checkStripeStatus = async (forceRefresh = false) => {
    try {
      // Use the status API endpoint which verifies with Stripe and updates the database
      const response = await fetch('/api/stripe/connect/status')
      const data = await response.json()
      
      console.log('Stripe status check response:', data)
      
      // Consider connected if:
      // 1. Status is 'active' (fully activated)
      // 2. OR we have an account_id or has_account flag (even if pending - means onboarding was started)
      if (response.ok) {
        if (data.connected && data.status === 'active') {
          setIsStripeConnected(true)
        } else if (data.account_id || data.has_account || data.status === 'pending') {
          // Account exists but might be pending activation
          // Check profile to see if we have the account_id
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('stripe_account_id, stripe_account_status')
              .eq('user_id', user.id)
              .single()
            
            // If we have an account_id, consider it connected (even if pending)
            setIsStripeConnected(!!profileData?.stripe_account_id)
          } else {
            setIsStripeConnected(false)
          }
        } else {
          setIsStripeConnected(false)
        }
      } else {
        // API call failed, check profile directly
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('stripe_account_id, stripe_account_status')
            .eq('user_id', user.id)
            .single()
          
          // If we have an account_id, consider it connected
          setIsStripeConnected(!!profileData?.stripe_account_id)
        } else {
          setIsStripeConnected(false)
        }
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error)
      // Fallback to checking profile directly
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('stripe_account_id, stripe_account_status')
          .eq('user_id', user.id)
          .single()
        
        // If we have an account_id, consider it connected
        setIsStripeConnected(!!profileData?.stripe_account_id)
      } else {
        setIsStripeConnected(false)
      }
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!profileData) {
        router.push('/onboarding')
        return
      }

      setProfile(profileData)

      // Get stats
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const { data: leads } = await supabase
        .from('leads')
        .select('id, status')
        .eq('user_id', user.id)

      const newLeadsCount = leads?.filter((l) => l.status === 'new').length || 0
      const totalLeadsCount = leads?.length || 0
      const totalServicesCount = services?.length || 0

      setNewLeads(newLeadsCount)
      setTotalLeads(totalLeadsCount)
      setTotalServices(totalServicesCount)

      // Check Stripe Connect status - verify with Stripe API for accuracy
      await checkStripeStatus()
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Handle Stripe redirect parameters
    const stripeSuccess = searchParams.get('stripe_success')
    const stripeRefresh = searchParams.get('stripe_refresh')
    
    if (stripeSuccess === 'true' || stripeRefresh === 'true') {
      // When returning from Stripe, verify status with Stripe API to get real-time status
      checkStripeStatus(true).then(() => {
        loadData()
        if (stripeSuccess === 'true') {
          alert('Stripe account connected successfully!')
        }
        // Clean up URL
        router.replace('/dashboard')
      })
    }
  }, [searchParams, router])

  const handleConnectStripe = async () => {
    try {
      setConnecting(true)
      const response = await fetch('/api/stripe/connect/onboard')
      const data = await response.json()
      
      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to connect Stripe'}`)
        setConnecting(false)
        return
      }
      
      // Redirect to Stripe onboarding
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error)
      alert(`Error: ${error.message || 'Failed to connect to server'}`)
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-slate-900">Loading...</div>
      </div>
    )
  }

  if (!profile) return null

  const userInitial = profile.business_name.charAt(0).toUpperCase()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-2">Welcome back, {profile.business_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-xl font-semibold">{userInitial}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-4xl font-bold text-slate-900 mb-2">{totalLeads}</div>
          <div className="text-sm font-medium text-slate-600">Total Leads</div>
        </div>
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-4xl font-bold text-blue-600 mb-2">{newLeads}</div>
          <div className="text-sm font-medium text-slate-600">New Leads</div>
        </div>
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-4xl font-bold text-green-600 mb-2">{totalServices}</div>
          <div className="text-sm font-medium text-slate-600">Active Services</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/services" className="block">
            <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all hover:-translate-y-1">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-lg mb-1">Services & Pricing</div>
                  <div className="text-sm text-slate-600">{totalServices} active services</div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/leads" className="block">
            <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all hover:-translate-y-1">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-lg mb-1">AI CRM</div>
                  <div className="text-sm text-slate-600">{newLeads} new leads to review</div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/settings" className="block">
            <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all hover:-translate-y-1">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-lg mb-1">Business Profile</div>
                  <div className="text-sm text-slate-600">Edit & share your profile</div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Payment Account Setup */}
      {isStripeConnected ? (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Completed Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-green-50 backdrop-blur-xl rounded-xl p-6 border border-green-200 shadow-lg">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-lg mb-1">Payment Account Connected</div>
                  <div className="text-sm text-slate-600">Stripe account is active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="bg-blue-50 backdrop-blur-xl rounded-xl border border-blue-200 shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Account Setup</h2>
            <p className="text-slate-600 mb-6">
              Connect your Stripe account to receive payments directly. When clients pay your invoices, the money goes directly to your Stripe account - not through any platform account.
            </p>
            
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-slate-700 font-medium mb-2">Payment account not connected</p>
                <p className="text-slate-600 text-sm">
                  Click the button below to connect your Stripe account. You'll be automatically redirected to Stripe to create your account (takes 2 minutes).
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-100 border border-blue-200 rounded-lg">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium mb-2">Super simple:</p>
                    <ul className="text-slate-700 text-sm space-y-1 list-disc list-inside">
                      <li>Click button → Redirected to Stripe</li>
                      <li>Create account → Add bank details</li>
                      <li>Done! → Payments go directly to you</li>
                      <li>Fully automatic - no manual steps needed</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleConnectStripe}
                  disabled={connecting}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 font-semibold text-white hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/50 text-lg"
                >
                  {connecting ? 'Connecting...' : 'Connect Stripe Account →'}
                </button>

                <div className="flex items-start gap-2 p-3 bg-slate-100 border border-slate-200 rounded-lg">
                  <span className="text-lg">💡</span>
                  <p className="text-slate-600 text-sm">
                    If you get an error, Stripe Connect needs to be enabled first (one-time setup). The app will guide you.
                  </p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-slate-100 border border-slate-200 rounded-lg">
                  <span className="text-lg">💡</span>
                  <p className="text-slate-600 text-sm">
                    You'll be redirected to Stripe to complete the setup. Your payment account is secure and payments go directly to you.
                  </p>
                </div>

                <button
                  onClick={() => {
                    checkStripeStatus(true).then(() => loadData())
                  }}
                  className="w-full rounded-xl bg-slate-200 hover:bg-slate-300 px-6 py-3 font-semibold text-slate-700 transition-all text-sm"
                >
                  🔄 Refresh Connection Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
