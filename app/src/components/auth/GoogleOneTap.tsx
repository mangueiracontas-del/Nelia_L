import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

// Tipagem mínima da Google Identity Services (sem @types oficial)
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void
          prompt: () => void
          cancel: () => void
        }
      }
    }
  }
}

interface GoogleIdConfig {
  client_id: string
  callback: (response: { credential: string }) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
}

/**
 * Google One Tap: prompt automático na borda superior da tela.
 * O credential JWT do Google é trocado por uma sessão Supabase.
 */
export function GoogleOneTap() {
  useEffect(() => {
    if (window.google) return // já carregado

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        auto_select: true,
        cancel_on_tap_outside: true,
        callback: async ({ credential }) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential, // JWT do Google One Tap
          })
          if (error) console.error('[GoogleOneTap]', error.message)
        },
      })
      window.google?.accounts.id.prompt()
    }

    document.body.appendChild(script)
    return () => {
      window.google?.accounts.id.cancel()
      script.remove()
    }
  }, [])

  return null // componente headless
}
