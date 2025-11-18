'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Lead, Service } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (leadsError) throw leadsError
      setLeads(leadsData || [])

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)

      if (servicesError) throw servicesError
      setServices(servicesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    const ranges = {
      week: 7,
      month: 30,
      year: 365,
    }
    const days = ranges[timeRange]
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return { startDate, endDate: now }
  }

  const groupLeadsByPeriod = () => {
    const { startDate } = getDateRange()
    const filteredLeads = leads.filter((lead) => new Date(lead.created_at) >= startDate)

    const periodGroups: Record<string, { date: string; new: number; contacted: number; completed: number; lost: number }> = {}

    filteredLeads.forEach((lead) => {
      const date = new Date(lead.created_at)
      let key: string

      if (timeRange === 'week') {
        key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      } else if (timeRange === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }

      if (!periodGroups[key]) {
        periodGroups[key] = { date: key, new: 0, contacted: 0, completed: 0, lost: 0 }
      }

      if (lead.status === 'new') periodGroups[key].new++
      if (lead.status === 'contacted') periodGroups[key].contacted++
      if (lead.status === 'completed') periodGroups[key].completed++
      if (lead.status === 'lost') periodGroups[key].lost++
    })

    return Object.values(periodGroups).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  }

  const groupIncomeByPeriod = () => {
    const { startDate } = getDateRange()
    const completedLeads = leads.filter(
      (lead) => lead.status === 'completed' && lead.income_amount && new Date(lead.updated_at) >= startDate
    )

    const periodGroups: Record<string, { date: string; income: number }> = {}

    completedLeads.forEach((lead) => {
      const date = new Date(lead.updated_at)
      let key: string

      if (timeRange === 'week') {
        key = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      } else if (timeRange === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }

      if (!periodGroups[key]) {
        periodGroups[key] = { date: key, income: 0 }
      }

      periodGroups[key].income += lead.income_amount || 0
    })

    return Object.values(periodGroups).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  }

  const getIncomeByService = () => {
    const completedLeads = leads.filter((lead) => lead.status === 'completed' && lead.service_id && lead.income_amount)

    const serviceGroups: Record<string, { service: string; income: number; count: number }> = {}

    completedLeads.forEach((lead) => {
      const service = services.find((s) => s.id === lead.service_id)
      const serviceName = service?.name || 'Unknown Service'

      if (!serviceGroups[serviceName]) {
        serviceGroups[serviceName] = { service: serviceName, income: 0, count: 0 }
      }

      serviceGroups[serviceName].income += lead.income_amount || 0
      serviceGroups[serviceName].count++
    })

    return Object.values(serviceGroups).sort((a, b) => b.income - a.income)
  }

  // TEMPORARY: Hardcoded sample data for graphs (based on Nov 7, 2025)
  // Simple success data - only completed leads over time
  const getHardcodedLeadsData = () => {
    const today = new Date('2025-11-07')
    
    if (timeRange === 'week') {
      // Last 7 days ending on Nov 7, 2025
      const dates = []
      const completedCounts = [1, 2, 3, 4, 2, 3, 1]
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        dates.push({
          date: dateStr,
          completed: completedCounts[6 - i],
        })
      }
      return dates
    } else if (timeRange === 'month') {
      // Last 30 days - show data points every 5 days
      const dates = []
      const completedCounts = [5, 7, 9, 11, 13, 15, 18]
      let dataIndex = 0
      for (let i = 30; i >= 0; i -= 5) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        dates.push({
          date: dateStr,
          completed: completedCounts[dataIndex % completedCounts.length],
        })
        dataIndex++
      }
      return dates
    } else {
      // Last 6 months ending in November 2025
      const months = []
      const completedCounts = [60, 70, 85, 95, 105, 115]
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        months.push({
          date: dateStr,
          completed: completedCounts[5 - i],
        })
      }
      return months
    }
  }

  const getHardcodedIncomeData = () => {
    const today = new Date('2025-11-07')
    
    if (timeRange === 'week') {
      // Last 7 days ending on Nov 7, 2025
      const dates = []
      const baseIncome = [450, 680, 920, 1200, 850, 1100, 550]
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        dates.push({
          date: dateStr,
          income: baseIncome[6 - i],
        })
      }
      return dates
    } else if (timeRange === 'month') {
      // Last 30 days - show data points every 5 days
      const dates = []
      const monthIncome = [2500, 3800, 5200, 6400, 7800, 9200, 10500]
      let incomeIndex = 0
      for (let i = 30; i >= 0; i -= 5) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        dates.push({
          date: dateStr,
          income: monthIncome[incomeIndex % monthIncome.length],
        })
        incomeIndex++
      }
      return dates
    } else {
      // Last 6 months ending in November 2025
      const months = []
      const yearIncome = [12500, 14800, 17200, 19500, 21800, 24200]
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        months.push({
          date: dateStr,
          income: yearIncome[5 - i],
        })
      }
      return months
    }
  }


  // Use hardcoded data temporarily
  const leadsData = getHardcodedLeadsData()
  const incomeData = getHardcodedIncomeData()

  // Hardcoded stats
  const totalIncome = 71300
  const totalCompleted = 94
  const completionRate = 68
  const avgIncome = 758

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
        <h1 className="text-4xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-2 text-slate-600">Track your leads success and income over time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(totalIncome)}</div>
          <div className="text-sm font-medium text-slate-600">Total Income</div>
        </div>
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-3xl font-bold text-green-600 mb-2">{totalCompleted}</div>
          <div className="text-sm font-medium text-slate-600">Completed Leads</div>
        </div>
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">{completionRate}%</div>
          <div className="text-sm font-medium text-slate-600">Completion Rate</div>
        </div>
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(avgIncome)}</div>
          <div className="text-sm font-medium text-slate-600">Avg. Income/Lead</div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {(['week', 'month', 'year'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              timeRange === range
                ? 'bg-blue-100 text-blue-600 border border-blue-300'
                : 'bg-blue-50 text-slate-700 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Leads Success Over Time */}
      <div className="mb-8 bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Leads Success Over Time</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={leadsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#22c55e" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, fill: '#22c55e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Income Generated Over Time */}
      <div className="mb-8 bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Income Generated Over Time</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={incomeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#8b5cf6" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 6, fill: '#8b5cf6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

