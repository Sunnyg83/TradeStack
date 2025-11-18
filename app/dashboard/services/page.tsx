'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Service } from '@/lib/types/database'
import Link from 'next/link'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    unit: 'service',
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const serviceData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        unit: formData.unit,
        is_active: true,
      }

      if (editing) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editing.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('services').insert(serviceData)
        if (error) throw error
      }

      setShowForm(false)
      setEditing(null)
      setFormData({ name: '', description: '', base_price: '', unit: 'service' })
      loadServices()
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Error saving service')
    }
  }

  const handleEdit = (service: Service) => {
    setEditing(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      base_price: service.base_price?.toString() || '',
      unit: service.unit,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
      loadServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Error deleting service')
    }
  }

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Services & Pricing</h1>
          <p className="text-slate-600">Manage your services and pricing</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({ name: '', description: '', base_price: '', unit: 'service' })
            setShowForm(true)
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Service</span>
        </button>
      </div>

      {/* Add Service Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-8 w-full max-w-2xl shadow-2xl border border-blue-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editing ? 'Edit Service' : 'Add New Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    placeholder="service"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30"
                >
                  {editing ? 'Update Service' : 'Create Service'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditing(null)
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

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full bg-blue-50 backdrop-blur-xl rounded-xl border border-blue-200 p-12 text-center shadow-lg">
            <p className="text-slate-900 text-lg">No services yet.</p>
            <p className="text-slate-600 text-sm mt-2">Add your first service to get started!</p>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-xl mb-2">{service.name}</h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-blue-600 font-bold text-2xl">
                      {formatCurrency(service.base_price)}
                    </span>
                    {service.unit && (
                      <span className="text-slate-600 text-sm ml-2">per {service.unit}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-blue-200">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 bg-blue-100 text-blue-600 border border-blue-200 rounded-lg py-2 px-4 text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="flex-1 bg-red-100 text-red-600 border border-red-200 rounded-lg py-2 px-4 text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
