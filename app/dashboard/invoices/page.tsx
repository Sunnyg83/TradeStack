'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Invoice, InvoiceItem } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    description: '',
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }] as InvoiceItem[],
    tax_rate: 0,
  })

  useEffect(() => {
    loadInvoices()
    
    // Check for payment status in URL
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus === 'success') {
      alert('Payment successful! Your invoice has been marked as paid.')
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/invoices')
      loadInvoices()
    } else if (paymentStatus === 'cancelled') {
      // Don't show alert for cancelled, just clean up URL
      window.history.replaceState({}, '', '/dashboard/invoices')
    }
  }, [])

  const loadInvoices = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = (items: InvoiceItem[], taxRate: number) => {
    const amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = amount * (taxRate / 100)
    const total_amount = amount + tax_amount
    return { amount, tax_amount, total_amount }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items]
    
    // Handle number fields - allow intermediate values while typing
    if (field === 'quantity') {
      const numValue = value === '' ? 1 : (typeof value === 'string' ? parseInt(value) || 1 : value)
      newItems[index] = { ...newItems[index], quantity: Math.max(1, numValue) }
    } else if (field === 'unit_price') {
      // Allow empty string or valid number
      const numValue = value === '' ? 0 : (typeof value === 'string' ? parseFloat(value) || 0 : value)
      newItems[index] = { ...newItems[index], unit_price: Math.max(0, numValue) }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    
    // Recalculate total
    newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    setFormData({ ...formData, items: newItems })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { amount, tax_amount, total_amount } = calculateTotals(formData.items, formData.tax_rate)

      let createdInvoiceId: string | null = null

      if (editing) {
        const { error } = await supabase
          .from('invoices')
          .update({
            client_name: formData.client_name,
            client_email: formData.client_email || null,
            client_phone: formData.client_phone || null,
            description: formData.description || null,
            items: formData.items,
            amount,
            tax_amount,
            total_amount,
            due_date: formData.due_date || null,
            notes: formData.notes || null,
          })
          .eq('id', editing.id)

        if (error) throw error
      } else {
        // Generate invoice number using database function
        const { data: invoiceNumberData, error: numberError } = await supabase
          .rpc('generate_invoice_number')

        if (numberError) {
          // Fallback to manual generation if function doesn't exist
          const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
          const fallbackNumber = `INV-${date}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          
          const { data: newInvoice, error } = await supabase
            .from('invoices')
            .insert({
              user_id: user.id,
              invoice_number: fallbackNumber,
              client_name: formData.client_name,
              client_email: formData.client_email || null,
              client_phone: formData.client_phone || null,
              description: formData.description || null,
              items: formData.items,
              amount,
              tax_amount,
              total_amount,
              due_date: formData.due_date || null,
              notes: formData.notes || null,
              status: 'draft',
              issued_date: new Date().toISOString().split('T')[0],
            })
            .select('id')
            .single()

          if (error) throw error
          createdInvoiceId = newInvoice?.id || null
        } else {
          const { data: newInvoice, error } = await supabase
            .from('invoices')
            .insert({
              user_id: user.id,
              invoice_number: invoiceNumberData,
              client_name: formData.client_name,
              client_email: formData.client_email || null,
              client_phone: formData.client_phone || null,
              description: formData.description || null,
              items: formData.items,
              amount,
              tax_amount,
              total_amount,
              due_date: formData.due_date || null,
              notes: formData.notes || null,
              status: 'draft',
              issued_date: new Date().toISOString().split('T')[0],
            })
            .select('id')
            .single()

          if (error) throw error
          createdInvoiceId = newInvoice?.id || null
        }

        // Automatically send email if client email is provided
        if (createdInvoiceId && formData.client_email) {
          try {
            const response = await fetch('/api/invoices/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ invoice_id: createdInvoiceId }),
            })

            const data = await response.json()

            if (!response.ok) {
              console.error('Failed to send invoice email:', data.error)
              // Don't throw error - invoice is still created, just email failed
              const errorMsg = data.error || 'Unknown error'
              if (errorMsg.includes('verify a domain') || errorMsg.includes('only send testing emails')) {
                alert(`Invoice created successfully!\n\n⚠️ Email not sent: ${errorMsg}\n\nTo send emails to clients, you need to verify a domain in Resend.\n\nSee QUICK_FIX_EMAIL_SENDING.md for instructions.`)
              } else {
                alert(`Invoice created successfully, but email could not be sent: ${errorMsg}`)
              }
            } else {
              // Email sent successfully - status will be updated to 'sent' by the API
              alert('Invoice created and sent successfully! The client will receive an email with payment details.')
            }
          } catch (emailError: any) {
            console.error('Error sending invoice email:', emailError)
            // Don't throw error - invoice is still created, just email failed
            alert(`Invoice created successfully, but email could not be sent: ${emailError.message || 'Unknown error'}`)
          }
        } else if (createdInvoiceId && !formData.client_email) {
          alert('Invoice created successfully. Please add a client email address and click "Send" to email the invoice.')
        }
      }

      // Check if user needs to connect bank account for payments
      try {
        const statusResponse = await fetch('/api/plaid/status')
        const statusData = await statusResponse.json()
        if (!statusData.connected && createdInvoiceId) {
          // Show warning but don't block invoice creation
          console.warn('Bank account not connected - payments may not work')
        }
      } catch (statusError) {
        // Ignore status check errors
      }

      setShowForm(false)
      setEditing(null)
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        description: '',
        due_date: '',
        notes: '',
        items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
        tax_rate: 0,
      })
      loadInvoices()
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Error saving invoice')
    }
  }


  const handleEdit = (invoice: Invoice) => {
    setEditing(invoice)
    setFormData({
      client_name: invoice.client_name,
      client_email: invoice.client_email || '',
      client_phone: invoice.client_phone || '',
      description: invoice.description || '',
      due_date: invoice.due_date || '',
      notes: invoice.notes || '',
      items: invoice.items.length > 0 ? invoice.items : [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      tax_rate: invoice.tax_amount > 0 ? (invoice.tax_amount / invoice.amount) * 100 : 0,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Error deleting invoice')
    }
  }

  const handleSend = async (invoice: Invoice) => {
    if (!invoice.client_email) {
      alert('Please add a client email address to send the invoice.')
      return
    }

    try {
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice email')
      }

      // Update invoice status
      const supabase = createClient()
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id)

      if (error) throw error

      alert('Invoice sent successfully! The client will receive an email with a payment link.')
      loadInvoices()
    } catch (error: any) {
      console.error('Error sending invoice:', error)
      alert(error.message || 'Error sending invoice. Make sure RESEND_API_KEY is set in .env.local')
    }
  }

  const handlePay = async (invoice: Invoice) => {
    try {
      const response = await fetch('/api/invoices/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.needs_bank_account) {
          alert(`Cannot process payment: Bank account not connected.\n\nPlease connect your bank account in Settings to receive payments.\n\nYou'll be redirected to Settings now.`)
          window.location.href = '/dashboard/settings'
          return
        }
        throw new Error(data.error || 'Failed to create payment')
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (error: any) {
      console.error('Error creating payment:', error)
      alert(error.message || 'Error creating payment')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'sent':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'overdue':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'draft':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-slate-300">Loading...</div>
      </div>
    )
  }

  const { amount, tax_amount, total_amount } = calculateTotals(formData.items, formData.tax_rate)

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Invoices</h1>
          <p className="mt-2 text-slate-300">Create and manage invoices for your clients</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({
              client_name: '',
              client_email: '',
              client_phone: '',
              description: '',
              due_date: '',
              notes: '',
              items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
              tax_rate: 0,
            })
            setShowForm(true)
          }}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </button>
      </div>

      {/* Invoice Form */}
      {showForm && (
        <div className="mb-6 bg-slate-800/60 backdrop-blur-xl rounded-xl border border-blue-500/20 shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {editing ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Email <span className="text-red-400">*</span>
                  <span className="text-xs text-slate-400 ml-2">(Required to send invoice)</span>
                </label>
                <input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  placeholder="client@example.com"
                  className="w-full bg-slate-900/50 border-2 border-blue-500/30 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Phone
                </label>
                <input
                  type="tel"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Invoice Items
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Add each service or item you're charging for. You can add multiple items - each one will be a separate line on the invoice.
                </p>
              </div>
              
              {/* Table Header for Clarity */}
              <div className="grid grid-cols-12 gap-2 mb-2 px-2 hidden md:grid">
                <div className="col-span-5 text-xs font-medium text-slate-400">What you're charging for</div>
                <div className="col-span-2 text-xs font-medium text-slate-400 text-center">How many</div>
                <div className="col-span-3 text-xs font-medium text-slate-400">Price each</div>
                <div className="col-span-1 text-xs font-medium text-slate-400 text-right">Line total</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="bg-slate-900/40 rounded-lg p-4 border-2 border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-300">Item #{index + 1}</span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                          title="Remove this item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Description */}
                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          What are you charging for? *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Plumbing Service, Repair Work, Consultation"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                          required
                        />
                      </div>
                      
                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          Quantity
                        </label>
                        <input
                          type="number"
                          placeholder="1"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || /^\d+$/.test(value)) {
                              const numValue = value === '' ? 1 : parseInt(value) || 1
                              handleItemChange(index, 'quantity', Math.max(1, numValue))
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value
                            if (value === '' || parseInt(value) < 1 || isNaN(parseInt(value))) {
                              handleItemChange(index, 'quantity', 1)
                            }
                          }}
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                        />
                      </div>
                      
                      {/* Unit Price */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          💵 Price Per Item ($) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={item.unit_price === 0 ? '' : item.unit_price.toString()}
                            onChange={(e) => {
                              const value = e.target.value.trim()
                              // Allow empty, numbers, and one decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                const numValue = value === '' ? 0 : parseFloat(value)
                                if (!isNaN(numValue) && numValue >= 0) {
                                  handleItemChange(index, 'unit_price', numValue)
                                } else if (value === '') {
                                  handleItemChange(index, 'unit_price', 0)
                                }
                              }
                            }}
                            onBlur={(e) => {
                              // Clean up on blur - ensure valid number
                              const value = e.target.value.trim()
                              if (value === '' || value === '.' || isNaN(parseFloat(value))) {
                                handleItemChange(index, 'unit_price', 0)
                              } else {
                                const numValue = parseFloat(value)
                                if (!isNaN(numValue) && numValue >= 0) {
                                  handleItemChange(index, 'unit_price', numValue)
                                }
                              }
                            }}
                            className="w-full bg-slate-800/50 border-2 border-blue-500/50 rounded-lg pl-10 pr-3 py-2.5 text-white text-lg font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none placeholder:text-slate-500"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="md:col-span-2 flex items-end">
                        <div className="w-full bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                          <div className="text-xs text-slate-400 mb-1">Line Total</div>
                          <div className="text-blue-300 font-bold text-lg">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {formData.items.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <p>No items added yet. Click "Add Another Item" to get started.</p>
                </div>
              )}
            </div>

            {/* Tax and Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Totals Display */}
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span>{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tax:</span>
                <span>{formatCurrency(tax_amount)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-lg border-t border-slate-600 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total_amount)}</span>
              </div>
            </div>

            {/* Description and Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50"
              >
                {editing ? 'Update Invoice' : 'Create Invoice'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-blue-500/20 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No invoices yet. Create your first invoice to get started.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {invoice.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <button
                            onClick={() => handlePay(invoice)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Pay Invoice"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        )}
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleSend(invoice)}
                            className="bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg px-3 py-1.5 hover:bg-green-500/30 transition-colors flex items-center gap-1.5 text-xs font-medium"
                            title="Send Invoice via Email"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Send
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit Invoice"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Invoice"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

