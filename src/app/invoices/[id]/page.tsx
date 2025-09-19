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
  Calendar,
  User,
  DollarSign,
  FileText,
  Phone,
  MapPin,
  Building2,
  X,
  Paperclip,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  CreditCard,
  Camera,
  Upload
} from 'lucide-react'

interface PaymentMethod {
  id: string
  name: string
  type: string
  account_details: any
  is_active: boolean
  is_default: boolean
}

interface Invoice {
  id: string
  invoice_number: string
  title: string
  total_amount: number
  tax_amount: number
  subtotal_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
  paid_date: string | null
  notes: string | null
  payment_terms: string | null
  payment_method_id: string | null
  created_at: string
  payment_methods?: PaymentMethod
  client_id: string
  company_id: string
  job_completed: boolean | null
  job_completed_date: string | null
  completion_photo_url: string | null
  completion_notes: string | null
  clients: {
    first_name: string
    last_name: string
    email: string
    phone: string
    company_name?: string
    property_address?: string
  }
  companies: {
    name: string
    address?: string
    website?: string
  }
}

interface InvoiceItem {
  id: string
  name: string
  description: string | null
  quantity: number
  unit_price: number
  total: number
  photo_url?: string
}

export default function ViewInvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
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
  const [jobCompletionModal, setJobCompletionModal] = useState(false)
  const [jobCompletionForm, setJobCompletionForm] = useState({
    completionDate: new Date().toISOString().split('T')[0],
    notes: '',
    photo: null as File | null
  })
  const [paymentModal, setPaymentModal] = useState(false)
  const { user } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  useEffect(() => {
    if (user && invoiceId) {
      fetchInvoice()
    }
  }, [user, invoiceId])

  useEffect(() => {
    if (emailModal.open && invoice) {
      setEmailForm({
        to: invoice.clients?.email || '',
        subject: `Invoice ${invoice.invoice_number} from ${user?.user_metadata?.company_name || 'Your Company'}`,
        message: `Hello ${invoice.clients?.first_name},\n\nPlease find attached invoice ${invoice.invoice_number} for the amount of $${invoice.total_amount?.toFixed(2)}.\n\nYou can also view your invoice online at: ${window.location.origin}/preview/invoice/${invoice.id}\n\nThank you for your business!\n\nBest regards`,
        attachPDF: true
      })
    }
  }, [emailModal.open, invoice, user])

  useEffect(() => {
    if (textModal.open && invoice) {
      setTextForm({
        to: invoice.clients?.phone || '',
        message: `Hi ${invoice.clients?.first_name}, your invoice ${invoice.invoice_number} for $${invoice.total_amount?.toFixed(2)} is ready. View it here: ${window.location.origin}/preview/invoice/${invoice.id}`
      })
    }
  }, [textModal.open, invoice])

  const fetchInvoice = async () => {
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

      // Get invoice with client and company info
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients!inner(first_name, last_name, email, phone, company_name, property_address),
          companies!inner(name, address, website),
          payment_methods(id, name, type, account_details, is_active, is_default)
        `)
        .eq('id', invoiceId)
        .eq('company_id', company.id)
        .single()

      if (invoiceError) throw invoiceError

      setInvoice(invoiceData)

      // Get invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at')

      if (itemsError) throw itemsError

      setInvoiceItems(itemsData || [])
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

  const handleMarkAsPaid = async () => {
    setPaymentModal(false)
    setActionLoading('paid')
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', invoiceId)

      if (error) throw error

      setInvoice(prev => prev ? { 
        ...prev, 
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      } : null)
      showSuccess('Invoice marked as paid!')
    } catch (error: any) {
      showError('Failed to update invoice status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleJobCompletion = async () => {
    setActionLoading('complete')
    try {
      let completion_photo_url = null

      // Handle photo upload if present
      if (jobCompletionForm.photo) {
        // In a real app, you'd upload to a storage service like Supabase Storage
        // For now, we'll simulate the upload
        const photoData = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(jobCompletionForm.photo!)
        })
        completion_photo_url = `completion_photos/${invoiceId}_${Date.now()}.jpg`
        // In production, you'd actually upload the photoData to storage here
      }

      const { error } = await supabase
        .from('invoices')
        .update({
          job_completed: true,
          job_completed_date: jobCompletionForm.completionDate,
          completion_notes: jobCompletionForm.notes || null,
          completion_photo_url: completion_photo_url
        })
        .eq('id', invoiceId)

      if (error) throw error

      setInvoice(prev => prev ? {
        ...prev,
        job_completed: true,
        job_completed_date: jobCompletionForm.completionDate,
        completion_notes: jobCompletionForm.notes || null,
        completion_photo_url: completion_photo_url
      } : null)

      setJobCompletionModal(false)
      setJobCompletionForm({
        completionDate: new Date().toISOString().split('T')[0],
        notes: '',
        photo: null
      })
      showSuccess('Job marked as completed!')
    } catch (error: any) {
      showError('Failed to mark job as completed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return
    
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
          <h1 style="font-size: 32px; font-weight: bold; color: #111827; margin: 0 0 10px 0;">INVOICE</h1>
          <h2 style="font-size: 20px; color: #4b5563; margin: 0 0 20px 0;">${invoice.invoice_number}</h2>
          <h3 style="font-size: 16px; color: #6b7280; margin: 0 0 20px 0;">${invoice.title}</h3>
          <div style="display: inline-block; padding: 8px 16px; background: ${getStatusColor(invoice.status)}; color: ${getStatusTextColor(invoice.status)}; border-radius: 20px; font-size: 14px; font-weight: 600;">
            ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">From</h3>
            <div style="color: #374151; line-height: 1.6;">
              <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${invoice.companies.name}</div>
              ${invoice.companies.website ? `<div>🌐 ${invoice.companies.website}</div>` : ''}
              ${invoice.companies.address ? `<div style="margin-top: 8px;">📍 ${invoice.companies.address}</div>` : ''}
            </div>
          </div>
          
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Bill To</h3>
            <div style="color: #374151; line-height: 1.6;">
              <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${invoice.clients.first_name} ${invoice.clients.last_name}</div>
              ${invoice.clients.company_name ? `<div style="margin-bottom: 4px;">${invoice.clients.company_name}</div>` : ''}
              ${invoice.clients.email ? `<div>📧 ${invoice.clients.email}</div>` : ''}
              ${invoice.clients.phone ? `<div>📞 ${invoice.clients.phone}</div>` : ''}
              ${invoice.clients.property_address ? `<div style="margin-top: 8px;">📍 ${invoice.clients.property_address}</div>` : ''}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
          <div>
            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">INVOICE NUMBER</div>
            <div style="font-weight: 600; color: #111827;">${invoice.invoice_number}</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">DATE ISSUED</div>
            <div style="color: #111827;">${new Date(invoice.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">DUE DATE</div>
            <div style="color: #111827;">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'No due date'}</div>
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">PAYMENT TERMS</div>
            <div style="color: #111827;">${invoice.payment_terms || 'N/A'}</div>
          </div>
        </div>

        ${invoice.payment_methods ? `
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">💳 Payment Information</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <div style="font-weight: 600; font-size: 16px; color: #111827; margin-bottom: 8px;">${invoice.payment_methods.name}</div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 12px; text-transform: capitalize;">
              Payment Type: <span style="font-weight: 600;">${invoice.payment_methods.type}</span>
            </div>
            ${invoice.payment_methods.account_details ? (() => {
              try {
                const details = typeof invoice.payment_methods.account_details === 'string' 
                  ? JSON.parse(invoice.payment_methods.account_details) 
                  : invoice.payment_methods.account_details;
                return Object.entries(details)
                  .filter(([key, value]) => value)
                  .map(([key, value]) => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px;">
                      <span style="font-weight: 500; color: #374151; text-transform: capitalize;">${key.replace('_', ' ')}:</span>
                      <span style="color: #111827;">${String(value)}</span>
                    </div>
                  `).join('');
              } catch {
                return `<div style="color: #374151; font-size: 14px;">${invoice.payment_methods.account_details}</div>`;
              }
            })() : ''}
          </div>
        </div>
        ` : ''}

        ${invoiceItems.length > 0 ? `
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Items & Services</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Item</th>
                <th style="text-align: left; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Description</th>
                <th style="text-align: center; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Qty</th>
                <th style="text-align: right; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Unit Price</th>
                <th style="text-align: right; padding: 12px 8px; font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems.map((item, index) => `
              <tr style="border-bottom: 1px solid #e5e7eb; ${index % 2 === 0 ? 'background: white;' : 'background: #f9fafb;'}">
                <td style="padding: 12px 8px; font-weight: 600; color: #111827;">${item.name}</td>
                <td style="padding: 12px 8px; color: #374151; max-width: 200px; word-wrap: break-word;">${item.description || ''}</td>
                <td style="padding: 12px 8px; text-align: center; font-weight: 500; color: #111827;">${item.quantity}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 500; color: #111827;">$${item.unit_price.toLocaleString()}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #111827;">$${item.total.toLocaleString()}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); border-radius: 8px; border: 2px solid #e5e7eb;">
            <div style="margin-bottom: 8px;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">SUBTOTAL</div>
              <div style="font-size: 18px; font-weight: 600; color: #111827;">$${invoice.subtotal_amount.toLocaleString()}</div>
            </div>
            ${invoice.tax_amount > 0 ? `
            <div style="margin-bottom: 8px; padding-top: 8px; border-top: 1px solid #d1d5db;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">TAX</div>
              <div style="font-size: 18px; font-weight: 600; color: #111827;">$${invoice.tax_amount.toLocaleString()}</div>
            </div>
            ` : ''}
            <div style="padding-top: 8px; border-top: 2px solid #374151;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">TOTAL AMOUNT</div>
              <div style="font-size: 32px; font-weight: bold; color: #111827;">$${invoice.total_amount.toLocaleString()}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${invoice.notes ? `
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Notes</h3>
          <div style="color: #374151; line-height: 1.6; background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            ${invoice.notes.replace(/\n/g, '<br>')}
          </div>
        </div>
        ` : ''}

        ${(invoice.status === 'paid' && invoice.paid_date) ? `
        <div style="margin-bottom: 40px; padding: 20px; background: #dcfce7; border-radius: 8px; border: 2px solid #bbf7d0;">
          <h3 style="font-size: 18px; font-weight: 600; color: #166534; margin: 0 0 8px 0;">
            ✅ Invoice Paid
          </h3>
          <p style="color: #166534; margin: 0; font-size: 14px;">
            This invoice was paid on ${new Date(invoice.paid_date).toLocaleDateString()}.
          </p>
        </div>
        ` : ''}

        <div style="text-align: center; padding-top: 40px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 4px 0;">This invoice was prepared by <strong>${invoice.companies.name}</strong></p>
          <p style="margin: 0; color: #9ca3af;">
            Invoice #${invoice.invoice_number} • Issued on ${new Date(invoice.created_at).toLocaleDateString()}
            ${invoice.due_date ? ` • Due ${new Date(invoice.due_date).toLocaleDateString()}` : ''}
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
      const fileName = `Invoice-${invoice.invoice_number}-${invoice.clients.first_name}-${invoice.clients.last_name}.pdf`
      pdf.save(fileName)
      
      showSuccess('PDF downloaded successfully!')
      
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      showError('Failed to generate PDF. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading('email')

    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showSuccess(`Invoice ${invoice?.invoice_number} sent successfully to ${emailForm.to}`)
      setEmailModal({ open: false, data: null })
      
      // Reset form
      setEmailForm({
        to: '',
        subject: '',
        message: '',
        attachPDF: true
      })
    } catch (error: any) {
      console.error('Error sending email:', error)
      showError('Failed to send email. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading('text')

    try {
      // Simulate text sending
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showSuccess(`Invoice link sent successfully to ${textForm.to}`)
      setTextModal({ open: false, data: null })
      
      // Reset form
      setTextForm({
        to: '',
        message: ''
      })
    } catch (error: any) {
      console.error('Error sending text:', error)
      showError('Failed to send text message. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#f3f4f6'
      case 'sent': return '#dbeafe'
      case 'paid': return '#dcfce7'
      case 'overdue': return '#fef2f2'
      case 'cancelled': return '#f3f4f6'
      default: return '#f3f4f6'
    }
  }

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'draft': return '#374151'
      case 'sent': return '#1d4ed8'
      case 'paid': return '#166534'
      case 'overdue': return '#991b1b'
      case 'cancelled': return '#374151'
      default: return '#374151'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: <Edit className="h-4 w-4" /> },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent', icon: <Clock className="h-4 w-4" /> },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid', icon: <CheckCircle className="h-4 w-4" /> },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue', icon: <AlertCircle className="h-4 w-4" /> },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: <XCircle className="h-4 w-4" /> }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error || 'Invoice not found'}
              </h2>
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
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
                  <p className="text-gray-600 mt-1">{invoice.title}</p>
                </div>
                {getStatusBadge(invoice.status)}
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href={`/invoices/${invoice.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors hover:text-gray-900"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
                <Link
                  href="/invoices"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Invoices
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
                            <p className="text-sm text-gray-800">
                              {invoice.clients.first_name} {invoice.clients.last_name}
                            </p>
                          </div>
                        </div>
                        
                        {invoice.clients.company_name && (
                          <div className="flex items-center">
                            <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Company</p>
                              <p className="text-sm text-gray-800">{invoice.clients.company_name}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {invoice.clients.email && (
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Email</p>
                              <a 
                                href={`mailto:${invoice.clients.email}`}
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {invoice.clients.email}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {invoice.clients.phone && (
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Phone</p>
                              <a 
                                href={`tel:${invoice.clients.phone}`}
                                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {invoice.clients.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {invoice.clients.property_address && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Property Address</p>
                            <p className="text-sm text-gray-800">{invoice.clients.property_address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Invoice Items */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Items & Services</h3>
                    
                    <div className="space-y-6">
                      {invoiceItems.map((item, index) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-md font-medium text-gray-900">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                              )}
                            </div>
                            {item.photo_url && (
                              <div className="ml-4 flex-shrink-0">
                                <img 
                                  src={item.photo_url} 
                                  alt={item.name}
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

                    {/* Invoice Totals */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Subtotal:</span>
                          <span className="font-medium">${invoice.subtotal_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        {invoice.tax_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Tax:</span>
                            <span className="font-medium">${invoice.tax_amount?.toFixed(2) || '0.00'}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                          <span>Total Amount:</span>
                          <span>${invoice.total_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                    <div className="space-y-3">
                      {!invoice.job_completed && (
                        <button
                          onClick={() => setJobCompletionModal(true)}
                          disabled={actionLoading === 'complete'}
                          className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Job Complete
                        </button>
                      )}

                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => setPaymentModal(true)}
                          disabled={actionLoading === 'paid'}
                          className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </button>
                      )}

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

                      <button
                        onClick={() => setEmailModal({ open: true, data: invoice })}
                        disabled={actionLoading === 'email'}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading === 'email' ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Sending...
                          </div>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send via Email
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setTextModal({ open: true, data: invoice })}
                        disabled={actionLoading === 'text'}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading === 'text' ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Sending...
                          </div>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send via Text
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Invoice Number</span>
                        <span className="text-sm text-gray-900">{invoice.invoice_number}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Total Amount</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${invoice.total_amount?.toFixed(2) || '0.00'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Status</span>
                        {getStatusBadge(invoice.status)}
                      </div>

                      {invoice.due_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Due Date</span>
                          <span className="text-sm text-gray-900">
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {invoice.paid_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Paid Date</span>
                          <span className="text-sm text-green-600">
                            {new Date(invoice.paid_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {invoice.payment_terms && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Payment Terms</span>
                          <span className="text-sm text-gray-900">{invoice.payment_terms}</span>
                        </div>
                      )}

                      {/* Payment Method */}
                      {invoice.payment_methods && (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payment Information
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {invoice.payment_methods.name}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {invoice.payment_methods.account_details && 
                                   typeof invoice.payment_methods.account_details === 'string' ? 
                                   JSON.parse(invoice.payment_methods.account_details).description || 'Payment method available' :
                                   'Payment method available'
                                  }
                                </div>
                                {/* Account Details */}
                                {invoice.payment_methods.account_details && (
                                  <div className="mt-2 space-y-1">
                                    {(() => {
                                      try {
                                        const details = typeof invoice.payment_methods.account_details === 'string' 
                                          ? JSON.parse(invoice.payment_methods.account_details)
                                          : invoice.payment_methods.account_details;
                                        
                                        return Object.entries(details).map(([key, value]) => {
                                          if (key === 'description' || !value) return null;
                                          return (
                                            <div key={key} className="text-xs">
                                              <span className="font-medium text-gray-700 capitalize">
                                                {key.replace('_', ' ')}:
                                              </span>
                                              <span className="text-gray-900 ml-1">{value}</span>
                                            </div>
                                          );
                                        });
                                      } catch {
                                        return null;
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {invoice.payment_methods.type}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Job Completion Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Job Status</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          invoice.job_completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.job_completed ? '✓ Completed' : 'In Progress'}
                        </span>
                      </div>

                      {invoice.job_completed_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Completed Date</span>
                          <span className="text-sm text-green-600">
                            {new Date(invoice.job_completed_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {invoice.completion_notes && (
                        <div className="col-span-2">
                          <span className="text-sm font-medium text-gray-900">Completion Notes</span>
                          <p className="text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded">
                            {invoice.completion_notes}
                          </p>
                        </div>
                      )}

                      {invoice.completion_photo_url && (
                        <div className="col-span-2">
                          <span className="text-sm font-medium text-gray-900">Completion Photo</span>
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <div className="flex items-center text-sm text-blue-600">
                              <Camera className="h-4 w-4 mr-1" />
                              Photo uploaded
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Created</span>
                        <span className="text-sm text-gray-900">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Completion Modal */}
        {jobCompletionModal && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setJobCompletionModal(false)
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
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Mark Job Complete</h3>
                  </div>
                  <button
                    onClick={() => setJobCompletionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      value={jobCompletionForm.completionDate}
                      onChange={(e) => setJobCompletionForm(prev => ({ ...prev, completionDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Notes (Optional)
                    </label>
                    <textarea
                      value={jobCompletionForm.notes}
                      onChange={(e) => setJobCompletionForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any notes about the completed work..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Photo (Optional)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {jobCompletionForm.photo ? (
                            <div className="text-center">
                              <Camera className="h-6 w-6 text-blue-600 mb-2 mx-auto" />
                              <p className="text-sm text-blue-600 font-medium">{jobCompletionForm.photo.name}</p>
                              <p className="text-xs text-gray-600">Click to change</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-gray-400 mb-2 mx-auto" />
                              <p className="text-sm text-gray-600 font-medium">Upload completion photo</p>
                              <p className="text-xs text-gray-600">PNG, JPG up to 10MB</p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setJobCompletionForm(prev => ({ ...prev, photo: e.target.files?.[0] || null }))}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setJobCompletionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJobCompletion}
                    disabled={actionLoading === 'complete' || !jobCompletionForm.completionDate}
                    className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {actionLoading === 'complete' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Job
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModal && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setPaymentModal(false)
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
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Mark as Paid</h3>
                  </div>
                  <button
                    onClick={() => setPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    This will mark the invoice as paid and set the payment date to today.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-900">Payment Confirmation</p>
                        <p className="text-sm text-green-700 mt-1">
                          Invoice #{invoice?.invoice_number}<br />
                          Amount: ${invoice?.total_amount.toFixed(2)}<br />
                          Payment Date: {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={actionLoading === 'paid'}
                    className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {actionLoading === 'paid' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Confirm Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {emailModal.open && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEmailModal({ open: false, data: null })
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
                      <h3 className="text-lg font-semibold text-gray-900">Send Invoice via Email</h3>
                      <p className="text-sm text-gray-700">Send {invoice?.invoice_number} to your client</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailModal({ open: false, data: null })}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSendEmail} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      To Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={emailForm.to}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                      className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder={invoice?.clients?.email || "Enter email address"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder={`Invoice ${invoice?.invoice_number} from ${user?.user_metadata?.company_name || 'Your Company'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={emailForm.message}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                      className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none"
                      placeholder={`Hello ${invoice?.clients?.first_name},\n\nPlease find attached invoice ${invoice?.invoice_number} for the amount of $${invoice?.total_amount?.toFixed(2)}.\n\nThank you for your business!\n\nBest regards`}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="attachPDF"
                      type="checkbox"
                      checked={emailForm.attachPDF}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, attachPDF: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="attachPDF" className="ml-2 block text-sm text-gray-900">
                      Attach PDF invoice
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setEmailModal({ open: false, data: null })}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === 'email'}
                      className="flex-1 px-6 py-3 border border-transparent rounded-xl text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
                setTextModal({ open: false, data: null })
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
                      <h3 className="text-lg font-semibold text-gray-900">Send Invoice via Text</h3>
                      <p className="text-sm text-gray-700">Send {invoice?.invoice_number} link to your client</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTextModal({ open: false, data: null })}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSendText} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={textForm.to}
                      onChange={(e) => setTextForm(prev => ({ ...prev, to: e.target.value }))}
                      className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                      placeholder={invoice?.clients?.phone || "+1 (555) 123-4567"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={textForm.message}
                      onChange={(e) => setTextForm(prev => ({ ...prev, message: e.target.value }))}
                      className="block w-full px-4 py-3 text-base text-gray-900 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none"
                      placeholder={`Hi ${invoice?.clients?.first_name}, your invoice ${invoice?.invoice_number} for $${invoice?.total_amount?.toFixed(2)} is ready. View it here: [link will be added automatically]`}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Text Message Preview</p>
                        <p className="text-sm text-blue-700 mt-1">
                          A secure link to view and pay the invoice will be automatically added to your message.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setTextModal({ open: false, data: null })}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === 'text'}
                      className="flex-1 px-6 py-3 border border-transparent rounded-xl text-base font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
      </div>
    </ProtectedRoute>
  )
}