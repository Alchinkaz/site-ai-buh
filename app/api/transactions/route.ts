import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as 'income' | 'expense' | null
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)
  const offset = Number(searchParams.get('offset') ?? 0)
  const sortBy = searchParams.get('sortBy') || 'occurred_at'
  const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const q = searchParams.get('q')

  let query = supabase.from('transactions').select('*', { count: 'exact' }).order(sortBy, { ascending: sortDir === 'asc' })
  if (type) {
    query = query.eq('type', type)
  }
  if (from) {
    query = query.gte('occurred_at', from)
  }
  if (to) {
    query = query.lte('occurred_at', to)
  }
  if (q && q.trim()) {
    const like = `%${q.trim()}%`
    query = query.or(
      [
        `description.ilike.${like}`,
        `method.ilike.${like}`,
        `currency.ilike.${like}`,
      ].join(',')
    )
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


