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
  ArrowLeft, 
  Plus, 
  Trash2,
  Image as ImageIcon,
  X,
  User,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import TaxConfigModal from '@/components/TaxConfigModal'
import PaymentMethodModal from '@/components/PaymentMethodModal'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name?: string
  property_address?: string
}

interface InvoiceItem {
  id: string
  name: string
  description: string
  quantity: number
  unit_price: number
  total: number
  photo_url?: string
}

interface TaxConfig {
  name: string
  rate: number
  enabled: boolean
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  account_details: any
  is_active: boolean
  is_default: boolean
}

interface NewClientData {
  first_name: string
  last_name: string
  company_name: string
  phone: string
  email: string
  property_address: string
}

export default function CreateInvoicePage() {
  const [invoice, setInvoice] = useState({
    title: '',
    client_id: '',
    due_date: '',
    notes: ''
  })
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    name: 'Tax',
    rate: 0,
    enabled: false
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    }
  ])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showTaxModal, setShowTaxModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
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
  const [userCompany, setUserCompany] = useState<any>(null)
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchClients()
      loadDefaultTaxSetting()
      loadDefaultPaymentMethod()
      // Set default due date to 30 days from now
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)
      setInvoice(prev => ({
        ...prev,
        due_date: dueDate.toISOString().split('T')[0]
      }))
    }
  }, [user])

  const fetchClients = async () => {
    try {
      setLoading(true)
      
      // First get user's company
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .eq('owner_id', user?.id)
        .limit(1)

      const company = companies && companies.length > 0 ? companies[0] : null

      if (!company) {
        setError('No company found. Please complete your setup.')
        return
      }

      setUserCompany(company)

      // Get clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company.id)
        .order('first_name')

      if (clientsError) throw clientsError

      setClients(clientsData || [])
    } catch (error: any) {
      console.error('Error fetching clients:', error)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        
        // Recalculate total when quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total = updatedItem.quantity * updatedItem.unit_price
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTax = () => {
    if (!taxConfig.enabled) return 0
    return calculateSubtotal() * (taxConfig.rate / 100)
  }

  const handleTaxSave = (newTaxConfig: TaxConfig) => {
    setTaxConfig(newTaxConfig)
    // Update the invoice tax_rate for backward compatibility
    setInvoice(prev => ({
      ...prev,
      tax_rate: newTaxConfig.enabled ? newTaxConfig.rate : 0
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
        const newTaxConfig = {
          name: defaultTaxSetting.name,
          rate: defaultTaxSetting.rate,
          enabled: defaultTaxSetting.enabled
        }
        setTaxConfig(newTaxConfig)
        setInvoice(prev => ({
          ...prev,
          tax_rate: newTaxConfig.enabled ? newTaxConfig.rate : 0
        }))
      }
    } catch (error) {
      // Don't log error if no default setting exists
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading default tax setting:', error)
      }
    }
  }

  const loadDefaultPaymentMethod = async () => {
    try {
      // Get user's company
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)

      if (!companies || companies.length === 0) return

      const companyId = companies[0].id

      // Get default payment method
      const { data: defaultPaymentMethod } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_default', true)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (defaultPaymentMethod) {
        setSelectedPaymentMethod(defaultPaymentMethod)
      }
    } catch (error) {
      // Don't log error if no default setting exists
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading default payment method:', error)
      }
    }
  }

  const handlePaymentMethodSave = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod)
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
      setClients(prev => [...prev, newClient])

      // Preselect the new client in the invoice
      setInvoice(prev => ({ ...prev, client_id: newClient.id }))

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

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString()
    return `INV-${timestamp.slice(-8)}`
  }

  const handleSave = async (status: 'draft' | 'sent' = 'draft') => {
    // Validate required fields
    if (!invoice.title.trim()) {
      showError('Invoice title is required')
      return
    }

    if (!invoice.client_id) {
      showError('Please select a client')
      return
    }

    if (items.some(item => !item.name.trim())) {
      showError('All items must have a name')
      return
    }

    setSaving(true)
    try {
      // Get user's company
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)

      const company = companies && companies.length > 0 ? companies[0] : null
      if (!company) throw new Error('No company found')

      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const total = calculateTotal()

      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: generateInvoiceNumber(),
          title: invoice.title,
          company_id: company.id,
          client_id: invoice.client_id,
          subtotal_amount: subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          status: status,
          due_date: invoice.due_date || null,
          notes: invoice.notes || null,
          payment_method_id: selectedPaymentMethod?.id || null,
          created_by: user?.id
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items
      const itemsToInsert = items
        .filter(item => item.name.trim())
        .map(item => ({
          invoice_id: invoiceData.id,
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          photo_url: item.photo_url || null
        }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      showSuccess(`Invoice ${status === 'draft' ? 'saved as draft' : 'created and sent'} successfully!`)
      router.push(`/invoices/${invoiceData.id}`)
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      showError('Failed to create invoice. Please try again.')
    } finally {
      setSaving(false)
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
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
              <Link
                href="/invoices"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
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
                <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
                <p className="text-gray-600 mt-1">Create a new invoice for your client</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSave('sent')}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Create & Send
                </button>
                <Link
                  href="/invoices"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="space-y-6">
                {/* Invoice Information */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Invoice Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={invoice.title}
                        onChange={(e) => setInvoice(prev => ({ ...prev, title: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter invoice title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={invoice.due_date}
                        onChange={(e) => setInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-900">
                          Client <span className="text-red-500">*</span>
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
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          required
                          value={invoice.client_id}
                          onChange={(e) => setInvoice(prev => ({ ...prev, client_id: e.target.value }))}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a client...</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.first_name} {client.last_name}
                              {client.company_name && ` (${client.company_name})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>


                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Payment Method
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50">
                          {selectedPaymentMethod ? (
                            <div>
                              <div className="flex items-center">
                                <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {selectedPaymentMethod.name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {selectedPaymentMethod.account_details && 
                                 typeof selectedPaymentMethod.account_details === 'string' ? 
                                 JSON.parse(selectedPaymentMethod.account_details).description || 'Payment method configured' :
                                 'Payment method configured'
                                }
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-500">
                              <CreditCard className="h-4 w-4 mr-2" />
                              <span className="text-sm">No payment method selected</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPaymentModal(true)}
                          className="px-3 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-lg text-sm transition-colors"
                        >
                          {selectedPaymentMethod ? 'Change' : 'Select'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Tax Configuration
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {taxConfig.enabled ? `${taxConfig.name} (${taxConfig.rate}%)` : 'No tax configured'}
                              </span>
                              {taxConfig.enabled && (
                                <div className="text-xs text-gray-600">
                                  Tax amount: ${calculateTax().toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTaxModal(true)}
                          className="px-3 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-lg text-sm transition-colors flex items-center"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Notes
                      </label>
                      <textarea
                        rows={4}
                        value={invoice.notes}
                        onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional notes or payment instructions..."
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Products & Services</h3>
                    <button
                      onClick={addItem}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-md font-medium text-gray-900">Item #{index + 1}</h4>
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Product/Service Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Item name..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Unit Price ($)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div className="lg:col-span-4">
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Description
                            </label>
                            <textarea
                              rows={3}
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Item description..."
                            />
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-right">
                            <span className="text-sm text-gray-600">Total: </span>
                            <span className="text-lg font-semibold text-gray-900">
                              ${item.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Invoice Totals */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      
                      {/* Tax */}
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-600">
                            {taxConfig.enabled ? `${taxConfig.name} (${taxConfig.rate}%):` : 'Tax:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowTaxModal(true)}
                            className="ml-2 text-blue-600 hover:text-blue-700 underline text-xs"
                          >
                            Configure
                          </button>
                        </div>
                        <span className="font-medium">${calculateTax().toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Configuration Modal */}
      <TaxConfigModal
        isOpen={showTaxModal}
        onClose={() => setShowTaxModal(false)}
        onSave={handleTaxSave}
        currentConfig={taxConfig}
      />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={handlePaymentMethodSave}
        currentMethod={selectedPaymentMethod}
      />

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
    </ProtectedRoute>
  )
}