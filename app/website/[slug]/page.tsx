import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function WebsitePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // Get website settings
  const { data: websiteSettings } = await supabase
    .from('website_settings')
    .select('*')
    .eq('website_slug', params.slug)
    .eq('is_published', true)
    .single()

  if (!websiteSettings) {
    notFound()
  }

  // Get homepage or all pages
  const { data: homepage } = await supabase
    .from('website_pages')
    .select('*')
    .eq('user_id', websiteSettings.user_id)
    .eq('is_homepage', true)
    .eq('is_published', true)
    .single()

  const { data: allPages } = await supabase
    .from('website_pages')
    .select('*')
    .eq('user_id', websiteSettings.user_id)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  const currentPage = homepage || (allPages && allPages[0])

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Website Under Construction</h1>
          <p className="text-slate-400">This website is being built. Please check back soon!</p>
        </div>
      </div>
    )
  }

  // Get profile for business info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', websiteSettings.user_id)
    .single()

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: websiteSettings.font_family }}>

      {/* Header */}
      <header 
        className="border-b shadow-sm"
        style={{ 
          backgroundColor: websiteSettings.primary_color,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a 
                href={`/website/${params.slug}`}
                className="text-2xl font-bold text-white hover:opacity-90 transition-opacity"
              >
                {profile?.business_name || 'My Website'}
              </a>
            </div>
            {allPages && allPages.length > 1 && (
              <nav className="hidden md:flex gap-6">
                {allPages.map((page) => (
                  <a
                    key={page.id}
                    href={page.is_homepage ? `/website/${params.slug}` : `/website/${params.slug}/${page.slug}`}
                    className="text-white hover:text-gray-200 transition-colors text-sm font-medium"
                  >
                    {page.title}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: websiteSettings.primary_color }}
          >
            {currentPage.title}
          </h1>
          <div 
            className="text-gray-700 text-lg leading-relaxed"
            style={{ 
              lineHeight: '1.8',
            }}
          >
            {currentPage.content?.html ? (
              <div dangerouslySetInnerHTML={{ __html: currentPage.content.html }} />
            ) : currentPage.content?.body ? (
              <div dangerouslySetInnerHTML={{ 
                __html: currentPage.content.body
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/\n/g, '<br />')
                  .replace(/^/, '<p>')
                  .replace(/$/, '</p>')
              }} />
            ) : (
              <p>No content yet. Please add content to this page.</p>
            )}
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer 
        className="mt-16 border-t py-8"
        style={{ 
          backgroundColor: websiteSettings.secondary_color || '#f8f9fa',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center" style={{ color: websiteSettings.primary_color }}>
            <p className="font-medium">{profile?.business_name || 'My Website'}</p>
            {profile?.phone && <p className="text-sm mt-1">{profile.phone}</p>}
            {profile?.email && <p className="text-sm mt-1">{profile.email}</p>}
            <p className="text-sm mt-4 opacity-75">Built with TradeStack</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

