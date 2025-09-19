'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'
import { Plus, FileText, DollarSign, Briefcase, User, TrendingUp, Clock, Calendar } from 'lucide-react'

interface DashboardStats {
  totalClients: number
  totalQuotes: number
  totalInvoices: number
  totalRevenue: number
  activeJobs: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
}

interface RecentActivity {
  id: string
  type: 'client' | 'quote' | 'invoice'
  title: string
  description: string
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalQuotes: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    activeJobs: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return
      
      try {
        setLoading(true)

        // Get user's company
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id)
          .single()

        if (!company) {
          setLoading(false)
          return
        }

        // Fetch all stats in parallel
        const [
          clientsResult, 
          quotesResult, 
          invoicesResult, 
          revenueResult,
          paidInvoicesResult,
          pendingInvoicesResult,
          overdueInvoicesResult,
          recentClientsResult,
          recentQuotesResult,
          recentInvoicesResult
        ] = await Promise.all([
          // Total clients
          supabase
            .from('clients')
            .select('id', { count: 'exact' })
            .eq('company_id', company.id),
          
          // Total quotes
          supabase
            .from('quotes')
            .select('id', { count: 'exact' })
            .eq('company_id', company.id),
          
          // Total invoices
          supabase
            .from('invoices')
            .select('id', { count: 'exact' })
            .eq('company_id', company.id),
          
          // Total revenue (paid invoices)
          supabase
            .from('invoices')
            .select('total_amount')
            .eq('company_id', company.id)
            .eq('status', 'paid'),

          // Paid invoices count
          supabase
            .from('invoices')
            .select('id', { count: 'exact' })
            .eq('company_id', company.id)
            .eq('status', 'paid'),

          // Pending invoices (sent but not paid)
          supabase
            .from('invoices')
            .select('id', { count: 'exact' })
            .eq('company_id', company.id)
            .in('status', ['sent', 'draft']),

          // Overdue invoices
          supabase
            .from('invoices')
            .select('id', { count: 'exact' })
            .eq('company_id', company.id)
            .eq('status', 'overdue'),

          // Recent clients (last 5)
          supabase
            .from('clients')
            .select('id, first_name, last_name, created_at')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(5),

          // Recent quotes (last 5)
          supabase
            .from('quotes')
            .select('id, title, quote_number, created_at')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(5),

          // Recent invoices (last 5)
          supabase
            .from('invoices')
            .select('id, title, invoice_number, created_at')
            .eq('company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(5)
        ])

        const totalRevenue = revenueResult.data?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0

        setStats({
          totalClients: clientsResult.count || 0,
          totalQuotes: quotesResult.count || 0,
          totalInvoices: invoicesResult.count || 0,
          totalRevenue: totalRevenue,
          activeJobs: 0, // Will be implemented when jobs table is created
          paidInvoices: paidInvoicesResult.count || 0,
          pendingInvoices: pendingInvoicesResult.count || 0,
          overdueInvoices: overdueInvoicesResult.count || 0
        })

        // Combine recent activities
        const activities: RecentActivity[] = []
        
        // Add recent clients
        recentClientsResult.data?.forEach(client => {
          activities.push({
            id: client.id,
            type: 'client',
            title: `${client.first_name} ${client.last_name}`,
            description: 'New client added',
            created_at: client.created_at
          })
        })

        // Add recent quotes
        recentQuotesResult.data?.forEach(quote => {
          activities.push({
            id: quote.id,
            type: 'quote',
            title: quote.title,
            description: `Quote ${quote.quote_number} created`,
            created_at: quote.created_at
          })
        })

        // Add recent invoices
        recentInvoicesResult.data?.forEach(invoice => {
          activities.push({
            id: invoice.id,
            type: 'invoice',
            title: invoice.title,
            description: `Invoice ${invoice.invoice_number} created`,
            created_at: invoice.created_at
          })
        })

        // Sort by date and take top 10
        activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setRecentActivity(activities.slice(0, 10))
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [user, supabase])

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, manage your handyman business</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Clients
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {loading ? '...' : stats.totalClients}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/clients" className="font-medium text-blue-600 hover:text-blue-500">
                        View all clients
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Quotes
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {loading ? '...' : stats.totalQuotes}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/quotes" className="font-medium text-green-600 hover:text-green-500">
                        View all quotes
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Revenue
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {loading ? '...' : `$${stats.totalRevenue.toFixed(2)}`}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/invoices" className="font-medium text-yellow-600 hover:text-yellow-500">
                        View invoices
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Briefcase className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Invoices
                          </dt>
                          <dd className="text-2xl font-semibold text-gray-900">
                            {loading ? '...' : stats.totalInvoices}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/invoices" className="font-medium text-purple-600 hover:text-purple-500">
                        View all invoices
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Status Overview */}
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Status Overview</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-green-900">Paid Invoices</div>
                          <div className="text-2xl font-bold text-green-900">
                            {loading ? '...' : stats.paidInvoices}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-yellow-900">Pending Invoices</div>
                          <div className="text-2xl font-bold text-yellow-900">
                            {loading ? '...' : stats.pendingInvoices}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <TrendingUp className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-red-900">Overdue Invoices</div>
                          <div className="text-2xl font-bold text-red-900">
                            {loading ? '...' : stats.overdueInvoices}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-2">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link 
                          href="/clients/add" 
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                        >
                          <div className="flex-shrink-0">
                            <div className="bg-blue-100 group-hover:bg-blue-200 p-2 rounded-lg transition-colors">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-900">Add Client</div>
                            <div className="text-sm text-gray-500 group-hover:text-blue-700">Add a new client to your database</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/quotes/create" 
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                        >
                          <div className="flex-shrink-0">
                            <div className="bg-green-100 group-hover:bg-green-200 p-2 rounded-lg transition-colors">
                              <FileText className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900 group-hover:text-green-900">Create Quote</div>
                            <div className="text-sm text-gray-500 group-hover:text-green-700">Generate a quote for potential work</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/invoices/create" 
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 group"
                        >
                          <div className="flex-shrink-0">
                            <div className="bg-yellow-100 group-hover:bg-yellow-200 p-2 rounded-lg transition-colors">
                              <DollarSign className="h-6 w-6 text-yellow-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900 group-hover:text-yellow-900">Create Invoice</div>
                            <div className="text-sm text-gray-500 group-hover:text-yellow-700">Bill a client for completed work</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/jobs/create" 
                          className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
                        >
                          <div className="flex-shrink-0">
                            <div className="bg-purple-100 group-hover:bg-purple-200 p-2 rounded-lg transition-colors">
                              <Briefcase className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-semibold text-gray-900 group-hover:text-purple-900">Add Job</div>
                            <div className="text-sm text-gray-500 group-hover:text-purple-700">Track a new project or job</div>
                          </div>
                        </Link>
                      </div>
                      
                      {/* Toast Testing Section - Remove in production */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Toast Notifications Test</h4>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => showSuccess('Operation completed successfully!')}
                            className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
                          >
                            Success
                          </button>
                          <button 
                            onClick={() => showError('Something went wrong!')}
                            className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
                          >
                            Error
                          </button>
                          <button 
                            onClick={() => showWarning('Please check your inputs!')}
                            className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200 transition-colors"
                          >
                            Warning
                          </button>
                          <button 
                            onClick={() => showInfo('Here is some information for you.')}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                          >
                            Info
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity & Upcoming */}
                <div className="space-y-6">
                  {/* Recent Activity */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    </div>
                    <div className="p-6">
                      {loading ? (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">Loading...</p>
                        </div>
                      ) : recentActivity.length > 0 ? (
                        <div className="flow-root">
                          <ul className="-mb-8">
                            {recentActivity.map((activity, activityIdx) => (
                              <li key={activity.id}>
                                <div className="relative pb-8">
                                  {activityIdx !== recentActivity.length - 1 ? (
                                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                                  ) : null}
                                  <div className="relative flex space-x-3">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                      activity.type === 'client' ? 'bg-blue-100' :
                                      activity.type === 'quote' ? 'bg-green-100' :
                                      'bg-yellow-100'
                                    }`}>
                                      {activity.type === 'client' ? (
                                        <User className="h-4 w-4 text-blue-600" />
                                      ) : activity.type === 'quote' ? (
                                        <FileText className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <DollarSign className="h-4 w-4 text-yellow-600" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div>
                                        <div className="text-sm">
                                          <p className="font-medium text-gray-900">{activity.title}</p>
                                        </div>
                                        <p className="mt-0.5 text-sm text-gray-500">{activity.description}</p>
                                        <div className="mt-0.5 text-xs text-gray-400">
                                          {new Date(activity.created_at).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">No recent activity</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Activity will appear here as you work with clients
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upcoming */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Upcoming</h3>
                    </div>
                    <div className="p-6">
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No upcoming appointments</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Schedule jobs to see them here
                        </p>
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