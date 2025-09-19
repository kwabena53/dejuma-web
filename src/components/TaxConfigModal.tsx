'use client'

import { useState, useEffect } from 'react'
import { X, Percent, Save, Settings, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface TaxConfig {
  name: string
  rate: number
  enabled: boolean
}

interface SavedTaxSetting {
  id: string
  name: string
  rate: number
  enabled: boolean
  is_default: boolean
}

interface TaxConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (taxConfig: TaxConfig) => void
  currentConfig?: TaxConfig
}

export default function TaxConfigModal({ isOpen, onClose, onSave, currentConfig }: TaxConfigModalProps) {
  const { user } = useAuth()
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    name: 'Tax',
    rate: 0,
    enabled: false
  })
  const [savedSettings, setSavedSettings] = useState<SavedTaxSetting[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  useEffect(() => {
    if (currentConfig) {
      setTaxConfig(currentConfig)
    } else {
      setTaxConfig({
        name: 'Tax',
        rate: 0,
        enabled: false
      })
    }
  }, [currentConfig, isOpen])

  useEffect(() => {
    if (isOpen && user) {
      loadSavedTaxSettings()
    }
  }, [isOpen, user])

  const loadSavedTaxSettings = async () => {
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

      // Get saved tax settings
      const { data: settings, error } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('company_id', companyId)
        .order('is_default', { ascending: false })
        .order('name')

      if (error) throw error

      setSavedSettings(settings || [])

      // If there's a default setting and no current config, use it
      const defaultSetting = settings?.find(s => s.is_default)
      if (defaultSetting && !currentConfig) {
        setTaxConfig({
          name: defaultSetting.name,
          rate: defaultSetting.rate,
          enabled: defaultSetting.enabled
        })
      }
    } catch (error) {
      console.error('Error loading tax settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTaxSetting = async () => {
    if (!taxConfig.name.trim()) {
      alert('Please enter a tax name')
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

      // Save the tax setting
      const { error } = await supabase
        .from('tax_settings')
        .insert([{
          company_id: companyId,
          name: taxConfig.name,
          rate: taxConfig.rate,
          enabled: taxConfig.enabled,
          is_default: saveAsDefault
        }])

      if (error) throw error

      // Reload saved settings
      await loadSavedTaxSettings()
      setShowSaveForm(false)
      setSaveAsDefault(false)
      
    } catch (error) {
      console.error('Error saving tax setting:', error)
      alert('Failed to save tax setting')
    } finally {
      setSaving(false)
    }
  }

  const loadTaxSetting = (setting: SavedTaxSetting) => {
    setTaxConfig({
      name: setting.name,
      rate: setting.rate,
      enabled: setting.enabled
    })
  }

  const deleteTaxSetting = async (settingId: string) => {
    if (!confirm('Are you sure you want to delete this tax setting?')) return

    try {
      const { error } = await supabase
        .from('tax_settings')
        .delete()
        .eq('id', settingId)

      if (error) throw error

      // Reload saved settings
      await loadSavedTaxSettings()
    } catch (error) {
      console.error('Error deleting tax setting:', error)
      alert('Failed to delete tax setting')
    }
  }

  const handleSave = () => {
    onSave(taxConfig)
    onClose()
  }

  const handleCancel = () => {
    if (currentConfig) {
      setTaxConfig(currentConfig)
    } else {
      setTaxConfig({
        name: 'Tax',
        rate: 0,
        enabled: false
      })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tax Configuration</h3>
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
          {/* Enable/Disable Tax */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-800">
              Enable Tax
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={taxConfig.enabled}
                onChange={(e) => setTaxConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {taxConfig.enabled && (
            <>
              {/* Tax Name */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Tax Name
                </label>
                <input
                  type="text"
                  value={taxConfig.name}
                  onChange={(e) => setTaxConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., VAT, Sales Tax, GST"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxConfig.rate}
                    onChange={(e) => setTaxConfig(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the tax rate as a percentage (e.g., 8.25 for 8.25%)
                </p>
              </div>

              {/* Saved Tax Settings */}
              {savedSettings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-800">Saved Tax Settings</h4>
                    <button
                      onClick={() => setShowSaveForm(!showSaveForm)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Save Current
                    </button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {savedSettings.map((setting) => (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {setting.name}
                            </span>
                            {setting.is_default && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {setting.rate}% • {setting.enabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => loadTaxSetting(setting)}
                            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => deleteTaxSetting(setting.id)}
                            className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Current Form */}
              {showSaveForm && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-800">Save Current Tax Setting</h4>
                    <button
                      onClick={() => setShowSaveForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="saveAsDefault"
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="saveAsDefault" className="text-sm text-gray-700">
                        Set as default tax setting
                      </label>
                    </div>
                    <button
                      onClick={saveTaxSetting}
                      disabled={saving}
                      className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Tax Setting'}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Save Button for New Users */}
              {savedSettings.length === 0 && taxConfig.enabled && (
                <div className="text-center">
                  <button
                    onClick={() => setShowSaveForm(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center justify-center mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Save this tax setting for future use
                  </button>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Preview</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>$100.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{taxConfig.name} ({taxConfig.rate}%):</span>
                    <span>${(100 * (taxConfig.rate / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-gray-300 pt-1">
                    <span>Total:</span>
                    <span>${(100 + (100 * (taxConfig.rate / 100))).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Tax Settings
          </button>
        </div>
      </div>
    </div>
  )
}