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

