import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get("year"))
  const month = Number(searchParams.get("month")) // 1-12
  if (!year || !month) return NextResponse.json({ error: "year and month required" }, { status: 400 })

  const { data, error } = await supabase
    .from("attendance")
    .select("employee_id, hours")
    .eq("year", year)
    .eq("month", month)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { employee_id, year, month, hours } = body || {}
  if (!employee_id || !year || !month || typeof hours !== "object") {
    return NextResponse.json({ error: "employee_id, year, month, hours required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("attendance")
    .upsert({ employee_id, year, month, hours }, { onConflict: "employee_id,year,month" })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data?.[0] })
}


