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
  ArrowLeft, 
  Plus, 
  Trash2,
  Save,
  X,
  User,
  Calendar,
  DollarSign,
  FileText,
  CreditCard
} from 'lucide-react'

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
  isNew?: boolean
}

interface Invoice {
  id: string
  invoice_number: string
  title: string
  total_amount: number
  tax_amount: number
  subtotal_amount: number
  status: string
  due_date: string | null
  payment_terms: string | null
  notes: string | null
  client_id: string
}

export default function EditInvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [invoiceForm, setInvoiceForm] = useState({
    title: '',
    client_id: '',
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    tax_rate: 0
  })
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  useEffect(() => {
    if (user && invoiceId) {
      fetchInvoiceAndClients()
    }
  }, [user, invoiceId])

  const fetchInvoiceAndClients = async () => {
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

      // Get invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('company_id', company.id)
        .single()

      if (invoiceError) throw invoiceError

      // Get invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at')

      if (itemsError) throw itemsError

      // Get clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', company.id)
        .order('first_name')

      if (clientsError) throw clientsError

      // Calculate tax rate from existing invoice
      const taxRate = invoiceData.subtotal_amount > 0 
        ? (invoiceData.tax_amount / invoiceData.subtotal_amount) * 100 
        : 0

      setInvoice(invoiceData)
      setInvoiceForm({
        title: invoiceData.title,
        client_id: invoiceData.client_id,
        due_date: invoiceData.due_date || '',
        payment_terms: invoiceData.payment_terms || 'Net 30',
        notes: invoiceData.notes || '',
        tax_rate: taxRate
      })
      setItems(itemsData?.map(item => ({
        ...item,
        isNew: false
      })) || [])
      setClients(clientsData || [])
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      if (error.code === 'PGRST116') {
        setError('Invoice not found')
      } else {
        setError('Failed to load invoice')
      }
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      isNew: true
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
    return calculateSubtotal() * (invoiceForm.tax_rate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSave = async () => {
    // Validate required fields
    if (!invoiceForm.title.trim()) {
      showError('Invoice title is required')
      return
    }

    if (!invoiceForm.client_id) {
      showError('Please select a client')
      return
    }

    if (items.some(item => !item.name.trim())) {
      showError('All items must have a name')
      return
    }

    setSaving(true)
    try {
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTax()
      const total = calculateTotal()

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          title: invoiceForm.title,
          client_id: invoiceForm.client_id,
          subtotal_amount: subtotal,
          tax_amount: taxAmount,
          total_amount: total,
          due_date: invoiceForm.due_date || null,
          payment_terms: invoiceForm.payment_terms,
          notes: invoiceForm.notes || null
        })
        .eq('id', invoiceId)

      if (invoiceError) throw invoiceError

      // Handle invoice items - delete existing ones and insert new ones
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId)

      if (deleteError) throw deleteError

      // Insert updated items
      const itemsToInsert = items
        .filter(item => item.name.trim())
        .map(item => ({
          invoice_id: invoiceId,
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

      showSuccess('Invoice updated successfully!')
      router.push(`/invoices/${invoiceId}`)
    } catch (error: any) {
      console.error('Error updating invoice:', error)
      showError('Failed to update invoice. Please try again.')
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
              <p className="text-gray-600 mt-4">Loading invoice...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !invoice) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Invoice not found'}</h2>
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
                <p className="text-gray-600 mt-1">Update invoice details and items</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
                <Link
                  href={`/invoices/${invoiceId}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Invoice
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
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        value={invoice.invoice_number}
                        disabled
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Invoice number cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Status
                      </label>
                      <input
                        type="text"
                        value={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        disabled
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Status is managed automatically</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Invoice Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={invoiceForm.title}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, title: e.target.value }))}
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
                        value={invoiceForm.due_date}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, due_date: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Client <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={invoiceForm.client_id}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, client_id: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Payment Terms
                      </label>
                      <select
                        value={invoiceForm.payment_terms}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, payment_terms: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                        <option value="Net 90">Net 90</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={invoiceForm.tax_rate}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Notes
                      </label>
                      <textarea
                        rows={4}
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional notes or payment instructions..."
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Items & Services</h3>
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
                      {invoiceForm.tax_rate > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax ({invoiceForm.tax_rate}%):</span>
                          <span className="font-medium">${calculateTax().toFixed(2)}</span>
                        </div>
                      )}
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
    </ProtectedRoute>
  )
}