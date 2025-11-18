'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WebsiteSettings } from '@/lib/types/database'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function WebsiteBuilderPage() {
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedHTML, setGeneratedHTML] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const autoSaveWebsite = async (htmlToSave?: string) => {
    if (!websiteSettings) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const htmlContent = htmlToSave || code || generatedHTML
      if (!htmlContent) return

      // Check if homepage exists
      const { data: existingPage } = await supabase
        .from('website_pages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_homepage', true)
        .maybeSingle()

      const pageData = {
        user_id: user.id,
        title: 'Home',
        slug: 'home',
        content: { html: htmlContent },
        is_homepage: true,
        is_published: true,
        order_index: 0,
        meta_title: websiteSettings.website_slug || 'Home',
        meta_description: 'Professional business website',
        updated_at: new Date().toISOString(),
      }

      if (existingPage) {
        await supabase
          .from('website_pages')
          .update(pageData)
          .eq('id', existingPage.id)
      } else {
        await supabase.from('website_pages').insert(pageData)
      }

      // Update website settings timestamp
      await supabase
        .from('website_settings')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', websiteSettings.id)

      console.log('Website auto-saved successfully')
    } catch (error) {
      console.error('Error auto-saving website:', error)
      // Don't show alert for auto-save failures
    }
  }

  const getPreviewHTML = (html: string): string => {
    // Inject JavaScript to prevent all link clicks and navigation in preview mode
    // This script runs immediately to prevent any navigation
    const preventNavigationScript = `
      <script>
        (function() {
          // Function to prevent navigation
          function preventNavigation(e) {
            const target = e.target.closest('a');
            if (target) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              // Only allow anchor links to scroll within the page
              const href = target.getAttribute('href');
              if (href && href.startsWith('#') && href !== '#') {
                try {
                  const targetElement = document.querySelector(href);
                  if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                } catch (err) {
                  // Ignore errors
                }
              }
              return false;
            }
          }
          
          // Prevent all link clicks - use capture phase to catch early
          document.addEventListener('click', preventNavigation, true);
          document.addEventListener('mousedown', preventNavigation, true);
          document.addEventListener('mouseup', preventNavigation, true);
          
          // Also prevent on existing links
          function disableAllLinks() {
            document.querySelectorAll('a').forEach(link => {
              const href = link.getAttribute('href');
              
              // Remove href for non-anchor links to prevent navigation
              if (href && !href.startsWith('#')) {
                link.setAttribute('data-original-href', href);
                link.removeAttribute('href');
                link.style.cursor = 'default';
              }
              
              // Add click handler
              link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const currentHref = this.getAttribute('href') || this.getAttribute('data-original-href');
                if (currentHref && currentHref.startsWith('#') && currentHref !== '#') {
                  try {
                    const target = document.querySelector(currentHref);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  } catch (err) {
                    // Ignore errors
                  }
                }
                return false;
              }, true);
            });
          }
          
          // Run immediately and also on DOMContentLoaded
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', disableAllLinks);
          } else {
            disableAllLinks();
          }
          
          // Also disable links after a short delay to catch dynamically added ones
          setTimeout(disableAllLinks, 100);
          setTimeout(disableAllLinks, 500);
          
          // Prevent form submissions
          document.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }, true);
          
          // Prevent window.location changes
          try {
            let locationOverride = window.location;
            Object.defineProperty(window, 'location', {
              get: function() {
                return locationOverride;
              },
              set: function(value) {
                console.log('Navigation prevented in preview mode');
                return false;
              }
            });
          } catch (err) {
            // Some browsers don't allow location override
          }
          
          // Prevent window.open
          window.open = function() {
            console.log('Window.open prevented in preview mode');
            return null;
          };
          
          // Prevent navigation via history API
          const originalPushState = history.pushState;
          const originalReplaceState = history.replaceState;
          history.pushState = function() {
            console.log('History.pushState prevented in preview mode');
            return false;
          };
          history.replaceState = function() {
            console.log('History.replaceState prevented in preview mode');
            return false;
          };
        })();
      </script>
    `;
    
    // Inject the script in the head for immediate execution, or before closing body
    if (html.includes('<head>')) {
      // Inject right after <head> opening tag for earliest execution
      return html.replace(/<head[^>]*>/i, (match) => match + preventNavigationScript);
    } else if (html.includes('</body>')) {
      return html.replace('</body>', preventNavigationScript + '</body>');
    } else if (html.includes('</html>')) {
      return html.replace('</html>', preventNavigationScript + '</html>');
    } else if (html.includes('<body')) {
      // If body tag exists but no closing tag, add script after body opening
      return html.replace(/<body[^>]*>/i, (match) => match + preventNavigationScript);
    } else {
      // If no body tag, prepend the script
      return preventNavigationScript + html;
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let { data: settingsData } = await supabase
        .from('website_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!settingsData) {
        const defaultSlug = `website-${user.id.slice(0, 8)}-${Math.random().toString(36).substring(2, 9)}`
        const { data: newSettings } = await supabase
          .from('website_settings')
          .insert({
            user_id: user.id,
            website_slug: defaultSlug,
          })
          .select()
          .single()
        
        if (newSettings) {
          settingsData = newSettings
        }
      }

      if (settingsData) {
        setWebsiteSettings(settingsData)
        // Always set deployment URL from database if it exists (persists after refresh)
        if (settingsData.custom_domain) {
          setDeploymentUrl(settingsData.custom_domain)
        }
        setError(null)
      } else {
        setError('Unable to load website settings. Please ensure the database migration has been run.')
      }
      
      // Also load existing homepage HTML if available
      const { data: homepage } = await supabase
        .from('website_pages')
        .select('content')
        .eq('user_id', user.id)
        .eq('is_homepage', true)
        .maybeSingle()
      
      if (homepage?.content?.html) {
        setGeneratedHTML(homepage.content.html)
        setCode(homepage.content.html)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFullWebsite = async () => {
    setGenerating(true)
    setError(null)
    setMessages([])

    try {
      const response = await fetch('/api/ai/generate-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          generateFullWebsite: true,
          pageTitle: 'Home'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate website')
      }

      setGeneratedHTML(data.html)
      setCode(data.html)
      
      // Auto-save after generation
      await autoSaveWebsite(data.html)
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `🎉 Your professional website is ready! I've created a complete website with:\n\n✨ Your business name and branding\n✨ All your services in a beautiful grid layout\n✨ Contact information\n✨ Professional design with proper spacing\n\nYou can now ask me to modify anything! Try:\n• "Make the header darker blue"\n• "Add a contact form"\n• "Increase the font sizes"\n• "Change the button style"\n• "Add more spacing between sections"\n\nWhat would you like to change?`
      }])
    } catch (err: any) {
      console.error('Error generating website:', err)
      setError(err.message || 'Failed to generate website')
    } finally {
      setGenerating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending || !generatedHTML) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setSending(true)

    // Add user message
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)

    try {
      const response = await fetch('/api/ai/chat-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentHTML: code || generatedHTML,
          conversationHistory: newMessages
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update website')
      }

      // Update HTML
      setGeneratedHTML(data.html)
      setCode(data.html)

      // Auto-save after update
      await autoSaveWebsite(data.html)

      // Add assistant response
      setMessages([...newMessages, {
        role: 'assistant',
        content: data.message || 'Website updated successfully!'
      }])
    } catch (err: any) {
      console.error('Error sending message:', err)
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message || 'Failed to update website'}. Please try again.`
      }])
    } finally {
      setSending(false)
    }
  }

  const handleSaveWebsite = async () => {
    if (!generatedHTML || !websiteSettings) {
      alert('Please generate a website first')
      return
    }

    try {
      await autoSaveWebsite()
      alert('Website saved and published successfully!')
      loadData()
    } catch (error) {
      console.error('Error saving website:', error)
      alert('Error saving website')
    }
  }

  const handleDeploy = async () => {
    if (!generatedHTML) {
      alert('Please generate a website first')
      return
    }

    setDeploying(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to deploy')
        return
      }

      // Get profile for website name
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('user_id', user.id)
        .single()

      const websiteName = profile?.business_name || 'My Website'
      const subdomain = websiteSettings?.website_slug || `site-${user.id.slice(0, 8)}`

      const response = await fetch('/api/website/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: generatedHTML,
          websiteName,
          subdomain
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy website')
      }

      // Store deployment URL in state to show in copyable box
      if (data.deploymentUrl) {
        setDeploymentUrl(data.deploymentUrl)
      }
      
      // Reload settings to get updated deployment URL
      loadData()
      
      // Show success message
      if (data.success) {
        alert(`Website deployed successfully! The URL is shown below and can be copied.\n\nNote: It may take a few minutes to go live.`)
      } else {
        alert(`Deployment initiated. ${data.message || 'Check the URL box below for details.'}`)
      }
    } catch (err: any) {
      console.error('Error deploying:', err)
      alert(err.message || 'Failed to deploy website. Make sure VERCEL_TOKEN is set in environment variables.')
    } finally {
      setDeploying(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-slate-300">Loading...</div>
      </div>
    )
  }

  const websiteUrl = websiteSettings?.website_slug && typeof window !== 'undefined'
    ? `${window.location.origin}/website/${websiteSettings.website_slug}`
    : null

  return (
    <div className="pb-8">
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-300 font-semibold mb-1">Database Migration Required</h3>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Deployment URL Box */}
      {(deploymentUrl || websiteSettings?.custom_domain) && (
        <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-green-300 font-semibold mb-2">Website Deployed!</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={deploymentUrl || websiteSettings?.custom_domain || ''}
                  className="flex-1 rounded-lg bg-slate-800/50 border border-slate-600 px-4 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={() => {
                    const url = deploymentUrl || websiteSettings?.custom_domain || ''
                    navigator.clipboard.writeText(url)
                    alert('URL copied to clipboard!')
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <a
                  href={deploymentUrl || websiteSettings?.custom_domain || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-green-500/50 px-4 py-2 text-sm font-medium text-green-300 transition-all hover:bg-green-500/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </a>
              </div>
              <p className="text-green-200/70 text-xs mt-2">Click the input to select, or use the Copy button. It may take a few minutes to go live.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Website Builder</h1>
          <p className="mt-2 text-slate-300">Create and customize your website with AI</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {generatedHTML && (
            <>
              <button
                onClick={handleSaveWebsite}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-400/60 px-6 py-3 font-medium text-blue-100 transition-all hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deploying ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deploying…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Deploy
                  </>
                )}
              </button>
            </>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Website
            </a>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 250px)' }}>
        {/* Website Preview/Editor - Left Side */}
        <div className="flex-1 flex flex-col gap-4">
          {!generatedHTML ? (
            <div className="flex-1 bg-slate-800/60 backdrop-blur-xl rounded-xl border border-blue-500/20 shadow-xl flex items-center justify-center p-12">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <svg className="w-24 h-24 mx-auto text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">AI Website Builder</h3>
                <p className="text-slate-400 mb-6">
                  Generate your complete website in one click using all your business information!
                </p>
                <button
                  onClick={handleGenerateFullWebsite}
                  disabled={generating}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg mx-auto"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Your Website...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate My Website
                    </>
                  )}
                </button>
                <div className="text-sm text-slate-400 space-y-2 bg-slate-800/50 p-4 rounded-lg mt-6 text-left">
                  <p className="font-medium text-white mb-2">✨ Your website will include:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your business name and branding</li>
                    <li>All your services with pricing</li>
                    <li>Your service area and contact info</li>
                    <li>Professional design with your colors</li>
                    <li>Mobile-responsive layout</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-xl border-2 border-blue-500/30 bg-slate-900/50 overflow-hidden shadow-2xl">
              <div className="h-full bg-white overflow-hidden relative">
                <iframe
                  key={code || generatedHTML} // Force reload when HTML changes
                  srcDoc={getPreviewHTML(code || generatedHTML)}
                  className="w-full h-full border-0 pointer-events-auto"
                  title="Website Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  style={{ width: '100%', height: '100%' }}
                  id="website-preview-iframe"
                  onLoad={(e) => {
                    // Additional safety: ensure navigation is prevented after iframe loads
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      if (iframe.contentWindow) {
                        // Prevent any navigation attempts
                        iframe.contentWindow.addEventListener('beforeunload', (event) => {
                          event.preventDefault();
                          return false;
                        });
                      }
                    } catch (err) {
                      // Cross-origin restrictions might prevent this, but that's okay
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Chatbot - Right Side */}
        {generatedHTML && (
          <div className="w-96 flex flex-col bg-slate-800/90 backdrop-blur-xl rounded-xl border border-blue-500/30 shadow-2xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-cyan-600/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Assistant</h3>
                  <p className="text-xs text-slate-300">Modify your website instantly</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm font-medium mb-2">✨ Quick Actions</p>
                    <div className="space-y-2">
                      {[
                        "Make the header darker blue",
                        "Add a contact form",
                        "Increase font sizes",
                        "Change button colors",
                        "Add more spacing",
                        "Make it more modern"
                      ].map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputMessage(suggestion)
                            chatInputRef.current?.focus()
                          }}
                          className="w-full text-left text-xs text-slate-300 hover:text-white hover:bg-slate-700/50 p-2 rounded transition-colors"
                        >
                          💡 {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-center text-slate-400 text-sm">
                    <p className="mb-1">💬 Or type your own request</p>
                    <p className="text-xs">I'll update your website in real-time</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2 flex-shrink-0">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-xl p-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm'
                            : 'bg-slate-700/80 text-slate-100 rounded-bl-sm border border-slate-600/50'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center ml-2 flex-shrink-0">
                          <span className="text-white text-xs font-bold">You</span>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              {sending && (
                <div className="flex justify-start items-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-slate-700/80 text-slate-200 rounded-xl rounded-bl-sm p-3 border border-slate-600/50">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-slate-300">Updating website...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-blue-500/20 bg-slate-800/50">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={chatInputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Ask me to modify your website..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none resize-none text-sm"
                    disabled={sending}
                  />
                  {inputMessage.trim() && (
                    <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                      Press Enter to send
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sending}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-5 py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                >
                  {sending ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {['💙 Change colors', '📝 Add section', '🎨 Make modern', '📱 Improve mobile'].map((quick, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputMessage(quick.replace(/[^\w\s]/g, '').toLowerCase())
                      chatInputRef.current?.focus()
                    }}
                    className="text-xs text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                    disabled={sending}
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && generatedHTML && (
        <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}








