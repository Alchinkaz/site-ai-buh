import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = 'nodejs'

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get("year"))
  const month = Number(searchParams.get("month")) // 1-12
  if (!year || !month) return NextResponse.json({ error: "year and month required" }, { status: 400 })

  const supabase = getServerSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase env is not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from("attendance")
    .select("employee_id, hours")
    .eq("year", year)
    .eq("month", month)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: meta } = await supabase
    .from('attendance_meta')
    .select('non_working_days')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  return NextResponse.json({ data, meta: meta?.non_working_days || [] })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { employee_id, year, month, hours, non_working_days } = body || {}

  const supabase = getServerSupabase()
  if (!supabase) return NextResponse.json({ error: 'Supabase env is not configured' }, { status: 500 })

  if (Array.isArray(non_working_days)) {
    await supabase
      .from('attendance_meta')
      .upsert({ year, month, non_working_days }, { onConflict: 'year,month' })
  }

  if (employee_id && typeof hours === 'object') {
    const { data, error } = await supabase
      .from("attendance")
      .upsert({ employee_id, year, month, hours }, { onConflict: "employee_id,year,month" })
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data?.[0] })
  }

  return NextResponse.json({ ok: true })
}


