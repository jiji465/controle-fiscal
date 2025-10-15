"use client"

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/integrations/supabase/client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Controle completo de obrigações fiscais
          </p>
        </div>
        <div className="rounded-xl border bg-card p-8 shadow-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                    brandButtonText: 'hsl(var(--primary-foreground))',
                    defaultButtonBackground: 'hsl(var(--secondary))',
                    defaultButtonBackgroundHover: 'hsl(var(--secondary)/80)',
                    defaultButtonText: 'hsl(var(--secondary-foreground))',
                    inputBackground: 'hsl(var(--input))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputFocus: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                  },
                },
              },
            }}
            providers={[]}
            view="sign_in" // Força a visualização apenas para login
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Seu email',
                  password_label: 'Sua senha',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  social_provider_text: 'Entrar com {{provider}}',
                },
                // Removendo variáveis de sign_up para garantir que não apareça
                forgotten_password: {
                  link_text: 'Esqueceu sua senha?',
                  email_label: 'Seu email',
                  button_label: 'Enviar instruções',
                  loading_button_label: 'Enviando...',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}