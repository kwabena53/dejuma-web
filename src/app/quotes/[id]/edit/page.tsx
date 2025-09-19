'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { 
  User, 
  Calendar, 
  Plus, 
  Minus,
  ArrowLeft, 
  CheckCircle,
  Upload,
  X,
  Image as ImageIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  Save
} from 'lucide-react'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface ProductRow {
  id: string
  name: string
  description: string
  quantity: number
  unit_price: number
  total: number
  photo?: File | null
  photo_url?: string
  quote_item_id?: string // For existing quote items
}

interface QuoteData {
  title: string
  client_id: string
  valid_until: string
  notes: string
  products: ProductRow[]
}

interface NewClientData {
  first_name: string
  last_name: string
  company_name: string
  phone: string
  email: string
  property_address: string
}

export default function EditQuotePage() {
  const [quoteData, setQuoteData] = useState<QuoteData>({
    title: '',
    client_id: '',
    valid_until: '',
    notes: '',
    products: []
  })
  const [originalQuote, setOriginalQuote] = useState<any>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [userCompany, setUserCompany] = useState<any>(null)
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientLoading, setClientLoading] = useState(false)
  const [clientError, setClientError] = useState('')
  const [newClientData, setNewClientData] = useState<NewClientData>({
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    email: '',
    property_address: ''
  })
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchQuoteAndClients()
  }, [user, router, quoteId])

  const fetchQuoteAndClients = async () => {
    try {
      setFetchLoading(true)
      
      // Get user's company
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('owner_id', user?.id)
        .limit(1)
      
      const company = companies && companies.length > 0 ? companies[0] : null
      
      if (company) {
        setUserCompany(company)
        
        // Get quote data with client info
        const { data: quoteFromDB, error: quoteError } = await supabase
          .from('quotes')
          .select(`
            *,
            clients!inner(first_name, last_name, email)
          `)
          .eq('id', quoteId)
          .eq('company_id', company.id)
          .single()

        if (quoteError) {
          if (quoteError.code === 'PGRST116') {
            setError('Quote not found')
          } else {
            throw quoteError
          }
          return
        }

        setOriginalQuote(quoteFromDB)

        // Get quote items
        const { data: quoteItems, error: itemsError } = await supabase
          .from('quote_items')
          .select('*')
          .eq('quote_id', quoteId)
          .order('created_at', { ascending: true })

        if (itemsError && itemsError.code !== 'PGRST116') {
          throw itemsError
        }

        // Transform quote items to ProductRow format
        const products: ProductRow[] = (quoteItems || []).map((item, index) => ({
          id: (index + 1).toString(),
          quote_item_id: item.id,
          name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          photo: null,
          photo_url: item.photo_url
        }))

        // Set quote data
        setQuoteData({
          title: quoteFromDB.title || '',
          client_id: quoteFromDB.client_id || '',
          valid_until: quoteFromDB.valid_until ? quoteFromDB.valid_until.split('T')[0] : '',
          notes: quoteFromDB.notes || '',
          products: products.length > 0 ? products : [
            {
              id: '1',
              name: '',
              description: '',
              quantity: 1,
              unit_price: 0,
              total: 0,
              photo: null
            }
          ]
        })

        // Get clients for dropdown
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email')
          .eq('company_id', company.id)
          .order('first_name')

        if (clientsError) throw clientsError
        setClients(clientsData || [])
        
      } else {
        console.error('No company found for user:', companyError)
        router.push('/welcome')
      }
    } catch (error: any) {
      console.error('Error fetching quote:', error)
      setError('Failed to load quote data')
    } finally {
      setFetchLoading(false)
    }
  }

  const calculateProductTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice
  }

  const updateProduct = (productId: string, field: keyof ProductRow, value: any) => {
    setQuoteData(prev => ({
      ...prev,
      products: prev.products.map(product => {
        if (product.id === productId) {
          const updatedProduct = { ...product, [field]: value }
          if (field === 'quantity' || field === 'unit_price') {
            updatedProduct.total = calculateProductTotal(
              field === 'quantity' ? value : product.quantity,
              field === 'unit_price' ? value : product.unit_price
            )
          }
          return updatedProduct
        }
        return product
      })
    }))
  }

  const addProduct = () => {
    const newId = (quoteData.products.length + 1).toString()
    setQuoteData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: newId,
          name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
          photo: null
        }
      ]
    }))
  }

  const removeProduct = (productId: string) => {
    if (quoteData.products.length > 1) {
      setQuoteData(prev => ({
        ...prev,
        products: prev.products.filter(product => product.id !== productId)
      }))
    }
  }

  const handlePhotoUpload = (productId: string, file: File) => {
    updateProduct(productId, 'photo', file)
    
    // Create a preview URL for the uploaded file
    const previewUrl = URL.createObjectURL(file)
    updateProduct(productId, 'photo_url', previewUrl)
  }

  const removePhoto = (productId: string) => {
    updateProduct(productId, 'photo', null)
    updateProduct(productId, 'photo_url', '')
  }

  const getTotalAmount = () => {
    return quoteData.products.reduce((sum, product) => sum + product.total, 0)
  }

  const generateQuoteNumber = (companyName: string) => {
    const prefix = companyName.substring(0, 2).toUpperCase()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}-${randomNum}`
  }

  const addNewClient = async () => {
    try {
      setClientLoading(true)
      setClientError('')

      if (!userCompany) {
        throw new Error('Company not found')
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...newClientData,
          company_id: userCompany.id,
          created_at: new Date().toISOString()
        })
        .select('id, first_name, last_name, email')
        .single()

      if (error) throw error

      // Add new client to clients list and select it
      const newClient = data
      setClients(prev => [...prev, newClient])
      setQuoteData(prev => ({ ...prev, client_id: newClient.id }))
      
      // Reset form and close modal
      setNewClientData({
        first_name: '',
        last_name: '',
        company_name: '',
        phone: '',
        email: '',
        property_address: ''
      })
      setShowClientModal(false)
      showSuccess(`Client ${newClient.first_name} ${newClient.last_name} added successfully!`)
    } catch (error: any) {
      showError(`Failed to add client: ${error.message}`)
      setClientError(error.message)
    } finally {
      setClientLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!userCompany) {
        throw new Error('Company not found')
      }

      if (!quoteData.title.trim()) {
        throw new Error('Quote title is required')
      }

      if (!quoteData.client_id) {
        throw new Error('Please select a client')
      }

      if (quoteData.products.length === 0 || quoteData.products.every(p => !p.name.trim())) {
        throw new Error('At least one product/service is required')
      }

      const totalAmount = getTotalAmount()

      // Update quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          title: quoteData.title,
          client_id: quoteData.client_id,
          total_amount: totalAmount,
          valid_until: quoteData.valid_until || null,
          notes: quoteData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .eq('company_id', userCompany.id)

      if (quoteError) throw quoteError

      // Delete existing quote items
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quoteId)

      if (deleteError) throw deleteError

      // Insert updated quote items
      const quoteItemsData = quoteData.products
        .filter(product => product.name.trim())
        .map(product => ({
          quote_id: quoteId,
          product_name: product.name,
          description: product.description,
          quantity: product.quantity,
          unit_price: product.unit_price,
          total: product.total,
          photo_url: product.photo_url || null,
          created_at: new Date().toISOString()
        }))

      if (quoteItemsData.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItemsData)

        if (itemsError) throw itemsError
      }

      showSuccess('Quote updated successfully!')
      router.push(`/quotes/${quoteId}`)
    } catch (error: any) {
      showError(`Failed to update quote: ${error.message}`)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading quote...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error && !originalQuote) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
              <Link
                href="/quotes"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quotes
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Quote</h1>
                <p className="text-gray-600 mt-1">Update quote details and items</p>
              </div>
              <Link
                href={`/quotes/${quoteId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quote
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-6 py-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Quote Details */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Quote Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Quote Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={quoteData.title}
                        onChange={(e) => setQuoteData(prev => ({ ...prev, title: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter quote title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Valid Until
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          value={quoteData.valid_until}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, valid_until: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Client *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowClientModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        + Add New Client
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        required
                        value={quoteData.client_id}
                        onChange={(e) => setQuoteData(prev => ({ ...prev, client_id: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.first_name} {client.last_name} ({client.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={quoteData.notes}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Additional notes or terms..."
                    />
                  </div>
                </div>

                {/* Products/Services */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Products & Services</h2>
                    <button
                      type="button"
                      onClick={addProduct}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-6">
                    {quoteData.products.map((product, index) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-md font-medium text-gray-900">Item #{index + 1}</h3>
                          {quoteData.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProduct(product.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Product/Service Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={product.name}
                              onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter product name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Photo
                            </label>
                            <div className="flex items-center space-x-2">
                              {product.photo_url ? (
                                <div className="relative">
                                  <img 
                                    src={product.photo_url} 
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(product.id)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <input
                                type="file"
                                id={`photo-${product.id}`}
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handlePhotoUpload(product.id, file)
                                }}
                                className="hidden"
                              />
                              <label
                                htmlFor={`photo-${product.id}`}
                                className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Upload
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            Description
                          </label>
                          <textarea
                            value={product.description}
                            onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                            rows={2}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Product description..."
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateProduct(product.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Unit Price ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={product.unit_price}
                              onChange={(e) => updateProduct(product.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Total
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-medium">
                              ${product.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-end">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Grand Total</div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${getTotalAmount().toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex justify-end space-x-4">
                    <Link
                      href={`/quotes/${quoteId}`}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating Quote...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Quote
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showClientModal && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeClientModal()
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {clientError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                  {clientError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); addNewClient(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientData.first_name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientData.last_name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newClientData.email}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={newClientData.company_name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, company_name: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Property Address
                  </label>
                  <textarea
                    value={newClientData.property_address}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, property_address: e.target.value }))}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter property address"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowClientModal(false)}
                    disabled={clientLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={clientLoading}
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {clientLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
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
      )}
    </ProtectedRoute>
  )
}