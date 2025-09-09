'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, Phone, Building2, MapPin, Upload, CheckCircle, Globe, Briefcase } from 'lucide-react'

interface UserProfile {
  full_name: string
  phone_number: string
}

interface CompanyInfo {
  name: string
  address: string
  website: string
  industry: string
  logo_url?: string
}

export default function WelcomePage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    full_name: '',
    phone_number: ''
  })

  // Company info state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    address: '',
    website: '',
    industry: ''
  })

  // Handyman service industries
  const industries = [
    'General Handyman Services',
    'Plumbing Services',
    'Electrical Services',
    'Carpentry & Woodworking',
    'Painting & Decorating',
    'Flooring Installation',
    'Roofing & Gutters',
    'HVAC Services',
    'Appliance Repair',
    'Home Security Systems',
    'Landscaping & Yard Work',
    'Cleaning Services',
    'Moving & Packing Services',
    'Furniture Assembly',
    'Drywall & Plastering',
    'Tile & Stone Work',
    'Window & Door Installation',
    'Power Washing',
    'Pest Control',
    'Other'
  ]

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      // Prepopulate full name from Google OAuth if available
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      if (fullName && !userProfile.full_name) {
        setUserProfile(prev => ({ ...prev, full_name: fullName }))
      }
    }
  }, [user, router, userProfile.full_name])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          full_name: userProfile.full_name,
          phone_number: userProfile.phone_number
        })

      if (error) throw error

      setStep(2)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading logo:', error)
      return null
    }
  }

  const handleCompanyInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let logoUrl = null
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile)
      }

      const { error } = await supabase
        .from('companies')
        .insert({
          name: companyInfo.name,
          address: companyInfo.address,
          website: companyInfo.website,
          industry: companyInfo.industry,
          logo_url: logoUrl,
          owner_id: user?.id
        })

      if (error) throw error

      setStep(3)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const stepConfig = {
    1: { title: "Welcome! Let's get to know you", subtitle: "Tell us about yourself" },
    2: { title: "Now, about your business", subtitle: "Set up your company profile" },
    3: { title: "All set!", subtitle: "Your account is ready" }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= i 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > i ? <CheckCircle className="w-5 h-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-8 h-0.5 ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 text-center border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">
              {stepConfig[step as keyof typeof stepConfig].title}
            </h1>
            <p className="text-gray-600 mt-2">
              {stepConfig[step as keyof typeof stepConfig].subtitle}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={userProfile.full_name}
                      onChange={(e) => setUserProfile({...userProfile, full_name: e.target.value})}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={userProfile.phone_number}
                      onChange={(e) => setUserProfile({...userProfile, phone_number: e.target.value})}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleCompanyInfoSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      required
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({...companyInfo, address: e.target.value})}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Enter your company address"
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Website (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="url"
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry/Service Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      required
                      value={companyInfo.industry}
                      onChange={(e) => setCompanyInfo({...companyInfo, industry: e.target.value})}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select your industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Setting up...' : 'Complete Setup'}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to Dejuma!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your account has been successfully set up. Redirecting to your dashboard...
                </p>
                <div className="animate-pulse">
                  <div className="h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}