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
  FileText, 
  User, 
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Download,
  ExternalLink,
  MoreVertical,
  ChevronDown
} from 'lucide-react'

interface Quote {
  id: string
  quote_number: string
  client_id: string
  client_name: string
  title: string
  total_amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  created_at: string
  valid_until: string
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; quote: Quote | null }>({
    open: false,
    quote: null
  })
  const [deleting, setDeleting] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchQuotes()
    }
  }, [user])

  const fetchQuotes = async () => {
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

      // Get quotes for this company with client info
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients!inner(first_name, last_name)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

      if (quotesError) throw quotesError

      // Transform data to include client_name
      const transformedQuotes = (quotesData || []).map(quote => ({
        ...quote,
        client_name: `${quote.clients.first_name} ${quote.clients.last_name}`
      }))

      setQuotes(transformedQuotes)
    } catch (error: any) {
      console.error('Error fetching quotes:', error)
      setError('Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = quotes.filter(quote =>
    quote.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openDeleteModal = (quote: Quote) => {
    setDeleteModal({ open: true, quote })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, quote: null })
  }

  const toggleDropdown = (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown(openDropdown === quoteId ? null : quoteId)
  }

  const closeDropdown = () => {
    setOpenDropdown(null)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const target = event.target as HTMLElement
        // Don't close if clicking on dropdown button or dropdown content
        if (!target.closest('[data-dropdown-button]') && !target.closest('[data-dropdown-menu]')) {
          setOpenDropdown(null)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  const deleteQuote = async () => {
    if (!deleteModal.quote) return

    try {
      setDeleting(true)
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', deleteModal.quote.id)

      if (error) throw error

      setQuotes(quotes.filter(q => q.id !== deleteModal.quote.id))
      showSuccess('Quote deleted successfully!')
      closeDeleteModal()
    } catch (error: any) {
      console.error('Error deleting quote:', error)
      showError('Failed to delete quote')
      setError('Failed to delete quote')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
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
                <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
                <p className="text-gray-600 mt-1">Manage your project quotes</p>
              </div>
              <Link
                href="/quotes/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Quote
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
                  placeholder="Search quotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="text-sm text-gray-500">
                {filteredQuotes.length} of {quotes.length} quotes
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-6" style={{position: 'relative'}}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading quotes...</p>
                </div>
              ) : filteredQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No quotes found' : 'No quotes yet'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    {searchTerm 
                      ? 'Try adjusting your search terms or create a new quote.'
                      : 'Get started by creating your first quote for a client project.'
                    }
                  </p>
                  {!searchTerm && (
                    <Link
                      href="/quotes/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Quote
                    </Link>
                  )}
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg overflow-visible">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quote
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valid Until
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredQuotes.map((quote) => (
                        <tr 
                          key={quote.id} 
                          onClick={() => router.push(`/quotes/${quote.id}`)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-green-100 rounded-full p-2 mr-3">
                                <FileText className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {quote.quote_number}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {quote.title}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <User className="h-3 w-3 mr-2 text-gray-400" />
                              {quote.client_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                              ${quote.total_amount?.toLocaleString() || '0'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(quote.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                              {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative">
                              <button
                                onClick={(e) => toggleDropdown(quote.id, e)}
                                className="inline-flex items-center px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
                                title="More actions"
                                data-dropdown-button
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              
                              {openDropdown === quote.id && (
                                <div 
                                  className="absolute right-0 z-[9999] mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1" 
                                  data-dropdown-menu
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: '0',
                                    zIndex: 9999
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/quotes/${quote.id}`)
                                      closeDropdown()
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Eye className="h-4 w-4 mr-3 text-gray-400" />
                                    View Quote
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const previewWindow = window.open(`/preview/quote/${quote.id}`, '_blank')
                                      if (!previewWindow) {
                                        // Fallback if popup is blocked - copy to clipboard and show message
                                        const previewUrl = `${window.location.origin}/preview/quote/${quote.id}`
                                        navigator.clipboard.writeText(previewUrl).then(() => {
                                          showSuccess('Preview link copied to clipboard! Paste it in a new tab.')
                                        }).catch(() => {
                                          showError(`Preview URL: ${previewUrl}`)
                                        })
                                      }
                                      closeDropdown()
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-3 text-gray-400" />
                                    Preview as Client
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/quotes/${quote.id}/edit`)
                                      closeDropdown()
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Edit className="h-4 w-4 mr-3 text-gray-400" />
                                    Edit Quote
                                  </button>
                                  
                                  <div className="border-t border-gray-100 my-1"></div>
                                  
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      closeDropdown()
                                      try {
                                        // Navigate to quote view page where PDF download is implemented
                                        router.push(`/quotes/${quote.id}`)
                                      } catch (error) {
                                        showError('Failed to navigate to quote page')
                                      }
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Download className="h-4 w-4 mr-3 text-gray-400" />
                                    Download PDF
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openDeleteModal(quote)
                                      closeDropdown()
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 mr-3 text-red-400" />
                                    Delete Quote
                                  </button>
                                </div>
                              )}
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
      {deleteModal.open && deleteModal.quote && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteModal({ open: false, quote: null })
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-2 mr-3">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Quote</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete quote <span className="font-semibold">
                  {deleteModal.quote.quote_number}
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
                  onClick={deleteQuote}
                  disabled={deleting}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Quote'
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