"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
}

const defaultProfile: Profile = {
  id: "",
  first_name: null,
  last_name: null,
  avatar_url: null,
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
  })
  const router = useRouter()

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found'
      console.error("Error fetching profile:", error)
      return defaultProfile
    }
    
    return data || defaultProfile
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const profile = await fetchProfile(session.user.id)
          setAuthState({
            user: session.user,
            session,
            profile,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      }
    )

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id)
        setAuthState({
          user: session.user,
          session,
          profile,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }, [router])

  return {
    ...authState,
    signOut,
    userId: authState.user?.id,
  }
}