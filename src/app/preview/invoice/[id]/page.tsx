'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { 
  FileText, 
  User, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  CreditCard
} from 'lucide-react'

interface InvoiceItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  total: number
  photo_url?: string
}

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
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  payment_status: 'pending' | 'paid' | 'overdue'
  job_completion_status: 'pending' | 'completed'
  created_at: string
  due_date: string
  notes?: string
  company_id: string
  client_id: string
  payment_method_id?: string
  clients: {
    first_name: string
    last_name: string
    company_name?: string
    phone?: string
    email?: string
    property_address?: string
  }
  companies: {
    name: string
    email?: string
    phone?: string
    address?: string
  }
  payment_methods?: PaymentMethod
}

export default function ClientPreviewInvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const params = useParams()
  const invoiceId = params.id as string

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      
      // Use API route to fetch invoice data (bypasses RLS policies)
      const response = await fetch(`/api/preview/invoice/${invoiceId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Invoice not found')
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        return
      }

      setInvoice(data.invoice)
      setInvoiceItems(data.items || [])
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      setError('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return
    
    try {
      setDownloading(true)
      
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
          <h1 style="font-size: 32px; font-weight: bold; color: #111827; margin: 0 0 10px 0;">${invoice.invoice_number}</h1>
          <h2 style="font-size: 20px; color: #4b5563; margin: 0 0 20px 0;">${invoice.title}</h2>
          <div style="display: inline-block; padding: 8px 16px; background: ${invoice.payment_status === 'paid' ? '#dcfce7' : invoice.payment_status === 'overdue' ? '#fef2f2' : '#dbeafe'}; color: ${invoice.payment_status === 'paid' ? '#166534' : invoice.payment_status === 'overdue' ? '#991b1b' : '#1d4ed8'}; border-radius: 20px; font-size: 14px; font-weight: 600;">
            ${invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Service Provider</h3>
            <div style="color: #374151; line-height: 1.6;">
              <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${invoice.companies.name}</div>
              ${invoice.companies.email ? `<div>📧 ${invoice.companies.email}</div>` : ''}
              ${invoice.companies.phone ? `<div>📞 ${invoice.companies.phone}</div>` : ''}
              ${invoice.companies.address ? `<div style="margin-top: 8px;">📍 ${invoice.companies.address}</div>` : ''}
            </div>
          </div>
          
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Invoice For</h3>
            <div style="color: #374151; line-height: 1.6;">
              <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${invoice.clients.first_name} ${invoice.clients.last_name}</div>
              ${invoice.clients.company_name ? `<div style="margin-bottom: 4px;">${invoice.clients.company_name}</div>` : ''}
              ${invoice.clients.email ? `<div>📧 ${invoice.clients.email}</div>` : ''}
              ${invoice.clients.phone ? `<div>📞 ${invoice.clients.phone}</div>` : ''}
              ${invoice.clients.property_address ? `<div style="margin-top: 8px;">📍 ${invoice.clients.property_address}</div>` : ''}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
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
            <div style="color: #111827;">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt'}</div>
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
              ${invoiceItems.map((item, index) => `
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
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">TOTAL AMOUNT DUE</div>
            <div style="font-size: 32px; font-weight: bold; color: #111827;">$${invoice.total_amount.toLocaleString()}</div>
          </div>
        </div>
        ` : ''}

        ${invoice.notes ? `
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Additional Notes</h3>
          <div style="color: #374151; line-height: 1.6; background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            ${invoice.notes.replace(/\n/g, '<br>')}
          </div>
        </div>
        ` : ''}

        ${invoice.payment_status === 'paid' ? `
        <div style="margin-bottom: 40px; padding: 20px; background: #dcfce7; border-radius: 8px; border: 2px solid #bbf7d0;">
          <h3 style="font-size: 18px; font-weight: 600; color: #166534; margin: 0 0 8px 0;">
            ✅ Invoice Paid
          </h3>
          <p style="color: #166534; margin: 0; font-size: 14px;">
            This invoice has been paid in full. Thank you for your business!
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
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const getStatusBadge = (paymentStatus: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid', icon: CheckCircle },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue', icon: XCircle }
    }
    
    const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    )
  }

  const isOverdue = invoice?.due_date ? new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid' : false

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading invoice preview...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Invoice not found'}</h2>
            <p className="text-gray-600">The invoice you're looking for doesn't exist or may have been removed.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 rounded-full p-4">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
                  {getStatusBadge(invoice.payment_status)}
                </div>
                <p className="text-xl text-gray-600">{invoice.title}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Amount Due</div>
              <div className="text-3xl font-bold text-gray-900 flex items-center justify-end">
                <DollarSign className="h-8 w-8 mr-1" />
                {invoice.total_amount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Notice */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">Invoice Preview</span>
            <span className="text-green-600 ml-2 text-sm">This is how your invoice appears to the client</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Invoice Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Invoice Information</h3>
                {isOverdue && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Overdue
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Invoice Number</label>
                  <p className="text-lg font-semibold text-gray-900">{invoice.invoice_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Date Issued</label>
                  <p className="text-gray-900">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Due Date</label>
                  <p className={`flex items-center ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon receipt'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Provider Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Service Provider</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{invoice.companies.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invoice.companies.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-3" />
                        <a href={`mailto:${invoice.companies.email}`} className="hover:text-blue-600 transition-colors">
                          {invoice.companies.email}
                        </a>
                      </div>
                    )}
                    {invoice.companies.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-3" />
                        <a href={`tel:${invoice.companies.phone}`} className="hover:text-blue-600 transition-colors">
                          {invoice.companies.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  {invoice.companies.address && (
                    <div className="flex items-start text-gray-600 mt-3">
                      <MapPin className="h-4 w-4 mr-3 mt-1 flex-shrink-0" />
                      <span>{invoice.companies.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Bill To</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 rounded-full p-3">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {invoice.clients.first_name} {invoice.clients.last_name}
                  </h4>
                  {invoice.clients.company_name && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <Building2 className="h-4 w-4 mr-3" />
                      {invoice.clients.company_name}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invoice.clients.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-3" />
                        <span>{invoice.clients.phone}</span>
                      </div>
                    )}
                    {invoice.clients.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-3" />
                        <span>{invoice.clients.email}</span>
                      </div>
                    )}
                  </div>
                  {invoice.clients.property_address && (
                    <div className="flex items-start text-gray-600 mt-3">
                      <MapPin className="h-4 w-4 mr-3 mt-1 flex-shrink-0" />
                      <span>{invoice.clients.property_address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {invoice.payment_methods && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{invoice.payment_methods.name}</h4>
                    <div className="text-sm text-gray-600 mb-3 capitalize">
                      Payment Type: <span className="font-medium">{invoice.payment_methods.type}</span>
                    </div>
                    {invoice.payment_methods.account_details && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Account Details:</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                          {typeof invoice.payment_methods.account_details === 'string' ? (
                            (() => {
                              try {
                                const details = JSON.parse(invoice.payment_methods.account_details);
                                return Object.entries(details).map(([key, value]) => (
                                  value && (
                                    <div key={key} className="flex justify-between">
                                      <span className="capitalize font-medium">{key.replace('_', ' ')}:</span>
                                      <span>{String(value)}</span>
                                    </div>
                                  )
                                ));
                              } catch {
                                return <div>{invoice.payment_methods.account_details}</div>;
                              }
                            })()
                          ) : (
                            Object.entries(invoice.payment_methods.account_details).map(([key, value]) => (
                              value && (
                                <div key={key} className="flex justify-between">
                                  <span className="capitalize font-medium">{key.replace('_', ' ')}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              )
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Products & Services</h3>
            </div>
            <div className="overflow-hidden">
              {invoiceItems.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product/Service
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Photo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoiceItems.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{item.product_name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-gray-600 max-w-xs">{item.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 font-medium">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                              ${item.unit_price.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                              ${item.total.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.photo_url ? (
                                <img 
                                  src={item.photo_url} 
                                  alt={item.product_name}
                                  className="h-16 w-16 rounded-lg object-cover border border-gray-300 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                  onClick={() => window.open(item.photo_url, '_blank')}
                                />
                              ) : (
                                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-6 border-t-2 border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                    <div className="flex justify-end">
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-2">Total Amount Due</div>
                        <div className="text-4xl font-bold text-gray-900 flex items-center">
                          <DollarSign className="h-10 w-10 mr-2" />
                          {invoice.total_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No items in this invoice</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Payment Status Display */}
          {invoice.payment_status === 'paid' && (
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200">
              <div className="px-6 py-4 bg-green-50 rounded-t-xl">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Invoice Paid</h3>
                    <p className="text-sm text-green-700">
                      This invoice has been paid in full. Thank you for your business!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Download Action */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Invoice</h3>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-3" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              This invoice was prepared by <span className="font-medium">{invoice.companies.name}</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Invoice #{invoice.invoice_number} • Issued on {new Date(invoice.created_at).toLocaleDateString()}
              {invoice.due_date && (
                <> • Due {new Date(invoice.due_date).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}