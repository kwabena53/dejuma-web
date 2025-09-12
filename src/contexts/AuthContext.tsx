'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { OnboardingStatus, checkOnboardingStatus } from '@/lib/onboarding'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  onboardingStatus: OnboardingStatus | null
  checkOnboarding: () => Promise<OnboardingStatus | null>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  onboardingStatus: null,
  checkOnboarding: async () => null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)

  const checkOnboarding = async (): Promise<OnboardingStatus | null> => {
    if (!user) {
      console.log('No user found, cannot check onboarding status')
      return null
    }
    
    try {
      console.log('Checking onboarding status for user:', user.id)
      const status = await checkOnboardingStatus(user.id)
      console.log('Onboarding status result:', status)
      setOnboardingStatus(status)
      console.log('Updated context onboarding status')
      return status
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      return null
    }
  }

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      // Check onboarding status if user exists
      if (session?.user) {
        await checkOnboardingStatus(session.user.id).then(setOnboardingStatus)
      }
      
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Check onboarding status if user exists, but add a small delay to avoid race conditions
        if (session?.user) {
          setTimeout(async () => {
            const status = await checkOnboardingStatus(session.user.id)
            setOnboardingStatus(status)
          }, 500)
        } else {
          setOnboardingStatus(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/welcome`
      }
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    onboardingStatus,
    checkOnboarding,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}