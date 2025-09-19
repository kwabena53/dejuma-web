'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Camera,
  Eye,
  EyeOff,
  Lock,
  Key
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
}

interface Company {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  owner_id: string
}

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingCompany, setEditingCompany] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)
  
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  })
  
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  })
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      // If no profile exists, create one from auth user data
      if (!profileData) {
        const newProfile = {
          id: user?.id,
          email: user?.email || '',
          first_name: user?.user_metadata?.first_name || '',
          last_name: user?.user_metadata?.last_name || '',
          phone: user?.user_metadata?.phone || ''
        }
        
        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single()
          
        if (createError) throw createError
        setProfile(createdProfile)
      } else {
        setProfile(profileData)
      }

      // Get company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user?.id)
        .single()

      if (companyError && companyError.code !== 'PGRST116') {
        console.error('Error fetching company:', companyError)
      } else if (companyData) {
        setCompany(companyData)
        setCompanyForm({
          name: companyData.name || '',
          email: companyData.email || '',
          phone: companyData.phone || '',
          address: companyData.address || '',
          website: companyData.website || ''
        })
      }

      // Set profile form
      if (profileData || profile) {
        const profileToUse = profileData || profile
        setProfileForm({
          first_name: profileToUse?.first_name || '',
          last_name: profileToUse?.last_name || '',
          phone: profileToUse?.phone || ''
        })
      }

    } catch (error: any) {
      console.error('Error fetching user data:', error)
      showToast('Failed to load profile data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          phone: profileForm.phone
        })
        .eq('id', user?.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setEditingProfile(false)
      showToast('Profile updated successfully', 'success')
      
    } catch (error: any) {
      console.error('Error updating profile:', error)
      showToast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCompany = async () => {
    try {
      setSaving(true)
      
      if (company) {
        // Update existing company
        const { data, error } = await supabase
          .from('companies')
          .update({
            name: companyForm.name,
            email: companyForm.email,
            phone: companyForm.phone,
            address: companyForm.address,
            website: companyForm.website
          })
          .eq('id', company.id)
          .select()
          .single()

        if (error) throw error
        setCompany(data)
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert([{
            name: companyForm.name,
            email: companyForm.email,
            phone: companyForm.phone,
            address: companyForm.address,
            website: companyForm.website,
            owner_id: user?.id
          }])
          .select()
          .single()

        if (error) throw error
        setCompany(data)
      }
      
      setEditingCompany(false)
      showToast('Company information updated successfully', 'success')
      
    } catch (error: any) {
      console.error('Error updating company:', error)
      showToast('Failed to update company information', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error')
      return
    }

    try {
      setSaving(true)
      
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setEditingPassword(false)
      showToast('Password updated successfully', 'success')
      
    } catch (error: any) {
      console.error('Error updating password:', error)
      showToast('Failed to update password', 'error')
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account and company information</p>
              </div>

              <div className="space-y-8">
                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                    </div>
                    {!editingProfile && (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {editingProfile ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.first_name}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.last_name}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profile?.email || ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingProfile(false)
                              setProfileForm({
                                first_name: profile?.first_name || '',
                                last_name: profile?.last_name || '',
                                phone: profile?.phone || ''
                              })
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                            <p className="text-gray-900">{profile?.first_name || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                            <p className="text-gray-900">{profile?.last_name || 'Not provided'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                          <p className="text-gray-900 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {profile?.email}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                          <p className="text-gray-900 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {profile?.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
                    </div>
                    {!editingCompany && (
                      <button
                        onClick={() => setEditingCompany(true)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {editingCompany ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={companyForm.name}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                              Company Email
                            </label>
                            <input
                              type="email"
                              value={companyForm.email}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                              Company Phone
                            </label>
                            <input
                              type="tel"
                              value={companyForm.phone}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Address
                          </label>
                          <textarea
                            value={companyForm.address}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            value={companyForm.website}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://"
                          />
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={handleSaveCompany}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingCompany(false)
                              setCompanyForm({
                                name: company?.name || '',
                                email: company?.email || '',
                                phone: company?.phone || '',
                                address: company?.address || '',
                                website: company?.website || ''
                              })
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {company ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
                              <p className="text-gray-900">{company.name}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                <p className="text-gray-900">{company.email || 'Not provided'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                                <p className="text-gray-900">{company.phone || 'Not provided'}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                              <p className="text-gray-900">{company.address || 'Not provided'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Website</label>
                              <p className="text-gray-900">{company.website || 'Not provided'}</p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No company information provided</p>
                            <button
                              onClick={() => setEditingCompany(true)}
                              className="mt-2 text-blue-600 hover:text-blue-700"
                            >
                              Add company information
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Change */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="h-5 w-5 text-gray-400 mr-3" />
                      <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                    </div>
                    {!editingPassword && (
                      <button
                        onClick={() => setEditingPassword(true)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Change Password
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {editingPassword ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={handleChangePassword}
                            disabled={saving || !passwordForm.newPassword || !passwordForm.confirmPassword}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Updating...' : 'Update Password'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingPassword(false)
                              setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              })
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Click "Change Password" to update your password</p>
                      </div>
                    )}
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