import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get all profiles (no auth check)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)

  const profile = profiles?.[0] || null

  // Get stats (no user filtering)
  const { data: services } = await supabase
    .from('services')
    .select('id')
    .eq('is_active', true)

  const { data: leads } = await supabase
    .from('leads')
    .select('id, status')

  const newLeads = leads?.filter((l) => l.status === 'new').length || 0
  const totalLeads = leads?.length || 0
  const totalServices = services?.length || 0

  // Get profile initial
  const userInitial = profile?.business_name?.charAt(0).toUpperCase() || 'U'

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-2">Welcome back{profile ? `, ${profile.business_name}` : ''}!</p>
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
    </div>
  )
}
