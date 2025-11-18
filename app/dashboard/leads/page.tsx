'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import type { Lead, LeadMessage, Service } from '@/lib/types/database'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [messages, setMessages] = useState<LeadMessage[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [completingLead, setCompletingLead] = useState<Lead | null>(null)
  const [completeFormData, setCompleteFormData] = useState({
    service_id: '',
    income_amount: '',
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_requested: '',
    message: '',
  })
  const [addingLead, setAddingLead] = useState(false)
  const [demosCreated, setDemosCreated] = useState(false)

  useEffect(() => {
    loadLeads()
    loadServices()
  }, [statusFilter])

  useEffect(() => {
    // Create demo leads if user has no leads yet (only once)
    if (!loading && !demosCreated && leads.length === 0) {
      createDemoLeads()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, demosCreated, leads.length])

  useEffect(() => {
    if (selectedLead) {
      loadMessages(selectedLead.id)
    }
  }, [selectedLead])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        setLoading(false)
        return
      }
      
      if (!user) {
        setLoading(false)
        return
      }

      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading leads:', error)
        setLeads([])
      } else {
        setLeads(data || [])
      }
    } catch (error) {
      console.error('Error loading leads:', error)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  const createDemoLeads = async () => {
    if (demosCreated) return // Prevent multiple calls
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDemosCreated(true)
        return
      }

      // Check if user already has leads (to avoid creating demos on every page load)
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (existingLeads && existingLeads.length > 0) {
        setDemosCreated(true)
        return
      }

      const demoLeads = [
        {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '(555) 123-4567',
          service_requested: 'Plumbing Repair',
          message: 'Need help with a leaky faucet in the kitchen. Available this weekend.',
          status: 'new' as const,
        },
        {
          name: 'Mike Chen',
          email: 'mike.chen@email.com',
          phone: '(555) 234-5678',
          service_requested: 'HVAC Installation',
          message: 'Looking to install a new AC unit in my home. Can you provide a quote?',
          status: 'new' as const,
        },
        {
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@email.com',
          phone: '(555) 345-6789',
          service_requested: 'Electrical Work',
          message: 'Need to install some new outlets in the living room. When are you available?',
          status: 'contacted' as const,
        },
        {
          name: 'David Thompson',
          email: 'david.thompson@email.com',
          phone: '(555) 456-7890',
          service_requested: 'Power Washing',
          message: 'Looking to power wash my driveway and deck. What are your rates?',
          status: 'new' as const,
        },
        {
          name: 'Jessica Martinez',
          email: 'jessica.martinez@email.com',
          phone: '(555) 567-8901',
          service_requested: 'Plumbing Repair',
          message: 'Bathroom sink is clogged. Need someone to come out ASAP.',
          status: 'completed' as const,
        },
      ]

      const leadsToInsert = demoLeads.map(lead => ({
        user_id: user.id,
        ...lead,
      }))

      const { error } = await supabase
        .from('leads')
        .insert(leadsToInsert)

      if (error) {
        console.error('Error creating demo leads:', error)
        setDemosCreated(true) // Mark as created even on error to prevent retries
        return
      }

      setDemosCreated(true)
      loadLeads()
    } catch (error) {
      console.error('Error creating demo leads:', error)
      setDemosCreated(true) // Mark as created even on error to prevent retries
    }
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingLead(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          service_requested: formData.service_requested || null,
          message: formData.message || null,
          status: 'new',
        })

      if (error) throw error

      setFormData({
        name: '',
        email: '',
        phone: '',
        service_requested: '',
        message: '',
      })
      setShowAddForm(false)
      loadLeads()
    } catch (error) {
      console.error('Error adding lead:', error)
      alert('Error adding lead. Please try again.')
    } finally {
      setAddingLead(false)
    }
  }

  const loadMessages = async (leadId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('lead_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId)

      if (error) throw error
      loadLeads()
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status })
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
    }
  }

  const handleMarkComplete = async (lead: Lead) => {
    setCompletingLead(lead)
    
    // Try to match service_requested with an existing service
    let matchedServiceId = lead.service_id || ''
    let defaultIncome = lead.income_amount?.toString() || ''
    
    if (!matchedServiceId && lead.service_requested) {
      const matchedService = services.find(
        (s) => s.name.toLowerCase() === lead.service_requested?.toLowerCase()
      )
      if (matchedService) {
        matchedServiceId = matchedService.id
        if (!defaultIncome && matchedService.base_price) {
          defaultIncome = matchedService.base_price.toString()
        }
      }
    }
    
    setCompleteFormData({
      service_id: matchedServiceId,
      income_amount: defaultIncome,
    })
    setShowCompleteForm(true)
  }

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completingLead) return

    try {
      const supabase = createClient()
      const updateData: any = {
        status: 'completed' as const,
      }

      if (completeFormData.service_id) {
        updateData.service_id = completeFormData.service_id
      }

      if (completeFormData.income_amount) {
        updateData.income_amount = parseFloat(completeFormData.income_amount)
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', completingLead.id)

      if (error) throw error

      setShowCompleteForm(false)
      setCompletingLead(null)
      setCompleteFormData({ service_id: '', income_amount: '' })
      loadLeads()
      if (selectedLead?.id === completingLead.id) {
        setSelectedLead({ ...selectedLead, ...updateData })
      }
    } catch (error) {
      console.error('Error marking lead as complete:', error)
      alert('Error marking lead as complete')
    }
  }

  const generateFollowUp = async () => {
    if (!selectedLead) return

    try {
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          type: 'followup',
        }),
      })

      if (!response.ok) throw new Error('Failed to generate message')

      const data = await response.json()
      setMessages([...messages, data.message])
      loadLeads()
    } catch (error) {
      console.error('Error generating follow-up:', error)
      alert('Error generating follow-up message')
    }
  }

  const newLeadsCount = leads.filter((l) => l.status === 'new').length
  const totalLeadsCount = leads.length
  const completedLeads = leads.filter((l) => l.status === 'completed').length
  const winRate = totalLeadsCount > 0 ? Math.round((completedLeads / totalLeadsCount) * 100) : 0

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">AI CRM</h1>
            <p className="text-slate-600 mt-2">{newLeadsCount} new leads to review</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Lead</span>
            </button>
            <div className="bg-blue-100 border border-blue-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-blue-600 font-medium">AI Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">{winRate}%</div>
              <div className="text-sm font-medium text-slate-600">Win Rate</div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">{totalLeadsCount}</div>
              <div className="text-sm font-medium text-slate-600">Total Leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-blue-200">
          {['all', 'new', 'contacted', 'completed', 'lost'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                statusFilter === status
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-blue-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Add Lead Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-8 w-full max-w-2xl shadow-2xl border border-blue-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Lead</h2>
            <form onSubmit={handleAddLead} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Service Requested</label>
                  <input
                    type="text"
                    value={formData.service_requested}
                    onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    placeholder="Plumbing Repair"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  placeholder="Additional notes or message from the lead..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={addingLead}
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30"
                >
                  {addingLead ? 'Adding...' : 'Add Lead'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      service_requested: '',
                      message: '',
                    })
                  }}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leads List */}
      <div className="space-y-4">
        {leads.length === 0 ? (
          <div className="bg-blue-50 backdrop-blur-xl rounded-xl border border-blue-200 p-12 text-center shadow-lg">
            <p className="text-slate-900 text-lg">No leads yet.</p>
            <p className="text-slate-600 text-sm mt-2">Click "Add Lead" to manually add a lead, or share your public page to collect leads!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-xl mb-2">{lead.name}</div>
                    <div className="flex items-center text-slate-600 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-600 border border-blue-200' :
                    lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-600 border border-yellow-200' :
                    lead.status === 'completed' ? 'bg-green-100 text-green-600 border border-green-200' :
                    'bg-red-100 text-red-600 border border-red-200'
                  }`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </div>
                </div>
                <div className="text-blue-600 font-medium mb-3">
                  {lead.service_requested || 'General Inquiry'}
                </div>
                <p className="text-slate-600 mb-4 line-clamp-2">
                  {lead.message || 'No message provided'}
                </p>
                <div className="flex gap-3">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-blue-100 text-blue-600 border border-blue-200 rounded-lg py-2 px-4 text-sm font-medium flex items-center gap-2 hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call
                    </a>
                  )}
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-blue-100 text-blue-600 border border-blue-200 rounded-lg py-2 px-4 text-sm font-medium flex items-center gap-2 hover:bg-blue-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateLeadStatus(lead.id, 'contacted')
                    }}
                    className="bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg py-2 px-4 text-sm font-medium flex items-center gap-2 hover:bg-green-500/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark Contacted
                  </button>
                  {lead.status !== 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkComplete(lead)
                      }}
                      className="bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg py-2 px-4 text-sm font-medium flex items-center gap-2 hover:bg-purple-500/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark Complete
                    </button>
                  )}
                  {lead.status === 'completed' && lead.income_amount && (
                    <div className="bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg py-2 px-4 text-sm font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.income_amount)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mark Complete Form Modal */}
      {showCompleteForm && completingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-8 w-full max-w-2xl shadow-2xl border border-blue-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Mark Lead as Complete</h2>
            <form onSubmit={handleCompleteSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service (Optional)
                </label>
                <select
                  value={completeFormData.service_id}
                  onChange={(e) => {
                    const selectedService = services.find((s) => s.id === e.target.value)
                    setCompleteFormData({
                      service_id: e.target.value,
                      income_amount: selectedService?.base_price?.toString() || completeFormData.income_amount,
                    })
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                >
                  <option value="">Select a service...</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} {service.base_price ? `(${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(service.base_price)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Income Amount (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={completeFormData.income_amount}
                  onChange={(e) => setCompleteFormData({ ...completeFormData, income_amount: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-slate-600">
                  Enter the amount earned from this completed service
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30"
                >
                  Mark Complete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteForm(false)
                    setCompletingLead(null)
                    setCompleteFormData({ service_id: '', income_amount: '' })
                  }}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-blue-50 backdrop-blur-xl rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-200">
            <div className="p-6 border-b border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900">{selectedLead.name}</h2>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{selectedLead.email}</span>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.service_requested && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{selectedLead.service_requested}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3 text-lg">Message</h3>
                <p className="text-slate-600">{selectedLead.message || 'No message'}</p>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 text-lg">Conversation</h3>
                  <button
                    onClick={generateFollowUp}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30"
                  >
                    Generate Follow-up
                  </button>
                </div>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-slate-600 text-sm">No messages yet</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-lg p-4 ${
                          message.role === 'ai'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-blue-100 border border-blue-200'
                        }`}
                      >
                        <div className="text-xs text-slate-600 mb-2">
                          {message.role === 'ai' ? 'AI' : 'You'} •{' '}
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </div>
                        <div className="text-slate-900">{message.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
