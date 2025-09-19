'use client'

import { useState, useEffect, useRef } from 'react'
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
  PenTool,
  Check,
  X,
  RotateCcw
} from 'lucide-react'

interface QuoteItem {
  id: string
  product_name: string
  description: string
  quantity: number
  unit_price: number
  total: number
  photo_url?: string
}

interface Quote {
  id: string
  quote_number: string
  title: string
  total_amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  created_at: string
  valid_until: string
  notes?: string
  company_id: string
  client_id: string
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
}

export default function ClientPreviewQuotePage() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signature, setSignature] = useState('')
  const [clientName, setClientName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const params = useParams()
  const quoteId = params.id as string

  useEffect(() => {
    if (quoteId) {
      fetchQuote()
    }
  }, [quoteId])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      
      // Use API route to fetch quote data (bypasses RLS policies)
      const response = await fetch(`/api/preview/quote/${quoteId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Quote not found')
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        return
      }

      setQuote(data.quote)
      setQuoteItems(data.items || [])
    } catch (error: any) {
      console.error('Error fetching quote:', error)
      setError('Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!quote) return
    
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
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    setIsDrawing(true)
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#000000'
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      // Convert canvas to base64 string
      const signatureData = canvas.toDataURL()
      setSignature(signatureData)
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    setSignature('')
  }

  // Quote approval functions
  const handleApproveQuote = async () => {
    if (!clientName.trim()) {
      alert('Please enter your full name before approving.')
      return
    }

    if (!signature) {
      alert('Please provide your signature before approving.')
      return
    }

    await submitQuoteDecision('accepted')
  }

  const handleRejectQuote = async () => {
    if (!clientName.trim()) {
      alert('Please enter your full name before rejecting.')
      return
    }

    await submitQuoteDecision('rejected')
  }

  const submitQuoteDecision = async (status: 'accepted' | 'rejected') => {
    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/preview/quote/${quoteId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          clientName,
          signature: status === 'accepted' ? signature : null,
          approvedAt: new Date().toISOString()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update quote status')
      }

      // Update local state
      if (quote) {
        setQuote({ ...quote, status })
      }

      alert(status === 'accepted' ? 
        'Quote approved successfully! The service provider will be notified.' : 
        'Quote rejected. The service provider will be notified.'
      )
    } catch (error) {
      console.error('Error updating quote:', error)
      alert('Failed to update quote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent', icon: Mail },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    )
  }

  const isExpired = quote?.valid_until ? new Date(quote.valid_until) < new Date() : false

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading quote preview...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Quote not found'}</h2>
            <p className="text-gray-600">The quote you're looking for doesn't exist or may have been removed.</p>
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
              <div className="bg-blue-100 rounded-full p-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{quote.quote_number}</h1>
                  {getStatusBadge(quote.status)}
                </div>
                <p className="text-xl text-gray-600">{quote.title}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Total Amount</div>
              <div className="text-3xl font-bold text-gray-900 flex items-center justify-end">
                <DollarSign className="h-8 w-8 mr-1" />
                {quote.total_amount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Notice */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">Quote Preview</span>
            <span className="text-blue-600 ml-2 text-sm">This is how your quote will appear to the client</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Quote Details & Validity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Quote Information</h3>
                {isExpired && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Expired
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Quote Number</label>
                  <p className="text-lg font-semibold text-gray-900">{quote.quote_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Date Issued</label>
                  <p className="text-gray-900">{new Date(quote.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Valid Until</label>
                  <p className={`flex items-center ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'No expiry'}
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
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{quote.companies.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quote.companies.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-3" />
                        <a href={`mailto:${quote.companies.email}`} className="hover:text-blue-600 transition-colors">
                          {quote.companies.email}
                        </a>
                      </div>
                    )}
                    {quote.companies.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-3" />
                        <a href={`tel:${quote.companies.phone}`} className="hover:text-blue-600 transition-colors">
                          {quote.companies.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  {quote.companies.address && (
                    <div className="flex items-start text-gray-600 mt-3">
                      <MapPin className="h-4 w-4 mr-3 mt-1 flex-shrink-0" />
                      <span>{quote.companies.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Quote For</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 rounded-full p-3">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {quote.clients.first_name} {quote.clients.last_name}
                  </h4>
                  {quote.clients.company_name && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <Building2 className="h-4 w-4 mr-3" />
                      {quote.clients.company_name}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quote.clients.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-3" />
                        <span>{quote.clients.phone}</span>
                      </div>
                    )}
                    {quote.clients.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-3" />
                        <span>{quote.clients.email}</span>
                      </div>
                    )}
                  </div>
                  {quote.clients.property_address && (
                    <div className="flex items-start text-gray-600 mt-3">
                      <MapPin className="h-4 w-4 mr-3 mt-1 flex-shrink-0" />
                      <span>{quote.clients.property_address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quote Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900">Products & Services</h3>
            </div>
            <div className="overflow-hidden">
              {quoteItems.length > 0 ? (
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
                        {quoteItems.map((item, index) => (
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
                  <div className="px-6 py-6 border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex justify-end">
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-2">Grand Total</div>
                        <div className="text-4xl font-bold text-gray-900 flex items-center">
                          <DollarSign className="h-10 w-10 mr-2" />
                          {quote.total_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No items in this quote</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
              </div>
            </div>
          )}

          {/* Client Approval Section */}
          {quote && quote.status === 'sent' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Check className="h-5 w-5 mr-2 text-green-600" />
                  Approve or Reject Quote
                </h3>
                <p className="text-sm text-gray-600 mt-1">Please review the quote details and provide your decision</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Client Name Input */}
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Digital Signature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Digital Signature *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      className="w-full h-32 border border-gray-200 rounded cursor-crosshair bg-gray-50"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <PenTool className="h-4 w-4 mr-2" />
                        Sign above using your mouse or touch
                      </div>
                      <button
                        onClick={clearSignature}
                        type="button"
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleApproveQuote}
                    disabled={submitting || !clientName.trim() || !signature}
                    className="flex-1 inline-flex items-center justify-center px-6 py-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-3" />
                        Approve Quote
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRejectQuote}
                    disabled={submitting || !clientName.trim()}
                    className="flex-1 inline-flex items-center justify-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 mr-3" />
                        Reject Quote
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Display for Approved/Rejected Quotes */}
          {quote && (quote.status === 'accepted' || quote.status === 'rejected') && (
            <div className={`bg-white rounded-xl shadow-sm border-2 ${quote.status === 'accepted' ? 'border-green-200' : 'border-red-200'}`}>
              <div className={`px-6 py-4 ${quote.status === 'accepted' ? 'bg-green-50' : 'bg-red-50'} rounded-t-xl`}>
                <div className="flex items-center">
                  {quote.status === 'accepted' ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 mr-3" />
                  )}
                  <div>
                    <h3 className={`text-lg font-semibold ${quote.status === 'accepted' ? 'text-green-900' : 'text-red-900'}`}>
                      Quote {quote.status === 'accepted' ? 'Approved' : 'Rejected'}
                    </h3>
                    <p className={`text-sm ${quote.status === 'accepted' ? 'text-green-700' : 'text-red-700'}`}>
                      {quote.status === 'accepted' ? 
                        'Thank you for approving this quote. We will contact you soon to schedule the work.' :
                        'This quote has been rejected. Thank you for your consideration.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Download Action */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Quote</h3>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
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
              This quote was prepared by <span className="font-medium">{quote.companies.name}</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Quote #{quote.quote_number} • Issued on {new Date(quote.created_at).toLocaleDateString()}
              {quote.valid_until && (
                <> • Valid until {new Date(quote.valid_until).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}