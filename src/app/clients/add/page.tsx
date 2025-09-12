'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, Building2, Phone, Mail, MapPin, CheckCircle, ArrowLeft } from 'lucide-react'

interface ClientData {
  first_name: string
  last_name: string
  company_name: string
  phone: string
  email: string
  property_address: string
}

export default function AddClientPage() {
  const [clientData, setClientData] = useState<ClientData>({
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    email: '',
    property_address: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userCompany, setUserCompany] = useState<any>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Get user's company
    const fetchUserCompany = async () => {
      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()
      
      if (company) {
        setUserCompany(company)
      } else {
        // User doesn't have a company set up
        router.push('/welcome')
      }
    }

    fetchUserCompany()
  }, [user, router])

  const handleInputChange = (field: keyof ClientData, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!userCompany) {
        throw new Error('Company not found')
      }

      const { error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          company_id: userCompany.id,
          created_by: user?.id
        })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard') // or wherever you want to redirect after success
      }, 2000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-2xl">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Client Added Successfully!</h2>
            <p className="text-gray-600 mb-6">
              {clientData.first_name} {clientData.last_name} has been added to your client list.
            </p>
            <div className="animate-pulse">
              <div className="h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-100">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Add New Client</h1>
            <p className="text-lg text-gray-600">Enter client information to add them to your system</p>
          </div>

          <div className="p-10">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={clientData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="Enter first name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Last Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={clientData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={clientData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                    placeholder="Enter company name (optional)"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={clientData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={clientData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              {/* Property Address */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Property Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 pt-4 flex pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    value={clientData.property_address}
                    onChange={(e) => handleInputChange('property_address', e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none"
                    placeholder="Enter property address"
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-4 border border-gray-300 rounded-xl text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding Client...
                    </div>
                  ) : (
                    'Add Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}