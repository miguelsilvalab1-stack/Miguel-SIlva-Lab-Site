/**
 * Stratego.AI — Status do job v2
 * GET /api/orchestrator-v2/status?job_id=xxx
 * Devolve { state, content? } para polling do écran de loading.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(req: NextRequest) {
  const job_id = req.nextUrl.searchParams.get('job_id')

  if (!job_id) {
    return NextResponse.json({ error: 'job_id obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('plans')
    .select('status, content')
    .eq('job_id', job_id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    state: data.status,
    ready: data.status === 'done',
  })
}
