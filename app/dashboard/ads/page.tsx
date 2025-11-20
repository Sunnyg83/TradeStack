'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdTemplate, Service } from '@/lib/types/database'

type FormMode = 'manual' | 'ai'

interface PreMadeTemplate {
  service: string
  headline: string
  body: string
  fbCaption: string
  craigslistCaption: string
  instagramCaption: string
}

const PRE_MADE_TEMPLATES: PreMadeTemplate[] = [
  {
    service: 'Drain Cleaning',
    headline: 'Clogged Drains Got You Down? We\'ll Flush Away Your Troubles!',
    body: 'Don\'t let clogged drains ruin your day! We\'re your friendly, local drain cleaning experts, ready to get your pipes flowing freely again. Call us today for fast, reliable service and a free estimate!',
    fbCaption: 'Uh oh, is your sink looking a little *too* full? 🛁 Clogged drains are no match for our expert team! 💪 Get fast, affordable drain cleaning. Give us a call or message us to schedule your appointment! ➡️',
    craigslistCaption: 'Professional drain cleaning available in the San Francisco area. Licensed & insured, same-day service, free estimates. Call or text to book your appointment!',
    instagramCaption: 'Nothing\'s worse than a stubborn clog! 🚫 We\'re here to rescue you from drain disasters. Check out this before & after! ✨ Swipe to see the magic! 😉 Call us for a free estimate and get your pipes flowing freely again. #DrainCleaning #Plumbing #HomeImprovement #BeforeAndAfter'
  },
  {
    service: 'HVAC',
    headline: 'Stay Cool in Summer, Warm in Winter - Expert HVAC Service!',
    body: 'Your comfort is our priority! Professional heating and cooling services to keep your home at the perfect temperature year-round. Licensed, insured, and ready to help. Schedule your service today!',
    fbCaption: 'Is your AC struggling? ❄️ Or maybe your heater isn\'t keeping you warm? 🔥 We\'ve got you covered! Expert HVAC service with same-day availability. Call now for a free estimate! #HVAC #HeatingCooling',
    craigslistCaption: 'Heating or cooling issues? Licensed HVAC specialists serving the local area. Repairs, installs, tune-ups. Call today for priority scheduling and free estimates!',
    instagramCaption: 'Beat the heat (or cold)! 🌡️ Professional HVAC service that keeps your home comfortable all year long. Quality work, fair prices, and customer satisfaction guaranteed! 📞 Call for a free consultation! #HVAC #ACRepair #Heating #HomeComfort'
  },
  {
    service: 'Electrical',
    headline: 'Power Up Your Home - Licensed Electricians You Can Trust!',
    body: 'Electrical issues? Don\'t wait! Our licensed electricians provide safe, reliable electrical services for your home or business. From repairs to installations, we\'ve got the power to help. Free estimates available!',
    fbCaption: '⚡ Electrical problems? We\'re here to help! Licensed, insured electricians ready to tackle any electrical job. Safety first, quality always. Call today for fast, professional service!',
    craigslistCaption: 'Licensed electricians available for residential and light commercial jobs. Breakers, lighting, EV chargers, troubleshooting. Fast response—call or message for a quote!',
    instagramCaption: 'Power up your space! ⚡️ Licensed electricians providing top-notch electrical services. From simple repairs to full installations, we do it all safely and efficiently. DM for a free quote! #Electrician #ElectricalWork #HomeImprovement #SafetyFirst'
  },
  {
    service: 'Landscaping',
    headline: 'Transform Your Outdoor Space - Beautiful Landscaping Awaits!',
    body: 'Turn your yard into a stunning outdoor oasis! Professional landscaping services including design, installation, and maintenance. Let us bring your vision to life. Free consultations available!',
    fbCaption: '🌳 Dreaming of a beautiful yard? We make it happen! Professional landscaping services to transform your outdoor space. Design, installation, and maintenance - we do it all! Get your free quote today!',
    craigslistCaption: 'Need help with your yard? Full-service landscaping: design, installation, maintenance. Serving the local area with free on-site consultations. Call today!',
    instagramCaption: 'From drab to fab! 🌿✨ Professional landscaping that transforms your outdoor space. Check out our latest project! Swipe to see the transformation. Ready to create your dream yard? Let\'s chat! #Landscaping #GardenDesign #OutdoorLiving #BeforeAndAfter'
  },
  {
    service: 'Cleaning Services',
    headline: 'Sparkle & Shine - Professional Cleaning Services!',
    body: 'Too busy to clean? We\'ve got you covered! Professional cleaning services for homes and offices. Reliable, thorough, and affordable. Book your cleaning today and enjoy a spotless space!',
    fbCaption: '✨ Tired of cleaning? Let us handle it! Professional cleaning services that leave your space sparkling. Homes, offices, move-in/out - we do it all! Book now and relax! 🧹',
    craigslistCaption: 'Professional house & office cleaning. Weekly, bi-weekly, move-in/out. Detail-focused, insured crew, supplies included. Free quote—call or text!',
    instagramCaption: 'Clean space, clear mind! ✨ Professional cleaning services that make your life easier. From regular maintenance to deep cleans, we\'ve got you covered. Book your spotless transformation today! #CleaningService #HouseCleaning #ProfessionalCleaning #CleanHome'
  },
  {
    service: 'Handyman',
    headline: 'Fix It All - Your Trusted Handyman Service!',
    body: 'Honey-do list piling up? We\'re here to help! From small repairs to bigger projects, our experienced handyman team can tackle it all. Quality work, fair prices, and satisfaction guaranteed!',
    fbCaption: '🔧 Got a to-do list? We\'re your solution! Professional handyman services for all your home repair and improvement needs. No job too small! Call today for fast, reliable service.',
    craigslistCaption: 'Local handyman ready to tackle punch lists, repairs, installs, and upgrades. Reliable, insured, honest pricing. Call now to schedule your project!',
    instagramCaption: 'One call, we fix it all! 🔨 Professional handyman services for your home. From leaky faucets to full renovations, we\'ve got the skills and tools. Quality work you can trust! #Handyman #HomeRepair #DIY #HomeImprovement'
  },
  {
    service: 'Roofing',
    headline: 'Protect Your Home - Expert Roofing Services!',
    body: 'A strong roof protects everything you value. Professional roofing services including repairs, replacements, and maintenance. Licensed, insured, and committed to quality. Free inspections available!',
    fbCaption: '🏠 Roof problems? Don\'t wait for leaks! Expert roofing services to protect your home. Repairs, replacements, and maintenance - we do it all. Licensed and insured. Free estimates!',
    craigslistCaption: 'Roof repairs & replacements done right. Licensed crew, quality materials, emergency tarping available. Serving the Bay Area—call for a free inspection!',
    instagramCaption: 'Protect what matters most! 🏠 Professional roofing services that keep your home safe and dry. Quality materials, expert installation, and peace of mind. Free inspections available! #Roofing #HomeProtection #RoofRepair #QualityWork'
  },
  {
    service: 'Painting',
    headline: 'Fresh Paint, Fresh Start - Professional Painting Services!',
    body: 'Transform your space with a fresh coat of paint! Professional interior and exterior painting services. Quality work, attention to detail, and beautiful results. Get your free estimate today!',
    fbCaption: '🎨 Ready for a fresh look? Professional painting services for your home or business. Interior, exterior, we do it all! Quality paint, expert application, stunning results. Free estimates!',
    craigslistCaption: 'Professional interior/exterior painting. Prep, repairs, color consults, clean finish. Licensed & insured with references. Call today for a free estimate!',
    instagramCaption: 'Color your world! 🎨 Professional painting that brings your vision to life. Check out this stunning transformation! Swipe to see the before and after. Ready to refresh your space? #Painting #HomeImprovement #InteriorDesign #BeforeAndAfter'
  }
]

