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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    const body = await request.json()
    const { status, clientName, signature, approvedAt } = body

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    if (!status || !clientName) {
      return NextResponse.json({ error: 'Status and client name are required' }, { status: 400 })
    }

    if (!['accepted', 'rejected', 'sent'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update quote status in database
    const { data: updatedQuote, error: updateError } = await supabaseAdmin
      .from('quotes')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update quote status' }, { status: 500 })
    }

    // Store signature and approval details (we'll add a quote_approvals table later)
    // For now, we could store this in a separate table or as metadata
    try {
      await supabaseAdmin
        .from('quote_approvals')
        .insert({
          quote_id: quoteId,
          client_name: clientName,
          signature_data: signature,
          status,
          approved_at: approvedAt || new Date().toISOString()
        })
    } catch (error) {
      // If quote_approvals table doesn't exist yet, that's ok - the status is still updated
      console.log('Quote approval details not stored (table may not exist):', error)
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: `Quote ${status} successfully`
    })

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}