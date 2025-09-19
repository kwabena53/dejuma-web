'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  FileText, 
  User, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  XCircle,
  Check,
  X,
  PenTool,
  AlertCircle
} from 'lucide-react'

interface QuoteItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  total: number
  photo_url?: string
}

interface Quote {
  id: string
  quote_number: string
  title: string
  total_amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  created_at: string
  valid_until: string
  notes?: string
  company_id: string
  client_id: string
  clients: {
    first_name: string
    last_name: string
    company_name?: string
    phone?: string
    email?: string
    property_address?: string
  }
  companies: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
}

export default function ClientQuoteApprovalPage() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signature, setSignature] = useState('')
  const [clientName, setClientName] = useState('')
  const params = useParams()
  const quoteId = params.id as string

  useEffect(() => {
    if (quoteId) {
      fetchQuote()
    }
  }, [quoteId])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      
      // Get quote with client and company info (no authentication required)
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients!inner(first_name, last_name, company_name, phone, email, property_address),
          companies!inner(name, email, phone, address)
        `)
        .eq('id', quoteId)
        .single()

      if (quoteError) {
        if (quoteError.code === 'PGRST116') {
          setError('Quote not found')
        } else {
          throw quoteError
        }
        return
      }

      setQuote(quoteData)
      setClientName(`${quoteData.clients.first_name} ${quoteData.clients.last_name}`)

      // Get quote items
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true })

      if (itemsError && itemsError.code !== 'PGRST116') {
        throw itemsError
      }

      setQuoteItems(itemsData || [])
    } catch (error: any) {
      console.error('Error fetching quote:', error)
      setError('Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveQuote = async () => {
    try {
      setActionLoading('approve')
      
      // Update quote status to 'accepted'
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)

      if (error) throw error

      setQuote(prev => prev ? { ...prev, status: 'accepted' } : null)
      
      // Show success message
      alert('Thank you! Your quote has been approved successfully. We will contact you soon to schedule the work.')
    } catch (error: any) {
      console.error('Error approving quote:', error)
      alert('Failed to approve quote. Please try again.')
    } finally {
      setActionLoading('')
    }
  }

  const handleRejectQuote = async () => {
    if (!confirm('Are you sure you want to reject this quote? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading('reject')
      
      // Update quote status to 'rejected'
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)

      if (error) throw error

      setQuote(prev => prev ? { ...prev, status: 'rejected' } : null)
      
      // Show message
      alert('Quote has been rejected. Thank you for your time.')
    } catch (error: any) {
      console.error('Error rejecting quote:', error)
      alert('Failed to reject quote. Please try again.')
    } finally {
      setActionLoading('')
    }
  }

  const handleSignAndApprove = async () => {
    if (!signature.trim() || !clientName.trim()) {
      alert('Please enter your full name to sign the quote.')
      return
    }

    try {
      setActionLoading('sign')
      
      // Update quote status to 'accepted' with signature
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'accepted',
          client_signature: signature,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)

      if (error) throw error

      setQuote(prev => prev ? { ...prev, status: 'accepted' } : null)
      setShowSignatureModal(false)
      
      // Show success message
      alert('Thank you! Your quote has been signed and approved successfully. We will contact you soon to schedule the work.')
    } catch (error: any) {
      console.error('Error signing quote:', error)
      alert('Failed to sign quote. Please try again.')
    } finally {
      setActionLoading('')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setActionLoading('download')
      // Simulate PDF generation - in real app, you'd generate and download a PDF
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, you would generate a PDF here
      alert('PDF download feature would be implemented here')
    } catch (error) {
      alert('Failed to download PDF')
    } finally {
      setActionLoading('')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent', icon: Mail },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="h-4 w-4 mr-2" />
        {config.label}
      </span>
    )
  }

  const isExpired = quote?.valid_until ? new Date(quote.valid_until) < new Date() : false
  const canTakeAction = quote && quote.status === 'sent' && !isExpired

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading quote...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Quote not found'}</h2>
            <p className="text-gray-600">The quote you're looking for doesn't exist or may have been removed.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quote Review</h1>
                <p className="text-gray-600 mt-1">{quote.quote_number} - {quote.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(quote.status)}
              <button
                onClick={handleDownloadPDF}
                disabled={actionLoading === 'download'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === 'download' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpired && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>This quote has expired.</strong> Please contact us to request an updated quote.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Top */}
      {canTakeAction && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">Review & Approve Your Quote</h2>
              <p className="text-blue-700 mb-6">Please review the details below and let us know your decision.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => setShowSignatureModal(true)}
                  disabled={actionLoading !== ''}
                  className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PenTool className="h-5 w-5 mr-2" />
                  Sign & Approve Quote
                </button>
                <button
                  onClick={handleApproveQuote}
                  disabled={actionLoading !== ''}
                  className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Approve Quote
                    </>
                  )}
                </button>
                <button
                  onClick={handleRejectQuote}
                  disabled={actionLoading !== ''}
                  className="inline-flex items-center px-8 py-3 border border-red-300 rounded-lg shadow-sm text-base font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === 'reject' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 mr-2" />
                      Reject Quote
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Quote Details & Validity */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Quote Details</h3>
                {isExpired && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Expired
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Quote Number</label>
                  <p className="text-lg font-semibold text-gray-900">{quote.quote_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
                  <p className="text-gray-900">{new Date(quote.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Valid Until</label>
                  <p className={`flex items-center ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'No expiry'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Service Provider</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{quote.companies.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {quote.companies.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${quote.companies.email}`} className="hover:text-blue-600 transition-colors">
                          {quote.companies.email}
                        </a>
                      </div>
                    )}
                    {quote.companies.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${quote.companies.phone}`} className="hover:text-blue-600 transition-colors">
                          {quote.companies.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  {quote.companies.address && (
                    <div className="flex items-start text-gray-600 mt-3">
                      <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                      <span>{quote.companies.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quote Items */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Products & Services</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product/Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quoteItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.product_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 max-w-xs">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ${item.unit_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        ${item.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.photo_url ? (
                          <img 
                            src={item.photo_url} 
                            alt={item.product_name}
                            className="h-16 w-16 rounded-lg object-cover border border-gray-300 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(item.photo_url, '_blank')}
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                  <div className="text-3xl font-bold text-gray-900 flex items-center">
                    <DollarSign className="h-8 w-8 mr-1" />
                    {quote.total_amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {canTakeAction && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to proceed?</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    disabled={actionLoading !== ''}
                    className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PenTool className="h-5 w-5 mr-2" />
                    Sign & Approve Quote
                  </button>
                  <button
                    onClick={handleApproveQuote}
                    disabled={actionLoading !== ''}
                    className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'approve' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Approve Quote
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRejectQuote}
                    disabled={actionLoading !== ''}
                    className="inline-flex items-center px-8 py-3 border border-red-300 rounded-lg shadow-sm text-base font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'reject' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 mr-2" />
                        Reject Quote
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              This quote was provided by {quote.companies.name}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Quote #{quote.quote_number} • Generated on {new Date(quote.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSignatureModal(false)
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <PenTool className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
                </div>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name (Digital Signature) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="block w-full px-3 py-3 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Type your full name here"
                  />
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-800">
                    By typing your name above, you are providing a digital signature and agreeing to the terms and conditions of this quote.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowSignatureModal(false)}
                    disabled={actionLoading === 'sign'}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignAndApprove}
                    disabled={actionLoading === 'sign' || !signature.trim()}
                    className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === 'sign' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing...
                      </>
                    ) : (
                      'Sign & Approve'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}