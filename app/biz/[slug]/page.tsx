import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QuoteForm from '@/components/QuoteForm'
import { formatCurrency } from '@/lib/utils'

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!profile) {
    notFound()
  }

  // Get services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Dark Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-blue-500/20 bg-slate-900/80 backdrop-blur-xl">
          <div className="mx-auto max-w-md px-4 py-8">
            <h1
              className="text-4xl font-bold text-white md:text-5xl"
              style={{ color: profile.brand_color || '#60a5fa' }}
            >
              {profile.business_name}
            </h1>
            <p className="mt-2 text-lg text-slate-300">Serving {profile.service_area}</p>
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="mt-4 inline-block rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/50"
              >
                Call {profile.phone}
              </a>
            )}
          </div>
        </header>

        {/* Services Section */}
        <section className="mx-auto max-w-md px-4 py-12">
          <h2 className="mb-8 text-3xl font-bold text-white">Our Services</h2>
          <div className="space-y-4">
            {services && services.length > 0 ? (
              services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl border border-blue-500/20 bg-slate-800/60 backdrop-blur-xl p-6 shadow-xl"
                >
                  <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                  {service.description && (
                    <p className="mt-2 text-slate-300">{service.description}</p>
                  )}
                  <div className="mt-4 text-lg font-bold text-blue-400">
                    {formatCurrency(service.base_price)}
                    {service.unit && (
                      <span className="ml-2 text-sm font-normal text-slate-400">
                        per {service.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-400 py-12">
                No services available at this time.
              </div>
            )}
          </div>
        </section>

        {/* Quote Form Section */}
        <section className="mx-auto max-w-md px-4 pb-12">
          <div className="rounded-xl border border-blue-500/20 bg-slate-800/60 backdrop-blur-xl p-8 shadow-xl">
            <h2 className="mb-6 text-3xl font-bold text-white">Request a Quote</h2>
            <QuoteForm userId={profile.user_id} services={services || []} />
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-blue-500/20 bg-slate-900/80 backdrop-blur-xl">
          <div className="mx-auto max-w-md px-4 py-8 text-center text-slate-400">
            <p>Powered by TradeStack</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

