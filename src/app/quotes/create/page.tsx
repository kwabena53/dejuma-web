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
  Settings
} from 'lucide-react'
import TaxConfigModal from '@/components/TaxConfigModal'

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
}

interface TaxConfig {
  name: string
  rate: number
  enabled: boolean
}

interface QuoteData {
  title: string
  client_id: string
  valid_until: string
  notes: string
  products: ProductRow[]
  tax: TaxConfig
}

interface NewClientData {
  first_name: string
  last_name: string
  company_name: string
  phone: string
  email: string
  property_address: string
}

export default function CreateQuotePage() {
  const [quoteData, setQuoteData] = useState<QuoteData>({
    title: '',
    client_id: '',
    valid_until: '',
    notes: '',
    products: [
      {
        id: '1',
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        photo: null
      }
    ],
    tax: {
      name: 'Tax',
      rate: 0,
      enabled: false
    }
  })
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [userCompany, setUserCompany] = useState<any>(null)
  const [showTaxModal, setShowTaxModal] = useState(false)
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

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchClientsAndCompany()
    loadDefaultTaxSetting()
  }, [user, router])

  const fetchClientsAndCompany = async () => {
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
        
        // Get clients for this company
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
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setFetchLoading(false)
    }
  }

  const calculateProductTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice
  }

  const calculateSubtotal = () => {
    return quoteData.products.reduce((sum, product) => sum + product.total, 0)
  }

  const calculateTaxAmount = () => {
    if (!quoteData.tax.enabled) return 0
    return calculateSubtotal() * (quoteData.tax.rate / 100)
  }

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTaxAmount()
  }

  const handleTaxSave = (taxConfig: TaxConfig) => {
    setQuoteData(prev => ({
      ...prev,
      tax: taxConfig
    }))
  }

  const loadDefaultTaxSetting = async () => {
    try {
      // Get user's company
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)

      if (!companies || companies.length === 0) return

      const companyId = companies[0].id

      // Get default tax setting
      const { data: defaultTaxSetting } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_default', true)
        .limit(1)
        .single()

      if (defaultTaxSetting) {
        setQuoteData(prev => ({
          ...prev,
          tax: {
            name: defaultTaxSetting.name,
            rate: defaultTaxSetting.rate,
            enabled: defaultTaxSetting.enabled
          }
        }))
      }
    } catch (error) {
      // Don't log error if no default setting exists
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading default tax setting:', error)
      }
    }
  }

  const updateProduct = (productId: string, field: keyof ProductRow, value: any) => {
    setQuoteData(prev => ({
      ...prev,
      products: prev.products.map(product => {
        if (product.id === productId) {
          const updatedProduct = { ...product, [field]: value }
          
          // Recalculate total if quantity or unit_price changed
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
    const newProduct: ProductRow = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      photo: null
    }
    setQuoteData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }))
  }

  const removeProduct = (productId: string) => {
    if (quoteData.products.length > 1) {
      setQuoteData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productId)
      }))
    }
  }

  const handlePhotoUpload = (productId: string, file: File) => {
    updateProduct(productId, 'photo', file)
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    updateProduct(productId, 'photo_url', previewUrl)
  }

  const removePhoto = (productId: string) => {
    updateProduct(productId, 'photo', null)
    updateProduct(productId, 'photo_url', undefined)
  }

  const openClientModal = () => {
    setShowClientModal(true)
    setClientError('')
    setNewClientData({
      first_name: '',
      last_name: '',
      company_name: '',
      phone: '',
      email: '',
      property_address: ''
    })
  }

  const closeClientModal = () => {
    setShowClientModal(false)
    setClientError('')
  }

  const handleClientInputChange = (field: keyof NewClientData, value: string) => {
    setNewClientData(prev => ({ ...prev, [field]: value }))
  }

  const createNewClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientLoading(true)
    setClientError('')

    try {
      if (!userCompany) {
        throw new Error('Company not found')
      }

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          ...newClientData,
          company_id: userCompany.id,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error

      // Add new client to the list
      setClients(prev => [...prev, {
        id: newClient.id,
        first_name: newClient.first_name,
        last_name: newClient.last_name,
        email: newClient.email
      }])

      // Preselect the new client in the quote
      setQuoteData(prev => ({ ...prev, client_id: newClient.id }))

      // Show success toast and close modal
      showSuccess(`Client ${newClient.first_name} ${newClient.last_name} added successfully!`)
      closeClientModal()
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

      // Generate quote number
      const quoteNumber = `Q-${Date.now()}`

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          quote_number: quoteNumber,
          title: quoteData.title,
          client_id: quoteData.client_id,
          company_id: userCompany.id,
          valid_until: quoteData.valid_until,
          notes: quoteData.notes,
          total_amount: calculateGrandTotal(),
          status: 'draft',
          created_by: user?.id
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      // Create quote items
      const quoteItems = quoteData.products.map(product => ({
        quote_id: quote.id,
        name: product.name,
        description: product.description,
        quantity: product.quantity,
        unit_price: product.unit_price,
        total: product.total,
        // photo_url will be handled separately if we add file upload
      }))

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems)

      if (itemsError) throw itemsError

      showSuccess('Quote created successfully!')
      router.push(`/quotes/${quote.id}`)
    } catch (error: any) {
      showError(`Failed to create quote: ${error.message}`)
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
              <p className="text-gray-600 mt-4">Loading...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Create Quote</h1>
                <p className="text-gray-600 mt-1">Create a new project quote</p>
              </div>
              <Link
                href="/quotes"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quotes
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

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quote Details */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-3">
                        Quote Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={quoteData.title}
                        onChange={(e) => setQuoteData(prev => ({ ...prev, title: e.target.value }))}
                        className="block w-full px-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                        placeholder="Enter quote title"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-base font-semibold text-gray-800">
                          Client *
                        </label>
                        <button
                          type="button"
                          onClick={openClientModal}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add New
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          required
                          value={quoteData.client_id}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, client_id: e.target.value }))}
                          className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select a client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>
                              {client.first_name} {client.last_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-3">
                        Valid Until
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          value={quoteData.valid_until}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, valid_until: e.target.value }))}
                          className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-semibold text-gray-800 mb-3">
                        Notes
                      </label>
                      <textarea
                        value={quoteData.notes}
                        onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                        className="block w-full px-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none"
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Products & Services</h3>
                    <button
                      type="button"
                      onClick={addProduct}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </button>
                  </div>

                  <div className="space-y-6">
                    {quoteData.products.map((product, index) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-medium text-gray-900">Product {index + 1}</h4>
                          {quoteData.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProduct(product.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Product Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={product.name}
                              onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                              className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                              placeholder="Enter product name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateProduct(product.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Unit Price *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={product.unit_price}
                              onChange={(e) => updateProduct(product.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Description
                            </label>
                            <textarea
                              value={product.description}
                              onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                              className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none"
                              placeholder="Product description..."
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Photo
                            </label>
                            <div className="space-y-2">
                              {product.photo_url ? (
                                <div className="relative">
                                  <img 
                                    src={product.photo_url} 
                                    alt="Product" 
                                    className="w-full h-20 object-cover rounded-lg border border-gray-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(product.id)}
                                    className="absolute top-1 right-1 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                  <div className="flex flex-col items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                    <p className="text-xs text-gray-500 mt-1">Upload</p>
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handlePhotoUpload(product.id, file)
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Total
                            </label>
                            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
                              ${product.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Summary */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-end">
                      <div className="text-right min-w-64">
                        {/* Subtotal */}
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="text-sm text-gray-900">${calculateSubtotal().toFixed(2)}</span>
                        </div>
                        
                        {/* Tax */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">
                              {quoteData.tax.enabled ? `${quoteData.tax.name} (${quoteData.tax.rate}%):` : 'Tax:'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowTaxModal(true)}
                              className="ml-2 text-blue-600 hover:text-blue-700 underline text-xs"
                            >
                              Configure
                            </button>
                          </div>
                          <span className="text-sm text-gray-900">${calculateTaxAmount().toFixed(2)}</span>
                        </div>
                        
                        {/* Grand Total */}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-lg font-semibold text-gray-900">Total:</span>
                          <span className="text-2xl font-bold text-gray-900">
                            ${calculateGrandTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-8 py-4 border border-gray-300 rounded-xl text-lg font-semibold text-gray-900 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
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
                        Creating Quote...
                      </div>
                    ) : (
                      'Create Quote'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Client Modal */}
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
                <h3 className="text-xl font-semibold text-gray-900">Add New Client</h3>
                <button
                  type="button"
                  onClick={closeClientModal}
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

              <form onSubmit={createNewClient} className="space-y-6">
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
                        value={newClientData.first_name}
                        onChange={(e) => handleClientInputChange('first_name', e.target.value)}
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
                        value={newClientData.last_name}
                        onChange={(e) => handleClientInputChange('last_name', e.target.value)}
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
                      value={newClientData.company_name}
                      onChange={(e) => handleClientInputChange('company_name', e.target.value)}
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
                        value={newClientData.phone}
                        onChange={(e) => handleClientInputChange('phone', e.target.value)}
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
                        value={newClientData.email}
                        onChange={(e) => handleClientInputChange('email', e.target.value)}
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
                      value={newClientData.property_address}
                      onChange={(e) => handleClientInputChange('property_address', e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 text-lg text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none"
                      placeholder="Enter property address"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={closeClientModal}
                    disabled={clientLoading}
                    className="px-8 py-4 border border-gray-300 rounded-xl text-lg font-semibold text-gray-900 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={clientLoading}
                    className="px-8 py-4 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200"
                  >
                    {clientLoading ? (
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
      )}

      {/* Tax Configuration Modal */}
      <TaxConfigModal
        isOpen={showTaxModal}
        onClose={() => setShowTaxModal(false)}
        onSave={handleTaxSave}
        currentConfig={quoteData.tax}
      />
    </ProtectedRoute>
  )
}