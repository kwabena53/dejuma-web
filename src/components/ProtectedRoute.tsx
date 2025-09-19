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
    
    // If onboarding was just completed, clear the flag and allow access
    if (onboardingJustCompleted) {
      console.log('Onboarding just completed, allowing access and clearing flag')
      sessionStorage.removeItem('onboarding_just_completed')
      return
    }
    
    // IMPORTANT: Only redirect if we have a definitive onboarding status
    // If onboardingStatus is null, it might still be loading, so don't redirect yet
    if (!loading && user && onboardingStatus !== null) {
      if (!onboardingStatus.isComplete) {
        // User hasn't completed onboarding, redirect to welcome
        const redirectPath = getRedirectPath(onboardingStatus)
        console.log('User onboarding incomplete - current path:', currentPath, 'redirect path:', redirectPath)
        
        if (currentPath !== redirectPath) {
          console.log('Redirecting from', currentPath, 'to', redirectPath)
          router.push(redirectPath)
        }
      } else {
        console.log('User onboarding is complete, allowing access to protected route')
      }
    } else if (!loading && user && onboardingStatus === null) {
      console.log('Onboarding status is null (likely loading), waiting before making redirect decision')
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