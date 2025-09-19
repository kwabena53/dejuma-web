import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        clients (
          first_name,
          last_name,
          company_name,
          phone,
          email,
          property_address
        ),
        companies (
          name,
          email,
          phone,
          address
        ),
        payment_methods (
          id,
          name,
          type,
          account_details,
          is_active,
          is_default
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError)
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch invoice items' }, { status: 500 })
    }

    return NextResponse.json({
      invoice,
      items: items || []
    })

  } catch (error) {
    console.error('Error in invoice preview API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}