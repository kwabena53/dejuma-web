import { supabase } from './supabase'

export interface OnboardingStatus {
  hasProfile: boolean
  hasCompany: boolean
  isComplete: boolean
}

export async function checkOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    console.log('Checking onboarding status for userId:', userId)
    
    // Check if user has completed profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name, phone_number')
      .eq('id', userId)
      .single()

    console.log('Profile query result - data:', profile, 'error:', profileError)
    const hasProfile = profile && profile.full_name && profile.phone_number

    // Check if user has company (use limit(1) instead of single() to handle multiple companies)
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .limit(1)
    
    const company = companies && companies.length > 0 ? companies[0] : null

    console.log('Company query result - data:', company, 'error:', companyError)
    const hasCompany = !!company

    const status = {
      hasProfile: !!hasProfile,
      hasCompany,
      isComplete: !!hasProfile && hasCompany
    }
    
    console.log('Final onboarding status:', status)
    return status
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return {
      hasProfile: false,
      hasCompany: false,
      isComplete: false
    }
  }
}

export function getRedirectPath(onboardingStatus: OnboardingStatus): string {
  if (!onboardingStatus.isComplete) {
    return '/welcome'
  }
  return '/dashboard'
}