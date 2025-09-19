import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    // Get quote with client and company info using service role (bypasses RLS)
    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from('quotes')
      .select(`
        *,
        clients!inner(first_name, last_name, company_name, phone, email, property_address),
        companies!inner(name, address, website)
      `)
      .eq('id', quoteId)
      .single()

    if (quoteError) {
      console.error('Quote fetch error:', quoteError)
      if (quoteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 })
    }

    // Get quote items
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at')

    if (itemsError) {
      console.error('Quote items fetch error:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch quote items' }, { status: 500 })
    }

    return NextResponse.json({
      quote: quoteData,
      items: itemsData || []
    })

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}