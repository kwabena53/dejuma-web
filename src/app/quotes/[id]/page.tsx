'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Mail, 
  MessageSquare, 
  Briefcase,
  Calendar,
  User,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Phone,
  MapPin,
  Building2,
  X,
  Paperclip,
  Send,
  ExternalLink
} from 'lucide-react'

interface Quote {
  id: string
  quote_number: string
  title: string
  total_amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  valid_until: string
  notes: string
  created_at: string
  client_id: string
  company_id: string
  clients: {
    first_name: string
    last_name: string
    email: string
    phone: string
    company_name: string
    property_address: string
  }
  companies: {
    name: string
    address?: string
    website?: string
  }
}

interface QuoteItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  total: number
  photo_url?: string
}

export default function ViewQuotePage() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [emailModal, setEmailModal] = useState<{ open: boolean; data: any }>({
    open: false,
    data: null
  })
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: '',
    attachPDF: true
  })
  const [textModal, setTextModal] = useState<{ open: boolean; data: any }>({
    open: false,
    data: null
  })
  const [textForm, setTextForm] = useState({
    to: '',
    message: ''
  })
  const [convertModal, setConvertModal] = useState(false)
  const { user } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  useEffect(() => {
    if (user && quoteId) {
      fetchQuote()
    }
  }, [user, quoteId])

  const fetchQuote = async () => {
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

      // Get quote with client and company info
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients!inner(first_name, last_name, email, phone, company_name, property_address),
          companies!inner(name, address, website)
        `)
        .eq('id', quoteId)
        .eq('company_id', company.id)
        .single()

      if (quoteError) throw quoteError

      setQuote(quoteData)

      // Get quote items
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at')

      if (itemsError) throw itemsError

      setQuoteItems(itemsData || [])
    } catch (error: any) {
      console.error('Error fetching quote:', error)
      if (error.code === 'PGRST116') {
        setError('Quote not found')
      } else {
        setError('Failed to load quote')
      }
    } finally {
      setLoading(false)
    }
  }

  const openEmailModal = () => {
    if (!quote) return
    
    const defaultSubject = `Quote ${quote.quote_number} - ${quote.title}`
    const defaultMessage = `Dear ${quote.clients.first_name} ${quote.clients.last_name},

I hope this message finds you well. Please find attached your quote for the requested services.

Quote Details:
- Quote Number: ${quote.quote_number}
- Project: ${quote.title}
- Total Amount: $${quote.total_amount?.toFixed(2) || '0.00'}
- Valid Until: ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'No expiry date'}

Please review the quote and let me know if you have any questions or would like to discuss any modifications.

Thank you for considering our services. I look forward to working with you.

