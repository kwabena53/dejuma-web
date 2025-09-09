'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Hammer, ArrowRight, CheckCircle } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col min-h-screen">
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Hammer className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">HandyPro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </nav>

          <main className="flex-1 flex items-center">
            <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
              <div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Manage Your Handyman Business
                  <span className="text-blue-600"> Like a Pro</span>
                </h1>
                <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                  Create professional invoices, send quotes, and manage jobs all in one place. 
                  Built specifically for handymen and small service businesses.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
                  >
                    Sign In
                  </Link>
                </div>

                <div className="mt-12">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Professional Invoices</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Quick Quotes</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">Job Management</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:justify-self-end">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
                  <div className="text-center">
                    <div className="bg-blue-100 p-4 rounded-full inline-block mb-6">
                      <Hammer className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h3>
                    <p className="text-gray-600 mb-6">
                      Join thousands of handymen who trust HandyPro to manage their business.
                    </p>
                    <Link
                      href="/register"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block"
                    >
                      Create Free Account
                    </Link>
                    <p className="text-xs text-gray-500 mt-4">
                      No credit card required • Free 14-day trial
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
