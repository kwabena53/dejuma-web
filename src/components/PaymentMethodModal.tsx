'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Save, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface PaymentMethod {
  id: string
  name: string
  type: string
  account_details: any
  is_active: boolean
  is_default: boolean
}

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (paymentMethod: PaymentMethod) => void
  currentMethod?: PaymentMethod | null
}

const DEFAULT_PAYMENT_TYPES = [
  { 
    name: 'Cash', 
    type: 'cash',
    fields: [
      { key: 'description', label: 'Description', type: 'text', placeholder: 'Cash payment on delivery or pickup' }
    ]
  },
  { 
    name: 'Venmo', 
    type: 'digital',
    fields: [
      { key: 'username', label: 'Venmo Username', type: 'text', placeholder: '@username' },
      { key: 'description', label: 'Description', type: 'text', placeholder: 'Pay via Venmo' }
    ]
  },
  { 
    name: 'PayPal', 
    type: 'digital',
    fields: [
      { key: 'email', label: 'PayPal Email', type: 'email', placeholder: 'your@email.com' },
      { key: 'description', label: 'Description', type: 'text', placeholder: 'Pay via PayPal' }
    ]
  },
  { 
    name: 'CashApp', 
    type: 'digital',
    fields: [
      { key: 'cashtag', label: 'Cash App Tag', type: 'text', placeholder: '$username' },
      { key: 'description', label: 'Description', type: 'text', placeholder: 'Pay via Cash App' }
    ]
  },
  { 
    name: 'Zelle', 
    type: 'digital',
    fields: [
      { key: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
      { key: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '(555) 123-4567' },
      { key: 'description', label: 'Description', type: 'text', placeholder: 'Pay via Zelle' }
    ]
  }
]

export default function PaymentMethodModal({ isOpen, onClose, onSave, currentMethod }: PaymentMethodModalProps) {
  const { user } = useAuth()
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [customMethodName, setCustomMethodName] = useState('')
  const [accountDetails, setAccountDetails] = useState<any>({})
  const [setAsDefault, setSetAsDefault] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadPaymentMethods()
    }
  }, [isOpen, user])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      
      // Get user's company
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)

      if (!companies || companies.length === 0) return

      const companyId = companies[0].id

      // Get payment methods
      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name')

      if (error) throw error

      setSavedMethods(methods || [])
    } catch (error) {
      console.error('Error loading payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePaymentMethod = async () => {
    if (!selectedType && !customMethodName) {
      alert('Please select a payment type or enter a custom method name')
      return
    }

    try {
      setSaving(true)
      
      // Get user's company
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)

      if (!companies || companies.length === 0) {
        alert('No company found')
        return
      }

      const companyId = companies[0].id
      const methodName = customMethodName || selectedType
      const methodType = customMethodName ? 'custom' : getMethodType(selectedType)

      // Save the payment method
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{
          company_id: companyId,
          name: methodName,
          type: methodType,
          account_details: JSON.stringify(accountDetails),
          is_active: true,
          is_default: setAsDefault
        }])
        .select()
        .single()

      if (error) throw error

      // Reload payment methods
      await loadPaymentMethods()
      
      // Reset form
      setShowAddForm(false)
      setSelectedType('')
      setCustomMethodName('')
      setAccountDetails({})
      setSetAsDefault(false)
      
    } catch (error) {
      console.error('Error saving payment method:', error)
      alert('Failed to save payment method')
    } finally {
      setSaving(false)
    }
  }

  const updatePaymentMethod = async (methodId: string, updates: Partial<PaymentMethod>) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', methodId)

      if (error) throw error

      await loadPaymentMethods()
    } catch (error) {
      console.error('Error updating payment method:', error)
      alert('Failed to update payment method')
    }
  }

  const deletePaymentMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId)

      if (error) throw error

      await loadPaymentMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert('Failed to delete payment method')
    }
  }

  const selectPaymentMethod = (method: PaymentMethod) => {
    onSave(method)
    onClose()
  }

  const getMethodType = (name: string): string => {
    const method = DEFAULT_PAYMENT_TYPES.find(m => m.name === name)
    return method?.type || 'custom'
  }

  const getFieldsForType = (typeName: string) => {
    const method = DEFAULT_PAYMENT_TYPES.find(m => m.name === typeName)
    return method?.fields || []
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setSelectedType('')
    setCustomMethodName('')
    setAccountDetails({})
    setSetAsDefault(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-2 mr-3">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Existing Payment Methods */}
          {savedMethods.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800">Saved Payment Methods</h4>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add New
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {method.name}
                        </span>
                        {method.is_default && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {method.account_details && typeof method.account_details === 'string' 
                          ? JSON.parse(method.account_details).description || 'Payment method'
                          : 'Payment method'
                        }
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => selectPaymentMethod(method)}
                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
                      >
                        Select
                      </button>
                      {!method.is_default && (
                        <button
                          onClick={() => updatePaymentMethod(method.id, { is_default: true })}
                          className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => deletePaymentMethod(method.id)}
                        className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Payment Method Form */}
          {(showAddForm || savedMethods.length === 0) && (
            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-800">Add Payment Method</h4>
                {savedMethods.length > 0 && (
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Preset Methods */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Choose Payment Method
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value)
                      setCustomMethodName('')
                      setAccountDetails({})
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a payment method...</option>
                    {DEFAULT_PAYMENT_TYPES.map((type) => (
                      <option key={type.name} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Method Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Or Add Custom Payment Method
                  </label>
                  <input
                    type="text"
                    value={customMethodName}
                    onChange={(e) => {
                      setCustomMethodName(e.target.value)
                      setSelectedType('')
                    }}
                    placeholder="e.g., Bank Transfer, Crypto, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Dynamic Fields */}
                {(selectedType || customMethodName) && (
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-800">Account Details</h5>
                    {selectedType ? (
                      getFieldsForType(selectedType).map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm text-gray-700 mb-1">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            value={accountDetails[field.key] || ''}
                            onChange={(e) => setAccountDetails(prev => ({
                              ...prev,
                              [field.key]: e.target.value
                            }))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      ))
                    ) : (
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Payment Instructions
                        </label>
                        <textarea
                          value={accountDetails.description || ''}
                          onChange={(e) => setAccountDetails(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          placeholder="Enter payment details and instructions..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Set as Default */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="setAsDefault"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="setAsDefault" className="text-sm text-gray-700">
                    Set as default payment method
                  </label>
                </div>

                {/* Save Button */}
                <button
                  onClick={savePaymentMethod}
                  disabled={saving || (!selectedType && !customMethodName)}
                  className="w-full bg-blue-600 text-white text-sm py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Payment Method
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick Add for New Users */}
          {savedMethods.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No payment methods configured</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-blue-600 hover:text-blue-700 underline flex items-center justify-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add your first payment method
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}