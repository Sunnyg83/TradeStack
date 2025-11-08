import Link from 'next/link'

export default function SetupRequiredPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Dark Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.08),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                TradeStack
              </span>
            </Link>
            <h1 className="mb-4 text-3xl font-bold text-white">Setup Required</h1>
            <p className="text-slate-300">
              You need to configure your Supabase credentials to use TradeStack.
            </p>
          </div>

          <div className="space-y-6 rounded-xl bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 p-8 shadow-xl">
            <div className="rounded-lg bg-blue-950/30 border border-blue-500/20 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Quick Setup Guide</h2>
              <ol className="list-decimal list-inside space-y-3 text-slate-300">
                <li>
                  <strong className="text-white">Create a Supabase project:</strong>
                  <br />
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Go to Supabase Dashboard
                  </a>
                </li>
                <li>
                  <strong className="text-white">Get your API credentials:</strong>
                  <br />
                  <span className="text-slate-300">Go to Settings → API in your Supabase project</span>
                </li>
                <li>
                  <strong className="text-white">Run the database schema:</strong>
                  <br />
                  <span className="text-slate-300">
                    Copy the SQL from <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">supabase/schema.sql</code> and run it in the SQL Editor
                  </span>
                </li>
                <li>
                  <strong className="text-white">Update .env.local:</strong>
                  <br />
                  <span className="text-slate-300">
                    Edit the <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">.env.local</code> file in your project root with your credentials:
                  </span>
                  <pre className="mt-2 rounded bg-slate-900 border border-slate-700 p-4 text-sm overflow-x-auto text-slate-300">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key`}
                  </pre>
                </li>
                <li>
                  <strong className="text-white">Restart the dev server:</strong>
                  <br />
                  <span className="text-slate-300">
                    Stop the server (Ctrl+C) and run <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">npm run dev</code> again
                  </span>
                </li>
              </ol>
            </div>

            <div className="rounded-lg bg-yellow-950/30 border border-yellow-500/20 p-6">
              <h3 className="mb-2 font-semibold text-yellow-400">Need Help?</h3>
              <p className="text-sm text-slate-300">
                Check the <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">README.md</code> file for detailed
                setup instructions.
              </p>
            </div>

            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-center font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/50"
              >
                Go Home
              </Link>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-center font-semibold text-slate-300 transition-all hover:bg-slate-800/70 hover:border-slate-500"
              >
                Open Supabase
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