export default function AdsPage() {
  const [services, setServices] = useState<Service[]>([])
  const [templates, setTemplates] = useState<AdTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [formData, setFormData] = useState({
    service: '',
    city: '',
    tone: 'friendly',
  })
  const [manualData, setManualData] = useState({
    service: '',
    city: '',
    headline: '',
    body: '',
    fbCaption: '',
    craigslistCaption: '',
    instagramCaption: '',
  })
  const [autoPost, setAutoPost] = useState<{ facebook: boolean; instagram: boolean }>({
    facebook: false,
    instagram: false,
  })
  const [savingManual, setSavingManual] = useState(false)
  const [facebookStatus, setFacebookStatus] = useState<{
    connected: boolean
    pageName: string | null
    hasInstagram: boolean
    instagramUsername: string | null
  } | null>(null)
  const [posting, setPosting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
    checkFacebookStatus()
    
    // Check for success/error messages in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const connected = params.get('connected')
      const error = params.get('error')
      
      if (connected === 'facebook') {
        alert('Successfully connected to Facebook!')
        checkFacebookStatus() // Refresh status
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
      
      if (error) {
        alert(decodeURIComponent(error))
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const checkFacebookStatus = async () => {
    try {
      const response = await fetch('/api/facebook/status')
      if (response.ok) {
        const data = await response.json()
        setFacebookStatus(data.facebook)
      }
    } catch (error) {
      console.error('Error checking Facebook status:', error)
    }
  }

  const handleConnectFacebook = () => {
    window.location.href = '/api/facebook/connect'
  }

  const handlePost = async (templateId: string, platform: 'facebook' | 'instagram', caption: string) => {
    if (!facebookStatus?.connected) {
      alert('Please connect your Facebook account first')
      return
    }

    if (platform === 'instagram' && !facebookStatus.hasInstagram) {
      alert('Instagram account not connected. Please connect your Instagram Business Account to your Facebook Page.')
      return
    }

    setPosting({ ...posting, [`${templateId}-${platform}`]: true })

    try {
      const response = await fetch('/api/facebook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adTemplateId: templateId,
          platform,
          caption,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post')
      }

      alert(`Successfully posted to ${platform === 'facebook' ? 'Facebook' : 'Instagram'}!`)
      loadData() // Reload to show updated status
    } catch (error: any) {
      console.error('Error posting:', error)
      alert(error.message || 'Failed to post. Please try again.')
    } finally {
      setPosting({ ...posting, [`${templateId}-${platform}`]: false })
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      setServices(servicesData || [])

      const { data: templatesData } = await supabase
        .from('ad_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setTemplates(templatesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setFormMode(null)
    setFormData({
      service: '',
      city: '',
      tone: 'friendly',
    })
    setManualData({
      service: '',
      city: '',
      headline: '',
      body: '',
      fbCaption: '',
      craigslistCaption: '',
      instagramCaption: '',
    })
    setAutoPost({ facebook: false, instagram: false })
  }

  const openManualForm = () => {
    setManualData({
      service: '',
      city: '',
      headline: '',
      body: '',
      fbCaption: '',
      craigslistCaption: '',
      instagramCaption: '',
    })
    setAutoPost({ facebook: false, instagram: false })
    setFormMode('manual')
    setShowForm(true)
  }

  const openAIForm = () => {
    setFormMode('ai')
    setShowForm(true)
  }

  const openTemplateSelector = () => {
    setShowTemplateSelector(true)
  }

  const selectTemplate = (template: PreMadeTemplate) => {
    setManualData({
      service: template.service,
      city: '', // User will fill this in
      headline: template.headline,
      body: template.body,
      fbCaption: template.fbCaption,
      craigslistCaption: template.craigslistCaption,
      instagramCaption: template.instagramCaption,
    })
    setShowTemplateSelector(false)
    setFormMode('manual')
    setShowForm(true)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.service || !formData.city) {
      alert('Please select a service and enter a city')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: formData.service,
          city: formData.city,
          tone: formData.tone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate ad' }))
        throw new Error(errorData.error || 'Failed to generate ad')
      }

      const data = await response.json()
      setTemplates((prev) => [data.template, ...prev])
      handleCloseForm()
    } catch (error: any) {
      console.error('Error generating ad:', error)
      const errorMessage = error.message || 'Error generating ad content'
      alert(errorMessage + '\n\nIf this persists, check your GEMINI_API_KEY in .env.local')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this ad? This cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Please sign in to delete ads.')
        return
      }

      const { error } = await supabase
        .from('ad_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      setTemplates((prev) => prev.filter((template) => template.id !== templateId))
    } catch (error: any) {
      console.error('Error deleting ad:', error)
      alert(error?.message || 'Failed to delete ad. Please try again.')
    }
  }

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmed = {
      service: manualData.service.trim(),
      city: manualData.city.trim(),
      headline: manualData.headline.trim(),
      body: manualData.body.trim(),
      fbCaption: manualData.fbCaption.trim(),
      craigslistCaption: manualData.craigslistCaption.trim(),
      instagramCaption: manualData.instagramCaption.trim(),
    }

    if (!trimmed.service || !trimmed.city || !trimmed.headline || !trimmed.body) {
      alert('Please fill in service, city, headline, and body to save your ad.')
      return
    }

    setSavingManual(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert('Please sign in to save ads.')
        return
      }

      const { data, error } = await supabase
        .from('ad_templates')
        .insert({
          user_id: user.id,
          service: trimmed.service,
          city: trimmed.city,
          headline: trimmed.headline,
          body: trimmed.body,
          fb_caption: trimmed.fbCaption || null,
          craigslist_caption: trimmed.craigslistCaption || null,
          instagram_caption: trimmed.instagramCaption || null,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data) {
        setTemplates((prev) => [data, ...prev])
        // Auto-post if selected
        try {
          if (autoPost.facebook) {
            await handlePost(data.id, 'facebook', trimmed.fbCaption || trimmed.body)
          }
          if (autoPost.instagram) {
            await handlePost(data.id, 'instagram', trimmed.instagramCaption || trimmed.body)
          }
        } catch (postErr) {
          // Errors are already alerted inside handlePost
        }
      }

      handleCloseForm()
    } catch (error: any) {
      console.error('Error saving ad:', error)
      const message = error?.message || 'Failed to save ad. Please try again.'
      alert(message)
    } finally {
      setSavingManual(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-slate-900">Loading...</div>
      </div>
    )
  }

  const draftsCount = 0
  const scheduledCount = 0
  const postedCount = templates.length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Ad Manager</h1>
            <p className="text-slate-600 mt-2">Reach customers across platforms</p>
          </div>
          {!facebookStatus?.connected && (
            <button
              onClick={handleConnectFacebook}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Connect Facebook
            </button>
          )}
          {facebookStatus?.connected && (
            <div className="flex items-center gap-3">
            <div className="text-sm text-slate-700">
              <span className="text-green-600">✓</span> Connected to {facebookStatus.pageName}
              {facebookStatus.hasInstagram && (
                <span className="ml-2">
                  • Instagram: @{facebookStatus.instagramUsername}
                </span>
                )}
              </div>
              {!facebookStatus.hasInstagram && (
                <>
                  <button
                    onClick={handleConnectFacebook}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition-colors text-sm"
                  >
                    Connect Instagram
                  </button>
                  <span className="text-xs text-yellow-400">
                    Link an Instagram Business account to your Facebook Page to enable posting.
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-3xl font-bold text-slate-900 mb-2">{draftsCount}</div>
          <div className="text-sm font-medium text-slate-600">Drafts</div>
        </div>
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-3xl font-bold text-slate-900 mb-2">{scheduledCount}</div>
          <div className="text-sm font-medium text-slate-600">Scheduled</div>
        </div>
        <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="text-3xl font-bold text-slate-900 mb-2">{postedCount}</div>
          <div className="text-sm font-medium text-slate-600">Posted</div>
        </div>
      </div>

      {/* Create New Ad Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Ad</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={openManualForm}
            className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium">Blank Ad</span>
          </button>
          <button
            onClick={openTemplateSelector}
            className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-lg bg-yellow-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium">Use Template</span>
          </button>
          <button
            onClick={openAIForm}
            className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium">AI Generate</span>
          </button>
        </div>
      </div>

      {/* Your Ads Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Ads</h2>
        {templates.length === 0 ? (
          <div className="bg-blue-50 backdrop-blur-xl rounded-xl p-12 border border-blue-200 shadow-lg flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="text-slate-600 text-lg">No ads yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-blue-50 backdrop-blur-xl rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                  <h3 className="font-semibold text-slate-900 text-xl mb-2">{template.headline}</h3>
                  <p className="text-sm text-slate-600">
                    {template.service} - {template.city}
                  </p>
                  </div>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-slate-700 mb-4">{template.body}</p>
                <div className="space-y-3">
                  {template.fb_caption && (
                    <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Facebook</span>
                        <div className="flex gap-2">
                          {facebookStatus?.connected && (
                            <button
                              onClick={() => handlePost(template.id, 'facebook', template.fb_caption!)}
                              disabled={posting[`${template.id}-facebook`]}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {posting[`${template.id}-facebook`] ? 'Posting...' : 'Post'}
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(template.fb_caption!)}
                            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{template.fb_caption}</p>
                    </div>
                  )}
                  {template.craigslist_caption && (
                    <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Craigslist</span>
                        <button
                          onClick={() => copyToClipboard(template.craigslist_caption!)}
                          className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{template.craigslist_caption}</p>
                      <p className="text-xs text-yellow-600 mt-1">Note: Craigslist requires manual posting</p>
                    </div>
                  )}
                  {template.instagram_caption && (
                    <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Instagram</span>
                        <div className="flex gap-2">
                          {facebookStatus?.connected && facebookStatus.hasInstagram && (
                            <button
                              onClick={() => handlePost(template.id, 'instagram', template.instagram_caption!)}
                              disabled={posting[`${template.id}-instagram`]}
                              className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {posting[`${template.id}-instagram`] ? 'Posting...' : 'Post'}
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(template.instagram_caption!)}
                            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{template.instagram_caption}</p>
                      {facebookStatus?.connected && !facebookStatus.hasInstagram && (
                        <p className="text-xs text-yellow-600 mt-1">Connect Instagram Business Account to post</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Ad Form Modal */}
      {showForm && formMode && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-xl p-8 w-full max-w-2xl shadow-2xl border border-blue-200 max-h-[90vh] overflow-y-auto">
            {formMode === 'manual' ? (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Blank Ad</h2>
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Service</label>
                      <input
                        type="text"
                        value={manualData.service}
                        onChange={(e) => setManualData({ ...manualData, service: e.target.value })}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                        placeholder="Drain Cleaning"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        value={manualData.city}
                        onChange={(e) => setManualData({ ...manualData, city: e.target.value })}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                        placeholder="San Francisco"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Headline</label>
                    <input
                      type="text"
                      value={manualData.headline}
                      onChange={(e) => setManualData({ ...manualData, headline: e.target.value })}
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                      placeholder="Catchy headline for your ad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Body</label>
                    <textarea
                      value={manualData.body}
                      onChange={(e) => setManualData({ ...manualData, body: e.target.value })}
                      required
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                      placeholder="Main description for your ad"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Facebook Caption (optional)</label>
                      <textarea
                        value={manualData.fbCaption}
                        onChange={(e) => setManualData({ ...manualData, fbCaption: e.target.value })}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                        placeholder="Copy for Facebook"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Craigslist Caption (optional)</label>
                      <textarea
                        value={manualData.craigslistCaption}
                        onChange={(e) => setManualData({ ...manualData, craigslistCaption: e.target.value })}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                        placeholder="Copy for Craigslist"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Instagram Caption (optional)</label>
                      <textarea
                        value={manualData.instagramCaption}
                        onChange={(e) => setManualData({ ...manualData, instagramCaption: e.target.value })}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                        placeholder="Copy for Instagram"
                      />
                    </div>
                  </div>
                {/* Auto-post options */}
                <div className="mt-2 rounded-lg border border-blue-200 bg-blue-100 p-4">
                  <div className="text-sm font-medium text-slate-700 mb-3">Auto-post after saving</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!facebookStatus?.connected}
                      onClick={() => setAutoPost({ ...autoPost, facebook: !autoPost.facebook })}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        autoPost.facebook
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
                          : 'bg-white text-slate-700 hover:bg-blue-50'
                      } ${!facebookStatus?.connected ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      Post to Facebook Page
                    </button>
                    <button
                      type="button"
                      disabled={!(facebookStatus?.connected && facebookStatus.hasInstagram)}
                      onClick={() => setAutoPost({ ...autoPost, instagram: !autoPost.instagram })}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        autoPost.instagram
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40'
                          : 'bg-white text-slate-700 hover:bg-purple-50'
                      } ${!(facebookStatus?.connected && facebookStatus.hasInstagram) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      Post to Instagram
                    </button>
                  </div>
                  {!facebookStatus?.connected && (
                    <p className="mt-2 text-xs text-yellow-400">Connect Facebook to enable auto-posting.</p>
                  )}
                  {facebookStatus?.connected && !facebookStatus.hasInstagram && (
                    <p className="mt-2 text-xs text-yellow-400">Connect Instagram Business Account to enable Instagram auto-posting.</p>
                  )}
                </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={savingManual}
                      className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/50"
                    >
                      {savingManual ? 'Saving...' : 'Save Ad'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Generate Ad Content</h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                >
                  <option value="" className="bg-white">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name} className="bg-white">
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  >
                    <option value="friendly" className="bg-white">Friendly</option>
                    <option value="professional" className="bg-white">Professional</option>
                    <option value="casual" className="bg-white">Casual</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/50"
                >
                  {generating ? 'Generating...' : 'Generate Ad'}
                </button>
                <button
                  type="button"
                      onClick={handleCloseForm}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-xl p-8 w-full max-w-4xl shadow-2xl border border-blue-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Choose a Template</h2>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-700 mb-6">Select a template to customize and use for your ad. You can edit all fields before saving.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRE_MADE_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  onClick={() => selectTemplate(template)}
                  className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 border border-blue-200 hover:border-blue-300 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-600">{template.service}</span>
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-slate-900 font-medium mb-2 line-clamp-1">{template.headline}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{template.body}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
