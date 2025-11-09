'use client'

import { useEffect } from 'react'
import { usePlaidLink } from 'react-plaid-link'

interface PlaidLinkWrapperProps {
  linkToken: string
  onSuccess: (publicToken: string, metadata: any) => void
  onExit?: (err: any, metadata: any) => void
}

export function PlaidLinkWrapper({ 
  linkToken, 
  onSuccess, 
  onExit,
}: PlaidLinkWrapperProps) {
  // Hook must always be called (React rules)
  // This component only renders when linkToken exists, so it's safe
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  })

  // Auto-open when ready
  useEffect(() => {
    if (ready && open) {
      open()
    }
  }, [ready, open])

  return null
}

