import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as 'income' | 'expense' | null
  const limit = Number(searchParams.get('limit') ?? 50)
  const offset = Number(searchParams.get('offset') ?? 0)

  let query = supabase.from('transactions').select('*', { count: 'exact' }).order('occurred_at', { ascending: false })
  if (type) {
    query = query.eq('type', type)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('transactions').insert(body).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...update } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { data, error } = await supabase.from('transactions').update(update).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabase.from('transactions').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}


