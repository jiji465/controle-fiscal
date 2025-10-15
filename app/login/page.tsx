"use client"

import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useSupabaseAuth()
  const { theme } = useTheme()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redireciona se já estiver autenticado
      window.location.href = '/'
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Controle Fiscal</CardTitle>
          <CardDescription>Faça login para acessar o painel de controle.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    defaultButtonBackgroundHover: 'hsl(var(--secondary-foreground))',
                    defaultButtonBorder: 'hsl(var(--border))',
                    defaultButtonText: 'hsl(var(--secondary-foreground))',
                    inputBackground: 'hsl(var(--input))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            providers={['google']}
            redirectTo={
              typeof window !== 'undefined'
                ? `${window.location.origin}/`
                : '/'
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}