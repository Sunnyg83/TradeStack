import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

// Gmail SMTP configuration
const createTransporter = () => {
  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailAppPassword) {
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { invoice_id } = await request.json()

    if (!invoice_id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!invoice.client_email) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 })
    }

    // Check if Gmail is configured
    const transporter = createTransporter()
    if (!transporter) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local' },
        { status: 500 }
      )
    }

    // Get user profile for business name
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, email')
      .eq('user_id', user.id)
      .single()

    const businessName = profile?.business_name || 'Your Business'
    const fromEmail = process.env.GMAIL_USER || 'noreply@gmail.com'

    // Create payment link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const paymentUrl = `${siteUrl}/pay-invoice/${invoice.id}`

    // Format items for email
    const items = Array.isArray(invoice.items) ? invoice.items : []
    const itemsHtml = items.length > 0 
      ? items.map((item: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description || 'Item'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.unit_price || 0).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}</td>
          </tr>
        `).join('')
      : `
          <tr>
            <td colspan="4" style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #666;">No items listed</td>
          </tr>
        `

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Invoice ${invoice.invoice_number}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">From ${businessName}</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${invoice.client_name},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              You have an invoice due for payment. Please review the details below and click the button to pay securely.
            </p>

            ${invoice.description ? `
              <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; font-size: 14px; color: #666;">${invoice.description}</p>
              </div>
            ` : ''}

            <table style="width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px; border-radius: 5px; overflow: hidden;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb; font-weight: bold;">Subtotal:</td>
                  <td style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb; font-weight: bold;">$${invoice.amount.toFixed(2)}</td>
                </tr>
                ${invoice.tax_amount > 0 ? `
                  <tr>
                    <td colspan="3" style="padding: 8px; text-align: right;">Tax:</td>
                    <td style="padding: 8px; text-align: right;">$${invoice.tax_amount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr style="background: #f3f4f6;">
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">Total:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #1e3a8a;">$${invoice.total_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            ${invoice.due_date ? `
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                <strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Pay Invoice Now
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              You can also copy and paste this link into your browser:<br>
              <a href="${paymentUrl}" style="color: #3b82f6; word-break: break-all;">${paymentUrl}</a>
            </p>

            ${invoice.notes ? `
              <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Note:</strong> ${invoice.notes}</p>
              </div>
            ` : ''}

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions about this invoice, please contact us directly.
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              Thank you,<br>
              <strong>${businessName}</strong>
            </p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              This invoice was sent through TradeStack. Payments are processed securely via Stripe.
            </p>
          </div>
        </body>
      </html>
    `

    // Send email using Gmail SMTP
    const mailOptions = {
      from: `"${businessName}" <${fromEmail}>`,
      to: invoice.client_email,
      subject: `Invoice ${invoice.invoice_number} from ${businessName}`,
      html: emailHtml,
    }

    const info = await transporter.sendMail(mailOptions)

    // Update invoice status to 'sent'
    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoice.id)

    return NextResponse.json({
      success: true,
      message: 'Invoice email sent successfully',
      messageId: info.messageId,
    })
  } catch (error: any) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email. Please check your Gmail credentials.' },
      { status: 500 }
    )
  }
}
