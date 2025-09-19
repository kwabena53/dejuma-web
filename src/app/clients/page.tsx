'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { 
  Plus, 
  Search, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Trash2,
  Eye
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; client: Client | null }>({
    open: false,
    client: null
  })
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  const fetchClients = async () => {
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

      // Get clients for this company
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (clientsError) throw clientsError

      setClients(clientsData || [])
    } catch (error: any) {
      console.error('Error fetching clients:', error)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  )

  const openDeleteModal = (client: Client) => {
    setDeleteModal({ open: true, client })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, client: null })
  }

  const deleteClient = async () => {
    if (!deleteModal.client) return

    try {
      setDeleting(true)
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', deleteModal.client.id)

      if (error) throw error

      setClients(clients.filter(c => c.id !== deleteModal.client.id))
      showSuccess(`Client ${deleteModal.client.first_name} ${deleteModal.client.last_name} deleted successfully!`)
      closeDeleteModal()
    } catch (error: any) {
      console.error('Error deleting client:', error)
      showError('Failed to delete client')
      setError('Failed to delete client')
    } finally {
      setDeleting(false)
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                <p className="text-gray-600 mt-1">Manage your client database</p>
              </div>
              <Link
                href="/clients/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Link>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="text-sm text-gray-500">
                {filteredClients.length} of {clients.length} clients
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No clients found' : 'No clients yet'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    {searchTerm 
                      ? 'Try adjusting your search terms or add a new client.'
                      : 'Get started by adding your first client to begin managing your handyman business.'
                    }
                  </p>
                  {!searchTerm && (
                    <Link
                      href="/clients/add"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Client
                    </Link>
                  )}
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Added
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClients.map((client) => (
                        <tr 
                          key={client.id} 
                          onClick={() => router.push(`/clients/${client.id}`)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 rounded-full p-2 mr-3">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {client.first_name} {client.last_name}
                                </div>
                                {client.company_name && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    {client.company_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {client.phone && (
                                <div className="text-sm text-gray-900 flex items-center">
                                  <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                  <a 
                                    href={`tel:${client.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-blue-600 transition-colors"
                                  >
                                    {client.phone}
                                  </a>
                                </div>
                              )}
                              {client.email && (
                                <div className="text-sm text-gray-900 flex items-center">
                                  <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                  <a 
                                    href={`mailto:${client.email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-blue-600 transition-colors"
                                  >
                                    {client.email}
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {client.property_address && (
                              <div className="text-sm text-gray-900 flex items-start">
                                <MapPin className="h-3 w-3 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="max-w-xs truncate">{client.property_address}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(client.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/clients/${client.id}`)
                                }}
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                title="View client"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/clients/${client.id}/edit`)
                                }}
                                className="text-gray-400 hover:text-green-600 transition-colors"
                                title="Edit client"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDeleteModal(client)
                                }}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete client"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.client && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteModal({ open: false, client: null })
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Client</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">
                  {deleteModal.client.first_name} {deleteModal.client.last_name}
                </span>? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteClient}
                  disabled={deleting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Client'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}