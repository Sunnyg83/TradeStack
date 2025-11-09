export type Trade = 'plumber' | 'electrician' | 'hvac' | 'power_washer'

export interface Profile {
  id: string
  user_id: string
  trade: Trade
  business_name: string
  service_area: string
  phone: string | null
  email: string | null
  slug: string
  brand_color: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  user_id: string
  name: string
  description: string | null
  base_price: number | null
  unit: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  service_requested: string | null
  message: string | null
  status: 'new' | 'contacted' | 'completed' | 'lost'
  service_id: string | null
  income_amount: number | null
  created_at: string
  updated_at: string
}

export interface LeadMessage {
  id: string
  lead_id: string
  role: 'ai' | 'user'
  content: string
  created_at: string
}

export interface AdTemplate {
  id: string
  user_id: string
  service: string
  city: string
  headline: string
  body: string
  fb_caption: string | null
  nextdoor_caption: string | null
  instagram_caption: string | null
  created_at: string
}

export interface OutreachTarget {
  id: string
  user_id: string
  name: string
  email: string
  city: string | null
  status: 'pending' | 'sent' | 'responded' | 'failed'
  created_at: string
}

export interface Settings {
  id: string
  user_id: string
  ai_prompt_template: string
  email_from_name: string
  created_at: string
  updated_at: string
}

export interface WebsiteSettings {
  id: string
  user_id: string
  website_slug: string | null
  theme_name: string
  primary_color: string
  secondary_color: string
  font_family: string
  is_published: boolean
  custom_domain: string | null
  created_at: string
  updated_at: string
}

export interface WebsitePage {
  id: string
  user_id: string
  title: string
  slug: string
  content: Record<string, any>
  is_homepage: boolean
  is_published: boolean
  order_index: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  amount: number
  tax_amount: number
  total_amount: number
  currency: string
  description: string | null
  items: InvoiceItem[]
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
  issued_date: string | null
  paid_date: string | null
  notes: string | null
  stripe_payment_intent_id: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  user_id: string
  amount: number
  currency: string
  payment_method: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'
  transaction_id: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

