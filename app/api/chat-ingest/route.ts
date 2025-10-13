import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const message_text: string = body?.message_text
  if (!message_text) return NextResponse.json({ error: 'message_text is required' }, { status: 400 })
  const { data, error } = await supabase.from('chat_ingest_queue').insert({ message_text, status: 'pending' }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}


