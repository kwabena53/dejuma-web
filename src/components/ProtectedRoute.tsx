'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getRedirectPath } from '@/lib/onboarding'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, onboardingStatus } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if onboarding was just completed
    const onboardingJustCompleted = typeof window !== 'undefined' ? sessionStorage.getItem('onboarding_just_completed') : null
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    
    console.log('ProtectedRoute effect - loading:', loading, 'user:', !!user, 'onboardingStatus:', onboardingStatus, 'pathname:', currentPath, 'justCompleted:', !!onboardingJustCompleted)
    
    if (!loading && !user) {
      console.log('No user, redirecting to login')
      router.push('/login')
      return
    }
    
    // If onboarding was just completed, clear the flag and allow access to dashboard
    if (onboardingJustCompleted && currentPath === '/dashboard') {
      console.log('Onboarding just completed, allowing access to dashboard')
      sessionStorage.removeItem('onboarding_just_completed')
      return
    }
    
    if (!loading && user && onboardingStatus && !onboardingStatus.isComplete && !onboardingJustCompleted) {
      // If user is authenticated but hasn't completed onboarding, redirect to welcome
      const redirectPath = getRedirectPath(onboardingStatus)
      console.log('User onboarding incomplete - current path:', currentPath, 'redirect path:', redirectPath)
      
      if (currentPath !== redirectPath) {
        console.log('Redirecting from', currentPath, 'to', redirectPath)
        router.push(redirectPath)
      }
    } else if (!loading && user && onboardingStatus && onboardingStatus.isComplete) {
      console.log('User onboarding is complete, allowing access to protected route')
    }
  }, [user, loading, onboardingStatus, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}