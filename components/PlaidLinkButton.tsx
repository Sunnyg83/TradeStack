'use client'

import dynamic from 'next/dynamic'

// Dynamically import PlaidLinkWrapper to avoid SSR issues with react-plaid-link
const PlaidLinkWrapper = dynamic(
  () => import('./PlaidLinkWrapper').then((mod) => mod.PlaidLinkWrapper),
  { 
    ssr: false,
    loading: () => null,
  }
)

interface PlaidLinkButtonProps {
  linkToken: string | null
  onSuccess: (publicToken: string, metadata: any) => void
  onExit?: (err: any, metadata: any) => void
}

export function PlaidLinkButton({ 
  linkToken, 
  onSuccess, 
  onExit,
}: PlaidLinkButtonProps) {
  // Only render wrapper when we have a token (prevents hook from being called with null)
  if (!linkToken) {
    return null
  }

  return (
    <PlaidLinkWrapper
      linkToken={linkToken}
      onSuccess={onSuccess}
      onExit={onExit}
    />
  )
}

