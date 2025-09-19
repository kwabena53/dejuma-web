'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  Home, 
  Users, 
  FileText, 
  DollarSign, 
  Settings, 
  LogOut,
  Plus,
  Hammer,
  User
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Invoices', href: '/invoices', icon: DollarSign },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [companyName, setCompanyName] = useState<string>('')

  useEffect(() => {
    if (user) {
      fetchCompanyName()
    }
  }, [user])

  const fetchCompanyName = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('company_name')
        .eq('owner_id', user?.id)
        .limit(1)

      if (companies && companies.length > 0) {
        setCompanyName(companies[0].company_name || 'Your Company')
      } else {
        setCompanyName('Your Company')
      }
    } catch (error) {
      console.error('Error fetching company name:', error)
      setCompanyName('Your Company')
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  // Extract first name from email
  const getFirstName = (email: string) => {
    if (!email) return 'User'
    const username = email.split('@')[0]
    // Remove dots, underscores, numbers and capitalize first letter
    const cleanName = username.replace(/[._\d]/g, '')
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
      {/* Logo/Brand */}
      <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Hammer className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900">Dejuma</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-100">
        <Link href="/profile">
          <div className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
            <div className="bg-gray-200 rounded-full p-2">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email ? getFirstName(user.email) : 'User'}
              </p>
              <p className="text-xs text-gray-600">{companyName}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="space-y-2">
          <Link
            href="/clients/add"
            className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Link>
          <Link
            href="/quotes/create"
            className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Link>
          <Link
            href="/invoices/create"
            className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          Sign Out
        </button>
      </div>
    </div>
  )
}