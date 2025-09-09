'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { LogOut, Plus, FileText, DollarSign, Briefcase, User, Settings } from 'lucide-react'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <span className="ml-3 text-xl font-bold text-gray-900">HandyPro</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  Welcome, <span className="font-medium">{user?.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your handyman business from one place</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Invoices
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <button className="font-medium text-blue-600 hover:text-blue-500">
                      View all
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">$0.00</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <button className="font-medium text-blue-600 hover:text-blue-500">
                      View details
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Briefcase className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Jobs
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <button className="font-medium text-blue-600 hover:text-blue-500">
                      View all jobs
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4">
                    <button className="flex items-center p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Plus className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Create Invoice</div>
                        <div className="text-sm text-gray-500">Bill your clients for completed work</div>
                      </div>
                    </button>
                    
                    <button className="flex items-center p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FileText className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Create Quote</div>
                        <div className="text-sm text-gray-500">Provide estimates for potential jobs</div>
                      </div>
                    </button>
                    
                    <button className="flex items-center p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Briefcase className="h-5 w-5 text-purple-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Add New Job</div>
                        <div className="text-sm text-gray-500">Track your ongoing projects</div>
                      </div>
                    </button>
                    
                    <button className="flex items-center p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <User className="h-5 w-5 text-orange-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Add Client</div>
                        <div className="text-sm text-gray-500">Manage your client database</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Start by creating your first invoice or quote
                    </p>
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