'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react'

interface Client {
  id: string
  first_name: string
  last_name: string
  company_name: string
  phone: string
  email: string
  property_address: string
  created_at: string
}

export default function ClientViewPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  useEffect(() => {
    if (user && clientId) {
      fetchClient()
    }
  }, [user, clientId])

  const fetchClient = async () => {
    try {
      setLoading(true)
      
      // First get user's company
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)

      const company = companies && companies.length > 0 ? companies[0] : null

      if (!company) {
        setError('No company found. Please complete your setup.')
        return
      }

      // Get client for this company
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('company_id', company.id)
        .single()

      if (clientError) throw clientError

      setClient(clientData)
    } catch (error: any) {
      console.error('Error fetching client:', error)
      if (error.code === 'PGRST116') {
        setError('Client not found')
      } else {
        setError('Failed to load client')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading client...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !client) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error || 'Client not found'}
              </h2>
              <Link
                href="/clients"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Clients
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {client.first_name} {client.last_name}
                </h1>
                <p className="text-gray-600 mt-1">Client details and information</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href={`/clients/${client.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </Link>
                <Link
                  href="/clients"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Clients
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex items-center mb-6">
                      <div className="bg-blue-100 rounded-full p-3 mr-4">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {client.first_name} {client.last_name}
                        </h2>
                        {client.company_name && (
                          <p className="text-gray-600 flex items-center mt-1">
                            <Building2 className="h-4 w-4 mr-2" />
                            {client.company_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Contact Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                        <div className="space-y-3">
                          {client.phone && (
                            <div className="flex items-center">
                              <Phone className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Phone</p>
                                <a 
                                  href={`tel:${client.phone}`}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  {client.phone}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {client.email && (
                            <div className="flex items-center">
                              <Mail className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Email</p>
                                <a 
                                  href={`mailto:${client.email}`}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  {client.email}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Property Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
                        {client.property_address ? (
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Address</p>
                              <p className="text-gray-600">{client.property_address}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No property address provided</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No recent activity</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Activity with this client will appear here
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-green-600 mr-3" />
                          <span className="text-sm font-medium text-gray-900">Quotes</span>
                        </div>
                        <span className="text-sm text-gray-600">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-yellow-600 mr-3" />
                          <span className="text-sm font-medium text-gray-900">Invoices</span>
                        </div>
                        <span className="text-sm text-gray-600">0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                          <span className="text-sm font-medium text-gray-900">Jobs</span>
                        </div>
                        <span className="text-sm text-gray-600">0</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Details */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Client Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Added</p>
                        <p className="text-sm text-gray-600">
                          {new Date(client.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Client ID</p>
                        <p className="text-xs text-gray-500 font-mono">{client.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}