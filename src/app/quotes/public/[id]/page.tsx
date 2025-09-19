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
  XCircle
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

export default function PublicQuoteViewPage() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const params = useParams()
  const quoteId = params.id as string

  useEffect(() => {
    if (quoteId) {
      fetchPublicQuote()
    }
  }, [quoteId])

  const fetchPublicQuote = async () => {
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
      console.error('Error fetching public quote:', error)
      setError('Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true)
      // Simulate PDF generation - in real app, you'd generate and download a PDF
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, you would generate a PDF here
      alert('PDF download feature would be implemented here')
    } catch (error) {
      alert('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent', icon: Mail },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    )
  }

  const isExpired = quote?.valid_until ? new Date(quote.valid_until) < new Date() : false

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
                <h1 className="text-3xl font-bold text-gray-900">{quote.quote_number}</h1>
                <p className="text-gray-600 mt-1">{quote.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(quote.status)}
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
              <h3 className="text-lg font-semibold text-gray-900">From</h3>
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

          {/* Client Information */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">To</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 rounded-full p-3">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {quote.clients.first_name} {quote.clients.last_name}
                  </h4>
                  {quote.clients.company_name && (
                    <div className="flex items-center text-gray-600 mt-1">
                      <Building2 className="h-4 w-4 mr-2" />
                      {quote.clients.company_name}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {quote.clients.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{quote.clients.phone}</span>
                      </div>
                    )}
                    {quote.clients.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{quote.clients.email}</span>
                      </div>
                    )}
                  </div>
                  {quote.clients.property_address && (
                    <div className="flex items-start text-gray-600 mt-3">
                      <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                      <span>{quote.clients.property_address}</span>
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
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-gray-900 flex items-center">
                    <DollarSign className="h-6 w-6 mr-1" />
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

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              This quote was generated by {quote.companies.name}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Quote #{quote.quote_number} • Generated on {new Date(quote.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}