Best regards,
Your Handyman Service Team`

    setEmailForm({
      to: quote.clients.email || '',
      subject: defaultSubject,
      message: defaultMessage,
      attachPDF: true
    })
    
    setEmailModal({ open: true, data: quote })
  }

  const closeEmailModal = () => {
    setEmailModal({ open: false, data: null })
    setEmailForm({
      to: '',
      subject: '',
      message: '',
      attachPDF: true
    })
  }

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.message) {
      showError('Please fill in all required fields')
      return
    }

    setActionLoading('email')
    try {
      // Simulate email sending - in real app, you'd integrate with an email service
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update quote status to 'sent'
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId)

      if (error) throw error

      setQuote(prev => prev ? { ...prev, status: 'sent' } : null)
      showSuccess(`Quote emailed to ${emailForm.to}!`)
      closeEmailModal()
    } catch (error: any) {
      showError('Failed to send email')
    } finally {
      setActionLoading(null)
    }
  }

  const openTextModal = () => {
    if (!quote) return
    
    const clientApprovalLink = `${window.location.origin}/client/quote/${quote.id}`
    const defaultMessage = `Hi ${quote.clients.first_name}! Your quote ${quote.quote_number} for "${quote.title}" is ready. Total: $${quote.total_amount?.toFixed(2) || '0.00'}. Review and approve: ${clientApprovalLink}`

    setTextForm({
      to: quote.clients.phone || '',
      message: defaultMessage
    })
    
    setTextModal({ open: true, data: quote })
  }

  const closeTextModal = () => {
    setTextModal({ open: false, data: null })
    setTextForm({
      to: '',
      message: ''
    })
  }

  const handleSendText = async () => {
    if (!textForm.to || !textForm.message) {
      showError('Please fill in all required fields')
      return
    }

    setActionLoading('text')
    try {
      // Simulate SMS sending - in real app, you'd integrate with Twilio or similar
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update quote status to 'sent'
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quoteId)

      if (error) throw error

      setQuote(prev => prev ? { ...prev, status: 'sent' } : null)
      showSuccess(`Quote sent via text to ${textForm.to}!`)
      closeTextModal()
    } catch (error: any) {
      showError('Failed to send text message')
    } finally {
      setActionLoading(null)
    }
  }

  const convertToInvoice = async () => {
    if (!quote) return

    setActionLoading('convert')
    
    try {
      // Generate a unique invoice number
      const invoiceNumber = `INV-${Date.now()}`

      // Get the quote items first
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quote.id)

      if (itemsError) {
        throw new Error('Failed to fetch quote items')
      }

      // Create the invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          title: quote.title,
          company_id: quote.company_id,
          client_id: quote.client_id,
          quote_id: quote.id, // Link to original quote
          total_amount: quote.total_amount,
          subtotal_amount: quote.total_amount,
          tax_amount: 0,
          status: 'draft',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          notes: quote.notes,
          payment_terms: '30 days',
          created_by: user?.id,
          job_completed: false
        })
        .select()
        .single()

      if (invoiceError) {
        throw new Error('Failed to create invoice')
      }

      // Create invoice items from quote items
      if (quoteItems && quoteItems.length > 0) {
        const invoiceItems = quoteItems.map(item => ({
          invoice_id: invoiceData.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          photo_url: item.photo_url
        }))

        const { error: itemsInsertError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems)

        if (itemsInsertError) {
          throw new Error('Failed to create invoice items')
        }
      }

      // Update quote status to accepted if not already
      if (quote.status !== 'accepted') {
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ status: 'accepted' })
          .eq('id', quote.id)

        if (updateError) {
          console.warn('Failed to update quote status:', updateError)
        } else {
          setQuote(prev => prev ? { ...prev, status: 'accepted' } : null)
        }
      }

      showSuccess('Quote converted to invoice successfully!')
      setConvertModal(false)
      
      // Navigate to the new invoice
      router.push(`/invoices/${invoiceData.id}`)
      
    } catch (error) {
      console.error('Convert to invoice error:', error)
      showError(error instanceof Error ? error.message : 'Failed to convert quote to invoice')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPDF = async () => {
    if (!quote) return
    
    setActionLoading('download')
    try {
      // Create a clean version of the page for PDF generation
      const pdfContent = document.createElement('div')
      pdfContent.className = 'pdf-content'
      pdfContent.style.cssText = `
        background: white;
        padding: 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 0 auto;
      `
      
      // Build the PDF content
      pdfContent.innerHTML = `
        <div style="margin-bottom: 40px; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: bold; color: #111827; margin: 0 0 10px 0;">${quote.quote_number}</h1>
          <h2 style="font-size: 20px; color: #4b5563; margin: 0 0 20px 0;">${quote.title}</h2>
          <div style="display: inline-block; padding: 8px 16px; background: ${quote.status === 'accepted' ? '#dcfce7' : quote.status === 'rejected' ? '#fef2f2' : '#dbeafe'}; color: ${quote.status === 'accepted' ? '#166534' : quote.status === 'rejected' ? '#991b1b' : '#1d4ed8'}; border-radius: 20px; font-size: 14px; font-weight: 600;">
            ${quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Service Provider</h3>
            <div style="color: #374151; line-height: 1.6;">
              <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${quote.companies.name}</div>
              ${quote.companies.website ? `<div>🌐 ${quote.companies.website}</div>` : ''}
              ${quote.companies.address ? `<div style="margin-top: 8px;">📍 ${quote.companies.address}</div>` : ''}
            </div>
          </div>
          
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Quote For</h3>
            <div style="color: #374151; line-height: 1.6;">
              <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${quote.clients.first_name} ${quote.clients.last_name}</div>
              ${quote.clients.company_name ? `<div style="margin-bottom: 4px;">${quote.clients.company_name}</div>` : ''}
              ${quote.clients.email ? `<div>📧 ${quote.clients.email}</div>` : ''}
              ${quote.clients.phone ? `<div>📞 ${quote.clients.phone}</div>` : ''}
              ${quote.clients.property_address ? `<div style="margin-top: 8px;">📍 ${quote.clients.property_address}</div>` : ''}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
          <div>
            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">QUOTE NUMBER</div>
            <div style="font-weight: 600; color: #111827;">${quote.quote_number}</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">DATE ISSUED</div>
            <div style="color: #111827;">${new Date(quote.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">VALID UNTIL</div>
            <div style="color: #111827;">${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'No expiry'}</div>
          </div>
        </div>

        ${quoteItems.length > 0 ? `
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Products & Services</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Product/Service</th>
                <th style="text-align: left; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Description</th>
                <th style="text-align: center; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Qty</th>
                <th style="text-align: right; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Unit Price</th>
                <th style="text-align: right; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${quoteItems.map((item, index) => `
              <tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background: white;' : 'background: #f9fafb;'}">
                <td style="padding: 12px 8px; font-weight: 600; color: #111827;">${item.product_name}</td>
                <td style="padding: 12px 8px; color: #374151; max-width: 200px; word-wrap: break-word;">${item.description}</td>
                <td style="padding: 12px 8px; text-align: center; font-weight: 500; color: #111827;">${item.quantity}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 500; color: #111827;">$${item.unit_price.toLocaleString()}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #111827;">$${item.total.toLocaleString()}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); border-radius: 8px; border: 2px solid #e5e7eb;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">GRAND TOTAL</div>
            <div style="font-size: 32px; font-weight: bold; color: #111827;">$${quote.total_amount.toLocaleString()}</div>
          </div>
        </div>
        ` : ''}

        ${quote.notes ? `
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Additional Notes</h3>
          <div style="color: #374151; line-height: 1.6; background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            ${quote.notes.replace(/\n/g, '<br>')}
          </div>
        </div>
        ` : ''}

        ${(quote.status === 'accepted' || quote.status === 'rejected') ? `
        <div style="margin-bottom: 40px; padding: 20px; background: ${quote.status === 'accepted' ? '#dcfce7' : '#fef2f2'}; border-radius: 8px; border: 2px solid ${quote.status === 'accepted' ? '#bbf7d0' : '#fecaca'};">
          <h3 style="font-size: 18px; font-weight: 600; color: ${quote.status === 'accepted' ? '#166534' : '#991b1b'}; margin: 0 0 8px 0;">
            ${quote.status === 'accepted' ? '✅' : '❌'} Quote ${quote.status === 'accepted' ? 'Approved' : 'Rejected'}
          </h3>
          <p style="color: ${quote.status === 'accepted' ? '#166534' : '#991b1b'}; margin: 0; font-size: 14px;">
            ${quote.status === 'accepted' ? 
              'This quote has been approved and accepted by the client.' :
              'This quote has been rejected by the client.'
            }
          </p>
        </div>
        ` : ''}

        <div style="text-align: center; padding-top: 40px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 4px 0;">This quote was prepared by <strong>${quote.companies.name}</strong></p>
          <p style="margin: 0; color: #9ca3af;">
            Quote #${quote.quote_number} • Issued on ${new Date(quote.created_at).toLocaleDateString()}
            ${quote.valid_until ? ` • Valid until ${new Date(quote.valid_until).toLocaleDateString()}` : ''}
          </p>
        </div>
      `
      
      // Temporarily add to DOM for rendering
      document.body.appendChild(pdfContent)
      
      // Generate canvas from the content
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        windowWidth: 800
      })
      
      // Remove from DOM
      document.body.removeChild(pdfContent)
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST')
      heightLeft -= pageHeight
      
      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST')
        heightLeft -= pageHeight
      }
      
      // Download the PDF
      const fileName = `Quote-${quote.quote_number}-${quote.clients.first_name}-${quote.clients.last_name}.pdf`
      pdf.save(fileName)
      
      showSuccess('PDF downloaded successfully!')
      
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      showError('Failed to generate PDF. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading quote...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !quote) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error || 'Quote not found'}
              </h2>
              <Link
                href="/quotes"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quotes
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
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{quote.quote_number}</h1>
                  <p className="text-gray-600 mt-1">{quote.title}</p>
                </div>
                {getStatusBadge(quote.status)}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const previewWindow = window.open(`/preview/quote/${quote.id}`, '_blank')
                    if (!previewWindow) {
                      // Fallback if popup is blocked - copy to clipboard and show message
                      const previewUrl = `${window.location.origin}/preview/quote/${quote.id}`
                      navigator.clipboard.writeText(previewUrl).then(() => {
                        showSuccess('Preview link copied to clipboard! Paste it in a new tab.')
                      }).catch(() => {
                        showInfo(`Preview URL: ${previewUrl}`)
                      })
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview as Client
                </button>
                <Link
                  href={`/quotes/${quote.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors hover:text-gray-900"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
                <Link
                  href="/quotes"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Quotes
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Client Information */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Client</p>
                            <p className="text-sm text-gray-600">
                              {quote.clients.first_name} {quote.clients.last_name}
                            </p>
                          </div>
                        </div>
                        
                        {quote.clients.company_name && (
                          <div className="flex items-center">
                            <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Company</p>
                              <p className="text-sm text-gray-600">{quote.clients.company_name}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {quote.clients.email && (
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Email</p>
                              <a 
                                href={`mailto:${quote.clients.email}`}
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {quote.clients.email}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {quote.clients.phone && (
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Phone</p>
                              <a 
                                href={`tel:${quote.clients.phone}`}
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {quote.clients.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {quote.clients.property_address && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Property Address</p>
                            <p className="text-sm text-gray-600">{quote.clients.property_address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quote Items */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Products & Services</h3>
                    
                    <div className="space-y-6">
                      {quoteItems.map((item, index) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-md font-medium text-gray-900">{item.product_name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                            </div>
                            {item.photo_url && (
                              <div className="ml-4 flex-shrink-0">
                                <img 
                                  src={item.photo_url} 
                                  alt={item.product_name}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-900 font-medium">Quantity:</span>
                              <span className="ml-2 font-medium">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-900 font-medium">Unit Price:</span>
                              <span className="ml-2 font-medium">${item.unit_price.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-900 font-medium">Total:</span>
                              <span className="ml-2 font-medium text-gray-900">${item.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-end">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Grand Total</div>
                          <div className="text-2xl font-bold text-gray-900">
                            ${quote.total_amount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
                    </div>
                  )}
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={openEmailModal}
                        disabled={actionLoading === 'email' || !quote?.clients.email}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send via Email
                      </button>
                      {!quote?.clients.email && (
                        <p className="text-xs text-gray-500 text-center mt-1">No email address on file</p>
                      )}

                      <button
                        onClick={openTextModal}
                        disabled={actionLoading === 'text' || !quote?.clients.phone}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send via Text
                      </button>
                      {!quote?.clients.phone && (
                        <p className="text-xs text-gray-500 text-center mt-1">No phone number on file</p>
                      )}

                      <button
                        onClick={() => setConvertModal(true)}
                        disabled={actionLoading === 'convert'}
                        className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Convert to Invoice
                      </button>

                      <button
                        onClick={() => {
                          const previewWindow = window.open(`/preview/quote/${quote.id}`, '_blank')
                          if (!previewWindow) {
                            // Fallback if popup is blocked - copy to clipboard and show message
                            const previewUrl = `${window.location.origin}/preview/quote/${quote.id}`
                            navigator.clipboard.writeText(previewUrl).then(() => {
                              showSuccess('Preview link copied to clipboard! Paste it in a new tab.')
                            }).catch(() => {
                              showInfo(`Preview URL: ${previewUrl}`)
                            })
                          }
                        }}
                        className="w-full flex items-center justify-center px-4 py-3 border border-indigo-300 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview as Client
                      </button>

                      <button
                        onClick={handleDownloadPDF}
                        disabled={actionLoading === 'download'}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading === 'download' ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Downloading...
                          </div>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quote Details */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Quote Number</span>
                        <span className="text-sm text-gray-900">{quote.quote_number}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Total Amount</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${quote.total_amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Status</span>
                        {getStatusBadge(quote.status)}
                      </div>

                      {quote.valid_until && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Valid Until</span>
                          <span className="text-sm text-gray-900">
                            {new Date(quote.valid_until).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Created</span>
                        <span className="text-sm text-gray-900">
                          {new Date(quote.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {emailModal.open && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEmailModal({ open: false })
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Send Quote via Email</h3>
                    <p className="text-sm text-gray-600">Quote {quote?.quote_number}</p>
                  </div>
                </div>
                <button
                  onClick={closeEmailModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Email Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendEmail(); }} className="space-y-6">
                {/* To Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    To <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={emailForm.to}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-3 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="block w-full px-3 py-3 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Quote subject..."
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={10}
                    className="block w-full px-3 py-3 text-lg text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter your message..."
                  />
                </div>

                {/* Attachment Option */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="attachPDF"
                      checked={emailForm.attachPDF}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, attachPDF: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="attachPDF" className="ml-3 flex items-center text-sm text-gray-900">
                      <Paperclip className="h-4 w-4 mr-2 text-gray-400" />
                      Attach quote as PDF
                    </label>
                  </div>
                  {emailForm.attachPDF && (
                    <div className="mt-2 pl-7">
                      <div className="flex items-center text-xs text-gray-500">
                        <FileText className="h-3 w-3 mr-1" />
                        Quote_{quote?.quote_number}.pdf will be attached
                      </div>
                    </div>
                  )}
                </div>

                {/* Quote Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Quote Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs text-blue-800">
                    <div>
                      <span className="font-medium">Quote Number:</span> {quote?.quote_number}
                    </div>
                    <div>
                      <span className="font-medium">Total Amount:</span> ${quote?.total_amount?.toFixed(2) || '0.00'}
                    </div>
                    <div>
                      <span className="font-medium">Items:</span> {quoteItems.length}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {quote?.status}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeEmailModal}
                    disabled={actionLoading === 'email'}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'email' || !emailForm.to || !emailForm.subject || !emailForm.message}
                    className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {actionLoading === 'email' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Text Message Modal */}
      {textModal.open && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTextModal({ open: false })
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Send Quote via Text Message</h3>
                    <p className="text-sm text-gray-600">Quote {quote?.quote_number}</p>
                  </div>
                </div>
                <button
                  onClick={closeTextModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Text Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendText(); }} className="space-y-6">
                {/* To Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    To (Phone Number) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={textForm.to}
                      onChange={(e) => setTextForm(prev => ({ ...prev, to: e.target.value }))}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      required
                      value={textForm.message}
                      onChange={(e) => setTextForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={6}
                      maxLength={160}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none text-gray-900"
                      placeholder="Enter your text message..."
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      {textForm.message.length}/160
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Message includes a link for the client to view and download the quote
                  </p>
                </div>

                {/* Client Approval Link Preview */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Client Approval Link</h4>
                  <div className="text-xs text-green-800 bg-white rounded p-2 border border-green-200 font-mono break-all">
                    {window.location.origin}/client/quote/{quote?.id}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    This link allows your client to review, approve, or reject the quote with digital signature option
                  </p>
                </div>

                {/* Quote Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quote Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-800">
                    <div>
                      <span className="font-medium">Quote Number:</span> {quote?.quote_number}
                    </div>
                    <div>
                      <span className="font-medium">Total Amount:</span> ${quote?.total_amount?.toFixed(2) || '0.00'}
                    </div>
                    <div>
                      <span className="font-medium">Client:</span> {quote?.clients.first_name} {quote?.clients.last_name}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {quote?.status}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeTextModal}
                    disabled={actionLoading === 'text'}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'text' || !textForm.to || !textForm.message}
                    className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {actionLoading === 'text' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Text
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Invoice Modal */}
      {convertModal && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConvertModal(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Convert to Invoice</h3>
                </div>
                <button
                  onClick={() => setConvertModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  This will create a new invoice based on this quote. The quote will be marked as accepted.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Invoice Details</p>
                      <p className="text-sm text-blue-700 mt-1">
                        • Invoice will be created in draft status<br />
                        • Due date: 30 days from today<br />
                        • All quote items will be copied<br />
                        • You can edit the invoice after creation
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setConvertModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={convertToInvoice}
                  disabled={actionLoading === 'convert'}
                  className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {actionLoading === 'convert' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Convert to Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}