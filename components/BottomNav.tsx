'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: '🏠', activeIcon: '🏠' },
    { href: '/dashboard/services', label: 'Services', icon: '📄', activeIcon: '📄' },
    { href: '/dashboard/leads', label: 'AI CRM', icon: '⚡⭐', activeIcon: '⚡⭐' },
    { href: '/dashboard/ads', label: 'Ads', icon: '📢', activeIcon: '📢' },
    { href: '/dashboard/settings', label: 'Profile', icon: '👤', activeIcon: '👤' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 rounded-t-2xl shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = 
            (item.href === '/dashboard' && pathname === '/dashboard') ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

