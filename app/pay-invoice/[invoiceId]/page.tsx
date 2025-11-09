'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { Invoice } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'

export default function PayInvoicePage() {
  const params = useParams()
  const invoiceId = params.invoiceId as string
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  useEffect(() => {
    // Check for payment status in URL after invoice loads
    if (!invoice) return
    
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus === 'success') {
      // Reload invoice to get updated status after payment
      setTimeout(() => {
        loadInvoice()
        // Clean up URL
        window.history.replaceState({}, '', `/pay-invoice/${invoiceId}`)
      }, 2000)
    }
  }, [invoice, invoiceId])

  const loadInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/public/${invoiceId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invoice not found')
      }

      // Ensure status includes all possible values
      setInvoice(data.invoice as Invoice)
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!invoice) return

    setProcessing(true)
    try {
      const response = await fetch('/api/invoices/create-payment-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (err: any) {
      setError(err.message || 'Error creating payment')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading invoice...</div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-red-500/20 shadow-xl p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-300 mb-4">Invoice Not Found</h1>
          <p className="text-slate-300">{error || 'This invoice does not exist or has been removed.'}</p>
        </div>
      </div>
    )
  }

  if (invoice.status === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center p-4">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-green-500/20 shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-300 mb-2">Invoice Paid</h1>
            <p className="text-slate-300 mb-6">This invoice has already been paid.</p>
            <p className="text-slate-400 text-sm">Invoice #{invoice.invoice_number}</p>
            {invoice.paid_date && (
              <p className="text-slate-400 text-sm mt-2">
                Paid on: {new Date(invoice.paid_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-blue-500/20 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
            <h1 className="text-3xl font-bold text-white mb-2">Invoice #{invoice.invoice_number}</h1>
            <p className="text-blue-100">Payment Due</p>
          </div>

          <div className="p-6 md:p-8">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-sm font-medium text-slate-400 mb-2">Bill To</h2>
                <p className="text-white font-semibold">{invoice.client_name}</p>
                {invoice.client_email && (
                  <p className="text-slate-300 text-sm">{invoice.client_email}</p>
                )}
                {invoice.client_phone && (
                  <p className="text-slate-300 text-sm">{invoice.client_phone}</p>
                )}
              </div>
              <div>
                <h2 className="text-sm font-medium text-slate-400 mb-2">Invoice Details</h2>
                <p className="text-slate-300 text-sm">Invoice #: {invoice.invoice_number}</p>
                {invoice.issued_date && (
                  <p className="text-slate-300 text-sm">Issued: {new Date(invoice.issued_date).toLocaleDateString()}</p>
                )}
                {invoice.due_date && (
                  <p className="text-slate-300 text-sm">
                    Due: <span className="font-semibold text-yellow-300">{new Date(invoice.due_date).toLocaleDateString()}</span>
                  </p>
                )}
                <p className="text-slate-300 text-sm mt-2">
                  Status: <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (invoice.status as string) === 'sent' ? 'bg-blue-500/20 text-blue-300' :
                    (invoice.status as string) === 'paid' ? 'bg-green-500/20 text-green-300' :
                    (invoice.status as string) === 'overdue' ? 'bg-red-500/20 text-red-300' :
                    (invoice.status as string) === 'cancelled' ? 'bg-slate-500/20 text-slate-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {(invoice.status as string).charAt(0).toUpperCase() + (invoice.status as string).slice(1)}
                  </span>
                </p>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <p className="text-slate-300">{invoice.description}</p>
              </div>
            )}

            {/* Items Table */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Description</th>
                      <th className="text-center py-3 px-4 text-slate-300 font-medium">Qty</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-medium">Price</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-slate-700/50">
                        <td className="py-3 px-4 text-white">{item.description || 'Item'}</td>
                        <td className="py-3 px-4 text-center text-slate-300">{item.quantity || 1}</td>
                        <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(item.unit_price || 0)}</td>
                        <td className="py-3 px-4 text-right text-white font-medium">
                          {formatCurrency((item.quantity || 1) * (item.unit_price || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right text-slate-300 font-medium">Subtotal:</td>
                      <td className="py-3 px-4 text-right text-white font-medium">{formatCurrency(invoice.amount)}</td>
                    </tr>
                    {invoice.tax_amount > 0 && (
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-right text-slate-300">Tax:</td>
                        <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(invoice.tax_amount)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-900/50">
                      <td colSpan={3} className="py-4 px-4 text-right text-lg font-bold text-white">Total:</td>
                      <td className="py-4 px-4 text-right text-lg font-bold text-blue-400">{formatCurrency(invoice.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm"><strong>Note:</strong> {invoice.notes}</p>
              </div>
            )}

            {/* Payment Button */}
            <div className="text-center">
              <button
                onClick={handlePay}
                disabled={processing || ['paid', 'cancelled'].includes(invoice.status as string)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay {formatCurrency(invoice.total_amount)}
                  </>
                )}
              </button>
              <p className="text-slate-400 text-sm mt-4">
                Secure payment processed by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

